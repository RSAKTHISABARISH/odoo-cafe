// ============================================================
// CaféFlow POS — Table & Floor Management
// ============================================================
import { useState } from 'react';
import { useTableStore, useOrderStore } from '../store';
import { Plus, X, Edit2, Layers, Grid3x3, Circle, RectangleHorizontal } from 'lucide-react';
import type { Table, Floor } from '../types';

const STATUS_CONFIG = {
  available:  { label: 'Available',  color: 'bg-accent-500', border: 'border-accent-500/60', bg: 'bg-emerald-900/20', text: 'text-accent-600' },
  occupied:   { label: 'Occupied',   color: 'bg-red-500',     border: 'border-red-500/60',     bg: 'bg-red-900/20',     text: 'text-red-400' },
  reserved:   { label: 'Reserved',   color: 'bg-primary-500',   border: 'border-primary-500/60',   bg: 'bg-amber-900/20',   text: 'text-primary-600' },
  cleaning:   { label: 'Cleaning',   color: 'bg-blue-500',    border: 'border-blue-500/60',    bg: 'bg-blue-900/20',    text: 'text-blue-400' },
};

const SHAPE_ICONS = {
  square: <Grid3x3 size={20} />,
  round: <Circle size={20} />,
  rectangle: <RectangleHorizontal size={20} />,
};

const FLOOR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Tables() {
  const { floors, tables, addFloor, updateFloor, addTable, updateTable, setTableStatus } = useTableStore();
  const { orders } = useOrderStore();
  const [selectedFloor, setSelectedFloor] = useState<string>(floors[0]?.id || '');
  const [addingTable, setAddingTable] = useState(false);
  const [addingFloor, setAddingFloor] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const floorTables = tables.filter(t => t.floorId === selectedFloor);
  const currentFloor = floors.find(f => f.id === selectedFloor);

  const getTableOrder = (tableId: string) =>
    orders.find(o => o.tableId === tableId && !['paid', 'cancelled'].includes(o.status));

  const handleAddFloor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newFloor: Floor = {
      id: 'floor-' + Date.now(),
      name: fd.get('name') as string,
      color: fd.get('color') as string || '#6366f1',
      active: true,
    };
    addFloor(newFloor);
    setSelectedFloor(newFloor.id);
    setAddingFloor(false);
  };

  const handleAddTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newTable: Table = {
      id: 'table-' + Date.now(),
      floorId: selectedFloor,
      number: Number(fd.get('number')),
      seats: Number(fd.get('seats')),
      shape: fd.get('shape') as Table['shape'],
      status: 'available',
      x: Math.floor(Math.random() * 60) + 10,
      y: Math.floor(Math.random() * 60) + 10,
    };
    addTable(newTable);
    setAddingTable(false);
  };

  const handleUpdateTable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTable) return;
    const fd = new FormData(e.currentTarget);
    updateTable(editingTable.id, {
      number: Number(fd.get('number')),
      seats: Number(fd.get('seats')),
      shape: fd.get('shape') as Table['shape'],
      status: fd.get('status') as Table['status'],
    });
    setEditingTable(null);
  };

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = tables.filter(t => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Table & Floor Management</h1>
          <p className="text-slate-400 text-sm mt-1">{tables.length} tables across {floors.length} floors</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAddingFloor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-surface-900 rounded-xl font-medium transition-all border border-slate-600"
          >
            <Layers size={18} /> Add Floor
          </button>
          <button
            onClick={() => setAddingTable(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} /> Add Table
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(STATUS_CONFIG) as [keyof typeof STATUS_CONFIG, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([status, cfg]) => (
          <div key={status} className={`p-4 rounded-2xl border ${cfg.border} ${cfg.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
              <span className="text-xs text-slate-400">{cfg.label}</span>
            </div>
            <p className={`text-3xl font-bold ${cfg.text}`}>{counts[status] || 0}</p>
          </div>
        ))}
      </div>

      {/* Floor Tabs */}
      <div className="flex gap-2 flex-wrap">
        {floors.map(floor => (
          <button
            key={floor.id}
            onClick={() => setSelectedFloor(floor.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedFloor === floor.id
                ? 'text-surface-900 border-transparent'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-surface-900'
            }`}
            style={selectedFloor === floor.id ? { backgroundColor: floor.color, borderColor: floor.color } : {}}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Floor Map */}
      {currentFloor && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-surface-900 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentFloor.color }} />
              {currentFloor.name} — {floorTables.length} tables
            </h2>
          </div>
          <div className="relative min-h-96 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              opacity: 0.3
            }} />
            {floorTables.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                <Grid3x3 size={40} className="mb-2 opacity-40" />
                <p>No tables on this floor. Add one!</p>
              </div>
            )}
            {floorTables.map(table => {
              const cfg = STATUS_CONFIG[table.status];
              const activeOrder = getTableOrder(table.id);
              const isSelected = selectedTable?.id === table.id;
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(isSelected ? null : table)}
                  className={`absolute transition-all group ${isSelected ? 'scale-110 z-10' : 'hover:scale-105 z-0'}`}
                  style={{ left: `${table.x}%`, top: `${table.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`
                    relative flex flex-col items-center justify-center border-2 shadow-lg transition-all
                    ${table.shape === 'round' ? 'rounded-full' : table.shape === 'rectangle' ? 'rounded-xl w-20 h-14' : 'rounded-xl w-16 h-16'}
                    ${cfg.border} ${cfg.bg}
                    ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                  `} style={{ width: table.shape === 'rectangle' ? 80 : 64, height: table.shape === 'rectangle' ? 56 : 64 }}>
                    <span className="text-surface-900 font-bold text-sm">T{table.number}</span>
                    <span className="text-xs text-slate-400">{table.seats}💺</span>
                    {activeOrder && (
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={`block text-center text-xs mt-1 font-medium ${cfg.text}`}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Detail Popup */}
      {selectedTable && (() => {
        const activeOrder = getTableOrder(selectedTable.id);
        return (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between shrink-0 mb-4">
              <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                Table {selectedTable.number}
                {activeOrder && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30">{activeOrder.orderNumber}</span>}
              </h2>
              <button onClick={() => setSelectedTable(null)} className="text-slate-400 hover:text-surface-900 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="overflow-y-auto space-y-4 pr-1 hide-scrollbar">
              <div className="grid grid-cols-2 gap-2 text-sm shrink-0">
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">Seats</p>
                  <p className="text-surface-900 font-bold mt-1">{selectedTable.seats}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-slate-400 text-xs">Shape</p>
                  <p className="text-surface-900 font-bold mt-1 capitalize">{selectedTable.shape}</p>
                </div>
              </div>
              
              {activeOrder && (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Active Order</span>
                    <span>₹{activeOrder.total.toFixed(2)}</span>
                  </p>
                  <div className="space-y-2">
                    {activeOrder.lines.map(line => (
                      <div key={line.id} className="flex justify-between items-start text-sm">
                        <div>
                          <p className="text-slate-200 font-medium">{line.quantity}x {line.productName}</p>
                          {line.notes && <p className="text-xs text-slate-500">{line.notes}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          line.status === 'served' ? 'bg-emerald-900/30 text-accent-600 border-accent-500/30' :
                          line.status === 'ready' ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                          line.status === 'preparing' ? 'bg-amber-900/30 text-primary-600 border-primary-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {line.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-2">Change Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as Table['status'][]).map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => { setTableStatus(selectedTable.id, s); setSelectedTable({ ...selectedTable, status: s }); }}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                          selectedTable.status === s
                            ? `${cfg.color} text-surface-900 border-transparent`
                            : `${cfg.border} ${cfg.text} bg-transparent hover:${cfg.bg}`
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0 mt-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => { setEditingTable(selectedTable); setSelectedTable(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-surface-900 border border-slate-700 rounded-xl transition-colors text-sm"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => setSelectedTable(null)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add Table Modal */}
      {addingTable && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-surface-900">Add Table</h2>
              <button onClick={() => setAddingTable(false)} className="text-slate-400 hover:text-surface-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTable} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Table Number *</label>
                  <input name="number" type="number" min="1" required defaultValue={floorTables.length + 1} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Seats *</label>
                  <input name="seats" type="number" min="1" max="20" required defaultValue={4} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-2 block">Shape</label>
                  <div className="flex gap-2">
                    {(['square', 'round', 'rectangle'] as Table['shape'][]).map(shape => (
                      <label key={shape} className="flex-1 cursor-pointer">
                        <input type="radio" name="shape" value={shape} defaultChecked={shape === 'square'} className="sr-only peer" />
                        <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800 rounded-xl border border-slate-600 peer-checked:border-indigo-500 peer-checked:bg-indigo-900/30 hover:bg-slate-700 transition-all">
                          <span className="text-slate-300">{SHAPE_ICONS[shape]}</span>
                          <span className="text-xs text-slate-400 capitalize">{shape}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAddingTable(false)} className="flex-1 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors">Add Table</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Floor Modal */}
      {addingFloor && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-surface-900">Add Floor</h2>
              <button onClick={() => setAddingFloor(false)} className="text-slate-400 hover:text-surface-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddFloor} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Floor Name *</label>
                <input name="name" required placeholder="e.g. Ground Floor" className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Floor Color</label>
                <div className="flex gap-2 flex-wrap">
                  {FLOOR_COLORS.map(c => (
                    <label key={c} className="cursor-pointer">
                      <input type="radio" name="color" value={c} defaultChecked={c === '#6366f1'} className="sr-only peer" />
                      <div className="w-8 h-8 rounded-lg border-2 border-transparent peer-checked:border-white transition-all" style={{ backgroundColor: c }} />
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setAddingFloor(false)} className="flex-1 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors">Add Floor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-surface-900">Edit Table {editingTable.number}</h2>
              <button onClick={() => setEditingTable(null)} className="text-slate-400 hover:text-surface-900 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateTable} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Table Number</label>
                  <input name="number" type="number" min="1" defaultValue={editingTable.number} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Seats</label>
                  <input name="seats" type="number" min="1" max="20" defaultValue={editingTable.seats} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Shape</label>
                  <select name="shape" defaultValue={editingTable.shape} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500">
                    <option value="square">Square</option>
                    <option value="round">Round</option>
                    <option value="rectangle">Rectangle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Status</label>
                  <select name="status" defaultValue={editingTable.status} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-surface-900 focus:outline-none focus:border-indigo-500">
                    {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingTable(null)} className="flex-1 py-2.5 bg-slate-800 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-surface-900 rounded-xl transition-colors">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}