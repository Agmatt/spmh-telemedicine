import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const DAILY_API_KEY = import.meta.env.DAILY_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!DAILY_API_KEY) {
      throw new Error('Missing DAILY_API_KEY in environment variables.');
    }

    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt)
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
      });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser(jwt);
    if (!user)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
      });

    const { appointment_id } = await request.json();

    // Verify user is either the assigned doctor or the patient
    const { data: appt } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_id, doctors(user_id), patients(user_id)')
      .eq('id', appointment_id)
      .single();

    if (!appt)
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
      });

    const isDoctor = appt.doctors?.user_id === user.id;
    const isPatient = appt.patients?.user_id === user.id;

    if (!isDoctor && !isPatient) {
      return new Response(
        JSON.stringify({ error: 'Not authorized for this appointment' }),
        { status: 403 },
      );
    }

    const roomName = `spmh-consult-${appointment_id}`;

    // 1. Check if the room already exists
    const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });

    if (getRes.ok) {
      const existingRoom = await getRes.json();
      return new Response(JSON.stringify({ url: existingRoom.url }), {
        status: 200,
      });
    }

    // 2. If it doesn't exist (404), create it
    const createRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // Expire in 2 hours
        },
      }),
    });

    const newRoom = await createRes.json();
    if (!createRes.ok)
      throw new Error(
        newRoom.info || newRoom.error || 'Failed to create Daily room',
      );

    return new Response(JSON.stringify({ url: newRoom.url }), { status: 200 });
  } catch (e: any) {
    console.error('API Error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
