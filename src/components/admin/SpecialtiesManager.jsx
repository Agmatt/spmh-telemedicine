import { useEffect, useState } from 'react';
import {
  fetchAllSpecialtiesAdmin,
  updateSpecialty,
  createSpecialty,
  deleteSpecialty,
} from '../../lib/admin';

export default function SpecialtiesManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAllSpecialtiesAdmin());
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
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Catalogue
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Specialties
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Add new specialties, edit fees and durations, deactivate or delete.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark'>
          + Add specialty
        </button>
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
                <th className='px-4 py-3 font-bold'>Name</th>
                <th className='px-4 py-3 font-bold'>Slug</th>
                <th className='px-4 py-3 font-bold'>Fee</th>
                <th className='px-4 py-3 font-bold'>Duration</th>
                <th className='px-4 py-3 font-bold'>Status</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className='border-b border-border last:border-0 hover:bg-surface/40'>
                  <td className='px-4 py-3 font-semibold text-slate-900'>
                    {r.name}
                  </td>
                  <td className='px-4 py-3 font-mono text-xs text-muted'>
                    {r.slug}
                  </td>
                  <td className='px-4 py-3 font-semibold text-primary'>
                    KES {r.fee_kes.toLocaleString()}
                  </td>
                  <td className='px-4 py-3 text-slate-700'>
                    {r.duration_minutes} min
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.is_active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-700'}`}>
                      {r.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <button
                      onClick={() => setOpenId(r.id)}
                      className='text-xs font-semibold text-primary hover:underline'>
                      Edit →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <SpecialtyDrawer
          specialty={active}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
      {creating && (
        <CreateDrawer onClose={() => setCreating(false)} onCreated={load} />
      )}
    </div>
  );
}

function SpecialtyDrawer({ specialty, onClose, onChanged }) {
  const [fee, setFee] = useState(specialty.fee_kes);
  const [duration, setDuration] = useState(specialty.duration_minutes);
  const [description, setDescription] = useState(specialty.description ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  async function save(patch) {
    setBusy(true);
    setErr(null);
    try {
      await updateSpecialty(specialty.id, patch);
      onChanged();
      onClose();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setErr(null);
    try {
      await deleteSpecialty(specialty.id);
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
              Specialty
            </p>
            <p className='mt-0.5 font-semibold text-slate-900'>
              {specialty.name}
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
        <div className='flex-1 overflow-y-auto px-5 py-5 space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Fee (KES)
            </label>
            <input
              type='number'
              min={0}
              step={50}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Duration (minutes)
            </label>
            <input
              type='number'
              min={10}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className='mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
          </div>

          {err && <p className='text-sm text-accent'>{err}</p>}

          <div className='space-y-2 pt-2'>
            <button
              onClick={() =>
                save({
                  fee_kes: fee,
                  duration_minutes: duration,
                  description: description.trim() || null,
                })
              }
              disabled={busy}
              className='h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => save({ is_active: !specialty.is_active })}
              disabled={busy}
              className={`h-11 w-full rounded-lg border text-sm font-semibold ${specialty.is_active ? 'border-accent/40 text-accent hover:bg-accent/5' : 'border-primary/40 text-primary hover:bg-primary/5'}`}>
              {specialty.is_active ? 'Deactivate (hide from site)' : 'Activate'}
            </button>
            {confirmDelete ? (
              <div className='rounded-lg border border-accent/40 bg-accent/5 p-3'>
                <p className='text-xs text-accent'>
                  This is permanent. Only allowed if no doctors or appointments
                  reference this specialty.
                </p>
                <div className='mt-2 flex gap-2'>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className='h-9 flex-1 rounded border border-border text-xs font-semibold'>
                    Cancel
                  </button>
                  <button
                    onClick={doDelete}
                    disabled={busy}
                    className='h-9 flex-1 rounded bg-accent text-xs font-semibold text-white disabled:opacity-60'>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className='h-11 w-full rounded-lg text-sm font-semibold text-accent hover:bg-accent/5'>
                Delete specialty
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function CreateDrawer({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [fee, setFee] = useState(600);
  const [duration, setDuration] = useState(20);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Auto-derive slug from name unless user typed one
  const [slugTouched, setSlugTouched] = useState(false);
  useEffect(() => {
    if (!slugTouched) {
      setSlug(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  }, [name, slugTouched]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await createSpecialty({
        name,
        slug,
        description,
        fee_kes: fee,
        duration_minutes: duration,
      });
      onCreated();
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
          <p className='font-semibold text-slate-900'>Add specialty</p>
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
        <div className='flex-1 overflow-y-auto px-5 py-5 space-y-4'>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Cardiology'
              className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Slug
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              className='mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
            <p className='mt-1 text-xs text-muted'>
              Used in URLs. Lowercase, hyphens only.
            </p>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-sm font-semibold text-slate-800'>
                Fee (KES)
              </label>
              <input
                type='number'
                min={0}
                step={50}
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
              />
            </div>
            <div>
              <label className='block text-sm font-semibold text-slate-800'>
                Duration (min)
              </label>
              <input
                type='number'
                min={10}
                max={120}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
              />
            </div>
          </div>
          <div>
            <label className='block text-sm font-semibold text-slate-800'>
              Description{' '}
              <span className='text-xs font-normal text-muted'>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className='mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
            />
          </div>
          {err && <p className='text-sm text-accent'>{err}</p>}
          <button
            onClick={submit}
            disabled={busy || !name || !slug}
            className='h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
            {busy ? 'Creating…' : 'Create specialty'}
          </button>
        </div>
      </aside>
    </>
  );
}
