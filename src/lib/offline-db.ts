import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema definition
interface OfflineDB extends DBSchema {
  patients: {
    key: string;
    value: any;
  };
  appointments: {
    key: string;
    value: any;
  };
  dental_treatments: {
    key: string;
    value: any;
  };
  appointment_requests: {
    key: string;
    value: any;
  };
  offline_queue: {
    key: string;
    value: {
      id: string;
      table: string;
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
  offline_users: {
    key: string;
    value: {
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      role: string;
      created_at: string;
    };
  };
  offline_sessions: {
    key: string;
    value: {
      id: string;
      user_id: string;
      access_token: string;
      refresh_token: string;
      expires_at: string;
      created_at: string;
    };
  };
}

type TableName = 'patients' | 'appointments' | 'dental_treatments' | 'appointment_requests' | 'offline_queue' | 'offline_users' | 'offline_sessions';

class OfflineDatabase {
  private db: IDBPDatabase<OfflineDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<OfflineDB>('ClinicOfflineDB', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('dental_treatments')) {
          db.createObjectStore('dental_treatments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('appointment_requests')) {
          db.createObjectStore('appointment_requests', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_users')) {
          db.createObjectStore('offline_users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offline_sessions')) {
          db.createObjectStore('offline_sessions', { keyPath: 'id' });
        }
      },
    });
  }

  // Generic methods for CRUD operations
  async getAll(table: TableName): Promise<any[]> {
    if (!this.db) await this.init();
    return this.db!.getAll(table);
  }

  async get(table: TableName, id: string): Promise<any | undefined> {
    if (!this.db) await this.init();
    return this.db!.get(table, id);
  }

  async put(table: TableName, data: any): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(table, data);
  }

  async delete(table: TableName, id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(table, id);
  }

  async clear(table: TableName): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(table);
  }

  // Queue offline operations
  async addToQueue(table: string, action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    const queueItem = {
      id: crypto.randomUUID(),
      table,
      action,
      data,
      timestamp: Date.now(),
    };
    await this.put('offline_queue', queueItem);
  }

  async getQueue(): Promise<OfflineDB['offline_queue']['value'][]> {
    return this.getAll('offline_queue');
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.delete('offline_queue', id);
  }

  async clearQueue(): Promise<void> {
    await this.clear('offline_queue');
  }

  // Mark data for sync
  async markForSync(
    table: TableName, 
    id: string, 
    action: 'create' | 'update' | 'delete'
  ): Promise<void> {
    if (table === 'offline_queue') return;
    
    const item = await this.get(table, id);
    if (item) {
      item._offline_action = action;
      item._pending_sync = true;
      await this.put(table, item);
    }
  }

  // Get items pending sync
  async getPendingSync(table: TableName): Promise<any[]> {
    if (table === 'offline_queue') return [];
    
    const items = await this.getAll(table);
    return items.filter((item: any) => item._pending_sync === true);
  }

  // Clear sync flags
  async clearSyncFlags(table: TableName, id: string): Promise<void> {
    if (table === 'offline_queue') return;
    
    const item = await this.get(table, id);
    if (item) {
      delete item._offline_action;
      delete item._pending_sync;
      await this.put(table, item);
    }
  }
}

export const offlineDB = new OfflineDatabase();