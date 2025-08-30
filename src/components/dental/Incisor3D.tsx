import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Eye, 
  Info,
  Palette,
  Settings
} from 'lucide-react';
import * as THREE from 'three';

// إنشاء هندسة تاج القاطع
const createIncisorCrownGeometry = () => {
  const geometry = new THREE.BufferGeometry();
  
  // نقاط التاج - شكل القاطع المميز
  const vertices = new Float32Array([
    // الوجه الأمامي (شكل مثلثي مع انحناءات)
    0, 1.2, 0.15,     // القمة
    -0.3, 0.8, 0.12,  // الحافة اليسرى العلوية
    0.3, 0.8, 0.12,   // الحافة اليمنى العلوية
    -0.4, 0.4, 0.1,   // الوسط الأيسر
    0.4, 0.4, 0.1,    // الوسط الأيمن
    -0.35, 0, 0.08,   // القاعدة اليسرى
    0.35, 0, 0.08,    // القاعدة اليمنى
    0, 0, 0.1,        // مركز القاعدة
    
    // الوجه الخلفي (أقل سمكاً)
    0, 1.15, -0.1,    // القمة الخلفية
    -0.28, 0.75, -0.08, // الحافة اليسرى الخلفية
    0.28, 0.75, -0.08,  // الحافة اليمنى الخلفية
    -0.38, 0.35, -0.06, // الوسط الأيسر الخلفي
    0.38, 0.35, -0.06,  // الوسط الأيمن الخلفي
    -0.32, -0.05, -0.04, // القاعدة اليسرى الخلفية
    0.32, -0.05, -0.04,  // القاعدة اليمنى الخلفية
    0, -0.05, -0.05,     // مركز القاعدة الخلفية
  ]);

  // إنشاء الوجوه (مثلثات)
  const indices = new Uint16Array([
    // الوجه الأمامي
    0, 1, 2,  // القمة
    1, 3, 2,  // الجزء العلوي الأيسر
    2, 3, 4,  // الجزء العلوي الأيمن
    3, 5, 7,  // الجزء السفلي الأيسر
    4, 7, 6,  // الجزء السفلي الأيمن
    3, 7, 4,  // ربط الوسط
    
    // الوجه الخلفي
    8, 10, 9,  // القمة الخلفية
    9, 10, 11, // الجزء العلوي الأيسر الخلفي
    10, 12, 11, // الجزء العلوي الأيمن الخلفي
    11, 15, 13, // الجزء السفلي الأيسر الخلفي
    12, 14, 15, // الجزء السفلي الأيمن الخلفي
    11, 12, 15, // ربط الوسط الخلفي
    
    // الجوانب - ربط الأمام بالخلف
    0, 8, 1,   1, 8, 9,   // الجانب العلوي الأيسر
    0, 2, 8,   2, 10, 8,  // الجانب العلوي الأيمن
    1, 9, 3,   3, 9, 11,  // الجانب الأيسر
    2, 4, 10,  4, 12, 10, // الجانب الأيمن
    3, 11, 5,  5, 11, 13, // الجانب السفلي الأيسر
    4, 6, 12,  6, 14, 12, // الجانب السفلي الأيمن
    5, 13, 7,  7, 13, 15, // القاعدة اليسرى
    6, 7, 14,  7, 15, 14, // القاعدة اليمنى
  ]);

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  
  return geometry;
};

// إنشاء هندسة جذر القاطع
const createIncisorRootGeometry = () => {
  const geometry = new THREE.ConeGeometry(0.15, 1.5, 12);
  geometry.translate(0, -0.75, 0); // نقل الجذر للأسفل
  return geometry;
};

// مكون السن ثلاثي الأبعاد مبسط
const IncisorMesh = ({ 
  showRoot = true, 
  color = '#f5f5dc', 
  rootColor = '#daa520',
  annotations = true 
}) => {
  const groupRef = useRef();
  const [hovered, setHovered] = useState<string | null>(null);

  useFrame((state) => {
    // دوران بطيء تلقائي
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* تاج السن - شكل مبسط */}
      <mesh
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered('crown')}
        onPointerOut={() => setHovered(null)}
      >
        <boxGeometry args={[0.6, 1, 0.3]} />
        <meshStandardMaterial
          color={hovered === 'crown' ? '#ffffff' : color}
          roughness={0.3}
          metalness={0.1}
        />
        
        {annotations && hovered === 'crown' && (
          <Html position={[0, 0.6, 0]}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
              تاج السن - القاطع
            </div>
          </Html>
        )}
      </mesh>

      {/* جذر السن */}
      {showRoot && (
        <mesh
          position={[0, -0.5, 0]}
          onPointerOver={() => setHovered('root')}
          onPointerOut={() => setHovered(null)}
        >
          <coneGeometry args={[0.2, 1, 8]} />
          <meshStandardMaterial
            color={hovered === 'root' ? '#ffd700' : rootColor}
            roughness={0.6}
          />
          
          {annotations && hovered === 'root' && (
            <Html position={[0, -0.5, 0]}>
              <div className="bg-black/80 text-white px-2 py-1 rounded text-xs">
                جذر السن - أحادي
              </div>
            </Html>
          )}
        </mesh>
      )}

      {/* خط اللثة */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 16]} />
        <meshStandardMaterial 
          color="#ff69b4" 
          transparent 
          opacity={0.7} 
        />
      </mesh>
    </group>
  );
};

// المكون الرئيسي
interface Incisor3DProps {
  toothNumber?: string;
  type?: 'central' | 'lateral';
  position?: 'upper' | 'lower';
  showLabels?: boolean;
  className?: string;
}

const Incisor3D: React.FC<Incisor3DProps> = ({
  toothNumber = "11",
  type = "central",
  position = "upper",
  showLabels = true,
  className = ""
}) => {
  const [viewMode, setViewMode] = useState<'normal' | 'xray' | 'anatomical'>('normal');
  const [showRoot, setShowRoot] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1);

  const resetCamera = () => {
    // إعادة تعيين الكاميرا - سيتم تنفيذها من خلال OrbitControls
  };

  const getToothInfo = () => {
    const info = {
      central: {
        name: "القاطع المركزي",
        description: "أكبر الأسنان الأمامية، يستخدم لقطع الطعام",
        characteristics: ["حافة قطع حادة", "جذر واحد قوي", "تاج عريض"]
      },
      lateral: {
        name: "القاطع الجانبي", 
        description: "أصغر من المركزي، يساعد في القطع والمضغ",
        characteristics: ["أضيق من المركزي", "جذر أقل سمكاً", "شكل مدبب أكثر"]
      }
    };
    
    return info[type];
  };

  const toothInfo = getToothInfo();

  return (
    <div className={`w-full h-full ${className}`}>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">#{toothNumber}</Badge>
                {toothInfo.name} - {position === 'upper' ? 'علوي' : 'سفلي'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {toothInfo.description}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCamera}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRoot(!showRoot)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="3d" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
              <TabsTrigger value="3d">النموذج ثلاثي الأبعاد</TabsTrigger>
              <TabsTrigger value="info">معلومات طبية</TabsTrigger>
              <TabsTrigger value="controls">التحكم</TabsTrigger>
            </TabsList>

            <TabsContent value="3d" className="px-4 pb-4">
              <div className="relative h-96 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg overflow-hidden">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">جاري تحميل النموذج ثلاثي الأبعاد...</p>
                    </div>
                  </div>
                }>
                  <Canvas
                    camera={{ position: [2, 1, 3], fov: 75 }}
                    gl={{ antialias: true }}
                  >
                    {/* الإضاءة */}
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[5, 5, 5]} intensity={0.8} />
                    <pointLight position={[-5, 5, 5]} intensity={0.4} />
                    
                    {/* السن */}
                    <IncisorMesh
                      showRoot={showRoot}
                      color={viewMode === 'xray' ? '#87ceeb' : '#f5f5dc'}
                      rootColor={viewMode === 'xray' ? '#4682b4' : '#daa520'}
                      annotations={showLabels}
                    />
                    
                    {/* تحكم في الكاميرا */}
                    <OrbitControls
                      enablePan={true}
                      enableZoom={true}
                      enableRotate={true}
                      minDistance={1}
                      maxDistance={8}
                      autoRotate={rotationSpeed > 0}
                      autoRotateSpeed={rotationSpeed * 2}
                    />
                  </Canvas>
                </Suspense>
                
                {/* مؤشر وضع العرض */}
                <div className="absolute top-4 right-4">
                  <Badge variant={viewMode === 'xray' ? 'default' : 'secondary'}>
                    {viewMode === 'xray' ? 'وضع الأشعة' : 'وضع طبيعي'}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">خصائص السن:</h4>
                  <ul className="space-y-1">
                    {toothInfo.characteristics.map((char, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">الموقع:</div>
                    <div className="text-muted-foreground">
                      الفك ال{position === 'upper' ? 'علوي' : 'سفلي'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">النوع:</div>
                    <div className="text-muted-foreground">
                      {type === 'central' ? 'مركزي' : 'جانبي'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">رقم السن:</div>
                    <div className="text-muted-foreground">#{toothNumber}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">عدد الجذور:</div>
                    <div className="text-muted-foreground">جذر واحد</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="controls" className="px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">وضع العرض:</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={viewMode === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('normal')}
                    >
                      طبيعي
                    </Button>
                    <Button
                      variant={viewMode === 'xray' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('xray')}
                    >
                      أشعة
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">سرعة الدوران:</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotationSpeed(0)}
                    >
                      إيقاف
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotationSpeed(1)}
                    >
                      بطيء
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRotationSpeed(3)}
                    >
                      سريع
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showRoot}
                    onChange={(e) => setShowRoot(e.target.checked)}
                    id="showRoot"
                  />
                  <label htmlFor="showRoot" className="text-sm">
                    إظهار الجذر
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => {}}
                    id="showLabels"
                  />
                  <label htmlFor="showLabels" className="text-sm">
                    إظهار التسميات
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Incisor3D;
