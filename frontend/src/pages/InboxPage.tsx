import React, { useState, useEffect } from 'react';
import { User, Request, RequestStatus, RequestType, ReimbursementRequest, CashAdvanceRequest, LiquidationRequest } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, Textarea, Label } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import RequestTimeline from '../components/RequestTimeline';
import { formatPeso, formatDate } from '../utils/formatters';
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_COLORS } from '../utils/constants';

interface InboxPageProps {
  currentUser: User;
  onUpdateRequest: () => void;
}

const InboxPage: React.FC<InboxPageProps> = ({ currentUser, onUpdateRequest }) => {
    const [inboxItems, setInboxItems] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'validate' | 'process_payment' | 'mark_paid' | null>(null);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchInbox = async () => {
        try {
            setIsLoading(true);
            const data = await api.getInboxForUser(currentUser);
            setInboxItems(data);
        } catch (err) {
            setError('Failed to fetch inbox items.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInbox();
    }, [currentUser]);

    const handleViewDetails = (request: Request) => {
        setSelectedRequest(request);
    };

    const openActionModal = (request: Request, type: 'approve' | 'reject' | 'validate' | 'process_payment' | 'mark_paid') => {
        setSelectedRequest(request);
        setActionType(type);
        setIsActionModalOpen(true);
    };
    
    const closeModal = () => {
        setSelectedRequest(null);
        setIsActionModalOpen(false);
        setActionType(null);
        setComment('');
    }

    // Request type badge component
    const RequestTypeBadge: React.FC<{ type: RequestType }> = ({ type }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-md border ${REQUEST_TYPE_COLORS[type]}`}>
            {REQUEST_TYPE_LABELS[type]}
        </span>
    );

    // Enhanced request details for modal
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
                    </>
                )}

                {request.requestType === 'CASH_ADVANCE' && (
                    <>
                        <p><strong>Planned Date:</strong> {formatDate((request as CashAdvanceRequest).plannedExpenseDate)}</p>
                        <p><strong>Purpose:</strong> {(request as CashAdvanceRequest).advancePurpose}</p>
                        <p><strong>Liquidation Due:</strong> {formatDate((request as CashAdvanceRequest).expectedLiquidationDate)}</p>
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
                    </>
                )}

                <div className="pt-2">
                    <strong>Description:</strong>
                    <p className="mt-1 text-xs bg-gray-50 p-2 rounded">{request.description}</p>
                </div>
            </div>
        );

        return baseDetails;
    };

    const getPossibleActions = (request: Request): { label: string, action: () => void, variant: 'primary' | 'destructive' | 'secondary' }[] => {
        const status = request.status;
        const role = currentUser.role;

        // Updated workflow: Manager → Finance → CEO → Payment
        if (role === 'Manager' && status === 'PENDING_VALIDATION') {
            return [
                { label: 'Validate & Forward', action: () => openActionModal(request, 'validate'), variant: 'primary' },
                { label: 'Reject', action: () => openActionModal(request, 'reject'), variant: 'destructive' }
            ];
        }
        
        if (role === 'Finance' && status === 'PENDING_FINANCE') {
            const label = request.amount > 20000 
                ? 'Approve & Forward to CEO' 
                : 'Approve & Process Payment';
            
            return [
                { label, action: () => openActionModal(request, 'approve'), variant: 'primary' },
                { label: 'Reject', action: () => openActionModal(request, 'reject'), variant: 'destructive' }
            ];
        }
        
        if (role === 'CEO' && status === 'PENDING_CEO') {
            return [
                { label: 'Final Approval', action: () => openActionModal(request, 'approve'), variant: 'primary' },
                { label: 'Reject', action: () => openActionModal(request, 'reject'), variant: 'destructive' }
            ];
        }
        
        if (role === 'Finance' && status === 'APPROVED') {
            return [
                { label: 'Process Payment', action: () => openActionModal(request, 'process_payment'), variant: 'primary' }
            ];
        }
        
        if (role === 'Finance' && status === 'PROCESSING_PAYMENT') {
            return [
                { label: 'Mark as Paid', action: () => openActionModal(request, 'mark_paid'), variant: 'primary' }
            ];
        }

        return [];
    };

    const getActionButtonText = (actionType: string) => {
        switch(actionType) {
            case 'validate': return 'Validate';
            case 'approve': return 'Approve';
            case 'reject': return 'Reject';
            case 'process_payment': return 'Process Payment';
            case 'mark_paid': return 'Mark as Paid';
            default: return 'Confirm';
        }
    };
    
    const handleActionSubmit = async () => {
        if (!selectedRequest || !actionType) return;
        
        setIsSubmitting(true);
        let newStatus: RequestStatus | null = null;
        
        // Updated workflow status transitions
        switch(actionType) {
            case 'validate':
                newStatus = 'PENDING_FINANCE';
                break;
            case 'approve':
                if (currentUser.role === 'Finance') {
                    // Check amount to decide next status
                    if (selectedRequest.amount > 20000) {
                        newStatus = 'PENDING_CEO';
                    } else {
                        newStatus = 'APPROVED'; // ✅ Go directly to APPROVED for small amounts
                    }
                } else if (currentUser.role === 'CEO') {
                    newStatus = 'APPROVED';
                }
                break;
            case 'reject':
                newStatus = 'REJECTED';
                break;
            case 'process_payment':
                newStatus = 'PROCESSING_PAYMENT';
                break;
            case 'mark_paid':
                newStatus = 'PAID';
                break;
        }
        
        if (!newStatus) {
            console.error("Could not determine new status");
            setIsSubmitting(false);
            return;
        }

        try {
            await api.updateRequestStatus(selectedRequest.id, newStatus, currentUser, comment);
            await fetchInbox();
            onUpdateRequest(); // Notify App.tsx to refetch all data
            closeModal();
        } catch (err) {
            setError("Failed to update request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInboxSummary = () => {
        const byType = inboxItems.reduce((acc, item) => {
            acc[item.requestType] = (acc[item.requestType] || 0) + 1;
            return acc;
        }, {} as Record<RequestType, number>);

        const byStatus = inboxItems.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<RequestStatus, number>);

        return { byType, byStatus };
    };

    const summary = getInboxSummary();
    
    if (isLoading) return <div className="text-center p-8">Loading inbox...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">My Inbox</h1>
                <p className="text-muted-foreground">These items are waiting for your review and action.</p>
                {inboxItems.length > 0 && (
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>{inboxItems.length} total items</span>
                        {Object.entries(summary.byType).map(([type, count]) => (
                            count > 0 && <span key={type}>{count} {REQUEST_TYPE_LABELS[type as RequestType].toLowerCase()}</span>
                        ))}
                    </div>
                )}
            </div>

            {inboxItems.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📥</span>
                        </div>
                        <p className="text-lg font-semibold">Your inbox is empty!</p>
                        <p className="text-muted-foreground">There are no pending actions for you at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {inboxItems.map(req => (
                        <Card key={req.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-mono">{req.id}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{req.employeeName}</p>
                                        <RequestTypeBadge type={req.requestType} />
                                    </div>
                                    <div className="text-right">
                                        <StatusBadge status={req.status} />
                                        {req.priority === 'High' && (
                                            <div className="mt-1">
                                                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded font-medium">
                                                    High Priority
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="font-semibold text-2xl">{formatPeso(req.amount)}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{req.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Submitted: {formatDate(req.createdAt)}
                                </p>
                                {req.requestType === 'LIQUIDATION' && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        From advance: {(req as LiquidationRequest).advanceId}
                                    </p>
                                )}
                            </CardContent>
                            <div className="p-4 border-t flex justify-between items-center space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(req)}>
                                    View Details
                                </Button>
                                <div className="flex space-x-2">
                                {getPossibleActions(req).map(action => (
                                    <Button key={action.label} variant={action.variant} size="sm" onClick={action.action}>
                                        {action.label}
                                    </Button>
                                ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            
            {selectedRequest && !isActionModalOpen && (
                <Dialog isOpen={!!selectedRequest && !isActionModalOpen} onClose={closeModal}>
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

            {isActionModalOpen && selectedRequest && (
                 <Dialog isOpen={isActionModalOpen} onClose={closeModal}>
                    <DialogHeader>
                        <DialogTitle className="capitalize">
                            {getActionButtonText(actionType!)} Request {selectedRequest.id}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogContent>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <RequestTypeBadge type={selectedRequest.requestType} />
                                    <span className="text-sm text-muted-foreground">•</span>
                                    <span className="text-sm font-medium">{selectedRequest.employeeName}</span>
                                </div>
                                <p className="font-semibold text-lg">{formatPeso(selectedRequest.amount)}</p>
                                <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                                You are about to <strong>{actionType}</strong> this request. 
                                {actionType === 'validate' && ' This will forward it to Finance for review.'}
                                {actionType === 'approve' && currentUser.role === 'Finance' && (
                                    selectedRequest.amount > 20000 
                                    ? ' This will forward it to CEO for final approval.'
                                    : ' This will mark it as approved and ready for payment.'
                                )}
                                {actionType === 'approve' && currentUser.role === 'CEO' && ' This will mark it ready for payment processing.'}
                                {actionType === 'process_payment' && ' This will begin payment processing.'}
                                {actionType === 'mark_paid' && ' This will complete the request as paid.'}
                                {actionType === 'reject' && ' This will close the request as rejected.'}
                            </p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="comment">
                                    Comment {actionType === 'reject' ? '(required)' : '(optional)'}
                                </Label>
                                <Textarea 
                                    id="comment"
                                    placeholder={
                                        actionType === 'reject' ? "Please explain why this request is being rejected..." :
                                        "Add a reason or comment..."
                                    }
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    required={actionType === 'reject'}
                                />
                            </div>
                        </div>
                    </DialogContent>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
                        <Button 
                            onClick={handleActionSubmit} 
                            disabled={isSubmitting || (actionType === 'reject' && !comment.trim())}
                            variant={actionType === 'reject' ? 'destructive' : 'primary'}
                        >
                            {isSubmitting ? 'Processing...' : getActionButtonText(actionType!)}
                        </Button>
                    </DialogFooter>
                </Dialog>
            )}

        </div>
    );
};

export default InboxPage;