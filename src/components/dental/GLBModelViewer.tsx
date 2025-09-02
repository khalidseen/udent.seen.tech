import React, { Suspense, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { Text } from '@react-three/drei';

interface GLBModelViewerProps {
  modelUrl: string;
  scale?: number;
  position?: [number, number, number];
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const GLBModelViewer: React.FC<GLBModelViewerProps> = ({
  modelUrl,
  scale = 1.5,
  position = [0, 0, 0],
  onLoad,
  onError
}) => {
  const [error, setError] = useState<Error | null>(null);
  
  try {
    const { scene } = useGLTF(modelUrl, true);
    
    useEffect(() => {
      if (scene && onLoad) {
        onLoad();
      }
    }, [scene, onLoad]);

    if (!scene) {
      return (
        <Text
          position={position}
          fontSize={0.15}
          color="gray"
          anchorX="center"
          anchorY="middle"
        >
          جاري التحميل...
        </Text>
      );
    }

    return (
      <primitive 
        object={scene.clone()} 
        scale={[scale, scale, scale]} 
        position={position}
      />
    );
  } catch (loadError) {
    console.error('Error loading GLB model:', loadError);
    
    useEffect(() => {
      if (onError && loadError instanceof Error) {
        onError(loadError);
      }
    }, [onError, loadError]);
    
    return (
      <Text
        position={position}
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

// Preload GLB files
useGLTF.preload = (url: string) => {
  useGLTF(url, true);
};