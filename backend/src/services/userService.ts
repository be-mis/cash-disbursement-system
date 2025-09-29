import pool from '../config/database';
import { User, Role } from '../types';

export class UserService {
  // Removed in-memory users array since we're using a database

  async getAllUsers(): Promise<User[]> {
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows as User[];
  }

  async getUserById(id: number): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return (rows as User[])[0] || null;
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE role = ?', [role]);
    return rows as User[];
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { name, email, role, department } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, role, department) VALUES (?, ?, ?, ?)',
      [name, email, role, department || null]
    );
    const insertId = (result as any).insertId;
    return this.getUserById(insertId) as Promise<User>;
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    await pool.execute(`UPDATE users SET ${fields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return this.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);
    return (rows as User[])[0] || null;
  }
}