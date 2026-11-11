import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import UserMenu from './UserMenu.jsx';

export default function NavAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Reserve space to avoid layout jump while loading
  if (loading) {
    return <div className='h-9 w-9 md:w-24' aria-hidden='true' />;
  }

  if (!session) {
    return (
      <div className='flex items-center gap-1.5 sm:gap-2'>
        <a
          href='/auth/login'
          className='inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 sm:px-3'>
          Sign in
        </a>
        <a
          href='/auth/register'
          className='inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-3.5'>
          Get started
        </a>
      </div>
    );
  }

  const role = session.user.app_metadata?.role ?? 'patient';
  return <UserMenu role={role} email={session.user.email} />;
}
