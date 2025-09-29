import pool from '../config/database';
import { Request, RequestStatus, CreateRequestDto, UpdateRequestStatusDto, RequestFilters, PaginationQuery, TimelineEvent, Role } from '../types';
import { UserService } from './userService';
import { v4 as uuidv4 } from 'uuid';

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
    return { requests: rows as Request[], totalCount };
  }

  async getRequestById(id: string): Promise<Request | null> {
    const [rows] = await pool.execute('SELECT * FROM requests WHERE id = ?', [id]);
    return (rows as Request[])[0] || null;
  }

  async getRequestsByUser(userId: number): Promise<Request[]> {
    const [rows] = await pool.execute('SELECT * FROM requests WHERE employee_id = ? ORDER BY created_at DESC', [userId]);
    return rows as Request[];
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
    return rows as Request[];
  }

  async createRequest(requestData: CreateRequestDto): Promise<Request> {
    const employee = await userService.getUserById(requestData.employeeId);
    if (!employee) throw new Error('Employee not found');

    // Determine workflow
    let status: RequestStatus = 'PENDING_VALIDATION';
    let nextActionBy: Role[] = ['Manager'];

    if (employee.role === 'Manager') {
      status = 'PENDING_APPROVAL';
      nextActionBy = ['Finance'];
    } else if (employee.role === 'Finance') {
      status = requestData.amount > 20000 ? 'PENDING_CEO' : 'APPROVED';
      nextActionBy = requestData.amount > 20000 ? ['CEO'] : [];
    } else if (employee.role === 'CEO') {
      status = 'APPROVED';
      nextActionBy = [];
    }

    const requestId = await generateRequestId();

    // Insert request
    await pool.execute(
      `INSERT INTO requests (
        id, employee_id, employee_name, amount, category, description,
        status, next_action_by, urgency, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        requestId,
        requestData.employeeId,
        employee.name,
        requestData.amount,
        requestData.category,
        requestData.description,
        status,
        JSON.stringify(nextActionBy),
        requestData.urgency || 'Medium'
      ]
    );

    // Insert timeline event
    await pool.execute(
      `INSERT INTO timeline_events (
        request_id, stage, decision, actor_id, actor_name, actor_role, timestamp, type
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        requestId,
        'Request Submitted',
        'submitted',
        employee.id,
        employee.name,
        employee.role,
        'user'
      ]
    );

    return this.getRequestById(requestId) as Promise<Request>;
  }

  async updateRequestStatus(requestId: string, statusUpdate: UpdateRequestStatusDto): Promise<Request | null> {
    const request = await this.getRequestById(requestId);
    const actor = await userService.getUserById(statusUpdate.actorId);
    if (!request || !actor) return null;

    const newStatus = statusUpdate.status;
    const nextActionBy = this.getNextActionBy(newStatus);

    // Update request
    await pool.execute(
      'UPDATE requests SET status = ?, next_action_by = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, JSON.stringify(nextActionBy), requestId]
    );

    // Add timeline event
    await pool.execute(
      `INSERT INTO timeline_events (
        request_id, stage, decision, actor_id, actor_name, actor_role, comment, timestamp, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        requestId,
        this.getStageFromStatus(newStatus),
        this.getDecisionFromStatus(newStatus),
        actor.id,
        actor.name,
        actor.role,
        statusUpdate.comment || null,
        'user'
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
        COUNT(CASE WHEN status IN ('PENDING_VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING_PAYMENT') THEN 1 END) as pendingRequests,
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
      case 'PENDING_APPROVAL':
        return ['Finance'];
      case 'APPROVED':
        return ['Finance'];
      default:
        return [];
    }
  }

  private getStageFromStatus(status: RequestStatus): string {
    switch (status) {
      case 'PENDING_VALIDATION':
        return 'Pending Manager Validation';
      case 'PENDING_APPROVAL':
        return 'Pending Finance Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Request Rejected';
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
      case 'PENDING_APPROVAL':
        return 'validated';
      default:
        return 'submitted';
    }
  }
}