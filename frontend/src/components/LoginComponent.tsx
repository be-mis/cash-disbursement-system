import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginComponentProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LoginComponent: React.FC<LoginComponentProps> = ({ onLogin, isLoading, error }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(credentials);
  };

  const handleDemoLogin = (email: string, password: string) => {
    setCredentials({ email, password });
  };

  const demoUsers = [
    { name: 'Alice Johnson', role: 'Employee', email: 'alice.johnson@company.com', password: 'alice123', department: 'Marketing' },
    { name: 'Emma Davis', role: 'Employee', email: 'emma.davis@company.com', password: 'emma123', department: 'Sales' },
    { name: 'Bob Chen', role: 'Manager', email: 'bob.chen@company.com', password: 'bob123', department: 'Operations' },
    { name: 'Frank Wilson', role: 'Manager', email: 'frank.wilson@company.com', password: 'frank123', department: 'IT' },
    { name: 'Charlie Rodriguez', role: 'Finance', email: 'charlie.rodriguez@company.com', password: 'charlie123', department: 'Finance' },
    { name: 'Diana Park', role: 'CEO', email: 'diana.park@company.com', password: 'diana123', department: 'Executive' },
  ];

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'Employee': 'bg-blue-50 border-blue-200 text-blue-700',
      'Manager': 'bg-green-50 border-green-200 text-green-700',
      'Finance': 'bg-purple-50 border-purple-200 text-purple-700',
      'CEO': 'bg-red-50 border-red-200 text-red-700'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Enterprise Cash Disbursement System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to manage financial requests
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card className="max-w-md mx-auto md:mx-0">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your email"
                      value={credentials.email}
                      onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card className="max-w-md mx-auto md:mx-0">
            <CardHeader>
              <CardTitle>Demo Accounts</CardTitle>
              <p className="text-sm text-gray-600">
                Click any account below to test different user roles
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoUsers.map((user) => (
                  <div
                    key={user.email}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleDemoLogin(user.email, user.password)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.department}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Demo Note:</strong> Click any account above to auto-fill credentials, 
                  then click "Sign in" to test that role's permissions and workflow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Enterprise Cash Disbursement Management System • Built with React & TypeScript
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;