import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  getConsultationData,
  saveNote,
  savePrescription,
  updateConsultationStatus,
} from '../../lib/consultation';

export default function ConsultationView({ appointmentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('notes'); // notes | rx

  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [rxItems, setRxItems] = useState([]);
  const [savingRx, setSavingRx] = useState(false);

  const [roomUrl, setRoomUrl] = useState(null);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    getConsultationData(appointmentId)
      .then((res) => {
        setData(res);
        setNote(res.note?.content || '');
        if (res.prescription?.prescription_items) {
          setRxItems(res.prescription.prescription_items);
        } else {
          setRxItems([
            { drug_name: '', dosage: '', frequency: '', duration: '' },
          ]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  async function handleStartCall() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch('/api/consultation/room', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appointment_id: appointmentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRoomUrl(json.url);
      setInCall(true);
      await updateConsultationStatus(appointmentId, 'start');
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleEndCall() {
    if (!confirm('End consultation? The patient will be disconnected.')) return;
    try {
      await updateConsultationStatus(appointmentId, 'end');
      setInCall(false);
      window.location.href = '/doctor'; // Kick back to dashboard
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      await saveNote(data.consultationId, data.appt.doctor_id, note);
      alert('Note saved.');
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSaveRx() {
    setSavingRx(true);
    try {
      const cleanItems = rxItems.filter((i) => i.drug_name.trim() !== '');
      await savePrescription(
        data.consultationId,
        data.appt.doctor_id,
        data.appt.patient_id,
        cleanItems,
      );
      alert('Prescription issued.');
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingRx(false);
    }
  }

  function updateRxItem(index, field, val) {
    const next = [...rxItems];
    next[index][field] = val;
    setRxItems(next);
  }

  if (loading)
    return (
      <div className='p-12 text-center text-muted'>Loading workspace…</div>
    );
  if (error)
    return (
      <div className='p-6 text-accent bg-accent/10 rounded-xl'>{error}</div>
    );

  return (
    <div className='flex flex-col lg:h-[calc(100vh-6rem)]'>
      {/* Header (Responsive) */}
      <div className='mb-4 max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4'>
        <div>
          <h1 className='font-display-bold text-2xl text-secondary'>
            {data.appt.patient_name}
          </h1>
          <p className='text-sm text-muted'>
            {data.appt.specialty_name} · {data.appt.patient_phone}
          </p>
        </div>
        {inCall ? (
          <button
            onClick={handleEndCall}
            className='w-full sm:w-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity'>
            End Consultation
          </button>
        ) : (
          <button
            onClick={handleStartCall}
            className='w-full sm:w-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors'>
            Start Video Call
          </button>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className='grid flex-1 gap-4 lg:grid-cols-[1.3fr_1fr] lg:overflow-hidden'>
        {/* Left: Video */}
        <div className='flex flex-col overflow-hidden rounded-2xl border border-border bg-slate-900 min-h-[300px] lg:min-h-0 lg:h-full'>
          {roomUrl ? (
            <iframe
              src={roomUrl}
              allow='camera; microphone; fullscreen; speaker; display-capture'
              className='w-full h-full min-h-[300px] lg:min-h-0 border-0'
            />
          ) : (
            <div className='grid h-full min-h-[300px] place-items-center text-slate-400 p-6 text-center'>
              <p className='text-sm'>
                Click "Start Video Call" to begin the consultation.
              </p>
            </div>
          )}
        </div>

        {/* Right: Notes & Rx */}
        <div className='flex flex-col overflow-hidden rounded-2xl border border-border bg-white min-h-[400px] lg:min-h-0 lg:h-full'>
          <div className='flex border-b border-border bg-surface/50'>
            <button
              onClick={() => setTab('notes')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'notes' ? 'border-b-2 border-primary text-primary bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
              Clinical Notes
            </button>
            <button
              onClick={() => setTab('rx')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'rx' ? 'border-b-2 border-primary text-primary bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
              Prescription
            </button>
          </div>

          <div className='flex-1 overflow-y-auto p-4'>
            {tab === 'notes' && (
              <div className='h-full flex flex-col min-h-[300px]'>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder='Enter clinical notes here (SOAP format recommended)...'
                  className='flex-1 w-full resize-none rounded-lg border border-border p-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15'
                />
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className='mt-3 h-10 w-full rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors'>
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            )}

            {tab === 'rx' && (
              <div className='space-y-4'>
                {rxItems.map((item, i) => (
                  <div
                    key={i}
                    className='grid grid-cols-2 gap-2 rounded-lg border border-border p-3 bg-surface/50'>
                    <input
                      placeholder='Drug name'
                      value={item.drug_name}
                      onChange={(e) =>
                        updateRxItem(i, 'drug_name', e.target.value)
                      }
                      className='col-span-2 h-9 rounded border border-border px-2 text-sm focus:border-primary focus:outline-none'
                    />
                    <input
                      placeholder='Dosage (e.g. 500mg)'
                      value={item.dosage}
                      onChange={(e) =>
                        updateRxItem(i, 'dosage', e.target.value)
                      }
                      className='h-9 rounded border border-border px-2 text-sm focus:border-primary focus:outline-none'
                    />
                    <input
                      placeholder='Frequency (e.g. 2x daily)'
                      value={item.frequency}
                      onChange={(e) =>
                        updateRxItem(i, 'frequency', e.target.value)
                      }
                      className='h-9 rounded border border-border px-2 text-sm focus:border-primary focus:outline-none'
                    />
                    <input
                      placeholder='Duration (e.g. 5 days)'
                      value={item.duration}
                      onChange={(e) =>
                        updateRxItem(i, 'duration', e.target.value)
                      }
                      className='col-span-2 h-9 rounded border border-border px-2 text-sm focus:border-primary focus:outline-none'
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    setRxItems([
                      ...rxItems,
                      {
                        drug_name: '',
                        dosage: '',
                        frequency: '',
                        duration: '',
                      },
                    ])
                  }
                  className='text-sm font-semibold text-primary hover:underline'>
                  + Add another medication
                </button>
                <button
                  onClick={handleSaveRx}
                  disabled={savingRx}
                  className='mt-2 h-10 w-full rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors'>
                  {savingRx ? 'Issuing…' : 'Issue Prescription'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
