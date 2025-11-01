import { memo } from "react";
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

export const OptimizedImage = memo<OptimizedImageProps>(
  ({ src, alt, className, placeholder, width, height }) => {
    const { imgRef, src: imageSrc, isLoading } = useOptimizedImage(src, {
      placeholder,
    });

    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted" />
        )}
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";
