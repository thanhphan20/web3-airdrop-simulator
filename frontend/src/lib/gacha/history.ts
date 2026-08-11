import { openDB, type IDBPDatabase } from 'idb';

const version = 3;
const DBName = 'WishSimulator';

const isBrowser = typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

let IndexedDB: Promise<IDBPDatabase> | null = null;

if (isBrowser) {
  IndexedDB = openDB(DBName, version, {
    async upgrade(db, _oldVer, _newVer, transaction) {
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('banner', 'banner', { unique: false });
        historyStore.createIndex('itemID', 'itemID', { unique: false });
      } else {
        const historyStore = transaction.objectStore('history');
        const hasID = historyStore.indexNames.contains('itemID');
        if (!hasID) historyStore.createIndex('itemID', 'itemID', { unique: false });
      }

      if (!db.objectStoreNames.contains('assets')) {
        db.createObjectStore('assets', { keyPath: 'key', autoIncrement: false });
      }
    },
  });
}

const createEvent = () => {
  if (isBrowser) {
    const event = new Event('storageUpdate');
    document.dispatchEvent(event);
  }
};

export const HistoryManager = {
  async historyCount(): Promise<number> {
    if (!IndexedDB) return 0;
    return (await IndexedDB).count('history');
  },
  async getListByBanner(banner: string) {
    if (!IndexedDB) return [];
    return (await IndexedDB).getAllFromIndex('history', 'banner', banner);
  },
  async countItem(name: string): Promise<number> {
    if (!IndexedDB) return 0;
    return (await IndexedDB).countFromIndex('history', 'name', name);
  },
  async getByID(itemID: string | number) {
    if (!IndexedDB) return [];
    return (await IndexedDB).getAllFromIndex('history', 'itemID', itemID);
  },
  async clearHistory(banner: string): Promise<string> {
    if (!IndexedDB) return 'failed';
    try {
      const idb = await IndexedDB;
      const keys = await idb.getAllKeysFromIndex('history', 'banner', banner);
      for (let i = 0; i < keys.length; i++) {
        await idb.delete('history', keys[i]);
      }
      return 'success';
    } catch {
      return 'failed';
    }
  },
  async clearIDB() {
    if (!IndexedDB) return;
    const idb = await IndexedDB;
    const clear = await idb.clear('history');
    createEvent();
    return clear;
  },
  async getAllHistories() {
    if (!IndexedDB) return [];
    return (await IndexedDB).getAll('history');
  },
  async addHistory(data: Record<string, unknown>) {
    if (!data.hasOwnProperty('banner')) return;
    if (!IndexedDB) return;
    const idb = await IndexedDB;
    const put = await idb.put('history', data);
    return put;
  },
  async delete(id: number) {
    if (!id) return;
    if (!IndexedDB) return;
    const idb = await IndexedDB;
    const remove = await idb.delete('history', id);
    return remove;
  },
};