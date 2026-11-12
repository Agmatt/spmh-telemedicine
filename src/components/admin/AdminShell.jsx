import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { isStaffRole, canManageDoctors } from '../../lib/admin';
import { useIdleLogout } from '../../lib/useIdleLogout';

const NAV = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin',
    icon: 'M3 12 12 3l9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    href: '/admin/bookings',
    icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/admin/payments',
    icon: 'M2 12h20M2 6h20M2 18h20',
  },
];

const ADMIN_ONLY = [
  {
    id: 'doctors',
    label: 'Doctors',
    href: '/admin/doctors',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM20 8v6M23 11h-6',
  },
  {
    id: 'specialties',
    label: 'Specialties',
    href: '/admin/specialties',
    icon: 'M12 2v20M2 12h20',
  },
  {
    id: 'staff',
    label: 'Staff',
    href: '/admin/staff',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    id: 'audit',
    label: 'Audit log',
    href: '/admin/audit',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  },
];

export default function AdminShell({ activePage, children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useIdleLogout();

  useEffect(() => {
    // The `async` keyword is right here:
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace(
          `/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        return;
      }

      const r = data.session.user.app_metadata?.role ?? 'patient';
      if (!isStaffRole(r)) {
        window.location.replace('/');
        return;
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('is_developer')
        .eq('id', data.session.user.id)
        .single();

      setSession(data.session);
      setRole(p?.is_developer ? 'Superadmin' : r);
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (checking) {
    return (
      <div className='grid min-h-screen place-items-center'>
        <p className='text-sm text-muted'>Loading admin…</p>
      </div>
    );
  }

  const items = canManageDoctors(role) ? [...NAV, ...ADMIN_ONLY] : NAV;

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace('/');
  }

  const initial = (session.user.email?.[0] ?? '?').toUpperCase();

  return (
    <div className='min-h-screen'>
      <header className='sticky top-0 z-40 border-b border-border bg-white lg:hidden'>
        <div className='flex h-14 items-center gap-3 px-4'>
          <button
            type='button'
            onClick={() => setDrawerOpen(true)}
            aria-label='Open menu'
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface'>
            <svg
              className='h-5 w-5'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              aria-hidden='true'>
              <line x1='4' x2='20' y1='6' y2='6' />
              <line x1='4' x2='20' y1='12' y2='12' />
              <line x1='4' x2='20' y1='18' y2='18' />
            </svg>
          </button>
          <a href='/admin' className='flex items-center gap-2'>
            <img
              src='/logo.png'
              alt='SPMH'
              className='h-8 w-8 object-contain'
              width='32'
              height='32'
            />
            <span className='font-display-bold text-sm text-secondary'>
              SPMH Admin
            </span>
          </a>
        </div>
      </header>

      <aside className='fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-white lg:flex'>
        <div className='flex h-16 items-center gap-2 border-b border-border px-4'>
          <img
            src='/logos/logo.png'
            alt='SPMH'
            className='h-8 w-8 object-contain'
            width='32'
            height='32'
          />
          <div className='flex flex-col leading-tight'>
            <span className='font-display-bold text-sm text-secondary'>
              SPMH
            </span>
            <span className='text-[9px] font-semibold uppercase tracking-[0.15em] text-primary'>
              Admin Console
            </span>
          </div>
        </div>

        <nav className='flex-1 overflow-y-auto px-3 py-4'>
          <ul className='space-y-0.5'>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${item.id === activePage ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-surface'}`}>
                  <svg
                    className='h-4 w-4 flex-shrink-0'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <path d={item.icon} />
                  </svg>
                  <span className='flex-1'>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className='border-t border-border p-3'>
          <div className='flex items-center gap-2 rounded-lg px-2 py-1.5'>
            <span className='grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white'>
              {initial}
            </span>
            <div className='flex-1 overflow-hidden'>
              <p className='truncate text-xs font-semibold text-slate-900'>
                {session.user.email}
              </p>
              <p className='text-[10px] uppercase tracking-wider text-muted'>
                {role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className='mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-accent hover:bg-accent/5'>
            Sign out
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className='fixed inset-0 z-40 bg-black/40 lg:hidden'
            aria-hidden='true'
          />
          <aside className='fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-white lg:hidden'>
            <div className='flex h-14 items-center justify-between border-b border-border px-4'>
              <a href='/admin' className='flex items-center gap-2'>
                <img
                  src='/logo.png'
                  alt='SPMH'
                  className='h-7 w-7 object-contain'
                  width='28'
                  height='28'
                />
                <span className='font-display-bold text-sm text-secondary'>
                  SPMH Admin
                </span>
              </a>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label='Close menu'
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
            <nav className='flex-1 overflow-y-auto px-3 py-4'>
              <ul className='space-y-0.5'>
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${item.id === activePage ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-surface'}`}>
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
                        <path d={item.icon} />
                      </svg>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className='border-t border-border p-3'>
              <p className='truncate text-xs text-slate-600'>
                {session.user.email}
              </p>
              <button
                onClick={logout}
                className='mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-accent hover:bg-accent/5'>
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      <main className='lg:pl-60'>
        <div className='mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8'>
          {children}
        </div>
      </main>
    </div>
  );
}
