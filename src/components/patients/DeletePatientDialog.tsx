import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeletePatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  onConfirmDelete: () => void;
  isLoading?: boolean;
}

const DeletePatientDialog = ({
  open,
  onOpenChange,
  patientName,
  onConfirmDelete,
  isLoading = false
}: DeletePatientDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 dark:text-red-400">
            تأكيد حذف المريض
          </AlertDialogTitle>
          <AlertDialogDescription className="text-right leading-relaxed">
            <div>
              هل أنت متأكد من رغبتك في حذف المريض{' '}
              <span className="font-semibold text-foreground">"{patientName}"</span>{' '}
              نهائياً من النظام؟
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400 font-medium">
                تحذير: هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة بالمريض 
                بما في ذلك:
              </span>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>السجلات الطبية والسنية</li>
                <li>المواعيد والعلاجات</li>
                <li>الوصفات الطبية</li>
                <li>الصور والأشعة</li>
                <li>البيانات المالية</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            className="bg-secondary hover:bg-secondary/80"
            disabled={isLoading}
          >
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'جاري الحذف...' : 'حذف نهائياً'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeletePatientDialog;
