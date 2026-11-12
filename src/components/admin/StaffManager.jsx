import { useEffect, useState } from 'react';
import { fetchStaff, setUserRole, createUserAccount } from '../../lib/admin';

const ROLES = ['patient', 'receptionist', 'doctor', 'admin', 'supervisor'];

  async function handleDelete(userId, email) {
    if (
      !confirm(
        `CRITICAL: Permanently delete user ${email}? This cannot be undone.`,
      )
    )
      return;
    try {
      await deleteUserAccount(userId);
      load();
    } catch (e) {
      alert(e.message);
    }
  }


function badge(role) {
  const map = {
    admin: 'bg-accent/10 text-accent',
    supervisor: 'bg-purple-100 text-purple-800',
    doctor: 'bg-primary/10 text-primary',
    receptionist: 'bg-blue-100 text-blue-800',
    patient: 'bg-slate-100 text-slate-700',
  };
  return map[role] ?? 'bg-slate-100 text-slate-700';
}
function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function StaffManager() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchStaff());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.email ?? '').toLowerCase().includes(q) ||
      (r.full_name ?? '').toLowerCase().includes(q)
    );
  });

  async function changeRole(userId, role) {
    const target = rows.find((r) => r.id === userId);
    if (target?.is_developer) {
      alert(
        'This is a developer account. Only another developer can change it.',
      );
      load();
      return;
    }
    if (!confirm(`Set role to "${role}"? This takes effect on next sign-in.`)) {
      load();
      return;
    }
    try {
      await setUserRole(userId, role);
      load();
    } catch (e) {
      alert(e.message);
      load();
    }
  }

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Access
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Staff &amp; roles
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Manage roles for every user. Role changes take effect on next
            sign-in.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className='inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark'>
          + Invite staff
        </button>
      </div>

      <div className='mb-4'>
        <input
          type='search'
          placeholder='Search by name or email…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-9 w-full max-w-md rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
        />
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
                <th className='px-4 py-3 font-bold'>User</th>
                <th className='px-4 py-3 font-bold'>Role</th>
                <th className='px-4 py-3 font-bold'>Signed up</th>
                <th className='px-4 py-3 font-bold'>Last sign-in</th>
                <th className='px-4 py-3 font-bold text-right'>Change role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-12 text-center text-sm text-muted'>
                    No users.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className='border-b border-border last:border-0 hover:bg-surface/40'>
                  <td className='px-4 py-3'>
                    <p className='font-semibold text-slate-900'>
                      {r.full_name ?? '—'}
                    </p>
                    <p className='text-xs text-muted'>{r.email}</p>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge(r.role)}`}>
                      {r.role}
                    </span>
                    {r.is_developer && (
                      <span className='ml-1.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-900'>
                        Developer
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-xs text-muted'>
                    {fmt(r.created_at)}
                  </td>
                  <td className='px-4 py-3 text-xs text-muted'>
                    {fmt(r.last_sign_in_at)}
                  </td>
                  <td className='px-4 py-3 text-right'>
                    <div className='flex items-center justify-end gap-3'>
                      <select
                        disabled={r.is_developer}
                        value={r.role}
                        onChange={(e) => changeRole(r.id, e.target.value)}
                        className='h-8 rounded-lg border border-border px-2 text-xs'>
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {!r.is_developer && (
                        <button
                          onClick={() => handleDelete(r.id, r.email)}
                          className='text-xs font-semibold text-accent hover:underline'>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <InviteModal onClose={() => setCreating(false)} onCreated={load} />
      )}
    </div>
  );
}

function InviteModal({ onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('receptionist');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [created, setCreated] = useState(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const r = await createUserAccount({
        email: email.trim(),
        full_name: fullName.trim(),
        role,
      });
      setCreated(r);
      onCreated();
    } catch (e) {
      setErr(e.message);
    } finally {
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
      <div className='fixed inset-0 z-50 grid place-items-center px-4'>
        <div className='w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl'>
          {created ? (
            <>
              <h2 className='font-display-bold text-lg text-secondary'>
                Account created
              </h2>
              <p className='mt-1 text-sm text-slate-600'>
                Share these credentials. They can change the password after
                sign-in.
              </p>
              <div className='mt-4 rounded-lg border border-border bg-surface p-3'>
                <p className='text-xs font-bold uppercase tracking-wider text-muted'>
                  Email
                </p>
                <p className='font-mono text-sm'>{email}</p>
                <p className='mt-3 text-xs font-bold uppercase tracking-wider text-muted'>
                  Temporary password
                </p>
                <div className='mt-1 flex gap-2'>
                  <code className='flex-1 truncate rounded bg-white px-2 py-1 font-mono text-xs'>
                    {created.temp_password}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(created.temp_password)
                    }
                    className='rounded border border-border px-2 py-1 text-xs'>
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className='mt-5 h-11 w-full rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark'>
                Done
              </button>
            </>
          ) : (
            <>
              <h2 className='font-display-bold text-lg text-secondary'>
                Invite staff
              </h2>
              <div className='mt-4 space-y-3'>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                    className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-slate-800'>
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className='mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm'>
                    <option value='receptionist'>Receptionist</option>
                    <option value='admin'>Admin</option>
                    <option value='supervisor'>Supervisor</option>
                  </select>
                  <p className='mt-1 text-xs text-muted'>
                    Doctors are created from the Doctors page.
                  </p>
                </div>
              </div>
              {err && <p className='mt-3 text-sm text-accent'>{err}</p>}
              <div className='mt-5 flex gap-2'>
                <button
                  onClick={onClose}
                  className='h-11 flex-1 rounded-lg border border-border text-sm font-semibold text-slate-700'>
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !email || !fullName}
                  className='h-11 flex-[2] rounded-lg bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-60'>
                  {busy ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
