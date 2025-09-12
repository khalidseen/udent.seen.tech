import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAssignCreatorToPatients } from '@/hooks/useAssignCreatorToPatients';
import { useUserProfile } from '@/hooks/useUserProfile';

const UpdatePatientsCreatorButton: React.FC = () => {
  const { data: profile } = useUserProfile();
  const assignCreatorMutation = useAssignCreatorToPatients();

  const handleAssignCreator = () => {
    assignCreatorMutation.mutate();
  };

  if (!profile) return null;

  return (
    <Button
      onClick={handleAssignCreator}
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={assignCreatorMutation.isPending}
    >
      {assignCreatorMutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      ربط المرضى بـ {profile.full_name}
    </Button>
  );
};

export default UpdatePatientsCreatorButton;
