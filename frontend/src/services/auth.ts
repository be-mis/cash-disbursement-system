// auth.ts - Authentication service
import { User, Role } from '../types/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthToken {
  token: string;
  user: User;
  expiresAt: string;
}

// Demo credentials for each role
const DEMO_CREDENTIALS = [
  { email: 'alice.johnson@company.com', password: 'alice123', userId: 1 },
  { email: 'bob.chen@company.com', password: 'bob123', userId: 2 },
  { email: 'charlie.rodriguez@company.com', password: 'charlie123', userId: 3 },
  { email: 'diana.park@company.com', password: 'diana123', userId: 4 },
  { email: 'emma.davis@company.com', password: 'emma123', userId: 5 },
  { email: 'frank.wilson@company.com', password: 'frank123', userId: 6 },
];

const USERS: User[] = [
  { id: 1, name: 'Alice Johnson', role: 'Employee', email: 'alice.johnson@company.com', department: 'Marketing' },
  { id: 2, name: 'Bob Chen', role: 'Manager', email: 'bob.chen@company.com', department: 'Operations' },
  { id: 3, name: 'Charlie Rodriguez', role: 'Finance', email: 'charlie.rodriguez@company.com', department: 'Finance' },
  { id: 4, name: 'Diana Park', role: 'CEO', email: 'diana.park@company.com', department: 'Executive' },
  { id: 5, name: 'Emma Davis', role: 'Employee', email: 'emma.davis@company.com', department: 'Sales' },
  { id: 6, name: 'Frank Wilson', role: 'Manager', email: 'frank.wilson@company.com', department: 'IT' },
];

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.loadFromStorage();
  }

  async login(credentials: LoginCredentials): Promise<AuthToken> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call

    const credential = DEMO_CREDENTIALS.find(
      c => c.email === credentials.email && c.password === credentials.password
    );

    if (!credential) {
      throw new Error('Invalid email or password');
    }

    const user = USERS.find(u => u.id === credential.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate simple JWT-like token
    const tokenPayload = {
      userId: user.id,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    const token = btoa(JSON.stringify(tokenPayload));
    const expiresAt = new Date(tokenPayload.exp).toISOString();

    // Store in memory and localStorage
    this.currentUser = user;
    this.token = token;
    this.tokenExpiry = new Date(tokenPayload.exp);
    this.saveToStorage();

    return { token, user, expiresAt };
  }

  logout(): void {
    this.currentUser = null;
    this.token = null;
    this.tokenExpiry = null;
    this.clearStorage();
  }

  getCurrentUser(): User | null {
    if (this.isTokenExpired()) {
      this.logout();
      return null;
    }
    return this.currentUser;
  }

  getToken(): string | null {
    if (this.isTokenExpired()) {
      this.logout();
      return null;
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && !this.isTokenExpired();
  }

  hasRole(role: Role): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return new Date() > this.tokenExpiry;
  }

  private saveToStorage(): void {
    if (this.currentUser && this.token && this.tokenExpiry) {
      const authData = {
        user: this.currentUser,
        token: this.token,
        expiresAt: this.tokenExpiry.toISOString()
      };
      localStorage.setItem('cashflow_auth', JSON.stringify(authData));
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('cashflow_auth');
      if (stored) {
        const authData = JSON.parse(stored);
        this.currentUser = authData.user;
        this.token = authData.token;
        this.tokenExpiry = new Date(authData.expiresAt);

        if (this.isTokenExpired()) {
          this.logout();
        }
      }
    } catch (error) {
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('cashflow_auth');
  }

  // Get all users for demo purposes (admin function)
  getDemoCredentials(): typeof DEMO_CREDENTIALS {
    return DEMO_CREDENTIALS;
  }
}

// Export singleton instance
export const authService = new AuthService();