/// <reference types="google.maps" />
import { Injectable, signal } from '@angular/core';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

export const LOCAL_STORAGE_MAPS_KEY = 'down_kilos_google_maps_key';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<typeof google> | null = null;

  readonly isLoaded = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly activeApiKey = signal<string>(this.getInitialApiKey());

  constructor() {
    const key = this.activeApiKey();
    if (key && key.trim()) {
      this.loadGoogleMaps().catch(() => {
        // Error is set in signal
      });
    }
  }

  getInitialApiKey(): string {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_MAPS_KEY);
      if (stored && stored.trim()) {
        return stored.trim();
      }
    }
    return (environment.googleMapsApiKey || '').trim();
  }

  hasApiKey(): boolean {
    return !!this.activeApiKey() && this.activeApiKey().trim().length > 5;
  }

  setApiKey(key: string): Promise<boolean> {
    const cleaned = key.trim();
    if (typeof window !== 'undefined') {
      if (cleaned) {
        localStorage.setItem(LOCAL_STORAGE_MAPS_KEY, cleaned);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_MAPS_KEY);
      }
    }
    this.activeApiKey.set(cleaned);
    this.loadPromise = null;
    this.isLoaded.set(false);
    this.errorMessage.set(null);

    if (cleaned) {
      return this.loadGoogleMaps()
        .then(() => true)
        .catch(() => false);
    }
    return Promise.resolve(false);
  }

  async loadGoogleMaps(): Promise<typeof google> {
    if (typeof window === 'undefined') {
      throw new Error('Google Maps kann nur im Browser geladen werden.');
    }

    if (this.isLoaded() && (window as unknown as { google?: typeof google }).google) {
      return (window as unknown as { google: typeof google }).google;
    }

    const key = this.activeApiKey();
    if (!key) {
      this.errorMessage.set('Kein Google Maps API-Schlüssel konfiguriert.');
      throw new Error('Kein Google Maps API-Schlüssel konfiguriert.');
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    setOptions({
      key,
      v: 'weekly',
      language: 'de',
      region: 'DE'
    });

    this.loadPromise = Promise.all([
      importLibrary('maps'),
      importLibrary('places'),
      importLibrary('geometry')
    ])
      .then(() => {
        this.isLoaded.set(true);
        this.isLoading.set(false);
        this.errorMessage.set(null);
        return (window as unknown as { google: typeof google }).google;
      })
      .catch((err: Error) => {
        this.isLoading.set(false);
        this.isLoaded.set(false);
        this.loadPromise = null;
        const msg = err?.message || 'Fehler beim Laden der Google Maps Platform.';
        this.errorMessage.set(msg);
        throw err;
      });

    return this.loadPromise;
  }
}
