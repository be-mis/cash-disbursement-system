import React, { useState, useEffect } from 'react';
import { User } from '../types/types';
import { authService } from '../services/auth';
import LoginComponent from '../components/LoginComponent';

// Header component with logout functionality
interface AuthenticatedHeaderProps {
  currentUser: User;
  onLogout: () => void;
}

const AuthenticatedHeader: React.FC<AuthenticatedHeaderProps> = ({ currentUser, onLogout }) => {
  return (
    <header className="bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-sm">CF</span>
          </div>
          <h1 className="text-xl font-bold">CashFlow</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="font-medium">{currentUser.name}</div>
            <div className="text-sm text-gray-400">
              {currentUser.role} • {currentUser.department}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

// Main authenticated application wrapper
interface AuthenticatedAppProps {
  children: (user: User) => React.ReactNode;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check for existing authentication on app load
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setIsLoggingIn(true);
    setLoginError(null);
    
    try {
      const authResult = await authService.login(credentials);
      setUser(authResult.user);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setLoginError(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <LoginComponent
        onLogin={handleLogin}
        isLoading={isLoggingIn}
        error={loginError}
      />
    );
  }

  // Show authenticated application
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader currentUser={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 px-4">
        {children(user)}
      </main>
    </div>
  );
};

export default AuthenticatedApp;