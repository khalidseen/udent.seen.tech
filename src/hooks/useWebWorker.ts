import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebWorkerOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useWebWorker(
  workerUrl: string,
  options: UseWebWorkerOptions = {}
) {
  const { onSuccess, onError } = options;
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Create worker instance
    try {
      workerRef.current = new Worker(new URL(workerUrl, import.meta.url), {
        type: "module",
      });

      workerRef.current.onmessage = (e: MessageEvent) => {
        const { type, data, error } = e.data;

        if (type === "SUCCESS") {
          onSuccess?.(data);
        } else if (type === "ERROR") {
          onError?.(error);
        }

        setIsProcessing(false);
      };

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error);
        onError?.(error.message);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Failed to create worker:", error);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerUrl, onSuccess, onError]);

  const postMessage = useCallback((type: string, payload: any) => {
    if (!workerRef.current) {
      console.error("Worker not initialized");
      return;
    }

    setIsProcessing(true);
    workerRef.current.postMessage({ type, payload });
  }, []);

  return { postMessage, isProcessing };
}
