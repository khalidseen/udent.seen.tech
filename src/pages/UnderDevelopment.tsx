import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Clock, Mail, Phone } from 'lucide-react';

export function UnderDevelopment() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full mx-auto shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Construction className="w-12 h-12 text-orange-600 dark:text-orange-400 animate-bounce" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            🚧 تحت التطوير
          </CardTitle>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            نعمل بجد لإنجاز هذه الميزة الرائعة
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">الحالة الحالية</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              نقوم حالياً بتطوير هذه الميزة لتوفير أفضل تجربة ممكنة. 
              نتطلع إلى إطلاقها قريباً مع مميزات متقدمة ومحسّنة.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">ما يمكنك فعله الآن:</h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• استخدام الميزات المتاحة حالياً</li>
                <li>• التحقق من التحديثات المستقبلية</li>
                <li>• إرسال اقتراحاتك لنا</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">تواصل معنا:</h4>
              <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>support@udent.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+966 12 345 6789</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              شكراً لصبركم وثقتكم في نظام Udent
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
