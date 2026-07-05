/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// HMAC secret for stateless JWT-like token signing
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'college-portal-super-secret-key-2026';

// Interfaces for our simple database
interface UserDb {
  username: string;
  passwordHash: string;
  role: string;
  department?: string;
  rollNumber?: string;
}

interface EventActivity {
  id: string;
  actorName: string;
  actorRole: string;
  action: 'APPROVE' | 'REJECT';
  remarks?: string;
  timestamp: string;
}

interface EventDb {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  status: 'PENDING_DEPT_STAFF' | 'PENDING_DEAN' | 'PENDING_PRINCIPAL' | 'APPROVED' | 'REJECTED';
  created_by: string;
  created_by_roll?: string;
  department: string;
  createdAt: string;
  activities: EventActivity[];
}

interface ComplaintMessage {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

interface ComplaintDb {
  id: string;
  title: string;
  category: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  raised_by: string;
  raised_by_roll?: string;
  department: string;
  createdAt: string;
  messages: ComplaintMessage[];
}

interface DatabaseSchema {
  users: UserDb[];
  events: EventDb[];
  complaints: ComplaintDb[];
}

// In-memory cache + file sync helper
let db: DatabaseSchema = {
  users: [],
  events: [],
  complaints: []
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate secure stateless user session token
function generateToken(user: { username: string; role: string; department?: string }): string {
  const payloadStr = JSON.stringify({
    username: user.username,
    role: user.role,
    department: user.department,
    createdAt: new Date().toISOString()
  });
  const payloadB64 = Buffer.from(payloadStr).toString('base64');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

// Verify session token
function verifyToken(token: string): { username: string; role: string; department?: string } | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadB64).digest('hex');
    if (signature !== expectedSignature) return null;
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

// Load database or initialize with pre-seeded data
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(content);
      // Fallbacks
      if (!db.users) db.users = [];
      if (!db.events) db.events = [];
      if (!db.complaints) db.complaints = [];
      
      // Inject admin@clg if not exists
      const hasAdmin = db.users.some(u => u.username.toLowerCase() === 'admin@clg');
      if (!hasAdmin) {
        db.users.push({
          username: 'admin@clg',
          passwordHash: hashPassword('admin@123'),
          role: 'Software Admin'
        });
        saveDb();
      }
      
      console.log(`Loaded ${db.users.length} users, ${db.events.length} events, and ${db.complaints.length} complaints.`);
    } else {
      initializeWithSeeds();
    }
  } catch (err) {
    console.error('Error loading database, reinitializing...', err);
    initializeWithSeeds();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save database to file:', err);
  }
}

function initializeWithSeeds() {
  const defaultPasswordHash = hashPassword('password');
  const adminPasswordHash = hashPassword('admin@123');
  
  db = {
    users: [
      {
        username: 'admin@clg',
        passwordHash: adminPasswordHash,
        role: 'Software Admin'
      },
      {
        username: 'student',
        passwordHash: defaultPasswordHash,
        role: 'Student',
        department: 'Computer Science & Engineering',
        rollNumber: '22CSE045'
      },
      {
        username: 'staff',
        passwordHash: defaultPasswordHash,
        role: 'Dept Staff',
        department: 'Computer Science & Engineering'
      },
      {
        username: 'hod',
        passwordHash: defaultPasswordHash,
        role: 'HOD',
        department: 'Computer Science & Engineering'
      },
      {
        username: 'dean',
        passwordHash: defaultPasswordHash,
        role: 'Dean'
      },
      {
        username: 'principal',
        passwordHash: defaultPasswordHash,
        role: 'Principal'
      }
    ],
    events: [
      {
        id: 'evt-1',
        title: 'National Hackathon 2026',
        description: 'An all-India 24-hour student hackathon focusing on AI and Sustainability solutions.',
        venue: 'Main Auditorium & CS Labs',
        date: '2026-08-15',
        status: 'PENDING_DEPT_STAFF',
        created_by: 'student',
        created_by_roll: '22CSE045',
        department: 'Computer Science & Engineering',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        activities: []
      },
      {
        id: 'evt-2',
        title: 'Industrial Visit to Google Office',
        description: 'A career guidance industrial visit for final year engineering students.',
        venue: 'Google Hyderabad Campus',
        date: '2026-09-10',
        status: 'PENDING_DEAN',
        created_by: 'student',
        created_by_roll: '22CSE045',
        department: 'Computer Science & Engineering',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        activities: [
          {
            id: 'act-1',
            actorName: 'staff',
            actorRole: 'Dept Staff',
            action: 'APPROVE',
            remarks: 'The syllabus aligns well with this industrial visit. Recommended.',
            timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
          }
        ]
      }
    ],
    complaints: [
      {
        id: 'comp-1',
        title: 'Slow WiFi Connection in Hostels',
        category: 'Infrastructure',
        description: 'The WiFi bandwidth is extremely low during peak hours (8:00 PM - 11:00 PM), making it impossible to access online study materials.',
        status: 'OPEN',
        raised_by: 'student',
        raised_by_roll: '22CSE045',
        department: 'Computer Science & Engineering',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        messages: []
      }
    ]
  };
  saveDb();
  console.log('Database initialized with pre-seeded data.');
}

// Load initial database
loadDb();

// Request Auth Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No session token provided.' });
  }
  const token = authHeader.substring(7);
  const sessionUser = verifyToken(token);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
  
  // Locate actual user in database just to be secure
  const realUser = db.users.find(u => u.username === sessionUser.username);
  if (!realUser) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }
  
  req.user = {
    username: realUser.username,
    role: realUser.role,
    department: realUser.department,
    rollNumber: realUser.rollNumber
  };
  next();
}

// API Routes

// Registration & Login
app.post('/api/register', (req, res) => {
  const { username, password, role, department, rollNumber } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required fields.' });
  }

  const normalizedUsername = username.trim();
  
  // Mandatory department check for Student, Dept Staff, HOD (Algorithm 1, step 3)
  if (['Student', 'Dept Staff', 'HOD'].includes(role)) {
    if (!department) {
      return res.status(400).json({ error: 'Department selection is mandatory for this role.' });
    }
  }

  // Roll number is mandatory for students
  if (role === 'Student' && !rollNumber) {
    return res.status(400).json({ error: 'Roll number is mandatory for students.' });
  }

  // Check username uniqueness
  const exists = db.users.some(u => u.username.toLowerCase() === normalizedUsername.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  // Hash password & save user record
  const passwordHash = hashPassword(password);
  const newUser: UserDb = {
    username: normalizedUsername,
    passwordHash,
    role,
    department: ['Student', 'Dept Staff', 'HOD'].includes(role) ? department : undefined,
    rollNumber: role === 'Student' ? rollNumber.trim() : undefined
  };

  db.users.push(newUser);
  saveDb();

  // Create session token & auto-login
  const token = generateToken(newUser);
  res.status(201).json({
    user: {
      username: newUser.username,
      role: newUser.role,
      department: newUser.department,
      rollNumber: newUser.rollNumber
    },
    token
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. User does not exist.' });
  }

  const expectedHash = hashPassword(password);
  if (user.passwordHash !== expectedHash) {
    return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
  }

  const token = generateToken(user);
  res.json({
    user: {
      username: user.username,
      role: user.role,
      department: user.department,
      rollNumber: user.rollNumber
    },
    token
  });
});

app.get('/api/me', authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// Event Operations

// Get all events visible to user based on role
app.get('/api/events', authenticate, (req: any, res) => {
  const { role, department } = req.user;
  
  // Filter events based on role
  // Students see their own events
  // Dept staff see events pending department staff approval in their department
  // HOD sees events in their department
  // Dean & Principal see college-wide events
  let filteredEvents = db.events;
  
  if (role === 'Student') {
    // Show student's own events
    filteredEvents = db.events.filter(e => e.created_by === req.user.username);
  } else if (role === 'Dept Staff') {
    // Show events belonging to their department that require department staff attention,
    // plus historical events in their department for reference
    filteredEvents = db.events.filter(e => e.department === department);
  } else if (role === 'HOD') {
    // HOD sees all events within their department
    filteredEvents = db.events.filter(e => e.department === department);
  }
  // Dean and Principal see all events (college-wide)

  res.json(filteredEvents);
});

// Create event (restricted to Students)
app.post('/api/events', authenticate, (req: any, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Access denied. Only students can create event proposals.' });
  }

  const { title, description, venue, date } = req.body;
  if (!title || !description || !venue || !date) {
    return res.status(400).json({ error: 'Title, description, venue, and date are required.' });
  }

  const newEvent: EventDb = {
    id: 'evt-' + Math.random().toString(36).substring(2, 9),
    title,
    description,
    venue,
    date,
    status: 'PENDING_DEPT_STAFF',
    created_by: req.user.username,
    created_by_roll: req.user.rollNumber,
    department: req.user.department!,
    createdAt: new Date().toISOString(),
    activities: []
  };

  db.events.push(newEvent);
  saveDb();
  res.status(201).json(newEvent);
});

// Perform approval actions with multi-level checks
app.post('/api/events/:id/action', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body; // action: 'APPROVE' | 'REJECT'
  
  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be either APPROVE or REJECT.' });
  }

  const eventIndex = db.events.findIndex(e => e.id === id);
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const event = db.events[eventIndex];
  const user = req.user;

  // Let's implement Algorithm 2, Step 9 (Access-control check):
  // "actor's role must match the role required at the event's current status, and
  // — only for the Dept Staff stage — actor's department must equal the event's department. Fails -> 403 Forbidden"
  
  let allowed = false;
  let nextStatus: 'PENDING_DEPT_STAFF' | 'PENDING_DEAN' | 'PENDING_PRINCIPAL' | 'APPROVED' | 'REJECTED' = event.status;

  if (event.status === 'PENDING_DEPT_STAFF') {
    if (user.role === 'Dept Staff' && user.department === event.department) {
      allowed = true;
      nextStatus = action === 'APPROVE' ? 'PENDING_DEAN' : 'REJECTED';
    }
  } else if (event.status === 'PENDING_DEAN') {
    if (user.role === 'Dean') {
      allowed = true;
      nextStatus = action === 'APPROVE' ? 'PENDING_PRINCIPAL' : 'REJECTED';
    }
  } else if (event.status === 'PENDING_PRINCIPAL') {
    if (user.role === 'Principal') {
      allowed = true;
      nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    }
  }

  if (!allowed) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to act on this event at its current stage.' });
  }

  // Create action activity log
  const activity: EventActivity = {
    id: 'act-' + Math.random().toString(36).substring(2, 9),
    actorName: user.username,
    actorRole: user.role,
    action,
    remarks: remarks || undefined,
    timestamp: new Date().toISOString()
  };

  // Update Event
  event.status = nextStatus;
  event.activities.push(activity);
  
  db.events[eventIndex] = event;
  saveDb();

  res.json(event);
});


// Complaint Operations

// Get all complaints visible to the user
app.get('/api/complaints', authenticate, (req: any, res) => {
  const { role, department } = req.user;
  
  // Students see complaints they raised
  // HOD sees complaints raised in their department (simultaneous routing)
  // Dean sees all complaints college-wide (simultaneous routing)
  // Principal and Dept Staff can see for general monitoring, let's allow it or restrict as appropriate.
  // Standard dual routing: visible to student, department HOD, and Dean
  let filteredComplaints = db.complaints;

  if (role === 'Student') {
    filteredComplaints = db.complaints.filter(c => c.raised_by === req.user.username);
  } else if (role === 'HOD') {
    filteredComplaints = db.complaints.filter(c => c.department === department);
  } else if (role === 'Dean') {
    // Dean sees all complaints college-wide
    filteredComplaints = db.complaints;
  } else if (role === 'Principal') {
    // Let Principal see all too for portal overview
    filteredComplaints = db.complaints;
  } else {
    // Dept Staff see complaints in their department
    filteredComplaints = db.complaints.filter(c => c.department === department);
  }

  res.json(filteredComplaints);
});

// Raise complaint (restricted to Students)
app.post('/api/complaints', authenticate, (req: any, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Access denied. Only students can submit complaints.' });
  }

  const { title, category, description } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, category, and description are required.' });
  }

  const newComplaint: ComplaintDb = {
    id: 'comp-' + Math.random().toString(36).substring(2, 9),
    title,
    category,
    description,
    status: 'OPEN',
    raised_by: req.user.username,
    raised_by_roll: req.user.rollNumber,
    department: req.user.department!,
    createdAt: new Date().toISOString(),
    messages: []
  };

  db.complaints.push(newComplaint);
  saveDb();
  res.status(201).json(newComplaint);
});

// Respond to complaint and update status
app.post('/api/complaints/:id/respond', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { message, status } = req.body; // status (optional): 'IN_REVIEW' | 'RESOLVED'
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Response message cannot be empty.' });
  }

  const complaintIndex = db.complaints.findIndex(c => c.id === id);
  if (complaintIndex === -1) {
    return res.status(404).json({ error: 'Complaint not found.' });
  }

  const complaint = db.complaints[complaintIndex];
  const user = req.user;

  // Let's enforce access check.
  // Only HOD of that department and Dean can respond (students are forbidden).
  const isHod = user.role === 'HOD' && user.department === complaint.department;
  const isDean = user.role === 'Dean';

  if (!isHod && !isDean) {
    return res.status(403).json({ error: 'Access denied. Only higher authorities (HOD or Dean) can respond to grievances.' });
  }

  // Create message
  const newMessage: ComplaintMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 9),
    senderName: user.username,
    senderRole: user.role,
    message: message.trim(),
    timestamp: new Date().toISOString()
  };

  complaint.messages.push(newMessage);

  // If status is provided, update it. (HOD/Dean can update)
  if (status && ['OPEN', 'IN_REVIEW', 'RESOLVED'].includes(status)) {
    if (isHod || isDean) {
      complaint.status = status;
    }
  } else if (complaint.status === 'OPEN') {
    // If HOD or Dean responds, automatically move it to 'IN_REVIEW'
    complaint.status = 'IN_REVIEW';
  }

  db.complaints[complaintIndex] = complaint;
  saveDb();

  res.json(complaint);
});

// Software Admin Privilege Management routes
app.get('/api/admin/users', authenticate, (req: any, res) => {
  if (req.user.role !== 'Software Admin') {
    return res.status(403).json({ error: 'Access denied. Software Admin privilege required.' });
  }
  const users = db.users.map(u => ({
    username: u.username,
    role: u.role,
    department: u.department,
    rollNumber: u.rollNumber
  }));
  res.json(users);
});

app.put('/api/admin/users/:username', authenticate, (req: any, res) => {
  if (req.user.role !== 'Software Admin') {
    return res.status(403).json({ error: 'Access denied. Software Admin privilege required.' });
  }
  const { username } = req.params;
  const { role, department, rollNumber } = req.body;

  const userIndex = db.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const targetUser = db.users[userIndex];

  // Prevent lockout/demoting Software Admin account
  if (targetUser.username.toLowerCase() === 'admin@clg' && role !== 'Software Admin') {
    return res.status(400).json({ error: 'Cannot change the privileges of the main Software Admin.' });
  }

  // Validate properties
  if (!role) {
    return res.status(400).json({ error: 'Role is a required field.' });
  }

  if (['Student', 'Dept Staff', 'HOD'].includes(role) && !department) {
    return res.status(400).json({ error: 'Department selection is mandatory for this role.' });
  }

  if (role === 'Student' && !rollNumber) {
    return res.status(400).json({ error: 'Roll number is mandatory for students.' });
  }

  targetUser.role = role;
  targetUser.department = ['Student', 'Dept Staff', 'HOD'].includes(role) ? department : undefined;
  targetUser.rollNumber = role === 'Student' ? rollNumber : undefined;

  db.users[userIndex] = targetUser;
  saveDb();

  res.json({
    username: targetUser.username,
    role: targetUser.role,
    department: targetUser.department,
    rollNumber: targetUser.rollNumber
  });
});

// Admin Route to Reset DB (useful for testers to restore clean states)
app.post('/api/reset', (req, res) => {
  initializeWithSeeds();
  res.json({ message: 'Database successfully re-seeded to initial state.', users: db.users.map(u => ({ username: u.username, role: u.role, department: u.department })) });
});


// Setup Vite or Static File serving based on node environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`Server running on http://${displayHost}:${PORT}`);
  });
}

startServer();
