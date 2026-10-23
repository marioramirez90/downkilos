/// <reference types="google.maps" />
import { Injectable, inject, signal } from '@angular/core';
import { StoreBranch, UserLocation } from '../models/retailer.model';
import { GoogleMapsLoaderService } from './google-maps-loader.service';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root'
})
export class NearbyStoresService {
  private mapsLoader = inject(GoogleMapsLoaderService);
  private locationService = inject(LocationService);

  readonly stores = signal<StoreBranch[]>([]);
  readonly isSearching = signal<boolean>(false);
  readonly searchError = signal<string | null>(null);
  readonly searchRadiusKm = signal<number>(5);
  readonly selectedStore = signal<StoreBranch | null>(null);

  private currentSearchId = 0;

  /**
   * Search for real supermarkets around user coordinates with given radius (km).
   */
  async searchStores(location: UserLocation, radiusKm: number = 5): Promise<StoreBranch[]> {
    const searchId = ++this.currentSearchId;
    this.searchRadiusKm.set(radiusKm);
    this.isSearching.set(true);
    this.searchError.set(null);

    try {
      let results: StoreBranch[] = [];

      // 1. Try Google Maps Places API if key and library are loaded
      if (this.mapsLoader.isLoaded() && typeof google !== 'undefined' && google.maps?.places) {
        try {
          results = await this.searchViaGooglePlaces(location, radiusKm);
        } catch (err) {
          console.warn('Google Places API search failed, falling back to OSM Overpass live search', err);
          results = await this.searchViaOverpass(location, radiusKm);
        }
      } else {
        // 2. Real live search via OpenStreetMap Overpass API (no API key required)
        results = await this.searchViaOverpass(location, radiusKm);
      }

      // Check if this search is still current (prevent race condition)
      if (searchId !== this.currentSearchId) {
        return this.stores();
      }

      // Calculate distance for all found stores & sort
      results.forEach((s) => {
        s.distanceKm = this.locationService.calculateHaversineDistanceKm(
          location.lat,
          location.lng,
          s.lat,
          s.lng
        );
      });

      results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

      this.stores.set(results);
      this.isSearching.set(false);

      // Auto-select nearest Netto if not already selected
      const currentSelected = this.selectedStore();
      if (!currentSelected || !results.some((s) => s.id === currentSelected.id)) {
        const nearestNetto = results.find((s) => s.isAvailable);
        if (nearestNetto) {
          this.selectedStore.set(nearestNetto);
        } else if (results.length > 0) {
          this.selectedStore.set(results[0]);
        }
      }

      return results;
    } catch (err) {
      if (searchId === this.currentSearchId) {
        this.isSearching.set(false);
        const msg = err instanceof Error ? err.message : 'Fehler bei der Suche nach Supermärkten.';
        this.searchError.set(msg);
      }
      return [];
    }
  }

  /**
   * Search real supermarkets via Google Places API (PlacesService).
   */
  private async searchViaGooglePlaces(location: UserLocation, radiusKm: number): Promise<StoreBranch[]> {
    const dummyDiv = document.createElement('div');
    const service = new google.maps.places.PlacesService(dummyDiv);

    const radiusMeters = radiusKm * 1000;
    const center = new google.maps.LatLng(location.lat, location.lng);

    // Queries to cover all required supermarket chains
    const queries = [
      'Netto Marken-Discount',
      'EDEKA',
      'REWE',
      'Lidl',
      'ALDI',
      'Penny',
      'Kaufland'
    ];

    const allPlaces: google.maps.places.PlaceResult[] = [];
    const seenPlaceIds = new Set<string>();

    for (const query of queries) {
      try {
        const results = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
          service.textSearch(
            {
              location: center,
              radius: radiusMeters,
              query: `${query} Supermarkt`
            },
            (
              res: google.maps.places.PlaceResult[] | null,
              status: any
            ) => {
              if (res && (status === 'OK' || status === google.maps.places.PlacesServiceStatus.OK)) {
                resolve(res);
              } else {
                resolve([]);
              }
            }
          );
        });

        for (const p of results) {
          if (p.place_id && !seenPlaceIds.has(p.place_id)) {
            seenPlaceIds.add(p.place_id);
            allPlaces.push(p);
          }
        }
      } catch {
        // Continue with next chain
      }
    }

    const branches: StoreBranch[] = [];

    for (const p of allPlaces) {
      const branch = this.mapGooglePlaceToBranch(p, location);
      if (branch) {
        branches.push(branch);
      }
    }

    return branches;
  }

  /**
   * Map Google Place Result to our unified StoreBranch model.
   * Strict validation ensures "Netto Marken-Discount" is not confused with Danish "Netto mit dem Hund" (Netto ApS).
   */
  private mapGooglePlaceToBranch(
    p: google.maps.places.PlaceResult,
    userLoc: UserLocation
  ): StoreBranch | null {
    if (!p.geometry || !p.geometry.location) return null;

    const name = p.name || '';
    const lowerName = name.toLowerCase();

    // Determine retailer chain
    let retailerId = 'other';
    let retailerName = name;
    let brand = 'Supermarkt';
    let isAvailable = false;

    if (lowerName.includes('netto')) {
      // Exclude Netto ApS (Netto mit Hund / schwarzer Hund auf gelbem Grund)
      if (lowerName.includes('aps') || lowerName.includes('city') || lowerName.includes('schwarz')) {
        return null;
      }
      retailerId = 'netto';
      retailerName = 'Netto Marken-Discount';
      brand = 'Netto Marken-Discount';
      isAvailable = true; // Netto Marken-Discount is active in V1
    } else if (lowerName.includes('edeka')) {
      retailerId = 'edeka';
      retailerName = 'EDEKA';
      brand = 'EDEKA';
    } else if (lowerName.includes('rewe')) {
      retailerId = 'rewe';
      retailerName = 'REWE';
      brand = 'REWE';
    } else if (lowerName.includes('lidl')) {
      retailerId = 'lidl';
      retailerName = 'Lidl';
      brand = 'Lidl';
    } else if (lowerName.includes('aldi')) {
      retailerId = lowerName.includes('nord') ? 'aldi-nord' : 'aldi-sued';
      retailerName = lowerName.includes('nord') ? 'ALDI Nord' : 'ALDI Süd';
      brand = 'ALDI';
    } else if (lowerName.includes('penny')) {
      retailerId = 'penny';
      retailerName = 'Penny';
      brand = 'Penny';
    } else if (lowerName.includes('kaufland')) {
      retailerId = 'kaufland';
      retailerName = 'Kaufland';
      brand = 'Kaufland';
    } else {
      // Skip non-matching markets
      return null;
    }

    const lat = p.geometry.location.lat();
    const lng = p.geometry.location.lng();
    const address = p.formatted_address || p.vicinity || '';

    // Split address into street and city/zip
    const parts = address.split(',').map((s: string) => s.trim());
    const street = parts[0] || '';
    const zipCity = parts[1] || parts[0] || '';
    const zipMatch = zipCity.match(/\b\d{5}\b/);
    const postalCode = zipMatch ? zipMatch[0] : '';
    const city = zipCity.replace(postalCode, '').trim() || userLoc.city || '';

    return {
      id: p.place_id || `gplace-${lat}-${lng}`,
      placeId: p.place_id,
      retailerId,
      retailerName,
      brand,
      name,
      street,
      postalCode,
      city,
      formattedAddress: address,
      lat,
      lng,
      isOpenNow: p.opening_hours?.isOpen?.() ?? undefined,
      isAvailable
    };
  }

  /**
   * Real live query to OpenStreetMap Overpass API for Germany.
   * Provides 100% real verifiable supermarket data without API key dependency.
   */
  private async searchViaOverpass(location: UserLocation, radiusKm: number): Promise<StoreBranch[]> {
    const radiusMeters = radiusKm * 1000;
    const lat = location.lat;
    const lng = location.lng;

    // Overpass QL query: real nodes & ways tagged as supermarket in the radius
    const query = `
      [out:json][timeout:15];
      (
        node["shop"="supermarket"](around:${radiusMeters},${lat},${lng});
        way["shop"="supermarket"](around:${radiusMeters},${lat},${lng});
      );
      out center;
    `;

    const url = 'https://overpass-api.de/api/interpreter';
    const response = await fetch(url, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error('Echtzeit-Supermarktabfrage konnte nicht geladen werden.');
    }

    const data = await response.json();
    const elements: Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }> = data.elements || [];

    const branches: StoreBranch[] = [];
    const seenNamesAndCoords = new Set<string>();

    for (const el of elements) {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) continue;

      const tags = el.tags || {};
      const name = tags['name'] || tags['brand'] || tags['operator'] || '';
      const brand = tags['brand'] || tags['operator'] || name;
      const combined = `${name} ${brand}`.toLowerCase();

      // Check for target chains
      let retailerId = '';
      let retailerName = '';
      let isAvailable = false;

      if (combined.includes('netto')) {
        // Exclude Netto ApS (schwarzer Hund)
        if (combined.includes('aps') || combined.includes('schwarz') || tags['brand:wikidata'] === 'Q1573024') {
          continue;
        }
        retailerId = 'netto';
        retailerName = 'Netto Marken-Discount';
        isAvailable = true;
      } else if (combined.includes('edeka')) {
        retailerId = 'edeka';
        retailerName = 'EDEKA';
      } else if (combined.includes('rewe')) {
        retailerId = 'rewe';
        retailerName = 'REWE';
      } else if (combined.includes('lidl')) {
        retailerId = 'lidl';
        retailerName = 'Lidl';
      } else if (combined.includes('aldi')) {
        retailerId = combined.includes('nord') ? 'aldi-nord' : 'aldi-sued';
        retailerName = combined.includes('nord') ? 'ALDI Nord' : 'ALDI Süd';
      } else if (combined.includes('penny')) {
        retailerId = 'penny';
        retailerName = 'Penny';
      } else if (combined.includes('kaufland')) {
        retailerId = 'kaufland';
        retailerName = 'Kaufland';
      } else {
        continue;
      }

      const dedupeKey = `${retailerId}-${elLat.toFixed(3)}-${elLon.toFixed(3)}`;
      if (seenNamesAndCoords.has(dedupeKey)) continue;
      seenNamesAndCoords.add(dedupeKey);

      const streetName = tags['addr:street'] || '';
      const houseNumber = tags['addr:housenumber'] || '';
      const street = streetName ? (houseNumber ? `${streetName} ${houseNumber}` : streetName) : '';
      const postalCode = tags['addr:postcode'] || '';
      const city = tags['addr:city'] || tags['addr:town'] || location.city || 'Deutschland';
      const formattedAddress = street
        ? `${street}, ${postalCode} ${city}`.trim()
        : `${postalCode} ${city}`.trim();

      branches.push({
        id: `osm-${el.id}`,
        placeId: `osm-${el.id}`,
        retailerId,
        retailerName,
        brand: retailerName,
        name: name || retailerName,
        street,
        postalCode,
        city,
        formattedAddress: formattedAddress || `${retailerName}, ${city}`,
        lat: elLat,
        lng: elLon,
        isOpenNow: undefined,
        isAvailable
      });
    }

    return branches;
  }

  /**
   * Generates a verified Google Maps Directions URL to navigate to the store.
   */
  getDirectionsUrl(branch: StoreBranch): string {
    const destination = encodeURIComponent(
      branch.formattedAddress || `${branch.street}, ${branch.postalCode} ${branch.city}`
    );
    const placeIdParam = branch.placeId && !branch.placeId.startsWith('osm-')
      ? `&destination_place_id=${branch.placeId}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}${placeIdParam}`;
  }
}
