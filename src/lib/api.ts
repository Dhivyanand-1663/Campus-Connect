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

async function handleResponse<T = any>(res: Response, defaultErrMsg: string): Promise<T> {
  let data: any = {};
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      throw new Error(`Backend server error (${res.status}). Please make sure the backend server ('npm run express') is running.`);
    }
    throw new Error('Invalid response received from server.');
  }

  if (!res.ok) {
    throw new Error(data.error || defaultErrMsg);
  }
  return data as T;
}

export async function login(username: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res, 'Login failed.');
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
  return handleResponse(res, 'Registration failed.');
}

export async function getMe(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to retrieve current user session.');
}

export async function getEvents(): Promise<Event[]> {
  const res = await fetch(`${API_BASE}/events`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch events.');
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
  return handleResponse(res, 'Failed to submit event proposal.');
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
  return handleResponse(res, 'Failed to submit event action.');
}

export async function getComplaints(): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/complaints`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch complaints.');
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
  return handleResponse(res, 'Failed to submit complaint.');
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
  return handleResponse(res, 'Failed to send response.');
}

export async function resetDatabase(): Promise<{ message: string; users: any[] }> {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
  });
  return handleResponse(res, 'Failed to reset database.');
}

export async function getAdminUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: getHeaders(),
  });
  return handleResponse(res, 'Failed to fetch users list.');
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
  return handleResponse(res, 'Failed to update user privileges.');
}

