// ============================================================
// CaféFlow POS — Settings Page
// ============================================================
import { useState } from 'react';
import { useSettingsStore, useAuditStore } from '../store';
import { Settings as SettingsIcon, Save, Store, Receipt, Palette, ShieldAlert, Database } from 'lucide-react';
import { api } from '../utils/api';

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();
  const { logs } = useAuditStore();
  const [formData, setFormData] = useState(settings);
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = () => {
    updateSettings(formData);
    alert('Settings saved successfully!');
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm("Are you sure you want to seed the database with default data?")) return;
    try {
      await api.seedDatabase();
      alert("Database seeded successfully! Please reload the page to fetch the new data.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to seed the database.");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-surface-900 dark:text-surface-900">Settings</h1>
          <p className="text-surface-500 mt-1">Configure your POS preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {[
            { id: 'general', label: 'General Info', icon: Store },
            { id: 'billing', label: 'Billing & Taxes', icon: Receipt },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-surface-900 shadow-lg shadow-primary-500/25'
                  : 'glass-card text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 glass-card p-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold font-display border-b border-surface-200 dark:border-surface-700 pb-2 mb-4">General Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.currencySymbol}
                    onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-bold font-display text-surface-900 mb-2">Database Management</h3>
                <p className="text-surface-500 text-sm mb-4">Initialize your database with default categories, products, and tables.</p>
                <button onClick={handleSeedDatabase} className="btn-secondary flex items-center gap-2">
                  <Database className="w-4 h-4" /> Seed Default Data
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold font-display border-b border-surface-200 dark:border-surface-700 pb-2 mb-4">Billing & Taxes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
                <h3 className="text-lg font-bold font-display text-surface-900 mb-2">UPI Payment Details</h3>
                <p className="text-surface-500 text-sm mb-4">Configure the default UPI details for payments and dynamic QR codes.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">UPI ID (VPA)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. cafe@upi"
                      value={formData.upiId || ''}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1">Payee Name</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Velora Café"
                      value={formData.upiName || ''}
                      onChange={(e) => setFormData({ ...formData, upiName: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold font-display border-b border-surface-200 dark:border-surface-700 pb-2 mb-4">Appearance</h2>
              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Theme Preference</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, theme: 'light' })}
                    className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${
                      formData.theme === 'light' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-surface-200 hover:border-surface-300 bg-white'
                    }`}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, theme: 'dark' })}
                    className={`flex-1 py-4 border-2 rounded-xl font-bold transition-all ${
                      formData.theme === 'dark' 
                        ? 'border-primary-500 bg-primary-900/30 text-primary-400' 
                        : 'border-surface-700 hover:border-surface-600 bg-surface-800 text-surface-900'
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-2 mb-4">
                <h2 className="text-xl font-bold font-display">Audit Logs</h2>
                <span className="text-sm text-surface-500">{logs.length} records</span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {logs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">
                        <span className="text-primary-600 dark:text-primary-400">{log.userName}</span>
                      </p>
                      <p className="text-sm text-surface-700 dark:text-surface-300">{log.action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-surface-500">{new Date(log.timestamp).toLocaleString()}</p>
                      <span className="badge badge-info mt-1">{log.entity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}