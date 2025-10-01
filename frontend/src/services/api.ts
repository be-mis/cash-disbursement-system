import { User, Request, RequestStatus, CreateReimbursementDto, CreateCashAdvanceDto, CreateLiquidationDto, CashAdvanceRequest } from '../types/types';

const API_BASE_URL = 'http://localhost:3001/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const api = {
  // Auth
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const result = await response.json();
    return result.data;
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data = await response.json();
    return data.data || [];
  },

  // Requests
  getRequests: async (): Promise<Request[]> => {
    const response = await fetch(`${API_BASE_URL}/requests`);
    const data = await response.json();
    return data.data?.requests || [];
  },

  getRequestsForUser: async (user: User): Promise<Request[]> => {
    const response = await fetch(`${API_BASE_URL}/requests/user/${user.id}`);
    const data = await response.json();
    return data.data || [];
  },

  getInboxForUser: async (user: User): Promise<Request[]> => {
    const response = await fetch(`${API_BASE_URL}/requests/inbox/${user.id}`);
    const data = await response.json();
    return data.data || [];
  },

  updateRequestStatus: async (
    requestId: string,
    newStatus: RequestStatus,
    user: User,
    comment: string
  ): Promise<Request> => {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        actorId: user.id,
        comment: comment
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update request status');
    }
    
    const data = await response.json();
    return data.data;
  },

  createReimbursementRequest: async (data: CreateReimbursementDto): Promise<Request> => {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: data.employeeId,
        amount: data.amount,
        category: data.category,
        description: data.description,
        urgency: data.priority,
        requestType: 'REIMBURSEMENT',
        expenseStartDate: data.expenseStartDate,
        expenseEndDate: data.expenseEndDate,
        businessPurpose: data.businessPurpose,
        department: data.department,
        company: data.company
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reimbursement request');
    }
    
    const result = await response.json();
    return result.data;
  },

  createCashAdvanceRequest: async (data: CreateCashAdvanceDto): Promise<Request> => {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: data.employeeId,
        amount: data.estimatedAmount,
        category: data.category,
        description: data.description,
        urgency: data.priority,
        requestType: 'CASH_ADVANCE',
        plannedExpenseDate: data.plannedExpenseDate,
        expectedLiquidationDate: data.expectedLiquidationDate,
        advancePurpose: data.advancePurpose,
        destination: data.destination,
        remarks: data.remarks,
        department: data.department,
        company: data.company
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create cash advance request');
    }
    
    const result = await response.json();
    return result.data;
  },

  createLiquidationRequest: async (data: CreateLiquidationDto): Promise<Request> => {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: data.employeeId,
        amount: data.actualAmount,
        category: 'Other',
        description: data.description,
        urgency: 'Medium'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create liquidation request');
    }
    
    const result = await response.json();
    return result.data;
  },

  getPendingAdvancesForUser: async (userId: number): Promise<CashAdvanceRequest[]> => {
    // This needs a backend endpoint - for now return empty array
    return [];
  },

  getConnectedRequests: async (requestId: string): Promise<Request[]> => {
    // This needs a backend endpoint - for now return empty array
    return [];
  }
};