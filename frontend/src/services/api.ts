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

// Expanded mock data with all three request types
const REQUESTS: Request[] = [
    // Reimbursement Requests
    {
        id: 'REQ001',
        requestType: 'REIMBURSEMENT',
        employeeName: 'Alice Johnson',
        employeeId: 1,
        amount: 5000,
        currency: 'PHP',
        description: 'Office supplies for Q3 campaign',
        category: 'Office Supplies',
        status: 'PENDING_CEO',
        priority: 'Medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        approvers: [USERS[1], USERS[2], USERS[3]], // Manager, Finance, CEO
        nextActionBy: ['CEO'],
        timeline: generateTimeline('PENDING_CEO', 'REIMBURSEMENT', USERS[0], USERS[1], USERS[2], USERS[3]),
        attachments: ['receipt-001.pdf', 'invoice-001.pdf'],
        comments: 'Purchased materials for new marketing campaign launch',
        expenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        receipts: ['receipt-office-supplies-001.pdf'],
        businessPurpose: 'Marketing campaign materials for Q3 product launch'
    } as ReimbursementRequest,

    {
        id: 'REQ002',
        requestType: 'REIMBURSEMENT',
        employeeName: 'Emma Davis',
        employeeId: 5,
        amount: 2500,
        currency: 'PHP',
        description: 'Client lunch meeting expenses',
        category: 'Meals',
        status: 'APPROVED',
        priority: 'Low',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        approvers: [USERS[1], USERS[2], USERS[3]],
        nextActionBy: ['Finance'],
        timeline: generateTimeline('APPROVED', 'REIMBURSEMENT', USERS[4], USERS[1], USERS[2], USERS[3]),
        attachments: ['receipt-lunch-002.pdf'],
        expenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        receipts: ['restaurant-receipt-002.pdf'],
        businessPurpose: 'Client relationship building - potential contract discussion'
    } as ReimbursementRequest,

    // Cash Advance Requests
    {
        id: 'REQ003',
        requestType: 'CASH_ADVANCE',
        employeeName: 'Alice Johnson',
        employeeId: 1,
        amount: 15000,
        currency: 'PHP',
        description: 'Business trip to Manila for client meetings',
        category: 'Travel',
        status: 'PENDING_LIQUIDATION',
        priority: 'High',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        approvers: [USERS[1], USERS[2], USERS[3]],
        nextActionBy: ['Employee'], // Waiting for liquidation
        timeline: generateTimeline('PENDING_LIQUIDATION', 'CASH_ADVANCE', USERS[0], USERS[1], USERS[2], USERS[3]),
        plannedExpenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        estimatedAmount: 15000,
        advancePurpose: 'Hotel, meals, and transportation for 3-day client meetings in Manila',
        expectedLiquidationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        liquidationId: 'REQ004' // Links to liquidation request
    } as CashAdvanceRequest,

    // Liquidation Request (connected to advance above)
    {
        id: 'REQ004',
        requestType: 'LIQUIDATION',
        employeeName: 'Alice Johnson',
        employeeId: 1,
        amount: 13500, // Actual amount spent
        currency: 'PHP',
        description: 'Liquidation for Manila business trip',
        category: 'Travel',
        status: 'PENDING_FINANCE',
        priority: 'Medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        approvers: [USERS[1], USERS[2]],
        nextActionBy: ['Finance'],
        timeline: generateTimeline('PENDING_FINANCE', 'LIQUIDATION', USERS[0], USERS[1], USERS[2], USERS[3]),
        attachments: ['hotel-receipt.pdf', 'taxi-receipts.pdf', 'meal-receipts.pdf'],
        advanceId: 'REQ003', // Links back to advance
        advanceAmount: 15000,
        actualAmount: 13500,
        remainingAmount: 1500, // Amount to return
        receipts: ['hotel-manila-receipt.pdf', 'grab-receipts.pdf', 'restaurant-receipts.pdf'],
        liquidationSummary: 'Hotel: ₱8,000, Meals: ₱3,500, Transportation: ₱2,000. Returning ₱1,500 unused advance.'
    } as LiquidationRequest,

    // More sample requests
    {
        id: 'REQ005',
        requestType: 'REIMBURSEMENT',
        employeeName: 'Alice Johnson',
        employeeId: 1,
        amount: 3200,
        currency: 'PHP',
        description: 'Software subscription renewal',
        category: 'Software',
        status: 'REJECTED',
        priority: 'Low',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        approvers: [USERS[1], USERS[2], USERS[3]],
        nextActionBy: [],
        timeline: generateTimeline('REJECTED', 'REIMBURSEMENT', USERS[0], USERS[1], USERS[2], USERS[3]),
        expenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        receipts: ['software-invoice.pdf'],
        businessPurpose: 'Design software renewal for marketing team'
    } as ReimbursementRequest,

    {
        id: 'REQ006',
        requestType: 'CASH_ADVANCE',
        employeeName: 'Emma Davis',
        employeeId: 5,
        amount: 8000,
        currency: 'PHP',
        description: 'Conference attendance in Cebu',
        category: 'Travel',
        status: 'PENDING_VALIDATION',
        priority: 'Medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        approvers: [USERS[1]],
        nextActionBy: ['Manager'],
        timeline: generateTimeline('PENDING_VALIDATION', 'CASH_ADVANCE', USERS[4], USERS[1], USERS[2], USERS[3]),
        plannedExpenseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        estimatedAmount: 8000,
        advancePurpose: 'Sales conference registration, hotel, and meals for 2 days',
        expectedLiquidationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString()
    } as CashAdvanceRequest,

    {
        id: 'REQ007',
        requestType: 'REIMBURSEMENT',
        employeeName: 'Emma Davis',
        employeeId: 5,
        amount: 4500,
        currency: 'PHP',
        description: 'Marketing materials printing',
        category: 'Marketing',
        status: 'PAID',
        priority: 'Medium',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        approvers: [USERS[1], USERS[2], USERS[3]],
        nextActionBy: [],
        timeline: generateTimeline('PAID', 'REIMBURSEMENT', USERS[4], USERS[1], USERS[2], USERS[3]),
        expenseDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
        receipts: ['printing-invoice.pdf'],
        businessPurpose: 'Brochures and flyers for upcoming trade show'
    } as ReimbursementRequest,
];

let requestsDB = [...REQUESTS];

// Helper function to generate new request ID
const generateRequestId = (): string => {
    const existingIds = requestsDB.map(r => parseInt(r.id.replace('REQ', '')));
    const maxId = Math.max(...existingIds);
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

        // Updated workflow: Employee → Manager → Finance → CEO → Payment
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
                nextActionBy = ['Finance'];
                stage = 'CEO Approval';
                decision = 'approved';
                break;
            case 'REJECTED':
                nextActionBy = [];
                stage = 'Rejection';
                decision = 'rejected';
                break;
            case 'PROCESSING_PAYMENT':
                nextActionBy = [];
                stage = 'Payment Processing';
                decision = 'released';
                break;
            case 'PAID':
                nextActionBy = [];
                stage = 'Payment Completed';
                decision = 'released';
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
            status: newStatus,
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

    // Create Reimbursement Request
    createReimbursementRequest: async (data: CreateReimbursementDto): Promise<Request> => {
        await new Promise(res => setTimeout(res, 500));
        
        const user = USERS.find(u => u.id === data.employeeId);
        if (!user) throw new Error('User not found');
        
        const manager = USERS.find(u => u.role === 'Manager');
        if (!manager) throw new Error('Manager not found');

        const newRequest: ReimbursementRequest = {
            id: generateRequestId(),
            requestType: 'REIMBURSEMENT',
            employeeName: user.name,
            employeeId: data.employeeId,
            amount: data.amount,
            currency: 'PHP',
            description: data.description,
            category: data.category,
            status: 'PENDING_VALIDATION',
            priority: data.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvers: [manager],
            nextActionBy: ['Manager'],
            timeline: [{
                id: `timeline-${Date.now()}`,
                stage: 'Request Submitted',
                decision: 'submitted',
                type: 'system',
                actor: { id: user.id, name: user.name, role: user.role },
                timestamp: new Date().toISOString(),
                comment: 'Reimbursement request created by employee.'
            }],
            attachments: data.attachments || [],
            expenseDate: data.expenseDate,
            receipts: [], // Will be populated with actual receipts
            businessPurpose: data.businessPurpose
        };

        requestsDB.push(newRequest);
        return newRequest;
    },

    // Create Cash Advance Request
    createCashAdvanceRequest: async (data: CreateCashAdvanceDto): Promise<Request> => {
        await new Promise(res => setTimeout(res, 500));
        
        const user = USERS.find(u => u.id === data.employeeId);
        if (!user) throw new Error('User not found');
        
        const manager = USERS.find(u => u.role === 'Manager');
        if (!manager) throw new Error('Manager not found');

        const newRequest: CashAdvanceRequest = {
            id: generateRequestId(),
            requestType: 'CASH_ADVANCE',
            employeeName: user.name,
            employeeId: data.employeeId,
            amount: data.estimatedAmount,
            currency: 'PHP',
            description: data.description,
            category: data.category,
            status: 'PENDING_VALIDATION',
            priority: data.priority,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            approvers: [manager],
            nextActionBy: ['Manager'],
            timeline: [{
                id: `timeline-${Date.now()}`,
                stage: 'Request Submitted',
                decision: 'submitted',
                type: 'system',
                actor: { id: user.id, name: user.name, role: user.role },
                timestamp: new Date().toISOString(),
                comment: 'Cash advance request created by employee.'
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
        
        return requestsDB.filter(r => 
            r.requestType === 'CASH_ADVANCE' && 
            r.employeeId === userId && 
            r.status === 'PENDING_LIQUIDATION' &&
            !(r as CashAdvanceRequest).liquidationId // No liquidation submitted yet
        ) as CashAdvanceRequest[];
    }
};