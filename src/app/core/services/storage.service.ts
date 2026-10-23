import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { RetailerPreference } from '../models/retailer.model';
import { WeightEntry } from '../models/weight-log.model';

const DB_NAME = 'down_kilos_db';
const DB_VERSION = 1;
const STORE_PROFILE = 'user_profile';
const PROFILE_KEY = 'guest_profile';
const LOCAL_FALLBACK_KEY = 'down_kilos_guest_profile';
const LOCAL_RETAILER_KEY = 'down_kilos_guest_retailer';
const LOCAL_WEIGHT_KEY = 'down_kilos_weight_history';
const LOCAL_ONBOARDING_KEY = 'down_kilos_onboarding_completed';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  readonly profile = signal<UserProfile | null>(null);
  readonly retailerPref = signal<RetailerPreference | null>(null);
  readonly weightHistory = signal<WeightEntry[]>([]);

  constructor() {
    this.initDatabase();
    this.loadProfile().then(() => {
      this.loadWeightHistory();
    });
    this.loadRetailerPreference();
  }

  private initDatabase(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_PROFILE)) {
            db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('IndexedDB unavailable, falling back to localStorage');
          resolve(null);
        };
      } catch (err) {
        console.warn('Error opening IndexedDB, falling back to localStorage', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  async loadProfile(): Promise<UserProfile | null> {
    const db = await this.initDatabase();

    if (!db) {
      const fallback = localStorage.getItem(LOCAL_FALLBACK_KEY);
      if (fallback) {
        try {
          const parsed: UserProfile = JSON.parse(fallback);
          this.profile.set(parsed);
          return parsed;
        } catch {
          return null;
        }
      }
      this.profile.set(null);
      return null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PROFILE, 'readonly');
        const store = tx.objectStore(STORE_PROFILE);
        const req = store.get(PROFILE_KEY);

        req.onsuccess = () => {
          const result = (req.result as UserProfile) || null;
          this.profile.set(result);
          resolve(result);
        };

        req.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const profileToSave: UserProfile = {
      ...profile,
      id: PROFILE_KEY,
      updatedAt: new Date().toISOString()
    };

    const db = await this.initDatabase();

    if (!db) {
      localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
      this.profile.set(profileToSave);
      this.loadWeightHistory();
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PROFILE, 'readwrite');
        const store = tx.objectStore(STORE_PROFILE);
        const req = store.put(profileToSave);

        req.onsuccess = () => {
          this.profile.set(profileToSave);
          localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
          this.loadWeightHistory();
          resolve();
        };

        req.onerror = () => {
          localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
          this.profile.set(profileToSave);
          this.loadWeightHistory();
          resolve();
        };
      } catch {
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
        this.profile.set(profileToSave);
        this.loadWeightHistory();
        resolve();
      }
    });
  }

  async deleteProfile(): Promise<void> {
    const db = await this.initDatabase();
    localStorage.removeItem(LOCAL_FALLBACK_KEY);
    this.profile.set(null);

    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PROFILE, 'readwrite');
        const store = tx.objectStore(STORE_PROFILE);
        const req = store.delete(PROFILE_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async hasProfile(): Promise<boolean> {
    const current = this.profile();
    if (current) return true;
    const loaded = await this.loadProfile();
    return !!loaded;
  }

  async loadRetailerPreference(): Promise<RetailerPreference | null> {
    const fallback = localStorage.getItem(LOCAL_RETAILER_KEY);
    if (fallback) {
      try {
        const parsed: RetailerPreference = JSON.parse(fallback);
        this.retailerPref.set(parsed);
        return parsed;
      } catch {
        // ignore
      }
    }

    const defaultPref: RetailerPreference = {
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      postalCode: '10115',
      city: 'Berlin – Mitte',
      weeklyBudget: 40
    };
    this.retailerPref.set(defaultPref);
    return defaultPref;
  }

  async saveRetailerPreference(pref: RetailerPreference): Promise<void> {
    localStorage.setItem(LOCAL_RETAILER_KEY, JSON.stringify(pref));
    this.retailerPref.set(pref);
  }

  // --- Weight History Methods ---
  loadWeightHistory(): WeightEntry[] {
    const stored = localStorage.getItem(LOCAL_WEIGHT_KEY);
    if (stored) {
      try {
        const parsed: WeightEntry[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.weightHistory.set(parsed);
          return parsed;
        }
      } catch {
        // ignore error
      }
    }

    // Default seed history if profile is present
    const currentProf = this.profile();
    const currWeight = currentProf?.currentWeight ?? 68.5;
    const startWeight = currWeight + 3.5;

    const today = new Date();
    const d1 = new Date(today.getTime() - 21 * 86400000).toISOString().split('T')[0];
    const d2 = new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0];
    const d3 = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const d4 = today.toISOString().split('T')[0];

    const defaultHistory: WeightEntry[] = [
      { id: 'w1', date: d1, weight: Number(startWeight.toFixed(1)), note: 'Start der Reise' },
      { id: 'w2', date: d2, weight: Number((startWeight - 1.2).toFixed(1)), note: 'Erste Woche geschafft' },
      { id: 'w3', date: d3, weight: Number((startWeight - 2.4).toFixed(1)), note: 'Guter Ernährungsrhythmus' },
      { id: 'w4', date: d4, weight: Number(currWeight.toFixed(1)), note: 'Aktuelle Messung' }
    ];

    this.saveWeightHistory(defaultHistory);
    return defaultHistory;
  }

  saveWeightHistory(history: WeightEntry[]): void {
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    localStorage.setItem(LOCAL_WEIGHT_KEY, JSON.stringify(sorted));
    this.weightHistory.set(sorted);
  }

  async addWeightEntry(weight: number, date?: string, note?: string): Promise<void> {
    const entryDate = date || new Date().toISOString().split('T')[0];
    const current = this.weightHistory();

    const existingIndex = current.findIndex(e => e.date === entryDate);
    let updated: WeightEntry[];

    if (existingIndex >= 0) {
      updated = current.map((e, idx) => idx === existingIndex ? { ...e, weight, note: note ?? e.note } : e);
    } else {
      const newEntry: WeightEntry = {
        id: 'w_' + Date.now(),
        date: entryDate,
        weight,
        note
      };
      updated = [...current, newEntry];
    }

    this.saveWeightHistory(updated);

    // Also update current weight in profile if this is the newest date
    const profile = this.profile();
    if (profile) {
      const latest = [...updated].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latest && latest.weight !== profile.currentWeight) {
        await this.saveProfile({
          ...profile,
          currentWeight: latest.weight
        });
      }
    }
  }

  deleteWeightEntry(id: string): void {
    const filtered = this.weightHistory().filter(e => e.id !== id);
    this.saveWeightHistory(filtered);
  }

  exportDataJson(): string {
    const exportData = {
      exportedAt: new Date().toISOString(),
      app: 'Down Kilos',
      version: '1.0.0',
      profile: this.profile(),
      retailerPreference: this.retailerPref(),
      weightHistory: this.weightHistory(),
      shoppingList: localStorage.getItem('down_kilos_shopping_list_checked')
    };
    return JSON.stringify(exportData, null, 2);
  }

  isOnboardingCompleted(): boolean {
    return localStorage.getItem(LOCAL_ONBOARDING_KEY) === 'true';
  }

  setOnboardingCompleted(completed: boolean): void {
    if (completed) {
      localStorage.setItem(LOCAL_ONBOARDING_KEY, 'true');
    } else {
      localStorage.removeItem(LOCAL_ONBOARDING_KEY);
    }
  }

  async resetAllData(): Promise<void> {
    localStorage.removeItem(LOCAL_FALLBACK_KEY);
    localStorage.removeItem(LOCAL_RETAILER_KEY);
    localStorage.removeItem(LOCAL_WEIGHT_KEY);
    localStorage.removeItem(LOCAL_ONBOARDING_KEY);
    localStorage.removeItem('down_kilos_shopping_list_checked');
    localStorage.removeItem('down_kilos_swapped_meals');
    localStorage.removeItem('down_kilos_user_custom_prices');

    await this.deleteProfile();
    this.weightHistory.set([]);
    this.retailerPref.set(null);
  }
}

