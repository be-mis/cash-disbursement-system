// Fix: Added full content for pages/InboxPage.tsx
import React, { useState, useEffect } from 'react';
import { User, Request, RequestStatus } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, Textarea, Label } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import RequestTimeline from '../components/RequestTimeline';
import { formatPeso, formatDate } from '../utils/formatters';

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
    const [actionType, setActionType] = useState<'approve' | 'reject' | 'pay' | null>(null);
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

    const openActionModal = (request: Request, type: 'approve' | 'reject' | 'pay') => {
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

    const getPossibleActions = (request: Request): { label: string, action: () => void, variant: 'primary' | 'destructive' | 'secondary' }[] => {
        const status = request.status;
        const role = currentUser.role;

        if (role === 'Manager' && status === 'PENDING_VALIDATION') {
            return [{ label: 'Validate', action: () => openActionModal(request, 'approve'), variant: 'primary' }];
        }
        if (role === 'CEO' && status === 'PENDING_APPROVAL') {
            return [
                { label: 'Approve', action: () => openActionModal(request, 'approve'), variant: 'primary' },
                { label: 'Reject', action: () => openActionModal(request, 'reject'), variant: 'destructive' },
            ];
        }
        if (role === 'Finance' && status === 'APPROVED') {
            return [{ label: 'Mark as Paid', action: () => openActionModal(request, 'pay'), variant: 'primary' }];
        }

        return [];
    };
    
    const handleActionSubmit = async () => {
        if (!selectedRequest || !actionType) return;
        
        setIsSubmitting(true);
        let newStatus: RequestStatus | null = null;
        
        if (currentUser.role === 'Manager' && actionType === 'approve') newStatus = 'PENDING_APPROVAL';
        if (currentUser.role === 'CEO') newStatus = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
        if (currentUser.role === 'Finance' && actionType === 'pay') newStatus = 'PROCESSING_PAYMENT';
        
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
    
    if (isLoading) return <div className="text-center p-8">Loading inbox...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">My Inbox</h1>
            <p className="text-muted-foreground">These items are waiting for your review and action.</p>

            {inboxItems.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-lg font-semibold">Your inbox is empty!</p>
                        <p className="text-muted-foreground">There are no pending actions for you at the moment.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {inboxItems.map(req => (
                        <Card key={req.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{req.id}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{req.employeeName}</p>
                                    </div>
                                    <StatusBadge status={req.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="font-semibold text-2xl">{formatPeso(req.amount)}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                                <p className="text-xs text-muted-foreground mt-2">Submitted: {formatDate(req.createdAt)}</p>
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
                    <DialogContent className="grid md:grid-cols-2 gap-8">
                         <div>
                            <h4 className="font-semibold mb-4">Request Information</h4>
                            <div className="space-y-3 text-sm">
                                <p><strong>Employee:</strong> {selectedRequest.employeeName}</p>
                                <p><strong>Amount:</strong> {formatPeso(selectedRequest.amount)}</p>
                                <p><strong>Category:</strong> {selectedRequest.category}</p>
                                <p><strong>Submitted:</strong> {formatDate(selectedRequest.createdAt)}</p>
                                <p><strong>Status:</strong> <StatusBadge status={selectedRequest.status} /></p>
                                <p className="pt-2"><strong>Description:</strong><br/>{selectedRequest.description}</p>
                            </div>
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
                        <DialogTitle className="capitalize">{actionType} Request {selectedRequest.id}</DialogTitle>
                    </DialogHeader>
                    <DialogContent>
                        <p className="mb-4">You are about to {actionType} this request for <strong>{formatPeso(selectedRequest.amount)}</strong> from {selectedRequest.employeeName}.</p>
                        <div className="space-y-2">
                            <Label htmlFor="comment">Comment (optional)</Label>
                            <Textarea 
                                id="comment"
                                placeholder="Add a reason or comment..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </DialogContent>
                    <DialogFooter>
                        <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
                        <Button 
                            onClick={handleActionSubmit} 
                            disabled={isSubmitting}
                            variant={actionType === 'reject' ? 'destructive' : 'primary'}
                        >
                            {isSubmitting ? 'Submitting...' : `Confirm ${actionType}`}
                        </Button>
                    </DialogFooter>
                </Dialog>
            )}

        </div>
    );
};

export default InboxPage;