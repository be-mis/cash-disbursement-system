// Fix: Added full content for types.ts

export type Page = 'dashboard' | 'requests' | 'inbox';
export type Role = 'Employee' | 'Manager' | 'Finance' | 'CEO';

export interface User {
  id: number;
  name: string;
  role: Role;
}

export type RequestStatus =
  | 'PENDING_VALIDATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING_PAYMENT'
  | 'PAID';

export interface TimelineEvent {
  decision: string;
  type: 'user' | 'system';
  stage: string;
  actor: {
    name: string;
    role: Role;
  };
  timestamp: string;
  comment?: string;
}

export interface Request {
  id: string;
  employeeName: string;
  employeeId: number;
  amount: number;
  currency: 'PHP';
  description: string;
  category: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  approvers: User[];
  nextActionBy: Role[];
}
