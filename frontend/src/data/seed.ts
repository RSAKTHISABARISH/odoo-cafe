// ============================================================
// CaféFlow POS — Seed Data (Realistic Café Data)
// ============================================================
import type { Floor, Table, Category, Product, Customer, Employee, Coupon, Order, OrderLine, KDSTicket, Payment } from '../types';

export const seedFloors: Floor[] = [
  { id: 'floor-1', name: 'Ground Floor', color: '#4c6ef5', active: true },
  { id: 'floor-2', name: 'Rooftop', color: '#f59f00', active: true },
  { id: 'floor-3', name: 'Garden', color: '#40c057', active: true },
];

export const seedTables: Table[] = [
  { id: 'table-1', floorId: 'floor-1', number: 1, seats: 2, status: 'available', shape: 'square', x: 5, y: 10 },
  { id: 'table-2', floorId: 'floor-1', number: 2, seats: 4, status: 'occupied', shape: 'rectangle', x: 25, y: 10 },
  { id: 'table-3', floorId: 'floor-1', number: 3, seats: 2, status: 'available', shape: 'round', x: 45, y: 10 },
  { id: 'table-4', floorId: 'floor-1', number: 4, seats: 6, status: 'reserved', shape: 'rectangle', x: 65, y: 10 },
  { id: 'table-5', floorId: 'floor-1', number: 5, seats: 4, status: 'available', shape: 'square', x: 5, y: 40 },
  { id: 'table-6', floorId: 'floor-1', number: 6, seats: 2, status: 'occupied', shape: 'round', x: 25, y: 40 },
  { id: 'table-7', floorId: 'floor-1', number: 7, seats: 8, status: 'available', shape: 'rectangle', x: 45, y: 40 },
  { id: 'table-8', floorId: 'floor-1', number: 8, seats: 4, status: 'cleaning', shape: 'square', x: 65, y: 40 },
  { id: 'table-9', floorId: 'floor-2', number: 9, seats: 4, status: 'available', shape: 'round', x: 15, y: 15 },
  { id: 'table-10', floorId: 'floor-2', number: 10, seats: 6, status: 'occupied', shape: 'rectangle', x: 45, y: 15 },
  { id: 'table-11', floorId: 'floor-2', number: 11, seats: 2, status: 'available', shape: 'square', x: 15, y: 50 },
  { id: 'table-12', floorId: 'floor-2', number: 12, seats: 4, status: 'available', shape: 'round', x: 45, y: 50 },
  { id: 'table-13', floorId: 'floor-3', number: 13, seats: 4, status: 'available', shape: 'round', x: 20, y: 20 },
  { id: 'table-14', floorId: 'floor-3', number: 14, seats: 6, status: 'reserved', shape: 'rectangle', x: 55, y: 20 },
  { id: 'table-15', floorId: 'floor-3', number: 15, seats: 2, status: 'available', shape: 'square', x: 20, y: 55 },
  { id: 'table-16', floorId: 'floor-3', number: 16, seats: 8, status: 'available', shape: 'rectangle', x: 55, y: 55 },
];

export const seedCategories: Category[] = [
  { id: 'cat-1', name: 'Hot Beverages', icon: '☕', color: '#be4bdb', active: true },
  { id: 'cat-2', name: 'Cold Beverages', icon: '🧊', color: '#228be6', active: true },
  { id: 'cat-3', name: 'Breakfast', icon: '🍳', color: '#f59f00', active: true },
  { id: 'cat-4', name: 'Main Course', icon: '🍽️', color: '#e64980', active: true },
  { id: 'cat-5', name: 'Desserts', icon: '🍰', color: '#fd7e14', active: true },
  { id: 'cat-6', name: 'Snacks', icon: '🥪', color: '#40c057', active: true },
  { id: 'cat-7', name: 'Salads', icon: '🥗', color: '#20c997', active: true },
];

export const seedProducts: Product[] = [
  // Hot Beverages
  { id: 'prod-1', categoryId: 'cat-1', name: 'Espresso', price: 149, image: '☕', available: true, description: 'Rich single-shot espresso', tags: ['bestseller', 'quick'], preparationTime: 3 },
  { id: 'prod-2', categoryId: 'cat-1', name: 'Cappuccino', price: 199, image: '☕', available: true, description: 'Classic cappuccino with foam art', tags: ['bestseller'], preparationTime: 5 },
  { id: 'prod-3', categoryId: 'cat-1', name: 'Café Latte', price: 219, image: '☕', available: true, description: 'Smooth latte with steamed milk', tags: ['popular'], preparationTime: 5 },
  { id: 'prod-4', categoryId: 'cat-1', name: 'Matcha Latte', price: 249, image: '🍵', available: true, description: 'Premium Japanese matcha', tags: ['trending'], preparationTime: 5 },
  { id: 'prod-5', categoryId: 'cat-1', name: 'Hot Chocolate', price: 179, image: '🍫', available: true, description: 'Rich Belgian chocolate', tags: [], preparationTime: 4 },
  // Cold Beverages
  { id: 'prod-6', categoryId: 'cat-2', name: 'Iced Americano', price: 179, image: '🧊', available: true, description: 'Cold brew Americano over ice', tags: ['bestseller'], preparationTime: 3 },
  { id: 'prod-7', categoryId: 'cat-2', name: 'Mango Smoothie', price: 229, image: '🥭', available: true, description: 'Fresh mango blend with yogurt', tags: ['seasonal'], preparationTime: 5 },
  { id: 'prod-8', categoryId: 'cat-2', name: 'Berry Blast', price: 249, image: '🫐', available: true, description: 'Mixed berries smoothie', tags: ['trending'], preparationTime: 5 },
  { id: 'prod-9', categoryId: 'cat-2', name: 'Fresh Lime Soda', price: 129, image: '🍋', available: true, description: 'Refreshing lime with soda', tags: ['quick'], preparationTime: 2 },
  { id: 'prod-10', categoryId: 'cat-2', name: 'Cold Brew', price: 199, image: '☕', available: true, description: '18-hour cold brew coffee', tags: ['premium'], preparationTime: 2 },
  // Breakfast
  { id: 'prod-11', categoryId: 'cat-3', name: 'Avocado Toast', price: 299, image: '🥑', available: true, description: 'Sourdough with smashed avocado & egg', tags: ['bestseller', 'healthy'], preparationTime: 10 },
  { id: 'prod-12', categoryId: 'cat-3', name: 'Pancake Stack', price: 279, image: '🥞', available: true, description: 'Fluffy pancakes with maple syrup', tags: ['popular'], preparationTime: 12 },
  { id: 'prod-13', categoryId: 'cat-3', name: 'Eggs Benedict', price: 349, image: '🍳', available: true, description: 'Poached eggs with hollandaise', tags: ['premium'], preparationTime: 15 },
  { id: 'prod-14', categoryId: 'cat-3', name: 'French Toast', price: 249, image: '🍞', available: true, description: 'Cinnamon French toast with berries', tags: [], preparationTime: 10 },
  // Main Course
  { id: 'prod-15', categoryId: 'cat-4', name: 'Grilled Chicken Burger', price: 399, image: '🍔', available: true, description: 'Juicy grilled chicken with special sauce', tags: ['bestseller'], preparationTime: 18 },
  { id: 'prod-16', categoryId: 'cat-4', name: 'Margherita Pizza', price: 449, image: '🍕', available: true, description: 'Classic wood-fired pizza', tags: ['popular'], preparationTime: 20 },
  { id: 'prod-17', categoryId: 'cat-4', name: 'Pasta Alfredo', price: 379, image: '🍝', available: true, description: 'Creamy alfredo with grilled chicken', tags: [], preparationTime: 15 },
  { id: 'prod-18', categoryId: 'cat-4', name: 'Fish & Chips', price: 429, image: '🐟', available: true, description: 'Beer-battered fish with crispy fries', tags: ['premium'], preparationTime: 18 },
  // Desserts
  { id: 'prod-19', categoryId: 'cat-5', name: 'Tiramisu', price: 299, image: '🍰', available: true, description: 'Classic Italian tiramisu', tags: ['bestseller'], preparationTime: 5 },
  { id: 'prod-20', categoryId: 'cat-5', name: 'Chocolate Lava Cake', price: 349, image: '🍫', available: true, description: 'Warm chocolate cake with molten center', tags: ['premium'], preparationTime: 12 },
  { id: 'prod-21', categoryId: 'cat-5', name: 'Cheesecake', price: 279, image: '🧀', available: true, description: 'New York style cheesecake', tags: ['popular'], preparationTime: 5 },
  // Snacks
  { id: 'prod-22', categoryId: 'cat-6', name: 'Loaded Fries', price: 199, image: '🍟', available: true, description: 'Crispy fries with cheese & jalapeños', tags: ['bestseller'], preparationTime: 8 },
  { id: 'prod-23', categoryId: 'cat-6', name: 'Nachos Grande', price: 249, image: '🌮', available: true, description: 'Tortilla chips with salsa & guac', tags: ['popular'], preparationTime: 10 },
  { id: 'prod-24', categoryId: 'cat-6', name: 'Bruschetta', price: 229, image: '🍅', available: true, description: 'Toasted bread with tomato & basil', tags: [], preparationTime: 8 },
  // Salads
  { id: 'prod-25', categoryId: 'cat-7', name: 'Caesar Salad', price: 279, image: '🥗', available: true, description: 'Romaine with parmesan & croutons', tags: ['healthy', 'popular'], preparationTime: 7 },
  { id: 'prod-26', categoryId: 'cat-7', name: 'Greek Salad', price: 259, image: '🥗', available: true, description: 'Fresh veggies with feta & olives', tags: ['healthy'], preparationTime: 7 },
];

export const seedCustomers: Customer[] = [
  { id: 'cust-1', name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 98765 43210', totalVisits: 45, totalSpent: 22500, loyaltyTier: 'platinum', createdAt: '2025-01-15', lastVisit: '2026-06-19' },
  { id: 'cust-2', name: 'Rahul Verma', email: 'rahul@email.com', phone: '+91 87654 32109', totalVisits: 28, totalSpent: 14200, loyaltyTier: 'gold', createdAt: '2025-03-20', lastVisit: '2026-06-18' },
  { id: 'cust-3', name: 'Ananya Iyer', email: 'ananya@email.com', phone: '+91 76543 21098', totalVisits: 15, totalSpent: 7800, loyaltyTier: 'silver', createdAt: '2025-06-10', lastVisit: '2026-06-17' },
  { id: 'cust-4', name: 'Vikram Singh', email: 'vikram@email.com', phone: '+91 65432 10987', totalVisits: 8, totalSpent: 3200, loyaltyTier: 'bronze', createdAt: '2025-09-01', lastVisit: '2026-06-15' },
  { id: 'cust-5', name: 'Meera Patel', email: 'meera@email.com', phone: '+91 54321 09876', totalVisits: 32, totalSpent: 18900, loyaltyTier: 'gold', createdAt: '2025-02-14', lastVisit: '2026-06-20' },
  { id: 'cust-6', name: 'Arjun Nair', email: 'arjun@email.com', phone: '+91 43210 98765', totalVisits: 12, totalSpent: 5600, loyaltyTier: 'silver', createdAt: '2025-07-22', lastVisit: '2026-06-16' },
];

export const seedEmployees: Employee[] = [
  { id: 'emp-1', name: 'Aditya Kumar', role: 'admin', username: 'admin', password: 'password', avatar: '👨‍💼', active: true, email: 'aditya@cafeflow.com', phone: '+91 99000 11111', hireDate: '2024-01-01' },
  { id: 'emp-2', name: 'Sneha Reddy', role: 'manager', username: 'sneha', password: 'password', avatar: '👩‍💼', active: true, email: 'sneha@cafeflow.com', phone: '+91 99000 22222', hireDate: '2024-03-15' },
  { id: 'emp-3', name: 'Rohan Das', role: 'waiter', username: 'rohan', password: 'password', avatar: '🧑‍🍳', active: true, email: 'rohan@cafeflow.com', phone: '+91 99000 33333', hireDate: '2024-06-01' },
  { id: 'emp-4', name: 'Kavitha M', role: 'waiter', username: 'kavitha', password: 'password', avatar: '👩‍🍳', active: true, email: 'kavitha@cafeflow.com', phone: '+91 99000 44444', hireDate: '2024-08-10' },
  { id: 'emp-5', name: 'Chef Rajan', role: 'kitchen', username: 'rajan', password: 'password', avatar: '👨‍🍳', active: true, email: 'rajan@cafeflow.com', phone: '+91 99000 55555', hireDate: '2024-02-01' },
  { id: 'emp-6', name: 'Lakshmi P', role: 'kitchen', username: 'lakshmi', password: 'password', avatar: '👩‍🍳', active: true, email: 'lakshmi@cafeflow.com', phone: '+91 99000 66666', hireDate: '2024-05-20' },
];

export const seedCoupons: Coupon[] = [
  { id: 'coupon-1', code: 'WELCOME20', type: 'percentage', value: 20, minOrderAmount: 300, maxDiscount: 200, validFrom: '2026-01-01', validUntil: '2026-12-31', active: true, usageCount: 145, usageLimit: 500, description: 'Welcome discount for new customers' },
  { id: 'coupon-2', code: 'FLAT100', type: 'fixed', value: 100, minOrderAmount: 500, validFrom: '2026-06-01', validUntil: '2026-06-30', active: true, usageCount: 67, usageLimit: 200, description: 'Flat ₹100 off on orders above ₹500' },
  { id: 'coupon-3', code: 'SUMMER15', type: 'percentage', value: 15, minOrderAmount: 400, maxDiscount: 150, validFrom: '2026-04-01', validUntil: '2026-08-31', active: true, usageCount: 89, usageLimit: 300, description: 'Summer special 15% discount' },
  { id: 'coupon-4', code: 'LOYALTY50', type: 'fixed', value: 50, minOrderAmount: 200, validFrom: '2026-01-01', validUntil: '2026-12-31', active: true, usageCount: 234, usageLimit: 1000, description: 'Loyalty reward ₹50 off' },
  { id: 'coupon-5', code: 'WEEKEND25', type: 'percentage', value: 25, minOrderAmount: 600, maxDiscount: 250, validFrom: '2026-06-01', validUntil: '2026-07-31', active: false, usageCount: 12, usageLimit: 100, description: 'Weekend special 25% off' },
];

// Generate realistic historical orders
function generateId(): string {
  return 'ord-' + Math.random().toString(36).substr(2, 9);
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 14) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

export function generateSeedOrders(): Order[] {
  const orders: Order[] = [];
  const statuses: Order['status'][] = ['paid', 'paid', 'paid', 'paid', 'served', 'ready', 'preparing', 'confirmed'];

  for (let i = 0; i < 50; i++) {
    const table = seedTables[Math.floor(Math.random() * seedTables.length)];
    const employee = seedEmployees.filter(e => e.role === 'waiter')[Math.floor(Math.random() * 2)];
    const customer = Math.random() > 0.3 ? seedCustomers[Math.floor(Math.random() * seedCustomers.length)] : undefined;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const numLines = Math.floor(Math.random() * 4) + 1;
    const createdAt = i < 5 ? new Date().toISOString() : randomDate(30);
    const orderId = generateId();
    const lines: OrderLine[] = [];
    let subtotal = 0;

    for (let j = 0; j < numLines; j++) {
      const product = seedProducts[Math.floor(Math.random() * seedProducts.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const lineTotal = product.price * qty;
      subtotal += lineTotal;
      lines.push({
        id: `line-${orderId}-${j}`,
        orderId,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: lineTotal,
        notes: '',
        status: status === 'paid' ? 'served' : 'pending',
      });
    }

    const taxRate = 0.05;
    const tax = Math.round(subtotal * taxRate);
    const discount = Math.random() > 0.7 ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + tax - discount;

    orders.push({
      id: orderId,
      orderNumber: `ORD-${String(1000 + i).padStart(4, '0')}`,
      tableId: table.id,
      tableName: `Table ${table.number}`,
      customerId: customer?.id,
      customerName: customer?.name,
      employeeId: employee.id,
      employeeName: employee.name,
      status,
      lines,
      subtotal,
      tax,
      taxRate,
      discount,
      total,
      createdAt,
      updatedAt: createdAt,
      paidAt: status === 'paid' ? createdAt : undefined,
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateSeedKDSTickets(orders: Order[]): KDSTicket[] {
  return orders
    .filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status))
    .slice(0, 8)
    .map(order => ({
      id: `kds-${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableName: order.tableName,
      items: order.lines.map(l => ({
        name: l.productName,
        quantity: l.quantity,
        notes: l.notes,
        status: order.status === 'ready' ? 'ready' as const : order.status === 'preparing' ? 'preparing' as const : 'queued' as const,
      })),
      status: order.status === 'ready' ? 'ready' as const : order.status === 'preparing' ? 'preparing' as const : 'queued' as const,
      createdAt: order.createdAt,
      startedAt: order.status === 'preparing' ? order.createdAt : undefined,
      completedAt: order.status === 'ready' ? new Date().toISOString() : undefined,
      priority: Math.random() > 0.8 ? 'rush' as const : 'normal' as const,
    }));
}

export function generateSeedPayments(orders: Order[]): Payment[] {
  const methods: Payment['method'][] = ['cash', 'card', 'upi', 'wallet'];
  return orders
    .filter(o => o.status === 'paid')
    .map(order => ({
      id: `pay-${order.id}`,
      orderId: order.id,
      method: methods[Math.floor(Math.random() * methods.length)],
      amount: order.total,
      paidAt: order.paidAt || order.createdAt,
    }));
}
