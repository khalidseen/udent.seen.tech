// Background sync worker for offline data synchronization

interface SyncJob {
  id: string;
  type: 'patients' | 'appointments' | 'medical_records';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

class SyncWorker {
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: SyncJob[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    try {
      this.db = await this.openDatabase();
      await this.loadSyncQueue();
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('Failed to initialize sync worker:', error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DentalClinicSync', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('syncJobs')) {
          const store = db.createObjectStore('syncJobs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 Back online - processing sync queue');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Offline mode - queuing changes');
    });

    // Listen for background sync events (if service worker is available)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'BACKGROUND_SYNC') {
          this.processSyncQueue();
        }
      });
    }
  }

  private async loadSyncQueue() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['syncJobs'], 'readonly');
      const store = transaction.objectStore('syncJobs');
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(`📥 Loaded ${this.syncQueue.length} sync jobs from storage`);
      };
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  public async addSyncJob(job: Omit<SyncJob, 'id' | 'timestamp' | 'retries'>) {
    const syncJob: SyncJob = {
      ...job,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retries: 0
    };

    this.syncQueue.push(syncJob);
    await this.saveSyncJob(syncJob);

    if (this.isOnline) {
      this.processSyncQueue();
    }

    console.log(`📤 Added sync job: ${syncJob.type} ${syncJob.operation}`);
  }

  private async saveSyncJob(job: SyncJob) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['syncJobs'], 'readwrite');
      const store = transaction.objectStore('syncJobs');
      await store.put(job);
    } catch (error) {
      console.error('Failed to save sync job:', error);
    }
  }

  private async removeSyncJob(jobId: string) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['syncJobs'], 'readwrite');
      const store = transaction.objectStore('syncJobs');
      await store.delete(jobId);
      
      this.syncQueue = this.syncQueue.filter(job => job.id !== jobId);
    } catch (error) {
      console.error('Failed to remove sync job:', error);
    }
  }

  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log(`🔄 Processing ${this.syncQueue.length} sync jobs`);

    const jobsToProcess = [...this.syncQueue];
    
    for (const job of jobsToProcess) {
      try {
        await this.executeSyncJob(job);
        await this.removeSyncJob(job.id);
        console.log(`✅ Sync job completed: ${job.type} ${job.operation}`);
      } catch (error) {
        console.error(`❌ Sync job failed: ${job.type} ${job.operation}`, error);
        
        job.retries++;
        if (job.retries >= this.MAX_RETRIES) {
          console.error(`🚫 Max retries exceeded for job ${job.id}, removing from queue`);
          await this.removeSyncJob(job.id);
        } else {
          await this.saveSyncJob(job);
          // Retry after delay
          setTimeout(() => this.processSyncQueue(), this.RETRY_DELAY * job.retries);
        }
      }
    }
  }

  private async executeSyncJob(job: SyncJob): Promise<void> {
    // This would integrate with your Supabase client
    // For now, we'll simulate the sync operation
    
    const endpoint = this.getEndpointForJobType(job.type);
    const method = this.getMethodForOperation(job.operation);
    
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add your auth headers here
      },
      body: job.operation !== 'delete' ? JSON.stringify(job.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private getEndpointForJobType(type: string): string {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    switch (type) {
      case 'patients': return `${baseUrl}/rest/v1/patients`;
      case 'appointments': return `${baseUrl}/rest/v1/appointments`;
      case 'medical_records': return `${baseUrl}/rest/v1/medical_records`;
      default: throw new Error(`Unknown job type: ${type}`);
    }
  }

  private getMethodForOperation(operation: string): string {
    switch (operation) {
      case 'create': return 'POST';
      case 'update': return 'PATCH';
      case 'delete': return 'DELETE';
      default: throw new Error(`Unknown operation: ${operation}`);
    }
  }

  public getQueueStatus() {
    return {
      totalJobs: this.syncQueue.length,
      pendingJobs: this.syncQueue.filter(job => job.retries === 0).length,
      failedJobs: this.syncQueue.filter(job => job.retries > 0).length,
      isOnline: this.isOnline
    };
  }
}

// Export singleton instance
export const syncWorker = new SyncWorker();

// Helper function for easy integration with React components
export const useSyncWorker = () => {
  return {
    addJob: (job: Parameters<typeof syncWorker.addSyncJob>[0]) => syncWorker.addSyncJob(job),
    getStatus: () => syncWorker.getQueueStatus()
  };
};