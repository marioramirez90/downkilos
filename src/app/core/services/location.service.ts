/// <reference types="google.maps" />
import { Injectable, inject, signal } from '@angular/core';
import { UserLocation } from '../models/retailer.model';
import { GoogleMapsLoaderService } from './google-maps-loader.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private mapsLoader = inject(GoogleMapsLoaderService);

  readonly currentLocation = signal<UserLocation | null>(null);
  readonly isLocating = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Request device GPS coordinates via navigator.geolocation.
   * Only called on explicit user action.
   */
  async getCurrentPosition(): Promise<UserLocation> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const err = 'Dein Browser unterstützt keine automatische Standortermittlung.';
      this.errorMessage.set(err);
      throw new Error(err);
    }

    this.isLocating.set(true);
    this.errorMessage.set(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocode to get a human-readable German address
      const location = await this.reverseGeocode(lat, lng);
      location.isGps = true;

      this.currentLocation.set(location);
      this.isLocating.set(false);
      return location;
    } catch (error) {
      this.isLocating.set(false);
      let message = 'Standort konnte nicht ermittelt werden.';
      if (error && typeof error === 'object' && 'code' in error) {
        const geoErr = error as GeolocationPositionError;
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          message = 'Standortzugriff wurde verweigert. Bitte gib deine Adresse manuell ein.';
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          message = 'Standortdaten sind derzeit nicht verfügbar. Bitte gib deine Adresse manuell ein.';
        } else if (geoErr.code === geoErr.TIMEOUT) {
          message = 'Zeitüberschreitung bei der Standortermittlung. Bitte versuche es erneut oder gib deine Adresse ein.';
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      this.errorMessage.set(message);
      throw new Error(message);
    }
  }

  /**
   * Reverse geocoding: lat/lng -> UserLocation with street, zip, city.
   */
  async reverseGeocode(lat: number, lng: number): Promise<UserLocation> {
    // 1. Try Google Maps Geocoder if loaded
    if (this.mapsLoader.isLoaded() && typeof google !== 'undefined' && google.maps?.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat, lng }
        });

        if (response.results && response.results.length > 0) {
          const res = response.results[0];
          return this.parseGoogleGeocodeResult(res, lat, lng);
        }
      } catch (err) {
        console.warn('Google Reverse Geocoding failed, falling back to OSM Nominatim', err);
      }
    }

    // 2. Real reverse geocoding via OpenStreetMap Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'de'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.footway || '';
        const houseNum = addr.house_number || '';
        const street = road ? (houseNum ? `${road} ${houseNum}` : road) : '';
        const postalCode = addr.postcode || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || 'Deutschland';
        const formatted = street
          ? `${street}, ${postalCode} ${city}`.trim()
          : `${postalCode} ${city}`.trim();

        return {
          lat,
          lng,
          formattedAddress: formatted || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          street,
          postalCode,
          city
        };
      }
    } catch {
      // ignore
    }

    // Default fallback coordinates if offline
    return {
      lat,
      lng,
      formattedAddress: `Koordinaten: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
  }

  /**
   * Geocode a manually entered address to lat/lng coordinates and structured address.
   */
  async geocodeAddress(query: string): Promise<UserLocation> {
    const cleaned = query.trim();
    if (!cleaned || cleaned.length < 2) {
      throw new Error('Bitte gib eine gültige Adresse, Postleitzahl oder Stadt ein.');
    }

    this.isLocating.set(true);
    this.errorMessage.set(null);

    // 1. Try Google Maps Geocoder if loaded
    if (this.mapsLoader.isLoaded() && typeof google !== 'undefined' && google.maps?.Geocoder) {
      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          address: cleaned,
          componentRestrictions: { country: 'DE' }
        });

        if (response.results && response.results.length > 0) {
          const res = response.results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          const location = this.parseGoogleGeocodeResult(res, lat, lng);
          this.currentLocation.set(location);
          this.isLocating.set(false);
          return location;
        }
      } catch (err) {
        console.warn('Google Geocode error, falling back to Nominatim', err);
      }
    }

    // 2. Real geocoding via OpenStreetMap Nominatim
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleaned)}&countrycodes=de&addressdetails=1&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'de'
        }
      });

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const item = results[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          const addr = item.address || {};
          const road = addr.road || addr.pedestrian || '';
          const houseNum = addr.house_number || '';
          const street = road ? (houseNum ? `${road} ${houseNum}` : road) : '';
          const postalCode = addr.postcode || '';
          const city = addr.city || addr.town || addr.village || addr.municipality || cleaned;

          const formatted = street
            ? `${street}, ${postalCode} ${city}`.trim()
            : `${postalCode} ${city}`.trim();

          const location: UserLocation = {
            lat,
            lng,
            formattedAddress: formatted || item.display_name,
            street,
            postalCode,
            city,
            isGps: false
          };

          this.currentLocation.set(location);
          this.isLocating.set(false);
          return location;
        }
      }
    } catch (err) {
      // fallback handled below
    }

    this.isLocating.set(false);
    const notFound = `Die Adresse „${cleaned}“ konnte nicht eindeutig gefunden werden. Bitte überprüfe deine Eingabe.`;
    this.errorMessage.set(notFound);
    throw new Error(notFound);
  }

  private parseGoogleGeocodeResult(
    res: google.maps.GeocoderResult,
    lat: number,
    lng: number
  ): UserLocation {
    let streetName = '';
    let streetNumber = '';
    let postalCode = '';
    let city = '';

    for (const comp of res.address_components) {
      if (comp.types.includes('route')) {
        streetName = comp.long_name;
      } else if (comp.types.includes('street_number')) {
        streetNumber = comp.long_name;
      } else if (comp.types.includes('postal_code')) {
        postalCode = comp.long_name;
      } else if (comp.types.includes('locality')) {
        city = comp.long_name;
      } else if (!city && comp.types.includes('administrative_area_level_2')) {
        city = comp.long_name;
      }
    }

    const street = streetName ? (streetNumber ? `${streetName} ${streetNumber}` : streetName) : '';
    const formatted = street
      ? `${street}, ${postalCode} ${city}`.trim()
      : res.formatted_address;

    return {
      lat,
      lng,
      formattedAddress: formatted,
      street,
      postalCode,
      city: city || 'Deutschland'
    };
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula in kilometers.
   */
  calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
