import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PatientCallView({ appointmentId }) {
  const [roomUrl, setRoomUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        window.location.replace('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/consultation/room', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ appointment_id: appointmentId }),
        });

        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error || 'Failed to connect to video room');
        setRoomUrl(json.url);
      } catch (e) {
        setError(e.message);
      }
    });
  }, [appointmentId]);

  if (error) {
    return (
      <div className='flex h-[80vh] flex-col items-center justify-center p-6 text-center'>
        <div className='rounded-xl bg-accent/10 p-6 text-accent max-w-md'>
          <p className='font-semibold'>Unable to join call</p>
          <p className='mt-2 text-sm'>{error}</p>
          <a
            href='/portal'
            className='mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white'>
            Return to Portal
          </a>
        </div>
      </div>
    );
  }

  if (!roomUrl) {
    return (
      <div className='flex h-[80vh] items-center justify-center'>
        <p className='animate-pulse text-slate-400'>
          Connecting to secure room…
        </p>
      </div>
    );
  }

  return (
    <div className='flex h-[85vh] flex-col'>
      <div className='bg-ink px-4 py-3 text-center text-white'>
        <p className='text-sm font-semibold'>You are in the waiting room</p>
        <p className='text-xs text-white/60'>The doctor will join shortly.</p>
      </div>
      <iframe
        src={roomUrl}
        allow='camera; microphone; fullscreen; speaker; display-capture'
        className='flex-1 w-full border-0'
      />
    </div>
  );
}
