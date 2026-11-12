import { useState } from 'react';

export default function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  error,
  hint,
  required,
  ...props
}) {
  const [show, setShow] = useState(false);
  const id = `pw-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div>
      <label
        htmlFor={id}
        className='mb-1.5 block text-sm font-semibold text-slate-800'>
        {label}
        {required && (
          <span className='ml-0.5 text-accent' aria-hidden='true'>
            *
          </span>
        )}
      </label>
      <div className='relative'>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={!!error || undefined}
          className={`block h-11 w-full rounded-lg border bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition-colors ${
            error
              ? 'border-accent focus:border-accent focus:ring-accent/20'
              : 'border-border focus:border-primary focus:ring-primary/20'
          } focus:outline-none focus:ring-4`}
          {...props}
        />
        <button
          type='button'
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className='absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-surface hover:text-slate-700'>
          {show ? (
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
              <path d='M9.88 9.88a3 3 0 1 0 4.24 4.24' />
              <path d='M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' />
              <path d='M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' />
              <line x1='2' x2='22' y1='2' y2='22' />
            </svg>
          ) : (
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
              <path d='M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          )}
        </button>
      </div>
      {hint && !error && <p className='mt-1.5 text-xs text-muted'>{hint}</p>}
      {error && (
        <p className='mt-1.5 text-xs font-medium text-accent'>{error}</p>
      )}
    </div>
  );
}
