/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Pool
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'Campus-Connect',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1663',
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initialize PostgreSQL tables and default seed data
export async function initPostgresDb() {
  let client;
  try {
    client = await pool.connect();
    console.log('🔄 Connecting & checking PostgreSQL tables in database "Campus-Connect"...');

    // 1. Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(100) PRIMARY KEY,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        roll_number VARCHAR(50)
      );
    `);

    // 2. Create Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        venue VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_by_roll VARCHAR(50),
        department VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Event Activities Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_activities (
        id VARCHAR(100) PRIMARY KEY,
        event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
        actor_name VARCHAR(100) NOT NULL,
        actor_role VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        remarks TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create Complaints Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        raised_by VARCHAR(100) NOT NULL,
        raised_by_roll VARCHAR(50),
        department VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Create Complaint Messages Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaint_messages (
        id VARCHAR(100) PRIMARY KEY,
        complaint_id VARCHAR(100) REFERENCES complaints(id) ON DELETE CASCADE,
        sender_name VARCHAR(100) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ PostgreSQL Schema initialized successfully.');

    // Seed default users if empty
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial records into PostgreSQL...');
      const defaultPasswordHash = hashPassword('password');
      const adminPasswordHash = hashPassword('admin@123');

      const seedUsers = [
        { username: 'admin@clg', passwordHash: adminPasswordHash, role: 'Software Admin', department: null, rollNumber: null },
        { username: 'student', passwordHash: defaultPasswordHash, role: 'Student', department: 'Computer Science & Engineering', rollNumber: '22CSE045' },
        { username: 'staff', passwordHash: defaultPasswordHash, role: 'Dept Staff', department: 'Computer Science & Engineering', rollNumber: null },
        { username: 'hod', passwordHash: defaultPasswordHash, role: 'HOD', department: 'Computer Science & Engineering', rollNumber: null },
        { username: 'dean', passwordHash: defaultPasswordHash, role: 'Dean', department: null, rollNumber: null },
        { username: 'principal', passwordHash: defaultPasswordHash, role: 'Principal', department: null, rollNumber: null },
      ];

      for (const u of seedUsers) {
        await client.query(
          `INSERT INTO users (username, password_hash, role, department, roll_number)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (username) DO NOTHING`,
          [u.username, u.passwordHash, u.role, u.department, u.rollNumber]
        );
      }

      // Seed sample events
      await client.query(`
        INSERT INTO events (id, title, description, venue, date, status, created_by, created_by_roll, department)
        VALUES 
        ('evt-1', 'National Hackathon 2026', 'An all-India 24-hour student hackathon focusing on AI and Sustainability solutions.', 'Main Auditorium & CS Labs', '2026-08-15', 'PENDING_DEPT_STAFF', 'student', '22CSE045', 'Computer Science & Engineering'),
        ('evt-2', 'Industrial Visit to Google Office', 'A career guidance industrial visit for final year engineering students.', 'Google Hyderabad Campus', '2026-09-10', 'PENDING_DEAN', 'student', '22CSE045', 'Computer Science & Engineering')
        ON CONFLICT (id) DO NOTHING;
      `);

      await client.query(`
        INSERT INTO event_activities (id, event_id, actor_name, actor_role, action, remarks)
        VALUES 
        ('act-1', 'evt-2', 'staff', 'Dept Staff', 'APPROVE', 'The syllabus aligns well with this industrial visit. Recommended.')
        ON CONFLICT (id) DO NOTHING;
      `);

      // Seed sample complaint
      await client.query(`
        INSERT INTO complaints (id, title, category, description, status, raised_by, raised_by_roll, department)
        VALUES 
        ('comp-1', 'Slow WiFi Connection in Hostels', 'Infrastructure', 'The WiFi bandwidth is extremely low during peak hours (8:00 PM - 11:00 PM), making it impossible to access online study materials.', 'OPEN', 'student', '22CSE045', 'Computer Science & Engineering')
        ON CONFLICT (id) DO NOTHING;
      `);

      console.log('✅ PostgreSQL database seeded with default records.');
    }
  } catch (error: any) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    console.error('🔑 Please update DB_PASSWORD in your .env file with your real pgAdmin / PostgreSQL password.');
  } finally {
    if (client) client.release();
  }
}

