import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Enhanced Types for Comprehensive Appointment Management
export interface TimeSlot {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  clinic_id: string;
}

export interface AppointmentRequest {
  id?: string;
  clinic_id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  requested_date: string;
  requested_time: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  slot_duration: number; // in minutes
  is_active: boolean;
}

export interface EnhancedAppointment {
  id?: string;
  clinic_id: string;
  patient_id?: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  treatment_type?: string;
  created_at?: string;
  updated_at?: string;
  // Patient info for public bookings
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
}

export interface ExistingAppointment {
  appointment_time: string;
  duration: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone?: string;
  email?: string;
}

export interface ClinicInfo {
  id?: string;
  clinic_name: string;
  clinic_address?: string;
  clinic_phone?: string;
}

export class AppointmentService {
  /**
   * Get available time slots for a doctor on a specific date
   */
  static async getAvailableTimeSlots(
    doctorId: string, 
    date: string, 
    clinicId: string
  ): Promise<TimeSlot[]> {
    try {
      // تم تعطيل الحسابات الزمنية مؤقتاً حتى يتم إضافة الجداول المطلوبة
      return [];
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  /**
   * Generate time slots for a given time range
   */
  private static generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
    date: string,
    existingAppointments: ExistingAppointment[],
    doctorId: string,
    clinicId: string
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    
    let current = new Date(start);
    
    while (current < end) {
      const slotStart = current.toTimeString().substring(0, 5);
      const slotEnd = new Date(current.getTime() + slotDuration * 60000)
        .toTimeString().substring(0, 5);
      
      // Check if slot is available
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentStart = appointment.appointment_time;
        const appointmentEnd = new Date(
          new Date(`${date}T${appointmentStart}`).getTime() + 
          appointment.duration * 60000
        ).toTimeString().substring(0, 5);
        
        return (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
               (slotEnd > appointmentStart && slotEnd <= appointmentEnd);
      });
      
      slots.push({
        id: `${doctorId}-${date}-${slotStart}`,
        doctor_id: doctorId,
        date,
        start_time: slotStart,
        end_time: slotEnd,
        is_available: isAvailable,
        clinic_id: clinicId
      });
      
      current = new Date(current.getTime() + slotDuration * 60000);
    }
    
    return slots;
  }

  /**
   * Create an appointment request (for public booking)
   */
  static async createAppointmentRequest(request: Omit<AppointmentRequest, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('appointment_requests' as any)
        .insert({
          clinic_id: (request as any).clinic_id,
          patient_name: request.patient_name,
          patient_phone: request.patient_phone,
          patient_email: request.patient_email,
          condition_description: (request as any).notes || '',
          preferred_date: (request as any).requested_date || new Date().toISOString().slice(0,10)
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating appointment request:', error);
      throw error;
    }
  }

  /**
   * Get all appointment requests for a clinic
   */
  static async getAppointmentRequests(clinicId: string): Promise<AppointmentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointment requests:', error);
      throw error;
    }
  }

  /**
   * Approve an appointment request and create an appointment
   */
  static async approveAppointmentRequest(
    requestId: string, 
    appointmentData: Partial<EnhancedAppointment>
  ): Promise<string> {
    try {
      // Start transaction
      const { data: request, error: requestError } = await supabase
        .from('appointment_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments' as any)
        .insert({
          clinic_id: (request as any).clinic_id,
          doctor_id: (request as any).doctor_id,
          appointment_date: (request as any).requested_date,
          appointment_time: (request as any).requested_time,
          duration: appointmentData.duration || 30,
          status: 'confirmed',
          notes: (request as any).notes,
          patient_name: (request as any).patient_name,
          patient_phone: (request as any).patient_phone,
          patient_email: (request as any).patient_email,
          ...(appointmentData as any)
        } as any)
        .select('id')
        .single();

      if (appointmentError) throw appointmentError;

      // Update request status
      const { error: updateError } = await supabase
        .from('appointment_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return appointment.id;
    } catch (error) {
      console.error('Error approving appointment request:', error);
      throw error;
    }
  }

  /**
   * Reject an appointment request
   */
  static async rejectAppointmentRequest(requestId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('appointment_requests')
        .update({ 
          status: 'rejected',
          notes: reason ? `مرفوض: ${reason}` : 'مرفوض'
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting appointment request:', error);
      throw error;
    }
  }

  /**
   * Get all doctors for a clinic
   */
  static async getDoctors(clinicId: string): Promise<Doctor[]> {
    try {
      const { data, error } = await supabase
        .from('doctors' as any)
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  /**
   * Get clinic information for public booking
   */
  static async getClinicInfo(clinicId: string): Promise<ClinicInfo> {
    try {
      const { data, error } = await supabase
        .from('clinics' as any)
        .select('id, name, address, phone')
        .eq('id', clinicId)
        .single();

      if (error) throw error;
      const clinic = data as any;
      return {
        id: clinic.id,
        clinic_name: clinic.name,
        clinic_address: clinic.address,
        clinic_phone: clinic.phone,
      } as ClinicInfo;
    } catch (error) {
      console.error('Error fetching clinic info:', error);
      throw error;
    }
  }

  /**
   * Check if a time slot is still available
   */
  static async isTimeSlotAvailable(
    doctorId: string,
    date: string,
    time: string,
    duration: number = 30
  ): Promise<boolean> {
    try {
      // Temporarily always available until schema supports time-based slots
      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return true;
    }
  }
}
