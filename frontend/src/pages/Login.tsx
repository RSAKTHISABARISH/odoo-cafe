// ============================================================
// Café POS — Login Page (Dual Path: Customer + Staff)
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useEmployeeStore, useSettingsStore } from '../store';
import { api } from '../utils/api';
import {
  Coffee, User, Lock, Eye, EyeOff, AlertCircle,
  ArrowLeft, Monitor, Smartphone, ChevronRight, Briefcase
} from 'lucide-react';

type LoginMode = 'select' | 'customer' | 'staff';

export default function Login() {
  const [mode, setMode] = useState<LoginMode>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { employees } = useEmployeeStore();
  const { settings } = useSettingsStore();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const employee = await api.loginEmployee(username, password);
      login(employee);
      if (employee.role === 'kitchen') navigate('/app/kitchen');
      else if (employee.role === 'waiter') navigate('/app/tables');
      else navigate('/app/dashboard');
    } catch {
      // Fallback to local store
      const local = employees.find(e => e.username === username && e.password === password && e.active);
      if (local) {
        login(local);
        if (local.role === 'kitchen') navigate('/app/kitchen');
        else if (local.role === 'waiter') navigate('/app/tables');
        else navigate('/app/dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setTimeout(() => {
      const form = document.getElementById('staff-form') as HTMLFormElement;
      form?.requestSubmit();
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF8F5 0%, #FFF0EA 50%, #FFE8DC 100%)' }}>


      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-300/5 rounded-full blur-2xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-red-100 bg-white/70 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-solid">
            <span className="text-lg">🔥</span>
          </div>
          <span className="text-surface-900 font-bold text-lg">{settings.restaurantName}</span>
        </div>
        <span className="text-primary-500 text-sm font-semibold italic">🌶️ Where Comfort Meets Flavor</span>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* SELECT MODE */}
        {mode === 'select' && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl mb-4 shadow-float">
                <span className="text-3xl">🔥</span>
              </div>
              <h1 className="text-4xl font-bold text-surface-900 mb-2 tracking-tight">Welcome Back!</h1>
              <p className="text-surface-500">Who are you today?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Customer */}
              <button
                onClick={() => setMode('customer')}
                className="group relative p-8 bg-white border-2 border-red-100 hover:border-primary-400 rounded-2xl text-left transition-all duration-300 hover:shadow-float overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-orange-400/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-solid text-2xl">
                    🍽️
                  </div>
                  <h2 className="text-xl font-bold text-surface-900 mb-2">Customer</h2>
                  <p className="text-surface-500 text-sm leading-relaxed mb-6">
                    Browse our menu, place your order, and enjoy. Staff handles payment at the counter.
                  </p>
                  <div className="flex items-center gap-2 text-primary-600 text-sm font-bold">
                    <span>Order Now</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Staff */}
              <button
                onClick={() => setMode('staff')}
                className="group relative p-8 bg-white border-2 border-orange-100 hover:border-accent-500 rounded-2xl text-left transition-all duration-300 hover:shadow-float overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-solid text-2xl">
                    👨‍🍳
                  </div>
                  <h2 className="text-xl font-bold text-surface-900 mb-2">Staff / Admin</h2>
                  <p className="text-surface-500 text-sm leading-relaxed mb-6">
                    Employee login for POS, kitchen, orders management and administration.
                  </p>
                  <div className="flex items-center gap-2 text-accent-600 text-sm font-bold">
                    <span>Sign In</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* CUSTOMER MODE */}
        {mode === 'customer' && (
          <div className="w-full max-w-sm">
            <button
              onClick={() => setMode('select')}
              className="flex items-center gap-2 text-surface-400 hover:text-primary-600 text-sm mb-8 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-white border-2 border-red-100 rounded-2xl p-8 shadow-float">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 shadow-solid text-2xl">
                🍽️
              </div>
              <h2 className="text-2xl font-bold text-surface-900 mb-1">Place an Order</h2>
              <p className="text-surface-500 text-sm mb-8">How would you like to order today?</p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/self-order')}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-100 hover:border-primary-400 rounded-xl transition-all group hover:shadow-solid"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-xl shadow-solid">
                      🪑
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-surface-900 text-sm">Self Ordering</p>
                      <p className="text-surface-400 text-xs mt-0.5">Order from your table</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => navigate('/self-order')}
                  className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-100 hover:border-accent-400 rounded-xl transition-all group hover:shadow-solid"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-amber-500 rounded-xl flex items-center justify-center text-xl shadow-solid">
                      📱
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-surface-900 text-sm">Online Ordering</p>
                      <p className="text-surface-400 text-xs mt-0.5">Order ahead, pick up at counter</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-accent-400 group-hover:text-accent-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <p className="text-center text-surface-400 text-xs mt-8 italic">
                🔥 Payment is handled by our staff at the counter
              </p>
            </div>
          </div>
        )}

        {/* STAFF MODE */}
        {mode === 'staff' && (
          <div className="w-full max-w-sm">
            <button
              onClick={() => { setMode('select'); setError(''); setUsername(''); setPassword(''); }}
              className="flex items-center gap-2 text-surface-400 hover:text-primary-600 text-sm mb-8 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-white border-2 border-orange-100 rounded-2xl p-8 shadow-float">
              <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-solid text-2xl">
                👨‍🍳
              </div>
              <h2 className="text-2xl font-bold text-surface-900 mb-1">Staff Login</h2>
              <p className="text-surface-500 text-sm mb-8">Sign in with your credentials</p>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form id="staff-form" onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="your.username"
                      autoComplete="username"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-red-50 border-2 border-red-100 rounded-xl text-surface-900 placeholder-surface-400 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full pl-10 pr-11 py-3 bg-red-50 border-2 border-red-100 rounded-xl text-surface-900 placeholder-surface-400 text-sm focus:outline-none focus:border-primary-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-primary-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-solid hover:shadow-solid-hover mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : '🔥 Sign In'}
                </button>
              </form>

              {/* Quick Access */}
              <div className="mt-8 pt-6 border-t border-red-100">
                <p className="text-center text-surface-400 text-xs uppercase tracking-wider mb-4">Demo Access</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '🔴 Admin',   user: 'admin', color: 'border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400' },
                    { label: '🟠 Manager', user: 'sneha', color: 'border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400' },
                    { label: '🟡 Waiter',  user: 'rohan', color: 'border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400' },
                    { label: '🍳 Kitchen', user: 'rajan', color: 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-400' },
                  ].map(d => (
                    <button
                      key={d.label}
                      onClick={() => handleQuickLogin(d.user, 'password')}
                      className={`py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all ${d.color}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="relative z-10 py-4 text-center text-surface-400 text-xs">
        🔥 Powered by {settings.restaurantName} POS &mdash; v2.0
      </footer>
    </div>
  );
}