export default function Field({
  label,
  hint,
  error,
  required,
  id,
  type = 'text',
  value,
  onChange,
  ...props
}) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const describedBy =
    [hint && `${inputId}-hint`, error && `${inputId}-error`]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div>
      <label
        htmlFor={inputId}
        className='mb-1.5 block text-sm font-semibold text-slate-800'>
        {label}
        {required && (
          <span className='ml-0.5 text-accent' aria-hidden='true'>
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={`block h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors
          ${error ? 'border-accent focus:border-accent focus:ring-accent/20' : 'border-border focus:border-primary focus:ring-primary/20'}
          focus:outline-none focus:ring-4`}
        {...props}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className='mt-1.5 text-xs text-muted'>
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${inputId}-error`}
          className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-accent'>
          <svg
            className='h-3.5 w-3.5 flex-shrink-0'
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
          {error}
        </p>
      )}
    </div>
  );
}
