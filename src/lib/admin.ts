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
  return role === 'admin' || role === 'supervisor';
}
