import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  fetchSpecialties,
  fetchDoctorsForSpecialty,
  fetchOpenSlots,
  bookAppointment,
  formatNairobiDate,
  formatNairobiTime,
  formatNairobiDayKey,
} from '../../lib/booking';

const STEP_LABELS = ['Specialty', 'Doctor', 'Time', 'Review'];

export default function BookingFlow({ initialSpecialty = '' }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auth guard + initial load
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        const here = window.location.pathname + window.location.search;
        window.location.href = `/auth/login?next=${encodeURIComponent(here)}`;
        return;
      }
      setAuthChecked(true);
      try {
        const list = await fetchSpecialties();
        setSpecialties(list);
        if (initialSpecialty) {
          const found = list.find((s) => s.slug === initialSpecialty);
          if (found) {
            setSelectedSpecialty(found);
            setStep(2);
          }
        }
      } catch (e) {
        setError(e.message);
      }
    });
  }, [initialSpecialty]);

  // Load doctors when specialty changes
  useEffect(() => {
    if (!selectedSpecialty) return;
    setLoading(true);
    fetchDoctorsForSpecialty(selectedSpecialty.id)
      .then(setDoctors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedSpecialty]);

  // Load slots when doctor changes
  useEffect(() => {
    if (!selectedDoctor) return;
    setLoading(true);
    fetchOpenSlots(selectedDoctor.id)
      .then((rows) => {
        setSlots(rows);
        const first = rows[0];
        if (first) setSelectedDay(formatNairobiDayKey(first.starts_at));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedDoctor]);

  const slotsByDay = useMemo(() => {
    const map = new Map();
    slots.forEach((s) => {
      const key = formatNairobiDayKey(s.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots]);

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return slotsByDay.find(([k]) => k === selectedDay)?.[1] ?? [];
  }, [slotsByDay, selectedDay]);

  async function handleSubmit() {
    if (!selectedSpecialty || !selectedDoctor || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const id = await bookAppointment({
        doctor_id: selectedDoctor.id,
        slot_id: selectedSlot.id,
        specialty_id: selectedSpecialty.id,
        scheduled_at: selectedSlot.starts_at,
        reason,
      });
      window.location.href = `/portal/appointment-confirmed?id=${id}`;
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <div className='rounded-2xl border border-border bg-white p-12 text-center text-sm text-muted'>
        Loading…
      </div>
    );
  }

  return (
    <div>
      {/* Progress bar */}
      <ol className='mb-8 grid grid-cols-4 gap-2'>
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className='flex flex-col items-center gap-2'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${active ? 'border-primary bg-primary text-white' : done ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-muted'}`}>
                {done ? '✓' : n}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-primary' : 'text-muted'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {error && (
        <div
          className='mb-6 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent'
          role='alert'>
          {error}
        </div>
      )}

      {/* STEP 1: Specialty */}
      {step === 1 && (
        <div>
          <h2 className='font-display-bold text-2xl text-secondary'>
            Choose a specialty
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            Not sure? Choose General Medicine — your doctor will refer you if
            needed.
          </p>
          {loading && (
            <p className='mt-6 text-sm text-muted'>Loading specialties…</p>
          )}
          <div className='mt-6 grid gap-3 sm:grid-cols-2'>
            {specialties.map((s) => (
              <button
                key={s.id}
                type='button'
                onClick={() => {
                  setSelectedSpecialty(s);
                  setStep(2);
                }}
                className='group rounded-xl border border-border bg-white p-5 text-left transition-all hover:border-primary/40 hover:shadow-md'>
                <p className='font-semibold text-slate-900'>{s.name}</p>
                <p className='mt-1 text-xs text-muted'>
                  KES {s.fee_kes.toLocaleString()} · {s.duration_minutes} min
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Doctor */}
      {step === 2 && selectedSpecialty && (
        <div>
          <button
            type='button'
            onClick={() => {
              setStep(1);
              setSelectedSpecialty(null);
              setSelectedDoctor(null);
            }}
            className='mb-4 text-xs font-semibold text-primary hover:underline'>
            ← Change specialty
          </button>
          <h2 className='font-display-bold text-2xl text-secondary'>
            Choose a doctor
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            All clinicians are licensed SPMH doctors in {selectedSpecialty.name}
            .
          </p>
          {loading && (
            <p className='mt-6 text-sm text-muted'>Loading doctors…</p>
          )}
          {!loading && doctors.length === 0 && (
            <div className='mt-6 rounded-xl border border-border bg-white p-8 text-center'>
              <p className='text-sm text-slate-600'>
                No doctors available in this specialty right now.
              </p>
            </div>
          )}
          <div className='mt-6 grid gap-3'>
            {doctors.map((d, i) => (
              <button
                key={d.id}
                type='button'
                onClick={() => {
                  setSelectedDoctor(d);
                  setStep(3);
                }}
                className='flex items-start gap-4 rounded-xl border border-border bg-white p-5 text-left transition-all hover:border-primary/40 hover:shadow-md'>
                <div className='grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-primary/10 text-primary'>
                  <svg
                    className='h-6 w-6'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.75'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                    <circle cx='8.5' cy='7' r='4' />
                    <path d='M20 8v6' />
                    <path d='M23 11h-6' />
                  </svg>
                </div>
                <div className='flex-1'>
                  <p className='font-semibold text-slate-900'>
                    SPMH Specialist {i + 1}
                  </p>
                  <p className='mt-0.5 text-xs text-muted'>
                    {d.years_experience ?? 8}+ years experience · English &amp;
                    Kiswahili
                  </p>
                  {d.bio && (
                    <p className='mt-2 text-sm text-slate-600'>{d.bio}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Slot */}
      {step === 3 && selectedDoctor && (
        <div>
          <button
            type='button'
            onClick={() => {
              setStep(2);
              setSelectedDoctor(null);
              setSlots([]);
            }}
            className='mb-4 text-xs font-semibold text-primary hover:underline'>
            ← Change doctor
          </button>
          <h2 className='font-display-bold text-2xl text-secondary'>
            Choose a time
          </h2>
          <p className='mt-2 text-sm text-slate-600'>
            Times are in East Africa Time (Nairobi).
          </p>

          {loading && (
            <p className='mt-6 text-sm text-muted'>Loading availability…</p>
          )}

          {!loading && slots.length === 0 && (
            <div className='mt-6 rounded-xl border border-border bg-white p-8 text-center'>
              <p className='text-sm text-slate-600'>
                No open slots right now. Try another doctor or check back later.
              </p>
            </div>
          )}

          {!loading && slotsByDay.length > 0 && (
            <div className='mt-6 rounded-2xl border border-border bg-white p-4 md:p-6'>
              <div className='flex gap-2 overflow-x-auto pb-2'>
                {slotsByDay.map(([key]) => {
                  const d = new Date(`${key}T12:00:00+03:00`);
                  const active = key === selectedDay;
                  return (
                    <button
                      key={key}
                      type='button'
                      onClick={() => setSelectedDay(key)}
                      className={`flex min-w-[70px] flex-col items-center rounded-lg border px-3 py-2 transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-border bg-white text-slate-700 hover:border-primary/40'}`}>
                      <span className='text-[10px] font-semibold uppercase tracking-wider'>
                        {d.toLocaleDateString('en-KE', {
                          weekday: 'short',
                          timeZone: 'Africa/Nairobi',
                        })}
                      </span>
                      <span className='text-lg font-bold'>{d.getDate()}</span>
                      <span className='text-[10px] uppercase'>
                        {d.toLocaleDateString('en-KE', {
                          month: 'short',
                          timeZone: 'Africa/Nairobi',
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
                {daySlots.map((s) => (
                  <button
                    key={s.id}
                    type='button'
                    onClick={() => {
                      setSelectedSlot(s);
                      setStep(4);
                    }}
                    className='rounded-lg border border-border bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary'>
                    {formatNairobiTime(s.starts_at)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Review */}
      {step === 4 && selectedSpecialty && selectedDoctor && selectedSlot && (
        <div>
          <button
            type='button'
            onClick={() => {
              setStep(3);
              setSelectedSlot(null);
            }}
            className='mb-4 text-xs font-semibold text-primary hover:underline'>
            ← Change time
          </button>
          <h2 className='font-display-bold text-2xl text-secondary'>
            Review and confirm
          </h2>

          <div className='mt-6 space-y-4 rounded-2xl border border-border bg-white p-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                  Specialty
                </p>
                <p className='mt-1 font-semibold text-slate-900'>
                  {selectedSpecialty.name}
                </p>
              </div>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                  Duration
                </p>
                <p className='mt-1 font-semibold text-slate-900'>
                  {selectedSpecialty.duration_minutes} minutes
                </p>
              </div>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                  Date
                </p>
                <p className='mt-1 font-semibold text-slate-900'>
                  {formatNairobiDate(selectedSlot.starts_at)}
                </p>
              </div>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                  Time
                </p>
                <p className='mt-1 font-semibold text-slate-900'>
                  {formatNairobiTime(selectedSlot.starts_at)} EAT
                </p>
              </div>
            </div>

            <div className='border-t border-border pt-4'>
              <label
                htmlFor='reason'
                className='block text-sm font-semibold text-slate-800'>
                Reason for visit{' '}
                <span className='text-xs font-normal text-muted'>
                  (optional)
                </span>
              </label>
              <textarea
                id='reason'
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Briefly describe what you would like to discuss.'
                className='mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
              />
            </div>

            <div className='flex items-center justify-between border-t border-border pt-4'>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                  Total
                </p>
                <p className='font-display-bold text-2xl text-primary'>
                  KES {selectedSpecialty.fee_kes.toLocaleString()}
                </p>
              </div>
              <p className='max-w-xs text-right text-xs text-muted'>
                Payment is confirmed at the SPMH reception desk before your
                consultation. You will receive an SMS reminder.
              </p>
            </div>
          </div>

          <button
            type='button'
            onClick={handleSubmit}
            disabled={submitting}
            className='mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60'>
            {submitting ? 'Booking…' : 'Confirm booking'}
            {!submitting && (
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
                <path d='M5 12h14' />
                <path d='m12 5 7 7-7 7' />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
