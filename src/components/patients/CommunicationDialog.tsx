import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Phone,
  Mail,
  Send,
  PhoneCall,
  MessageCircle,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Patient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

interface CommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
}

interface Message {
  id: string;
  type: 'sms' | 'email' | 'call' | 'whatsapp';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sender: 'clinic' | 'patient';
  subject?: string;
}

interface CallLog {
  id: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: string;
  notes?: string;
}

const CommunicationDialog: React.FC<CommunicationDialogProps> = ({
  open,
  onOpenChange,
  patient
}) => {
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'sms',
      content: 'تذكير بموعدك غداً في الساعة 10:00 صباحاً',
      timestamp: '2024-01-20T15:30:00',
      status: 'read',
      sender: 'clinic'
    },
    {
      id: '2',
      type: 'sms',
      content: 'شكراً، سأكون هناك في الموعد',
      timestamp: '2024-01-20T16:00:00',
      status: 'delivered',
      sender: 'patient'
    },
    {
      id: '3',
      type: 'email',
      content: 'تقرير الفحص الدوري مع توصيات العلاج',
      subject: 'تقرير الفحص - يناير 2024',
      timestamp: '2024-01-18T14:00:00',
      status: 'read',
      sender: 'clinic'
    }
  ]);

  const [callLogs, setCallLogs] = useState<CallLog[]>([
    {
      id: '1',
      type: 'outgoing',
      duration: 180,
      timestamp: '2024-01-19T11:00:00',
      notes: 'تأكيد موعد الغد'
    },
    {
      id: '2',
      type: 'incoming',
      duration: 95,
      timestamp: '2024-01-17T09:30:00',
      notes: 'استفسار عن نتائج الأشعة'
    },
    {
      id: '3',
      type: 'missed',
      duration: 0,
      timestamp: '2024-01-15T16:45:00'
    }
  ]);

  const [newMessage, setNewMessage] = useState({
    type: 'sms' as Message['type'],
    content: '',
    subject: ''
  });

  const messageTypeLabels = {
    sms: 'رسالة نصية',
    email: 'بريد إلكتروني',
    call: 'مكالمة',
    whatsapp: 'واتساب'
  };

  const statusLabels = {
    sent: 'مرسل',
    delivered: 'تم التسليم',
    read: 'مقروء',
    failed: 'فشل'
  };

  const statusColors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    read: 'bg-purple-100 text-purple-800',
    failed: 'bg-red-100 text-red-800'
  };

  const callTypeLabels = {
    incoming: 'واردة',
    outgoing: 'صادرة',
    missed: 'فائتة'
  };

  const callTypeColors = {
    incoming: 'bg-green-100 text-green-800',
    outgoing: 'bg-blue-100 text-blue-800',
    missed: 'bg-red-100 text-red-800'
  };

  const quickMessages = [
    'تذكير بموعد الغد',
    'تأكيد الموعد',
    'نتائج الفحص جاهزة',
    'يرجى الاتصال بالعيادة',
    'شكراً لزيارتكم',
    'توصيات بعد العلاج'
  ];

  const handleSendMessage = () => {
    if (!newMessage.content.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة محتوى الرسالة",
        variant: "destructive"
      });
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      ...newMessage,
      timestamp: new Date().toISOString(),
      status: 'sent',
      sender: 'clinic'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage({ type: 'sms', content: '', subject: '' });

    toast({
      title: "تم الإرسال",
      description: `تم إرسال ${messageTypeLabels[message.type]} بنجاح`
    });

    // محاكاة تغيير الحالة إلى "تم التسليم" بعد ثانيتين
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'delivered' } : msg
        )
      );
    }, 2000);
  };

  const handleQuickMessage = (text: string) => {
    setNewMessage(prev => ({ ...prev, content: text }));
  };

  const handleMakeCall = () => {
    const callLog: CallLog = {
      id: Date.now().toString(),
      type: 'outgoing',
      duration: 0,
      timestamp: new Date().toISOString(),
      notes: 'مكالمة جديدة'
    };

    setCallLogs(prev => [callLog, ...prev]);
    
    toast({
      title: "بدء المكالمة",
      description: `جاري الاتصال بـ ${patient.full_name}`
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMessageStats = () => {
    const total = messages.length;
    const sent = messages.filter(m => m.sender === 'clinic').length;
    const received = messages.filter(m => m.sender === 'patient').length;
    const unread = messages.filter(m => m.status !== 'read' && m.sender === 'patient').length;
    
    return { total, sent, received, unread };
  };

  const getCallStats = () => {
    const total = callLogs.length;
    const incoming = callLogs.filter(c => c.type === 'incoming').length;
    const outgoing = callLogs.filter(c => c.type === 'outgoing').length;
    const missed = callLogs.filter(c => c.type === 'missed').length;
    const totalDuration = callLogs.reduce((sum, c) => sum + c.duration, 0);
    
    return { total, incoming, outgoing, missed, totalDuration };
  };

  const messageStats = getMessageStats();
  const callStats = getCallStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            التواصل - {patient.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات الاتصال */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">رقم الهاتف</div>
                  <div className="font-medium">{patient.phone || 'غير محدد'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">البريد الإلكتروني</div>
                  <div className="font-medium">{patient.email || 'غير محدد'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">آخر تواصل</div>
                  <div className="font-medium">
                    {messages.length > 0 
                      ? new Date(messages[messages.length - 1].timestamp).toLocaleDateString('ar-SA')
                      : 'لا يوجد'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{messageStats.total}</div>
              <div className="text-sm text-blue-700">إجمالي الرسائل</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{callStats.total}</div>
              <div className="text-sm text-green-700">إجمالي المكالمات</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{messageStats.unread}</div>
              <div className="text-sm text-purple-700">رسائل غير مقروءة</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(callStats.totalDuration / 60)}
              </div>
              <div className="text-sm text-orange-700">دقائق المكالمات</div>
            </div>
          </div>

          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages">الرسائل</TabsTrigger>
              <TabsTrigger value="calls">المكالمات</TabsTrigger>
              <TabsTrigger value="send">إرسال جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>لا توجد رسائل بعد</p>
                  </div>
                ) : (
                  messages
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((message) => (
                      <Card key={message.id}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={message.sender === 'clinic' ? 'default' : 'secondary'}>
                                {message.sender === 'clinic' ? 'العيادة' : 'المريض'}
                              </Badge>
                              <Badge variant="outline">
                                {messageTypeLabels[message.type]}
                              </Badge>
                              <Badge className={statusColors[message.status]}>
                                {statusLabels[message.status]}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(message.timestamp).toLocaleString('ar-SA')}
                            </div>
                          </div>
                          
                          {message.subject && (
                            <div className="font-medium text-sm mb-1">
                              الموضوع: {message.subject}
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-700">{message.content}</p>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="calls" className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {callLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>لا توجد مكالمات بعد</p>
                  </div>
                ) : (
                  callLogs
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((call) => (
                      <Card key={call.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Badge className={callTypeColors[call.type]}>
                                  {callTypeLabels[call.type]}
                                </Badge>
                                {call.duration > 0 && (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDuration(call.duration)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(call.timestamp).toLocaleString('ar-SA')}
                            </div>
                          </div>
                          
                          {call.notes && (
                            <p className="text-sm text-gray-600 mt-2">{call.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="send" className="space-y-4">
              <div className="space-y-4">
                {/* أزرار سريعة */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">رسائل سريعة</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickMessages.map((text, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickMessage(text)}
                      >
                        {text}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* نوع الرسالة */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع الرسالة</Label>
                    <div className="flex gap-2">
                      {Object.entries(messageTypeLabels).map(([key, label]) => (
                        <Button
                          key={key}
                          size="sm"
                          variant={newMessage.type === key ? 'default' : 'outline'}
                          onClick={() => setNewMessage(prev => ({ ...prev, type: key as Message['type'] }))}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleMakeCall} className="w-full">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      إجراء مكالمة
                    </Button>
                  </div>
                </div>

                {/* موضوع الرسالة (للبريد الإلكتروني فقط) */}
                {newMessage.type === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">الموضوع</Label>
                    <Input
                      id="subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="موضوع الرسالة..."
                    />
                  </div>
                )}

                {/* محتوى الرسالة */}
                <div className="space-y-2">
                  <Label htmlFor="content">المحتوى</Label>
                  <Textarea
                    id="content"
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="اكتب رسالتك هنا..."
                    rows={5}
                  />
                  <div className="text-sm text-gray-500 text-left">
                    {newMessage.content.length} حرف
                  </div>
                </div>

                {/* أزرار الإرسال */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewMessage({ type: 'sms', content: '', subject: '' })}>
                    مسح
                  </Button>
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4 mr-2" />
                    إرسال {messageTypeLabels[newMessage.type]}
                  </Button>
                </div>

                {/* تنبيهات */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">معلومات مهمة</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• الرسائل النصية محدودة بـ 160 حرف</li>
                    <li>• رسائل البريد الإلكتروني قد تستغرق دقائق للوصول</li>
                    <li>• تأكد من صحة بيانات الاتصال قبل الإرسال</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunicationDialog;