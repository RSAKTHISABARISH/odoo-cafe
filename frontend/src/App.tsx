// ============================================================
// Café Totaram — App Router (Updated with Landing Page)
// ============================================================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSettingsStore, useAuthStore, initializeStoreData } from './store';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import OrderTrack from './pages/OrderTrack';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Tables from './pages/Tables';
import Kitchen from './pages/Kitchen';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Coupons from './pages/Coupons';
import Reports from './pages/Reports';
import SelfOrder from './pages/SelfOrder';
import Settings from './pages/Settings';
import Reservation from './pages/Reservation';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role) && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    initializeStoreData();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/track-order" element={<OrderTrack />} />
        <Route path="/self-order/:tableId" element={<SelfOrder />} />
        <Route path="/self-order" element={<SelfOrder />} />
        <Route path="/reservation" element={<Reservation />} />

        {/* ── Protected Admin / Staff Routes ── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="pos/:tableId" element={<POS />} />
          <Route path="tables" element={<Tables />} />
          <Route path="kitchen" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen']}><Kitchen /></ProtectedRoute>} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Products /></ProtectedRoute>} />
          <Route path="customers" element={<Customers />} />
          <Route path="employees" element={<ProtectedRoute allowedRoles={['admin']}><Employees /></ProtectedRoute>} />
          <Route path="coupons" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Coupons /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/pos" element={<Navigate to="/app/pos" replace />} />
        <Route path="/tables" element={<Navigate to="/app/tables" replace />} />
        <Route path="/kitchen" element={<Navigate to="/app/kitchen" replace />} />
        <Route path="/orders" element={<Navigate to="/app/orders" replace />} />
        <Route path="/products" element={<Navigate to="/app/products" replace />} />
        <Route path="/customers" element={<Navigate to="/app/customers" replace />} />
        <Route path="/employees" element={<Navigate to="/app/employees" replace />} />
        <Route path="/coupons" element={<Navigate to="/app/coupons" replace />} />
        <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
