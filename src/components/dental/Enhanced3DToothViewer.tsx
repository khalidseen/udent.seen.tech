import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Text, PerspectiveCamera } from '@react-three/drei';
import { Mesh, Vector3, Color } from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  Save, 
  Palette, 
  Plus, 
  Eye, 
  EyeOff,
  Maximize2,
  Settings,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useDentalModel } from '@/hooks/useDentalModel';

interface ToothAnnotation {
  id: string;
  position: [number, number, number];
  color: string;
  title: string;
  description?: string;
  type: 'cavity' | 'restoration' | 'fracture' | 'note';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  visible: boolean;
}

interface Enhanced3DToothViewerProps {
  toothNumber: string;
  patientId: string;
  numberingSystem?: string;
  modelUrl?: string;
  annotations?: ToothAnnotation[];
  onAnnotationAdd?: (annotation: Omit<ToothAnnotation, 'id'>) => void;
  onAnnotationUpdate?: (id: string, annotation: Partial<ToothAnnotation>) => void;
  onAnnotationDelete?: (id: string) => void;
  onSave?: (data: { annotations: ToothAnnotation[]; modelModifications: any }) => void;
  editable?: boolean;
}

// مكونات النماذج الافتراضية للأسنان
const IncisorModel = () => (
  <group>
    {/* تاج القاطعة - مسطح ورفيع */}
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[0.8, 1.2, 0.4]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    {/* جذر القاطعة - طويل ورفيع */}
    <mesh position={[0, -0.8, 0]}>
      <cylinderGeometry args={[0.2, 0.35, 1.6, 8]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
  </group>
);

const CanineModel = () => (
  <group>
    {/* تاج الناب - مدبب */}
    <mesh position={[0, 0.4, 0]}>
      <coneGeometry args={[0.6, 1.4, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    {/* جذر الناب - قوي وطويل */}
    <mesh position={[0, -0.9, 0]}>
      <cylinderGeometry args={[0.25, 0.4, 1.8, 8]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
  </group>
);

const PremolarModel = () => (
  <group>
    {/* تاج الضرس الصغير - له حدبتان */}
    <mesh position={[0, 0.2, 0.15]}>
      <sphereGeometry args={[0.35, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    <mesh position={[0, 0.2, -0.15]}>
      <sphereGeometry args={[0.35, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    {/* جذر الضرس الصغير */}
    <mesh position={[0, -0.6, 0]}>
      <cylinderGeometry args={[0.3, 0.45, 1.6, 8]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
  </group>
);

const MolarModel = () => (
  <group>
    {/* تاج الضرس الكبير - له أربع حدبات */}
    <mesh position={[0.2, 0.2, 0.2]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    <mesh position={[-0.2, 0.2, 0.2]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    <mesh position={[0.2, 0.2, -0.2]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    <mesh position={[-0.2, 0.2, -0.2]}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#f8f9fa" />
    </mesh>
    {/* جذور الضرس الكبير - متعددة */}
    <mesh position={[0.15, -0.7, 0.15]}>
      <cylinderGeometry args={[0.15, 0.25, 1.4, 6]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
    <mesh position={[-0.15, -0.7, 0.15]}>
      <cylinderGeometry args={[0.15, 0.25, 1.4, 6]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
    <mesh position={[0, -0.7, -0.2]}>
      <cylinderGeometry args={[0.15, 0.25, 1.4, 6]} />
      <meshStandardMaterial color="#e9ecef" />
    </mesh>
  </group>
);

// GLB Model Loader Component
const GLBModelLoader = ({ modelUrl, onLoad }: { modelUrl: string; onLoad?: () => void }) => {
  try {
    const { scene } = useGLTF(modelUrl);
    
    useEffect(() => {
      if (scene && onLoad) {
        onLoad();
      }
    }, [scene, onLoad]);

    if (!scene) {
      return (
        <Text
          position={[0, 0, 0]}
          fontSize={0.15}
          color="gray"
          anchorX="center"
          anchorY="middle"
        >
          جاري التحميل...
        </Text>
      );
    }

    return <primitive object={scene.clone()} scale={[1.5, 1.5, 1.5]} position={[0, 0, 0]} />;
  } catch (error) {
    console.error('Error loading GLB model:', error);
    return (
      <Text
        position={[0, 0, 0]}
        fontSize={0.2}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        خطأ في تحميل النموذج
      </Text>
    );
  }
};

// مكون النموذج ثلاثي الأبعاد
const ToothModel: React.FC<{
  toothNumber: string;
  modelUrl?: string;
  annotations: ToothAnnotation[];
  onModelClick: (point: [number, number, number]) => void;
  editable: boolean;
}> = ({ toothNumber, modelUrl, annotations, onModelClick, editable }) => {
  const meshRef = useRef<any>(null);
  const { camera, raycaster, mouse, gl } = useThree();
  
  // تحديد نوع السن بناءً على الرقم
  const getToothType = (toothNum: string) => {
    const num = parseInt(toothNum);
    if ([1, 2, 7, 8, 9, 10, 15, 16, 23, 24, 25, 26, 31, 32].includes(num)) return 'incisor';
    if ([3, 6, 11, 14, 19, 22, 27, 30].includes(num)) return 'canine';
    if ([4, 5, 12, 13, 20, 21, 28, 29].includes(num)) return 'premolar';
    return 'molar';
  };

  // إنشاء نموذج افتراضي واقعي للسن
  const createDefaultToothGeometry = () => {
    const toothType = getToothType(toothNumber);
    
    return (
      <group ref={meshRef}>
        {toothType === 'incisor' && <IncisorModel />}
        {toothType === 'canine' && <CanineModel />}
        {toothType === 'premolar' && <PremolarModel />}
        {toothType === 'molar' && <MolarModel />}
      </group>
    );
  };

  const handleClick = (event: any) => {
    if (!editable) return;
    
    event.stopPropagation();
    
    // تحويل إحداثيات النقر إلى إحداثيات ثلاثية الأبعاد
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    if (meshRef.current) {
      const intersects = raycaster.intersectObject(meshRef.current, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        onModelClick([point.x, point.y, point.z]);
      }
    }
  };

  return (
    <group onClick={handleClick}>
      {/* عرض النموذج المرفوع GLB أو النموذج الافتراضي */}
      {modelUrl ? (
        <GLBModelLoader 
          modelUrl={modelUrl}
          onLoad={() => console.log('GLB model loaded successfully')}
        />
      ) : (
        createDefaultToothGeometry()
      )}
      
      {/* عرض التعليقات */}
      {annotations.map((annotation) => (
        annotation.visible && (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            onClick={() => {/* handle annotation click */}}
          />
        )
      ))}
    </group>
  );
};

// مكون علامة التعليق
const AnnotationMarker: React.FC<{
  annotation: ToothAnnotation;
  onClick: () => void;
}> = ({ annotation, onClick }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
    }
  });

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <group position={annotation.position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial 
          color={new Color(getSeverityColor(annotation.severity))}
          emissive={new Color(getSeverityColor(annotation.severity)).multiplyScalar(0.2)}
        />
      </mesh>
      
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border max-w-xs">
            <h4 className="font-semibold text-sm mb-1">{annotation.title}</h4>
            {annotation.description && (
              <p className="text-xs text-muted-foreground mb-2">{annotation.description}</p>
            )}
            <div className="flex gap-1">
              <Badge variant="secondary" className="text-xs">
                {annotation.type}
              </Badge>
              {annotation.severity && (
                <Badge variant="outline" className="text-xs">
                  {annotation.severity}
                </Badge>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// المكون الرئيسي
export const Enhanced3DToothViewer: React.FC<Enhanced3DToothViewerProps> = ({
  toothNumber,
  patientId,
  numberingSystem = 'universal',
  modelUrl,
  annotations = [],
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onSave,
  editable = true
}) => {
  const [currentAnnotations, setCurrentAnnotations] = useState<ToothAnnotation[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'transparent' | 'wireframe'>('normal');

  // جلب بيانات النموذج الخاص بالسن
  const { data: modelData, isLoading: modelLoading, error: modelError } = useDentalModel({
    patientId,
    toothNumber,
    numberingSystem: numberingSystem || 'universal'
  });

  // تحديد النموذج المستخدم
  const currentModelUrl = modelData?.modelUrl || modelUrl;
  const hasCustomModel = modelData?.type === 'patient' || (modelData?.type === 'default' && modelData?.modelUrl);
  
  // جلب التعليقات من قاعدة البيانات
  const { data: dbAnnotations } = useQuery({
    queryKey: ['tooth-annotations', patientId, toothNumber, numberingSystem],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('tooth_3d_annotations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .eq('numbering_system', numberingSystem);
        
      if (error) throw error;
      
      return data.map(annotation => ({
        id: annotation.id,
        position: [annotation.position_x, annotation.position_y, annotation.position_z] as [number, number, number],
        color: annotation.color,
        title: annotation.title,
        description: annotation.description || undefined,
        type: annotation.annotation_type as 'cavity' | 'restoration' | 'fracture' | 'note',
        severity: annotation.severity as 'low' | 'medium' | 'high' | 'critical' | undefined,
        visible: true
      }));
    },
    enabled: !!patientId
  });

  // دمج التعليقات من قاعدة البيانات مع التعليقات المرسلة
  const finalAnnotations = [...(dbAnnotations || []), ...annotations];

  // تحديث التعليقات المحلية عند تغيير البيانات
  useEffect(() => {
    setCurrentAnnotations(finalAnnotations);
  }, [JSON.stringify(finalAnnotations)]);

  const handleModelClick = async (point: [number, number, number]) => {
    if (isAddingAnnotation) {
      const newAnnotation: Omit<ToothAnnotation, 'id'> = {
        position: point,
        color: '#3b82f6',
        title: 'تعليق جديد',
        description: '',
        type: 'note',
        severity: 'medium',
        visible: true
      };
      
      const annotationWithId = {
        ...newAnnotation,
        id: `annotation-${Date.now()}`
      };
      
      setCurrentAnnotations(prev => [...prev, annotationWithId]);
      onAnnotationAdd?.(newAnnotation);
      
      // حفظ التعليق في قاعدة البيانات
      try {
        const { error } = await supabase
          .from('tooth_3d_annotations')
          .insert({
            patient_id: patientId,
            tooth_number: toothNumber,
            numbering_system: numberingSystem,
            position_x: point[0],
            position_y: point[1],
            position_z: point[2],
            color: newAnnotation.color,
            title: newAnnotation.title,
            description: newAnnotation.description,
            annotation_type: newAnnotation.type,
            severity: newAnnotation.severity,
            status: 'active'
          });

        if (error) throw error;
        
        setIsAddingAnnotation(false);
        toast.success('تم إضافة التعليق وحفظه');
      } catch (error) {
        console.error('Error saving annotation:', error);
        toast.error('تم إضافة التعليق ولكن فشل الحفظ');
        setIsAddingAnnotation(false);
      }
    }
  };

  const toggleAnnotationVisibility = (id: string) => {
    setCurrentAnnotations(prev => 
      prev.map(ann => 
        ann.id === id ? { ...ann, visible: !ann.visible } : ann
      )
    );
  };

  const handleSave = () => {
    onSave?.({
      annotations: currentAnnotations,
      modelModifications: {}
    });
    toast.success('تم حفظ التغييرات');
  };

  const resetView = () => {
    // إعادة تعيين الكاميرا إلى الموضع الافتراضي
    toast.info('تم إعادة تعيين العرض');
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>عارض السن ثلاثي الأبعاد - السن {toothNumber}</span>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {numberingSystem === 'universal' ? 'Universal' : 
               numberingSystem === 'palmer' ? 'Palmer' : 'FDI'}
            </Badge>
            <Badge variant="outline">
              {currentAnnotations.length} تعليق
            </Badge>
            {hasCustomModel && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                نموذج مرفوع
              </Badge>
            )}
            {modelLoading && (
              <Badge variant="secondary">
                جاري التحميل...
              </Badge>
            )}
            {modelError && (
              <Badge variant="destructive">
                خطأ في التحميل
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* شريط الأدوات */}
        {editable && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
              className={isAddingAnnotation ? 'bg-primary text-primary-foreground' : ''}
              disabled={!editable}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة تعليق
            </Button>
            
            {hasCustomModel && currentModelUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = currentModelUrl;
                  link.download = `tooth-${toothNumber}-model.glb`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 ml-2" />
                تحميل النموذج
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={resetView}>
              <RotateCcw className="h-4 w-4 ml-1" />
              إعادة تعيين
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 ml-1" />
              حفظ
            </Button>
          </div>
        )}

        {/* العارض ثلاثي الأبعاد */}
        <div className="flex-1 relative bg-gradient-to-br from-background to-muted/20 rounded-lg overflow-hidden">
          {modelLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">جاري تحميل النموذج...</p>
              </div>
            </div>
          ) : (
            <Canvas className="w-full h-full" camera={{ position: [0, 0, 4], fov: 50 }}>
              <Suspense fallback={
                <Html center>
                  <div className="text-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">جاري تحميل النموذج...</p>
                  </div>
                </Html>
              }>
                {/* إضاءة محسنة لعرض أفضل */}
                <ambientLight intensity={0.6} />
                <directionalLight 
                  position={[5, 5, 5]} 
                  intensity={0.8}
                  castShadow
                />
                <directionalLight 
                  position={[-5, 5, 5]} 
                  intensity={0.4}
                />
                <pointLight position={[0, 0, 2]} intensity={0.3} />
                
                {/* تحكم محسن بالكاميرا */}
                <OrbitControls 
                  target={[0, 0, 0]}
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  enableDamping={true}
                  dampingFactor={0.05}
                  minDistance={1.5}
                  maxDistance={8}
                  minPolarAngle={0}
                  maxPolarAngle={Math.PI}
                  autoRotate={false}
                />
                
                {/* النموذج */}
                <ToothModel
                  toothNumber={toothNumber}
                  modelUrl={currentModelUrl}
                  annotations={currentAnnotations}
                  onModelClick={handleModelClick}
                  editable={editable}
                />
                
                {/* خلفية */}
                <mesh position={[0, 0, -5]}>
                  <planeGeometry args={[20, 20]} />
                  <meshBasicMaterial color="#f8fafc" transparent opacity={0.1} />
                </mesh>
              </Suspense>
            </Canvas>
          )}
          
          {/* رسالة التعليمات */}
          {isAddingAnnotation && (
            <div className="absolute bottom-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
              اضغط على السن لإضافة تعليق
            </div>
          )}
        </div>

        {/* قائمة التعليقات */}
        {currentAnnotations.length > 0 && (
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            <h4 className="text-sm font-medium text-muted-foreground">التعليقات:</h4>
            {currentAnnotations.map((annotation) => (
              <div key={annotation.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: annotation.color }}
                />
                <span className="flex-1">{annotation.title}</span>
                <Badge variant="outline" className="text-xs">
                  {annotation.type}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleAnnotationVisibility(annotation.id)}
                >
                  {annotation.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};