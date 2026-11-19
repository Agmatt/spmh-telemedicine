import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_CALLER_ROLES = ['admin', 'supervisor', 'Superadmin'];

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json(
        {
          error: 'Server misconfigured: missing Supabase environment variables',
        },
        500,
      );
    }

    const jwt = (request.headers.get('authorization') || '').replace(
      /^Bearer\s+/i,
      '',
    );
    if (!jwt) return json({ error: 'Missing token' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: authErr,
    } = await admin.auth.getUser(jwt);
    if (authErr || !caller) return json({ error: 'Not authorized' }, 403);

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role, is_developer')
      .eq('id', caller.id)
      .single();

    if (!callerProfile || !ALLOWED_CALLER_ROLES.includes(callerProfile.role)) {
      return json({ error: 'Not authorized' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const user_id = body?.user_id;
    if (!user_id) return json({ error: 'user_id required' }, 400);

    if (user_id === caller.id) {
      return json({ error: 'You cannot delete yourself' }, 400);
    }

    const { data: target } = await admin
      .from('profiles')
      .select('is_developer')
      .eq('id', user_id)
      .maybeSingle();

    if (target?.is_developer && !callerProfile.is_developer) {
      return json(
        { error: 'Only a developer can delete another developer account' },
        403,
      );
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user_id);
    if (deleteErr) {
      console.error('Delete User Error:', deleteErr.message);
      return json(
        { error: `Could not delete auth user: ${deleteErr.message}` },
        500,
      );
    }

    return json({ success: true }, 200);
  } catch (e: any) {
    console.error('Delete User Error:', e?.message);
    return json({ error: e?.message ?? 'Internal error' }, 500);
  }
};
