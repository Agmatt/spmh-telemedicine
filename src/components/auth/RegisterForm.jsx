import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Field from '../ui/Field.jsx';

const SPECIALTIES = [
  ['general-medicine', 'General Medicine'],
  ['general-surgery', 'General Surgery'],
  ['obstetrics-gynaecology', 'Obstetrics & Gynaecology'],
  ['paediatrics', 'Paediatrics'],
  ['dermatology', 'Dermatology'],
  ['dentistry', 'Dentistry'],
  ['ophthalmology', 'Ophthalmology'],
  ['mental-health', 'Mental Health / Psychiatry'],
];

export default function RegisterForm() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
    consent: false,
    specialty: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 10)
      return setError('Password must be at least 10 characters.');
    if (form.password !== form.password_confirm)
      return setError('Passwords do not match.');
    if (!form.consent)
      return setError(
        'You must accept the Privacy Policy and Terms of Telemedicine.',
      );

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          full_name: form.full_name,
          phone: form.phone,
          requested_specialty: form.specialty,
          consent_versions: {
            privacy_policy: '1.0',
            terms_of_service: '1.0',
            telemedicine_consent: '1.0',
          },
        },
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  if (done) {
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
          Check your email
        </h2>
        <p className='mt-2 text-sm text-slate-600'>
          Confirm your address via the link we sent, then sign in.
        </p>
        <a
          href='/auth/login'
          className='mt-6 inline-block text-sm font-semibold text-primary hover:underline'>
          Continue to sign in →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='space-y-5'>
      <Field
        label='Full name'
        required
        autoComplete='name'
        placeholder='Jane Wanjiku'
        value={form.full_name}
        onChange={(v) => set('full_name', v)}
      />

      <Field
        label='Email address'
        type='email'
        required
        autoComplete='email'
        placeholder='you@example.com'
        value={form.email}
        onChange={(v) => set('email', v)}
      />

      <Field
        label='Phone (M-Pesa)'
        type='tel'
        required
        autoComplete='tel'
        placeholder='+254 7XX XXX XXX'
        value={form.phone}
        onChange={(v) => set('phone', v)}
      />

      <div>
        <label
          htmlFor='field-specialty'
          className='mb-1.5 block text-sm font-semibold text-slate-800'>
          Reason for visit{' '}
          <span className='text-xs font-normal text-muted'>(optional)</span>
        </label>
        <select
          id='field-specialty'
          value={form.specialty}
          onChange={(e) => set('specialty', e.target.value)}
          className='block h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20'>
          <option value=''>General consultation</option>
          {SPECIALTIES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <Field
        label='Password'
        type='password'
        required
        autoComplete='new-password'
        hint='At least 10 characters.'
        placeholder='••••••••••'
        value={form.password}
        onChange={(v) => set('password', v)}
      />

      <Field
        label='Confirm password'
        type='password'
        required
        autoComplete='new-password'
        placeholder='••••••••••'
        value={form.password_confirm}
        onChange={(v) => set('password_confirm', v)}
      />

      <label className='flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface/60 p-4'>
        <input
          type='checkbox'
          checked={form.consent}
          onChange={(e) => set('consent', e.target.checked)}
          className='mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/30'
        />
        <span className='text-sm leading-relaxed text-slate-700'>
          I have read and accept the{' '}
          <a
            href='/legal/privacy'
            target='_blank'
            className='font-semibold text-primary hover:underline'>
            Privacy Policy
          </a>
          ,{' '}
          <a
            href='/legal/terms'
            target='_blank'
            className='font-semibold text-primary hover:underline'>
            Terms of Telemedicine
          </a>
          , and{' '}
          <a
            href='/legal/dpa'
            target='_blank'
            className='font-semibold text-primary hover:underline'>
            Data Protection Notice
          </a>
          . SPMH will process my personal data under the Kenya Data Protection
          Act 2019.
        </span>
      </label>

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
        {busy ? 'Creating account…' : 'Create account'}
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

      <p className='border-t border-border pt-5 text-center text-sm text-slate-600'>
        Already have an account?{' '}
        <a
          href='/auth/login'
          className='font-semibold text-primary hover:underline'>
          Sign in
        </a>
      </p>
    </form>
  );
}
