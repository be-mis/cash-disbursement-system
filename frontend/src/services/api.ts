import { User, Request, Role, RequestStatus, TimelineEvent, RequestType, ReimbursementRequest, CashAdvanceRequest, LiquidationRequest, Priority, CreateReimbursementDto, CreateCashAdvanceDto, CreateLiquidationDto } from '../types/types';

const USERS: User[] = [
    { id: 1, name: 'Alice Johnson', role: 'Employee', email: 'alice.johnson@company.com', department: 'Marketing' },
    { id: 2, name: 'Bob Chen', role: 'Manager', email: 'bob.chen@company.com', department: 'Operations' },
    { id: 3, name: 'Charlie Rodriguez', role: 'Finance', email: 'charlie.rodriguez@company.com', department: 'Finance' },
    { id: 4, name: 'Diana Park', role: 'CEO', email: 'diana.park@company.com', department: 'Executive' },
    { id: 5, name: 'Emma Davis', role: 'Employee', email: 'emma.davis@company.com', department: 'Sales' },
    { id: 6, name: 'Frank Wilson', role: 'Manager', email: 'frank.wilson@company.com', department: 'IT' },
];

const generateTimeline = (
    status: RequestStatus, 
    requestType: RequestType,
    employee: User, 
    manager: User, 
    finance: User, 
    ceo: User
): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [
        {
            id: `timeline-${Date.now()}-1`,
            stage: 'Request Submitted',
            decision: 'submitted',
            type: 'system',
            actor: { id: employee.id, name: employee.name, role: employee.role },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
            comment: `${requestType.toLowerCase().replace('_', ' ')} request created by employee.`,
        }
    ];

    // Manager validation (first step in new workflow)
    if (!['PENDING_VALIDATION'].includes(status)) {
        timeline.push({
            id: `timeline-${Date.now()}-2`,
            stage: 'Manager Validation',
            decision: 'validated',
            type: 'user',
            actor: { id: manager.id, name: manager.name, role: manager.role },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            comment: 'Details validated and forwarded to Finance.',
        });
    }

    // Finance review (second step)
    if (!['PENDING_VALIDATION', 'PENDING_FINANCE'].includes(status)) {
        timeline.push({
            id: `timeline-${Date.now()}-3`,
            stage: 'Finance Review',
            decision: 'approved',
            type: 'user',
            actor: { id: finance.id, name: finance.name, role: finance.role },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            comment: 'Budget approved, forwarding to CEO for final approval.',
        });
    }

    // Liquidation approved by Finance
    if (status === 'APPROVED' && requestType === 'LIQUIDATION') {
        timeline.push({
            id: `timeline-${Date.now()}-5`,
            stage: 'Finance Approval',
            decision: 'approved',
            type: 'user',
            actor: { id: finance.id, name: finance.name, role: finance.role },
            timestamp: new Date().toISOString(),
            comment: 'Liquidation approved by Finance. Forwarding to CEO for final approval.',
        });
    }

    // CEO approval (third step for high amounts)
    if (['APPROVED', 'REJECTED', 'PROCESSING_PAYMENT', 'PAID'].includes(status)) {
        const isApproved = status !== 'REJECTED';
        timeline.push({
            id: `timeline-${Date.now()}-4`,
            stage: 'CEO Approval',
            decision: isApproved ? 'approved' : 'rejected',
            type: 'user',
            actor: { id: ceo.id, name: ceo.name, role: ceo.role },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            comment: isApproved ? 'Final approval granted for payment.' : 'Request rejected - not aligned with budget priorities.',
        });
    }

    // Payment processing
    if (['PROCESSING_PAYMENT', 'PAID'].includes(status)) {
        timeline.push({
            id: `timeline-${Date.now()}-5`,
            stage: 'Payment Processing',
            decision: 'released',
            type: 'user',
            actor: { id: finance.id, name: finance.name, role: finance.role },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            comment: 'Payment processing initiated.',
        });
    }
    
    // Payment completed
    if (status === 'PAID') {
        timeline.push({
            id: `timeline-${Date.now()}-6`,
            stage: 'Payment Completed',
            decision: 'released',
            type: 'system',
            actor: { id: 0, name: 'System', role: 'Finance' },
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            comment: 'Funds transferred successfully.',
        });
    }
   
    return timeline.reverse();
};

// Empty mock data
const REQUESTS: Request[] = [];

let requestsDB = [...REQUESTS];

// Helper function to generate new request ID
const generateRequestId = (): string => {
    const existingIds = requestsDB.map(r => parseInt(r.id.replace('REQ', '')));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return `REQ${String(maxId + 1).padStart(3, '0')}`;
};

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
        // Managers, Finance, and CEO can see all requests
        return requestsDB;
    },
    
    getInboxForUser: async (user: User): Promise<Request[]> => {
        await new Promise(res => setTimeout(res, 500));
        return requestsDB.filter(r => r.nextActionBy.includes(user.role));
    },

    updateRequestStatus: async (
        requestId: string, 
        newStatus: RequestStatus, 
        user: User, 
        comment: string
    ): Promise<Request> => {
        await new Promise(res => setTimeout(res, 300));
        const requestIndex = requestsDB.findIndex(r => r.id === requestId);
        if (requestIndex === -1) {
            throw new Error('Request not found');
        }

        const oldRequest = requestsDB[requestIndex];
        
        let nextActionBy: Role[] = [];
        let stage = '';
        let decision: any = '';

        // Updated workflow with ₱20K threshold logic
        switch(newStatus) {
            case 'PENDING_FINANCE':
                nextActionBy = ['Finance'];
                stage = 'Manager Validation';
                decision = 'validated';
                break;
            case 'PENDING_CEO':
                nextActionBy = ['CEO'];
                stage = 'Finance Review';
                decision = 'approved';
                break;
            case 'APPROVED':
                if (oldRequest.requestType === 'LIQUIDATION') {
                    // Liquidation approved by Finance - mark advance as LIQUIDATED
                    const liquidation = oldRequest as LiquidationRequest;
                    const advanceIndex = requestsDB.findIndex(r => r.id === liquidation.advanceId);
                    if (advanceIndex !== -1) {
                        requestsDB[advanceIndex].status = 'LIQUIDATED';
                        // Add timeline event to advance
                        const liquidationEvent = {
                            id: `timeline-${Date.now()}-liquidated`,
                            stage: 'Advance Liquidated',
                            decision: 'liquidated' as any,
                            type: 'system' as const,
                            actor: { id: 0, name: 'System', role: 'Finance' as Role },
                            timestamp: new Date().toISOString(),
                            comment: 'Advance fully accounted for via liquidation. No further action required.'
                        };
                        requestsDB[advanceIndex].timeline = [liquidationEvent, ...requestsDB[advanceIndex].timeline];
                    }
                    nextActionBy = [];
                    stage = 'Liquidation Approved';
                    decision = 'approved';
                } else {
                    // For reimbursement/cash advance: Check ₱20K threshold
                    const needsCEO = oldRequest.amount > 20000;
                    if (needsCEO && user.role === 'Finance') {
                        // Finance approved, but CEO approval still needed
                        newStatus = 'PENDING_CEO';
                        nextActionBy = ['CEO'];
                        stage = 'Finance Review - Forwarding to CEO';
                        decision = 'approved';
                    } else {
                        // Ready for payment (either CEO approved or amount ≤ ₱20K)
                        nextActionBy = ['Finance'];
                        stage = 'Approved';
                        decision = 'approved';
                    }
                }
                break;
            case 'REJECTED':
                nextActionBy = [];
                stage = 'Rejection';
                decision = 'rejected';
                break;
            case 'PROCESSING_PAYMENT':
                if (oldRequest.requestType === 'CASH_ADVANCE') {
                    nextActionBy = [];
                    stage = 'Ready for Liquidation';
                    decision = 'released';
                    newStatus = 'PENDING_LIQUIDATION'; // Override for cash advances
                } else {
                    nextActionBy = [];
                    stage = 'Payment Processing';
                    decision = 'released';
                }
                break;
            case 'PAID':
                nextActionBy = [];
                stage = 'Payment Completed';
                decision = 'released';
                break;
            default:
                nextActionBy = [];
                stage = 'Unknown';
                decision = 'unknown';
                break;
        }
        
        const newTimelineEvent: TimelineEvent = {
            id: `timeline-${Date.now()}`,
            stage,
            decision,
            type: 'user',
            actor: { id: user.id, name: user.name, role: user.role },
            timestamp: new Date().toISOString(),
            comment
        };
        
        const updatedRequest = {
            ...oldRequest,
            status: oldRequest.requestType === 'CASH_ADVANCE' && newStatus === 'PROCESSING_PAYMENT' 
                ? 'PENDING_LIQUIDATION' 
                : newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [newTimelineEvent, ...oldRequest.timeline],
            nextActionBy: nextActionBy
        };

        requestsDB[requestIndex] = updatedRequest;
        return updatedRequest;
    },

    // New method to get connected requests (advance + liquidation)
    getConnectedRequests: async (requestId: string): Promise<Request[]> => {
        await new Promise(res => setTimeout(res, 300));
        const request = requestsDB.find(r => r.id === requestId);
        if (!request) return [];

        const connected: Request[] = [request];
        
        // If it's an advance, find its liquidation
        if (request.requestType === 'CASH_ADVANCE' && (request as CashAdvanceRequest).liquidationId) {
            const liquidation = requestsDB.find(r => r.id === (request as CashAdvanceRequest).liquidationId);
            if (liquidation) connected.push(liquidation);
        }
        
        // If it's a liquidation, find its advance
        if (request.requestType === 'LIQUIDATION') {
            const advance = requestsDB.find(r => r.id === (request as LiquidationRequest).advanceId);
            if (advance) connected.push(advance);
        }
        
        return connected;
    },

    createReimbursementRequest: async (data: CreateReimbursementDto): Promise<Request> => {
        await new Promise(res => setTimeout(res, 500));
        
        const user = USERS.find(u => u.id === data.employeeId);
        if (!user) throw new Error('User not found');
        
        const manager = USERS.find(u => u.role === 'Manager');
        const finance = USERS.find(u => u.role === 'Finance');
        const ceo = USERS.find(u => u.role === 'CEO');
        
        // ₱20K threshold logic
        const needsCEO = data.amount > 20000;
        
        // Role-based approval workflow
        let initialStatus: RequestStatus;
        let nextActionBy: Role[];
        let approvers: User[];
        let timelineComment: string;
        
        switch (user.role) {
            case 'Employee':
                initialStatus = 'PENDING_VALIDATION';
                nextActionBy = ['Manager'];
                approvers = needsCEO ? [manager!, finance!, ceo!] : [manager!, finance!];
                timelineComment = `Reimbursement request created by employee - awaiting manager validation. ${needsCEO ? 'CEO approval required (amount > ₱20,000).' : ''}`;
                break;
            
            case 'Manager':
                initialStatus = 'PENDING_FINANCE';
                nextActionBy = ['Finance'];
                approvers = needsCEO ? [finance!, ceo!] : [finance!];
                timelineComment = `Manager reimbursement request created - manager validation skipped, forwarded to Finance. ${needsCEO ? 'CEO approval required (amount > ₱20,000).' : ''}`;
                break;
            
            case 'Finance':
                initialStatus = needsCEO ? 'PENDING_CEO' : 'APPROVED';
                nextActionBy = needsCEO ? ['CEO'] : ['Finance'];
                approvers = needsCEO ? [ceo!] : [finance!];
                timelineComment = needsCEO 
                    ? 'Finance reimbursement request created - forwarded directly to CEO for approval (amount > ₱20,000).'
                    : 'Finance reimbursement request created - auto-approved (amount ≤ ₱20,000), ready for payment processing.';
                break;
            
            case 'CEO':
                initialStatus = 'APPROVED';
                nextActionBy = ['Finance'];
                approvers = [finance!];
                timelineComment = 'CEO reimbursement request created - auto-approved, ready for payment processing.';
                break;
            
            default:
                throw new Error('Invalid user role');
        }

        const newRequest: ReimbursementRequest = {
            id: generateRequestId(),
            requestType: 'REIMBURSEMENT',
            employeeName: user.name,
            employeeId: data.employeeId,
            amount: data.amount,
            currency: 'PHP',
            description: data.description,
            category: data.category,
            status: initialStatus,
            priority: data.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvers: approvers,
            nextActionBy: nextActionBy,
            timeline: [{
                id: `timeline-${Date.now()}`,
                stage: 'Request Submitted',
                decision: 'submitted',
                type: 'system',
                actor: { id: user.id, name: user.name, role: user.role },
                timestamp: new Date().toISOString(),
                comment: timelineComment
            }],
            attachments: data.attachments || [],
            expenseDate: data.expenseDate,
            receipts: [],
            businessPurpose: data.businessPurpose
        };

        requestsDB.push(newRequest);
        return newRequest;
    },

    createCashAdvanceRequest: async (data: CreateCashAdvanceDto): Promise<Request> => {
        await new Promise(res => setTimeout(res, 500));
        
        const user = USERS.find(u => u.id === data.employeeId);
        if (!user) throw new Error('User not found');
        
        const manager = USERS.find(u => u.role === 'Manager');
        const finance = USERS.find(u => u.role === 'Finance');
        const ceo = USERS.find(u => u.role === 'CEO');
        
        // ₱20K threshold logic
        const needsCEO = data.estimatedAmount > 20000;
        
        // Role-based approval workflow
        let initialStatus: RequestStatus;
        let nextActionBy: Role[];
        let approvers: User[];
        let timelineComment: string;
        
        switch (user.role) {
            case 'Employee':
                initialStatus = 'PENDING_VALIDATION';
                nextActionBy = ['Manager'];
                approvers = needsCEO ? [manager!, finance!, ceo!] : [manager!, finance!];
                timelineComment = `Cash advance request created by employee - awaiting manager validation. ${needsCEO ? 'CEO approval required (amount > ₱20,000).' : ''}`;
                break;
            
            case 'Manager':
                initialStatus = 'PENDING_FINANCE';
                nextActionBy = ['Finance'];
                approvers = needsCEO ? [finance!, ceo!] : [finance!];
                timelineComment = `Manager cash advance request created - manager validation skipped, forwarded to Finance. ${needsCEO ? 'CEO approval required (amount > ₱20,000).' : ''}`;
                break;
            
            case 'Finance':
                initialStatus = needsCEO ? 'PENDING_CEO' : 'APPROVED';
                nextActionBy = needsCEO ? ['CEO'] : ['Finance'];
                approvers = needsCEO ? [ceo!] : [finance!];
                timelineComment = needsCEO 
                    ? 'Finance cash advance request created - forwarded directly to CEO for approval (amount > ₱20,000).'
                    : 'Finance cash advance request created - auto-approved (amount ≤ ₱20,000), ready for payment processing.';
                break;
            
            case 'CEO':
                initialStatus = 'APPROVED';
                nextActionBy = ['Finance'];
                approvers = [finance!];
                timelineComment = 'CEO cash advance request created - auto-approved, ready for payment processing.';
                break;
            
            default:
                throw new Error('Invalid user role');
        }

        const newRequest: CashAdvanceRequest = {
            id: generateRequestId(),
            requestType: 'CASH_ADVANCE',
            employeeName: user.name,
            employeeId: data.employeeId,
            amount: data.estimatedAmount,
            currency: 'PHP',
            description: data.description,
            category: data.category,
            status: initialStatus,
            priority: data.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvers: approvers,
            nextActionBy: nextActionBy,
            timeline: [{
                id: `timeline-${Date.now()}`,
                stage: 'Request Submitted',
                decision: 'submitted',
                type: 'system',
                actor: { id: user.id, name: user.name, role: user.role },
                timestamp: new Date().toISOString(),
                comment: timelineComment
            }],
            attachments: [],
            plannedExpenseDate: data.plannedExpenseDate,
            estimatedAmount: data.estimatedAmount,
            advancePurpose: data.advancePurpose,
            expectedLiquidationDate: data.expectedLiquidationDate
        };

        requestsDB.push(newRequest);
        return newRequest;
    },

    // Create Liquidation Request
    createLiquidationRequest: async (data: CreateLiquidationDto): Promise<Request> => {
        await new Promise(res => setTimeout(res, 500));
        
        const advance = requestsDB.find(r => r.id === data.advanceId && r.requestType === 'CASH_ADVANCE') as CashAdvanceRequest;
        if (!advance) throw new Error('Advance request not found');
        
        const user = USERS.find(u => u.id === advance.employeeId);
        if (!user) throw new Error('User not found');
        
        const finance = USERS.find(u => u.role === 'Finance');
        if (!finance) throw new Error('Finance user not found');

        const remainingAmount = Math.max(0, advance.amount - data.actualAmount);

        const newRequest: LiquidationRequest = {
            id: generateRequestId(),
            requestType: 'LIQUIDATION',
            employeeName: user.name,
            employeeId: advance.employeeId,
            amount: data.actualAmount,
            currency: 'PHP',
            description: data.description,
            category: advance.category,
            status: 'PENDING_FINANCE', // Liquidations go directly to finance
            priority: 'Medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvers: [finance],
            nextActionBy: ['Finance'],
            timeline: [{
                id: `timeline-${Date.now()}`,
                stage: 'Request Submitted',
                decision: 'submitted',
                type: 'system',
                actor: { id: user.id, name: user.name, role: user.role },
                timestamp: new Date().toISOString(),
                comment: 'Liquidation request created by employee.'
            }],
            attachments: data.attachments,
            advanceId: data.advanceId,
            advanceAmount: advance.amount,
            actualAmount: data.actualAmount,
            remainingAmount: remainingAmount,
            receipts: data.attachments,
            liquidationSummary: data.liquidationSummary
        };

        // Update the advance request to link to liquidation and change status
        const advanceIndex = requestsDB.findIndex(r => r.id === data.advanceId);
        if (advanceIndex !== -1) {
            (requestsDB[advanceIndex] as CashAdvanceRequest).liquidationId = newRequest.id;
            // Advance status can remain as PENDING_LIQUIDATION or change to a "liquidation submitted" status
        }

        requestsDB.push(newRequest);
        return newRequest;
    },

    // Get pending advances for liquidation (for current user)
    getPendingAdvancesForUser: async (userId: number): Promise<CashAdvanceRequest[]> => {
        await new Promise(res => setTimeout(res, 300));
        
        const filtered = requestsDB.filter(r => 
            r.requestType === 'CASH_ADVANCE' && 
            r.employeeId === userId && 
            r.status === 'PENDING_LIQUIDATION'
        );
        
        console.log('Filtered advances for user', userId, ':', filtered);
        return filtered as CashAdvanceRequest[];
    }
};