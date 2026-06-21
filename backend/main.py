import json
import logging
import os
import random
import string
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
import razorpay

# Load .env file (check root folder first, then fall back to local)
root_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(root_env_path):
    load_dotenv(dotenv_path=root_env_path)
load_dotenv()

razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID", ""), os.getenv("RAZORPAY_KEY_SECRET", ""))
)

from database import engine, Base, get_db, SessionLocal
from models import (
    DBFloor, DBTable, DBCategory, DBProduct, DBCustomer, DBEmployee,
    DBOrder, DBOrderLine, DBKDSTicket, DBKDSTicketItem, DBPayment,
    DBCoupon, DBAuditLog
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully.")
except Exception as e:
    logger.error(f"Error creating database tables: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: runs startup logic before yield, shutdown logic after"""
    db = SessionLocal()
    try:
        if db.query(DBFloor).first() is None:
            logger.info("No floors found, auto-seeding database...")
            seed_database(db)
    except Exception as e:
        logger.error(f"Auto-seed error: {e}")
    finally:
        db.close()
    yield  # Application runs here

app = FastAPI(title="Café Flow POS Backend", version="2.0.0", lifespan=lifespan)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ──────────────────────────────────────────

class FloorSchema(BaseModel):
    id: str
    name: str
    color: str
    active: bool

    class Config:
        from_attributes = True

class TableSchema(BaseModel):
    id: str
    floorId: str
    number: int
    seats: int
    status: str
    shape: str
    x: int
    y: int

    class Config:
        from_attributes = True

class TableStatusUpdateSchema(BaseModel):
    status: str

class CategorySchema(BaseModel):
    id: str
    name: str
    icon: str
    color: str
    active: bool

    class Config:
        from_attributes = True

class ProductSchema(BaseModel):
    id: str
    categoryId: str
    name: str
    price: float
    image: str
    available: bool
    description: str
    tags: List[str]
    preparationTime: Optional[int] = None

    class Config:
        from_attributes = True

class CustomerSchema(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    totalVisits: int = 0
    totalSpent: float = 0.0
    loyaltyTier: str = "bronze"
    avatar: Optional[str] = None
    createdAt: str
    lastVisit: Optional[str] = None

    class Config:
        from_attributes = True

class CustomerStatsUpdate(BaseModel):
    totalSpent: float
    totalVisits: int
    loyaltyTier: str
    lastVisit: str

class EmployeeSchema(BaseModel):
    id: str
    name: str
    role: str
    username: str
    password: Optional[str] = None
    avatar: str
    active: bool
    email: Optional[str] = None
    phone: Optional[str] = None
    hireDate: Optional[str] = None

    class Config:
        from_attributes = True

class EmployeeLoginRequest(BaseModel):
    username: str
    password: str

class EmployeeChangePassword(BaseModel):
    currentPassword: str
    newPassword: str

class OrderLineSchema(BaseModel):
    id: str
    orderId: str
    productId: str
    productName: str
    quantity: int
    unitPrice: float
    total: float
    notes: Optional[str] = ""
    status: str = "pending"

    class Config:
        from_attributes = True

class OrderSchema(BaseModel):
    id: str
    orderNumber: str
    tableId: str
    tableName: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    employeeId: str
    employeeName: str
    status: str
    lines: List[OrderLineSchema] = []
    subtotal: float
    tax: float
    taxRate: float
    discount: float
    total: float
    couponId: Optional[str] = None
    couponCode: Optional[str] = None
    createdAt: str
    updatedAt: str
    paidAt: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PaymentSchema(BaseModel):
    id: str
    orderId: str
    method: str
    amount: float
    paidAt: str
    reference: Optional[str] = None

    class Config:
        from_attributes = True

class KDSTicketItemSchema(BaseModel):
    name: str
    quantity: int
    notes: Optional[str] = ""
    status: str

    class Config:
        from_attributes = True

class KDSTicketSchema(BaseModel):
    id: str
    orderId: str
    orderNumber: str
    tableName: str
    items: List[KDSTicketItemSchema] = []
    status: str
    createdAt: str
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    priority: str

    class Config:
        from_attributes = True

class CouponSchema(BaseModel):
    id: str
    code: str
    type: str
    value: float
    minOrderAmount: float
    maxDiscount: Optional[float] = None
    validFrom: str
    validUntil: str
    active: bool
    usageCount: int = 0
    usageLimit: int = 100
    description: Optional[str] = None
    autoAssignThreshold: Optional[float] = None

    class Config:
        from_attributes = True

class CouponValidateRequest(BaseModel):
    code: str
    orderAmount: float

class CouponEarnRequest(BaseModel):
    customerId: str
    orderTotal: float
    customerName: Optional[str] = None

class AuditLogSchema(BaseModel):
    id: str
    action: str
    entity: str
    entityId: str
    userId: str
    userName: str
    details: str
    timestamp: str

    class Config:
        from_attributes = True

# ── Utility Functions ──────────────────────────────────────────

def generate_unique_order_id(db: Session) -> str:
    """Generate a unique random order ID in format CF-XXXXX"""
    while True:
        chars = string.ascii_uppercase + string.digits
        random_part = "".join(random.choices(chars, k=5))
        order_id = f"CF-{random_part}"
        # Check uniqueness in DB
        existing = db.query(DBOrder).filter(DBOrder.orderNumber == order_id).first()
        if not existing:
            return order_id

def calculate_loyalty_tier(total_spent: float) -> str:
    """Calculate loyalty tier based on total spending"""
    if total_spent >= 20000:
        return "platinum"
    elif total_spent >= 10000:
        return "gold"
    elif total_spent >= 5000:
        return "silver"
    return "bronze"

# ── API Endpoints ─────────────────────────────────────────────

# --- SEEDING ---
@app.post("/api/seed", status_code=status.HTTP_201_CREATED)
def seed_database(db: Session = Depends(get_db)):
    if db.query(DBFloor).first() is not None:
        return {"message": "Database is already seeded"}

    # Seed Floors
    floors = [
        DBFloor(id="floor-1", name="Ground Floor", color="#4c6ef5", active=True),
        DBFloor(id="floor-2", name="Rooftop", color="#f59f00", active=True),
        DBFloor(id="floor-3", name="Garden", color="#40c057", active=True)
    ]
    db.add_all(floors)

    # Seed Tables
    tables = [
        DBTable(id="table-1", floorId="floor-1", number=1, seats=2, status="available", shape="square", x=5, y=10),
        DBTable(id="table-2", floorId="floor-1", number=2, seats=4, status="occupied", shape="rectangle", x=25, y=10),
        DBTable(id="table-3", floorId="floor-1", number=3, seats=2, status="available", shape="round", x=45, y=10),
        DBTable(id="table-4", floorId="floor-1", number=4, seats=6, status="reserved", shape="rectangle", x=65, y=10),
        DBTable(id="table-5", floorId="floor-1", number=5, seats=4, status="available", shape="square", x=5, y=40),
        DBTable(id="table-6", floorId="floor-1", number=6, seats=2, status="occupied", shape="round", x=25, y=40),
        DBTable(id="table-7", floorId="floor-1", number=7, seats=8, status="available", shape="rectangle", x=45, y=40),
        DBTable(id="table-8", floorId="floor-1", number=8, seats=4, status="cleaning", shape="square", x=65, y=40),
        DBTable(id="table-9", floorId="floor-2", number=9, seats=4, status="available", shape="round", x=15, y=15),
        DBTable(id="table-10", floorId="floor-2", number=10, seats=6, status="occupied", shape="rectangle", x=45, y=15),
        DBTable(id="table-11", floorId="floor-2", number=11, seats=2, status="available", shape="square", x=15, y=50),
        DBTable(id="table-12", floorId="floor-2", number=12, seats=4, status="available", shape="round", x=45, y=50),
        DBTable(id="table-13", floorId="floor-3", number=13, seats=4, status="available", shape="round", x=20, y=20),
        DBTable(id="table-14", floorId="floor-3", number=14, seats=6, status="reserved", shape="rectangle", x=55, y=20),
        DBTable(id="table-15", floorId="floor-3", number=15, seats=2, status="available", shape="square", x=20, y=55),
        DBTable(id="table-16", floorId="floor-3", number=16, seats=8, status="available", shape="rectangle", x=55, y=55)
    ]
    db.add_all(tables)

    # Seed Categories
    categories = [
        DBCategory(id="cat-1", name="Hot Beverages", icon="☕", color="#be4bdb", active=True),
        DBCategory(id="cat-2", name="Cold Beverages", icon="🧊", color="#228be6", active=True),
        DBCategory(id="cat-3", name="Quick Bites", icon="🥪", color="#40c057", active=True),
        DBCategory(id="cat-4", name="Desserts", icon="🍰", color="#fd7e14", active=True),
    ]
    db.add_all(categories)

    products = [
        # ── Hot Beverages ──────────────────────────────────────────
        DBProduct(
            id="prod-1", categoryId="cat-1", name="Espresso", price=120.0,
            image="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80",
            available=True, description="Rich, bold single-shot espresso. Tax: 10%",
            tags=json.dumps(["bestseller", "quick"]), preparationTime=3
        ),
        DBProduct(
            id="prod-2", categoryId="cat-1", name="Cappuccino", price=150.0,
            image="https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
            available=True, description="Velvety espresso with steamed milk & thick foam. Tax: 6%",
            tags=json.dumps(["bestseller"]), preparationTime=5
        ),
        DBProduct(
            id="prod-3", categoryId="cat-1", name="Latte", price=160.0,
            image="https://images.unsplash.com/photo-1561882468-9110d70d2f26?auto=format&fit=crop&w=600&q=80",
            available=True, description="Smooth espresso with creamy steamed milk. Tax: 6%",
            tags=json.dumps(["popular"]), preparationTime=5
        ),
        DBProduct(
            id="prod-4", categoryId="cat-1", name="Tea", price=80.0,
            image="https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=600&q=80",
            available=True, description="Freshly brewed aromatic tea. Tax: 5%",
            tags=json.dumps(["quick"]), preparationTime=3
        ),
        # ── Cold Beverages ─────────────────────────────────────────
        DBProduct(
            id="prod-5", categoryId="cat-2", name="Cold Coffee", price=180.0,
            image="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80",
            available=True, description="Chilled blended coffee with ice cream. Tax: 6%",
            tags=json.dumps(["bestseller", "trending"]), preparationTime=5
        ),
        DBProduct(
            id="prod-6", categoryId="cat-2", name="Juice & Smoothies", price=170.0,
            image="https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?auto=format&fit=crop&w=600&q=80",
            available=True, description="Fresh seasonal fruits blended to perfection. Tax: 5%",
            tags=json.dumps(["healthy", "popular"]), preparationTime=5
        ),
        # ── Quick Bites ────────────────────────────────────────────
        DBProduct(
            id="prod-7", categoryId="cat-3", name="Sandwich", price=150.0,
            image="https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=600&q=80",
            available=True, description="Freshly prepared grilled sandwich with fillings of your choice. Tax: 5%",
            tags=json.dumps(["popular", "quick"]), preparationTime=8
        ),
        DBProduct(
            id="prod-8", categoryId="cat-3", name="Burger", price=200.0,
            image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
            available=True, description="Juicy patty with fresh veggies in a toasted bun. Tax: 12%",
            tags=json.dumps(["bestseller"]), preparationTime=12
        ),
        DBProduct(
            id="prod-9", categoryId="cat-3", name="Pizza", price=250.0,
            image="https://images.unsplash.com/photo-1604068549290-dea0e4a30536?auto=format&fit=crop&w=600&q=80",
            available=True, description="Wood-fired pizza with premium toppings. Tax: 12%",
            tags=json.dumps(["popular", "premium"]), preparationTime=20
        ),
        # ── Desserts ───────────────────────────────────────────────
        DBProduct(
            id="prod-10", categoryId="cat-4", name="Pastries & Cakes", price=140.0,
            image="https://images.unsplash.com/photo-1558303046-924c3a3c9da5?auto=format&fit=crop&w=600&q=80",
            available=True, description="Freshly baked pastries and cakes made daily. Tax: 5%",
            tags=json.dumps(["popular"]), preparationTime=5
        ),
    ]
    db.add_all(products)

    # Seed Customers
    customers = [
        DBCustomer(id="cust-1", name="Priya Sharma", email="priya@email.com", phone="+91 98765 43210", totalVisits=45, totalSpent=22500.0, loyaltyTier="platinum", createdAt="2025-01-15", lastVisit="2026-06-19"),
        DBCustomer(id="cust-2", name="Rahul Verma", email="rahul@email.com", phone="+91 87654 32109", totalVisits=28, totalSpent=14200.0, loyaltyTier="gold", createdAt="2025-03-20", lastVisit="2026-06-18"),
        DBCustomer(id="cust-3", name="Ananya Iyer", email="ananya@email.com", phone="+91 76543 21098", totalVisits=15, totalSpent=7800.0, loyaltyTier="silver", createdAt="2025-06-10", lastVisit="2026-06-17"),
        DBCustomer(id="cust-4", name="Vikram Singh", email="vikram@email.com", phone="+91 65432 10987", totalVisits=8, totalSpent=3200.0, loyaltyTier="bronze", createdAt="2025-09-01", lastVisit="2026-06-15"),
        DBCustomer(id="cust-5", name="Meera Patel", email="meera@email.com", phone="+91 54321 09876", totalVisits=32, totalSpent=18900.0, loyaltyTier="gold", createdAt="2025-02-14", lastVisit="2026-06-20"),
        DBCustomer(id="cust-6", name="Arjun Nair", email="arjun@email.com", phone="+91 43210 98765", totalVisits=12, totalSpent=5600.0, loyaltyTier="silver", createdAt="2025-07-22", lastVisit="2026-06-16")
    ]
    db.add_all(customers)

    # Seed Employees
    employees = [
        DBEmployee(id="emp-1", name="Aditya Kumar", role="admin", username="admin", password="password", avatar="👨‍💼", active=True, email="aditya@cafeflow.com", phone="+91 99000 11111", hireDate="2024-01-01"),
        DBEmployee(id="emp-2", name="Sneha Reddy", role="manager", username="sneha", password="password", avatar="👩‍💼", active=True, email="sneha@cafeflow.com", phone="+91 99000 22222", hireDate="2024-03-15"),
        DBEmployee(id="emp-3", name="Rohan Das", role="waiter", username="rohan", password="password", avatar="🧑‍🍳", active=True, email="rohan@cafeflow.com", phone="+91 99000 33333", hireDate="2024-06-01"),
        DBEmployee(id="emp-4", name="Kavitha M", role="waiter", username="kavitha", password="password", avatar="👩‍🍳", active=True, email="kavitha@cafeflow.com", phone="+91 99000 44444", hireDate="2024-08-10"),
        DBEmployee(id="emp-5", name="Chef Rajan", role="kitchen", username="rajan", password="password", avatar="👨‍🍳", active=True, email="rajan@cafeflow.com", phone="+91 99000 55555", hireDate="2024-02-01"),
        DBEmployee(id="emp-6", name="Lakshmi P", role="kitchen", username="lakshmi", password="password", avatar="👩‍🍳", active=True, email="lakshmi@cafeflow.com", phone="+91 99000 66666", hireDate="2024-05-20")
    ]
    db.add_all(employees)

    # Seed Coupons (with autoAssignThreshold)
    coupons = [
        DBCoupon(id="coupon-1", code="WELCOME20", type="percentage", value=20.0, minOrderAmount=300.0, maxDiscount=200.0, validFrom="2026-01-01", validUntil="2026-12-31", active=True, usageCount=145, usageLimit=500, description="Welcome discount for new customers", autoAssignThreshold=None),
        DBCoupon(id="coupon-2", code="FLAT100", type="fixed", value=100.0, minOrderAmount=500.0, validFrom="2026-06-01", validUntil="2026-06-30", active=True, usageCount=67, usageLimit=200, description="Flat ₹100 off on orders above ₹500", autoAssignThreshold=500.0),
        DBCoupon(id="coupon-3", code="SUMMER15", type="percentage", value=15.0, minOrderAmount=400.0, maxDiscount=150.0, validFrom="2026-04-01", validUntil="2026-08-31", active=True, usageCount=89, usageLimit=300, description="Summer special 15% discount", autoAssignThreshold=400.0),
        DBCoupon(id="coupon-4", code="LOYALTY50", type="fixed", value=50.0, minOrderAmount=200.0, validFrom="2026-01-01", validUntil="2026-12-31", active=True, usageCount=234, usageLimit=1000, description="Loyalty reward ₹50 off", autoAssignThreshold=200.0),
        DBCoupon(id="coupon-5", code="WEEKEND25", type="percentage", value=25.0, minOrderAmount=600.0, maxDiscount=250.0, validFrom="2026-06-01", validUntil="2026-07-31", active=False, usageCount=12, usageLimit=100, description="Weekend special 25% off", autoAssignThreshold=None)
    ]
    db.add_all(coupons)

    try:
        db.commit()
        logger.info("Database successfully seeded.")
        return {"message": "Database seeded successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise HTTPException(status_code=500, detail="Database seeding failed")


# Auto-seed logic is now handled in the lifespan context manager above.


# ── AUTH ──────────────────────────────────────────────────────

@app.post("/api/auth/login")
def employee_login(credentials: EmployeeLoginRequest, db: Session = Depends(get_db)):
    """Authenticate employee with username and password"""
    employee = db.query(DBEmployee).filter(
        DBEmployee.username == credentials.username,
        DBEmployee.password == credentials.password,
        DBEmployee.active == True
    ).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "id": employee.id,
        "name": employee.name,
        "role": employee.role,
        "username": employee.username,
        "avatar": employee.avatar,
        "active": employee.active,
        "email": employee.email,
        "phone": employee.phone,
        "hireDate": employee.hireDate,
    }

@app.post("/api/auth/change-password")
def change_password(empId: str, data: EmployeeChangePassword, db: Session = Depends(get_db)):
    """Change employee password"""
    employee = db.query(DBEmployee).filter(DBEmployee.id == empId).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.password != data.currentPassword:
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    employee.password = data.newPassword
    db.commit()
    return {"message": "Password changed successfully"}


# ── ORDER ID GENERATION ────────────────────────────────────────

@app.get("/api/orders/generate-id")
def get_new_order_id(db: Session = Depends(get_db)):
    """Generate a unique random order ID in format CF-XXXXX"""
    order_id = generate_unique_order_id(db)
    return {"orderId": order_id}


# ── FLOORS ---
@app.get("/api/floors", response_model=List[FloorSchema])
def get_floors(db: Session = Depends(get_db)):
    return db.query(DBFloor).all()

@app.post("/api/floors", response_model=FloorSchema)
def create_floor(floor: FloorSchema, db: Session = Depends(get_db)):
    db_floor = DBFloor(**floor.dict())
    db.add(db_floor)
    db.commit()
    db.refresh(db_floor)
    return db_floor

@app.put("/api/floors/{id}", response_model=FloorSchema)
def update_floor(id: str, floor: FloorSchema, db: Session = Depends(get_db)):
    db_floor = db.query(DBFloor).filter(DBFloor.id == id).first()
    if not db_floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    for key, value in floor.dict().items():
        setattr(db_floor, key, value)
    db.commit()
    db.refresh(db_floor)
    return db_floor


# --- TABLES ---
@app.get("/api/tables", response_model=List[TableSchema])
def get_tables(db: Session = Depends(get_db)):
    return db.query(DBTable).all()

@app.post("/api/tables", response_model=TableSchema)
def create_table(table: TableSchema, db: Session = Depends(get_db)):
    db_table = DBTable(**table.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

@app.put("/api/tables/{id}", response_model=TableSchema)
def update_table(id: str, table: TableSchema, db: Session = Depends(get_db)):
    db_table = db.query(DBTable).filter(DBTable.id == id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    for key, value in table.dict().items():
        setattr(db_table, key, value)
    db.commit()
    db.refresh(db_table)
    return db_table

@app.patch("/api/tables/{id}/status", response_model=TableSchema)
def update_table_status(id: str, status_update: TableStatusUpdateSchema, db: Session = Depends(get_db)):
    db_table = db.query(DBTable).filter(DBTable.id == id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    db_table.status = status_update.status
    db.commit()
    db.refresh(db_table)
    return db_table


# --- CATEGORIES ---
@app.get("/api/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    return db.query(DBCategory).all()

@app.post("/api/categories", response_model=CategorySchema)
def create_category(cat: CategorySchema, db: Session = Depends(get_db)):
    db_cat = DBCategory(**cat.dict())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.put("/api/categories/{id}", response_model=CategorySchema)
def update_category(id: str, cat: CategorySchema, db: Session = Depends(get_db)):
    db_cat = db.query(DBCategory).filter(DBCategory.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in cat.dict().items():
        setattr(db_cat, key, value)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/api/categories/{id}")
def delete_category(id: str, db: Session = Depends(get_db)):
    db_cat = db.query(DBCategory).filter(DBCategory.id == id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(db_cat)
    db.commit()
    return {"message": "Category deleted"}


# --- PRODUCTS ---
@app.get("/api/products", response_model=List[ProductSchema])
def get_products(db: Session = Depends(get_db)):
    db_prods = db.query(DBProduct).all()
    prods = []
    for dp in db_prods:
        tags_list = []
        if dp.tags:
            try:
                tags_list = json.loads(dp.tags)
            except Exception:
                tags_list = []
        prods.append(ProductSchema(
            id=dp.id,
            categoryId=dp.categoryId,
            name=dp.name,
            price=dp.price,
            image=dp.image or "",
            available=dp.available,
            description=dp.description or "",
            tags=tags_list,
            preparationTime=dp.preparationTime
        ))
    return prods

@app.post("/api/products", response_model=ProductSchema)
def create_product(prod: ProductSchema, db: Session = Depends(get_db)):
    prod_data = prod.dict()
    prod_data['tags'] = json.dumps(prod_data['tags'])
    db_prod = DBProduct(**prod_data)
    db.add(db_prod)
    db.commit()
    db.refresh(db_prod)
    return prod

@app.put("/api/products/{id}", response_model=ProductSchema)
def update_product(id: str, prod: ProductSchema, db: Session = Depends(get_db)):
    db_prod = db.query(DBProduct).filter(DBProduct.id == id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    prod_data = prod.dict()
    prod_data['tags'] = json.dumps(prod_data['tags'])
    for key, value in prod_data.items():
        setattr(db_prod, key, value)
    db.commit()
    return prod

@app.delete("/api/products/{id}")
def delete_product(id: str, db: Session = Depends(get_db)):
    db_prod = db.query(DBProduct).filter(DBProduct.id == id).first()
    if not db_prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_prod)
    db.commit()
    return {"message": "Product deleted"}


# --- CUSTOMERS ---
@app.get("/api/customers", response_model=List[CustomerSchema])
def get_customers(db: Session = Depends(get_db)):
    return db.query(DBCustomer).all()

@app.post("/api/customers", response_model=CustomerSchema)
def create_customer(customer: CustomerSchema, db: Session = Depends(get_db)):
    db_cust = DBCustomer(**customer.dict())
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@app.put("/api/customers/{id}", response_model=CustomerSchema)
def update_customer(id: str, customer: CustomerSchema, db: Session = Depends(get_db)):
    db_cust = db.query(DBCustomer).filter(DBCustomer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in customer.dict().items():
        setattr(db_cust, key, value)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@app.patch("/api/customers/{id}/stats")
def update_customer_stats(id: str, stats: CustomerStatsUpdate, db: Session = Depends(get_db)):
    """Update customer spending stats and loyalty tier after a completed order"""
    db_cust = db.query(DBCustomer).filter(DBCustomer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    db_cust.totalSpent = stats.totalSpent
    db_cust.totalVisits = stats.totalVisits
    db_cust.loyaltyTier = stats.loyaltyTier
    db_cust.lastVisit = stats.lastVisit
    db.commit()
    db.refresh(db_cust)
    return {"message": "Customer stats updated", "loyaltyTier": db_cust.loyaltyTier}

@app.delete("/api/customers/{id}")
def delete_customer(id: str, db: Session = Depends(get_db)):
    db_cust = db.query(DBCustomer).filter(DBCustomer.id == id).first()
    if not db_cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(db_cust)
    db.commit()
    return {"message": "Customer deleted"}


# --- EMPLOYEES ---
@app.get("/api/employees", response_model=List[EmployeeSchema])
def get_employees(db: Session = Depends(get_db)):
    return db.query(DBEmployee).all()

@app.post("/api/employees", response_model=EmployeeSchema)
def create_employee(employee: EmployeeSchema, db: Session = Depends(get_db)):
    db_emp = DBEmployee(**employee.dict())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.put("/api/employees/{id}", response_model=EmployeeSchema)
def update_employee(id: str, employee: EmployeeSchema, db: Session = Depends(get_db)):
    db_emp = db.query(DBEmployee).filter(DBEmployee.id == id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, value in employee.dict().items():
        setattr(db_emp, key, value)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@app.patch("/api/employees/{id}/archive")
def archive_employee(id: str, db: Session = Depends(get_db)):
    """Archive (deactivate) an employee"""
    db_emp = db.query(DBEmployee).filter(DBEmployee.id == id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db_emp.active = False
    if hasattr(db_emp, 'archived'):
        db_emp.archived = True
    db.commit()
    return {"message": "Employee archived successfully"}

@app.delete("/api/employees/{id}")
def delete_employee(id: str, db: Session = Depends(get_db)):
    db_emp = db.query(DBEmployee).filter(DBEmployee.id == id).first()
    if not db_emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_emp)
    db.commit()
    return {"message": "Employee deleted"}


# --- ORDERS ---
@app.get("/api/orders", response_model=List[OrderSchema])
def get_orders(db: Session = Depends(get_db)):
    return db.query(DBOrder).all()

@app.post("/api/orders", response_model=OrderSchema)
def create_order(order: OrderSchema, db: Session = Depends(get_db)):
    existing = db.query(DBOrder).filter(DBOrder.id == order.id).first()
    if existing:
        return update_order(order.id, order, db)

    order_data = order.dict()
    lines_data = order_data.pop("lines", [])
    
    db_order = DBOrder(**order_data)
    db.add(db_order)
    
    for l in lines_data:
        db_line = DBOrderLine(**l)
        db.add(db_line)
        
    db.commit()
    db.refresh(db_order)
    return db_order

@app.put("/api/orders/{id}", response_model=OrderSchema)
def update_order(id: str, order: OrderSchema, db: Session = Depends(get_db)):
    db_order = db.query(DBOrder).filter(DBOrder.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order_data = order.dict()
    lines_data = order_data.pop("lines", [])
    
    for key, value in order_data.items():
        setattr(db_order, key, value)
        
    db.query(DBOrderLine).filter(DBOrderLine.orderId == id).delete()
    
    for l in lines_data:
        db_line = DBOrderLine(**l)
        db.add(db_line)
        
    db.commit()
    db.refresh(db_order)
    return db_order

@app.patch("/api/orders/{id}/status", response_model=OrderSchema)
def update_order_status(id: str, status_update: TableStatusUpdateSchema, db: Session = Depends(get_db)):
    db_order = db.query(DBOrder).filter(DBOrder.id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    db_order.status = status_update.status
    if status_update.status == "paid":
        db_order.paidAt = datetime.now().isoformat()
    db_order.updatedAt = datetime.now().isoformat()
    db.commit()
    db.refresh(db_order)
    return db_order


# --- PAYMENTS ---
@app.get("/api/payments", response_model=List[PaymentSchema])
def get_payments(db: Session = Depends(get_db)):
    return db.query(DBPayment).all()

@app.post("/api/payments", response_model=PaymentSchema)
def create_payment(payment: PaymentSchema, db: Session = Depends(get_db)):
    db_pmt = DBPayment(**payment.dict())
    db.add(db_pmt)
    db.commit()
    db.refresh(db_pmt)
    return db_pmt


# --- RAZORPAY INTEGRATION ---
class RazorpayOrderRequest(BaseModel):
    amount: float  # amount in INR (e.g. 350.00)
    currency: str = "INR"
    receipt: str = ""

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/razorpay/create-order")
def create_razorpay_order(data: RazorpayOrderRequest):
    """Create a Razorpay order for online payment (UPI / Card)"""
    try:
        amount_paise = int(round(data.amount * 100))
        order_data = {
            "amount": amount_paise,
            "currency": data.currency,
            "receipt": data.receipt or f"rcpt_{int(datetime.now().timestamp())}",
            "payment_capture": 1  # auto-capture
        }
        rzp_order = razorpay_client.order.create(data=order_data)
        return {
            "id": rzp_order["id"],
            "amount": rzp_order["amount"],
            "currency": rzp_order["currency"],
            "key_id": os.getenv("RAZORPAY_KEY_ID", ""),
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

@app.post("/api/razorpay/verify-payment")
def verify_razorpay_payment(data: RazorpayVerifyRequest):
    """Verify Razorpay payment signature"""
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })
        return {"verified": True, "payment_id": data.razorpay_payment_id}
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    except Exception as e:
        logger.error(f"Razorpay verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification error: {str(e)}")

# --- KDS TICKETS ---
@app.get("/api/kds-tickets", response_model=List[KDSTicketSchema])
def get_kds_tickets(db: Session = Depends(get_db)):
    return db.query(DBKDSTicket).all()

@app.post("/api/kds-tickets", response_model=KDSTicketSchema)
def create_kds_ticket(ticket: KDSTicketSchema, db: Session = Depends(get_db)):
    existing = db.query(DBKDSTicket).filter(DBKDSTicket.id == ticket.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        
    t_data = ticket.dict()
    items_data = t_data.pop("items", [])
    
    db_t = DBKDSTicket(**t_data)
    db.add(db_t)
    
    for item in items_data:
        db_item = DBKDSTicketItem(ticketId=ticket.id, **item)
        db.add(db_item)
        
    db.commit()
    db.refresh(db_t)
    return db_t

@app.patch("/api/kds-tickets/{id}/status", response_model=KDSTicketSchema)
def update_kds_ticket_status(id: str, status_update: TableStatusUpdateSchema, db: Session = Depends(get_db)):
    db_t = db.query(DBKDSTicket).filter(DBKDSTicket.id == id).first()
    if not db_t:
        raise HTTPException(status_code=404, detail="KDS Ticket not found")
        
    new_status = status_update.status
    db_t.status = new_status
    if new_status == "preparing":
        db_t.startedAt = datetime.now().isoformat()
    elif new_status == "ready":
        db_t.completedAt = datetime.now().isoformat()
        
    items = db.query(DBKDSTicketItem).filter(DBKDSTicketItem.ticketId == id).all()
    for item in items:
        item.status = new_status
        
    db.commit()
    db.refresh(db_t)
    return db_t

@app.patch("/api/kds-tickets/{ticketId}/items/{itemIndex}/status", response_model=KDSTicketSchema)
def update_kds_item_status(ticketId: str, itemIndex: int, status_update: TableStatusUpdateSchema, db: Session = Depends(get_db)):
    db_t = db.query(DBKDSTicket).filter(DBKDSTicket.id == ticketId).first()
    if not db_t:
        raise HTTPException(status_code=404, detail="KDS Ticket not found")
        
    items = db.query(DBKDSTicketItem).filter(DBKDSTicketItem.ticketId == ticketId).all()
    if itemIndex < 0 or itemIndex >= len(items):
        raise HTTPException(status_code=404, detail="Item index out of bounds")
        
    items[itemIndex].status = status_update.status
    
    all_ready = all(i.status == "ready" for i in items)
    any_preparing = any(i.status == "preparing" for i in items)
    
    if all_ready:
        db_t.status = "ready"
        db_t.completedAt = datetime.now().isoformat()
    elif any_preparing:
        db_t.status = "preparing"
        if not db_t.startedAt:
            db_t.startedAt = datetime.now().isoformat()
            
    db.commit()
    db.refresh(db_t)
    return db_t


# --- COUPONS ---
@app.get("/api/coupons", response_model=List[CouponSchema])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(DBCoupon).all()

@app.post("/api/coupons", response_model=CouponSchema)
def create_coupon(coupon: CouponSchema, db: Session = Depends(get_db)):
    db_cpn = DBCoupon(**coupon.dict())
    db.add(db_cpn)
    db.commit()
    db.refresh(db_cpn)
    return db_cpn

@app.put("/api/coupons/{id}", response_model=CouponSchema)
def update_coupon(id: str, coupon: CouponSchema, db: Session = Depends(get_db)):
    db_cpn = db.query(DBCoupon).filter(DBCoupon.id == id).first()
    if not db_cpn:
        raise HTTPException(status_code=404, detail="Coupon not found")
    for key, value in coupon.dict().items():
        setattr(db_cpn, key, value)
    db.commit()
    db.refresh(db_cpn)
    return db_cpn

@app.delete("/api/coupons/{id}")
def delete_coupon(id: str, db: Session = Depends(get_db)):
    db_cpn = db.query(DBCoupon).filter(DBCoupon.id == id).first()
    if not db_cpn:
        raise HTTPException(status_code=404, detail="Coupon not found")
    db.delete(db_cpn)
    db.commit()
    return {"message": "Coupon deleted"}

@app.post("/api/coupons/validate")
def validate_coupon(req: CouponValidateRequest, db: Session = Depends(get_db)):
    """Validate a coupon code against an order amount"""
    coupon = db.query(DBCoupon).filter(
        DBCoupon.code == req.code.upper(),
        DBCoupon.active == True
    ).first()
    if not coupon:
        return {"valid": False, "message": "Invalid or inactive coupon code"}
    if coupon.usageCount >= coupon.usageLimit:
        return {"valid": False, "message": "Coupon usage limit reached"}
    now = datetime.now()
    if now < datetime.fromisoformat(coupon.validFrom) or now > datetime.fromisoformat(coupon.validUntil):
        return {"valid": False, "message": "Coupon has expired or not yet active"}
    if req.orderAmount < coupon.minOrderAmount:
        return {"valid": False, "message": f"Minimum order amount is ₹{coupon.minOrderAmount:.0f}"}
    
    discount = 0.0
    if coupon.type == "percentage":
        discount = round(req.orderAmount * coupon.value / 100, 2)
        if coupon.maxDiscount:
            discount = min(discount, coupon.maxDiscount)
    else:
        discount = coupon.value
    
    return {
        "valid": True,
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "type": coupon.type,
            "value": coupon.value,
            "discount": discount,
        },
        "discount": discount,
        "message": f"Coupon applied! You save ₹{discount:.0f}"
    }

@app.post("/api/coupons/earn")
def earn_coupon(req: CouponEarnRequest, db: Session = Depends(get_db)):
    """Check if customer qualifies for auto-assigned coupons based on order total"""
    now = datetime.now()
    # Find coupons with autoAssignThreshold that the order qualifies for
    eligible_coupons = db.query(DBCoupon).filter(
        DBCoupon.active == True,
        DBCoupon.autoAssignThreshold != None,
        DBCoupon.autoAssignThreshold <= req.orderTotal,
        DBCoupon.usageCount < DBCoupon.usageLimit
    ).all()
    
    earned = []
    for coupon in eligible_coupons:
        try:
            valid_from = datetime.fromisoformat(coupon.validFrom)
            valid_until = datetime.fromisoformat(coupon.validUntil)
            if valid_from <= now <= valid_until:
                earned.append({
                    "id": coupon.id,
                    "code": coupon.code,
                    "type": coupon.type,
                    "value": coupon.value,
                    "description": coupon.description,
                    "minOrderAmount": coupon.minOrderAmount,
                })
        except Exception:
            continue
    
    return {
        "customerId": req.customerId,
        "orderTotal": req.orderTotal,
        "earnedCoupons": earned,
        "message": f"You earned {len(earned)} coupon(s)!" if earned else "No coupons earned this time."
    }


# --- AUDIT LOGS ---
@app.post("/api/audit-logs", response_model=AuditLogSchema)
def create_audit_log(log: AuditLogSchema, db: Session = Depends(get_db)):
    db_log = DBAuditLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
