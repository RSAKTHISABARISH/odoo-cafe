import { useState } from 'react';
import {
  CalendarDays, Clock, Users, User, ArrowRight, CheckCircle2,
  XCircle, Phone, Mail, MessageSquare, AlertTriangle, RefreshCw, ArrowLeft
} from 'lucide-react';
import { useSettingsStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { sendReservationConfirmationEmail } from '../utils/onesignal';

// ── Types ────────────────────────────────────────────────────
interface ReservationRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  specialRequests: string;
  bookedAt: string;
  confirmationCode: string;
}

// ── Config ───────────────────────────────────────────────────
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];
const MAX_RESERVATIONS_PER_SLOT = 3; // max simultaneous bookings per time slot

// In-memory store for this session (simulates a backend)
const sessionReservations: ReservationRecord[] = [
  // Seed some existing bookings to show availability logic
  { id: 'r1', name: 'Ravi Kumar', phone: '', email: '', date: new Date().toISOString().split('T')[0], time: '19:00', guests: 4, specialRequests: '', bookedAt: '', confirmationCode: '' },
  { id: 'r2', name: 'Priya Sharma', phone: '', email: '', date: new Date().toISOString().split('T')[0], time: '19:00', guests: 2, specialRequests: '', bookedAt: '', confirmationCode: '' },
  { id: 'r3', name: 'Arun Raj', phone: '', email: '', date: new Date().toISOString().split('T')[0], time: '19:00', guests: 3, specialRequests: '', bookedAt: '', confirmationCode: '' },
];

function generateConfirmationCode(): string {
  return 'CT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function isSlotAvailable(date: string, time: string): boolean {
  const count = sessionReservations.filter(r => r.date === date && r.time === time).length;
  return count < MAX_RESERVATIONS_PER_SLOT;
}

function getAlternativeSlots(date: string, time: string): string[] {
  const timeIndex = TIME_SLOTS.indexOf(time);
  const alternatives: string[] = [];

  // Check surrounding slots first (±30min, ±1h, ±1.5h)
  const offsets = [-1, 1, -2, 2, -3, 3, -4, 4];
  for (const offset of offsets) {
    const idx = timeIndex + offset;
    if (idx >= 0 && idx < TIME_SLOTS.length) {
      const slot = TIME_SLOTS[idx];
      if (isSlotAvailable(date, slot)) {
        alternatives.push(slot);
        if (alternatives.length >= 3) break;
      }
    }
  }

  // If not enough on same date, suggest tomorrow's same time
  if (alternatives.length < 3) {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (isSlotAvailable(tomorrowStr, time)) {
      alternatives.push(`${tomorrowStr}|${time}`);
    }
  }

  return alternatives;
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Component ────────────────────────────────────────────────
export default function Reservation() {
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    guests: '2',
    specialRequests: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'form' | 'unavailable' | 'confirmed'>('form');
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationRecord | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      newErrors.name = 'Please enter your full name (at least 2 characters).';
    if (!form.phone.match(/^[6-9]\d{9}$/))
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.email && !form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      newErrors.email = 'Enter a valid email address.';
    if (!form.date)
      newErrors.date = 'Please select a date.';
    else if (form.date < today)
      newErrors.date = 'Reservation date cannot be in the past.';
    if (!form.time)
      newErrors.time = 'Please select a time.';
    if (!form.guests)
      newErrors.guests = 'Please select number of guests.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsChecking(true);
    // Simulate async availability check (400ms)
    setTimeout(async () => {
      setIsChecking(false);
      if (isSlotAvailable(form.date, form.time)) {
        // Create the reservation
        const newReservation: ReservationRecord = {
          id: 'r-' + Date.now(),
          name: form.name.trim(),
          phone: form.phone,
          email: form.email,
          date: form.date,
          time: form.time,
          guests: parseInt(form.guests),
          specialRequests: form.specialRequests.trim(),
          bookedAt: new Date().toISOString(),
          confirmationCode: generateConfirmationCode(),
        };
        sessionReservations.push(newReservation);
        setConfirmedReservation(newReservation);
        setStep('confirmed');

        // ── Send OneSignal confirmation email ──────────────
        if (newReservation.email) {
          sendReservationConfirmationEmail({
            toEmail:          newReservation.email,
            guestName:        newReservation.name,
            date:             formatDate(newReservation.date),
            time:             formatTime(newReservation.time),
            guests:           newReservation.guests,
            confirmationCode: newReservation.confirmationCode,
            specialRequests:  newReservation.specialRequests || undefined,
            restaurantName:   settings.restaurantName,
          }).then(result => {
            if (result.success) {
              console.log('[Notification] Confirmation email sent to', newReservation.email);
            } else {
              console.warn('[Notification] Email not sent:', result.message);
            }
          });
        }
      } else {
        const alts = getAlternativeSlots(form.date, form.time);
        setAlternatives(alts);
        setStep('unavailable');
      }
    }, 400);
  };

  const handleAlternativeSelect = (alt: string) => {
    if (alt.includes('|')) {
      const [date, time] = alt.split('|');
      setForm(f => ({ ...f, date, time }));
    } else {
      setForm(f => ({ ...f, time: alt }));
    }
    setStep('form');
    setAlternatives([]);
  };

  const handleChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: '' }));
  };

  const inputClass = (field: string) =>
    `input pl-12 py-3 bg-black/40 border text-surface-900 focus:border-primary-400 w-full backdrop-blur-sm ${
      errors[field] ? 'border-rose-500' : 'border-white/20'
    }`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Full-screen Background */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center animate-slow-zoom"
          style={{ backgroundImage: 'url(/images/veloura_cafe_bg.png)' }}
        />
      </div>
      <div className="absolute inset-0 bg-black/65" />

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-surface-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link to="/" className="text-xl font-display font-bold text-surface-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm">☕</span>
            {settings.restaurantName}
          </Link>
        </div>
        <Link to="/login" className="text-surface-900/70 hover:text-surface-900 font-medium text-sm transition-colors">
          Staff Login
        </Link>
      </nav>

      {/* ── STEP: FORM ──────────────────────────────────────── */}
      {step === 'form' && (
        <div className="w-full max-w-lg relative z-10 animate-slide-up mt-16">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-display font-bold text-surface-900 mb-2 tracking-tight">Reserve a Table</h1>
            <p className="text-surface-900/60">Experience the finest dining at {settings.restaurantName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className={inputClass('name')}
                />
              </div>
              {errors.name && <p className="text-rose-400 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={inputClass('phone')}
                  />
                </div>
                {errors.phone && <p className="text-rose-400 text-xs mt-1 ml-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className={inputClass('email')}
                  />
                </div>
                {errors.email && <p className="text-rose-400 text-xs mt-1 ml-1">{errors.email}</p>}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Date *</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <input
                    type="date"
                    min={today}
                    value={form.date}
                    onChange={e => handleChange('date', e.target.value)}
                    className={inputClass('date') + ' [color-scheme:dark]'}
                  />
                </div>
                {errors.date && <p className="text-rose-400 text-xs mt-1 ml-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Time *</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                  <select
                    value={form.time}
                    onChange={e => handleChange('time', e.target.value)}
                    className={inputClass('time') + ' appearance-none cursor-pointer'}
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot} className="bg-surface-900 text-surface-900">
                        {formatTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.time && <p className="text-rose-400 text-xs mt-1 ml-1">{errors.time}</p>}
              </div>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">Number of Guests *</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <select
                  value={form.guests}
                  onChange={e => handleChange('guests', e.target.value)}
                  className={inputClass('guests') + ' appearance-none cursor-pointer'}
                >
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n} className="bg-surface-900 text-surface-900">
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                  <option value="10+" className="bg-surface-900 text-surface-900">10+ Guests (call us)</option>
                </select>
              </div>
            </div>

            {/* Special Requests */}
            <div>
              <label className="block text-surface-900/70 text-sm font-semibold mb-1.5 ml-1">
                <MessageSquare className="inline w-4 h-4 mr-1" />Special Requests (Optional)
              </label>
              <textarea
                placeholder="Window seat, anniversary celebration, dietary restrictions, high chair needed..."
                value={form.specialRequests}
                onChange={e => handleChange('specialRequests', e.target.value)}
                rows={3}
                className="input p-4 bg-black/40 border border-white/20 text-surface-900 focus:border-primary-400 w-full resize-none backdrop-blur-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-surface-900 py-4 rounded-xl text-lg font-bold tracking-wide transition-all mt-2 flex items-center justify-center gap-2 group shadow-lg"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Checking Availability...
                </>
              ) : (
                <>
                  Check Availability &amp; Confirm
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-surface-900/30 text-xs mt-6">
            We'll confirm your booking via SMS/email within minutes.
          </p>
        </div>
      )}

      {/* ── STEP: UNAVAILABLE ───────────────────────────────── */}
      {step === 'unavailable' && (
        <div className="w-full max-w-md relative z-10 animate-slide-up mt-16">
          <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="p-8 text-center border-b border-white/10 bg-rose-500/10">
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-rose-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-surface-900 mb-2">Slot Unavailable</h2>
              <p className="text-surface-900/60">
                Sorry, <strong className="text-surface-900">{formatDate(form.date)}</strong> at{' '}
                <strong className="text-surface-900">{formatTime(form.time)}</strong> is fully booked.
              </p>
            </div>

            {/* Alternative Suggestions */}
            <div className="p-6">
              {alternatives.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-primary-600 font-semibold mb-4 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Available alternative slots for you:
                  </div>
                  <div className="space-y-3">
                    {alternatives.map((alt, i) => {
                      const isOtherDay = alt.includes('|');
                      const [altDate, altTime] = isOtherDay ? alt.split('|') : [form.date, alt];
                      return (
                        <button
                          key={i}
                          onClick={() => handleAlternativeSelect(alt)}
                          className="w-full flex items-center justify-between p-4 rounded-xl border border-white/15 bg-white/5 hover:bg-primary-600/30 hover:border-primary-500 transition-all group text-left"
                        >
                          <div>
                            {isOtherDay && (
                              <p className="text-primary-400 text-xs font-semibold mb-0.5">
                                Tomorrow · {formatDate(altDate)}
                              </p>
                            )}
                            <p className="text-surface-900 font-bold text-lg">{formatTime(altTime)}</p>
                            {!isOtherDay && (
                              <p className="text-surface-900/50 text-xs">{formatDate(altDate)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm">
                            <span className="text-xs text-accent-600 bg-accent-600/10 px-2 py-0.5 rounded-full">Available</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-surface-900/40 text-xs text-center mt-4">
                    Click any slot above to auto-fill and confirm your booking.
                  </p>
                </>
              ) : (
                <p className="text-surface-900/60 text-center py-4">
                  No nearby slots available. Please try a different date.
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 py-3 border border-white/20 rounded-xl text-surface-900 font-semibold hover:bg-white/10 transition-colors"
                >
                  ← Back to Form
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-surface-900 font-semibold transition-colors"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: CONFIRMED ─────────────────────────────────── */}
      {step === 'confirmed' && confirmedReservation && (
        <div className="w-full max-w-md relative z-10 animate-slide-up mt-16">
          <div className="rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">

            {/* Success Header */}
            <div className="p-8 text-center border-b border-white/10 bg-accent-500/10">
              <div className="w-20 h-20 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-accent-600" />
              </div>
              <h2 className="text-3xl font-display font-bold text-surface-900 mb-1">Booking Confirmed!</h2>
              <p className="text-accent-600 font-mono font-bold text-lg tracking-widest">
                {confirmedReservation.confirmationCode}
              </p>
            </div>

            {/* Booking Details */}
            <div className="p-6 space-y-3">
              <h3 className="text-surface-900/50 text-xs font-bold uppercase tracking-widest mb-4">Reservation Details</h3>

              {[
                { label: 'Guest Name', value: confirmedReservation.name, icon: '👤' },
                { label: 'Date', value: formatDate(confirmedReservation.date), icon: '📅' },
                { label: 'Time', value: formatTime(confirmedReservation.time), icon: '🕐' },
                { label: 'Party Size', value: `${confirmedReservation.guests} ${confirmedReservation.guests === 1 ? 'Guest' : 'Guests'}`, icon: '👥' },
                { label: 'Mobile', value: confirmedReservation.phone, icon: '📱' },
                ...(confirmedReservation.email ? [{ label: 'Email', value: confirmedReservation.email, icon: '✉️' }] : []),
                ...(confirmedReservation.specialRequests ? [{ label: 'Special Request', value: confirmedReservation.specialRequests, icon: '✨' }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-lg shrink-0">{row.icon}</span>
                  <div className="min-w-0">
                    <p className="text-surface-900/40 text-xs font-semibold uppercase tracking-wider">{row.label}</p>
                    <p className="text-surface-900 font-medium text-sm mt-0.5 break-words">{row.value}</p>
                  </div>
                </div>
              ))}

              <div className="mt-2 p-4 bg-primary-600/20 border border-primary-500/30 rounded-xl text-center">
                <p className="text-primary-300 text-sm">
                  📲 A confirmation SMS has been sent to <strong>{confirmedReservation.phone}</strong>.<br />
                  Please arrive 5 minutes early. We look forward to seeing you!
                </p>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setStep('form'); setForm({ name: '', phone: '', email: '', date: '', time: '', guests: '2', specialRequests: '' }); setErrors({}); }}
                  className="flex-1 py-3 border border-white/20 rounded-xl text-surface-900 font-semibold hover:bg-white/10 transition-colors text-sm"
                >
                  New Booking
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-surface-900 font-semibold transition-colors text-sm"
                >
                  Return Home →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm font-medium text-surface-900/30 relative z-10">
        Powered by {settings.restaurantName} POS
      </div>
    </div>
  );
}
