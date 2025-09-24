import express from 'express';
import { User, ApiResponse, Role } from '../types';
import { UserService } from '../services/userService';

const router = express.Router();
const userService = new UserService();

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    const response: ApiResponse<User[]> = {
      success: true,
      data: users
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await userService.getUserById(userId);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user'
    };
    res.status(500).json(response);
  }
});

// GET /api/users/role/:role - Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const role = req.params.role as Role;
    const users = await userService.getUsersByRole(role);
    
    const response: ApiResponse<User[]> = {
      success: true,
      data: users
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch users by role'
    };
    res.status(500).json(response);
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, role, department } = req.body;
    
    if (!name || !email || !role) {
      const response: ApiResponse = {
        success: false,
        error: 'Name, email, and role are required'
      };
      return res.status(400).json(response);
    }

    const user = await userService.createUser({ name, email, role, department });
    
    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'User created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create user'
    };
    res.status(500).json(response);
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.body;
    
    const user = await userService.updateUser(userId, updates);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'User updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update user'
    };
    res.status(500).json(response);
  }
});

export default router;