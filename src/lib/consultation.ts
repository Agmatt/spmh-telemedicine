import { supabase } from './supabase';

export async function getConsultationData(appointmentId: string) {
  const { data: appt, error } = await supabase
    .from('admin_appointments_view')
    .select('*, consultation_id:consultations!inner(id, status)')
    .eq('id', appointmentId)
    .single();
  if (error) throw error;

  const consultationId =
    appt.consultation_id?.[0]?.id || appt.consultation_id?.id;
  if (!consultationId) throw new Error('Consultation record not found');

  const { data: note } = await supabase
    .from('clinical_notes')
    .select('*')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  const { data: rx } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('consultation_id', consultationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { appt, consultationId, note, prescription: rx };
}

export async function saveNote(
  consultationId: string,
  doctorId: string,
  content: string,
) {
  const { data: existing } = await supabase
    .from('clinical_notes')
    .select('id')
    .eq('consultation_id', consultationId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('clinical_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('clinical_notes')
      .insert({
        consultation_id: consultationId,
        doctor_id: doctorId,
        content,
      });
    if (error) throw error;
  }
}

export async function savePrescription(
  consultationId: string,
  doctorId: string,
  patientId: string,
  items: any[],
) {
  const { data: rx, error: rxErr } = await supabase
    .from('prescriptions')
    .insert({
      consultation_id: consultationId,
      doctor_id: doctorId,
      patient_id: patientId,
      status: 'issued',
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (rxErr) throw rxErr;
  if (!items.length) return rx;

  const { error: itemErr } = await supabase
    .from('prescription_items')
    .insert(
      items.map((i, idx) => ({
        ...i,
        prescription_id: rx.id,
        sort_order: idx,
      })),
    );
  if (itemErr) throw itemErr;
  return rx;
}

export async function updateConsultationStatus(
  appointmentId: string,
  action: 'start' | 'end',
) {
  const rpc =
    action === 'start'
      ? 'doctor_start_consultation'
      : 'doctor_end_consultation';
  const { error } = await supabase.rpc(rpc, {
    p_appointment_id: appointmentId,
  });
  if (error) throw error;
}
