// ============================================================
// CaféFlow POS — Backend API Client (v2.0)
// ============================================================

const API_BASE_URL = 'http://localhost:8000/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export const api = {
  // ── Auth ─────────────────────────────────────────────────
  loginEmployee: (username: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  changePassword: (empId: string, currentPassword: string, newPassword: string) =>
    request<any>(`/auth/change-password?empId=${empId}`, { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // ── Order ID Generation ───────────────────────────────────
  generateOrderId: () => request<{ orderId: string }>('/orders/generate-id'),

  // ── Floors ────────────────────────────────────────────────
  getFloors: () => request<any[]>('/floors'),
  createFloor: (floor: any) => request<any>('/floors', { method: 'POST', body: JSON.stringify(floor) }),
  updateFloor: (id: string, floor: any) => request<any>(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(floor) }),

  // ── Tables ────────────────────────────────────────────────
  getTables: () => request<any[]>('/tables'),
  createTable: (table: any) => request<any>('/tables', { method: 'POST', body: JSON.stringify(table) }),
  updateTable: (id: string, table: any) => request<any>(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(table) }),
  updateTableStatus: (id: string, status: string) =>
    request<any>(`/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Categories ───────────────────────────────────────────
  getCategories: () => request<any[]>('/categories'),
  createCategory: (category: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(category) }),
  updateCategory: (id: string, category: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // ── Products ──────────────────────────────────────────────
  getProducts: () => request<any[]>('/products'),
  createProduct: (product: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, product: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // ── Customers ─────────────────────────────────────────────
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (customer: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  updateCustomer: (id: string, customer: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),
  updateCustomerStats: (id: string, stats: { totalSpent: number; totalVisits: number; loyaltyTier: string; lastVisit: string }) =>
    request<any>(`/customers/${id}/stats`, { method: 'PATCH', body: JSON.stringify(stats) }),
  deleteCustomer: (id: string) => request<any>(`/customers/${id}`, { method: 'DELETE' }),

  // ── Employees ─────────────────────────────────────────────
  getEmployees: () => request<any[]>('/employees'),
  createEmployee: (employee: any) => request<any>('/employees', { method: 'POST', body: JSON.stringify(employee) }),
  updateEmployee: (id: string, employee: any) => request<any>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(employee) }),
  archiveEmployee: (id: string) => request<any>(`/employees/${id}/archive`, { method: 'PATCH' }),
  deleteEmployee: (id: string) => request<any>(`/employees/${id}`, { method: 'DELETE' }),

  // ── Orders ────────────────────────────────────────────────
  getOrders: () => request<any[]>('/orders'),
  createOrder: (order: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(order) }),
  updateOrder: (id: string, order: any) => request<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(order) }),
  updateOrderStatus: (id: string, status: string) =>
    request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Payments ──────────────────────────────────────────────
  getPayments: () => request<any[]>('/payments'),
  createPayment: (payment: any) => request<any>('/payments', { method: 'POST', body: JSON.stringify(payment) }),

  // ── KDS Tickets ───────────────────────────────────────────
  getKDSTickets: () => request<any[]>('/kds-tickets'),
  createKDSTicket: (ticket: any) => request<any>('/kds-tickets', { method: 'POST', body: JSON.stringify(ticket) }),
  updateKDSTicketStatus: (id: string, status: string) =>
    request<any>(`/kds-tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateKDSItemStatus: (ticketId: string, itemIndex: number, status: string) =>
    request<any>(`/kds-tickets/${ticketId}/items/${itemIndex}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Coupons ───────────────────────────────────────────────
  getCoupons: () => request<any[]>('/coupons'),
  createCoupon: (coupon: any) => request<any>('/coupons', { method: 'POST', body: JSON.stringify(coupon) }),
  updateCoupon: (id: string, coupon: any) => request<any>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(coupon) }),
  deleteCoupon: (id: string) => request<any>(`/coupons/${id}`, { method: 'DELETE' }),
  validateCoupon: (code: string, orderAmount: number) =>
    request<any>('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, orderAmount }) }),
  earnCoupon: (customerId: string, orderTotal: number, customerName?: string) =>
    request<any>('/coupons/earn', { method: 'POST', body: JSON.stringify({ customerId, orderTotal, customerName }) }),

  // ── Audit Logs ────────────────────────────────────────────
  createAuditLog: (log: any) => request<any>('/audit-logs', { method: 'POST', body: JSON.stringify(log) }),
};
