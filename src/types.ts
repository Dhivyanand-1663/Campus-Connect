/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Student' | 'Dept Staff' | 'HOD' | 'Dean' | 'Principal' | 'Software Admin';

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
] as const;

export type Department = typeof DEPARTMENTS[number];

export type EventStatus =
  | 'PENDING_DEPT_STAFF'
  | 'PENDING_DEAN'
  | 'PENDING_PRINCIPAL'
  | 'APPROVED'
  | 'REJECTED';

export interface EventActivity {
  id: string;
  actorName: string;
  actorRole: Role;
  action: 'APPROVE' | 'REJECT';
  remarks?: string;
  timestamp: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  status: EventStatus;
  created_by: string;
  created_by_roll?: string;
  department: Department;
  createdAt: string;
  activities: EventActivity[];
}

export type ComplaintStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';

export interface ComplaintMessage {
  id: string;
  senderName: string;
  senderRole: Role;
  message: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  raised_by: string;
  raised_by_roll?: string;
  department: Department;
  createdAt: string;
  messages: ComplaintMessage[];
}

export interface User {
  username: string;
  role: Role;
  department?: Department;
  rollNumber?: string;
  passwordHash?: string; // Stored server-side only
}

export interface AuthResponse {
  user: User;
  token: string;
}
