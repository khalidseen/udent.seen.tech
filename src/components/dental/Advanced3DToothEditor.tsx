import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  TransformControls, 
  useGLTF, 
  Html, 
  Text, 
  PerspectiveCamera,
  Grid,
  Environment,
  ContactShadows,
  Sphere,
  Box,
  Cylinder
} from '@react-three/drei';
import { Vector3, Mesh, Group, Color, MeshStandardMaterial } from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCcw, 
  Save, 
  Download,
  ZoomIn,
  ZoomOut,
  Move3D,
  RotateCw,
  Maximize2,
  Camera,
  Palette,
  Settings,
  Eye,
  EyeOff,
  Grid3X3,
  Sun,
  Moon,
  Target,
  MousePointer,
  Square,
  Circle,
  Minus,
  Plus,
  X,
  Check,
  Undo,
  Redo,
  Copy,
  Scissors,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

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

interface EditorState {
  mode: 'select' | 'rotate' | 'scale' | 'translate' | 'annotate' | 'sculpt';
  selectedObjects: string[];
  history: any[];
  historyIndex: number;
  isModified: boolean;
}

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

interface Advanced3DToothEditorProps {
  toothNumber: string;
  patientId: string;
  modelUrl?: string;
  onSave?: (data: any) => void;
  onExport?: (imageData: string) => void;
}

// مكون التحكم بالنموذج والتحرير
const EditableToothModel = ({ 
  modelUrl, 
  toothNumber, 
  editorState, 
  onModelChange,
  annotations,
  selectedAnnotation,
  onAnnotationClick,
  modelTransform
}: any) => {
  const meshRef = useRef<Group>(null);
  const { camera, raycaster, mouse, gl } = useThree();
  
  // تحميل النموذج
  let scene = null;
  try {
    if (modelUrl) {
      const gltfData = useGLTF(modelUrl);
      scene = Array.isArray(gltfData) ? gltfData[0]?.scene : gltfData?.scene;
    }
  } catch (error) {
    console.warn('Failed to load model:', error);
  }

  // إنشاء نموذج افتراضي للسن
  const DefaultToothModel = () => {
    const getToothType = (num: string) => {
      const toothNum = parseInt(num);
      if ([1, 2, 7, 8, 9, 10, 15, 16, 23, 24, 25, 26, 31, 32].includes(toothNum)) return 'incisor';
      if ([3, 6, 11, 14, 19, 22, 27, 30].includes(toothNum)) return 'canine';
      if ([4, 5, 12, 13, 20, 21, 28, 29].includes(toothNum)) return 'premolar';
      return 'molar';
    };

    const toothType = getToothType(toothNumber);
    
    return (
      <group ref={meshRef}>
        {toothType === 'incisor' && (
          <group>
            <Box args={[0.8, 1.2, 0.4]} position={[0, 0.3, 0]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Box>
            <Cylinder args={[0.2, 0.35, 1.6, 8]} position={[0, -0.8, 0]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
          </group>
        )}
        {toothType === 'canine' && (
          <group>
            <Cylinder args={[0, 0.6, 1.4, 8]} position={[0, 0.4, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Cylinder>
            <Cylinder args={[0.25, 0.4, 1.8, 8]} position={[0, -0.9, 0]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
          </group>
        )}
        {toothType === 'premolar' && (
          <group>
            <Sphere args={[0.35, 8, 8]} position={[0, 0.2, 0.15]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Sphere args={[0.35, 8, 8]} position={[0, 0.2, -0.15]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Cylinder args={[0.3, 0.45, 1.6, 8]} position={[0, -0.6, 0]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
          </group>
        )}
        {toothType === 'molar' && (
          <group>
            <Sphere args={[0.3, 8, 8]} position={[0.2, 0.2, 0.2]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Sphere args={[0.3, 8, 8]} position={[-0.2, 0.2, 0.2]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Sphere args={[0.3, 8, 8]} position={[0.2, 0.2, -0.2]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Sphere args={[0.3, 8, 8]} position={[-0.2, 0.2, -0.2]}>
              <meshStandardMaterial color="#f8f9fa" />
            </Sphere>
            <Cylinder args={[0.15, 0.25, 1.4, 6]} position={[0.15, -0.7, 0.15]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
            <Cylinder args={[0.15, 0.25, 1.4, 6]} position={[-0.15, -0.7, 0.15]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
            <Cylinder args={[0.15, 0.25, 1.4, 6]} position={[0, -0.7, -0.2]}>
              <meshStandardMaterial color="#e9ecef" />
            </Cylinder>
          </group>
        )}
      </group>
    );
  };

  // التعامل مع النقر على النموذج
  const handleClick = (event: any) => {
    if (editorState.mode === 'annotate') {
      event.stopPropagation();
      
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current, true);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          onAnnotationClick?.([point.x, point.y, point.z]);
        }
      }
    }
  };

  // تطبيق التحويلات على النموذج
  useFrame(() => {
    if (meshRef.current && modelTransform) {
      meshRef.current.position.copy(modelTransform.position);
      meshRef.current.rotation.copy(modelTransform.rotation);
      meshRef.current.scale.copy(modelTransform.scale);
    }
  });

  return (
    <group onClick={handleClick}>
      {scene ? (
        <primitive 
          ref={meshRef}
          object={scene.clone()} 
          scale={[1.5, 1.5, 1.5]} 
          position={[0, 0, 0]}
        />
      ) : (
        <DefaultToothModel />
      )}
      
      {/* عرض التعليقات */}
      {annotations?.map((annotation: ToothAnnotation) => (
        annotation.visible && (
          <AnnotationMarker
            key={annotation.id}
            annotation={annotation}
            isSelected={selectedAnnotation === annotation.id}
            onClick={() => onAnnotationClick?.(annotation)}
          />
        )
      ))}
    </group>
  );
};

// مكون علامة التعليق المتطور
const AnnotationMarker = ({ annotation, isSelected, onClick }: any) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = isSelected ? 1.3 : hovered ? 1.1 : 1.0;
      meshRef.current.scale.setScalar(scale + Math.sin(state.clock.elapsedTime * 3) * 0.05);
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
        <sphereGeometry args={[annotation.size || 0.1, 16, 16]} />
        <meshStandardMaterial 
          color={new Color(getSeverityColor(annotation.severity))}
          emissive={new Color(getSeverityColor(annotation.severity)).multiplyScalar(0.3)}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* خط يربط التعليق بالسطح */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1, 4]} />
        <meshBasicMaterial color={getSeverityColor(annotation.severity)} transparent opacity={0.6} />
      </mesh>
      
      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, 0.3, 0]}>
          <div className={`bg-popover text-popover-foreground p-3 rounded-lg shadow-xl border max-w-xs transition-all ${
            isSelected ? 'ring-2 ring-primary' : ''
          }`}>
            <h4 className="font-semibold text-sm mb-1">{annotation.title}</h4>
            {annotation.description && (
              <p className="text-xs text-muted-foreground mb-2">{annotation.description}</p>
            )}
            <div className="flex gap-1 flex-wrap">
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

// المكون الرئيسي للمحرر المتطور
export const Advanced3DToothEditor: React.FC<Advanced3DToothEditorProps> = ({
  toothNumber,
  patientId,
  modelUrl,
  onSave,
  onExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    mode: 'select',
    selectedObjects: [],
    history: [],
    historyIndex: -1,
    isModified: false
  });

  const [cameraState, setCameraState] = useState<CameraState>({
    position: [3, 3, 3],
    target: [0, 0, 0],
    zoom: 1
  });

  const [modelTransform, setModelTransform] = useState({
    position: new Vector3(0, 0, 0),
    rotation: new Vector3(0, 0, 0),
    scale: new Vector3(1, 1, 1)
  });

  const [annotations, setAnnotations] = useState<ToothAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [environmentPreset, setEnvironmentPreset] = useState<'studio' | 'sunset' | 'dawn' | 'night'>('studio');

  // أدوات التحرير
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [symmetryMode, setSymmetryMode] = useState(false);

  // إعدادات الكاميرا
  const resetCamera = useCallback(() => {
    setCameraState({
      position: [3, 3, 3],
      target: [0, 0, 0],
      zoom: 1
    });
  }, []);

  const focusOnModel = useCallback(() => {
    setCameraState(prev => ({
      ...prev,
      target: [0, 0, 0],
      position: [2, 2, 2]
    }));
  }, []);

  // إدارة التعليقات
  const addAnnotation = useCallback((position: [number, number, number]) => {
    const newAnnotation: ToothAnnotation = {
      id: `annotation-${Date.now()}`,
      position,
      color: '#3b82f6',
      title: 'تعليق جديد',
      description: 'اضغط للتحرير',
      type: 'note',
      severity: 'medium',
      visible: true,
      size: 0.1
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
    setSelectedAnnotation(newAnnotation.id);
    toast.success('تم إضافة تعليق جديد');
  }, []);

  // حفظ الصورة
  const saveScreenshot = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = await html2canvas(canvasRef.current.parentElement!, {
        backgroundColor: backgroundColor,
        allowTaint: true,
        useCORS: true
      });
      
      const imageData = canvas.toDataURL('image/png');
      
      // تحميل الصورة
      const link = document.createElement('a');
      link.download = `tooth-${toothNumber}-${Date.now()}.png`;
      link.href = imageData;
      link.click();
      
      onExport?.(imageData);
      toast.success('تم حفظ الصورة بنجاح');
    } catch (error) {
      console.error('Error saving screenshot:', error);
      toast.error('فشل في حفظ الصورة');
    }
  }, [toothNumber, backgroundColor, onExport]);

  // حفظ النموذج
  const saveModel = useCallback(() => {
    const modelData = {
      toothNumber,
      patientId,
      transform: {
        position: modelTransform.position.toArray(),
        rotation: modelTransform.rotation.toArray(),
        scale: modelTransform.scale.toArray()
      },
      annotations: annotations,
      metadata: {
        savedAt: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    onSave?.(modelData);
    setEditorState(prev => ({ ...prev, isModified: false }));
    toast.success('تم حفظ النموذج بنجاح');
  }, [toothNumber, patientId, modelTransform, annotations, onSave]);

  return (
    <Card className="w-full h-[800px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            محرر الأسنان ثلاثي الأبعاد المتطور - السن {toothNumber}
          </span>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {editorState.mode}
            </Badge>
            <Badge variant="outline">
              {annotations.length} تعليق
            </Badge>
            {editorState.isModified && (
              <Badge variant="destructive">
                غير محفوظ
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex gap-4">
        {/* لوحة الأدوات الجانبية */}
        <div className="w-80 space-y-4 overflow-y-auto">
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">أدوات</TabsTrigger>
              <TabsTrigger value="view">عرض</TabsTrigger>
              <TabsTrigger value="export">تصدير</TabsTrigger>
            </TabsList>

            {/* تبويب الأدوات */}
            <TabsContent value="tools" className="space-y-4">
              {/* أدوات التحديد والتحرير */}
              <div className="space-y-2">
                <Label>أدوات التحرير</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={editorState.mode === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, mode: 'select' }))}
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editorState.mode === 'rotate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, mode: 'rotate' }))}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editorState.mode === 'scale' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, mode: 'scale' }))}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={editorState.mode === 'translate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, mode: 'translate' }))}
                  >
                    <Move3D className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* أدوات التعليق */}
              <div className="space-y-2">
                <Label>أدوات التعليق</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={editorState.mode === 'annotate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorState(prev => ({ ...prev, mode: 'annotate' }))}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedAnnotation) {
                        setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotation));
                        setSelectedAnnotation(null);
                      }
                    }}
                    disabled={!selectedAnnotation}
                  >
                    <X className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </div>

              {/* تحكم في الحجم والموضع */}
              <div className="space-y-3">
                <Label>التحكم في النموذج</Label>
                
                <div className="space-y-2">
                  <Label className="text-xs">الحجم</Label>
                  <Slider
                    value={[modelTransform.scale.x]}
                    onValueChange={([value]) => {
                      setModelTransform(prev => ({
                        ...prev,
                        scale: new Vector3(value, value, value)
                      }));
                    }}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X</Label>
                    <Input
                      type="number"
                      value={modelTransform.position.x.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelTransform(prev => ({
                          ...prev,
                          position: new Vector3(value, prev.position.y, prev.position.z)
                        }));
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y</Label>
                    <Input
                      type="number"
                      value={modelTransform.position.y.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelTransform(prev => ({
                          ...prev,
                          position: new Vector3(prev.position.x, value, prev.position.z)
                        }));
                      }}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Z</Label>
                    <Input
                      type="number"
                      value={modelTransform.position.z.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setModelTransform(prev => ({
                          ...prev,
                          position: new Vector3(prev.position.x, prev.position.y, value)
                        }));
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* تبويب العرض */}
            <TabsContent value="view" className="space-y-4">
              {/* تحكم في الكاميرا */}
              <div className="space-y-2">
                <Label>تحكم الكاميرا</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={resetCamera}>
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين
                  </Button>
                  <Button size="sm" variant="outline" onClick={focusOnModel}>
                    <Target className="h-4 w-4" />
                    التركيز
                  </Button>
                </div>
              </div>

              {/* إعدادات الإضاءة */}
              <div className="space-y-2">
                <Label>الإضاءة</Label>
                <Slider
                  value={[lightIntensity]}
                  onValueChange={([value]) => setLightIntensity(value)}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* البيئة */}
              <div className="space-y-2">
                <Label>البيئة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={environmentPreset === 'studio' ? 'default' : 'outline'}
                    onClick={() => setEnvironmentPreset('studio')}
                  >
                    استوديو
                  </Button>
                  <Button
                    size="sm"
                    variant={environmentPreset === 'sunset' ? 'default' : 'outline'}
                    onClick={() => setEnvironmentPreset('sunset')}
                  >
                    غروب
                  </Button>
                </div>
              </div>

              {/* إعدادات أخرى */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">إظهار الشبكة</Label>
                  <Button
                    size="sm"
                    variant={showGrid ? 'default' : 'outline'}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* تبويب التصدير */}
            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2">
                <Label>خيارات الحفظ والتصدير</Label>
                
                <Button onClick={saveScreenshot} className="w-full" variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  حفظ صورة
                </Button>
                
                <Button onClick={saveModel} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  حفظ النموذج
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  تصدير GLB
                </Button>
              </div>

              {/* معلومات النموذج */}
              <div className="space-y-2">
                <Label>معلومات النموذج</Label>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>السن: {toothNumber}</div>
                  <div>التعليقات: {annotations.length}</div>
                  <div>الحالة: {editorState.isModified ? 'معدل' : 'محفوظ'}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* منطقة العرض ثلاثي الأبعاد */}
        <div className="flex-1 relative bg-gradient-to-br from-background to-muted/20 rounded-lg overflow-hidden">
          <Canvas
            ref={canvasRef}
            camera={{ position: cameraState.position, fov: 45 }}
            style={{ background: backgroundColor }}
          >
            <Suspense fallback={
              <Html center>
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                </div>
              </Html>
            }>
              {/* الإضاءة المتطورة */}
              <ambientLight intensity={0.4} />
              <directionalLight 
                position={[10, 10, 5]} 
                intensity={lightIntensity}
                castShadow
                shadow-mapSize={[2048, 2048]}
              />
              <directionalLight 
                position={[-5, 5, 5]} 
                intensity={lightIntensity * 0.5}
              />
              <pointLight position={[0, 2, 2]} intensity={lightIntensity * 0.3} />

              {/* البيئة */}
              <Environment preset={environmentPreset} />
              
              {/* الشبكة */}
              {showGrid && (
                <Grid 
                  args={[10, 10]} 
                  position={[0, -2, 0]}
                  cellSize={0.5}
                  cellThickness={0.5}
                  cellColor="#666666"
                  sectionSize={2}
                  sectionThickness={1}
                  sectionColor="#999999"
                  fadeDistance={8}
                  fadeStrength={1}
                />
              )}

              {/* الظلال */}
              <ContactShadows 
                position={[0, -2, 0]} 
                opacity={0.3} 
                scale={5} 
                blur={2} 
                far={4} 
              />
              
              {/* النموذج القابل للتحرير */}
              <EditableToothModel
                modelUrl={modelUrl}
                toothNumber={toothNumber}
                editorState={editorState}
                onModelChange={(data: any) => setEditorState(prev => ({ ...prev, isModified: true }))}
                annotations={annotations}
                selectedAnnotation={selectedAnnotation}
                onAnnotationClick={editorState.mode === 'annotate' ? addAnnotation : setSelectedAnnotation}
                modelTransform={modelTransform}
              />

              {/* أدوات التحكم */}
              <OrbitControls 
                target={cameraState.target}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                enableDamping={true}
                dampingFactor={0.05}
                minDistance={1}
                maxDistance={10}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
                autoRotate={false}
                makeDefault
              />

              {/* أدوات التحويل */}
              {editorState.mode !== 'select' && editorState.mode !== 'annotate' && (
                <TransformControls
                  mode={transformMode}
                  showX={true}
                  showY={true}
                  showZ={true}
                  size={1}
                  space="local"
                />
              )}
            </Suspense>
          </Canvas>

          {/* مؤشرات الحالة */}
          <div className="absolute top-4 left-4 space-y-2">
            <Badge variant="secondary" className="bg-black/20 text-white">
              الوضع: {editorState.mode}
            </Badge>
            {editorState.mode === 'annotate' && (
              <Badge variant="default" className="bg-primary/80">
                اضغط على السن لإضافة تعليق
              </Badge>
            )}
          </div>

          {/* أزرار سريعة */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" onClick={resetCamera}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={focusOnModel}>
              <Target className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={saveScreenshot}>
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};