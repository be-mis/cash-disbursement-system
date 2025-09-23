// Fix: Added full content for pages/RequestsPage.tsx
import React, { useState, useEffect } from 'react';
import { User, Request } from '../types/types';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../components/ui';
import StatusBadge from '../components/StatusBadge';
import RequestTimeline from '../components/RequestTimeline';
import { formatPeso, formatDate } from '../utils/formatters';

interface RequestsPageProps {
  currentUser: User;
  onUpdateRequest: () => void;
}

const RequestsPage: React.FC<RequestsPageProps> = ({ currentUser }) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
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
    
    const filteredRequests = requests.filter(req => 
        req.id.toLowerCase().includes(filter.toLowerCase()) ||
        req.description.toLowerCase().includes(filter.toLowerCase()) ||
        req.employeeName.toLowerCase().includes(filter.toLowerCase())
    );

    const handleViewDetails = (request: Request) => {
        setSelectedRequest(request);
    };

    const closeModal = () => {
        setSelectedRequest(null);
    }
    
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
                        <div className="w-1/3">
                            <Input 
                                placeholder="Filter requests..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request ID</TableHead>
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
                                    <TableCell className="font-medium">{req.id}</TableCell>
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
        </div>
    );
};

export default RequestsPage;