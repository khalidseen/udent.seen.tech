import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdvancedToothNote {
  id: string;
  patient_id: string;
  clinic_id: string;
  tooth_number: string;
  numbering_system: string;
  title: string;
  content: string;
  note_type: string;
  diagnosis?: string;
  treatment_plan?: string;
  differential_diagnosis?: string[];
  status: string;
  priority: string;
  severity: string;
  color_code: string;
  tags?: string[];
  examination_date: string;
  follow_up_date?: string;
  treatment_start_date?: string;
  treatment_completion_date?: string;
  next_appointment_date?: string;
  symptoms?: string[];
  clinical_findings?: string;
  radiographic_findings?: string;
  treatment_performed?: string;
  materials_used?: string[];
  treatment_outcome?: string;
  complications?: string;
  patient_response?: string;
  treating_doctor?: string;
  assisting_staff?: string[];
  quality_score?: number;
  peer_reviewed?: boolean;
  reviewed_by?: string;
  review_date?: string;
  review_comments?: string;
  attachments?: any[];
  reference_links?: string[];
  related_notes?: string[];
  template_id?: string;
  is_template?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_modified_by?: string;
}

interface UseAdvancedToothNotesProps {
  patientId?: string;
  toothNumber?: string;
}

export const useAdvancedToothNotes = ({ patientId, toothNumber }: UseAdvancedToothNotesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notes for a specific tooth
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['advanced-tooth-notes', patientId, toothNumber],
    queryFn: async () => {
      if (!patientId || !toothNumber) return [];
      
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', 'universal')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdvancedToothNote[];
    },
    enabled: !!patientId && !!toothNumber
  });

  // Fetch all notes for a patient
  const { data: allPatientNotes = [] } = useQuery({
    queryKey: ['advanced-tooth-notes-all', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('numbering_system', 'universal')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AdvancedToothNote[];
    },
    enabled: !!patientId
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<AdvancedToothNote>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const insertData = {
        patient_id: patientId,
        clinic_id: profile.id,
        numbering_system: 'universal',
        created_by: (await supabase.auth.getUser()).data.user?.id,
        tooth_number: noteData.tooth_number,
        title: noteData.title || '',
        content: noteData.content || '',
        note_type: noteData.note_type || 'general',
        diagnosis: noteData.diagnosis,
        treatment_plan: noteData.treatment_plan,
        status: noteData.status || 'active',
        priority: noteData.priority || 'medium',
        severity: noteData.severity || 'mild',
        color_code: noteData.color_code || '#3b82f6',
        examination_date: noteData.examination_date,
        follow_up_date: noteData.follow_up_date,
        clinical_findings: noteData.clinical_findings,
        radiographic_findings: noteData.radiographic_findings,
        treating_doctor: noteData.treating_doctor
      };

      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الملاحظة الطبية بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الملاحظة",
        variant: "destructive"
      });
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<AdvancedToothNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('advanced_tooth_notes')
        .update({
          ...updateData,
          last_modified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الملاحظة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملاحظة",
        variant: "destructive"
      });
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('advanced_tooth_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advanced-tooth-notes'] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الملاحظة بنجاح"
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الملاحظة",
        variant: "destructive"
      });
    }
  });

  // Get notes by priority
  const getNotesByPriority = (priority: string) => {
    return allPatientNotes.filter(note => note.priority === priority);
  };

  // Get notes by status
  const getNotesByStatus = (status: string) => {
    return allPatientNotes.filter(note => note.status === status);
  };

  // Get notes by type
  const getNotesByType = (type: string) => {
    return allPatientNotes.filter(note => note.note_type === type);
  };

  // Get notes requiring follow-up
  const getFollowUpNotes = () => {
    const today = new Date().toISOString().split('T')[0];
    return allPatientNotes.filter(note => 
      note.follow_up_date && note.follow_up_date <= today && note.status === 'active'
    );
  };

  // Get critical notes
  const getCriticalNotes = () => {
    return allPatientNotes.filter(note => 
      note.priority === 'critical' || note.severity === 'critical'
    );
  };

  // Get recent notes (last 30 days)
  const getRecentNotes = (days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allPatientNotes.filter(note => 
      new Date(note.created_at) >= cutoffDate
    );
  };

  return {
    notes,
    allPatientNotes,
    isLoading,
    error,
    addNote: addNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isAddingNote: addNoteMutation.isPending,
    isUpdatingNote: updateNoteMutation.isPending,
    isDeletingNote: deleteNoteMutation.isPending,
    
    // Helper functions
    getNotesByPriority,
    getNotesByStatus,
    getNotesByType,
    getFollowUpNotes,
    getCriticalNotes,
    getRecentNotes
  };
};