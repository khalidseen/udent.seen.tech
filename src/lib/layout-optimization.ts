// Utility to batch DOM reads and prevent forced reflows

type LayoutReadCallback = () => void;
type LayoutWriteCallback = () => void;

class LayoutBatcher {
  private readQueue: LayoutReadCallback[] = [];
  private writeQueue: LayoutWriteCallback[] = [];
  private rafId: number | null = null;

  // Schedule a DOM read operation
  read(callback: LayoutReadCallback): void {
    this.readQueue.push(callback);
    this.scheduleFlush();
  }

  // Schedule a DOM write operation
  write(callback: LayoutWriteCallback): void {
    this.writeQueue.push(callback);
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.flush();
    });
  }

  private flush(): void {
    // Execute all reads first (batch layout reads)
    const reads = this.readQueue.splice(0);
    reads.forEach(callback => callback());

    // Then execute all writes (batch layout writes)
    const writes = this.writeQueue.splice(0);
    writes.forEach(callback => callback());

    this.rafId = null;

    // If new operations were queued during flush, schedule another
    if (this.readQueue.length > 0 || this.writeQueue.length > 0) {
      this.scheduleFlush();
    }
  }

  // Clear all pending operations
  clear(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.readQueue = [];
    this.writeQueue = [];
  }
}

// Singleton instance
export const layoutBatcher = new LayoutBatcher();

// Hook to use layout batcher in React components
export const useLayoutBatcher = () => {
  return {
    read: (callback: LayoutReadCallback) => layoutBatcher.read(callback),
    write: (callback: LayoutWriteCallback) => layoutBatcher.write(callback),
  };
};
