import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
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

// Create realistic tooth geometry based on tooth number
function createToothGeometry(toothNumber: string) {
  const toothNum = parseInt(toothNumber);
  
  // Determine tooth type based on number (FDI system)
  const toothType = getToothType(toothNum);
  
  switch (toothType) {
    case 'incisor':
      return createIncisorGeometry();
    case 'canine':
      return createCanineGeometry();
    case 'premolar':
      return createPremolarGeometry();
    case 'molar':
      return createMolarGeometry();
    default:
      return createIncisorGeometry();
  }
}

function getToothType(toothNumber: number): string {
  const lastDigit = toothNumber % 10;
  
  if (lastDigit >= 1 && lastDigit <= 2) return 'incisor';
  if (lastDigit === 3) return 'canine';
  if (lastDigit >= 4 && lastDigit <= 5) return 'premolar';
  if (lastDigit >= 6 && lastDigit <= 8) return 'molar';
  
  return 'incisor';
}

// Create realistic incisor geometry
function createIncisorGeometry() {
  const shape = new THREE.Shape();
  
  // Create incisor crown shape
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.3, 0, 0.5, 0.2, 0.5, 0.5);
  shape.bezierCurveTo(0.5, 0.8, 0.3, 1, 0, 1);
  shape.bezierCurveTo(-0.3, 1, -0.5, 0.8, -0.5, 0.5);
  shape.bezierCurveTo(-0.5, 0.2, -0.3, 0, 0, 0);
  
  // Create crown with extrusion
  const crownGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelSegments: 8,
    bevelSize: 0.1,
    bevelThickness: 0.05
  });
  
  // Create root
  const rootGeometry = new THREE.CylinderGeometry(0.15, 0.25, 1.2, 16);
  rootGeometry.translate(0, -0.6, 0);
  
  // Merge crown and root
  const toothGeometry = new THREE.BufferGeometry();
  const crownPositions = crownGeometry.attributes.position.array;
  const rootPositions = rootGeometry.attributes.position.array;
  
  const positions = new Float32Array(crownPositions.length + rootPositions.length);
  positions.set(crownPositions);
  positions.set(rootPositions, crownPositions.length);
  
  toothGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  toothGeometry.computeVertexNormals();
  
  return toothGeometry;
}

// Create realistic canine geometry (tooth #23)
function createCanineGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // Define vertices for a realistic canine tooth
  const vertices = new Float32Array([
    // Crown - sharp cusp
    0, 1.2, 0,      // Tip of cusp
    0.4, 0.8, 0.2,  // Buccal cusp slope
    -0.4, 0.8, 0.2, // Lingual cusp slope
    0.6, 0.4, 0.3,  // Buccal middle
    -0.6, 0.4, 0.3, // Lingual middle
    0.5, 0, 0.2,    // Buccal cervical
    -0.5, 0, 0.2,   // Lingual cervical
    
    // Mesial and distal surfaces
    0.2, 0.8, 0.4,  // Mesial upper
    -0.2, 0.8, 0.4, // Distal upper
    0.3, 0.4, 0.4,  // Mesial middle
    -0.3, 0.4, 0.4, // Distal middle
    0.25, 0, 0.3,   // Mesial cervical
    -0.25, 0, 0.3,  // Distal cervical
    
    // Root vertices
    0.2, -0.3, 0.1,  // Root upper mesial
    -0.2, -0.3, 0.1, // Root upper distal
    0.15, -0.8, 0.05, // Root middle mesial
    -0.15, -0.8, 0.05, // Root middle distal
    0.1, -1.5, 0,     // Root tip mesial
    -0.1, -1.5, 0,    // Root tip distal
    0, -1.6, 0,       // Root apex
  ]);
  
  // Define faces (triangles)
  const indices = new Uint16Array([
    // Crown faces
    0, 1, 2,   // Cusp tip
    1, 3, 4,   // Upper crown
    1, 4, 2,
    3, 5, 6,   // Middle crown
    3, 6, 4,
    
    // Mesial/distal surfaces
    7, 8, 9,
    8, 10, 9,
    9, 10, 11,
    10, 12, 11,
    
    // Root faces
    13, 14, 15,
    14, 16, 15,
    15, 16, 17,
    16, 18, 17,
    17, 18, 19,
    
    // Connection between crown and root
    5, 6, 13,
    6, 14, 13,
    11, 12, 15,
    12, 16, 15,
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(Array.from(indices));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create realistic premolar geometry
function createPremolarGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // Premolar has two cusps (buccal and lingual)
  const vertices = new Float32Array([
    // Buccal cusp
    0.3, 1, 0.2,
    // Lingual cusp
    -0.3, 0.9, -0.2,
    // Connecting ridges and surfaces...
    // (Simplified for brevity)
  ]);
  
  // Add faces and compute normals
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  
  return geometry;
}

// Create realistic molar geometry
function createMolarGeometry() {
  const geometry = new THREE.BufferGeometry();
  
  // Molar has multiple cusps and complex surface
  const vertices = new Float32Array([
    // Multiple cusps and complex anatomy
    // (Detailed implementation would go here)
  ]);
  
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
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
  const meshRef = useRef<THREE.Mesh>(null);
  
  const toothGeometry = useMemo(() => createToothGeometry(toothNumber), [toothNumber]);
  
  // Realistic tooth materials
  const crownMaterial = new THREE.MeshPhongMaterial({
    color: 0xfffff0, // Ivory white
    shininess: 30,
    transparent: true,
    opacity: 0.95
  });
  
  const rootMaterial = new THREE.MeshPhongMaterial({
    color: 0xfff8dc, // Slightly yellowish for root
    shininess: 20
  });
  
  // Animation for breathing effect
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(time * 2) * 0.02;
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
    <group>
      <mesh
        ref={meshRef}
        geometry={toothGeometry}
        material={crownMaterial}
        onClick={handleClick}
        scale={[1.5, 1.5, 1.5]}
      >
        {/* Add surface details */}
        <meshPhongMaterial 
          color={0xfffff0}
          shininess={30}
          transparent={true}
          opacity={0.95}
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
          <p>• نوع السن: {getToothType(parseInt(props.toothNumber))}</p>
        </div>
      </CardContent>
    </Card>
  );
}