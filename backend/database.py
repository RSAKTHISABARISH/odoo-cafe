import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import logging

logger = logging.getLogger("backend")

# Load .env file
load_dotenv()

# ── Build PostgreSQL connection URL from individual env vars ──
# Priority: DATABASE_URL env var → individual parts → SQLite fallback

DB_USER     = os.getenv("DB_USER",     "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "your_password")
DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = os.getenv("DB_PORT",     "5432")
DB_NAME     = os.getenv("DB_NAME",     "cafe_management")

# Allow full DATABASE_URL override (e.g., for Railway/Heroku/Supabase)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Build from individual parts
    DATABASE_URL = (
        f"postgresql://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

logger.info(f"Connecting to database: {DATABASE_URL.split('@')[-1]}")  # log host only (hide password)

# ── SQLAlchemy Engine ─────────────────────────────────────────
try:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_recycle=1800,     # recycle connections every 30 min
        pool_pre_ping=True,    # test connection before use
        echo=False,
    )
    # Quick connectivity test
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("✅ PostgreSQL connected successfully!")

except Exception as e:
    logger.error(f"❌ PostgreSQL connection failed: {e}")
    logger.warning("⚠️  Falling back to SQLite for local development")
    DATABASE_URL = "sqlite:///./cafe_odoo.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

# ── Session & Base ────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Dependency for FastAPI routes ────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
