import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Field from '../ui/Field.jsx';
import PasswordInput from '../ui/PasswordInput.jsx'; // Added

export default function LoginForm({ next = '/dashboard' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePassword(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) return setError(error.message);
    window.location.replace(next);
  }

  async function handleMagic(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className='rounded-2xl border border-border bg-white p-8 text-center'>
        <h2 className='mt-4 font-display-bold text-xl text-secondary'>
          Check your inbox
        </h2>
        <p className='mt-2 text-sm text-slate-600'>
          We sent a sign-in link to{' '}
          <strong className='font-semibold text-slate-900'>{email}</strong>.
        </p>
        <button
          onClick={() => setMagicSent(false)}
          className='mt-6 text-sm font-semibold text-primary hover:underline'>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={mode === 'password' ? handlePassword : handleMagic}
      className='space-y-5'>
      <Field
        label='Email address'
        type='email'
        required
        autoComplete='email'
        placeholder='you@example.com'
        value={email}
        onChange={setEmail}
      />

      {mode === 'password' && (
        <>
          <PasswordInput
            label='Password'
            required
            autoComplete='current-password'
            placeholder='••••••••••'
            value={password}
            onChange={setPassword}
          />
          <div className='-mt-2 text-right'>
            <a
              href='/auth/forgot-password'
              className='text-xs font-semibold text-primary hover:underline'>
              Forgot password?
            </a>
          </div>
        </>
      )}

      {error && (
        <div
          className='rounded-lg bg-accent/10 px-3 py-2.5 text-sm text-accent'
          role='alert'>
          {error}
        </div>
      )}

      <button
        type='submit'
        disabled={busy}
        className='flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60'>
        {busy
          ? 'Signing in…'
          : mode === 'password'
            ? 'Sign in'
            : 'Send magic link'}
      </button>

      <button
        type='button'
        onClick={() => {
          setMode((m) => (m === 'password' ? 'magic' : 'password'));
          setError(null);
        }}
        className='w-full text-sm font-medium text-primary hover:underline'>
        {mode === 'password'
          ? 'Sign in with a magic link instead'
          : 'Sign in with password instead'}
      </button>

      <p className='border-t border-border pt-5 text-center text-sm text-slate-600'>
        Don't have an account?{' '}
        <a
          href='/auth/register'
          className='font-semibold text-primary hover:underline'>
          Create one
        </a>
      </p>
    </form>
  );
}
