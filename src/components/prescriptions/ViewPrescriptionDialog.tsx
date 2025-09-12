import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ViewPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescription: any;
}

const ViewPrescriptionDialog = ({ open, onOpenChange, prescription }: ViewPrescriptionDialogProps) => {
  const { data: prescriptionDetails } = useQuery({
    queryKey: ['prescription-details', prescription?.id],
    queryFn: async () => {
      if (!prescription?.id) return null;
      
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patients (
            full_name,
            date_of_birth,
            phone
          ),
          prescription_medications (
            medication_name,
            dosage,
            frequency,
            duration,
            instructions
          )
        `)
        .eq('id', prescription.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!prescription?.id && open,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'وصفة طبية',
        text: `وصفة طبية للمريض ${prescriptionDetails?.patients?.full_name}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('تم نسخ الرابط');
    }
  };

  const handleWhatsAppShare = () => {
    const patientName = (prescriptionDetails as any)?.patients?.full_name || 'المريض';
    const doctorName = prescriptionDetails?.doctor_name || 'الطبيب';
    const diagnosis = prescriptionDetails?.diagnosis || '';
    
    let message = `*وصفة طبية*\n\n`;
    message += `👤 *المريض:* ${(prescriptionDetails as any)?.patients?.full_name || 'المريض'}\n`;
    message += `👨‍⚕️ *الطبيب:* ${doctorName}\n`;
    message += `🏥 *العيادة:* ${prescriptionDetails?.clinic_name || ''}\n`;
    message += `📅 *التاريخ:* ${new Date(prescriptionDetails?.prescription_date || '').toLocaleDateString('ar-IQ')}\n`;
    message += `🩺 *التشخيص:* ${diagnosis}\n\n`;
    
    message += `💊 *الأدوية:*\n`;
    prescriptionDetails?.prescription_medications?.forEach((med: any, index: number) => {
      message += `${index + 1}. *${med.medication_name}*\n`;
      message += `   - الجرعة: ${med.dosage}\n`;
      message += `   - التكرار: ${med.frequency}\n`;
      message += `   - المدة: ${med.duration}\n`;
      message += `   - التعليمات: ${med.instructions}\n\n`;
    });

    if (prescriptionDetails?.notes) {
      message += `📝 *ملاحظات:*\n${prescriptionDetails.notes}\n\n`;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!prescriptionDetails) return null;

  const patientAge = prescriptionDetails?.patients?.date_of_birth 
    ? new Date().getFullYear() - new Date(prescriptionDetails.patients.date_of_birth).getFullYear()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Action Buttons */}
        <div className="flex gap-2 p-4 border-b bg-background no-print">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm">
            <Share2 className="w-4 h-4 ml-2" />
            مشاركة
          </Button>
          <Button onClick={handleWhatsAppShare} variant="outline" size="sm" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <MessageCircle className="w-4 h-4 ml-2" />
            واتساب
          </Button>
        </div>

        {/* Prescription Design */}
        <div className="prescription-container bg-white" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <svg className="w-64 h-64 text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </div>

          <div className="relative p-10">
            {/* Header Section */}
            <header className="flex justify-between items-center pb-6 border-b-2 border-green-100">
              <div className="text-right">
                <h1 className="text-3xl font-bold text-slate-800">{prescriptionDetails.doctor_name}</h1>
                <p className="text-md text-green-700 font-semibold mt-1">طبيب عام (M.B.Ch.B)</p>
                <p className="text-sm text-slate-500 font-medium">
                  عضو نقابة أطباء العراق - {prescriptionDetails.doctor_license ? `رقم الإجازة: ${prescriptionDetails.doctor_license}` : ''}
                </p>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-slate-700">{prescriptionDetails.clinic_name}</h2>
                <p className="text-sm text-slate-500 max-w-xs">{prescriptionDetails.clinic_address}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {prescriptionDetails.clinic_phone ? `هاتف: ${prescriptionDetails.clinic_phone}` : ''}
                </p>
              </div>
            </header>

            {/* Patient Information Section */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-b border-slate-200">
              <div>
                <label className="text-sm font-semibold text-slate-500">اسم المريض</label>
                <p className="text-lg font-medium text-slate-900 pt-1">{(prescriptionDetails as any)?.patients?.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500">العمر</label>
                <p className="text-lg font-medium text-slate-900 pt-1">
                  {patientAge ? `${patientAge} سنة` : 'غير محدد'}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-500">تاريخ الفحص</label>
                <p className="text-lg font-medium text-slate-900 pt-1">
                  {new Date(prescriptionDetails.prescription_date).toLocaleDateString('ar-IQ')}
                </p>
              </div>
              <div className="sm:col-span-3">
                <label className="text-sm font-semibold text-slate-500">التشخيص الطبي</label>
                <p className="text-lg font-medium text-slate-900 pt-1">{prescriptionDetails.diagnosis}</p>
              </div>
            </section>

            {/* Prescription Body Section */}
            <main className="flex mt-8">
              <div className="rx-symbol ml-6" style={{ fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold', fontSize: '4rem', lineHeight: '1', color: '#15803d' }}>
                ℞
              </div>
              <div className="w-full space-y-5">
                {prescriptionDetails.prescription_medications?.map((medication: any, index: number) => (
                  <div key={index} className="flex items-start bg-green-50/50 border-r-4 border-green-600 p-4 rounded-lg">
                    <div className="flex-shrink-0 mr-4">
                      <svg className="w-8 h-8 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.9999 1.5C14.7613 1.5 17 3.73858 17 6.5V11H18.5C19.8807 11 21 12.1193 21 13.5V21.5C21 21.7761 20.7761 22 20.5 22H3.49995C3.22381 22 2.99995 21.7761 2.99995 21.5V13.5C2.99995 12.1193 4.11924 11 5.49995 11H6.99995V6.5C6.99995 3.73858 9.23853 1.5 11.9999 1.5ZM11.9999 3.5C10.3431 3.5 8.99995 4.84315 8.99995 6.5V11H15V6.5C15 4.84315 13.6568 3.5 11.9999 3.5Z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{medication.medication_name}</p>
                      <p className="text-md text-slate-600 mt-1">
                        {medication.dosage} - <span className="font-semibold">{medication.frequency}</span> - {medication.instructions}
                      </p>
                      <p className="text-sm font-semibold text-green-800 mt-2">المدة: {medication.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </main>

            {/* Footer Section */}
            <footer className="mt-16 pt-6 border-t border-slate-200 flex justify-between items-end">
              <div className="w-2/3">
                <h4 className="font-bold text-slate-600 text-md">ملاحظات هامة:</h4>
                <div className="text-sm text-slate-500 mt-2">
                  {prescriptionDetails.notes ? (
                    <p>{prescriptionDetails.notes}</p>
                  ) : (
                    <>
                      <p>- يجب إكمال كورس المضاد الحيوي كاملاً حتى مع الشعور بالتحسن.</p>
                      <p>- شرب كميات وافرة من السوائل.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="w-1/3 flex flex-col items-center">
                <div className="w-48 h-16">
                  {/* Placeholder for signature */}
                </div>
                <p className="text-sm text-slate-700 font-semibold border-t-2 border-slate-300 w-full text-center pt-2">
                  ختم وتوقيع الطبيب
                </p>
              </div>
            </footer>
          </div>
        </div>

        <style>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: #ffffff;
            }
            .no-print {
              display: none !important;
            }
            .prescription-container {
              box-shadow: none !important;
              border: 1px solid #cbd5e1;
              margin: 0;
              padding: 20px;
              border-radius: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPrescriptionDialog;