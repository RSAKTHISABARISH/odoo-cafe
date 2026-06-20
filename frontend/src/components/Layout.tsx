import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useSettingsStore } from '../store';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, Users,
  Settings, LogOut, Tags, BarChart3, ChefHat,
  Receipt, Menu, X, Table2, Package, Flame
} from 'lucide-react';

export default function Layout() {
  const { currentUser, logout } = useAuthStore();
  const { settings } = useSettingsStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const allNavItems = [
    { path: '/app/pos',       icon: ShoppingCart,    label: 'POS Terminal',      roles: ['admin','manager','waiter'],  group: 'operations' },
    { path: '/app/tables',    icon: Table2,           label: 'Table Details',     roles: ['admin','manager','waiter'],  group: 'operations' },
    { path: '/app/kitchen',   icon: ChefHat,          label: 'Kitchen (KDS)',     roles: ['admin','manager','kitchen'], group: 'operations' },
    { path: '/app/orders',    icon: Receipt,          label: 'Orders',            roles: ['admin','manager','waiter'],  group: 'operations' },
    { path: '/app/dashboard', icon: LayoutDashboard,  label: 'Dashboard',         roles: ['admin','manager'],           group: 'management' },
    { path: '/app/customers', icon: Users,            label: 'Customer Details',  roles: ['admin','manager'],           group: 'management' },
    { path: '/app/employees', icon: UtensilsCrossed,  label: 'Employee Details',  roles: ['admin'],                     group: 'management' },
    { path: '/app/products',  icon: Package,          label: 'Menu Items',        roles: ['admin','manager'],           group: 'management' },
    { path: '/app/coupons',   icon: Tags,             label: 'Coupons',           roles: ['admin','manager'],           group: 'management' },
    { path: '/app/reports',   icon: BarChart3,        label: 'Reports',           roles: ['admin','manager'],           group: 'management' },
    { path: '/app/settings',  icon: Settings,         label: 'Settings',          roles: ['admin'],                     group: 'management' },
  ];

  const navItems = allNavItems.filter(item =>
    item.roles.includes(currentUser.role) || currentUser.role === 'admin'
  );

  const operationsItems = navItems.filter(i => i.group === 'operations');
  const managementItems = navItems.filter(i => i.group === 'management');
  const currentLabel = navItems.find(i => i.path === location.pathname)?.label || 'Overview';

  const NavButton = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    return (
      <button
        onClick={() => { navigate(item.path); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-solid'
            : 'text-surface-600 hover:text-surface-900 hover:bg-red-50 border border-transparent hover:border-red-100'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-primary-500'}`} />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0 bg-white/80 backdrop-blur-md border-r border-red-100 shadow-solid`}>

        {/* Logo */}
        <div className="p-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-solid">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-surface-900 font-bold text-base leading-tight">{settings.restaurantName}</h1>
              <p className="text-primary-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">Where Comfort Meets Flavor</p>
            </div>
          </div>
          <button className="lg:hidden absolute top-4 right-4 text-surface-400 hover:text-surface-900" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4 scrollbar-hide">
          {operationsItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-400 px-3 mb-2">🔥 Operations</p>
              <div className="space-y-0.5">{operationsItems.map(i => <NavButton key={i.path} item={i} />)}</div>
            </div>
          )}
          {managementItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent-500 px-3 mb-2">⚙️ Management</p>
              <div className="space-y-0.5">{managementItems.map(i => <NavButton key={i.path} item={i} />)}</div>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-red-100 bg-gradient-to-r from-red-50 to-orange-50 shrink-0">
          <div className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-xl mb-2 shadow-solid">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-solid">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-surface-900 text-xs font-bold truncate">{currentUser.name}</p>
              <p className="text-surface-400 text-[10px] capitalize">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-primary-500 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 rounded-xl text-xs font-bold transition-all border border-primary-200 hover:border-transparent"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-red-100 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-header">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-surface-400 hover:text-primary-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-primary-500">🔥</span>
              <h1 className="text-sm font-bold text-surface-900 hidden sm:block">{currentLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center text-xs text-surface-500 hover:text-primary-600 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors font-semibold border border-transparent hover:border-red-200"
            >
              ← Home
            </button>
            {/* Flame accent */}
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-solid">
              <Flame className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}