import { Request, RequestStatus, CreateRequestDto, UpdateRequestStatusDto, RequestFilters, PaginationQuery, TimelineEvent, Role } from '../types';
import { UserService } from './userService';
import { v4 as uuidv4 } from 'uuid';

export class RequestService {
  private userService = new UserService();

  async getAllRequests(filters: RequestFilters = {}, pagination: PaginationQuery = {}): Promise<{requests: Request[], totalCount: number}> {
    let filteredRequests = [...this.requests];

    if (filters.status) {
      filteredRequests = filteredRequests.filter(r => r.status === filters.status);
    }
    if (filters.category) {
      filteredRequests = filteredRequests.filter(r => r.category === filters.category);
    }
    if (filters.employeeId) {
      filteredRequests = filteredRequests.filter(r => r.employeeId === filters.employeeId);
    }

    const totalCount = filteredRequests.length;
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    return {
      requests: paginatedRequests,
      totalCount
    };
  }

  async getRequestById(id: string): Promise<Request | null> {
    const request = this.requests.find(r => r.id === id);
    return request || null;
  }

  async getRequestsByUser(userId: number): Promise<Request[]> {
    return this.requests.filter(r => r.employeeId === userId);
  }

  async getInboxForUser(userId: number): Promise<Request[]> {
    const user = await this.userService.getUserById(userId);
    if (!user) return [];

    return this.requests.filter(r => 
      r.nextActionBy.includes(user.role) && 
      r.status !== 'PAID' && 
      r.status !== 'REJECTED'
    );
  }

  async createRequest(requestData: CreateRequestDto): Promise<Request> {
    const employee = await this.userService.getUserById(requestData.employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    const requestId = `REQ${String(this.requests.length + 1).padStart(3, '0')}`;
    
    const newRequest: Request = {
      id: requestId,
      employeeId: requestData.employeeId,
      employeeName: employee.name,
      amount: requestData.amount,
      category: requestData.category,
      description: requestData.description,
      status: 'PENDING_VALIDATION',
      nextActionBy: ['Manager'],
      createdAt: new Date(),
      updatedAt: new Date(),
      urgency: requestData.urgency || 'Medium',
      timeline: [
        {
          id: uuidv4(),
          stage: 'Request Submitted',
          decision: 'submitted',
          actor: {
            id: employee.id,
            name: employee.name,
            role: employee.role
          },
          timestamp: new Date(),
          type: 'user'
        }
      ]
    };

    this.requests.push(newRequest);
    return newRequest;
  }

  async updateRequestStatus(requestId: string, statusUpdate: UpdateRequestStatusDto): Promise<Request | null> {
    const requestIndex = this.requests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) {
      return null;
    }

    const request = this.requests[requestIndex];
    const actor = await this.userService.getUserById(statusUpdate.actorId);
    if (!actor) {
      throw new Error('Actor not found');
    }

    request.status = statusUpdate.status;
    request.updatedAt = new Date();
    request.nextActionBy = this.getNextActionBy(statusUpdate.status);

    const timelineEvent: TimelineEvent = {
      id: uuidv4(),
      stage: this.getStageFromStatus(statusUpdate.status),
      decision: this.getDecisionFromStatus(statusUpdate.status),
      actor: {
        id: actor.id,
        name: actor.name,
        role: actor.role
      },
      comment: statusUpdate.comment,
      timestamp: new Date(),
      type: 'user'
    };

    request.timeline.push(timelineEvent);
    this.requests[requestIndex] = request;
    return request;
  }

  async deleteRequest(id: string): Promise<boolean> {
    const requestIndex = this.requests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      return false;
    }

    this.requests.splice(requestIndex, 1);
    return true;
  }

  async getDashboardStats(): Promise<any> {
    const totalRequests = this.requests.length;
    const pendingRequests = this.requests.filter(r => 
      ['PENDING_VALIDATION', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING_PAYMENT'].includes(r.status)
    ).length;

    return {
      totalRequests,
      pendingRequests,
      approvedAmount: 0,
      paidAmount: 0,
      statusBreakdown: {}
    };
  }

  private getNextActionBy(status: RequestStatus): Role[] {
    switch (status) {
      case 'PENDING_VALIDATION':
        return ['Manager'];
      case 'PENDING_APPROVAL':
        return ['CEO'];
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
      case 'APPROVED':
        return 'CEO Approved';
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
      default:
        return 'approved';
    }
  }
}