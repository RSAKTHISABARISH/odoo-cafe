// ============================================================
// Café POS — Employee Management (New, Delete, Archive, Change Password)
// ============================================================
import { useState } from 'react';
import { useEmployeeStore, useAuthStore } from '../store';
import { api } from '../utils/api';
import {
  Search, UserPlus, X, Edit2, Trash2, Phone, Mail,
  Archive, Key, CheckCircle, AlertCircle, Users
} from 'lucide-react';
import type { Employee, EmployeeRole } from '../types';

const ROLE_CONFIG: Record<EmployeeRole, { label: string; badge: string; dot: string }> = {
  admin: { label: 'Admin', badge: 'bg-primary-900/30 text-primary-400 border-primary-500/30', dot: 'bg-primary-400' },
  manager: { label: 'Manager', badge: 'bg-purple-900/30 text-purple-400 border-purple-500/30', dot: 'bg-purple-400' },
  waiter: { label: 'Waiter', badge: 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  kitchen: { label: 'Kitchen', badge: 'bg-amber-900/30 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  cashier: { label: 'Cashier', badge: 'bg-blue-900/30 text-blue-400 border-blue-500/30', dot: 'bg-blue-400' },
};

const AVATARS = ['👨‍💼', '👩‍💼', '👨‍🍳', '👩‍🍳', '🧑‍💼', '👨‍💻', '👩‍💻', '🧑‍🍳'];

type ModalMode = null | 'add' | 'edit' | 'delete' | 'archive' | 'password';

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployeeStore();
  const { currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Employee | null>(null);

  // Password change state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    setOldPass('');
    setNewPass('');
    setPassMsg(null);
  };

  const filteredEmployees = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || e.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = (Object.keys(ROLE_CONFIG) as EmployeeRole[]).reduce((acc, role) => {
    acc[role] = employees.filter(e => e.role === role).length;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Partial<Employee> = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      phone: fd.get('phone') as string,
      role: fd.get('role') as EmployeeRole,
      username: fd.get('username') as string,
      password: fd.get('password') as string || selected?.password || 'password',
      avatar: fd.get('avatar') as string || '👨‍💼',
      active: fd.get('active') === 'on',
    };

    if (modalMode === 'edit' && selected) {
      updateEmployee(selected.id, data);
    } else {
      addEmployee({
        ...data,
        id: 'emp-' + Date.now(),
        hireDate: new Date().toISOString(),
        active: true,
      } as Employee);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (selected) {
      deleteEmployee(selected.id);
      closeModal();
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    try {
      await api.archiveEmployee(selected.id);
    } catch {}
    updateEmployee(selected.id, { active: false });
    closeModal();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (newPass.length < 4) {
      setPassMsg({ ok: false, text: 'Password must be at least 4 characters.' });
      return;
    }
    try {
      await api.changePassword(selected.id, oldPass, newPass);
      setPassMsg({ ok: true, text: 'Password changed successfully!' });
      setTimeout(closeModal, 1500);
    } catch {
      // Fallback: local check
      if (selected.password !== oldPass) {
        setPassMsg({ ok: false, text: 'Current password is incorrect.' });
        return;
      }
      updateEmployee(selected.id, { password: newPass });
      setPassMsg({ ok: true, text: 'Password changed successfully!' });
      setTimeout(closeModal, 1500);
    }
  };

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Employee Details</h1>
          <p className="text-surface-500 text-sm mt-0.5">
            {employees.filter(e => e.active).length} active &bull; {employees.length} total
          </p>
        </div>
        <button
          onClick={() => { setSelected(null); setModalMode('add'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-surface-900 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-4 h-4" /> New Employee
        </button>
      </div>

      {/* Role filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(ROLE_CONFIG) as EmployeeRole[]).map(role => {
          const cfg = ROLE_CONFIG[role];
          return (
            <button
              key={role}
              onClick={() => setFilterRole(filterRole === role ? 'all' : role)}
              className={`p-4 rounded-xl border text-left transition-all ${
                filterRole === role
                  ? 'bg-indigo-600/20 border-indigo-500/60'
                  : 'bg-surface-50/60 border-surface-300/60 hover:border-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${cfg.dot} mb-2`} />
              <p className="text-2xl font-bold text-surface-900">{roleCounts[role] || 0}</p>
              <p className="text-xs text-surface-500 mt-0.5">{cfg.label}s</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredEmployees.map(emp => {
          const cfg = ROLE_CONFIG[emp.role];
          const isSelf = currentUser?.id === emp.id;
          return (
            <div
              key={emp.id}
              className="bg-white border border-surface-300 hover:border-surface-300 rounded-xl p-4 transition-all"
            >
              {/* Avatar + role */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-surface-50 rounded-xl flex items-center justify-center text-2xl border border-surface-300">
                  {emp.avatar}
                </div>
                <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg border capitalize ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              <h3 className="font-bold text-surface-900 text-sm mb-0.5">{emp.name}</h3>
              <p className="text-surface-400 text-xs flex items-center gap-1 mb-0.5">
                <Mail className="w-3 h-3" /> {emp.email || '—'}
              </p>
              <p className="text-surface-400 text-xs flex items-center gap-1 mb-3">
                <Phone className="w-3 h-3" /> {emp.phone || '—'}
              </p>

              {/* Status + actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${emp.active ? 'bg-accent-600' : 'bg-gray-600'}`} />
                  <span className={`text-[10px] font-medium ${emp.active ? 'text-accent-600' : 'text-surface-400'}`}>
                    {emp.active ? 'Active' : 'Archived'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Change Password */}
                  <button
                    onClick={() => { setSelected(emp); setModalMode('password'); }}
                    title="Change Password"
                    className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-amber-900/20 rounded-lg transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => { setSelected(emp); setModalMode('edit'); }}
                    title="Edit"
                    className="p-1.5 text-surface-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!isSelf && (
                    <>
                      {/* Archive */}
                      {emp.active && (
                        <button
                          onClick={() => { setSelected(emp); setModalMode('archive'); }}
                          title="Archive"
                          className="p-1.5 text-surface-400 hover:text-orange-400 hover:bg-orange-900/20 rounded-lg transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Delete */}
                      <button
                        onClick={() => { setSelected(emp); setModalMode('delete'); }}
                        title="Delete"
                        className="p-1.5 text-surface-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredEmployees.length === 0 && (
          <div className="col-span-4 text-center py-20 text-surface-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No employees found</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-surface-300 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-surface-300 sticky top-0 bg-white">
              <h2 className="font-bold text-surface-900">{modalMode === 'edit' ? 'Edit Employee' : 'New Employee'}</h2>
              <button onClick={closeModal} className="text-surface-400 hover:text-surface-900 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Avatar */}
              <div>
                <label className="text-xs text-surface-500 font-semibold uppercase tracking-wider mb-2 block">Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map(av => (
                    <label key={av} className="cursor-pointer">
                      <input type="radio" name="avatar" value={av} defaultChecked={selected?.avatar === av || (!selected && av === '👨‍💼')} className="sr-only peer" />
                      <div className="w-10 h-10 flex items-center justify-center text-xl rounded-xl bg-surface-50 peer-checked:bg-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-400 hover:bg-surface-200 transition-all">
                        {av}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-surface-500 mb-1 block">Full Name *</label>
                  <input name="name" required defaultValue={selected?.name}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Username *</label>
                  <input name="username" required defaultValue={selected?.username}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Role *</label>
                  <select name="role" defaultValue={selected?.role || 'waiter'}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
                    {(Object.keys(ROLE_CONFIG) as EmployeeRole[]).map(r => (
                      <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                    ))}
                  </select>
                </div>
                {modalMode === 'add' && (
                  <div>
                    <label className="text-xs text-surface-500 mb-1 block">Password *</label>
                    <input name="password" type="password" required defaultValue=""
                      className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Email</label>
                  <input name="email" type="email" defaultValue={selected?.email}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-surface-500 mb-1 block">Phone</label>
                  <input name="phone" defaultValue={selected?.phone}
                    className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input name="active" type="checkbox" id="emp_active" defaultChecked={selected ? selected.active : true} className="w-4 h-4 accent-indigo-500 rounded" />
                  <label htmlFor="emp_active" className="text-sm text-surface-600">Employee is active</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-surface-50 border border-surface-300 text-surface-600 rounded-xl hover:bg-surface-200 text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-surface-900 rounded-xl text-sm transition-colors font-semibold">
                  {modalMode === 'edit' ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ─────────────────────────── */}
      {modalMode === 'password' && selected && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-surface-300 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-300">
              <div>
                <h2 className="font-bold text-surface-900">Change Password</h2>
                <p className="text-surface-400 text-xs mt-0.5">{selected.name}</p>
              </div>
              <button onClick={closeModal} className="text-surface-400 hover:text-surface-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${passMsg.ok ? 'bg-emerald-900/20 text-accent-600 border border-emerald-700/30' : 'bg-red-900/20 text-red-400 border border-red-700/30'}`}>
                  {passMsg.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {passMsg.text}
                </div>
              )}
              <div>
                <label className="text-xs text-surface-500 mb-1 block">Current Password</label>
                <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} required
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-primary-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-surface-500 mb-1 block">New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required minLength={4}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-300 rounded-xl text-surface-900 text-sm focus:outline-none focus:border-primary-500 transition-colors" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-surface-50 border border-surface-300 text-surface-600 rounded-xl text-sm hover:bg-surface-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-colors">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Archive Confirm ───────────────────────────────── */}
      {modalMode === 'archive' && selected && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-orange-900/40 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto">
              <Archive className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 text-lg">Archive Employee?</h3>
              <p className="text-surface-500 text-sm mt-1">{selected.name} will be deactivated and archived.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 bg-surface-50 border border-surface-300 text-surface-600 rounded-xl text-sm hover:bg-surface-200 transition-colors">Cancel</button>
              <button onClick={handleArchive} className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-surface-900 rounded-xl text-sm font-semibold transition-colors">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────── */}
      {modalMode === 'delete' && selected && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-red-900/40 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 text-lg">Delete Employee?</h3>
              <p className="text-surface-500 text-sm mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-2.5 bg-surface-50 border border-surface-300 text-surface-600 rounded-xl text-sm hover:bg-surface-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-surface-900 rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}