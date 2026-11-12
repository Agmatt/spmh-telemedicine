import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchAppointmentById,
  formatNairobiDate,
  formatNairobiTime,
} from '../../lib/booking';

export default function AppointmentConfirmation({ appointmentId }) {
  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/auth/login?next=/portal';
        return;
      }
      fetchAppointmentById(appointmentId)
        .then((a) => {
          if (!a) setError('Appointment not found');
          else setAppt(a);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    });
  }, [appointmentId]);

  if (loading)
    return (
      <div className='rounded-2xl border border-border bg-white p-12 text-center text-sm text-muted'>
        Loading…
      </div>
    );
  if (error)
    return (
      <div className='rounded-2xl border border-accent bg-accent/10 p-6 text-sm text-accent'>
        {error}
      </div>
    );
  if (!appt) return null;

  return (
    <div>
      <div className='rounded-2xl border border-border bg-white p-8 text-center'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <svg
            className='h-7 w-7'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'>
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>
        <h1 className='mt-4 font-display-bold text-2xl text-secondary'>
          Booking confirmed
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          We've reserved your slot. An SMS reminder will arrive 24 hours before.
        </p>
      </div>

      <div className='mt-6 rounded-2xl border border-border bg-white p-6'>
        <div className='grid gap-5 sm:grid-cols-2'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Reference
            </p>
            <p className='mt-1 font-mono text-xs text-slate-700'>
              {appt.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Status
            </p>
            <p className='mt-1 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-yellow-800'>
              Pending payment
            </p>
          </div>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Specialty
            </p>
            <p className='mt-1 font-semibold text-slate-900'>
              {appt.specialty_name}
            </p>
          </div>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Duration
            </p>
            <p className='mt-1 font-semibold text-slate-900'>
              {appt.duration_minutes} minutes
            </p>
          </div>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Date
            </p>
            <p className='mt-1 font-semibold text-slate-900'>
              {formatNairobiDate(appt.scheduled_at)}
            </p>
          </div>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              Time
            </p>
            <p className='mt-1 font-semibold text-slate-900'>
              {formatNairobiTime(appt.scheduled_at)} EAT
            </p>
          </div>
        </div>
      </div>

      <div className='mt-6 rounded-2xl border border-gold/40 bg-gold/5 p-6'>
        <p className='text-xs font-bold uppercase tracking-[0.15em] text-primary'>
          Next step — pay KES {appt.payment_amount.toLocaleString()}
        </p>
        <p className='mt-3 text-sm leading-relaxed text-slate-700'>
          Payment confirms your appointment. Visit the SPMH reception desk
          before your scheduled time, or call{' '}
          <a
            href='tel:+254111817447'
            className='font-semibold text-primary hover:underline'>
            +254 111 817447
          </a>
          . M-Pesa in-portal payments are being finalised with Safaricom —
          you'll be notified by SMS when they go live.
        </p>
      </div>

      <div className='mt-6 flex flex-col gap-3 sm:flex-row'>
        <a
          href='/portal'
          className='inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark'>
          Go to my portal
        </a>
        <a
          href='/portal/book'
          className='inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border px-5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary'>
          Book another
        </a>
      </div>
    </div>
  );
}
