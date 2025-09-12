import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Html, 
  Text, 
  PerspectiveCamera,
  Environment,
  ContactShadows,
  useTexture,
  Sphere,
  Box,
  Cylinder,
  Cone
} from '@react-three/drei';
import { Mesh, Vector3, Color, Group } from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RotateCcw, 
  Save, 
  Download,
  Upload,
  Palette, 
  Plus, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Camera,
  Sun,
  Lightbulb,
  Move3D,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Layers,
  Info,
  Edit,
  Trash2,
  BookOpen,
  Target,
  Crosshair,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';

interface FullScreenToothEditorProps {
  toothNumber: string;
  patientId: string;
  numberingSystem?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

interface ToothAnnotation {
  id: string;
  position: [number, number, number];
  color: string;
  title: string;
  description?: string;
  type: 'cavity' | 'restoration' | 'fracture' | 'note' | 'measurement';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  visible: boolean;
  size?: number;
}

// مكونات النماذج الافتراضية المتطورة
const AdvancedIncisorModel = ({ wireframe = false, opacity = 1 }: { wireframe?: boolean; opacity?: number }) => (
  <group>
    {/* تاج القاطعة المتطور */}
    <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.8, 1.4, 0.5]} />
      <meshPhysicalMaterial 
        color="#f8f9fa" 
        wireframe={wireframe}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.1}
        metalness={0.1}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </mesh>
    {/* حواف حادة للقطع */}
    <mesh position={[0, 0.8, 0]}>
      <boxGeometry args={[0.7, 0.2, 0.1]} />
      <meshPhysicalMaterial color="#ffffff" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {/* جذر القاطعة */}
    <mesh position={[0, -0.9, 0]}>
      <cylinderGeometry args={[0.2, 0.38, 1.8, 12]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  </group>
);

const AdvancedCanineModel = ({ wireframe = false, opacity = 1 }: { wireframe?: boolean; opacity?: number }) => (
  <group>
    {/* تاج الناب المدبب */}
    <mesh position={[0, 0.5, 0]}>
      <coneGeometry args={[0.7, 1.6, 12]} />
      <meshPhysicalMaterial 
        color="#f8f9fa" 
        wireframe={wireframe}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={0.1}
        metalness={0.05}
        clearcoat={0.9}
      />
    </mesh>
    {/* نقطة حادة للتمزيق */}
    <mesh position={[0, 1.1, 0]}>
      <coneGeometry args={[0.3, 0.4, 8]} />
      <meshPhysicalMaterial color="#ffffff" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {/* جذر قوي */}
    <mesh position={[0, -1.0, 0]}>
      <cylinderGeometry args={[0.25, 0.45, 2.0, 12]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  </group>
);

const AdvancedPremolarModel = ({ wireframe = false, opacity = 1 }: { wireframe?: boolean; opacity?: number }) => (
  <group>
    {/* حدبتان واضحتان */}
    <mesh position={[0.2, 0.3, 0]}>
      <sphereGeometry args={[0.4, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[-0.2, 0.3, 0]}>
      <sphereGeometry args={[0.4, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {/* أخدود بين الحدبات */}
    <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
      <meshPhysicalMaterial color="#e0e0e0" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    {/* جذر واحد أو مقسم */}
    <mesh position={[0, -0.7, 0]}>
      <cylinderGeometry args={[0.3, 0.5, 1.8, 12]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  </group>
);

const AdvancedMolarModel = ({ wireframe = false, opacity = 1 }: { wireframe?: boolean; opacity?: number }) => (
  <group>
    {/* أربع حدبات مفصلة */}
    <mesh position={[0.25, 0.3, 0.25]}>
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[-0.25, 0.3, 0.25]}>
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[0.25, 0.3, -0.25]}>
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[-0.25, 0.3, -0.25]}>
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshPhysicalMaterial color="#f8f9fa" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    
    {/* أخاديد وشقوق السطح */}
    <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.1, 0.1, 0.8]} />
      <meshPhysicalMaterial color="#d0d0d0" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[0, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
      <boxGeometry args={[0.1, 0.1, 0.8]} />
      <meshPhysicalMaterial color="#d0d0d0" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    
    {/* جذور متعددة */}
    <mesh position={[0.2, -0.8, 0.2]}>
      <cylinderGeometry args={[0.18, 0.28, 1.6, 10]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[-0.2, -0.8, 0.2]}>
      <cylinderGeometry args={[0.18, 0.28, 1.6, 10]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
    <mesh position={[0, -0.8, -0.25]}>
      <cylinderGeometry args={[0.18, 0.28, 1.6, 10]} />
      <meshPhysicalMaterial color="#e9ecef" wireframe={wireframe} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  </group>
);

// مكون التحكم في الكاميرا المتطور
const CameraController = ({ 
  target, 
  position, 
  autoRotate = false, 
  enableZoom = true, 
  enablePan = true,
  maxDistance = 10,
  minDistance = 1
}: {
  target: [number, number, number];
  position: [number, number, number];
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  maxDistance?: number;
  minDistance?: number;
}) => {
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
      controlsRef.current.update();
    }
  }, [target]);

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enableZoom={enableZoom}
      enablePan={enablePan}
      maxDistance={maxDistance}
      minDistance={minDistance}
      dampingFactor={0.1}
      enableDamping
    />
  );
};

// مكون علامة التعليق المتطور
const AdvancedAnnotationMarker = ({ 
  annotation, 
  onClick, 
  onEdit, 
  onDelete,
  selected = false 
}: {
  annotation: ToothAnnotation;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
}) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      if (selected) {
        meshRef.current.scale.setScalar(1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
      } else {
        meshRef.current.scale.setScalar(annotation.size || 1);
      }
    }
  });

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#059669';
      default: return '#2563eb';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cavity': return '🦷';
      case 'restoration': return '⚪';
      case 'fracture': return '💥';
      case 'measurement': return '📏';
      default: return '📝';
    }
  };

  return (
    <group position={annotation.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial 
          color={new Color(getSeverityColor(annotation.severity))}
          emissive={new Color(getSeverityColor(annotation.severity)).multiplyScalar(0.3)}
          transparent
          opacity={selected ? 0.9 : 0.8}
        />
      </mesh>
      
      {/* خط يربط التعليق بسطح السن */}
      <mesh position={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshStandardMaterial color={getSeverityColor(annotation.severity)} />
      </mesh>
      
      {(hovered || selected) && (
        <Html distanceFactor={8} center>
          <div className="bg-background/95 backdrop-blur-sm text-foreground p-4 rounded-xl shadow-2xl border max-w-sm min-w-[280px]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getTypeIcon(annotation.type)}</span>
                <h4 className="font-bold text-base">{annotation.title}</h4>
              </div>
              {selected && (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={onEdit}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {annotation.description && (
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {annotation.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {annotation.type}
              </Badge>
              {annotation.severity && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: getSeverityColor(annotation.severity),
                    color: getSeverityColor(annotation.severity)
                  }}
                >
                  {annotation.severity}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {annotation.position.map(p => p.toFixed(2)).join(', ')}
              </Badge>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// مكون النموذج الرئيسي
const MainToothModel = ({
  toothNumber,
  modelUrl,
  annotations,
  onModelClick,
  viewMode,
  opacity = 1
}: {
  toothNumber: string;
  modelUrl?: string;
  annotations: ToothAnnotation[];
  onModelClick: (point: [number, number, number]) => void;
  viewMode: 'normal' | 'transparent' | 'wireframe' | 'xray';
  opacity?: number;
}) => {
  const meshRef = useRef<Group>(null);
  const { camera, raycaster, mouse, gl } = useThree();
  
  const getToothType = (toothNum: string) => {
    const num = parseInt(toothNum);
    if ([1, 2, 7, 8, 9, 10, 15, 16, 23, 24, 25, 26, 31, 32].includes(num)) return 'incisor';
    if ([3, 6, 11, 14, 19, 22, 27, 30].includes(num)) return 'canine';
    if ([4, 5, 12, 13, 20, 21, 28, 29].includes(num)) return 'premolar';
    return 'molar';
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    
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

  const renderToothModel = () => {
    const toothType = getToothType(toothNumber);
    const wireframe = viewMode === 'wireframe';
    const modelOpacity = viewMode === 'transparent' ? 0.3 : viewMode === 'xray' ? 0.1 : opacity;
    
    return (
      <group ref={meshRef} onClick={handleClick}>
        {toothType === 'incisor' && <AdvancedIncisorModel wireframe={wireframe} opacity={modelOpacity} />}
        {toothType === 'canine' && <AdvancedCanineModel wireframe={wireframe} opacity={modelOpacity} />}
        {toothType === 'premolar' && <AdvancedPremolarModel wireframe={wireframe} opacity={modelOpacity} />}
        {toothType === 'molar' && <AdvancedMolarModel wireframe={wireframe} opacity={modelOpacity} />}
      </group>
    );
  };

  return (
    <group>
      {modelUrl ? (
        <Suspense fallback={<Text position={[0, 0, 0]} fontSize={0.2} color="gray">جاري التحميل...</Text>}>
          {/* يمكن إضافة GLB loader هنا */}
          {renderToothModel()}
        </Suspense>
      ) : (
        renderToothModel()
      )}
    </group>
  );
};

// المكون الرئيسي
export const FullScreenToothEditor: React.FC<FullScreenToothEditorProps> = ({
  toothNumber,
  patientId,
  numberingSystem = 'universal',
  onClose,
  onSave
}) => {
  const [annotations, setAnnotations] = useState<ToothAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'transparent' | 'wireframe' | 'xray'>('normal');
  const [lightingMode, setLightingMode] = useState<'studio' | 'dental' | 'xray' | 'custom'>('dental');
  const [cameraSettings, setCameraSettings] = useState({
    autoRotate: false,
    position: [3, 2, 3] as [number, number, number],
    target: [0, 0, 0] as [number, number, number]
  });
  const [editingAnnotation, setEditingAnnotation] = useState<ToothAnnotation | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // جلب التعليقات
  const { data: dbAnnotations, refetch } = useQuery({
    queryKey: ['tooth-annotations', patientId, toothNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tooth_3d_annotations')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber);
        
      if (error) throw error;
      
      return data.map(annotation => ({
        id: annotation.id,
        position: [annotation.position_x, annotation.position_y, annotation.position_z] as [number, number, number],
        color: annotation.color,
        title: annotation.title,
        description: annotation.description || undefined,
        type: annotation.annotation_type as ToothAnnotation['type'],
        severity: annotation.severity as ToothAnnotation['severity'],
        visible: true,
        size: 1
      }));
    },
    enabled: !!patientId
  });

  useEffect(() => {
    if (dbAnnotations) {
      setAnnotations(dbAnnotations);
    }
  }, [dbAnnotations]);

  const handleModelClick = async (point: [number, number, number]) => {
    if (!isAddingAnnotation) return;

    const newAnnotation: ToothAnnotation = {
      id: `annotation-${Date.now()}`,
      position: point,
      color: '#3b82f6',
      title: 'تعليق جديد',
      description: '',
      type: 'note',
      severity: 'medium',
      visible: true,
      size: 1
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setEditingAnnotation(newAnnotation);
    setIsAddingAnnotation(false);

    // حفظ في قاعدة البيانات
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

      if (!error) {
        await refetch();
        toast.success('تم إضافة التعليق بنجاح');
      }
    } catch (error) {
      console.error('Error saving annotation:', error);
      toast.error('فشل في حفظ التعليق');
    }
  };

  const handleAnnotationEdit = (annotation: ToothAnnotation) => {
    setEditingAnnotation(annotation);
  };

  const handleAnnotationDelete = async (annotationId: string) => {
    try {
      const { error } = await supabase
        .from('tooth_3d_annotations')
        .delete()
        .eq('id', annotationId);

      if (!error) {
        setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
        toast.success('تم حذف التعليق');
      }
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast.error('فشل في حذف التعليق');
    }
  };

  const handleSaveAnnotation = async (updatedAnnotation: ToothAnnotation) => {
    try {
      const { error } = await supabase
        .from('tooth_3d_annotations')
        .update({
          title: updatedAnnotation.title,
          description: updatedAnnotation.description,
          annotation_type: updatedAnnotation.type,
          severity: updatedAnnotation.severity,
          color: updatedAnnotation.color
        })
        .eq('id', updatedAnnotation.id);

      if (!error) {
        setAnnotations(prev => 
          prev.map(ann => ann.id === updatedAnnotation.id ? updatedAnnotation : ann)
        );
        setEditingAnnotation(null);
        toast.success('تم تحديث التعليق');
      }
    } catch (error) {
      console.error('Error updating annotation:', error);
      toast.error('فشل في تحديث التعليق');
    }
  };

  const handleExportImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `tooth-${toothNumber}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('تم تصدير الصورة بنجاح');
    } catch (error) {
      console.error('Error exporting image:', error);
      toast.error('فشل في تصدير الصورة');
    }
  };

  const resetView = () => {
    setCameraSettings({
      autoRotate: false,
      position: [3, 2, 3],
      target: [0, 0, 0]
    });
    toast.success('تم إعادة تعيين العرض');
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* شريط الأدوات العلوي */}
      <div className="bg-card/90 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 ml-2" />
            إغلاق
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <h1 className="text-xl font-bold">محرر السن ثلاثي الأبعاد - السن {toothNumber}</h1>
          <Badge variant="secondary">{annotations.length} تعليق</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportImage}>
            <Camera className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onSave?.({ annotations })}>
            <Save className="h-4 w-4 ml-2" />
            حفظ
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* اللوحة اليسرى - أدوات التحكم */}
        <div className="w-80 bg-card/50 backdrop-blur-sm border-r p-4 overflow-y-auto">
          <Tabs defaultValue="annotations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="annotations">التعليقات</TabsTrigger>
              <TabsTrigger value="view">العرض</TabsTrigger>
              <TabsTrigger value="lighting">الإضاءة</TabsTrigger>
            </TabsList>

            <TabsContent value="annotations" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إدارة التعليقات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                    variant={isAddingAnnotation ? "default" : "outline"}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    {isAddingAnnotation ? 'انقر على السن' : 'إضافة تعليق'}
                  </Button>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAnnotation === annotation.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => setSelectedAnnotation(
                          selectedAnnotation === annotation.id ? null : annotation.id
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{annotation.title}</span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnnotationEdit(annotation);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnnotations(prev => 
                                  prev.map(ann => 
                                    ann.id === annotation.id 
                                      ? { ...ann, visible: !ann.visible }
                                      : ann
                                  )
                                );
                              }}
                            >
                              {annotation.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {annotation.type} - {annotation.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="view" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">وضع العرض</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(['normal', 'transparent', 'wireframe', 'xray'] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant={viewMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode(mode)}
                      >
                        {mode === 'normal' && 'عادي'}
                        {mode === 'transparent' && 'شفاف'}
                        {mode === 'wireframe' && 'هيكلي'}
                        {mode === 'xray' && 'أشعة'}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cameraSettings.autoRotate}
                        onChange={(e) => setCameraSettings(prev => ({
                          ...prev,
                          autoRotate: e.target.checked
                        }))}
                      />
                      دوران تلقائي
                    </Label>
                    
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox" 
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                      />
                      إظهار الشبكة
                    </Label>
                    
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showMeasurements}
                        onChange={(e) => setShowMeasurements(e.target.checked)}
                      />
                      إظهار القياسات
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lighting" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">الإضاءة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {(['studio', 'dental', 'xray', 'custom'] as const).map((mode) => (
                      <Button
                        key={mode}
                        variant={lightingMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLightingMode(mode)}
                      >
                        {mode === 'studio' && 'استوديو'}
                        {mode === 'dental' && 'طبي'}
                        {mode === 'xray' && 'أشعة'}
                        {mode === 'custom' && 'مخصص'}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* منطقة العرض الرئيسية */}
        <div className="flex-1 relative" ref={canvasRef}>
          <Canvas
            camera={{ position: cameraSettings.position, fov: 50 }}
            style={{ background: viewMode === 'xray' ? '#000000' : '#f8fafc' }}
          >
            {/* الإضاءة */}
            <ambientLight intensity={lightingMode === 'xray' ? 0.1 : 0.4} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={lightingMode === 'dental' ? 1.5 : 1} 
              castShadow
            />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            
            {/* البيئة */}
            {lightingMode === 'studio' && <Environment preset="studio" />}
            {lightingMode === 'dental' && <Environment preset="city" />}
            
            {/* الشبكة */}
            {showGrid && (
              <gridHelper args={[10, 10, '#cccccc', '#eeeeee']} />
            )}
            
            {/* الظلال */}
            <ContactShadows opacity={0.4} scale={10} blur={1} far={10} resolution={256} color="#000000" />
            
            {/* النموذج الرئيسي */}
            <MainToothModel
              toothNumber={toothNumber}
              annotations={annotations.filter(ann => ann.visible)}
              onModelClick={handleModelClick}
              viewMode={viewMode}
            />
            
            {/* التعليقات */}
            {annotations
              .filter(ann => ann.visible)
              .map((annotation) => (
                <AdvancedAnnotationMarker
                  key={annotation.id}
                  annotation={annotation}
                  onClick={() => setSelectedAnnotation(annotation.id)}
                  onEdit={() => handleAnnotationEdit(annotation)}
                  onDelete={() => handleAnnotationDelete(annotation.id)}
                  selected={selectedAnnotation === annotation.id}
                />
              ))
            }
            
            {/* التحكم في الكاميرا */}
            <CameraController
              target={cameraSettings.target}
              position={cameraSettings.position}
              autoRotate={cameraSettings.autoRotate}
            />
          </Canvas>
          
          {/* رسائل المساعدة */}
          {isAddingAnnotation && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                انقر على السن لإضافة تعليق
              </div>
            </div>
          )}
        </div>
      </div>

      {/* حوار تحرير التعليق */}
      <Dialog open={!!editingAnnotation} onOpenChange={() => setEditingAnnotation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحرير التعليق</DialogTitle>
          </DialogHeader>
          
          {editingAnnotation && (
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={editingAnnotation.title}
                  onChange={(e) => setEditingAnnotation({
                    ...editingAnnotation,
                    title: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={editingAnnotation.description || ''}
                  onChange={(e) => setEditingAnnotation({
                    ...editingAnnotation,
                    description: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label>النوع</Label>
                <Select
                  value={editingAnnotation.type}
                  onValueChange={(value) => setEditingAnnotation({
                    ...editingAnnotation,
                    type: value as ToothAnnotation['type']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cavity">تسوس</SelectItem>
                    <SelectItem value="restoration">ترميم</SelectItem>
                    <SelectItem value="fracture">كسر</SelectItem>
                    <SelectItem value="note">ملاحظة</SelectItem>
                    <SelectItem value="measurement">قياس</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>الخطورة</Label>
                <Select
                  value={editingAnnotation.severity}
                  onValueChange={(value) => setEditingAnnotation({
                    ...editingAnnotation,
                    severity: value as ToothAnnotation['severity']
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="critical">حرجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => handleSaveAnnotation(editingAnnotation)}>
                  حفظ
                </Button>
                <Button variant="outline" onClick={() => setEditingAnnotation(null)}>
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleAnnotationDelete(editingAnnotation.id);
                    setEditingAnnotation(null);
                  }}
                >
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FullScreenToothEditor;