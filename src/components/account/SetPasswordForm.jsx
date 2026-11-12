import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PasswordInput from '../ui/PasswordInput.jsx';
import { validatePassword, describePasswordRules } from '../../lib/password';

export default function SetPasswordForm() {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.replace('/auth/login?next=/account/set-password');
        return;
      }
      setChecking(false);
    });
  }, []);

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
  }

  if (checking) return <p className='text-sm text-muted'>Loading…</p>;

  if (done) {
    return (
      <div className='rounded-2xl border border-border bg-white p-6 text-center'>
        <h2 className='font-display-bold text-xl text-secondary'>
          Password updated
        </h2>
        <p className='mt-2 text-sm text-slate-600'>
          You can now use the new password next time you sign in.
        </p>
        <a
          href='/portal'
          className='mt-4 inline-block text-sm font-semibold text-primary hover:underline'>
          Go to portal
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className='space-y-5 rounded-2xl border border-border bg-white p-6'>
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
