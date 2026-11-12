import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Field from '../ui/Field.jsx';
import { useIdleLogout } from '../../lib/useIdleLogout';

export default function AccountSettings() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useIdleLogout();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/auth/login?next=/account');
        return;
      }
      setSession(data.session);
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();
      setProfile(p);
      setName(p?.full_name ?? '');
      setPhone(p?.phone ?? '');
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim(),
        phone: phone.trim() || null,
      })
      .eq('id', session.user.id);
    setBusy(false);
    if (error) return setError(error.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.replace('/');
  }

  if (!session) return <p className='text-sm text-muted'>Loading…</p>;

  return (
    <div>
      <div className='mb-6'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
          Account
        </p>
        <h1 className='mt-2 font-display-bold text-3xl text-secondary'>
          Settings
        </h1>
      </div>

      <div className='mb-6 rounded-2xl border border-border bg-white p-6'>
        <p className='text-xs font-bold uppercase tracking-wider text-muted'>
          Email
        </p>
        <p className='mt-1 text-sm text-slate-900'>{session.user.email}</p>
        <p className='mt-1 text-xs text-muted'>
          Role: {profile?.role ?? session.user.app_metadata?.role ?? 'patient'}
        </p>
      </div>

      <form
        onSubmit={save}
        className='space-y-5 rounded-2xl border border-border bg-white p-6'>
        <Field
          label='Full name'
          required
          autoComplete='name'
          value={name}
          onChange={setName}
        />
        <Field
          label='Phone'
          type='tel'
          autoComplete='tel'
          placeholder='+254 7XX XXX XXX'
          value={phone}
          onChange={setPhone}
        />
        {error && (
          <p className='rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent'>
            {error}
          </p>
        )}
        {saved && (
          <p className='rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800'>
            Saved.
          </p>
        )}
        <button
          type='submit'
          disabled={busy}
          className='flex h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className='mt-4 rounded-2xl border border-border bg-white p-6'>
        <p className='text-sm font-semibold text-slate-900'>Password</p>
        <p className='mt-1 text-xs text-slate-600'>
          Change your password at any time.
        </p>
        <a
          href='/account/set-password'
          className='mt-3 inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary'>
          Set new password →
        </a>
      </div>

      <div className='mt-4 rounded-2xl border border-border bg-white p-6'>
        <p className='text-sm font-semibold text-slate-900'>Sign out</p>
        <p className='mt-1 text-xs text-slate-600'>Sign out of this device.</p>
        <button
          onClick={logout}
          className='mt-3 inline-flex h-10 items-center rounded-lg border border-accent/40 px-4 text-sm font-semibold text-accent hover:bg-accent/5'>
          Sign out
        </button>
      </div>
    </div>
  );
}
