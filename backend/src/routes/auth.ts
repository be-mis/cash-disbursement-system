import express from 'express';
import { LoginDto, ApiResponse, AuthResponse } from '../types';
import { AuthService } from '../services/authService';

const router = express.Router();
const authService = new AuthService();

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const loginData: LoginDto = req.body;
    
    if (!loginData.email || !loginData.password) {
      const response: ApiResponse = {
        success: false,
        error: 'Email and password are required'
      };
      return res.status(400).json(response);
    }

    const authResult = await authService.login(loginData);
    
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password'
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: authResult,
      message: 'Login successful'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Login failed'
    };
    res.status(500).json(response);
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', async (req, res) => {
  try {
    // In a real app, you'd invalidate the token here
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Logout failed'
    };
    res.status(500).json(response);
  }
});

// GET /api/auth/me - Get current user (requires valid token)
router.get('/me', async (req, res) => {
  try {
    // In a real app, you'd extract user ID from JWT token
    const userId = parseInt(req.headers['user-id'] as string || '1');
    
    const user = await authService.getCurrentUser(userId);
    
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: user
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get user information'
    };
    res.status(500).json(response);
  }
});

// POST /api/auth/refresh - Refresh authentication token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      const response: ApiResponse = {
        success: false,
        error: 'Refresh token is required'
      };
      return res.status(400).json(response);
    }

    const authResult = await authService.refreshToken(refreshToken);
    
    if (!authResult) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid refresh token'
      };
      return res.status(401).json(response);
    }

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: authResult,
      message: 'Token refreshed successfully'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Token refresh failed'
    };
    res.status(500).json(response);
  }
});

export default router;