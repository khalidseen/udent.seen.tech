import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ToothAnnotation {
  id: string;
  position: [number, number, number];
  color: string;
  title: string;
  description?: string;
  annotationType: 'decay' | 'fracture' | 'filling' | 'crown' | 'note';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Tooth3DProps {
  toothNumber: string;
  annotations?: ToothAnnotation[];
  onAnnotationClick?: (annotation: ToothAnnotation) => void;
  onAddAnnotation?: (position: [number, number, number]) => void;
  selectedAnnotation?: string;
  interactionMode: 'view' | 'annotate';
}

const ToothMesh = ({ 
  annotations = [], 
  onAnnotationClick, 
  onAddAnnotation, 
  selectedAnnotation,
  interactionMode 
}: Omit<Tooth3DProps, 'toothNumber'>) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Create tooth geometry (simplified molar shape)
  const createToothGeometry = () => {
    const geometry = new THREE.Group();
    
    // Crown (main part)
    const crownGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8);
    const crownMaterial = new THREE.MeshPhongMaterial({ 
      color: '#f8f8f8',
      transparent: true,
      opacity: 0.95,
      shininess: 30
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 0.2;
    geometry.add(crown);

    // Root
    const rootGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.6, 6);
    const rootMaterial = new THREE.MeshPhongMaterial({ 
      color: '#e8e0d0',
      transparent: true,
      opacity: 0.9
    });
    const root = new THREE.Mesh(rootGeometry, rootMaterial);
    root.position.y = -0.5;
    geometry.add(root);

    // Add surface details (grooves and cusps)
    for (let i = 0; i < 4; i++) {
      const cuspGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const cuspMaterial = new THREE.MeshPhongMaterial({ color: '#ffffff' });
      const cusp = new THREE.Mesh(cuspGeometry, cuspMaterial);
      
      const angle = (i / 4) * Math.PI * 2;
      cusp.position.x = Math.cos(angle) * 0.3;
      cusp.position.z = Math.sin(angle) * 0.3;
      cusp.position.y = 0.5;
      geometry.add(cusp);
    }

    return geometry;
  };

  const handleClick = (event: any) => {
    if (interactionMode === 'annotate' && onAddAnnotation) {
      event.stopPropagation();
      const point = event.point;
      onAddAnnotation([point.x, point.y, point.z]);
    }
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing animation
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02);
    }
  });

  return (
    <group ref={meshRef} onClick={handleClick}>
      <primitive 
        object={createToothGeometry()} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      />
      
      {/* Render annotations */}
      {annotations.map((annotation) => (
        <AnnotationMarker
          key={annotation.id}
          annotation={annotation}
          isSelected={selectedAnnotation === annotation.id}
          onClick={() => onAnnotationClick?.(annotation)}
        />
      ))}
    </group>
  );
};

const AnnotationMarker = ({ 
  annotation, 
  isSelected, 
  onClick 
}: { 
  annotation: ToothAnnotation; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'decay': return '🦷';
      case 'fracture': return '⚡';
      case 'filling': return '🔧';
      case 'crown': return '👑';
      case 'note': return '📝';
      default: return '📍';
    }
  };

  return (
    <group position={annotation.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={isSelected ? 1.3 : hovered ? 1.1 : 1}
      >
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshPhongMaterial 
          color={getSeverityColor(annotation.severity)}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {(hovered || isSelected) && (
        <Html distanceFactor={10}>
          <div className="bg-card p-2 rounded-lg shadow-lg border text-xs max-w-xs">
            <div className="flex items-center gap-1 mb-1">
              <span>{getTypeIcon(annotation.annotationType)}</span>
              <span className="font-medium">{annotation.title}</span>
            </div>
            {annotation.description && (
              <p className="text-muted-foreground">{annotation.description}</p>
            )}
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs px-1 rounded ${
                annotation.severity === 'critical' ? 'bg-red-100 text-red-800' :
                annotation.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                annotation.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {annotation.severity}
              </span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Tooth3D = ({ 
  toothNumber, 
  annotations = [], 
  onAnnotationClick, 
  onAddAnnotation,
  selectedAnnotation,
  interactionMode = 'view'
}: Tooth3DProps) => {
  return (
    <div className="w-full h-96 border rounded-lg bg-gradient-to-b from-background to-muted">
      <Canvas
        camera={{ position: [2, 1, 2], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        {/* Tooth model */}
        <ToothMesh
          annotations={annotations}
          onAnnotationClick={onAnnotationClick}
          onAddAnnotation={onAddAnnotation}
          selectedAnnotation={selectedAnnotation}
          interactionMode={interactionMode}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={10}
          minDistance={1}
          maxPolarAngle={Math.PI}
          minPolarAngle={0}
        />

        {/* Ground plane for shadows */}
        <mesh receiveShadow position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial transparent opacity={0.1} />
        </mesh>
      </Canvas>

      {/* Overlay info */}
      <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm p-2 rounded-lg">
        <div className="text-sm font-medium">السن رقم {toothNumber}</div>
        <div className="text-xs text-muted-foreground">
          {annotations.length} تعليق
        </div>
      </div>

      {/* Interaction mode indicator */}
      <div className="absolute top-2 right-2 bg-card/80 backdrop-blur-sm p-2 rounded-lg">
        <div className="text-xs text-muted-foreground">
          {interactionMode === 'annotate' ? '🖱️ انقر لإضافة تعليق' : '👁️ وضع العرض'}
        </div>
      </div>
    </div>
  );
};

export default Tooth3D;
export type { ToothAnnotation };