import { useState, useEffect, useRef } from "react";

interface UseOptimizedImageOptions {
  placeholder?: string;
  rootMargin?: string;
  threshold?: number;
}

export function useOptimizedImage(
  src: string,
  options: UseOptimizedImageOptions = {}
) {
  const { placeholder, rootMargin = "50px", threshold = 0.01 } = options;
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };
  }, [isInView, src]);

  return {
    imgRef,
    src: imageSrc,
    isLoading,
    isInView,
  };
}
