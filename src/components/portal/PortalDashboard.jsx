import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchMyAppointments,
  formatNairobiDate,
  formatNairobiTime,
} from '../../lib/booking';
import { useIdleLogout } from '../../lib/useIdleLogout';

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState(null);

  useIdleLogout();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/auth/login?next=/portal');
        return;
      }
      // GUARD: Kick doctors/staff out of the patient portal
if ((data.session.user.app_metadata?.role ?? 'patient') !== 'patient') {
  window.location.replace('/dashboard');
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
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        <a
          href='/portal/book'
          className='group rounded-2xl border border-border bg-white p-6 hover:border-primary/40 hover:shadow-md'>
          <p className='font-semibold text-slate-900'>Book a consultation</p>
          <p className='mt-1 text-xs text-muted'>
            Choose a specialty, doctor, and time.
          </p>
        </a>
        <a
          href='/specialties'
          className='group rounded-2xl border border-border bg-white p-6 hover:border-primary/40 hover:shadow-md'>
          <p className='font-semibold text-slate-900'>Browse specialties</p>
          <p className='mt-1 text-xs text-muted'>
            See what our doctors treat and fees.
          </p>
        </a>
      </div>
      <section className='mt-10'>
        <h2 className='font-display-bold text-xl text-secondary'>
          Upcoming appointments
        </h2>
        <div className='mt-4 space-y-3'>
          {upcoming.map((a) => (
            <a
              key={a.id}
              href={`/portal/appointment-confirmed?id=${a.id}`}
              className='block rounded-xl border border-border bg-white p-5 hover:border-primary/40'>
              <p className='font-semibold text-slate-900'>{a.specialty_name}</p>
              <p className='text-xs text-muted'>
                {formatNairobiDate(a.scheduled_at)} ·{' '}
                {formatNairobiTime(a.scheduled_at)} EAT
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
