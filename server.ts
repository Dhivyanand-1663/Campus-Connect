/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { pool, initPostgresDb } from './db';

dotenv.config();

const getDirname = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // Fallback for CommonJS bundle environments
  }
  return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
};

const __dirname = getDirname();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());

// HMAC secret for stateless JWT-like token signing
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'college-portal-super-secret-key-2026';

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

// Initialize PostgreSQL tables & seed data
initPostgresDb();

// Request Auth Middleware
async function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No session token provided.' });
  }
  const token = authHeader.substring(7);
  const sessionUser = verifyToken(token);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
  
  try {
    const userRes = await pool.query(
      'SELECT username, role, department, roll_number as "rollNumber" FROM users WHERE LOWER(username) = LOWER($1)',
      [sessionUser.username]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Authentication internal error.' });
  }
}

// API Routes

// Registration & Login
app.post('/api/register', async (req, res) => {
  const { username, password, role, department, rollNumber } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required fields.' });
  }

  const normalizedUsername = username.trim();
  
  if (['Student', 'Dept Staff', 'HOD'].includes(role)) {
    if (!department) {
      return res.status(400).json({ error: 'Department selection is mandatory for this role.' });
    }
  }

  if (role === 'Student' && !rollNumber) {
    return res.status(400).json({ error: 'Roll number is mandatory for students.' });
  }

  try {
    const existing = await pool.query('SELECT username FROM users WHERE LOWER(username) = LOWER($1)', [normalizedUsername]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const passwordHash = hashPassword(password);
    const deptVal = ['Student', 'Dept Staff', 'HOD'].includes(role) ? department : null;
    const rollVal = role === 'Student' ? rollNumber.trim() : null;

    await pool.query(
      'INSERT INTO users (username, password_hash, role, department, roll_number) VALUES ($1, $2, $3, $4, $5)',
      [normalizedUsername, passwordHash, role, deptVal, rollVal]
    );

    const newUser = {
      username: normalizedUsername,
      role,
      department: deptVal || undefined,
      rollNumber: rollVal || undefined
    };

    const token = generateToken(newUser);
    res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Database registration error.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const userRes = await pool.query(
      'SELECT username, password_hash as "passwordHash", role, department, roll_number as "rollNumber" FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User does not exist.' });
    }

    const user = userRes.rows[0];
    const expectedHash = hashPassword(password);
    if (user.passwordHash !== expectedHash) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const userObj = {
      username: user.username,
      role: user.role,
      department: user.department || undefined,
      rollNumber: user.rollNumber || undefined
    };

    const token = generateToken(userObj);
    res.json({ user: userObj, token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Database login error.' });
  }
});

app.get('/api/me', authenticate, (req: any, res) => {
  res.json({ user: req.user });
});

// Event Operations

// Get all events visible to user based on role
app.get('/api/events', authenticate, async (req: any, res) => {
  const { username, role, department } = req.user;
  
  try {
    let query = `
      SELECT id, title, description, venue, date, status, 
             created_by, created_by_roll, department, created_at as "createdAt"
      FROM events
    `;
    const params: any[] = [];

    if (role === 'Student') {
      query += ' WHERE created_by = $1';
      params.push(username);
    } else if (role === 'Dept Staff' || role === 'HOD') {
      query += ' WHERE department = $1';
      params.push(department);
    }
    
    query += ' ORDER BY created_at DESC';

    const eventsRes = await pool.query(query, params);
    const events = eventsRes.rows;

    // Fetch activities for these events
    for (const evt of events) {
      const actRes = await pool.query(
        `SELECT id, actor_name as "actorName", actor_role as "actorRole", 
                action, remarks, timestamp 
         FROM event_activities 
         WHERE event_id = $1 
         ORDER BY timestamp ASC`,
        [evt.id]
      );
      evt.activities = actRes.rows;
    }

    res.json(events);
  } catch (err) {
    console.error('Fetch Events Error:', err);
    res.status(500).json({ error: 'Database error fetching events.' });
  }
});

// Create event (restricted to Students)
app.post('/api/events', authenticate, async (req: any, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Access denied. Only students can create event proposals.' });
  }

  const { title, description, venue, date } = req.body;
  if (!title || !description || !venue || !date) {
    return res.status(400).json({ error: 'Title, description, venue, and date are required.' });
  }

  const eventId = 'evt-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO events (id, title, description, venue, date, status, created_by, created_by_roll, department, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [eventId, title, description, venue, date, 'PENDING_DEPT_STAFF', req.user.username, req.user.rollNumber || null, req.user.department, now]
    );

    const newEvent = {
      id: eventId,
      title,
      description,
      venue,
      date,
      status: 'PENDING_DEPT_STAFF',
      created_by: req.user.username,
      created_by_roll: req.user.rollNumber,
      department: req.user.department,
      createdAt: now,
      activities: []
    };

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Create Event Error:', err);
    res.status(500).json({ error: 'Failed to create event in database.' });
  }
});

// Perform approval actions with multi-level checks
app.post('/api/events/:id/action', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body;
  
  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Action must be either APPROVE or REJECT.' });
  }

  try {
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRes.rows[0];
    const user = req.user;

    let allowed = false;
    let nextStatus = event.status;

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
        nextStatus = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
      }
    }

    if (!allowed) {
      return res.status(403).json({ error: 'Access denied. You do not have permission to act on this event at its current stage.' });
    }

    const actId = 'act-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO event_activities (id, event_id, actor_name, actor_role, action, remarks, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [actId, id, user.username, user.role, action, remarks || null, now]
    );

    await pool.query('UPDATE events SET status = $1 WHERE id = $2', [nextStatus, id]);

    // Fetch updated event with all activities
    const updatedEvtRes = await pool.query(
      `SELECT id, title, description, venue, date, status, 
              created_by, created_by_roll, department, created_at as "createdAt" 
       FROM events WHERE id = $1`, 
      [id]
    );
    const updatedEvt = updatedEvtRes.rows[0];

    const actRes = await pool.query(
      `SELECT id, actor_name as "actorName", actor_role as "actorRole", 
              action, remarks, timestamp 
       FROM event_activities 
       WHERE event_id = $1 
       ORDER BY timestamp ASC`,
      [id]
    );
    updatedEvt.activities = actRes.rows;

    res.json(updatedEvt);
  } catch (err) {
    console.error('Event Action Error:', err);
    res.status(500).json({ error: 'Database action failure.' });
  }
});


// Complaint Operations

// Get all complaints visible to the user
app.get('/api/complaints', authenticate, async (req: any, res) => {
  const { username, role, department } = req.user;
  
  try {
    let query = `
      SELECT id, title, category, description, status, 
             raised_by, raised_by_roll, department, created_at as "createdAt"
      FROM complaints
    `;
    const params: any[] = [];

    if (role === 'Student') {
      query += ' WHERE raised_by = $1';
      params.push(username);
    } else if (role === 'HOD' || role === 'Dept Staff') {
      query += ' WHERE department = $1';
      params.push(department);
    }

    query += ' ORDER BY created_at DESC';

    const complaintsRes = await pool.query(query, params);
    const complaints = complaintsRes.rows;

    for (const comp of complaints) {
      const msgRes = await pool.query(
        `SELECT id, sender_name as "senderName", sender_role as "senderRole", 
                message, timestamp 
         FROM complaint_messages 
         WHERE complaint_id = $1 
         ORDER BY timestamp ASC`,
        [comp.id]
      );
      comp.messages = msgRes.rows;
    }

    res.json(complaints);
  } catch (err) {
    console.error('Fetch Complaints Error:', err);
    res.status(500).json({ error: 'Database error fetching complaints.' });
  }
});

// Raise complaint (restricted to Students)
app.post('/api/complaints', authenticate, async (req: any, res) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Access denied. Only students can submit complaints.' });
  }

  const { title, category, description } = req.body;
  if (!title || !category || !description) {
    return res.status(400).json({ error: 'Title, category, and description are required.' });
  }

  const complaintId = 'comp-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO complaints (id, title, category, description, status, raised_by, raised_by_roll, department, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [complaintId, title, category, description, 'OPEN', req.user.username, req.user.rollNumber || null, req.user.department, now]
    );

    const newComplaint = {
      id: complaintId,
      title,
      category,
      description,
      status: 'OPEN',
      raised_by: req.user.username,
      raised_by_roll: req.user.rollNumber,
      department: req.user.department,
      createdAt: now,
      messages: []
    };

    res.status(201).json(newComplaint);
  } catch (err) {
    console.error('Create Complaint Error:', err);
    res.status(500).json({ error: 'Failed to submit complaint.' });
  }
});

// Respond to complaint and update status
app.post('/api/complaints/:id/respond', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { message, status } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Response message cannot be empty.' });
  }

  try {
    const compRes = await pool.query('SELECT * FROM complaints WHERE id = $1', [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];
    const user = req.user;

    const isHod = user.role === 'HOD' && user.department === complaint.department;
    const isDean = user.role === 'Dean';

    if (!isHod && !isDean) {
      return res.status(403).json({ error: 'Access denied. Only higher authorities (HOD or Dean) can respond to grievances.' });
    }

    const msgId = 'msg-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    await pool.query(
      `INSERT INTO complaint_messages (id, complaint_id, sender_name, sender_role, message, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [msgId, id, user.username, user.role, message.trim(), now]
    );

    let newStatus = complaint.status;
    if (status && ['OPEN', 'IN_REVIEW', 'RESOLVED'].includes(status)) {
      newStatus = status;
    } else if (complaint.status === 'OPEN') {
      newStatus = 'IN_REVIEW';
    }

    await pool.query('UPDATE complaints SET status = $1 WHERE id = $2', [newStatus, id]);

    // Return updated complaint
    const updatedCompRes = await pool.query(
      `SELECT id, title, category, description, status, 
              raised_by, raised_by_roll, department, created_at as "createdAt" 
       FROM complaints WHERE id = $1`,
      [id]
    );
    const updatedComp = updatedCompRes.rows[0];

    const msgRes = await pool.query(
      `SELECT id, sender_name as "senderName", sender_role as "senderRole", 
              message, timestamp 
       FROM complaint_messages 
       WHERE complaint_id = $1 
       ORDER BY timestamp ASC`,
      [id]
    );
    updatedComp.messages = msgRes.rows;

    res.json(updatedComp);
  } catch (err) {
    console.error('Complaint Response Error:', err);
    res.status(500).json({ error: 'Database response failure.' });
  }
});

// Software Admin Privilege Management routes
app.get('/api/admin/users', authenticate, async (req: any, res) => {
  if (req.user.role !== 'Software Admin') {
    return res.status(403).json({ error: 'Access denied. Software Admin privilege required.' });
  }
  try {
    const usersRes = await pool.query(
      'SELECT username, role, department, roll_number as "rollNumber" FROM users ORDER BY username ASC'
    );
    res.json(usersRes.rows);
  } catch (err) {
    console.error('Fetch Users Error:', err);
    res.status(500).json({ error: 'Database query error.' });
  }
});

app.put('/api/admin/users/:username', authenticate, async (req: any, res) => {
  if (req.user.role !== 'Software Admin') {
    return res.status(403).json({ error: 'Access denied. Software Admin privilege required.' });
  }
  const { username } = req.params;
  const { role, department, rollNumber } = req.body;

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];

    if (targetUser.username.toLowerCase() === 'admin@clg' && role !== 'Software Admin') {
      return res.status(400).json({ error: 'Cannot change the privileges of the main Software Admin.' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is a required field.' });
    }

    if (['Student', 'Dept Staff', 'HOD'].includes(role) && !department) {
      return res.status(400).json({ error: 'Department selection is mandatory for this role.' });
    }

    if (role === 'Student' && !rollNumber) {
      return res.status(400).json({ error: 'Roll number is mandatory for students.' });
    }

    const deptVal = ['Student', 'Dept Staff', 'HOD'].includes(role) ? department : null;
    const rollVal = role === 'Student' ? rollNumber : null;

    await pool.query(
      'UPDATE users SET role = $1, department = $2, roll_number = $3 WHERE LOWER(username) = LOWER($4)',
      [role, deptVal, rollVal, username]
    );

    res.json({
      username: targetUser.username,
      role,
      department: deptVal || undefined,
      rollNumber: rollVal || undefined
    });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ error: 'Failed to update user privileges.' });
  }
});

// Admin Route to Reset DB
app.post('/api/reset', async (req, res) => {
  try {
    await pool.query('TRUNCATE users, events, event_activities, complaints, complaint_messages CASCADE');
    await initPostgresDb();
    const usersRes = await pool.query('SELECT username, role, department FROM users');
    res.json({ message: 'Database successfully re-seeded to initial state.', users: usersRes.rows });
  } catch (err) {
    console.error('Reset DB Error:', err);
    res.status(500).json({ error: 'Database reset error.' });
  }
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
    console.log(`🚀 Server running on http://${displayHost}:${PORT}`);
  });
}

startServer();
