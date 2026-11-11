import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Field from '../ui/Field.jsx';

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
    window.location.href = next;
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
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <svg
            className='h-6 w-6'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            aria-hidden='true'>
            <rect width='20' height='16' x='2' y='4' rx='2' />
            <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
          </svg>
        </div>
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
        <Field
          label='Password'
          type='password'
          required
          autoComplete='current-password'
          placeholder='••••••••••'
          value={password}
          onChange={setPassword}
        />
      )}

      {error && (
        <div
          className='flex items-start gap-2 rounded-lg bg-accent/8 px-3 py-2.5 text-sm text-accent'
          role='alert'>
          <svg
            className='mt-0.5 h-4 w-4 flex-shrink-0'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2.5'
            stroke-linecap='round'
            stroke-linejoin='round'
            aria-hidden='true'>
            <circle cx='12' cy='12' r='10' />
            <line x1='12' x2='12' y1='8' y2='12' />
            <line x1='12' x2='12.01' y1='16' y2='16' />
          </svg>
          <span>{error}</span>
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
        {!busy && (
          <svg
            className='h-4 w-4'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
            aria-hidden='true'>
            <path d='M5 12h14' />
            <path d='m12 5 7 7-7 7' />
          </svg>
        )}
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
