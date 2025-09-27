import { Role, RequestStatus, RequestType } from '../types/types';

export const ALL_ROLES: Role[] = ['Employee', 'Manager', 'Finance', 'CEO'];

// Updated status colors to include new workflow statuses
// Updated status colors to include new workflow statuses
export const STATUS_COLORS: Record<RequestStatus, string> = {
    PENDING_VALIDATION: 'bg-yellow-100 text-yellow-800',
    PENDING_FINANCE: 'bg-orange-100 text-orange-800',
    PENDING_CEO: 'bg-indigo-100 text-indigo-800',
    PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PROCESSING_PAYMENT: 'bg-purple-100 text-purple-800',
    PAID: 'bg-gray-100 text-gray-800',
    PENDING_LIQUIDATION: 'bg-amber-100 text-amber-800',
    LIQUIDATED: 'bg-emerald-100 text-emerald-800', // New status
};

// Request type constants
export const REQUEST_TYPES: RequestType[] = ['REIMBURSEMENT', 'CASH_ADVANCE', 'LIQUIDATION'];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    REIMBURSEMENT: 'Reimbursement',
    CASH_ADVANCE: 'Cash Advance',
    LIQUIDATION: 'Liquidation',
};

export const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
    REIMBURSEMENT: 'bg-blue-50 border-blue-200 text-blue-700',
    CASH_ADVANCE: 'bg-green-50 border-green-200 text-green-700',
    LIQUIDATION: 'bg-purple-50 border-purple-200 text-purple-700',
};

// Using SVG strings instead of React elements for better compatibility
export const ICONS = {
    dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
    requests: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>`,
    inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>`,
    // New icons for request types
    reimbursement: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>`,
    advance: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20m9-9H3"/>
    </svg>`,
    liquidation: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="23" y1="11" x2="17" y2="17"/>
        <line x1="17" y1="11" x2="23" y2="17"/>
    </svg>`
};

// Alternative: Simple text icons if you prefer
export const SIMPLE_ICONS = {
    dashboard: '🏠',
    requests: '📄',
    inbox: '📥',
    reimbursement: '💳',
    advance: '💰',
    liquidation: '📊'
};