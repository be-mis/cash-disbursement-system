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
  | 'PENDING_VALIDATION'      // Employee submitted, waiting for Manager
  | 'PENDING_FINANCE'         // Manager validated, waiting for Finance (or CEO for >20k)
  | 'PENDING_CEO'             // Finance validated, waiting for CEO approval
  | 'APPROVED'                // Fully approved, ready for payment processing
  | 'PROCESSING_PAYMENT'      // Finance is processing the payment
  | 'PAID'                    // Payment has been released
  | 'REJECTED';               // Request was rejected at any stage

export type RequestCategory = 
  | 'Reimbursement'
  | 'Cash Advance'
  | 'Liquidation'
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
  category: string;
  description: string;
  urgency?: string;
  
  // New Reimbursement fields
  expenseStartDate?: string;
  expenseEndDate?: string;
  businessPurpose?: string;
  department?: string;
  company?: string;
  
  // New Cash Advance fields
  destination?: string;
  plannedExpenseDate?: string;
  expectedLiquidationDate?: string;
  advancePurpose?: string;
  remarks?: string;
  
  // Request type
  requestType?: 'REIMBURSEMENT' | 'CASH_ADVANCE' | 'LIQUIDATION';
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