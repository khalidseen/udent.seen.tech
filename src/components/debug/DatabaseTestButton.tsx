import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DatabaseTestButton = () => {
  const { toast } = useToast();

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 اختبار اتصال قاعدة البيانات...');
      
      // Test 1: Check user authentication
      const { data: user, error: authError } = await supabase.auth.getUser();
      console.log('1. Authentication:', { user: user.user?.email, error: authError });
      
      if (!user.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Test 2: Check profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('user_id', user.user.id)
        .single();
      
      console.log('2. Profile:', { profile, error: profileError });

      // Test 3: Check doctors table structure
      const { data: doctorsStructure, error: structureError } = await supabase
        .from('doctors')
        .select('*')
        .limit(1);
      
      console.log('3. Doctors table structure test:', { 
        hasData: doctorsStructure?.length > 0, 
        error: structureError 
      });

      // Test 4: Try to insert a test record
      const testDoctor = {
        clinic_id: profile?.id,
        full_name: 'اختبار الطبيب',
        specialization: 'طب عام',
        status: 'active'
      };

      console.log('4. Test doctor data:', testDoctor);

      const { data: insertResult, error: insertError } = await supabase
        .from('doctors')
        .insert(testDoctor)
        .select();

      console.log('5. Insert test result:', { data: insertResult, error: insertError });

      if (insertError) {
        throw new Error(`خطأ في إدراج البيانات: ${insertError.message}`);
      }

      // Test 5: Delete the test record
      if (insertResult && insertResult[0]) {
        const { error: deleteError } = await supabase
          .from('doctors')
          .delete()
          .eq('id', insertResult[0].id);
        
        console.log('6. Delete test result:', { error: deleteError });
      }

      toast({
        title: "✅ نجح الاختبار",
        description: "جميع اختبارات قاعدة البيانات نجحت",
      });

    } catch (error) {
      console.error('❌ فشل اختبار قاعدة البيانات:', error);
      toast({
        title: "❌ فشل الاختبار",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={testDatabaseConnection}
      variant="outline"
      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
    >
      🔍 اختبار قاعدة البيانات
    </Button>
  );
};

export default DatabaseTestButton;