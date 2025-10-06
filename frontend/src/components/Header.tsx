import React from 'react';
import { ICONS } from '../utils/constants';
import { Page, User } from '../types/types';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, currentUser }) => {
    const navItems: { id: Page; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
...(currentUser.role !== 'President' ? [{
            id: 'create' as Page, 
            label: 'Create Request', 
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>`
        }] : []),
        { id: 'requests', label: 'Requests', icon: ICONS.requests },
        { id: 'inbox', label: 'Inbox', icon: ICONS.inbox },
    ];

    return (
        <header className="bg-primary text-primary-foreground shadow-md border-b border-white/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center space-x-2">
                            <svg role="img" aria-label="CashFlow Logo" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 20 12 20Z" fill="currentColor"/>
                                <path d="M15.99 8.5C15.99 7.67 15.32 7 14.49 7H9.5C8.67 7 8 7.67 8 8.5C8 9.33 8.67 10 9.5 10H13.49L12.24 11.25C11.66 11.83 11.66 12.78 12.24 13.36C12.53 13.65 12.9 13.8 13.27 13.8C13.64 13.8 14.01 13.65 14.3 13.36L15.99 11.67V8.5Z" fill="currentColor"/>
                            </svg>
                            <span className="text-xl font-bold">CDS</span>
                        </div>
                        <nav className="hidden md:flex space-x-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        currentPage === item.id
                                            ? item.id === 'create'
                                                ? 'bg-green-500 text-white font-semibold'
                                                : 'bg-white/20 text-white font-semibold'
                                            : item.id === 'create'
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: item.icon }} />
                                    <span>
                                        {item.label}
                                        {/* Add indicator for non-employees */}
                                        {item.id === 'create' && currentUser.role !== 'Employee' && (
                                            <span className="ml-1 text-xs opacity-75">*</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                         <div className="text-right">
                             <div className="text-sm font-medium text-white">{currentUser.name}</div>
                             <div className="text-xs text-gray-300">
                                {currentUser.role}
                                {currentUser.department && ` • ${currentUser.department}`}
                                {currentUser.role !== 'Employee' && (
                                    <span className="ml-1 text-yellow-300">*Enhanced docs required</span>
                                )}
                             </div>
                         </div>
                    </div>
                </div>
            </div>
            <nav className="md:hidden bg-primary/80">
                <div className="flex justify-around p-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center space-y-1 w-full py-1 rounded-md text-sm font-medium transition-colors ${
                                currentPage === item.id
                                    ? item.id === 'create'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white/20 text-white'
                                    : item.id === 'create'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span dangerouslySetInnerHTML={{ __html: item.icon }} />
                            <span className="text-xs">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </header>
    );
};

export default Header;