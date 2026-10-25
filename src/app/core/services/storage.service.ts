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
const LOCAL_ONBOARDING_STEP_KEY = 'down_kilos_onboarding_step';
const LOCAL_ONBOARDING_DRAFT_KEY = 'down_kilos_onboarding_draft';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  readonly profile = signal<UserProfile | null>(null);
  readonly retailerPref = signal<RetailerPreference | null>(null);
  readonly weightHistory = signal<WeightEntry[]>([]);
  readonly weeklyBudget = signal<number>(50);

  constructor() {
    this.initDatabase();
    this.loadProfile().then(() => {
      this.loadWeightHistory();
    });
    this.loadRetailerPreference();
    this.loadWeeklyBudget();
  }

  loadWeeklyBudget(): number {
    try {
      const val = localStorage.getItem('down_kilos_weekly_budget');
      if (val) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          this.weeklyBudget.set(num);
          return num;
        }
      }
    } catch {
      // ignore
    }
    return 50;
  }

  saveWeeklyBudget(amount: number): void {
    const val = Math.max(10, Math.round(amount));
    this.weeklyBudget.set(val);
    try {
      localStorage.setItem('down_kilos_weekly_budget', val.toString());
    } catch {
      // ignore
    }
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
      postalCode: '',
      city: '',
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

    // Only record real starting weight if a profile is present
    const currentProf = this.profile();
    if (currentProf && currentProf.currentWeight) {
      const today = new Date().toISOString().split('T')[0];
      const initialHistory: WeightEntry[] = [
        {
          id: 'w_' + Date.now(),
          date: today,
          weight: currentProf.currentWeight,
          note: 'Startgewicht'
        }
      ];
      this.saveWeightHistory(initialHistory);
      return initialHistory;
    }

    this.weightHistory.set([]);
    return [];
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
        id: 'w_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
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

  async updateWeightEntry(id: string, weight: number, date: string, note?: string): Promise<void> {
    const current = this.weightHistory();
    const updated = current.map(e => e.id === id ? { ...e, weight, date, note } : e);
    this.saveWeightHistory(updated);

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

  async deleteWeightEntry(id: string): Promise<void> {
    const filtered = this.weightHistory().filter(e => e.id !== id);
    this.saveWeightHistory(filtered);

    const profile = this.profile();
    if (profile && filtered.length > 0) {
      const latest = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (latest && latest.weight !== profile.currentWeight) {
        await this.saveProfile({
          ...profile,
          currentWeight: latest.weight
        });
      }
    }
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
      localStorage.setItem(LOCAL_ONBOARDING_STEP_KEY, 'completed');
    } else {
      localStorage.removeItem(LOCAL_ONBOARDING_KEY);
      localStorage.removeItem(LOCAL_ONBOARDING_STEP_KEY);
    }
  }

  getOnboardingStep(): string | null {
    return localStorage.getItem(LOCAL_ONBOARDING_STEP_KEY);
  }

  setOnboardingStep(step: string): void {
    localStorage.setItem(LOCAL_ONBOARDING_STEP_KEY, step);
  }

  getOnboardingDraft<T = Record<string, unknown>>(): T | null {
    try {
      const raw = localStorage.getItem(LOCAL_ONBOARDING_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveOnboardingDraft(draft: Record<string, unknown>): void {
    try {
      localStorage.setItem(LOCAL_ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  clearOnboardingDraft(): void {
    try {
      localStorage.removeItem(LOCAL_ONBOARDING_DRAFT_KEY);
    } catch {
      // Ignore
    }
  }

  async resetAllData(): Promise<boolean> {
    try {
      // 1. Lokale Benutzerspeicher entfernen (nur App-spezifische Nutzerdaten)
      const keysToRemove = [
        LOCAL_FALLBACK_KEY,
        LOCAL_RETAILER_KEY,
        LOCAL_WEIGHT_KEY,
        LOCAL_ONBOARDING_KEY,
        LOCAL_ONBOARDING_STEP_KEY,
        LOCAL_ONBOARDING_DRAFT_KEY,
        'down_kilos_today_food_log',
        'down_kilos_shopping_checked',
        'down_kilos_shopping_pantry',
        'down_kilos_shopping_custom',
        'down_kilos_shopping_items',
        'down_kilos_shopping_list_checked',
        'down_kilos_swapped_meals',
        'down_kilos_user_custom_prices',
        'down_kilos_user_prices',
        'down_kilos_favorite_products'
      ];

      for (const key of keysToRemove) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }

      // 2. IndexedDB Profil leeren
      await this.deleteProfile();

      // 3. Reaktive Signale zurücksetzen
      this.profile.set(null);
      this.weightHistory.set([]);
      this.retailerPref.set(null);

      return true;
    } catch (err) {
      console.error('Fehler beim Zurücksetzen der Benutzerdaten:', err);
      return false;
    }
  }
}

