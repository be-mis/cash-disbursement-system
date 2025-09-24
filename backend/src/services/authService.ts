import { LoginDto, AuthResponse, User } from '../types';
import { UserService } from './userService';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private userService = new UserService();
  
  // Empty password storage - In a real app, use bcrypt and secure password hashing
  private passwords: Record<string, string> = {};

  // Mock active sessions - In a real app, use Redis or database
  private activeSessions: Map<string, { userId: number, expiresAt: Date }> = new Map();

  async login(loginData: LoginDto): Promise<AuthResponse | null> {
    try {
      const user = await this.userService.getUserByEmail(loginData.email);
      if (!user) {
        return null;
      }

      const storedPassword = this.passwords[loginData.email.toLowerCase()];
      if (!storedPassword || storedPassword !== loginData.password) {
        return null;
      }

      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      this.activeSessions.set(token, {
        userId: user.id,
        expiresAt
      });

      return {
        user,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  async getCurrentUser(userId: number): Promise<User | null> {
    return await this.userService.getUserById(userId);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse | null> {
    try {
      const session = this.activeSessions.get(refreshToken);
      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      const user = await this.userService.getUserById(session.userId);
      if (!user) {
        return null;
      }

      const newToken = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      this.activeSessions.delete(refreshToken);
      this.activeSessions.set(newToken, {
        userId: user.id,
        expiresAt
      });

      return {
        user,
        token: newToken,
        expiresAt
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  private generateToken(): string {
    return `token_${uuidv4()}_${Date.now()}`;
  }
}