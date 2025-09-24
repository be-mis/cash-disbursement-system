// User types
export type Role = 'Employee' | 'Manager' | 'CEO' | 'Finance';
export type Page = 'dashboard' | 'requests' | 'inbox';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request types
export type RequestStatus = 
  | 'PENDING_VALIDATION' 
  | 'PENDING_APPROVAL' 
  | 'APPROVED' 
  | 'PROCESSING_PAYMENT' 
  | 'PAID' 
  | 'REJECTED';

export type RequestCategory = 
  | 'Office Supplies'
  | 'Travel'
  | 'Marketing'
  | 'Software'
  | 'Equipment'
  | 'Other';

export interface Request {
  id: string;
  employeeId: number;
  employeeName: string;
  amount: number;
  category: RequestCategory;
  description: string;
  status: RequestStatus;
  nextActionBy: Role[];
  createdAt: Date;
  updatedAt: Date;
  timeline: TimelineEvent[];
  attachments?: string[];
  urgency?: 'Low' | 'Medium' | 'High';
}

// Timeline types
export interface TimelineEvent {
  id: string;
  stage: string;
  decision: 'approved' | 'rejected' | 'validated' | 'released' | 'submitted';
  actor: {
    id: number;
    name: string;
    role: Role;
  };
  comment?: string;
  timestamp: Date;
  type: 'user' | 'system';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Request creation/update types
export interface CreateRequestDto {
  employeeId: number;
  amount: number;
  category: RequestCategory;
  description: string;
  urgency?: 'Low' | 'Medium' | 'High';
  attachments?: string[];
}

export interface UpdateRequestStatusDto {
  status: RequestStatus;
  actorId: number;
  comment?: string;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

// Filter/pagination types
export interface RequestFilters {
  status?: RequestStatus;
  category?: RequestCategory;
  employeeId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  urgency?: 'Low' | 'Medium' | 'High';
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}