import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiResponse, User } from '@shoestore/shared-models';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  revenue: number;
}

interface AdminUser {
  id: number;
  email: string;
  role: string;
  lastLogin: string;
}

interface AdminOrder {
  id: number;
  userId: number;
  status: string;
  total: number;
  createdAt: string;
}

interface AdminProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {

  @Get('dashboard')
  getDashboardData(@Request() req: { user: User }): ApiResponse & { user: User; stats: DashboardStats } {
    return {
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      user: req.user,
      stats: {
        totalUsers: 150,
        totalOrders: 450,
        totalProducts: 89,
        revenue: 125000
      }
    };
  }

  @Get('users')
  getUsers(): ApiResponse & { users: AdminUser[] } {
    return {
      success: true,
      message: 'Users retrieved successfully',
      users: [
        {
          id: 1,
          email: 'user1@example.com',
          role: 'user',
          lastLogin: new Date().toISOString()
        },
        {
          id: 2,
          email: 'admin@example.com',
          role: 'admin',
          lastLogin: new Date().toISOString()
        }
      ]
    };
  }

  @Get('orders')
  getOrders(): ApiResponse & { orders: AdminOrder[] } {
    return {
      success: true,
      message: 'Orders retrieved successfully',
      orders: [
        {
          id: 1,
          userId: 1,
          status: 'completed',
          total: 299.99,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 2,
          status: 'pending',
          total: 199.99,
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  @Get('products')
  getProducts(): ApiResponse & { products: AdminProduct[] } {
    return {
      success: true,
      message: 'Products retrieved successfully',
      products: [
        {
          id: 1,
          name: 'Premium Sneakers',
          price: 199.99,
          stock: 45,
          category: 'Sneakers'
        },
        {
          id: 2,
          name: 'Leather Boots',
          price: 299.99,
          stock: 23,
          category: 'Boots'
        }
      ]
    };
  }
}
