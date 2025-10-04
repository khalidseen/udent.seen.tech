import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  clinic_id: string;
  key_name: string;
  api_key: string;
  is_active: boolean;
  permissions: any;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export const useApiKeys = (clinicId: string | null) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    if (!clinicId) return;
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل مفاتيح API',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (keyName: string, permissions: string[] = ['read']) => {
    if (!clinicId) return;

    try {
      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_api_key');

      if (keyError) throw keyError;

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          clinic_id: clinicId,
          key_name: keyName,
          api_key: keyData,
          permissions,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'تم إنشاء مفتاح API',
        description: 'تم إنشاء مفتاح API جديد بنجاح',
      });

      await fetchApiKeys();
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء مفتاح API',
        variant: 'destructive',
      });
    }
  };

  const toggleApiKey = async (keyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: isActive })
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: isActive ? 'تم تفعيل المفتاح' : 'تم إيقاف المفتاح',
        description: isActive ? 'تم تفعيل مفتاح API بنجاح' : 'تم إيقاف مفتاح API بنجاح',
      });

      await fetchApiKeys();
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة المفتاح',
        variant: 'destructive',
      });
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      toast({
        title: 'تم حذف المفتاح',
        description: 'تم حذف مفتاح API بنجاح',
      });

      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المفتاح',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [clinicId]);

  return {
    apiKeys,
    loading,
    createApiKey,
    toggleApiKey,
    deleteApiKey,
    refreshApiKeys: fetchApiKeys,
  };
};
