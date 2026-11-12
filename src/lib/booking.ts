import { supabase } from './supabase';

export interface Specialty {
  id: string;
  slug: string;
  name: string;
  fee_kes: number;
  duration_minutes: number;
}

export interface Doctor {
  id: string;
  specialty_id: string;
  bio: string | null;
  years_experience: number | null;
}

export interface Slot {
  id: string;
  doctor_id: string;
  starts_at: string;
  ends_at: string;
}

export interface MyAppointment {
  id: string;
  status: string;
  scheduled_at: string;
  reason: string | null;
  specialty_name: string;
  fee_kes: number;
  duration_minutes: number;
  payment_status: string;
  payment_amount: number;
}

export async function fetchSpecialties(): Promise<Specialty[]> {
  const { data, error } = await supabase
    .from('specialties')
    .select('id,slug,name,fee_kes,duration_minutes')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchDoctorsForSpecialty(
  specialtyId: string,
): Promise<Doctor[]> {
  const { data, error } = await supabase
    .from('doctors')
    .select('id,specialty_id,bio,years_experience')
    .eq('specialty_id', specialtyId)
    .eq('is_active', true);
  if (error) throw error;
  return data ?? [];
}

export async function fetchOpenSlots(doctorId: string): Promise<Slot[]> {
  const { data, error } = await supabase
    .from('availability_slots')
    .select('id,doctor_id,starts_at,ends_at')
    .eq('doctor_id', doctorId)
    .eq('status', 'open')
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function bookAppointment(params: {
  doctor_id: string;
  slot_id: string;
  specialty_id: string;
  scheduled_at: string;
  reason: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_doctor_id: params.doctor_id,
    p_slot_id: params.slot_id,
    p_specialty_id: params.specialty_id,
    p_scheduled_at: params.scheduled_at,
    p_reason: params.reason || '',
  });
  if (error) throw error;
  return data as string;
}

export async function fetchMyAppointments(): Promise<MyAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id, status, scheduled_at, reason,
      specialties!inner(name, fee_kes, duration_minutes),
      payments(amount_kes, status)
    `,
    )
    .order('scheduled_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    status: row.status,
    scheduled_at: row.scheduled_at,
    reason: row.reason,
    specialty_name: row.specialties?.name ?? 'Consultation',
    fee_kes: row.specialties?.fee_kes ?? 0,
    duration_minutes: row.specialties?.duration_minutes ?? 20,
    payment_status: row.payments?.[0]?.status ?? 'pending',
    payment_amount: row.payments?.[0]?.amount_kes ?? 0,
  }));
}

export async function fetchAppointmentById(
  id: string,
): Promise<MyAppointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id, status, scheduled_at, reason,
      specialties!inner(name, fee_kes, duration_minutes),
      payments(amount_kes, status)
    `,
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    status: data.status,
    scheduled_at: data.scheduled_at,
    reason: data.reason,
    specialty_name: (data as any).specialties?.name ?? 'Consultation',
    fee_kes: (data as any).specialties?.fee_kes ?? 0,
    duration_minutes: (data as any).specialties?.duration_minutes ?? 20,
    payment_status: (data as any).payments?.[0]?.status ?? 'pending',
    payment_amount: (data as any).payments?.[0]?.amount_kes ?? 0,
  };
}

export function formatNairobiDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatNairobiTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatNairobiDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: 'Africa/Nairobi',
  });
}
