import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchMyAppointments,
  formatNairobiDate,
  formatNairobiTime,
} from '../../lib/booking';

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.href = '/auth/login?next=/portal';
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.session.user.id)
          .maybeSingle();
        setName(
          profile?.full_name ??
            data.session.user.email?.split('@')[0] ??
            'there',
        );
        setAppointments(await fetchMyAppointments());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
  }, []);

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

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.scheduled_at) >= now && a.status !== 'cancelled',
  );
  const past = appointments.filter(
    (a) => new Date(a.scheduled_at) < now || a.status === 'cancelled',
  );

  return (
    <div>
      <div className='mb-8'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
          Patient portal
        </p>
        <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
          Hello, {name}
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          Book consultations, view your appointments, and track prescriptions
          here.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <a
          href='/portal/book'
          className='group rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/40 hover:shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-semibold text-slate-900'>
                Book a consultation
              </p>
              <p className='mt-1 text-xs text-muted'>
                Choose a specialty, doctor, and time.
              </p>
            </div>
            <svg
              className='h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'>
              <path d='M5 12h14' />
              <path d='m12 5 7 7-7 7' />
            </svg>
          </div>
        </a>
        <a
          href='/specialties'
          className='group rounded-2xl border border-border bg-white p-6 transition-all hover:border-primary/40 hover:shadow-md'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='font-semibold text-slate-900'>Browse specialties</p>
              <p className='mt-1 text-xs text-muted'>
                See what our doctors treat and fees.
              </p>
            </div>
            <svg
              className='h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'>
              <path d='M5 12h14' />
              <path d='m12 5 7 7-7 7' />
            </svg>
          </div>
        </a>
      </div>

      <section className='mt-10'>
        <h2 className='font-display-bold text-xl text-secondary'>
          Upcoming appointments
        </h2>
        <div className='mt-4 space-y-3'>
          {upcoming.length === 0 && (
            <div className='rounded-2xl border border-border bg-white p-8 text-center'>
              <p className='text-sm text-slate-600'>
                No upcoming appointments yet.
              </p>
              <a
                href='/portal/book'
                className='mt-3 inline-block text-sm font-semibold text-primary hover:underline'>
                Book your first consultation →
              </a>
            </div>
          )}
          {upcoming.map((a) => (
            <a
              key={a.id}
              href={`/portal/appointment-confirmed?id=${a.id}`}
              className='block rounded-xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-sm'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='font-semibold text-slate-900'>
                    {a.specialty_name}
                  </p>
                  <p className='mt-1 text-xs text-muted'>
                    {formatNairobiDate(a.scheduled_at)} ·{' '}
                    {formatNairobiTime(a.scheduled_at)} EAT
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.payment_status === 'manual_confirmed' || a.payment_status === 'mpesa_confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {a.payment_status === 'pending'
                    ? 'Payment pending'
                    : 'Confirmed'}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className='mt-10'>
          <h2 className='font-display-bold text-xl text-secondary'>
            Past appointments
          </h2>
          <div className='mt-4 space-y-3'>
            {past.map((a) => (
              <div
                key={a.id}
                className='rounded-xl border border-border bg-white p-5 opacity-70'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-slate-900'>
                      {a.specialty_name}
                    </p>
                    <p className='mt-1 text-xs text-muted'>
                      {formatNairobiDate(a.scheduled_at)} ·{' '}
                      {formatNairobiTime(a.scheduled_at)} EAT
                    </p>
                  </div>
                  <span className='rounded-full bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted'>
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
