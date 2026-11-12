import { useEffect, useState } from 'react';
import {
  fetchDoctorDirectory,
  updateDoctor,
  createUserAccount,
} from '../../lib/admin';

  async function doDelete() {
    if (!confirm('Permanently delete this doctor?')) return;
    setBusy(true);
    setErr(null);
    try {
      await deleteDoctor(doctor.id);
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

export default function DoctorsManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchDoctorDirectory());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const active = openId ? rows.find((r) => r.id === openId) : null;

  return (
    <div>
      <div className='mb-6'>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
          Clinical
        </p>
        <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
          Doctors
        </h1>
        <p className='mt-2 text-sm text-slate-600'>
          Placeholder doctors need a login account created before they can sign
          in.
        </p>
      </div>

      {error && (
        <div className='mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent'>
          {error}
        </div>
      )}
      {loading && <p className='text-sm text-muted'>Loading…</p>}

      {!loading && (
        <div className='overflow-hidden rounded-2xl border border-border bg-white'>
          <table className='w-full text-sm'>
            <thead className='border-b border-border bg-surface/50 text-left text-xs uppercase tracking-wider text-muted'>
              <tr>
                <th className='px-4 py-3 font-bold'>Doctor</th>
                <th className='px-4 py-3 font-bold'>Specialty</th>
                <th className='px-4 py-3 font-bold'>Account</th>
                <th className='px-4 py-3 font-bold'>Status</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-12 text-center text-sm text-muted'>
                    No doctors yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className='border-b border-border last:border-0 hover:bg-surface/40'>
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-slate-900'>
                      {r.doctor_name ?? (
                        <span className='italic text-muted'>
                          Placeholder — no login yet
                        </span>
                      )}
                    </p>
                    <p className='text-xs text-muted'>
                      {r.years_experience ?? '—'} years
                    </p>
                  </td>
                  <td className='px-4 py-3 text-slate-700'>
                    {r.specialty_name}
                  </td>
                  <td className='px-4 py-3'>
                    {r.user_id ? (
                      <span className='rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-800'>
                        Linked
                      </span>
                    ) : (
                      <span className='rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-800'>
                        Pending
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.is_active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-700'}`}>
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      onClick={() => setOpenId(r.id)}
                      className='text-xs font-semibold text-primary hover:underline'>
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <DoctorDrawer
          doctor={active}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function DoctorDrawer({ doctor, onClose, onChanged }) {
  const [mode, setMode] = useState(doctor.user_id ? 'edit' : 'invite');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState(doctor.bio ?? '');
  const [years, setYears] = useState(doctor.years_experience ?? 8);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function handleInvite() {
    setBusy(true);
    setErr(null);
    try {
      const result = await createUserAccount({
        email: email.trim(),
        full_name: fullName.trim(),
        role: 'doctor',
        doctor_id: doctor.id,
      });
      setCreated(result);
      onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    setErr(null);
    try {
      await updateDoctor(doctor.id, {
        bio: bio.trim() || null,
        years_experience: years,
      });
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    setErr(null);
    try {
      await updateDoctor(doctor.id, { is_active: !doctor.is_active });
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className='fixed inset-0 z-40 bg-black/40'
        aria-hidden='true'
      />
      <aside className='fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-white shadow-2xl'>
        <div className='flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-5'>
          <div>
            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
              {doctor.specialty_name}
            </p>
            <p className='mt-0.5 font-semibold text-slate-900'>
              {doctor.doctor_name ?? 'Placeholder doctor'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label='Close'
            className='inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface'>
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
              <line x1='18' x2='6' y1='6' y2='18' />
              <line x1='6' x2='18' y1='6' y2='18' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-5 py-5'>
          {created ? (
            <>
              <div className='rounded-xl border border-green-200 bg-green-50 p-4'>
                <p className='text-sm font-semibold text-green-900'>
                  Account created
                </p>
                <p className='mt-1 text-xs text-green-800'>
                  Share these credentials with the doctor. They can change the
                  password after first sign-in.
                </p>
              </div>
              <div className='mt-5 space-y-3 text-sm'>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wider text-muted'>
                    Email
                  </p>
                  <p className='mt-1 font-mono'>
                    {created.user_id ? email : email}
                  </p>
                </div>
                <div>
                  <p className='text-xs font-bold uppercase tracking-wider text-muted'>
                    Temporary password
                  </p>
                  <div className='mt-1 flex items-center gap-2'>
                    <code className='flex-1 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs'>
                      {created.temp_password}
                    </code>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(created.temp_password)
                      }
                      className='rounded-lg border border-border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-surface'>
                      Copy
                    </button>
                  </div>
                </div>
                <p className='text-xs text-muted'>
                  {created.email_sent
                    ? 'An email with these credentials was sent.'
                    : 'Email sending was skipped — share manually.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className='mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark'>
                Done
              </button>
            </>
          ) : mode === 'invite' ? (
            <>
              <h2 className='font-display-bold text-lg text-secondary'>
                Create login account
              </h2>
              <p className='mt-1 text-sm text-slate-600'>
                Link an email to this doctor placeholder so they can sign in.
              </p>
              <div className='mt-5 space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='Dr. Jane Wanjiku'
                    className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Email
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='doctor@spmh.co.ke'
                    className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                  />
                </div>
              </div>
              {err && <p className='mt-4 text-sm text-accent'>{err}</p>}
              <button
                onClick={handleInvite}
                disabled={busy || !email || !fullName}
                className='mt-6 h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
                {busy ? 'Creating…' : 'Create account'}
              </button>
            </>
          ) : (
            <>
              <h2 className='font-display-bold text-lg text-secondary'>
                Edit profile
              </h2>
              <div className='mt-5 space-y-4'>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className='mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Years of experience
                  </label>
                  <input
                    type='number'
                    min={1}
                    max={50}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                  />
                </div>
              </div>
              {err && <p className='mt-4 text-sm text-accent'>{err}</p>}
              <div className='mt-6 space-y-2'>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className='h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  onClick={doDelete}
                  disabled={busy}
                  className='h-11 w-full rounded-lg text-sm font-semibold text-accent hover:bg-accent/5'>
                  Permanently delete
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
