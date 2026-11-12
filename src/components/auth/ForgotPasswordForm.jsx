import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Field from '../ui/Field.jsx';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className='rounded-2xl border border-border bg-white p-8 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <svg
            className='h-6 w-6'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'>
            <rect width='20' height='16' x='2' y='4' rx='2' />
            <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
          </svg>
        </div>
        <h2 className='mt-4 font-display-bold text-xl text-secondary'>
          Check your inbox
        </h2>
        <p className='mt-2 text-sm text-slate-600'>
          If an account exists for <strong>{email}</strong>, we sent a reset
          link. It expires in 1 hour.
        </p>
        <a
          href='/auth/login'
          className='mt-6 inline-block text-sm font-semibold text-primary hover:underline'>
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='space-y-5'>
      <Field
        label='Email address'
        type='email'
        required
        autoComplete='email'
        placeholder='you@example.com'
        value={email}
        onChange={setEmail}
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
        {busy ? 'Sending…' : 'Send reset link'}
      </button>
      <p className='border-t border-border pt-5 text-center text-sm text-slate-600'>
        Remembered it?{' '}
        <a
          href='/auth/login'
          className='font-semibold text-primary hover:underline'>
          Sign in
        </a>
      </p>
    </form>
  );
}
