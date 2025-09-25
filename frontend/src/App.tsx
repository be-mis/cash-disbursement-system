import React, { useState, useEffect } from 'react';
import AuthenticatedApp from './components/AuthenticatedApp';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import RequestsPage from './pages/RequestsPage';
import InboxPage from './pages/InboxPage';
import CreateRequestPage from './pages/CreateRequestPage';
import { Page, User, Request } from './types/types';
import { api } from './services/api';

const App: React.FC = () => {
    return (
        <AuthenticatedApp>
            {(user) => <AuthenticatedContent currentUser={user} />}
        </AuthenticatedApp>
    );
};

// Separate component for the authenticated content
const AuthenticatedContent: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const requestsData = await api.getRequests();
            setRequests(requestsData);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]); // Refetch when user changes (though this won't happen much with auth)

    const handleRequestUpdate = async () => {
        try {
            setIsLoading(true);
            const requestsData = await api.getRequests();
            setRequests(requestsData);
        } catch (err) {
            setError('Failed to refresh requests.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage currentUser={currentUser} requests={requests} />;
            case 'requests':
                return <RequestsPage currentUser={currentUser} onUpdateRequest={handleRequestUpdate} />;
            case 'inbox':
                return <InboxPage currentUser={currentUser} onUpdateRequest={handleRequestUpdate} />;
            case 'create':
                return <CreateRequestPage currentUser={currentUser} onRequestCreated={handleRequestUpdate} />;
            default:
                return <DashboardPage currentUser={currentUser} requests={requests} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Header
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                currentUser={currentUser}
                // Remove user switching props - no longer needed with auth
                onUserChange={() => {}} // Placeholder - will be removed from Header
                users={[]} // Empty - will be removed from Header
            />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {isLoading && <div className="text-center p-8">Loading data...</div>}
                {error && <div className="text-center p-8 text-red-500">{error}</div>}
                {!isLoading && !error && renderPage()}
            </main>
        </div>
    );
};

export default App;