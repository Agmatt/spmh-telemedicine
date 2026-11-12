import { Fragment, useEffect, useState } from 'react';
import { fetchAuditLog } from '../../lib/admin';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function actionBadge(a) {
  const map = {
    insert: 'bg-green-100 text-green-800',
    update: 'bg-blue-100 text-blue-800',
    delete: 'bg-red-100 text-red-800',
    role_change: 'bg-purple-100 text-purple-800',
  };
  return map[a] ?? 'bg-slate-100 text-slate-700';
}

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAuditLog(200));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.2em] text-primary'>
            Compliance
          </p>
          <h1 className='mt-2 font-display-bold text-3xl text-secondary md:text-4xl'>
            Audit log
          </h1>
          <p className='mt-2 text-sm text-slate-600'>
            Read-only, immutable record of every data change. Newest first.
          </p>
        </div>
        <button
          onClick={load}
          className='inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-slate-700 hover:border-primary/40 hover:text-primary'>
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
            <path d='M21 12a9 9 0 1 1-6.219-8.56' />
          </svg>
          Refresh
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
                <th className='px-4 py-3 font-bold'>When</th>
                <th className='px-4 py-3 font-bold'>Actor</th>
                <th className='px-4 py-3 font-bold'>Action</th>
                <th className='px-4 py-3 font-bold'>Table</th>
                <th className='px-4 py-3 font-bold'>Row</th>
                <th className='px-4 py-3'></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='px-4 py-12 text-center text-sm text-muted'>
                    No audit entries yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className='border-b border-border hover:bg-surface/40'>
                    <td className='px-4 py-2.5 font-mono text-xs text-slate-700'>
                      {fmt(r.created_at)}
                    </td>
                    <td className='px-4 py-2.5'>
                      <p className='text-xs font-semibold text-slate-900'>
                        {r.actor_email ?? 'system'}
                      </p>
                      <p className='text-[10px] uppercase tracking-wider text-muted'>
                        {r.actor_role ?? '—'}
                      </p>
                    </td>
                    <td className='px-4 py-2.5'>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${actionBadge(
                          r.action,
                        )}`}>
                        {r.action}
                      </span>
                    </td>
                    <td className='px-4 py-2.5 font-mono text-xs text-slate-700'>
                      {r.table_name ?? '—'}
                    </td>
                    <td className='px-4 py-2.5 font-mono text-xs text-muted'>
                      {r.row_id ? r.row_id.slice(0, 8) : '—'}
                    </td>
                    <td className='px-4 py-2.5 text-right'>
                      <button
                        onClick={() =>
                          setExpanded(expanded === r.id ? null : r.id)
                        }
                        className='text-xs font-semibold text-primary hover:underline'>
                        {expanded === r.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className='border-b border-border bg-surface/60'>
                      <td colSpan={6} className='px-4 py-3'>
                        <div className='grid gap-3 md:grid-cols-2'>
                          <div>
                            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                              Before
                            </p>
                            <pre className='mt-1 max-h-48 overflow-auto rounded border border-border bg-white p-2 font-mono text-[10px] leading-snug'>
                              {r.before
                                ? JSON.stringify(r.before, null, 2)
                                : '—'}
                            </pre>
                          </div>
                          <div>
                            <p className='text-[10px] font-bold uppercase tracking-wider text-muted'>
                              After
                            </p>
                            <pre className='mt-1 max-h-48 overflow-auto rounded border border-border bg-white p-2 font-mono text-[10px] leading-snug'>
                              {r.after ? JSON.stringify(r.after, null, 2) : '—'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
