import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminAppointments,
  confirmPayment,
  cancelAppointment,
} from '../../lib/admin';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
function statusBadge(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-red-100 text-red-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}
function paymentBadge(status) {
  if (!status) return 'bg-slate-100 text-slate-700';
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    manual_confirmed: 'bg-green-100 text-green-800',
    mpesa_confirmed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-blue-100 text-blue-800',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export default function BookingsQueue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [openId, setOpenId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAdminAppointments());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Deep-link ?id=uuid
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) setOpenId(id);
  }, []);

  function openDrawer(id) {
    setOpenId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.replaceState({}, '', url);
  }
  function closeDrawer() {
    setOpenId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (paymentFilter && r.payment_status !== paymentFilter) return false;
      if (!q) return true;
      const hay =
        `${r.patient_name ?? ''} ${r.patient_phone ?? ''} ${r.id.slice(0, 8)} ${r.specialty_name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter, paymentFilter]);

  const active = openId ? rows.find((r) => r.id === openId) : null;

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Operations
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Bookings
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Confirm payments, cancel, or review any appointment.
          </p>
        </div>
        <button
          onClick={load}
          className='inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:text-primary'>
          <svg
            className='h-4 w-4'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'>
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className='mb-4 flex flex-wrap gap-2'>
        <input
          type='search'
          placeholder='Search by name, phone, or ID…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-9 min-w-[220px] flex-1 rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='h-9 rounded-lg border border-border px-2 text-sm'>
          <option value=''>All statuses</option>
          <option value='pending'>Pending</option>
          <option value='confirmed'>Confirmed</option>
          <option value='in_progress'>In progress</option>
          <option value='completed'>Completed</option>
          <option value='cancelled'>Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className='h-9 rounded-lg border border-border px-2 text-sm'>
          <option value=''>All payments</option>
          <option value='pending'>Pending</option>
          <option value='manual_confirmed'>Confirmed</option>
          <option value='refunded'>Refunded</option>
        </select>
      </div>

      {error && (
        <div className='mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent'>
          {error}
        </div>
      )}
      {loading && <p className='text-sm text-muted'>Loading…</p>}

      {/* Desktop table */}
      {!loading && (
        <div className='hidden overflow-hidden rounded-2xl border border-border bg-white md:block'>
          <table className='w-full text-sm'>
            <thead className='border-b border-border bg-surface/50 text-left text-xs uppercase tracking-wider text-muted'>
              <tr>
                <th className='px-4 py-3 font-bold'>Patient</th>
                <th className='px-4 py-3 font-bold'>Specialty</th>
                <th className='px-4 py-3 font-bold'>Scheduled</th>
                <th className='px-4 py-3 font-bold'>Status</th>
                <th className='px-4 py-3 font-bold'>Payment</th>
                <th className='px-4 py-3 font-bold text-right'>Ref</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-12 text-center text-sm text-muted'>
                    No bookings match the filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => openDrawer(r.id)}
                  className='cursor-pointer border-b border-border last:border-0 hover:bg-surface/60'>
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-slate-900'>
                      {r.patient_name ?? '—'}
                    </p>
                    <p className='text-xs text-muted'>
                      {r.patient_phone ?? '—'}
                    </p>
                  </td>
                  <td className='px-4 py-3 text-slate-700'>
                    {r.specialty_name}
                  </td>
                  <td className='px-4 py-3'>
                    <p className='text-slate-900'>{fmtDate(r.scheduled_at)}</p>
                    <p className='text-xs text-muted'>
                      {fmtTime(r.scheduled_at)} EAT
                    </p>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${paymentBadge(r.payment_status)}`}>
                      {r.payment_status?.replace('_', ' ') ?? '—'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-xs text-muted'>
                    {r.id.slice(0, 8).toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && (
        <div className='space-y-2 md:hidden'>
          {filtered.length === 0 && (
            <p className='rounded-xl border border-border bg-white p-6 text-center text-sm text-muted'>
              No bookings match.
            </p>
          )}
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => openDrawer(r.id)}
              className='w-full rounded-xl border border-border bg-white p-4 text-left hover:border-primary/30'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <p className='font-semibold text-slate-900'>
                    {r.patient_name ?? '—'}
                  </p>
                  <p className='mt-0.5 text-xs text-muted'>
                    {r.patient_phone ?? '—'}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadge(r.status)}`}>
                  {r.status}
                </span>
              </div>
              <p className='mt-2 text-xs text-slate-700'>
                {r.specialty_name} · {fmtDate(r.scheduled_at)}{' '}
                {fmtTime(r.scheduled_at)}
              </p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <Drawer appointment={active} onClose={closeDrawer} onChanged={load} />
      )}
    </div>
  );
}

function Drawer({ appointment, onClose, onChanged }) {
  const [reference, setReference] = useState(
    appointment.payment_reference ?? '',
  );
  const [cancelReason, setCancelReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [mode, setMode] = useState('view'); // view | confirm | cancel

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleConfirm() {
    if (reference.trim().length < 4) {
      setErr('Enter the full M-Pesa reference (at least 4 characters).');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await confirmPayment(appointment.payment_id, reference.trim());
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setErr(null);
    try {
      await cancelAppointment(appointment.id, cancelReason.trim());
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  const canConfirm =
    appointment.payment_status === 'pending' && appointment.payment_id;
  const canCancel = ['pending', 'confirmed'].includes(appointment.status);

  return (
    <>
      <div
        onClick={onClose}
        className='fixed inset-0 z-40 bg-black/40'
        aria-hidden='true'
      />
      <aside className='fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-2xl'>
        <div className='flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-5'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Appointment
            </p>
            <p className='mt-0.5 font-mono text-sm font-semibold text-slate-900'>
              {appointment.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label='Close'
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface'>
            <svg
              className='h-4 w-4'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'>
              <line x1='18' x2='6' y1='6' y2='18' />
              <line x1='6' x2='18' y1='6' y2='18' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-5 py-5'>
          {mode === 'view' && (
            <>
              <div className='space-y-4'>
                <Row label='Patient' value={appointment.patient_name ?? '—'} />
                <Row label='Phone' value={appointment.patient_phone ?? '—'} />
                <Row label='Specialty' value={appointment.specialty_name} />
                <Row
                  label='When'
                  value={`${fmt(appointment.scheduled_at)} EAT`}
                />
                <Row
                  label='Appointment status'
                  value={
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge(appointment.status)}`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  }
                />
                <Row
                  label='Payment'
                  value={
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${paymentBadge(appointment.payment_status)}`}>
                      {appointment.payment_status?.replace('_', ' ') ?? '—'}
                    </span>
                  }
                />
                <Row
                  label='Amount'
                  value={`KES ${(appointment.amount_kes ?? appointment.fee_kes).toLocaleString()}`}
                />
                {appointment.payment_reference && (
                  <Row
                    label='M-Pesa ref'
                    value={
                      <span className='font-mono text-xs'>
                        {appointment.payment_reference}
                      </span>
                    }
                  />
                )}
                {appointment.payment_confirmed_at && (
                  <Row
                    label='Confirmed at'
                    value={fmt(appointment.payment_confirmed_at)}
                  />
                )}
                {appointment.reason && (
                  <Row
                    label="Patient's note"
                    value={
                      <span className='italic text-slate-600'>
                        {appointment.reason}
                      </span>
                    }
                  />
                )}
              </div>

              <div className='mt-8 space-y-2'>
                {canConfirm && (
                  <button
                    onClick={() => setMode('confirm')}
                    className='flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark'>
                    Confirm payment received
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setMode('cancel')}
                    className='flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-accent/40 text-sm font-semibold text-accent hover:bg-accent/5'>
                    Cancel appointment
                  </button>
                )}
              </div>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <h2 className='font-display-bold text-lg text-secondary'>
                Confirm payment
              </h2>
              <p className='mt-1 text-sm text-slate-600'>
                Record the M-Pesa reference from the patient's receipt. This
                confirms the appointment and queues an SMS.
              </p>
              <label className='mt-5 block text-sm font-semibold text-slate-800'>
                M-Pesa reference
              </label>
              <input
                autoFocus
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder='e.g. QK47X8YZ9P'
                className='mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
              />
              {err && <p className='mt-3 text-sm text-accent'>{err}</p>}
              <div className='mt-5 flex gap-2'>
                <button
                  onClick={() => {
                    setMode('view');
                    setErr(null);
                  }}
                  className='h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-slate-700 hover:bg-surface'>
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={busy}
                  className='h-11 flex-[2] rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
                  {busy ? 'Confirming…' : 'Confirm payment'}
                </button>
              </div>
            </>
          )}

          {mode === 'cancel' && (
            <>
              <h2 className='font-display-bold text-lg text-accent'>
                Cancel appointment
              </h2>
              <p className='mt-1 text-sm text-slate-600'>
                This frees the slot back to the doctor's calendar. If the
                patient has already paid, their payment is marked for refund.
              </p>
              <label className='mt-5 block text-sm font-semibold text-slate-800'>
                Reason{' '}
                <span className='text-xs font-normal text-muted'>
                  (optional)
                </span>
              </label>
              <textarea
                autoFocus
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder='Why is this appointment being cancelled?'
                className='mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
              />
              {err && <p className='mt-3 text-sm text-accent'>{err}</p>}
              <div className='mt-5 flex gap-2'>
                <button
                  onClick={() => {
                    setMode('view');
                    setErr(null);
                  }}
                  className='h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-slate-700 hover:bg-surface'>
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  className='h-11 flex-[2] rounded-lg bg-accent font-semibold text-white hover:opacity-90 disabled:opacity-60'>
                  {busy ? 'Cancelling…' : 'Cancel appointment'}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className='flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0'>
      <p className='text-xs font-bold uppercase tracking-wider text-muted'>
        {label}
      </p>
      <p className='text-right text-sm font-semibold text-slate-900'>{value}</p>
    </div>
  );
}
