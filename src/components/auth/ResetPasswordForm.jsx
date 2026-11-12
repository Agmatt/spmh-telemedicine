import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PasswordInput from '../ui/PasswordInput.jsx';
import { validatePassword, describePasswordRules } from '../../lib/password';

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')
        setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    timeout = setTimeout(() => setChecking(false), 3000);
    return () => {
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (ready) setChecking(false);
  }, [ready]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const v = validatePassword(pw);
    if (!v.ok) return setError(v.errors.join('. '));
    if (pw !== confirm) return setError('Passwords do not match');

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);

    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => {
      window.location.replace('/dashboard');
    }, 1500);
  }

  if (checking) {
    return <p className='text-sm text-muted'>Verifying your reset link…</p>;
  }

  if (!ready) {
    return (
      <div className='rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center'>
        <p className='text-sm text-accent'>
          This reset link is invalid or has expired.
        </p>
        <a
          href='/auth/forgot-password'
          className='mt-4 inline-block text-sm font-semibold text-primary hover:underline'>
          Request a new link
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className='rounded-2xl border border-border bg-white p-6 text-center'>
        <h2 className='font-display-bold text-xl text-secondary'>
          Password updated
        </h2>
        <p className='mt-2 text-sm text-slate-600'>
          Redirecting you to your portal…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='space-y-5'>
      <PasswordInput
        label='New password'
        required
        autoComplete='new-password'
        value={pw}
        onChange={setPw}
        hint={describePasswordRules()}
      />
      <PasswordInput
        label='Confirm new password'
        required
        autoComplete='new-password'
        value={confirm}
        onChange={setConfirm}
        error={confirm && confirm !== pw ? 'Passwords do not match' : undefined}
      />
      {error && (
        <p className='rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent'>
          {error}
        </p>
      )}
      <button
        type='submit'
        disabled={busy}
        className='flex h-11 w-full items-center justify-center rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
