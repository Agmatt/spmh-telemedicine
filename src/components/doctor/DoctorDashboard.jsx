import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useIdleLogout } from '../../lib/useIdleLogout';
import { formatNairobiDate, formatNairobiTime } from '../../lib/booking';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  useIdleLogout();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/auth/login?next=/doctor');
        return;
      }
      try {
        const { data: doc } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', data.session.user.id)
          .single();
        if (!doc) {
          setError('No doctor profile linked to this account.');
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.session.user.id)
          .maybeSingle();
        setName(profile?.full_name ?? 'Doctor');
        const { data: appts } = await supabase
          .from('admin_appointments_view')
          .select('*')
          .eq('doctor_id', doc.id)
          .order('scheduled_at', { ascending: true });
        setAppointments(appts || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading)
    return (
      <div className='p-12 text-center text-sm text-muted'>
        Loading your console…
      </div>
    );
  if (error)
    return (
      <div className='p-6 text-sm text-accent bg-accent/10 rounded-xl'>
        {error}
      </div>
    );

  const now = new Date();
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) >= now &&
      a.status !== 'cancelled' &&
      a.status !== 'completed',
  );
  const past = appointments.filter(
    (a) => new Date(a.scheduled_at) < now || a.status === 'completed',
  );

  return (
    <div>
      <div className='mb-8'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
          Doctor console
        </p>
        <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
          Welcome, {name}
        </h1>
      </div>
      <section>
        <h2 className='font-display-bold text-xl text-secondary'>
          Upcoming Queue
        </h2>
        <div className='mt-4 space-y-3'>
          {upcoming.length === 0 && (
            <div className='rounded-2xl border border-border bg-white p-8 text-center text-sm text-slate-600'>
              No upcoming consultations scheduled.
            </div>
          )}
          {upcoming.map((a) => (
            <div
              key={a.id}
              className='rounded-xl border border-border bg-white p-5'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='font-semibold text-slate-900'>
                    {a.patient_name}
                  </p>
                  <p className='text-xs text-muted'>
                    {a.specialty_name} · {a.patient_phone}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-primary'>
                    {formatNairobiDate(a.scheduled_at)}
                  </p>
                  <p className='text-xs text-muted'>
                    {formatNairobiTime(a.scheduled_at)} EAT
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
