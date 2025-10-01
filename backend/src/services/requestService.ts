import pool from '../config/database';
import { Request, RequestStatus, CreateRequestDto, UpdateRequestStatusDto, RequestFilters, PaginationQuery, TimelineEvent, Role } from '../types';
import { UserService } from './userService';
import { v4 as uuidv4 } from 'uuid';

// Add this helper function after your imports
function transformRequestFromDb(dbRequest: any): Request {
  return {
    id: dbRequest.id,
    requestType: dbRequest.request_type,
    employeeId: dbRequest.employee_id,
    employeeName: dbRequest.employee_name,
    amount: dbRequest.amount,
    currency: dbRequest.currency,
    description: dbRequest.description,
    category: dbRequest.category,
    status: dbRequest.status,
    priority: dbRequest.priority,
    createdAt: dbRequest.created_at,
    updatedAt: dbRequest.updated_at,
    nextActionBy: JSON.parse(dbRequest.next_action_by || '[]'),
    
    // New fields
    expenseStartDate: dbRequest.expense_start_date,
    expenseEndDate: dbRequest.expense_end_date,
    businessPurpose: dbRequest.business_purpose,
    department: dbRequest.department,
    company: dbRequest.company,
    destination: dbRequest.destination,
    remarks: dbRequest.remarks,
    advancePurpose: dbRequest.advance_purpose,
    expectedLiquidationDate: dbRequest.expected_liquidation_date,
    
    timeline: [],
    approvers: [],
    attachments: []
  } as Request;
}

const userService = new UserService();

// Helper: Generate REQ001-style ID
async function generateRequestId(): Promise<string> {
  const [rows] = await pool.execute('SELECT id FROM requests ORDER BY id DESC LIMIT 1');
  if ((rows as any[]).length === 0) return 'REQ001';
  const lastId = (rows as any)[0].id;
  const num = parseInt(lastId.replace('REQ', ''), 10);
  return `REQ${(num + 1).toString().padStart(3, '0')}`;
}

export class RequestService {
  async getAllRequests(filters: RequestFilters = {}, pagination: PaginationQuery = {}): Promise<{requests: Request[], totalCount: number}> {
    let query = 'SELECT * FROM requests WHERE 1=1';
    const params: any[] = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.employeeId) {
      query += ' AND employee_id = ?';
      params.push(filters.employeeId);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM (${query}) as total`;
    const [countRows] = await pool.execute(countQuery, params);
    const totalCount = (countRows as any)[0].count;

    // Paginate
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return { 
      requests: (rows as any[]).map(transformRequestFromDb), 
      totalCount 
    };
  }

  async getRequestById(id: string): Promise<Request | null> {
    const [rows] = await pool.execute('SELECT * FROM requests WHERE id = ?', [id]);
    const request = (rows as any[])[0];
    return request ? transformRequestFromDb(request) : null;
  }

  async getRequestsByUser(userId: number): Promise<Request[]> {
    const [rows] = await pool.execute('SELECT * FROM requests WHERE employee_id = ? ORDER BY created_at DESC', [userId]);
    return (rows as any[]).map(transformRequestFromDb);
  }

  async getInboxForUser(userId: number): Promise<Request[]> {
    const user = await userService.getUserById(userId);
    if (!user) return [];
    
    const [rows] = await pool.execute(
      `SELECT * FROM requests 
       WHERE JSON_CONTAINS(next_action_by, JSON_QUOTE(?))
       AND status NOT IN ('PAID', 'REJECTED')
       ORDER BY created_at DESC`,
      [user.role]
    );
    return (rows as any[]).map(transformRequestFromDb);
  }

  async createRequest(requestData: CreateRequestDto): Promise<Request> {
    const employee = await userService.getUserById(requestData.employeeId);
    if (!employee) throw new Error('Employee not found');

    // Validate required fields based on request type
    const requestType = requestData.requestType || 'REIMBURSEMENT';
    if (!requestData.category || !requestData.description || !requestData.amount) {
      throw new Error('Category, description, and amount are required for all requests');
    }

    if (requestType === 'REIMBURSEMENT' && !requestData.businessPurpose) {
      throw new Error('Business purpose is required for reimbursement requests');
    }
    if (requestType === 'CASH_ADVANCE' && !requestData.advancePurpose) {
      throw new Error('Advance purpose is required for cash advance requests');
    }
    if (requestType === 'LIQUIDATION' && !requestData.department) {
      throw new Error('Department is required for liquidation requests');
    }

    // Add basic input validation
    if (requestData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (requestData.urgency && !['Low', 'Medium', 'High'].includes(requestData.urgency)) {
      throw new Error('Urgency must be Low, Medium, or High');
    }

    // Determine workflow based on employee role
    let status: RequestStatus = 'PENDING_VALIDATION';
    let nextActionBy: Role[] = ['Manager'];

    if (employee.role === 'Manager') {
      status = 'PENDING_FINANCE';
      nextActionBy = ['Finance'];
    } else if (employee.role === 'Finance') {
      status = requestData.amount > 20000 ? 'PENDING_CEO' : 'APPROVED';
      nextActionBy = requestData.amount > 20000 ? ['CEO'] : [];
    } else if (employee.role === 'CEO') {
      status = 'APPROVED';
      nextActionBy = [];
    }

    const requestId = await generateRequestId();

    // Build the SQL INSERT dynamically based on request type
    const baseColumns = [
      'id', 'request_type', 'employee_id', 'employee_name', 'amount', 
      'category', 'description', 'status', 'next_action_by', 'priority',
      'created_at', 'updated_at'
    ];
    
    const baseValues = [
      requestId,
      requestType,
      requestData.employeeId,
      employee.name,
      requestData.amount,
      requestData.category,
      requestData.description,
      status,
      JSON.stringify(nextActionBy),
      requestData.urgency || 'Medium'
    ];

    // Add fields specific to each request type
    if (requestType === 'REIMBURSEMENT') {
      if (requestData.expenseStartDate) {
        baseColumns.push('expense_start_date');
        baseValues.push(requestData.expenseStartDate);
      }
      if (requestData.expenseEndDate) {
        baseColumns.push('expense_end_date');
        baseValues.push(requestData.expenseEndDate);
      }
      if (requestData.businessPurpose) {
        baseColumns.push('business_purpose');
        baseValues.push(requestData.businessPurpose);
      }
      if (requestData.department) {
        baseColumns.push('department');
        baseValues.push(requestData.department);
      }
      if (requestData.company) {
        baseColumns.push('company');
        baseValues.push(requestData.company);
      }
    } else if (requestType === 'CASH_ADVANCE') {
      if (requestData.destination) {
        baseColumns.push('destination');
        baseValues.push(requestData.destination);
      }
      if (requestData.plannedExpenseDate) {
        baseColumns.push('expense_start_date');
        baseValues.push(requestData.plannedExpenseDate);
      }
      if (requestData.expectedLiquidationDate) {
        baseColumns.push('expected_liquidation_date');
        baseValues.push(requestData.expectedLiquidationDate);
      }
      if (requestData.advancePurpose) {
        baseColumns.push('advance_purpose');
        baseValues.push(requestData.advancePurpose);
      }
      if (requestData.remarks) {
        baseColumns.push('remarks');
        baseValues.push(requestData.remarks);
      }
      if (requestData.department) {
        baseColumns.push('department');
        baseValues.push(requestData.department);
      }
      if (requestData.company) {
        baseColumns.push('company');
        baseValues.push(requestData.company);
      }
    } else if (requestType === 'LIQUIDATION') {
      if (requestData.department) {
        baseColumns.push('department');
        baseValues.push(requestData.department);
      }
      if (requestData.company) {
        baseColumns.push('company');
        baseValues.push(requestData.company);
      }
    }

    // Build SQL query
    const placeholders = baseColumns.map(() => '?').join(', ');
    const query = `
      INSERT INTO requests (${baseColumns.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, NOW(), NOW())
    `;

    await pool.execute(query, baseValues);

    // Insert timeline event
    await pool.execute(
      `INSERT INTO timeline_events (
        request_id, stage, decision, actor_id, actor_name, actor_role, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        requestId,
        'Request Submitted',
        'submitted',
        employee.id,
        employee.name,
        employee.role
      ]
    );

    return this.getRequestById(requestId) as Promise<Request>;
  }

  async updateRequestStatus(requestId: string, statusUpdate: UpdateRequestStatusDto): Promise<Request | null> {
    const request = await this.getRequestById(requestId);
    const actor = await userService.getUserById(statusUpdate.actorId);
    if (!request || !actor) return null;

    let newStatus: RequestStatus;
    let nextActionBy: Role[];

    // ✅ FIXED: Handle each role's approval logic explicitly
    if (statusUpdate.status === 'APPROVED') {
      // When someone clicks "Approve", determine the next step based on their role
      
      if (actor.role === 'Manager') {
        // ✅ Manager approving → Always go to Finance next
        newStatus = 'PENDING_FINANCE';
        nextActionBy = ['Finance'];
        
      } else if (actor.role === 'Finance') {
        // ✅ Finance approving → Check amount threshold
        if (request.amount > 20000) {
          // Large amount → Need CEO approval
          newStatus = 'PENDING_CEO';
          nextActionBy = ['CEO'];
        } else {
          // Small amount (≤ ₱20,000) → Final approval, skip CEO
          newStatus = 'APPROVED';
          nextActionBy = [];
        }
        
      } else if (actor.role === 'CEO') {
        // ✅ CEO approving → Always final approval
        newStatus = 'APPROVED';
        nextActionBy = [];
        
      } else {
        // Fallback for Employee role (shouldn't happen in normal flow)
        newStatus = 'PENDING_VALIDATION';
        nextActionBy = ['Manager'];
      }
      
    } else if (statusUpdate.status === 'REJECTED') {
      // ✅ Rejection can happen at any stage
      newStatus = 'REJECTED';
      nextActionBy = [];
      
    } else {
      // ✅ For other statuses (PROCESSING_PAYMENT, PAID, etc.)
      newStatus = statusUpdate.status;
      nextActionBy = this.getNextActionBy(newStatus);
    }

    // Update request
    await pool.execute(
      'UPDATE requests SET status = ?, next_action_by = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, JSON.stringify(nextActionBy), requestId]
    );

    // Add timeline event
    await pool.execute(
      `INSERT INTO timeline_events (
        request_id, stage, decision, actor_id, actor_name, actor_role, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        requestId,
        this.getStageFromStatus(newStatus),
        this.getDecisionFromStatus(newStatus),
        actor.id,
        actor.name,
        actor.role
      ]
    );

    return this.getRequestById(requestId);
  }

  async deleteRequest(id: string): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM requests WHERE id = ?', [id]);
    return (result as any).affectedRows > 0;
  }

  async getDashboardStats(): Promise<any> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN status IN ('PENDING_VALIDATION', 'PENDING_FINANCE', 'PENDING_CEO', 'APPROVED', 'PROCESSING_PAYMENT') THEN 1 END) as pendingRequests,
        SUM(CASE WHEN status = 'APPROVED' THEN amount ELSE 0 END) as approvedAmount,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paidAmount
      FROM requests
    `);
    const stats = (rows as any)[0];
    
    const [statusBreakdown] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM requests 
      GROUP BY status
    `);
    
    return {
      ...stats,
      statusBreakdown: (statusBreakdown as any).reduce((acc: any, curr: any) => ({
        ...acc,
        [curr.status]: curr.count
      }), {})
    };
  }

  private getNextActionBy(status: RequestStatus): Role[] {
    switch (status) {
      case 'PENDING_VALIDATION':
        return ['Manager'];
      case 'PENDING_FINANCE':
        return ['Finance'];
      case 'PENDING_CEO':
        return ['CEO'];
      case 'APPROVED':
        return [];
      case 'PROCESSING_PAYMENT':
        return ['Finance'];
      case 'PAID':
        return [];
      case 'REJECTED':
        return [];
      default:
        return [];
    }
  }

  private getStageFromStatus(status: RequestStatus): string {
    switch (status) {
      case 'PENDING_VALIDATION':
        return 'Pending Manager Validation';
      case 'PENDING_FINANCE':
        return 'Pending Finance Approval';
      case 'PENDING_CEO':
        return 'Pending CEO Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Request Rejected';
      case 'PROCESSING_PAYMENT':
        return 'Processing Payment';
      case 'PAID':
        return 'Payment Released';
      default:
        return 'Unknown Stage';
    }
  }

  private getDecisionFromStatus(status: RequestStatus): 'approved' | 'rejected' | 'validated' | 'released' | 'submitted' {
    switch (status) {
      case 'APPROVED':
        return 'approved';
      case 'REJECTED':
        return 'rejected';
      case 'PENDING_VALIDATION':
        return 'submitted';
      case 'PENDING_FINANCE':
        return 'validated';
      case 'PENDING_CEO':
        return 'validated';
      case 'PROCESSING_PAYMENT':
        return 'validated';
      case 'PAID':
        return 'released';
      default:
        return 'submitted';
    }
  }
}