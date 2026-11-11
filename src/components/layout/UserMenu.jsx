import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { roleHome } from '../../data/nav';

export default function UserMenu({ role, email }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const initial = (email?.[0] ?? '?').toUpperCase();
  return (
    <div className='relative' ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className='flex items-center gap-2 rounded-full border border-border bg-white pl-1 pr-3 py-1 hover:shadow-sm'
        aria-haspopup='menu'
        aria-expanded={open}>
        <span className='grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-white'>
          {initial}
        </span>
        <span className='hidden text-xs capitalize text-slate-600 md:inline'>
          {role}
        </span>
      </button>

      {open && (
        <div
          className='absolute right-0 mt-2 w-56 rounded-xl border border-border bg-white py-1 shadow-lg'
          role='menu'>
          <a
            href={roleHome[role] ?? '/portal'}
            className='block px-4 py-2 text-sm hover:bg-surface'
            role='menuitem'>
            Dashboard
          </a>
          <a
            href='/account'
            className='block px-4 py-2 text-sm hover:bg-surface'
            role='menuitem'>
            Account settings
          </a>
          <hr className='my-1 border-border/60' />
          <button
            onClick={logout}
            className='w-full px-4 py-2 text-left text-sm text-accent hover:bg-accent/5'
            role='menuitem'>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
