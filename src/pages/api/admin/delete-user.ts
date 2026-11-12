import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

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

    if (
      authErr ||
      !caller ||
      (caller.app_metadata?.role !== 'admin' &&
        caller.app_metadata?.role !== 'supervisor')
    ) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
      });
    }

    const { user_id } = await request.json();
    if (!user_id)
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
      });
    if (user_id === caller.id)
      return new Response(
        JSON.stringify({ error: 'You cannot delete yourself' }),
        { status: 400 },
      );

    const { data: target } = await admin
      .from('profiles')
      .select('is_developer')
      .eq('id', user_id)
      .single();
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('is_developer')
      .eq('id', caller.id)
      .single();

    if (target?.is_developer && !callerProfile?.is_developer) {
      return new Response(
        JSON.stringify({
          error: 'Only a Superadmin can delete another Superadmin',
        }),
        { status: 403 },
      );
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(user_id);
    if (deleteErr) throw deleteErr;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message ?? 'Internal error' }),
      { status: 500 },
    );
  }
};
