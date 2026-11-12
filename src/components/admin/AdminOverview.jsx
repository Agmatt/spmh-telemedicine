import { useEffect, useState } from 'react';
import { fetchOverviewStats } from '../../lib/admin';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverviewStats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <div className='rounded-xl bg-accent/10 p-4 text-sm text-accent'>
        {error}
      </div>
    );
  if (!stats)
    return (
      <div className='grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='h-28 rounded-2xl bg-white' />
        ))}
      </div>
    );

  const cards = [
    {
      label: "Today's appointments",
      value: stats.todays_appointments,
      href: '/admin/bookings',
      accent: 'primary',
    },
    {
      label: 'Pending payments',
      value: stats.pending_payments_count,
      hint: `KES ${stats.pending_payments_kes.toLocaleString()}`,
      href: '/admin/payments',
      accent: 'gold',
    },
    {
      label: 'Confirmed this week',
      value: stats.confirmed_this_week,
      accent: 'primary',
    },
    {
      label: 'Upcoming (7 days)',
      value: stats.upcoming_7d,
      href: '/admin/bookings',
      accent: 'primary',
    },
    {
      label: 'Active doctors',
      value: stats.active_doctors,
      accent: 'secondary',
    },
    {
      label: 'Total bookings',
      value: stats.todays_appointments + stats.confirmed_this_week,
      hint: 'this week',
      accent: 'secondary',
    },
  ];

  return (
    <div>
      <div className='mb-6'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
          Admin console
        </p>
        <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
          Overview
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          Today's operations at a glance.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {cards.map((c) => {
          const body = (
            <div className='rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/30 hover:shadow-sm'>
              <p className='text-xs font-bold uppercase tracking-wider text-muted'>
                {c.label}
              </p>
              <p
                className={`mt-3 font-display-bold text-3xl ${c.accent === 'gold' ? 'text-gold' : c.accent === 'secondary' ? 'text-secondary' : 'text-primary'}`}>
                {c.value}
              </p>
              {c.hint && <p className='mt-1 text-xs text-muted'>{c.hint}</p>}
            </div>
          );
          return c.href ? (
            <a key={c.label} href={c.href}>
              {body}
            </a>
          ) : (
            <div key={c.label}>{body}</div>
          );
        })}
      </div>

      <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
        <a
          href='/admin/bookings'
          className='inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark'>
          Review bookings queue
        </a>
        <a
          href='/admin/payments'
          className='inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary'>
          Manage payments
        </a>
      </div>
    </div>
  );
}
