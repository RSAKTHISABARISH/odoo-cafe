-- PostgreSQL Schema for Velora Cafe POS

CREATE TABLE IF NOT EXISTS floors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tables (
    id VARCHAR(50) PRIMARY KEY,
    floorId VARCHAR(50) NOT NULL REFERENCES floors(id),
    number INTEGER NOT NULL,
    seats INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    shape VARCHAR(50) DEFAULT 'square',
    x INTEGER NOT NULL,
    y INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    categoryId VARCHAR(50) NOT NULL REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    image TEXT,
    available BOOLEAN DEFAULT TRUE,
    archived BOOLEAN DEFAULT FALSE,
    description TEXT,
    tags TEXT,
    preparationTime INTEGER
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    totalVisits INTEGER DEFAULT 0,
    totalSpent DOUBLE PRECISION DEFAULT 0.0,
    loyaltyTier VARCHAR(50) DEFAULT 'bronze',
    avatar TEXT,
    createdAt VARCHAR(50) NOT NULL,
    lastVisit VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(200),
    avatar TEXT,
    active BOOLEAN DEFAULT TRUE,
    archived BOOLEAN DEFAULT FALSE,
    email VARCHAR(150),
    phone VARCHAR(50),
    hireDate VARCHAR(50)
);
CREATE INDEX idx_employees_username ON employees(username);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    orderNumber VARCHAR(50) NOT NULL,
    tableId VARCHAR(50) NOT NULL,
    tableName VARCHAR(50) NOT NULL,
    customerId VARCHAR(50),
    customerName VARCHAR(150),
    employeeId VARCHAR(50) NOT NULL,
    employeeName VARCHAR(150) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    archived BOOLEAN DEFAULT FALSE,
    subtotal DOUBLE PRECISION NOT NULL,
    tax DOUBLE PRECISION NOT NULL,
    taxRate DOUBLE PRECISION NOT NULL,
    discount DOUBLE PRECISION DEFAULT 0.0,
    total DOUBLE PRECISION NOT NULL,
    couponId VARCHAR(50),
    couponCode VARCHAR(50),
    createdAt VARCHAR(50) NOT NULL,
    updatedAt VARCHAR(50) NOT NULL,
    paidAt VARCHAR(50),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS order_lines (
    id VARCHAR(50) PRIMARY KEY,
    orderId VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    productId VARCHAR(50) NOT NULL,
    productName VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL,
    unitPrice DOUBLE PRECISION NOT NULL,
    total DOUBLE PRECISION NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS kds_tickets (
    id VARCHAR(50) PRIMARY KEY,
    orderId VARCHAR(50) NOT NULL,
    orderNumber VARCHAR(50) NOT NULL,
    tableName VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    createdAt VARCHAR(50) NOT NULL,
    startedAt VARCHAR(50),
    completedAt VARCHAR(50),
    priority VARCHAR(50) DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS kds_ticket_items (
    id SERIAL PRIMARY KEY,
    ticketId VARCHAR(50) NOT NULL REFERENCES kds_tickets(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'queued'
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(50) PRIMARY KEY,
    orderId VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    paidAt VARCHAR(50) NOT NULL,
    reference VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    minOrderAmount DOUBLE PRECISION DEFAULT 0.0,
    maxDiscount DOUBLE PRECISION,
    validFrom VARCHAR(50) NOT NULL,
    validUntil VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    usageCount INTEGER DEFAULT 0,
    usageLimit INTEGER DEFAULT 100,
    description TEXT,
    autoAssignThreshold DOUBLE PRECISION
);
CREATE INDEX idx_coupons_code ON coupons(code);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entityId VARCHAR(50) NOT NULL,
    userId VARCHAR(50) NOT NULL,
    userName VARCHAR(150) NOT NULL,
    details TEXT,
    timestamp VARCHAR(50) NOT NULL
);
