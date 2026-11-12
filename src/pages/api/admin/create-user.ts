import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = import.meta.env.RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const SITE_URL =
  import.meta.env.PUBLIC_SITE_URL || 'https://telemedicine.spmh.co.ke';

function generatePassword(): string {
  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const LOWER = 'abcdefghijkmnopqrstuvwxyz';
  const DIGIT = '23456789';
  const SYM = '!@#$%&*';
  const all = UPPER + LOWER + DIGIT + SYM;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pw = pick(UPPER) + pick(LOWER) + pick(DIGIT) + pick(SYM);
  for (let i = 0; i < 12; i++) pw += pick(all);
  return pw
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt)
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 401,
      });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: authErr,
    } = await admin.auth.getUser(jwt);
    if (authErr || !caller)
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
      });
    const callerRole = caller.app_metadata?.role;
    if (callerRole !== 'admin' && callerRole !== 'supervisor') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403,
      });
    }

    const body = await request.json();
    const { email, full_name, role, doctor_id } = body;

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
      });
    }
    if (!full_name?.trim()) {
      return new Response(JSON.stringify({ error: 'Full name required' }), {
        status: 400,
      });
    }
    if (!['doctor', 'receptionist', 'admin', 'supervisor'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
      });
    }

    if (role === 'doctor' && !doctor_id) {
      return new Response(
        JSON.stringify({ error: 'doctor_id required for doctor role' }),
        { status: 400 },
      );
    }

    const password = generatePassword();

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
        app_metadata: { role },
      });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({
          error: createErr?.message ?? 'Failed to create user',
        }),
        { status: 400 },
      );
    }

    if (role === 'doctor') {
      const { error: linkErr } = await admin
        .from('doctors')
        .update({ user_id: created.user.id })
        .eq('id', doctor_id);
      if (linkErr) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
        return new Response(
          JSON.stringify({
            error: `Failed to link doctor: ${linkErr.message}`,
          }),
          { status: 500 },
        );
      }
    }

    // Best-effort email
    if (RESEND_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `SPMH Telemedicine <${FROM_EMAIL}>`,
            to: [email],
            subject: 'Your SPMH Telemedicine account',
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="color: #125276; margin: 0 0 16px;">Welcome to SPMH Telemedicine</h2>
                <p>Hello ${full_name},</p>
                <p>An account has been created for you as <strong>${role}</strong> on SPMH Telemedicine.</p>
                <table style="margin: 24px 0; border-collapse: collapse;">
                  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Sign in at</td><td><a href="${SITE_URL}/auth/login">${SITE_URL}/auth/login</a></td></tr>
                  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Email</td><td><code>${email}</code></td></tr>
                  <tr><td style="padding: 6px 12px 6px 0; color: #64748b;">Temporary password</td><td><code>${password}</code></td></tr>
                </table>
                <p style="color: #64748b; font-size: 14px;">Please change your password after your first sign-in.</p>
                <p style="color: #64748b; font-size: 14px;">— SPMH Telemedicine</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        // Swallow — password is still returned so admin can share manually
        console.error('Resend send failed:', e);
      }
    }

    return new Response(
      JSON.stringify({
        user_id: created.user.id,
        email,
        temp_password: password,
        email_sent: !!RESEND_KEY,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message ?? 'Internal error' }),
      { status: 500 },
    );
  }
};
