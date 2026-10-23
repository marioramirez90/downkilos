import { Injectable, inject } from '@angular/core';
import { Retailer, RetailerPreference, StoreBranch, SUPPORTED_RETAILERS } from '../models/retailer.model';
import { StorageService } from './storage.service';
import { LocationService } from './location.service';
import { NearbyStoresService } from './nearby-stores.service';

@Injectable({
  providedIn: 'root'
})
export class RetailerService {
  private storageService = inject(StorageService);
  private locationService = inject(LocationService);
  private nearbyStoresService = inject(NearbyStoresService);

  getRetailers(): Retailer[] {
    return SUPPORTED_RETAILERS;
  }

  getNettoRetailer(): Retailer {
    return SUPPORTED_RETAILERS.find(r => r.id === 'netto')!;
  }

  async savePreference(pref: RetailerPreference): Promise<void> {
    await this.storageService.saveRetailerPreference(pref);
  }

  async loadPreference(): Promise<RetailerPreference | null> {
    return this.storageService.loadRetailerPreference();
  }

  /**
   * Search real Netto and other supermarkets around an address query.
   */
  async searchStoresForQuery(query: string, radiusKm: number = 5): Promise<StoreBranch[]> {
    const location = await this.locationService.geocodeAddress(query);
    return this.nearbyStoresService.searchStores(location, radiusKm);
  }

  /**
   * Search real Netto and other supermarkets around GPS coordinates.
   */
  async searchStoresForGps(radiusKm: number = 5): Promise<StoreBranch[]> {
    const location = await this.locationService.getCurrentPosition();
    return this.nearbyStoresService.searchStores(location, radiusKm);
  }
}
