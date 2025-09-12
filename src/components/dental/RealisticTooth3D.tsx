
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ToothAnnotation {
  id: string;
  position: [number, number, number];
  color: string;
  title: string;
  description: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
}

interface RealisticTooth3DProps {
  toothNumber: string;
  annotations?: ToothAnnotation[];
  onToothClick?: () => void;
  onAddAnnotation?: (position: [number, number, number]) => void;
  selectedAnnotation?: ToothAnnotation | null;
  interactionMode?: 'view' | 'annotate';
}

// Create realistic canine tooth geometry
function createCanineGeometry() {
  const geometry = new THREE.ConeGeometry(0.4, 1.8, 8);
  const positions = geometry.attributes.position.array as Float32Array;
  
  // Modify vertices to create more realistic canine shape
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    
    // Create pointed tip and curved sides typical of canine teeth
    const heightFactor = (y + 0.9) / 1.8;
    const curveFactor = Math.pow(heightFactor, 2);
    
    // Make the tooth more pointed at the tip
    positions[i] = x * (0.3 + 0.7 * curveFactor);
    positions[i + 2] = z * (0.3 + 0.7 * curveFactor);
    
    // Add slight curve to make it more natural
    positions[i] += Math.sin(y * 2) * 0.05;
    positions[i + 2] += Math.cos(y * 2) * 0.03;
  }
  
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create tooth root geometry
function createRootGeometry() {
  const geometry = new THREE.CylinderGeometry(0.25, 0.15, 1.2, 8);
  const positions = geometry.attributes.position.array as Float32Array;
  
  // Make root more tapered and realistic
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const factor = (y + 0.6) / 1.2;
    
    positions[i] *= (0.5 + 0.5 * factor);
    positions[i + 2] *= (0.5 + 0.5 * factor);
  }
  
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  
  return geometry;
}

function RealisticToothMesh({ 
  toothNumber, 
  annotations = [], 
  onToothClick, 
  onAddAnnotation, 
  selectedAnnotation,
  interactionMode = 'view' 
}: RealisticTooth3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Create realistic tooth geometries
  const crownGeometry = useMemo(() => createCanineGeometry(), []);
  const rootGeometry = useMemo(() => createRootGeometry(), []);
  
  // Animation for subtle movement
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
      meshRef.current.position.y = Math.sin(time * 1.5) * 0.01;
    }
  });
  
  const handleClick = (event: any) => {
    event.stopPropagation();
    
    if (interactionMode === 'annotate' && onAddAnnotation) {
      const intersectionPoint = event.point;
      onAddAnnotation([intersectionPoint.x, intersectionPoint.y, intersectionPoint.z]);
    } else if (onToothClick) {
      onToothClick();
    }
  };
  
  return (
    <group ref={meshRef}>
      {/* Tooth Crown */}
      <mesh 
        geometry={crownGeometry}
        onClick={handleClick}
        position={[0, 0.3, 0]}
        castShadow
        receiveShadow
      >
        <meshPhongMaterial 
          color={0xfffff0} // Ivory white
          shininess={30}
          transparent={true}
          opacity={0.98}
        />
      </mesh>
      
      {/* Tooth Root */}
      <mesh 
        geometry={rootGeometry}
        onClick={handleClick}
        position={[0, -0.9, 0]}
        castShadow
        receiveShadow
      >
        <meshPhongMaterial 
          color={0xfff8dc} // Slightly more yellow for root
          shininess={20}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Render annotations */}
      {annotations.map((annotation) => (
        <AnnotationMarker 
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotation?.id === annotation.id}
        />
      ))}
    </group>
  );
}

function AnnotationMarker({ 
  annotation, 
  isSelected 
}: { 
  annotation: ToothAnnotation; 
  isSelected: boolean;
}) {
  const markerRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (markerRef.current && isSelected) {
      const time = state.clock.getElapsedTime();
      markerRef.current.scale.setScalar(1 + Math.sin(time * 4) * 0.1);
    }
  });
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };
  
  return (
    <group position={annotation.position}>
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshPhongMaterial 
          color={getSeverityColor(annotation.severity)}
          emissive={getSeverityColor(annotation.severity)}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {isSelected && (
        <Html>
          <div className="bg-background border rounded-lg p-2 shadow-lg max-w-xs">
            <h4 className="font-semibold text-sm">{annotation.title}</h4>
            <p className="text-xs text-muted-foreground">{annotation.description}</p>
            <span className="text-xs px-2 py-1 rounded-full bg-muted">
              {annotation.type}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function RealisticTooth3D(props: RealisticTooth3DProps) {
  return (
    <Card className="w-full h-[600px]">
      <CardHeader>
        <CardTitle className="text-center">
          السن رقم {props.toothNumber} - نموذج ثلاثي الأبعاد واقعي
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[500px]">
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          shadows
        >
          {/* Realistic lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.3} />
          
          <RealisticToothMesh {...props} />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
          />
          
          {/* Background */}
          <mesh position={[0, 0, -10]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshPhongMaterial color={0xf8fafc} />
          </mesh>
        </Canvas>
        
        <div className="absolute bottom-4 left-4 text-sm text-muted-foreground">
          <p>• اسحب للدوران • عجلة الماوس للتكبير</p>
          <p>• نوع السن: ناب علوي (Maxillary Canine)</p>
        </div>
      </CardContent>
    </Card>
  );
}
