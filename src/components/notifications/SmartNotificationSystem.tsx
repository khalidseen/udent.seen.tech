import { useEffect } from "react";
import { useOfflineData } from "@/hooks/useOfflineData";
import { offlineSupabase } from "@/lib/offline-supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  status: string;
  treatment_type?: string;
}

interface Patient {
  id: string;
  full_name: string;
  date_of_birth?: string;
  medical_history?: string;
}

interface MedicalSupply {
  id: string;
  name: string;
  current_stock: number;
  minimum_stock: number;
  expiry_date?: string;
  is_active: boolean;
}

interface Notification {
  id: string;
  related_id: string;
  related_type: string;
  type: string;
  scheduled_for: string;
}

export function SmartNotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: appointments } = useOfflineData<Appointment>({
    table: 'appointments',
    filter: { status: 'scheduled' }
  });

  const { data: patients } = useOfflineData<Patient>({
    table: 'patients'
  });

  const { data: supplies } = useOfflineData<MedicalSupply>({
    table: 'medical_supplies',
    filter: { is_active: true }
  });

  const { data: existingNotifications } = useOfflineData<Notification>({
    table: 'notifications'
  });

  // Generate automatic notifications
  const generateNotifications = async () => {
    if (!user?.id) return;

    const clinicId = user.id;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Appointment reminders for tomorrow
    const tomorrowAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date);
      return aptDate.toDateString() === tomorrow.toDateString();
    });

    for (const appointment of tomorrowAppointments) {
      // Check if notification already exists
      const exists = existingNotifications.some(n => 
        n.related_id === appointment.id && 
        n.related_type === 'appointment' && 
        n.type === 'appointment'
      );

      if (!exists) {
        const patient = patients.find(p => p.id === appointment.patient_id);
        if (patient) {
          try {
            await offlineSupabase.insert('notifications', {
              clinic_id: clinicId,
              title: 'تذكير موعد غداً',
              message: `موعد المريض ${patient.full_name} غداً في ${new Date(appointment.appointment_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`,
              type: 'appointment',
              priority: 'medium',
              scheduled_for: new Date(appointment.appointment_date).toISOString(),
              patient_id: appointment.patient_id,
              related_id: appointment.id,
              related_type: 'appointment',
              auto_generated: true,
              status: 'unread'
            });
          } catch (error) {
            console.error('Error creating appointment notification:', error);
          }
        }
      }
    }

    // 2. Low stock alerts
    const lowStockSupplies = supplies.filter(supply => 
      supply.current_stock <= supply.minimum_stock
    );

    for (const supply of lowStockSupplies) {
      const exists = existingNotifications.some(n => 
        n.related_id === supply.id && 
        n.related_type === 'supply' && 
        n.type === 'supply_alert' &&
        new Date(n.scheduled_for).toDateString() === now.toDateString()
      );

      if (!exists) {
        try {
          await offlineSupabase.insert('notifications', {
            clinic_id: clinicId,
            title: 'تنبيه نقص مخزون',
            message: `المادة ${supply.name} وصلت للحد الأدنى من المخزون (${supply.current_stock}/${supply.minimum_stock})`,
            type: 'supply_alert',
            priority: 'high',
            scheduled_for: now.toISOString(),
            related_id: supply.id,
            related_type: 'supply',
            auto_generated: true,
            status: 'unread'
          });
        } catch (error) {
          console.error('Error creating low stock notification:', error);
        }
      }
    }

    // 3. Expiry date alerts (30 days before)
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const expiringSoon = supplies.filter(supply => {
      if (!supply.expiry_date) return false;
      const expiryDate = new Date(supply.expiry_date);
      return expiryDate <= thirtyDaysLater && expiryDate > now;
    });

    for (const supply of expiringSoon) {
      const exists = existingNotifications.some(n => 
        n.related_id === supply.id && 
        n.related_type === 'supply_expiry' && 
        n.type === 'supply_alert'
      );

      if (!exists) {
        const daysUntilExpiry = Math.ceil((new Date(supply.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (daysUntilExpiry <= 7) priority = 'urgent';
        else if (daysUntilExpiry <= 15) priority = 'high';

        try {
          await offlineSupabase.insert('notifications', {
            clinic_id: clinicId,
            title: 'تنبيه انتهاء صلاحية',
            message: `المادة ${supply.name} ستنتهي صلاحيتها خلال ${daysUntilExpiry} يوم`,
            type: 'supply_alert',
            priority,
            scheduled_for: now.toISOString(),
            related_id: supply.id,
            related_type: 'supply_expiry',
            auto_generated: true,
            status: 'unread'
          });
        } catch (error) {
          console.error('Error creating expiry notification:', error);
        }
      }
    }

    // 4. Patient follow-up reminders (based on medical history)
    const patientsNeedingFollowup = patients.filter(patient => {
      if (!patient.medical_history) return false;
      // Check for conditions that need regular follow-up
      const conditions = patient.medical_history.toLowerCase();
      return conditions.includes('سكري') || 
             conditions.includes('ضغط') || 
             conditions.includes('قلب') ||
             conditions.includes('diabetes') ||
             conditions.includes('hypertension');
    });

    for (const patient of patientsNeedingFollowup) {
      // Check last appointment
      const lastAppointment = appointments
        .filter(apt => apt.patient_id === patient.id)
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

      if (lastAppointment) {
        const lastAptDate = new Date(lastAppointment.appointment_date);
        const daysSinceLastApt = Math.ceil((now.getTime() - lastAptDate.getTime()) / (1000 * 60 * 60 * 24));

        // Suggest follow-up after 90 days for chronic conditions
        if (daysSinceLastApt >= 90) {
        const exists = existingNotifications.some(n => 
        n.related_id === patient.id && 
        n.type === 'followup' &&
        new Date(n.scheduled_for).toDateString() === now.toDateString()
      );

          if (!exists) {
            try {
              await offlineSupabase.insert('notifications', {
                clinic_id: clinicId,
                title: 'تذكير متابعة',
                message: `المريض ${patient.full_name} يحتاج متابعة (آخر زيارة منذ ${daysSinceLastApt} يوم)`,
                type: 'followup',
                priority: 'medium',
                scheduled_for: now.toISOString(),
                patient_id: patient.id,
                related_id: patient.id,
                related_type: 'patient',
                auto_generated: true,
                status: 'unread'
              });
            } catch (error) {
              console.error('Error creating follow-up notification:', error);
            }
          }
        }
      }
    }
  };

  // Run notification generation every hour
  useEffect(() => {
    if (appointments.length > 0 && patients.length > 0) {
      generateNotifications();
    }

    const interval = setInterval(() => {
      generateNotifications();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [appointments, patients, supplies, existingNotifications, user]);

  // This component doesn't render anything visible
  return null;
}