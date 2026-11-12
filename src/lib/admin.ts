import { supabase } from './supabase';

export interface AdminAppointment {
  id: string;
  status: string;
  scheduled_at: string;
  reason: string | null;
  created_at: string;
  specialty_name: string;
  fee_kes: number;
  duration_minutes: number;
  patient_id: string;
  patient_user_id: string;
  patient_name: string | null;
  patient_phone: string | null;
  payment_id: string | null;
  amount_kes: number | null;
  payment_status: string | null;
  payment_reference: string | null;
  payment_confirmed_at: string | null;
  payment_method: string | null;
}

export interface AdminPayment {
  id: string;
  amount_kes: number;
  status: string;
  method: string;
  reference: string | null;
  confirmed_at: string | null;
  created_at: string;
  appointment_id: string;
  scheduled_at: string;
  appointment_status: string;
  specialty_name: string;
  patient_name: string | null;
  patient_phone: string | null;
}

export interface OverviewStats {
  todays_appointments: number;
  pending_payments_count: number;
  pending_payments_kes: number;
  confirmed_this_week: number;
  active_doctors: number;
  upcoming_7d: number;
}

export async function fetchAdminAppointments(): Promise<AdminAppointment[]> {
  const { data, error } = await supabase
    .from('admin_appointments_view')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as AdminAppointment[];
}

export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  const { data, error } = await supabase
    .from('admin_payments_view')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as AdminPayment[];
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const { data, error } = await supabase.rpc('admin_overview_stats');
  if (error) throw error;
  return data as OverviewStats;
}

export async function confirmPayment(
  paymentId: string,
  reference: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_confirm_payment', {
    p_payment_id: paymentId,
    p_reference: reference,
  });
  if (error) throw error;
}

export async function cancelAppointment(
  appointmentId: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_cancel_appointment', {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });
  if (error) throw error;
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'supervisor' || role === 'receptionist';
}

export function canManagePayments(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canManageDoctors(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'supervisor' || role === 'Superadmin';
}
// --- Doctor directory ---
export interface DoctorRow {
  id: string;
  specialty_id: string;
  specialty_name: string;
  user_id: string | null;
  doctor_email: string | null;
  doctor_name: string | null;
  bio: string | null;
  years_experience: number | null;
  languages: string[] | null;
  is_active: boolean;
}

export async function fetchDoctorDirectory(): Promise<DoctorRow[]> {
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select(
      'id,specialty_id,user_id,bio,years_experience,languages,is_active,specialties(name)',
    )
    .order('created_at');
  if (error) throw error;

  const rows: DoctorRow[] = (doctors ?? []).map((d: any) => ({
    id: d.id,
    specialty_id: d.specialty_id,
    specialty_name: d.specialties?.name ?? '—',
    user_id: d.user_id,
    doctor_email: null,
    doctor_name: null,
    bio: d.bio,
    years_experience: d.years_experience,
    languages: d.languages,
    is_active: d.is_active,
  }));

  // Hydrate name/email from profiles (RLS allows admin)
  const userIds = rows.map((r) => r.user_id).filter((x): x is string => !!x);
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,phone')
      .in('id', userIds);
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    rows.forEach((r) => {
      if (r.user_id && map.has(r.user_id)) {
        const p: any = map.get(r.user_id);
        r.doctor_name = p.full_name;
      }
    });
  }
  return rows;
}

export async function updateDoctor(
  id: string,
  patch: Partial<{
    bio: string;
    years_experience: number;
    is_active: boolean;
    specialty_id: string;
  }>,
): Promise<void> {
  const { error } = await supabase.from('doctors').update(patch).eq('id', id);
  if (error) throw error;
}

export async function createUserAccount(params: {
  email: string;
  full_name: string;
  role: 'doctor' | 'receptionist' | 'admin' | 'supervisor';
  doctor_id?: string;
}): Promise<{ user_id: string; temp_password: string; email_sent: boolean }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  const res = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Failed to create user');
  return body;
}

// --- Specialties ---
export interface SpecialtyAdmin {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  fee_kes: number;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
}

export async function fetchAllSpecialtiesAdmin(): Promise<SpecialtyAdmin[]> {
  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []) as SpecialtyAdmin[];
}

export async function updateSpecialty(
  id: string,
  patch: Partial<SpecialtyAdmin>,
): Promise<void> {
  const { error } = await supabase
    .from('specialties')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}

// --- Staff ---
export interface StaffRow {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export async function fetchStaff(): Promise<StaffRow[]> {
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function setUserRole(
  targetUserId: string,
  newRole: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', {
    p_target_user_id: targetUserId,
    p_new_role: newRole,
  });
  if (error) throw error;
}

// --- Audit ---
export interface AuditRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  table_name: string | null;
  row_id: string | null;
  before: any;
  after: any;
}

export async function fetchAuditLog(
  limit = 100,
  offset = 0,
): Promise<AuditRow[]> {
  const { data, error } = await supabase.rpc('admin_list_audit', {
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

// Specialties: create / delete
export async function createSpecialty(params: {
  name: string;
  slug: string;
  description: string;
  fee_kes: number;
  duration_minutes: number;
  sort_order?: number;
}): Promise<string> {
  const { data, error } = await supabase.rpc('admin_create_specialty', {
    p_name: params.name,
    p_slug: params.slug,
    p_description: params.description,
    p_fee_kes: params.fee_kes,
    p_duration_minutes: params.duration_minutes,
    p_sort_order: params.sort_order ?? 999,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteSpecialty(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_specialty', { p_id: id });
  if (error) throw error;
}

// Staff row now includes is_developer
export interface StaffRow {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_developer: boolean;
}

export function isDeveloperRole(
  role: string | null | undefined,
  isDev: boolean | null | undefined,
): boolean {
  return role === 'admin' && isDev === true;
}
export async function deleteUserAccount(userId: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');
  const res = await fetch('/api/admin/delete-user', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Failed to delete user');
}

export async function deleteDoctor(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_doctor', { p_id: id });
  if (error) throw error;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_appointment', {
    p_id: id,
  });
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_payment', { p_id: id });
  if (error) throw error;
}