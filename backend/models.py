from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class DBFloor(Base):
    __tablename__ = "floors"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(50), nullable=False)
    active = Column(Boolean, default=True)

class DBTable(Base):
    __tablename__ = "tables"
    id = Column(String(50), primary_key=True, index=True)
    floorId = Column(String(50), ForeignKey("floors.id"), nullable=False)
    number = Column(Integer, nullable=False)
    seats = Column(Integer, nullable=False)
    status = Column(String(50), default="available")
    shape = Column(String(50), default="square")
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)

class DBCategory(Base):
    __tablename__ = "categories"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=False)
    color = Column(String(50), nullable=False)
    active = Column(Boolean, default=True)

class DBProduct(Base):
    __tablename__ = "products"
    id = Column(String(50), primary_key=True, index=True)
    categoryId = Column(String(50), ForeignKey("categories.id"), nullable=False)
    name = Column(String(150), nullable=False)
    price = Column(Float, nullable=False)
    image = Column(Text, nullable=True)
    available = Column(Boolean, default=True)
    archived = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    preparationTime = Column(Integer, nullable=True)

class DBCustomer(Base):
    __tablename__ = "customers"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    totalVisits = Column(Integer, default=0)
    totalSpent = Column(Float, default=0.0)
    loyaltyTier = Column(String(50), default="bronze")
    avatar = Column(Text, nullable=True)
    createdAt = Column(String(50), nullable=False)
    lastVisit = Column(String(50), nullable=True)

class DBEmployee(Base):
    __tablename__ = "employees"
    __table_args__ = {'extend_existing': True}
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=True)
    avatar = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    archived = Column(Boolean, default=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    hireDate = Column(String(50), nullable=True)

class DBOrder(Base):
    __tablename__ = "orders"
    id = Column(String(50), primary_key=True, index=True)
    orderNumber = Column(String(50), nullable=False)
    tableId = Column(String(50), nullable=False)
    tableName = Column(String(50), nullable=False)
    customerId = Column(String(50), nullable=True)
    customerName = Column(String(150), nullable=True)
    employeeId = Column(String(50), nullable=False)
    employeeName = Column(String(150), nullable=False)
    status = Column(String(50), default="draft")
    archived = Column(Boolean, default=False)
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, nullable=False)
    taxRate = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    couponId = Column(String(50), nullable=True)
    couponCode = Column(String(50), nullable=True)
    createdAt = Column(String(50), nullable=False)
    updatedAt = Column(String(50), nullable=False)
    paidAt = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    lines = relationship("DBOrderLine", back_populates="order", cascade="all, delete-orphan")

class DBOrderLine(Base):
    __tablename__ = "order_lines"
    id = Column(String(50), primary_key=True, index=True)
    orderId = Column(String(50), ForeignKey("orders.id"), nullable=False)
    productId = Column(String(50), nullable=False)
    productName = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    order = relationship("DBOrder", back_populates="lines")

class DBKDSTicket(Base):
    __tablename__ = "kds_tickets"
    id = Column(String(50), primary_key=True, index=True)
    orderId = Column(String(50), nullable=False)
    orderNumber = Column(String(50), nullable=False)
    tableName = Column(String(50), nullable=False)
    status = Column(String(50), default="queued")
    createdAt = Column(String(50), nullable=False)
    startedAt = Column(String(50), nullable=True)
    completedAt = Column(String(50), nullable=True)
    priority = Column(String(50), default="normal")
    items = relationship("DBKDSTicketItem", back_populates="ticket", cascade="all, delete-orphan")

class DBKDSTicketItem(Base):
    __tablename__ = "kds_ticket_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    ticketId = Column(String(50), ForeignKey("kds_tickets.id"), nullable=False)
    name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="queued")
    ticket = relationship("DBKDSTicket", back_populates="items")

class DBPayment(Base):
    __tablename__ = "payments"
    id = Column(String(50), primary_key=True, index=True)
    orderId = Column(String(50), nullable=False)
    method = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)
    paidAt = Column(String(50), nullable=False)
    reference = Column(String(150), nullable=True)

class DBCoupon(Base):
    __tablename__ = "coupons"
    id = Column(String(50), primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    minOrderAmount = Column(Float, default=0.0)
    maxDiscount = Column(Float, nullable=True)
    validFrom = Column(String(50), nullable=False)
    validUntil = Column(String(50), nullable=False)
    active = Column(Boolean, default=True)
    usageCount = Column(Integer, default=0)
    usageLimit = Column(Integer, default=100)
    description = Column(Text, nullable=True)
    autoAssignThreshold = Column(Float, nullable=True)  # auto-assign if order >= this amount

class DBAuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(50), primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entityId = Column(String(50), nullable=False)
    userId = Column(String(50), nullable=False)
    userName = Column(String(150), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(String(50), nullable=False)
