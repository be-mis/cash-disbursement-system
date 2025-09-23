import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import RequestsPage from './pages/RequestsPage';
import InboxPage from './pages/InboxPage';
import { Page, User, Request } from './types/types';
import { api } from './services/api';

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [usersData, requestsData] = await Promise.all([
                api.getUsers(),
                api.getRequests()
            ]);
            setUsers(usersData);
            if (!currentUser && usersData.length > 0) {
                setCurrentUser(usersData[0]);
            }
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
    }, []);

    const handleUserChange = (userId: number) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
            setCurrentPage('dashboard'); // Reset to dashboard on user switch
        }
    };
    
    const handleRequestUpdate = async () => {
        // This function will be passed down to child components
        // to trigger a data refresh after an action.
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
    }

    const renderPage = () => {
        if (!currentUser) return <div className="p-8 text-center">Please select a user.</div>;
        
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage currentUser={currentUser} requests={requests} />;
            case 'requests':
                return <RequestsPage currentUser={currentUser} onUpdateRequest={handleRequestUpdate} />;
            case 'inbox':
                return <InboxPage currentUser={currentUser} onUpdateRequest={handleRequestUpdate} />;
            default:
                return <DashboardPage currentUser={currentUser} requests={requests} />;
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-xl">Loading application...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Header
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                currentUser={currentUser}
                onUserChange={handleUserChange}
                users={users}
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