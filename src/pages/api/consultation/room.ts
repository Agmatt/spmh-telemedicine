import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

export const prerender = false;
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. Properly declare the IDs
const JAAS_APP_ID = import.meta.env.JAAS_APP_ID || process.env.JAAS_APP_ID;
const JAAS_API_KEY_ID =
  import.meta.env.JAAS_API_KEY_ID || process.env.JAAS_API_KEY_ID;

// 2. Decode the Base64 Private Key safely
const b64Key =
  import.meta.env.JAAS_PRIVATE_KEY || process.env.JAAS_PRIVATE_KEY || '';
const JAAS_PRIVATE_KEY = Buffer.from(b64Key, 'base64').toString('utf-8');

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!JAAS_APP_ID || !JAAS_API_KEY_ID || !JAAS_PRIVATE_KEY) {
      throw new Error('Missing JaaS environment variables.');
    }

    const authHeader = request.headers.get('authorization') || '';
    const jwtToken = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwtToken)
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
      });

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser(jwtToken);

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

    // Generate JaaS JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      aud: 'jitsi',
      iss: 'chat',
      sub: JAAS_APP_ID,
      room: roomName,
      exp: now + 60 * 60 * 2, // Expire in 2 hours
      nbf: now - 10,
      context: {
        user: {
          name: user.email,
          email: user.email,
          moderator: isDoctor, // Doctor gets moderator powers
        },
      },
    };

    const token = jwt.sign(payload, JAAS_PRIVATE_KEY, {
      algorithm: 'RS256',
      header: {
        kid: JAAS_API_KEY_ID,
        typ: 'JWT',
      },
    });

    const roomUrl = `https://8x8.vc/${JAAS_APP_ID}/${roomName}?jwt=${token}`;

    return new Response(JSON.stringify({ url: roomUrl }), { status: 200 });
  } catch (e: any) {
    console.error('API Error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
