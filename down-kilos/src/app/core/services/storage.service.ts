import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { RetailerPreference } from '../models/retailer.model';

const DB_NAME = 'down_kilos_db';
const DB_VERSION = 1;
const STORE_PROFILE = 'user_profile';
const STORE_PREF = 'preferences';
const PROFILE_KEY = 'guest_profile';
const RETAILER_KEY = 'guest_retailer';
const LOCAL_FALLBACK_KEY = 'down_kilos_guest_profile';
const LOCAL_RETAILER_KEY = 'down_kilos_guest_retailer';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  readonly profile = signal<UserProfile | null>(null);
  readonly retailerPref = signal<RetailerPreference | null>(null);

  constructor() {
    this.initDatabase();
    this.loadProfile();
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
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_PROFILE, 'readwrite');
        const store = tx.objectStore(STORE_PROFILE);
        const req = store.put(profileToSave);

        req.onsuccess = () => {
          this.profile.set(profileToSave);
          // Also sync to localStorage as secondary backup
          localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
          resolve();
        };

        req.onerror = () => {
          // fallback to localStorage
          localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
          this.profile.set(profileToSave);
          resolve();
        };
      } catch (err) {
        localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(profileToSave));
        this.profile.set(profileToSave);
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
}
