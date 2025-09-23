// Fix: Added full content for services/api.ts
import { User, Request, Role, RequestStatus, TimelineEvent } from '../types';

const USERS: User[] = [
    { id: 1, name: 'Alice (Employee)', role: 'Employee' },
    { id: 2, name: 'Bob (Manager)', role: 'Manager' },
    { id: 3, name: 'Charlie (Finance)', role: 'Finance' },
    { id: 4, name: 'Diana (CEO)', role: 'CEO' },
];

const generateTimeline = (status: RequestStatus, employee: User, manager: User, finance: User, ceo: User): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [
        {
            stage: 'Request Submitted',
            decision: 'submitted',
            type: 'system',
            actor: employee,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            comment: 'Request created by employee.',
        }
    ];

    if (status !== 'PENDING_VALIDATION') {
        timeline.push({
            stage: 'Validation',
            decision: 'validated',
            type: 'user',
            actor: manager,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            comment: 'Details look correct.',
        });
    }

    if (status === 'APPROVED' || status === 'REJECTED' || status === 'PROCESSING_PAYMENT' || status === 'PAID') {
        const isApproved = status !== 'REJECTED';
        timeline.push({
            stage: 'Approval',
            decision: isApproved ? 'approved' : 'rejected',
            type: 'user',
            actor: ceo,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            comment: isApproved ? 'Approved for payment.' : 'This expense is not covered.',
        });
    }

    if (status === 'PROCESSING_PAYMENT' || status === 'PAID') {
         timeline.push({
            stage: 'Payment Processing',
            decision: 'released',
            type: 'user',
            actor: finance,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            comment: 'Payment has been processed.',
        });
    }
    
    if (status === 'PAID') {
        timeline.push({
           stage: 'Paid',
           decision: 'paid',
           type: 'system',
           actor: { name: 'System', role: 'Finance' },
           timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
           comment: 'Funds have been transferred.',
       });
   }
   
    return timeline.reverse();
};

const REQUESTS: Request[] = [
    {
        id: 'REQ001',
        employeeName: 'Alice (Employee)',
        employeeId: 1,
        amount: 5000,
        currency: 'PHP',
        description: 'Office supplies for Q3',
        category: 'Office Supplies',
        status: 'PENDING_APPROVAL',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        approvers: [USERS[1], USERS[3]],
        nextActionBy: ['CEO'],
        timeline: generateTimeline('PENDING_APPROVAL', USERS[0], USERS[1], USERS[2], USERS[3]),
    },
    {
        id: 'REQ002',
        employeeName: 'Alice (Employee)',
        employeeId: 1,
        amount: 25000,
        currency: 'PHP',
        description: 'Client dinner meeting',
        category: 'Travel & Entertainment',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        approvers: [USERS[1], USERS[3]],
        nextActionBy: ['Finance'],
        timeline: generateTimeline('APPROVED', USERS[0], USERS[1], USERS[2], USERS[3]),
    },
    {
        id: 'REQ003',
        employeeName: 'Alice (Employee)',
        employeeId: 1,
        amount: 1200,
        currency: 'PHP',
        description: 'Software subscription renewal',
        category: 'Software',
        status: 'REJECTED',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        approvers: [USERS[1], USERS[3]],
        nextActionBy: [],
        timeline: generateTimeline('REJECTED', USERS[0], USERS[1], USERS[2], USERS[3]),
    },
    {
        id: 'REQ004',
        employeeName: 'Another Employee',
        employeeId: 5, // A different employee
        amount: 7800,
        currency: 'PHP',
        description: 'Team lunch for project completion',
        category: 'Team Building',
        status: 'PAID',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        approvers: [USERS[1], USERS[3]],
        nextActionBy: [],
        timeline: generateTimeline('PAID', USERS[0], USERS[1], USERS[2], USERS[3]),
    },
     {
        id: 'REQ005',
        employeeName: 'Alice (Employee)',
        employeeId: 1,
        amount: 3000,
        currency: 'PHP',
        description: 'Marketing materials printing',
        category: 'Marketing',
        status: 'PENDING_VALIDATION',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        approvers: [USERS[1]],
        nextActionBy: ['Manager'],
        timeline: generateTimeline('PENDING_VALIDATION', USERS[0], USERS[1], USERS[2], USERS[3]),
    },
];

let requestsDB = [...REQUESTS];

export const api = {
    getUsers: async (): Promise<User[]> => {
        await new Promise(res => setTimeout(res, 200));
        return USERS;
    },
    getRequests: async (): Promise<Request[]> => {
        await new Promise(res => setTimeout(res, 500));
        return requestsDB;
    },
    getRequestsForUser: async (user: User): Promise<Request[]> => {
        await new Promise(res => setTimeout(res, 500));
        if (user.role === 'Employee') {
            return requestsDB.filter(r => r.employeeId === user.id);
        }
        return requestsDB;
    },
    getInboxForUser: async (user: User): Promise<Request[]> => {
        await new Promise(res => setTimeout(res, 500));
        return requestsDB.filter(r => r.nextActionBy.includes(user.role));
    },
    updateRequestStatus: async (requestId: string, newStatus: RequestStatus, user: User, comment: string): Promise<Request> => {
        await new Promise(res => setTimeout(res, 300));
        const requestIndex = requestsDB.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            throw new Error('Request not found');
        }

        const oldRequest = requestsDB[requestIndex];
        
        let nextActionBy: Role[] = [];
        let stage = '';
        let decision = '';

        switch(newStatus) {
            case 'PENDING_APPROVAL':
                nextActionBy = ['CEO'];
                stage = 'Validation';
                decision = 'validated';
                break;
            case 'APPROVED':
                nextActionBy = ['Finance'];
                stage = 'Approval';
                decision = 'approved';
                break;
            case 'REJECTED':
                nextActionBy = [];
                stage = 'Approval';
                decision = 'rejected';
                break;
            case 'PROCESSING_PAYMENT':
                nextActionBy = [];
                stage = 'Payment Processing';
                decision = 'released';
                break;
            case 'PAID':
                 nextActionBy = [];
                 stage = 'Paid';
                 decision = 'paid';
                 break;
        }
        
        const newTimelineEvent: TimelineEvent = {
            stage,
            decision,
            type: 'user',
            actor: { name: user.name, role: user.role },
            timestamp: new Date().toISOString(),
            comment
        };
        
        const updatedRequest = {
            ...oldRequest,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [newTimelineEvent, ...oldRequest.timeline],
            nextActionBy: nextActionBy
        };

        requestsDB[requestIndex] = updatedRequest;
        return updatedRequest;
    }
};
