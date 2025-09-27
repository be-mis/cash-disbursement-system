// Page and User types
export type Page = 'dashboard' | 'create' | 'requests' | 'inbox';
export type Role = 'Employee' | 'Manager' | 'Finance' | 'CEO';

export interface User {
  id: number;
  name: string;
  role: Role;
  email?: string;
  department?: string;
}

// Request types for the three cash disbursement forms
export type RequestType = 'REIMBURSEMENT' | 'CASH_ADVANCE' | 'LIQUIDATION';

// Updated status flow: Employee → Manager → Finance → CEO → Payment
export type RequestStatus =
  | 'PENDING_VALIDATION'     // Manager validates
  | 'PENDING_FINANCE'        // Finance reviews
  | 'PENDING_CEO'           // CEO approves (high amounts)
  | 'APPROVED'              // Ready for payment
  | 'REJECTED'              // Rejected at any stage
  | 'PROCESSING_PAYMENT'    // Finance processing
  | 'PAID'                  // Payment completed
  | 'PENDING_LIQUIDATION'   // For advances awaiting liquidation
  | 'LIQUIDATED';           // Advance fully accounted for

export type RequestCategory = 
  | 'Office Supplies'
  | 'Travel'
  | 'Marketing'
  | 'Software'
  | 'Equipment'
  | 'Meals'
  | 'Transportation'
  | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

// Base interface for all requests
export interface BaseRequest {
  id: string;
  requestType: RequestType;
  employeeName: string;
  employeeId: number;
  amount: number;
  currency: 'PHP';
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  approvers: User[];
  nextActionBy: Role[];
  attachments?: string[];
  comments?: string;
}

// Reimbursement Request (money back for expenses already paid)
export interface ReimbursementRequest extends BaseRequest {
  requestType: 'REIMBURSEMENT';
  expenseDate: string;        // When the expense was incurred
  receipts: string[];         // Required receipts/documentation
  businessPurpose: string;    // Justification for expense
}

// Cash Advance Request (money upfront before expense)
export interface CashAdvanceRequest extends BaseRequest {
  requestType: 'CASH_ADVANCE';
  plannedExpenseDate: string;     // When expense will occur
  estimatedAmount: number;        // Estimated total needed
  advancePurpose: string;         // What the advance is for
  expectedLiquidationDate: string; // When liquidation is due
  liquidationId?: string;         // Link to liquidation request
}

// Liquidation Request (accounting for advance money)
export interface LiquidationRequest extends BaseRequest {
  requestType: 'LIQUIDATION';
  advanceId: string;              // Links to original advance
  advanceAmount: number;          // Original advance amount
  actualAmount: number;           // Amount actually spent
  remainingAmount: number;        // Amount to return (if any)
  receipts: string[];             // Required receipts
  liquidationSummary: string;     // Summary of how money was used
}

// Union type for all request types
export type Request = ReimbursementRequest | CashAdvanceRequest | LiquidationRequest;

// Timeline Event
export interface TimelineEvent {
  id: string;
  stage: string;
  decision: 'approved' | 'rejected' | 'validated' | 'released' | 'submitted' | 'liquidated';
  actor: {
    id: number;
    name: string;
    role: Role;
  };
  comment?: string;
  timestamp: string;
  type: 'user' | 'system';
}

// Form DTOs for creating requests
export interface CreateReimbursementDto {
  employeeId: number;
  amount: number;
  category: RequestCategory;
  description: string;
  expenseDate: string;
  businessPurpose: string;
  priority: Priority;
  attachments?: string[];
}

export interface CreateCashAdvanceDto {
  employeeId: number;
  estimatedAmount: number;
  category: RequestCategory;
  description: string;
  plannedExpenseDate: string;
  advancePurpose: string;
  expectedLiquidationDate: string;
  priority: Priority;
}

export interface CreateLiquidationDto {
  advanceId: string;
  actualAmount: number;
  description: string;
  liquidationSummary: string;
  attachments: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard statistics
export interface DashboardStats {
  myPendingRequests: {
    count: number;
    totalAmount: number;
  };
  myTotalReimbursed: {
    amount: number;
    requestCount: number;
  };
  inboxItems: {
    count: number;
  };
  companyWideStatus: {
    pendingApproval: number;
    approved: number;
    rejected: number;
    paid: number;
    pendingValidation: number;
    pendingLiquidation: number;
  };
}

// Filters for request queries
export interface RequestFilters {
  requestType?: RequestType;
  status?: RequestStatus;
  category?: RequestCategory;
  employeeId?: number;
  dateFrom?: string;
  dateTo?: string;
  priority?: Priority;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}