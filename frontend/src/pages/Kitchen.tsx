// ============================================================
// Velora Café — Kitchen Display System (KDS)
// Real-time order status sync to OrderTrack via shared store
// ============================================================
import { useState, useEffect } from 'react';
import { useKDSStore, useOrderStore } from '../store';
import { Clock, ChefHat, CheckCircle, Flame, Bell } from 'lucide-react';
import type { KDSTicket } from '../types';

const STATUS_CONFIG = {
  queued:    { label: 'Queued',    color: 'border-blue-400',      bg: 'bg-blue-50',       header: 'bg-blue-100',       badge: 'bg-blue-400',      text: 'text-blue-700' },
  preparing: { label: 'Preparing', color: 'border-orange-400',    bg: 'bg-orange-50',     header: 'bg-orange-100',     badge: 'bg-orange-400',    text: 'text-orange-700' },
  ready:     { label: 'Ready',     color: 'border-accent-500',    bg: 'bg-accent-50',     header: 'bg-accent-100',     badge: 'bg-accent-500',    text: 'text-accent-700' },
  served:    { label: 'Served',    color: 'border-surface-300',   bg: 'bg-surface-100',   header: 'bg-surface-200',    badge: 'bg-surface-400',   text: 'text-surface-600' },
};

function elapsedMinutes(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function ElapsedBadge({ createdAt, status }: { createdAt: string; status: string }) {
  const [mins, setMins] = useState(elapsedMinutes(createdAt));
  useEffect(() => {
    if (status === 'served') return;
    const t = setInterval(() => setMins(elapsedMinutes(createdAt)), 10000);
    return () => clearInterval(t);
  }, [createdAt, status]);

  const isLate = mins > 15;
  const isUrgent = mins > 20;
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
      isUrgent ? 'bg-red-100 text-red-600 animate-pulse' :
      isLate   ? 'bg-amber-100 text-amber-700' :
                 'bg-surface-200 text-surface-600'
    }`}>
      {isUrgent ? <Flame size={11} /> : <Clock size={11} />}
      {mins}m
    </span>
  );
}

function TicketCard({ ticket }: { ticket: KDSTicket }) {
  const { updateTicketStatus, updateItemStatus } = useKDSStore();
  const { updateOrderStatus } = useOrderStore();
  const cfg = STATUS_CONFIG[ticket.status];

  const handleTicketAction = () => {
    if (ticket.status === 'queued') {
      updateTicketStatus(ticket.id, 'preparing');
      updateOrderStatus(ticket.orderId, 'preparing'); // sync to order tracker
    } else if (ticket.status === 'preparing') {
      updateTicketStatus(ticket.id, 'ready');
      updateOrderStatus(ticket.orderId, 'ready'); // sync to order tracker
    } else if (ticket.status === 'ready') {
      updateTicketStatus(ticket.id, 'served');
      updateOrderStatus(ticket.orderId, 'served'); // sync to order tracker
    }
  };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all shadow-solid ${cfg.color} ${cfg.bg} ${ticket.priority === 'rush' ? 'shadow-lg shadow-red-400/30 ring-2 ring-red-300' : ''}`}>
      {/* Card Header */}
      <div className={`${cfg.header} px-4 py-3 flex items-center justify-between border-b ${cfg.color}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${cfg.badge}`} />
          <span className="font-bold text-surface-900 font-mono tracking-wider">{ticket.orderNumber}</span>
          {ticket.priority === 'rush' && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold flex items-center gap-1">
              <Flame size={10} /> RUSH
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-surface-600 text-sm font-medium">🪑 {ticket.tableName}</span>
          <ElapsedBadge createdAt={ticket.createdAt} status={ticket.status} />
        </div>
      </div>

      {/* Status pill */}
      <div className="px-4 pt-3">
        <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${cfg.text} bg-white/70 border ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {ticket.items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (ticket.status === 'preparing') {
                const nextStatus = item.status === 'preparing' ? 'ready' : 'preparing';
                updateItemStatus(ticket.id, idx, nextStatus as any);
              }
            }}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
              item.status === 'ready'
                ? 'bg-accent-50 border-accent-300 opacity-75'
                : item.status === 'preparing'
                ? 'bg-orange-50 border-orange-300 cursor-pointer hover:bg-orange-100'
                : 'bg-white border-surface-200'
            } ${ticket.status === 'preparing' ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold ${
                item.status === 'ready' ? 'bg-accent-500 text-white' : 'bg-surface-200 text-surface-700'
              }`}>
                {item.status === 'ready' ? '✓' : item.quantity}
              </span>
              <div>
                <p className={`text-sm font-medium ${item.status === 'ready' ? 'text-surface-400 line-through' : 'text-surface-900'}`}>
                  {item.name}
                </p>
                {item.notes && <p className="text-xs text-surface-500">📝 {item.notes}</p>}
              </div>
            </div>
            {item.status === 'preparing' && (
              <span className="text-xs text-orange-600 animate-pulse font-medium">Cooking...</span>
            )}
            {item.status === 'ready' && (
              <CheckCircle size={16} className="text-accent-600" />
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      {ticket.status !== 'served' && (
        <div className="px-4 pb-4">
          <button
            onClick={handleTicketAction}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              ticket.status === 'queued'    ? 'bg-blue-500 hover:bg-blue-600 text-white' :
              ticket.status === 'preparing' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                                              'bg-accent-500 hover:bg-accent-600 text-white'
            }`}
          >
            {ticket.status === 'queued'    && <><ChefHat size={16} /> Start Preparing</>}
            {ticket.status === 'preparing' && <><CheckCircle size={16} /> Mark Ready</>}
            {ticket.status === 'ready'     && <><Bell size={16} /> Mark Served</>}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Kitchen() {
  const { tickets } = useKDSStore();
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const queued    = tickets.filter(t => t.status === 'queued');
  const preparing = tickets.filter(t => t.status === 'preparing');
  const ready     = tickets.filter(t => t.status === 'ready');
  const served    = tickets.filter(t => t.status === 'served').slice(0, 10);

  const activeTickets = [...queued, ...preparing, ...ready].sort((a, b) => {
    const priority = (t: KDSTicket) => t.priority === 'rush' ? 0 : 1;
    return priority(a) - priority(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const displayTickets = filterStatus === 'active' ? activeTickets : served;

  const avgWait = preparing.length > 0
    ? Math.round(preparing.reduce((s, t) => s + elapsedMinutes(t.createdAt), 0) / preparing.length)
    : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <ChefHat size={26} className="text-primary-600" /> ☕ Kitchen Display
          </h1>
          <p className="text-surface-500 text-sm mt-1 italic">Where Comfort Meets Flavor — Live kitchen view</p>
        </div>
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2">
          <Clock size={16} className="text-primary-600" />
          <div>
            <p className="text-xs text-surface-500">Avg Wait</p>
            <p className="text-surface-900 font-bold text-sm">{avgWait}m</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {[
          { label: 'Queued',    count: queued.length,    color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
          { label: 'Preparing', count: preparing.length, color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-200' },
          { label: 'Ready',     count: ready.length,     color: 'text-accent-600', bg: 'bg-accent-50',  border: 'border-accent-200' },
        ].map(stat => (
          <div key={stat.label} className={`p-4 rounded-2xl border ${stat.bg} ${stat.border} shadow-solid`}>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-surface-600 text-sm mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-surface-200 p-1 rounded-xl w-fit border border-surface-300">
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === 'active' ? 'bg-primary-600 text-white shadow-solid' : 'text-surface-600 hover:text-surface-900'}`}
        >
          ☕ Active ({activeTickets.length})
        </button>
        <button
          onClick={() => setFilterStatus('served')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${filterStatus === 'served' ? 'bg-primary-600 text-white shadow-solid' : 'text-surface-600 hover:text-surface-900'}`}
        >
          ✅ Completed
        </button>
      </div>

      {/* Tickets Grid */}
      {displayTickets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-surface-400">
          <ChefHat size={56} className="mx-auto mb-4 opacity-20 text-primary-400" />
          <p className="text-xl font-medium text-surface-600">
            {filterStatus === 'active' ? '🎉 All caught up! No active tickets.' : '📋 No completed tickets yet.'}
          </p>
        </div>
      )}
    </div>
  );
}