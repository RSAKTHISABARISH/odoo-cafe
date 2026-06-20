# Velora Café — Smart Restaurant Management System

A full-stack restaurant POS system with a React frontend and Python FastAPI backend connected to a local database.

---

## 📁 Project Structure

```
CAFE-ODOO/
│
├── frontend/              ← React + TypeScript + Vite (Client)
│   ├── src/
│   │   ├── components/    ← Reusable UI components
│   │   ├── pages/         ← All page routes (Dashboard, POS, Kitchen, etc.)
│   │   ├── store/         ← Zustand state management (synced with backend)
│   │   ├── utils/         ← API client, OneSignal helpers
│   │   ├── types/         ← TypeScript type definitions
│   │   ├── data/          ← Local seed data
│   │   ├── App.tsx        ← Root router
│   │   └── main.tsx       ← Entry point
│   ├── public/            ← Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/               ← Python FastAPI (Server)
│   ├── venv/              ← Python virtual environment
│   ├── main.py            ← FastAPI app and REST API endpoints
│   ├── database.py        ← SQLAlchemy engine and session setup
│   ├── models.py          ← ORM models (tables, orders, products, etc.)
│   ├── requirements.txt   ← Python dependencies
│   └── .env               ← Database configuration
│
├── cafe_odoo.db           ← SQLite database (auto-generated)
├── .gitignore
└── README.md
```

---

## 🚀 Running the Project

### 1. Start the Backend (Python FastAPI)

```bash
# From the root CAFE-ODOO directory:
backend\venv\Scripts\uvicorn backend.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

---

### 2. Start the Frontend (React + Vite)

```bash
# From the frontend/ directory:
cd frontend
npm run dev
```

App available at: **http://localhost:5173**

---

## 🗄️ Database Configuration

The backend uses **SQLite** by default (zero setup needed). To switch to **MySQL**:

Edit `backend/.env`:
```
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/cafe_odoo
```

---

## ⚙️ Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | React 18, TypeScript, Vite 6  |
| Styling    | TailwindCSS, Vanilla CSS       |
| State      | Zustand (persisted)            |
| Backend    | Python 3.11, FastAPI           |
| ORM        | SQLAlchemy 2.0                 |
| Database   | SQLite (dev) / MySQL (prod)    |
| Notifications | OneSignal REST API          |
