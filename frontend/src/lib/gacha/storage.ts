const storageLocal = {
  getData() {
    const data = localStorage.getItem('WishSimulator.App');
    if (!data) return { data: {} };
    const parsed = JSON.parse(data);
    return parsed;
  },

  get(key: string) {
    const { data } = this.getData();
    return data[key] ?? {};
  },

  set(key: string, value: unknown) {
    const { data } = this.getData();
    data[key] = value;
    localStorage.setItem('WishSimulator.App', JSON.stringify({ data }));
  },

  initEvent() {
    const localStore = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key: string, value: string) {
      if (key === 'WishSimulator.App') {
        const event = new Event('storageUpdate');
        document.dispatchEvent(event);
      }
      localStore(key, value);
    };
  },
};

export const localPity = {
  get(pityBanner: string): number {
    const pity = storageLocal.get('pity') as Record<string, number>;
    return pity[pityBanner] ?? 0;
  },

  set(pityBanner: string, value: number) {
    const pity = storageLocal.get('pity') as Record<string, number>;
    pity[pityBanner] = value;
    storageLocal.set('pity', pity);
  },
};

export const localBalance = {
  all() {
    const balance = storageLocal.get('balance') as Record<string, number>;
    return balance;
  },
  get(currency: string): number {
    const balance = storageLocal.get('balance') as Record<string, number>;
    return balance[currency] ?? 0;
  },
  set(currency: string, value: number) {
    const balance = storageLocal.get('balance') as Record<string, number>;
    balance[currency] = value;
    storageLocal.set('balance', balance);
  },
};

export const rollCounter = {
  get(banner: string): number {
    const rollCount = storageLocal.get('rollCounter') as Record<string, number>;
    return rollCount[banner] ?? 0;
  },
  set(banner: string, rollNumber: number) {
    if (!banner) return;
    const rollCount = storageLocal.get('rollCounter') as Record<string, number>;
    rollCount[banner] = rollNumber;
    storageLocal.set('rollCounter', rollCount);
  },
  put(banner: string) {
    if (!banner) return;
    const rollCount = storageLocal.get('rollCounter') as Record<string, number>;
    const before = rollCount[banner] ?? 0;
    rollCount[banner] = before + 1;
    storageLocal.set('rollCounter', rollCount);
  },
};

export const guaranteedStatus = {
  get(banner: string): boolean {
    const guaranteedStatus = storageLocal.get('guaranteedStatus') as Record<string, boolean>;
    return guaranteedStatus[banner] ?? false;
  },
  set(banner: string, value: boolean) {
    const guaranteedStatus = storageLocal.get('guaranteedStatus') as Record<string, boolean>;
    guaranteedStatus[banner] = value;
    storageLocal.set('guaranteedStatus', guaranteedStatus);
  },
};

export const localConfig = {
  get(key: string) {
    const config = storageLocal.get('config') as Record<string, unknown>;
    const isValue = config[key] !== null;
    return isValue ? config[key] : null;
  },
  set(key: string, value: unknown) {
    const config = storageLocal.get('config') as Record<string, unknown>;
    config[key] = value;
    storageLocal.set('config', config);
  },
};

export const owneditem = {
  getAll() {
    const items = storageLocal.get('ownedItem') as Record<string, { manual: number; wish: number }>;
    return items;
  },

  get(itemID: string | number) {
    const db = this.getAll();
    const selected = db[itemID];
    if (!selected) return { qty: 0, itemID };
    const { manual, wish } = selected;
    return { itemID, qty: manual + wish };
  },

  put({ itemID, source = 'wish', qty = 1 }: { itemID: string | number; source?: string; qty?: number }) {
    const allItems = storageLocal.get('ownedItem') as Record<string, { manual: number; wish: number }>;
    const { manual = 0, wish = 0 } = allItems[itemID] ?? {};
    allItems[itemID] = {
      manual: source === 'wish' ? manual : qty + manual,
      wish: source === 'wish' ? qty + wish : wish,
    };
    storageLocal.set('ownedItem', allItems);
    return allItems[itemID];
  },
};

class FatepointManager {
  _version = '';
  _phase = 0;
  _banner = 'weapon-event';
  _db: Array<{ version: string; phase: number; banner: string; point: number; type: string; selected: number | null }> = [];
  _recordIndex = -1;

  getAll() {
    const storedData = storageLocal.get('fatepoint');
    const allPoint = Array.isArray(storedData) ? storedData : [];
    return allPoint;
  }

  restore(data: unknown) {
    const localData = this.getAll();
    localData.push(data);
    storageLocal.set('fatepoint', localData);
  }

  init({ version, phase, banner = 'weapon-event' }: { version: string; phase: number; banner?: string }) {
    this._version = version;
    this._phase = phase;
    this._banner = banner;
    const storedData = storageLocal.get('fatepoint');
    this._db = Array.isArray(storedData) ? storedData : [];
    this._recordIndex = this._db.findIndex(({ phase: p, version: v, banner: b }) => {
      return p === phase && v === version && b === banner;
    });
    return this;
  }

  set(point: number, selectedIndex: number | null, type = 'weapon') {
    const { _recordIndex: i, _version: version, _phase: phase, _db: db, _banner: banner } = this;
    const newData = { version, phase, banner, point, type, selected: selectedIndex };
    if (i < 0) {
      db.push(newData);
      this._recordIndex = db.length - 1;
    } else {
      db[i] = newData;
    }
    storageLocal.set('fatepoint', db);
    return;
  }

  getInfo() {
    const { _recordIndex: i, _db: db } = this;
    if (i < 0) return { selected: null, point: null, banner: null, type: null };
    const { selected, point, type = 'weapon', banner = 'weapon-event' } = db[i];
    return { selected, point, banner, type };
  }

  remove() {
    const { _recordIndex: i, _db: db } = this;
    const afterRemoved = db.filter((_d, index) => index !== i);
    storageLocal.set('fatepoint', afterRemoved);
    this._recordIndex = -1;
  }
}

export const fatepointManager = new FatepointManager();

export const dailyWelkin = {
  getData() {
    const welkin = storageLocal.get('welkin');
    if (!welkin) return { remaining: 0, diff: 0 };
    const utc = new Date().getTime() - 3 * 3600 * 1000;
    const today = new Date(utc).toDateString();
    const counter = Math.abs(new Date(today).getTime() - new Date(welkin.latestCheckIn).getTime());
    welkin.diff = Math.ceil(counter / (1000 * 60 * 60 * 24));
    return welkin;
  },
  checkin(action = 'checkin') {
    let { remaining, latestCheckIn } = this.getData();
    const time = new Date().getTime() - 3 * 3600 * 1000;
    const today = new Date(time).toDateString();
    if (!latestCheckIn && action !== 'checkin') {
      const object = { remaining: 29, latestCheckIn: today };
      storageLocal.set('welkin', object);
      return object;
    }
    if (action !== 'checkin') {
      const days = remaining < 1 ? 29 : 30;
      const object = { remaining: days + remaining, latestCheckIn: today };
      storageLocal.set('welkin', object);
      return object;
    }
    const counter = Math.abs(new Date(today).getTime() - new Date(latestCheckIn).getTime());
    const diffDays = Math.ceil(counter / (1000 * 60 * 60 * 24));
    remaining = remaining - diffDays;
    remaining = remaining < 0 ? 0 : remaining;
    latestCheckIn = today;
    const object = { remaining, latestCheckIn };
    storageLocal.set('welkin', object);
    return object;
  },
};

export const ownedOutfits = {
  getAll() {
    const items = storageLocal.get('ownedOutfits');
    return Array.isArray(items) ? items : [];
  },
  get(outfitName: string) {
    const outfits = this.getAll();
    return outfits.find(({ name }) => name === outfitName);
  },
  getByChar(charName: string) {
    const outfits = this.getAll();
    return outfits.filter(({ characterName }) => characterName === charName);
  },
  set({ outfitName, isSet = true, characterName = null }: { outfitName: string; isSet?: boolean; characterName?: string | null }) {
    const outfits = this.getAll().map((outfit) => {
      if (outfit.characterName !== characterName) return outfit;
      outfit.isSet = false;
      return outfit;
    });
    if (this.get(outfitName)) {
      const index = outfits.findIndex(({ name }) => name === outfitName);
      outfits[index].isSet = isSet;
    } else {
      outfits.push({ name: outfitName, characterName, isSet });
    }
    storageLocal.set('ownedOutfits', outfits);
  },
};

export const localrate = {
  get(key: string) {
    const rates = storageLocal.get('probabilityRates') as Record<string, unknown>;
    const isValue = rates[key] && rates[key] !== null && rates[key] !== undefined;
    return isValue ? rates[key] : {};
  },
  set(key: string, value: unknown) {
    const rates = storageLocal.get('probabilityRates') as Record<string, unknown>;
    rates[key] = value;
    storageLocal.set('probabilityRates', rates);
  },
  reset(key: string) {
    const rates = storageLocal.get('probabilityRates') as Record<string, unknown>;
    delete rates[key];
    storageLocal.set('probabilityRates', rates);
  },
};