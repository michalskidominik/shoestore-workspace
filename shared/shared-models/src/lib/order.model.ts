import { User } from './user.model';

export type OrderStatus = 'placed' | 'processing' | 'completed' | 'cancelled';

export interface OrderItem {
  shoeId: number;
  shoeCode: string;
  shoeName: string;
  size: number;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: number;
  userId: number;
  user?: User;
  date: string; // ISO
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
}

export interface OrderCreateDto {
  userId?: number;
  // gdy nie podamy userId, serwer spodziewa się dodatkowych danych klienta:
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestShippingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  guestBillingAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: { shoeId: number; size: number; quantity: number }[];
}

export interface OrderUpdateStatusDto {
  status: OrderStatus;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  search?: string; // np. szukaj po kodzie użytkownika lub ID
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'status' | 'totalAmount';
  sortDirection?: 'asc' | 'desc';
}
