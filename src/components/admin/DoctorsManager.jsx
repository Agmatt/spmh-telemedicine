import { useEffect, useState } from 'react';
import {
  fetchDoctorDirectory,
  updateDoctor,
  createUserAccount,
  deleteDoctor,
  createDoctorPlaceholder,
  fetchAllSpecialtiesAdmin,
} from '../../lib/admin';

export default function DoctorsManager() {
  const [rows, setRows] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchDoctorDirectory());
      setSpecialties(await fetchAllSpecialtiesAdmin());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleAddDoctor() {
    if (!selectedSpec) return;
    try {
      await createDoctorPlaceholder(selectedSpec);
      setAdding(false);
      setSelectedSpec('');
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const active = openId ? rows.find((r) => r.id === openId) : null;

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Clinical
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Doctors
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Manage clinician profiles and their system access.
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark'>
          + Add Doctor
        </button>
      </div>

      {adding && (
        <div className='mb-6 rounded-xl border border-border bg-surface/50 p-4 flex items-end gap-3'>
          <div className='flex-1'>
            <label className='block text-sm font-semibold text-slate-800 mb-1'>
              Select Specialty
            </label>
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className='h-10 w-full rounded-lg border border-border px-3 text-sm'>
              <option value=''>Choose a specialty...</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddDoctor}
            disabled={!selectedSpec}
            className='h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50'>
            Create
          </button>
        </div>
      )}

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
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className='border-b border-border last:border-0 hover:bg-surface/40'>
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-slate-900'>
                      {r.doctor_name ?? (
                        <span className='italic text-muted'>
                          Unlinked Profile
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
                        No Login
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

// Keep the rest of your DoctorDrawer component exactly as it is below this line!
function DoctorDrawer({ doctor, onClose, onChanged }) {
  // ... paste the existing DoctorDrawer code here ...
}
