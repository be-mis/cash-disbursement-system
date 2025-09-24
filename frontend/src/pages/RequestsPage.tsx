import React, { useState, useEffect } from 'react';
import { User, Request, RequestType, ReimbursementRequest, CashAdvanceRequest, LiquidationRequest } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import RequestTimeline from '../components/RequestTimeline';
import { formatPeso, formatDate } from '../utils/formatters';
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_COLORS } from '../utils/constants';

interface RequestsPageProps {
  currentUser: User;
  onUpdateRequest: () => void;
}

const RequestsPage: React.FC<RequestsPageProps> = ({ currentUser }) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState<RequestType | 'ALL'>('ALL');
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const data = await api.getRequestsForUser(currentUser);
            setRequests(data);
        } catch (err) {
            setError('Failed to fetch requests.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [currentUser]);
    
    const filteredRequests = requests.filter(req => {
        const matchesText = req.id.toLowerCase().includes(filter.toLowerCase()) ||
            req.description.toLowerCase().includes(filter.toLowerCase()) ||
            req.employeeName.toLowerCase().includes(filter.toLowerCase());
        
        const matchesType = typeFilter === 'ALL' || req.requestType === typeFilter;
        
        return matchesText && matchesType;
    });

    const handleViewDetails = (request: Request) => {
        setSelectedRequest(request);
    };

    const closeModal = () => {
        setSelectedRequest(null);
    };

    // Request type badge component
    const RequestTypeBadge: React.FC<{ type: RequestType }> = ({ type }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-md border ${REQUEST_TYPE_COLORS[type]}`}>
            {REQUEST_TYPE_LABELS[type]}
        </span>
    );

    // Enhanced request details component
    const renderRequestDetails = (request: Request) => {
        const baseDetails = (
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                    <strong>Type:</strong>
                    <RequestTypeBadge type={request.requestType} />
                </div>
                <p><strong>Employee:</strong> {request.employeeName}</p>
                <p><strong>Amount:</strong> {formatPeso(request.amount)}</p>
                <p><strong>Category:</strong> {request.category}</p>
                <p><strong>Priority:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        request.priority === 'High' ? 'bg-red-100 text-red-800' :
                        request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {request.priority}
                    </span>
                </p>
                <p><strong>Submitted:</strong> {formatDate(request.createdAt)}</p>
                <p><strong>Status:</strong> <StatusBadge status={request.status} /></p>
                
                {/* Request type specific fields */}
                {request.requestType === 'REIMBURSEMENT' && (
                    <>
                        <p><strong>Expense Date:</strong> {formatDate((request as ReimbursementRequest).expenseDate)}</p>
                        <p><strong>Business Purpose:</strong> {(request as ReimbursementRequest).businessPurpose}</p>
                        {(request as ReimbursementRequest).receipts.length > 0 && (
                            <div>
                                <strong>Receipts:</strong>
                                <ul className="mt-1 ml-4 text-xs space-y-1">
                                    {(request as ReimbursementRequest).receipts.map((receipt, idx) => (
                                        <li key={idx} className="text-blue-600">• {receipt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {request.requestType === 'CASH_ADVANCE' && (
                    <>
                        <p><strong>Planned Date:</strong> {formatDate((request as CashAdvanceRequest).plannedExpenseDate)}</p>
                        <p><strong>Estimated Amount:</strong> {formatPeso((request as CashAdvanceRequest).estimatedAmount)}</p>
                        <p><strong>Purpose:</strong> {(request as CashAdvanceRequest).advancePurpose}</p>
                        <p><strong>Liquidation Due:</strong> {formatDate((request as CashAdvanceRequest).expectedLiquidationDate)}</p>
                        {(request as CashAdvanceRequest).liquidationId && (
                            <p className="text-green-600 text-xs">
                                <strong>→ Liquidated in:</strong> {(request as CashAdvanceRequest).liquidationId}
                            </p>
                        )}
                    </>
                )}

                {request.requestType === 'LIQUIDATION' && (
                    <>
                        <p className="text-blue-600 text-xs">
                            <strong>← From Advance:</strong> {(request as LiquidationRequest).advanceId}
                        </p>
                        <p><strong>Original Advance:</strong> {formatPeso((request as LiquidationRequest).advanceAmount)}</p>
                        <p><strong>Amount Spent:</strong> {formatPeso((request as LiquidationRequest).actualAmount)}</p>
                        {(request as LiquidationRequest).remainingAmount > 0 && (
                            <p className="text-amber-600">
                                <strong>Amount to Return:</strong> {formatPeso((request as LiquidationRequest).remainingAmount)}
                            </p>
                        )}
                        <div>
                            <strong>Summary:</strong>
                            <p className="mt-1 text-xs bg-gray-50 p-2 rounded">
                                {(request as LiquidationRequest).liquidationSummary}
                            </p>
                        </div>
                        {(request as LiquidationRequest).receipts.length > 0 && (
                            <div>
                                <strong>Supporting Documents:</strong>
                                <ul className="mt-1 ml-4 text-xs space-y-1">
                                    {(request as LiquidationRequest).receipts.map((receipt, idx) => (
                                        <li key={idx} className="text-blue-600">• {receipt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                <div className="pt-2">
                    <strong>Description:</strong>
                    <p className="mt-1 text-xs bg-gray-50 p-2 rounded">{request.description}</p>
                </div>

                {request.attachments && request.attachments.length > 0 && (
                    <div>
                        <strong>Attachments:</strong>
                        <ul className="mt-1 ml-4 text-xs space-y-1">
                            {request.attachments.map((attachment, idx) => (
                                <li key={idx} className="text-blue-600">• {attachment}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );

        return baseDetails;
    };
    
    if (isLoading) return <div className="text-center p-8">Loading requests...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>
                            {currentUser.role === 'Employee' ? 'My Requests' : 'All Company Requests'}
                        </CardTitle>
                        <div className="flex gap-3 items-center">
                            <select 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value as RequestType | 'ALL')}
                                className="px-3 py-1 border rounded-md text-sm"
                            >
                                <option value="ALL">All Types</option>
                                <option value="REIMBURSEMENT">Reimbursement</option>
                                <option value="CASH_ADVANCE">Cash Advance</option>
                                <option value="LIQUIDATION">Liquidation</option>
                            </select>
                            <div className="w-64">
                                <Input 
                                    placeholder="Filter requests..."
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-mono text-sm">{req.id}</TableCell>
                                    <TableCell>
                                        <RequestTypeBadge type={req.requestType} />
                                    </TableCell>
                                    <TableCell>{req.employeeName}</TableCell>
                                    <TableCell>{formatPeso(req.amount)}</TableCell>
                                    <TableCell>{formatDate(req.createdAt)}</TableCell>
                                    <TableCell><StatusBadge status={req.status} /></TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(req)}>
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredRequests.length === 0 && (
                        <p className="text-center p-8 text-muted-foreground">No requests found.</p>
                    )}
                </CardContent>
            </Card>

            {selectedRequest && (
                <Dialog isOpen={!!selectedRequest} onClose={closeModal}>
                    <DialogHeader>
                        <DialogTitle>Request Details - {selectedRequest.id}</DialogTitle>
                    </DialogHeader>
                    <DialogContent className="grid md:grid-cols-2 gap-8 max-w-5xl">
                        <div>
                            <h4 className="font-semibold mb-4">Request Information</h4>
                            {renderRequestDetails(selectedRequest)}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Timeline</h4>
                            <RequestTimeline timeline={selectedRequest.timeline} />
                        </div>
                    </DialogContent>
                    <DialogFooter>
                        <Button variant="secondary" onClick={closeModal}>Close</Button>
                    </DialogFooter>
                </Dialog>
            )}
        </div>
    );
};

export default RequestsPage;