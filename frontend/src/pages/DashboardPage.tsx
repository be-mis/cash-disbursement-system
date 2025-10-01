import React from 'react';
import { User, Request, RequestStatus, RequestType, CashAdvanceRequest, LiquidationRequest } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import { formatPeso, formatDate } from '../utils/formatters';
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_COLORS } from '../utils/constants';

interface DashboardPageProps {
  currentUser: User;
  requests: Request[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, requests }) => {
    const userRequests = requests.filter(r => r.employeeId === currentUser.id);
    const inboxCount = requests.filter(r => r.nextActionBy.includes(currentUser.role)).length;
    
    const totalReimbursed = userRequests
        .filter(r => r.requestType === 'REIMBURSEMENT' && r.status === 'PAID')
        .reduce((sum, r) => sum + r.amount, 0);
        
    const pendingRequests = userRequests.filter(r => 
        !['PAID', 'REJECTED', 'LIQUIDATED'].includes(r.status)
    );
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

    // New: Get request type breakdown
    const getRequestTypeStats = () => {
        const typeStats: { [key in RequestType]: { count: number; amount: number } } = {
            REIMBURSEMENT: { count: 0, amount: 0 },
            CASH_ADVANCE: { count: 0, amount: 0 },
            LIQUIDATION: { count: 0, amount: 0 }
        };

        userRequests.forEach(req => {
            typeStats[req.requestType].count++;
            if (req.status === 'PAID') {
                typeStats[req.requestType].amount += req.amount;
            }
        });

        return typeStats;
    };

    // New: Get pending liquidations count
    const getPendingLiquidations = () => {
        return userRequests.filter(r => 
            r.requestType === 'CASH_ADVANCE' && 
            r.status === 'PENDING_LIQUIDATION'
        ).length;
    };

    // ✅ FIXED: Now shows only the current user's request statuses
    const getStatusCounts = () => {
        const counts: { [key in RequestStatus]?: number } = {};
        userRequests.forEach(req => {  // ✅ Changed from 'requests' to 'userRequests'
            counts[req.status] = (counts[req.status] || 0) + 1;
        });
        return Object.entries(counts).sort(([a], [b]) => {
            // Sort by priority: pending statuses first, then completed
            const priority: { [key: string]: number } = {
                'PENDING_VALIDATION': 1,
                'PENDING_FINANCE': 2,
                'PENDING_CEO': 3,
                'PENDING_APPROVAL': 4,
                'PENDING_LIQUIDATION': 5,
                'APPROVED': 6,
                'PROCESSING_PAYMENT': 7,
                'PAID': 8,
                'REJECTED': 9
            };
            return (priority[a] || 99) - (priority[b] || 99);
        });
    };

    const statusCounts = getStatusCounts();
    const requestTypeStats = getRequestTypeStats();
    const pendingLiquidations = getPendingLiquidations();

    // Helper to render request type badge
    const RequestTypeBadge: React.FC<{ type: RequestType }> = ({ type }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-md border ${REQUEST_TYPE_COLORS[type]}`}>
            {REQUEST_TYPE_LABELS[type]}
        </span>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Welcome, {currentUser.name}!</h1>
                <p className="text-muted-foreground">Here's a summary of your activity and the company's current request status.</p>
                {currentUser.department && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {currentUser.role} • {currentUser.department} Department
                    </p>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>My Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{pendingRequests.length}</p>
                        <p className="text-muted-foreground">Totaling {formatPeso(pendingAmount)}</p>
                        {pendingLiquidations > 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                                {pendingLiquidations} advance{pendingLiquidations > 1 ? 's' : ''} awaiting liquidation
                            </p>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Total Reimbursed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatPeso(totalReimbursed)}</p>
                        <p className="text-muted-foreground">Across {userRequests.filter(r => r.requestType === 'REIMBURSEMENT' && r.status === 'PAID').length} requests</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Items in Inbox</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{inboxCount}</p>
                        <p className="text-muted-foreground">Awaiting your action</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Request Types</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(requestTypeStats).map(([type, stats]) => (
                            <div key={type} className="flex justify-between items-center text-sm">
                                <RequestTypeBadge type={type as RequestType} />
                                <span className="font-semibold">{stats.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>My Request Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {statusCounts.length > 0 ? (
                            statusCounts.map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center text-sm">
                                    <StatusBadge status={status as RequestStatus} />
                                    <span className="font-semibold">{count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No requests yet</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Reimbursements:</span>
                            <span className="font-semibold">{formatPeso(requestTypeStats.REIMBURSEMENT.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Cash Advances:</span>
                            <span className="font-semibold">{formatPeso(requestTypeStats.CASH_ADVANCE.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Liquidations:</span>
                            <span className="font-semibold">{formatPeso(requestTypeStats.LIQUIDATION.amount)}</span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>{formatPeso(totalReimbursed)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>My Recent Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3 text-left font-semibold">Request ID</th>
                                    <th className="p-3 text-left font-semibold">Type</th>
                                    <th className="p-3 text-left font-semibold">Description</th>
                                    <th className="p-3 text-left font-semibold">Amount</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                    <th className="p-3 text-left font-semibold">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userRequests.slice(0, 5).map(req => (
                                    <tr key={req.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-mono text-sm">{req.id}</td>
                                        <td className="p-3">
                                            <RequestTypeBadge type={req.requestType} />
                                        </td>
                                        <td className="p-3">
                                            <div>
                                                <p className="font-medium">{req.description}</p>
                                                {req.requestType === 'CASH_ADVANCE' && (req as CashAdvanceRequest).liquidationId && (
                                                    <p className="text-xs text-muted-foreground">
                                                        → Liquidated in {(req as CashAdvanceRequest).liquidationId}
                                                    </p>
                                                )}
                                                {req.requestType === 'LIQUIDATION' && (
                                                    <p className="text-xs text-muted-foreground">
                                                        ← From advance {(req as LiquidationRequest).advanceId}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3">{formatPeso(req.amount)}</td>
                                        <td className="p-3"><StatusBadge status={req.status} /></td>
                                        <td className="p-3">{formatDate(req.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {userRequests.length === 0 && (
                            <p className="text-center p-4 text-muted-foreground">
                                You haven't submitted any requests yet.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardPage;