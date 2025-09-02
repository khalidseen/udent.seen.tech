import React from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { DentalModelsManager } from '@/components/dental/DentalModelsManager';
import { Upload, Package, Settings } from 'lucide-react';

const DentalModelsAdmin = () => {
  return (
    <PageContainer>
      <PageHeader
        title="إدارة النماذج ثلاثية الأبعاد"
        description="إدارة نماذج الأسنان الافتراضية والمخصصة للمرضى"
      />
      
      <div className="space-y-6">
        <DentalModelsManager />
      </div>
    </PageContainer>
  );
};

export default DentalModelsAdmin;