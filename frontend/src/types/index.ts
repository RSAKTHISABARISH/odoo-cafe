// ============================================================
// CaféFlow POS — Type Definitions (Odoo-aligned schema)
// ============================================================

export interface Floor {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

export interface Table {
  id: string;
  floorId: string;
  number: number;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  shape: 'square' | 'round' | 'rectangle';
  x: number;
  y: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  productCount?: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  description: string;
  tags: string[];
  preparationTime?: number; // minutes
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  avatar?: string;
  createdAt: string;
  lastVisit?: string;
}

export type EmployeeRole = 'admin' | 'manager' | 'waiter' | 'kitchen';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  username: string;
  password?: string; // Optional on client side for security after login
  avatar: string;
  active: boolean;
  email: string;
  phone: string;
  hireDate: string;
}

export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderLine {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableName: string;
  customerId?: string;
  customerName?: string;
  employeeId: string;
  employeeName: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  total: number;
  couponId?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  reference?: string;
}

export type KDSStatus = 'queued' | 'preparing' | 'ready' | 'served';

export interface KDSTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  items: {
    name: string;
    quantity: number;
    notes: string;
    status: KDSStatus;
  }[];
  status: KDSStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  priority: 'normal' | 'rush';
}

export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  usageCount: number;
  usageLimit: number;
  description: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  tableUtilization: number;
  topProducts: { name: string; count: number; revenue: number }[];
  hourlyRevenue: { hour: string; revenue: number; orders: number }[];
  revenueByCategory: { name: string; value: number }[];
  weeklyTrend: { day: string; revenue: number; orders: number }[];
  activeOrders: number;
  customersToday: number;
  peakHour: string;
  avgPrepTime: number;
}

export interface AppSettings {
  restaurantName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  theme: 'light' | 'dark';
  language: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: Employee | null;
  role: EmployeeRole | null;
}
