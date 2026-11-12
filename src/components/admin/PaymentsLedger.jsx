import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchAdminPayments, deletePayment } from '../../lib/admin';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function badge(status) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    manual_confirmed: 'bg-green-100 text-green-800',
    mpesa_confirmed: 'bg-green-100 text-green-800',
    mpesa_initiated: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-blue-100 text-blue-800',
    expired: 'bg-slate-100 text-slate-700',
  };
  return map[status] ?? 'bg-slate-100 text-slate-700';
}

export default function PaymentsLedger() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [role, setRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setRole(data.session?.user?.app_metadata?.role ?? 'patient');
    });
  }, []);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAdminPayments());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm('Permanently delete this payment record?')) return;
    try {
      await deletePayment(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay =
        `${r.patient_name ?? ''} ${r.patient_phone ?? ''} ${r.reference ?? ''} ${r.id.slice(0, 8)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending');
    const confirmed = rows.filter(
      (r) => r.status === 'manual_confirmed' || r.status === 'mpesa_confirmed',
    );
    return {
      pendingCount: pending.length,
      pendingKes: pending.reduce((s, r) => s + r.amount_kes, 0),
      confirmedCount: confirmed.length,
      confirmedKes: confirmed.reduce((s, r) => s + r.amount_kes, 0),
    };
  }, [rows]);

  const canDelete = role === 'admin' || role === 'supervisor';

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Finance
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Payments
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Every consultation payment record, pending and confirmed.
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

      <div className='mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Stat
          label='Pending'
          value={totals.pendingCount}
          hint={`KES ${totals.pendingKes.toLocaleString()}`}
          tone='gold'
        />
        <Stat
          label='Confirmed'
          value={totals.confirmedCount}
          hint={`KES ${totals.confirmedKes.toLocaleString()}`}
          tone='primary'
        />
        <Stat
          label='Total collected'
          value={totals.confirmedCount + totals.pendingCount}
          hint={`KES ${(totals.pendingKes + totals.confirmedKes).toLocaleString()}`}
          tone='secondary'
        />
        <Stat
          label='Records'
          value={rows.length}
          hint='all time'
          tone='secondary'
        />
      </div>

      <div className='mb-4 flex flex-wrap gap-2'>
        <input
          type='search'
          placeholder='Search by name, phone, ref…'
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
          <option value='manual_confirmed'>Manual confirmed</option>
          <option value='refunded'>Refunded</option>
        </select>
      </div>

      {error && (
        <div className='mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent'>
          {error}
        </div>
      )}
      {loading && <p className='text-sm text-muted'>Loading…</p>}

      {!loading && (
        <div className='overflow-hidden rounded-2xl border border-border bg-white'>
          <table className='w-full text-sm'>
            <thead className='border-b border-border bg-surface/50 text-left text-xs uppercase tracking-wider text-muted'>
              <tr>
                <th className='px-4 py-3 font-bold'>Patient</th>
                <th className='px-4 py-3 font-bold'>Specialty</th>
                <th className='px-4 py-3 font-bold'>Amount</th>
                <th className='px-4 py-3 font-bold'>Status</th>
                <th className='px-4 py-3 font-bold'>Reference</th>
                <th className='px-4 py-3 font-bold'>Created</th>
                {canDelete && (
                  <th className='px-4 py-3 font-bold text-right'>Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={canDelete ? 7 : 6}
                    className='px-4 py-12 text-center text-sm text-muted'>
                    No payments match.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className='border-b border-border last:border-0 hover:bg-surface/40'>
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
                  <td className='px-4 py-3 font-semibold text-primary'>
                    KES {r.amount_kes.toLocaleString()}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-slate-700'>
                    {r.reference ?? '—'}
                  </td>
                  <td className='px-4 py-3 text-xs text-muted'>
                    {fmt(r.created_at)}
                  </td>
                  {canDelete && (
                    <td className='px-4 py-3 text-right'>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className='text-xs font-semibold text-accent hover:underline'>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, tone }) {
  const color =
    tone === 'gold'
      ? 'text-gold'
      : tone === 'secondary'
        ? 'text-secondary'
        : 'text-primary';
  return (
    <div className='rounded-2xl border border-border bg-white p-4'>
      <p className='text-xs font-bold uppercase tracking-wider text-muted'>
        {label}
      </p>
      <p className={`mt-2 font-display-bold text-2xl ${color}`}>{value}</p>
      {hint && <p className='mt-0.5 text-xs text-muted'>{hint}</p>}
    </div>
  );
}
