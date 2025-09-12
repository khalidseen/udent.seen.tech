import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Patient } from '@/hooks/usePatients';
import { useCurrency } from '@/hooks/useCurrency';
import { useSharedFinancialData } from '@/hooks/useSharedFinancialData';
import { CreditCard, Plus, Wallet, Receipt, TrendingUp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FinancialStatusDialogProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

const FinancialStatusDialog: React.FC<FinancialStatusDialogProps> = ({
  patient,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'payment' | 'charges' | 'history'>('payment');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>('');
  const [chargeDescription, setChargeDescription] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'paid' | 'pending' | 'overdue' | 'partial'>('pending');

  
  // استخدام الـ hook المشترك للبيانات المالية
  const { 
    summary: financialSummary, 
    transactions, 
    isLoading: financialLoading,
    refreshData: refreshFinancialData 
  } = useSharedFinancialData({ 
    patientId: patient?.id || '' 
  });

  const handleOpenFullFinancials = () => {
    if (patient) {
      navigate(`/patients/${patient.id}?tab=financial`);
      onClose();
    }
  };

  if (!patient) return null;

  // استخدام البيانات من الـ hook المشترك مع fallback للبيانات الموجودة
  const currentBalance = financialSummary.totalBalance !== 0 ? financialSummary.totalBalance : (patient.financial_balance || 0);
  const balanceColor = currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-green-600' : 'text-gray-600';
  const statusColor = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
    partial: 'bg-blue-100 text-blue-800'
  };

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    // محاكاة تسجيل الدفعة - سيتم استبداله عند ربط الجداول
    toast.success('تم تسجيل الدفعة بنجاح');

    // تحديث البيانات المالية المشتركة
    refreshFinancialData();

    setPaymentAmount('');
    setPaymentNote('');
    onClose();
  };

  const handleAddCharges = async () => {
    if (!chargeAmount || isNaN(Number(chargeAmount)) || Number(chargeAmount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    if (!chargeDescription.trim()) {
      toast.error('يرجى إدخال وصف الرسوم');
      return;
    }

    // محاكاة إضافة رسوم - سيتم استبداله عند ربط الجداول
    toast.success('تمت إضافة الرسوم بنجاح');

    // تحديث البيانات المالية المشتركة
    refreshFinancialData();

    setChargeAmount('');
    setChargeDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              إدارة الحالة المالية - {patient.full_name}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenFullFinancials}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              الصفحة الكاملة
            </Button>
          </div>
          <DialogDescription>
            عرض وتعديل الحالة المالية للمريض - للتفاصيل الكاملة، اضغط على "الصفحة الكاملة"
          </DialogDescription>
        </DialogHeader>

        {/* معلومات الحالة المالية الحالية */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">الحالة المالية الحالية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">الحالة:</span>
              <Badge className={statusColor[patient.financial_status]}>
                {patient.financial_status === 'paid' && 'مدفوع بالكامل'}
                {patient.financial_status === 'pending' && 'معلق'}
                {patient.financial_status === 'overdue' && 'متأخر'}
                {patient.financial_status === 'partial' && 'مدفوع جزئياً'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">الرصيد:</span>
              <span className={`text-lg font-bold ${balanceColor}`}>
                {formatAmount(currentBalance)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* التبويبات */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          <Button
            variant={activeTab === 'payment' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('payment')}
            className="flex-1"
          >
            <Wallet className="h-4 w-4 ml-2" />
            تسجيل دفعة
          </Button>
          <Button
            variant={activeTab === 'charges' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('charges')}
            className="flex-1"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة رسوم
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="flex-1"
          >
            <Receipt className="h-4 w-4 ml-2" />
            المعاملات
          </Button>
        </div>

        {/* تسجيل دفعة */}
        {activeTab === 'payment' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-amount">مبلغ الدفعة ({currentCurrency.symbol})</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="payment-status">الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={(value: 'paid' | 'pending' | 'overdue' | 'partial') => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوع بالكامل</SelectItem>
                  <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-note">ملاحظات الدفعة</Label>
              <Textarea
                id="payment-note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="ملاحظات إضافية حول الدفعة..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                onClick={handlePayment}
                disabled={updateFinancials.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Receipt className="h-4 w-4 ml-2" />
                {updateFinancials.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
              </Button>
            </div>
          </div>
        )}

        {/* إضافة رسوم */}
        {activeTab === 'charges' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="charge-amount">مبلغ الرسوم ({currentCurrency.symbol})</Label>
              <Input
                id="charge-amount"
                type="number"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="charge-description">وصف الرسوم</Label>
              <Textarea
                id="charge-description"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                placeholder="وصف تفصيلي للرسوم (علاج، استشارة، إجراء...)"
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">تأثير على الحالة المالية</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                الرصيد الجديد سيكون: {formatAmount(currentBalance + Number(chargeAmount || 0))}
              </p>
            </div>

            <Separator />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button 
                onClick={handleAddCharges}
                disabled={addCharges.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 ml-2" />
                {addCharges.isPending ? 'جاري الإضافة...' : 'إضافة الرسوم'}
              </Button>
            </div>
          </div>
        )}

        {/* عرض المعاملات الأخيرة */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">المعاملات الأخيرة</h3>
              {financialLoading && (
                <div className="text-sm text-gray-500">جاري التحميل...</div>
              )}
            </div>

            {/* ملخص سريع */}
            {!financialLoading && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">إجمالي المدفوع</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatAmount(financialSummary.totalPaid)}
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">إجمالي الرسوم</div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatAmount(financialSummary.totalCharges)}
                    </div>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">المبلغ المعلق</div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatAmount(financialSummary.pendingAmount)}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* قائمة المعاملات */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {!financialLoading && transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>لا توجد معاملات مالية بعد</p>
                </div>
              )}
              
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'payment' 
                          ? 'bg-green-100 text-green-600' 
                          : transaction.type === 'charge'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {transaction.type === 'payment' ? (
                          <Wallet className="h-4 w-4" />
                        ) : transaction.type === 'charge' ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString('ar-SA')}
                          {transaction.payment_method && ` - ${transaction.payment_method}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className={`font-bold ${
                        transaction.type === 'payment' 
                          ? 'text-green-600' 
                          : 'text-blue-600'
                      }`}>
                        {transaction.type === 'payment' ? '-' : '+'}
                        {formatAmount(transaction.amount)}
                      </div>
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {transaction.status === 'completed' ? 'مكتمل' : 
                         transaction.status === 'pending' ? 'معلق' : 'ملغي'}
                      </Badge>
                    </div>
                  </div>
                  {transaction.notes && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {transaction.notes}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {transactions.length > 0 && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleOpenFullFinancials}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  عرض جميع المعاملات
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancialStatusDialog;
