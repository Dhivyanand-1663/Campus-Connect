/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Event, Complaint, Role, Department } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('college_portal_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Login failed.');
  }
  return res.json();
}

export async function register(
  username: string,
  password:  string,
  role: Role,
  department?: Department,
  rollNumber?: string
): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role, department, rollNumber }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Registration failed.');
  }
  return res.json();
}

export async function getMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to retrieve current user session.');
  }
  return res.json();
}

export async function getEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch events.');
  }
  return res.json();
}

export async function createEvent(eventData: {
  title: string;
  description: string;
  venue: string;
  date: string;
}): Promise<Event> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(eventData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit event proposal.');
  }
  return res.json();
}

export async function performEventAction(
  eventId: string,
  action: 'APPROVE' | 'REJECT',
  remarks?: string
): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/${eventId}/action`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action, remarks }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit event action.');
  }
  return res.json();
}

export async function getComplaints(): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/complaints`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch complaints.');
  }
  return res.json();
}

export async function raiseComplaint(complaintData: {
  title: string;
  category: string;
  description: string;
}): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(complaintData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit complaint.');
  }
  return res.json();
}

export async function respondToComplaint(
  complaintId: string,
  message: string,
  status?: 'IN_REVIEW' | 'RESOLVED'
): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${complaintId}/respond`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message, status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send response.');
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ message: string; users: any[] }> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to reset database.');
  }
  return res.json();
}

export async function getAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch users list.');
  }
  return res.json();
}

export async function updateAdminUserPrivileges(
  username: string,
  privileges: { role: Role; department?: Department; rollNumber?: string }
): Promise<User> {
  const res = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(privileges),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update user privileges.');
  }
  return res.json();
}
