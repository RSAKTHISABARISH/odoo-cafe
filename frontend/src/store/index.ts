// ============================================================
// CaféFlow POS — Central Zustand Store (Synced with Backend)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Floor, Table, Category, Product, Customer, Employee,
  Order, OrderLine, Payment, KDSTicket, Coupon,
  AuditLog, AppSettings, AuthState, DashboardMetrics, EmployeeRole,
} from '../types';
import { api } from '../utils/api';

// ── Auth Store ──────────────────────────────────────────────
interface AuthStore extends AuthState {
  login: (employee: Employee) => void;
  logout: () => void;
  hasPermission: (requiredRoles: EmployeeRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      role: null,
      login: (employee) => set({ isAuthenticated: true, currentUser: employee, role: employee.role }),
      logout: () => set({ isAuthenticated: false, currentUser: null, role: null }),
      hasPermission: (requiredRoles) => {
        const { role } = get();
        if (!role) return false;
        if (role === 'admin') return true;
        return requiredRoles.includes(role);
      },
    }),
    { name: 'cafeflow-auth' }
  )
);

// ── Settings Store ──────────────────────────────────────────
interface SettingsStore {
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: {
        restaurantName: 'Velora Café',
        currency: 'INR',
        currencySymbol: '₹',
        taxRate: 5,
        theme: 'dark',
        language: 'en',
      },
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      toggleTheme: () => {
        const current = get().settings.theme;
        set({ settings: { ...get().settings, theme: current === 'dark' ? 'light' : 'dark' } });
      },
    }),
    { name: 'cafeflow-settings' }
  )
);

// ── Product Store ───────────────────────────────────────────
interface ProductStore {
  categories: Category[];
  products: Product[];
  addCategory: (c: Category) => void;
  updateCategory: (id: string, c: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductsByCategory: (categoryId: string) => Product[];
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      categories: [],
      products: [],
      addCategory: async (c) => {
        set({ categories: [...get().categories, c] });
        try { await api.createCategory(c); } catch (e) { console.error(e); }
      },
      updateCategory: async (id, c) => {
        set({ categories: get().categories.map(cat => cat.id === id ? { ...cat, ...c } : cat) });
        try {
          const cat = get().categories.find(item => item.id === id);
          if (cat) await api.updateCategory(id, cat);
        } catch (e) { console.error(e); }
      },
      deleteCategory: async (id) => {
        set({ categories: get().categories.filter(c => c.id !== id) });
        try { await api.deleteCategory(id); } catch (e) { console.error(e); }
      },
      addProduct: async (p) => {
        set({ products: [...get().products, p] });
        try { await api.createProduct(p); } catch (e) { console.error(e); }
      },
      updateProduct: async (id, p) => {
        set({ products: get().products.map(prod => prod.id === id ? { ...prod, ...p } : prod) });
        try {
          const prod = get().products.find(item => item.id === id);
          if (prod) await api.updateProduct(id, prod);
        } catch (e) { console.error(e); }
      },
      deleteProduct: async (id) => {
        set({ products: get().products.filter(p => p.id !== id) });
        try { await api.deleteProduct(id); } catch (e) { console.error(e); }
      },
      getProductsByCategory: (categoryId) => get().products.filter(p => p.categoryId === categoryId && p.available),
    }),
    { name: 'cafeflow-products' }
  )
);

// ── Table Store ─────────────────────────────────────────────
interface TableStore {
  floors: Floor[];
  tables: Table[];
  addFloor: (f: Floor) => void;
  updateFloor: (id: string, f: Partial<Floor>) => void;
  addTable: (t: Table) => void;
  updateTable: (id: string, t: Partial<Table>) => void;
  setTableStatus: (id: string, status: Table['status']) => void;
  getTablesByFloor: (floorId: string) => Table[];
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      floors: [],
      tables: [],
      addFloor: async (f) => {
        set({ floors: [...get().floors, f] });
        try { await api.createFloor(f); } catch (e) { console.error(e); }
      },
      updateFloor: async (id, f) => {
        set({ floors: get().floors.map(fl => fl.id === id ? { ...fl, ...f } : fl) });
        try {
          const floor = get().floors.find(item => item.id === id);
          if (floor) await api.updateFloor(id, floor);
        } catch (e) { console.error(e); }
      },
      addTable: async (t) => {
        set({ tables: [...get().tables, t] });
        try { await api.createTable(t); } catch (e) { console.error(e); }
      },
      updateTable: async (id, t) => {
        set({ tables: get().tables.map(tb => tb.id === id ? { ...tb, ...t } : tb) });
        try {
          const tbl = get().tables.find(item => item.id === id);
          if (tbl) await api.updateTable(id, tbl);
        } catch (e) { console.error(e); }
      },
      setTableStatus: async (id, status) => {
        set({ tables: get().tables.map(t => t.id === id ? { ...t, status } : t) });
        try { await api.updateTableStatus(id, status); } catch (e) { console.error(e); }
      },
      getTablesByFloor: (floorId) => get().tables.filter(t => t.floorId === floorId),
    }),
    { name: 'cafeflow-tables' }
  )
);

// ── Customer Store ──────────────────────────────────────────
interface CustomerStore {
  customers: Customer[];
  addCustomer: (c: Customer) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      addCustomer: async (c) => {
        set({ customers: [...get().customers, c] });
        try { await api.createCustomer(c); } catch (e) { console.error(e); }
      },
      updateCustomer: async (id, c) => {
        set({ customers: get().customers.map(cust => cust.id === id ? { ...cust, ...c } : cust) });
        try {
          const customer = get().customers.find(item => item.id === id);
          if (customer) await api.updateCustomer(id, customer);
        } catch (e) { console.error(e); }
      },
      deleteCustomer: async (id) => {
        set({ customers: get().customers.filter(c => c.id !== id) });
        try { await api.deleteCustomer(id); } catch (e) { console.error(e); }
      },
    }),
    { name: 'cafeflow-customers' }
  )
);

// ── Employee Store ──────────────────────────────────────────
interface EmployeeStore {
  employees: Employee[];
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, e: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      employees: [],
      addEmployee: async (e) => {
        set({ employees: [...get().employees, e] });
        try { await api.createEmployee(e); } catch (e) { console.error(e); }
      },
      updateEmployee: async (id, e) => {
        set({ employees: get().employees.map(emp => emp.id === id ? { ...emp, ...e } : emp) });
        try {
          const emp = get().employees.find(item => item.id === id);
          if (emp) await api.updateEmployee(id, emp);
        } catch (e) { console.error(e); }
      },
      deleteEmployee: async (id) => {
        set({ employees: get().employees.filter(e => e.id !== id) });
        try { await api.deleteEmployee(id); } catch (e) { console.error(e); }
      },
    }),
    { name: 'cafeflow-employees' }
  )
);

// ── Order Store ─────────────────────────────────────────────
const initialOrders: Order[] = [];

interface OrderStore {
  orders: Order[];
  addOrder: (o: Order) => void;
  updateOrder: (id: string, o: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  addOrderLine: (orderId: string, line: OrderLine) => void;
  removeOrderLine: (orderId: string, lineId: string) => void;
  updateOrderLine: (orderId: string, lineId: string, updates: Partial<OrderLine>) => void;
  getOrdersByTable: (tableId: string) => Order[];
  getActiveOrders: () => Order[];
  recalculateOrder: (orderId: string) => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: initialOrders,
      addOrder: async (o) => {
        set({ orders: [o, ...get().orders] });
        try { await api.createOrder(o); } catch (e) { console.error(e); }
      },
      updateOrder: async (id, o) => {
        set({ orders: get().orders.map(ord => ord.id === id ? { ...ord, ...o, updatedAt: new Date().toISOString() } : ord) });
        try {
          const order = get().orders.find(item => item.id === id);
          if (order) await api.createOrder(order);
        } catch (e) { console.error(e); }
      },
      updateOrderStatus: async (id, status) => {
        set({
          orders: get().orders.map(ord => ord.id === id ? { ...ord, status, updatedAt: new Date().toISOString(), paidAt: status === 'paid' ? new Date().toISOString() : ord.paidAt } : ord),
        });
        try { await api.updateOrderStatus(id, status); } catch (e) { console.error(e); }
      },
      addOrderLine: async (orderId, line) => {
        set({
          orders: get().orders.map(ord => {
            if (ord.id !== orderId) return ord;
            const lines = [...ord.lines, line];
            const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
            const tax = Math.round(subtotal * ord.taxRate / 100);
            return { ...ord, lines, subtotal, tax, total: subtotal + tax - ord.discount, updatedAt: new Date().toISOString() };
          }),
        });
        try {
          const order = get().orders.find(item => item.id === orderId);
          if (order) await api.createOrder(order);
        } catch (e) { console.error(e); }
      },
      removeOrderLine: async (orderId, lineId) => {
        set({
          orders: get().orders.map(ord => {
            if (ord.id !== orderId) return ord;
            const lines = ord.lines.filter(l => l.id !== lineId);
            const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
            const tax = Math.round(subtotal * ord.taxRate / 100);
            return { ...ord, lines, subtotal, tax, total: subtotal + tax - ord.discount, updatedAt: new Date().toISOString() };
          }),
        });
        try {
          const order = get().orders.find(item => item.id === orderId);
          if (order) await api.createOrder(order);
        } catch (e) { console.error(e); }
      },
      updateOrderLine: async (orderId, lineId, updates) => {
        set({
          orders: get().orders.map(ord => {
            if (ord.id !== orderId) return ord;
            const lines = ord.lines.map(l => l.id === lineId ? { ...l, ...updates } : l);
            const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
            const tax = Math.round(subtotal * ord.taxRate / 100);
            return { ...ord, lines, subtotal, tax, total: subtotal + tax - ord.discount, updatedAt: new Date().toISOString() };
          }),
        });
        try {
          const order = get().orders.find(item => item.id === orderId);
          if (order) await api.createOrder(order);
        } catch (e) { console.error(e); }
      },
      getOrdersByTable: (tableId) => get().orders.filter(o => o.tableId === tableId && !['paid', 'cancelled'].includes(o.status)),
      getActiveOrders: () => get().orders.filter(o => !['paid', 'cancelled'].includes(o.status)),
      recalculateOrder: (orderId) => set({
        orders: get().orders.map(ord => {
          if (ord.id !== orderId) return ord;
          const subtotal = ord.lines.reduce((sum, l) => sum + l.total, 0);
          const tax = Math.round(subtotal * ord.taxRate / 100);
          return { ...ord, subtotal, tax, total: subtotal + tax - ord.discount };
        }),
      }),
    }),
    { name: 'cafeflow-orders' }
  )
);

// ── Payment Store ───────────────────────────────────────────
interface PaymentStore {
  payments: Payment[];
  addPayment: (p: Payment) => void;
  getPaymentsByOrder: (orderId: string) => Payment[];
}

const initialPayments: Payment[] = [];

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      payments: initialPayments,
      addPayment: async (p) => {
        set({ payments: [...get().payments, p] });
        try { await api.createPayment(p); } catch (e) { console.error(e); }
      },
      getPaymentsByOrder: (orderId) => get().payments.filter(p => p.orderId === orderId),
    }),
    { name: 'cafeflow-payments' }
  )
);

// ── KDS Store ───────────────────────────────────────────────
interface KDSStore {
  tickets: KDSTicket[];
  addTicket: (t: KDSTicket) => void;
  updateTicketStatus: (id: string, status: KDSTicket['status']) => void;
  updateItemStatus: (ticketId: string, itemIndex: number, status: KDSTicket['items'][0]['status']) => void;
}

export const useKDSStore = create<KDSStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      addTicket: async (t) => {
        set({ tickets: [t, ...get().tickets] });
        try { await api.createKDSTicket(t); } catch (e) { console.error(e); }
      },
      updateTicketStatus: async (id, status) => {
        set({
          tickets: get().tickets.map(t => t.id === id ? {
            ...t,
            status,
            startedAt: status === 'preparing' ? new Date().toISOString() : t.startedAt,
            completedAt: status === 'ready' ? new Date().toISOString() : t.completedAt,
            items: t.items.map(item => ({ ...item, status })),
          } : t),
        });
        try { await api.updateKDSTicketStatus(id, status); } catch (e) { console.error(e); }
      },
      updateItemStatus: async (ticketId, itemIndex, status) => {
        set({
          tickets: get().tickets.map(t => {
            if (t.id !== ticketId) return t;
            const items = [...t.items];
            items[itemIndex] = { ...items[itemIndex], status };
            const allReady = items.every(i => i.status === 'ready');
            const anyPreparing = items.some(i => i.status === 'preparing');
            return {
              ...t,
              items,
              status: allReady ? 'ready' : anyPreparing ? 'preparing' : t.status,
              completedAt: allReady ? new Date().toISOString() : t.completedAt,
            };
          }),
        });
        try { await api.updateKDSItemStatus(ticketId, itemIndex, status); } catch (e) { console.error(e); }
      },
    }),
    { name: 'cafeflow-kds' }
  )
);

// ── Coupon Store ────────────────────────────────────────────
interface CouponStore {
  coupons: Coupon[];
  addCoupon: (c: Coupon) => void;
  updateCoupon: (id: string, c: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  validateCoupon: (code: string, orderAmount: number) => { valid: boolean; coupon?: Coupon; discount?: number; message: string };
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      coupons: [],
      addCoupon: async (c) => {
        set({ coupons: [...get().coupons, c] });
        try { await api.createCoupon(c); } catch (e) { console.error(e); }
      },
      updateCoupon: async (id, c) => {
        set({ coupons: get().coupons.map(cp => cp.id === id ? { ...cp, ...c } : cp) });
        try {
          const coupon = get().coupons.find(item => item.id === id);
          if (coupon) await api.updateCoupon(id, coupon);
        } catch (e) { console.error(e); }
      },
      deleteCoupon: async (id) => {
        set({ coupons: get().coupons.filter(c => c.id !== id) });
        try { await api.deleteCoupon(id); } catch (e) { console.error(e); }
      },
      validateCoupon: (code, orderAmount) => {
        const coupon = get().coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (!coupon) return { valid: false, message: 'Invalid coupon code' };
        if (!coupon.active) return { valid: false, message: 'This coupon is no longer active' };
        if (coupon.usageCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) return { valid: false, message: 'Coupon has expired' };
        if (orderAmount < coupon.minOrderAmount) return { valid: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` };

        let discount = 0;
        if (coupon.type === 'percentage') {
          discount = Math.round(orderAmount * coupon.value / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.value;
        }
        return { valid: true, coupon, discount, message: `Coupon applied! You save ₹${discount}` };
      },
    }),
    { name: 'cafeflow-coupons' }
  )
);

// ── Audit Log Store ─────────────────────────────────────────
interface AuditStore {
  logs: AuditLog[];
  addLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      logs: [],
      addLog: async (log) => {
        const newLog = {
          ...log,
          id: 'log-' + Date.now(),
          timestamp: new Date().toISOString(),
        };
        set({
          logs: [newLog, ...get().logs].slice(0, 500),
        });
        try { await api.createAuditLog(newLog); } catch (e) { console.error(e); }
      },
    }),
    { name: 'cafeflow-audit' }
  )
);

// ── Global Backend Synchronization Hook ──────────────────────
export const initializeStoreData = async () => {
  try {
    const [floors, tables, categories, products, customers, employees, orders, payments, tickets, coupons] = await Promise.all([
      api.getFloors(),
      api.getTables(),
      api.getCategories(),
      api.getProducts(),
      api.getCustomers(),
      api.getEmployees(),
      api.getOrders(),
      api.getPayments(),
      api.getKDSTickets(),
      api.getCoupons(),
    ]);

    if (floors && floors.length > 0) useTableStore.setState({ floors });
    if (tables && tables.length > 0) useTableStore.setState({ tables });
    if (categories && categories.length > 0) useProductStore.setState({ categories });
    if (products && products.length > 0) useProductStore.setState({ products });
    if (customers && customers.length > 0) useCustomerStore.setState({ customers });
    if (employees && employees.length > 0) useEmployeeStore.setState({ employees });
    if (orders && orders.length > 0) useOrderStore.setState({ orders });
    if (payments && payments.length > 0) usePaymentStore.setState({ payments });
    if (tickets && tickets.length > 0) useKDSStore.setState({ tickets });
    if (coupons && coupons.length > 0) useCouponStore.setState({ coupons });
    
    console.log("CaféFlow Store: Successfully synchronized with FastAPI database.");
  } catch (err) {
    console.error("CaféFlow Store: Failed to synchronize with database. Using local cache fallback.", err);
  }
};

// ── Dashboard Computed Metrics ──────────────────────────────
export function computeDashboardMetrics(
  orders: Order[],
  payments: Payment[],
  tables: Table[],
  products: Product[]
): DashboardMetrics {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const paidToday = todayOrders.filter(o => o.status === 'paid');
  const todayRevenue = paidToday.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = paidToday.length > 0 ? Math.round(todayRevenue / paidToday.length) : 0;

  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const tableUtilization = tables.length > 0 ? Math.round((occupiedTables / tables.length) * 100) : 0;

  // Top products
  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.filter(o => o.status === 'paid').forEach(o => {
    o.lines.forEach(l => {
      if (!productCounts[l.productId]) productCounts[l.productId] = { name: l.productName, count: 0, revenue: 0 };
      productCounts[l.productId].count += l.quantity;
      productCounts[l.productId].revenue += l.total;
    });
  });
  const topProducts = Object.values(productCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Hourly revenue
  const hourlyMap: Record<string, { revenue: number; orders: number }> = {};
  for (let h = 8; h <= 22; h++) {
    const label = `${h}:00`;
    hourlyMap[label] = { revenue: 0, orders: 0 };
  }
  todayOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    const label = `${hour}:00`;
    if (hourlyMap[label]) {
      hourlyMap[label].revenue += o.total;
      hourlyMap[label].orders += 1;
    }
  });
  const hourlyRevenue = Object.entries(hourlyMap).map(([hour, data]) => ({ hour, ...data }));

  // Peak hour
  const peakEntry = hourlyRevenue.reduce((max, h) => h.orders > max.orders ? h : max, { hour: '12:00', revenue: 0, orders: 0 });

  // Revenue by category
  const catMap: Record<string, number> = {};
  const productMap = new Map(products.map(p => [p.id, p]));
  const catNames = new Map<string, string>();
  useProductStore.getState().categories.forEach(c => catNames.set(c.id, c.name));
  orders.filter(o => o.status === 'paid').forEach(o => {
    o.lines.forEach(l => {
      const prod = productMap.get(l.productId);
      if (prod) {
        const catName = catNames.get(prod.categoryId) || 'Other';
        catMap[catName] = (catMap[catName] || 0) + l.total;
      }
    });
  });
  const revenueByCategory = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Weekly trend
  const weeklyTrend: { day: string; revenue: number; orders: number }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toDateString();
    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === dayStr && o.status === 'paid');
    weeklyTrend.push({
      day: dayNames[d.getDay()],
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const activeOrders = orders.filter(o => !['paid', 'cancelled'].includes(o.status)).length;
  const uniqueCustomers = new Set(todayOrders.filter(o => o.customerId).map(o => o.customerId));

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    avgOrderValue,
    tableUtilization,
    topProducts,
    hourlyRevenue,
    revenueByCategory,
    weeklyTrend,
    activeOrders,
    customersToday: uniqueCustomers.size,
    peakHour: peakEntry.hour,
    avgPrepTime: 12,
  };
}
