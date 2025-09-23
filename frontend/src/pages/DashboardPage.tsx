// Fix: Added full content for pages/DashboardPage.tsx
import React from 'react';
import { User, Request, RequestStatus } from '../types/types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import { formatPeso, formatDate } from '../utils/formatters';

interface DashboardPageProps {
  currentUser: User;
  requests: Request[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, requests }) => {
    const userRequests = requests.filter(r => r.employeeId === currentUser.id);
    const inboxCount = requests.filter(r => r.nextActionBy.includes(currentUser.role)).length;
    
    const totalSpent = userRequests
        .filter(r => r.status === 'PAID')
        .reduce((sum, r) => sum + r.amount, 0);
        
    const pendingAmount = userRequests
        .filter(r => ['PENDING_APPROVAL', 'PENDING_VALIDATION', 'APPROVED', 'PROCESSING_PAYMENT'].includes(r.status))
        .reduce((sum, r) => sum + r.amount, 0);

    const getStatusCounts = () => {
        const counts: { [key in RequestStatus]?: number } = {};
        requests.forEach(req => {
            counts[req.status] = (counts[req.status] || 0) + 1;
        });
        return Object.entries(counts);
    };

    const statusCounts = getStatusCounts();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Welcome, {currentUser.name}!</h1>
            <p className="text-muted-foreground">Here's a summary of your activity and the company's current request status.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardTitle>My Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{userRequests.filter(r => r.status !== 'PAID' && r.status !== 'REJECTED').length}</p>
                        <p className="text-muted-foreground">Totaling {formatPeso(pendingAmount)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Reimbursed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{formatPeso(totalSpent)}</p>
                         <p className="text-muted-foreground">Across {userRequests.filter(r => r.status === 'PAID').length} requests</p>
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
                        <CardTitle>Company-wide Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {statusCounts.map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center text-sm">
                                <StatusBadge status={status as RequestStatus} />
                                <span className="font-semibold">{count}</span>
                            </div>
                        ))}
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
                                    <th className="p-3 text-left font-semibold">Description</th>
                                    <th className="p-3 text-left font-semibold">Amount</th>
                                    <th className="p-3 text-left font-semibold">Status</th>
                                    <th className="p-3 text-left font-semibold">Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userRequests.slice(0, 5).map(req => (
                                    <tr key={req.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{req.id}</td>
                                        <td className="p-3">{req.description}</td>
                                        <td className="p-3">{formatPeso(req.amount)}</td>
                                        <td className="p-3"><StatusBadge status={req.status} /></td>
                                        <td className="p-3">{formatDate(req.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {userRequests.length === 0 && <p className="text-center p-4 text-muted-foreground">You haven't submitted any requests yet.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardPage;