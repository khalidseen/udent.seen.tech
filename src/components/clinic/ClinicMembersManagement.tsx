import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, UserMinus, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AddClinicMemberDialog } from './AddClinicMemberDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClinicMember {
  id: string;
  user_id: string;
  clinic_id: string;
  role: string;
  joined_at: string;
  is_active: boolean;
  full_name: string;
  email: string;
}

interface ClinicMembersManagementProps {
  clinicId: string;
  clinicName: string;
}

export function ClinicMembersManagement({ clinicId, clinicName }: ClinicMembersManagementProps) {
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('clinic_memberships')
        .select(`
          *,
          profiles!inner(
            full_name,
            user_id
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Get user emails from auth
      const memberIds = data?.map(m => m.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', memberIds);
      
      if (profilesError) throw profilesError;
      
      // Get user emails (this requires admin access)
      const membersWithDetails = data?.map(member => ({
        ...member,
        full_name: profiles?.find(p => p.user_id === member.user_id)?.full_name || 'غير محدد',
        email: 'email@example.com' // In real app, you'd fetch this properly
      })) || [];
      
      setMembers(membersWithDetails);
    } catch (error) {
      console.error('Error fetching clinic members:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل أعضاء العيادة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('clinic_memberships')
        .update({ is_active: false })
        .eq('id', memberId);
      
      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم إزالة العضو من العيادة بنجاح",
      });
      
      fetchMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "خطأ",
        description: "فشل في إزالة العضو",
        variant: "destructive",
      });
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchMembers();
  }, [clinicId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">أعضاء {clinicName}</h3>
          <p className="text-sm text-muted-foreground">
            إدارة المستخدمين الذين لديهم صلاحية الوصول لهذه العيادة
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة عضو
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث في الأعضاء..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">لا توجد أعضاء في هذه العيادة</p>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.full_name}</h4>
                        <Badge variant="outline">
                          {member.role === 'owner' ? (
                            <>
                              <Crown className="h-3 w-3 ml-1" />
                              مالك
                            </>
                          ) : member.role === 'admin' ? (
                            'مدير'
                          ) : member.role === 'doctor' ? (
                            'طبيب'
                          ) : (
                            'عضو'
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        انضم في: {new Date(member.joined_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>
                  
                  {member.role !== 'owner' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserMinus className="h-4 w-4 ml-2" />
                          إزالة
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الإزالة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من إزالة {member.full_name} من العيادة؟
                            سيفقد هذا المستخدم الوصول لجميع بيانات العيادة.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => removeMember(member.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            إزالة
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddClinicMemberDialog
        clinicId={clinicId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchMembers}
      />
    </div>
  );
}