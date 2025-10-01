import express from 'express';
import { Request, ApiResponse, CreateRequestDto, UpdateRequestStatusDto, RequestFilters, PaginationQuery } from '../types';
import { RequestService } from '../services/requestService';

const router = express.Router();
const requestService = new RequestService();

// GET /api/requests - Get all requests with optional filtering and pagination
router.get('/', async (req, res) => {
  try {
    const filters: RequestFilters = {
      status: req.query.status as any,
      category: req.query.category as any,
      employeeId: req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      urgency: req.query.urgency as any
    };

    const pagination: PaginationQuery = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc'
    };

    const { requests, totalCount } = await requestService.getAllRequests(filters, pagination);
    
    const response: ApiResponse<{requests: Request[], totalCount: number, currentPage: number}> = {
      success: true,
      data: {
        requests,
        totalCount,
        currentPage: pagination.page!
      }
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch requests'
    };
    res.status(500).json(response);
  }
});

// GET /api/requests/:id - Get request by ID
router.get('/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await requestService.getRequestById(requestId);
    
    if (!request) {
      const response: ApiResponse = {
        success: false,
        error: 'Request not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Request> = {
      success: true,
      data: request
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch request'
    };
    res.status(500).json(response);
  }
});

// GET /api/requests/user/:userId - Get requests for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const requests = await requestService.getRequestsByUser(userId);
    
    const response: ApiResponse<Request[]> = {
      success: true,
      data: requests
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch user requests'
    };
    res.status(500).json(response);
  }
});

// GET /api/requests/inbox/:userId - Get inbox items for a user (requests requiring their action)
router.get('/inbox/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const inboxItems = await requestService.getInboxForUser(userId);
    
    const response: ApiResponse<Request[]> = {
      success: true,
      data: inboxItems
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch inbox items'
    };
    res.status(500).json(response);
  }
});

// POST /api/requests - Create new request
router.post('/', async (req, res) => {
  try {
    const requestData: CreateRequestDto = req.body;
    
    console.log('Received request data:', requestData); // ADD THIS
    
    if (!requestData.employeeId || !requestData.amount || !requestData.category || !requestData.description) {
      const response: ApiResponse = {
        success: false,
        error: 'Employee ID, amount, category, and description are required'
      };
      return res.status(400).json(response);
    }

    if (requestData.amount <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Amount must be greater than 0'
      };
      return res.status(400).json(response);
    }

    const request = await requestService.createRequest(requestData);
    
    const response: ApiResponse<Request> = {
      success: true,
      data: request,
      message: 'Request created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('ERROR CREATING REQUEST:', error); // ADD THIS
    if (error instanceof Error) {
      console.error('Error message:', error.message); // ADD THIS
      console.error('Error stack:', error.stack); // ADD THIS
    }
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create request'
    };
    res.status(500).json(response);
  }
});

// PUT /api/requests/:id/status - Update request status
router.put('/:id/status', async (req, res) => {
  try {
    const requestId = req.params.id;
    const statusUpdate: UpdateRequestStatusDto = req.body;
    
    if (!statusUpdate.status || !statusUpdate.actorId) {
      const response: ApiResponse = {
        success: false,
        error: 'Status and actor ID are required'
      };
      return res.status(400).json(response);
    }

    const request = await requestService.updateRequestStatus(requestId, statusUpdate);
    
    if (!request) {
      const response: ApiResponse = {
        success: false,
        error: 'Request not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<Request> = {
      success: true,
      data: request,
      message: 'Request status updated successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update request status'
    };
    res.status(500).json(response);
  }
});

// DELETE /api/requests/:id - Delete request (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const success = await requestService.deleteRequest(requestId);
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: 'Request not found'
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Request deleted successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete request'
    };
    res.status(500).json(response);
  }
});

// GET /api/requests/stats/dashboard - Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await requestService.getDashboardStats();
    
    const response: ApiResponse = {
      success: true,
      data: stats
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    };
    res.status(500).json(response);
  }
});

export default router;