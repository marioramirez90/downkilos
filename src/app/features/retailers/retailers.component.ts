import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Retailer, RetailerPreference, StoreBranch, UserLocation } from '../../core/models/retailer.model';
import { RetailerService } from '../../core/services/retailer.service';
import { LocationService } from '../../core/services/location.service';
import { NearbyStoresService } from '../../core/services/nearby-stores.service';
import { GoogleMapsLoaderService } from '../../core/services/google-maps-loader.service';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { StoreMapComponent } from '../../shared/components/store-map/store-map.component';

@Component({
  selector: 'app-retailers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HamburgerButtonComponent,
    TranslatePipe
  ],
  templateUrl: './retailers.component.html',
  styleUrl: './retailers.component.scss'
})
export class RetailersComponent implements OnInit {
  private router = inject(Router);
  private retailerService = inject(RetailerService);
  locationService = inject(LocationService);
  nearbyStoresService = inject(NearbyStoresService);
  mapsLoader = inject(GoogleMapsLoaderService);

  readonly allRetailers = this.retailerService.getRetailers();

  // Reactive address input control
  addressControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  // Selected store and user location
  selectedStore = signal<StoreBranch | null>(null);
  selectedRetailer = signal<string | null>(null);
  confirmedLocation = signal<UserLocation | null>(null);
  showLocationChange = signal<boolean>(false);

  weeklyBudget = 40;
  comingSoonNotice = signal<string | null>(null);
  showApiKeySettings = signal<boolean>(false);
  apiKeyInput = '';

  selectRetailer(retailer: string): void {
    if (retailer === 'netto') {
      this.selectedRetailer.set('netto');
      this.comingSoonNotice.set(null);
      const nettoBranch: StoreBranch = {
        id: 'netto-berlin-1',
        placeId: 'netto-berlin-mitte',
        retailerId: 'netto',
        retailerName: 'Netto Marken-Discount',
        brand: 'Netto Marken-Discount',
        name: 'Netto Marken-Discount',
        street: 'Friedrichstraße 100',
        postalCode: '10115',
        city: 'Berlin',
        formattedAddress: 'Friedrichstraße 100, 10115 Berlin',
        lat: 52.5200,
        lng: 13.3880,
        distanceKm: 0.5,
        isAvailable: true
      };
      this.selectedStore.set(nettoBranch);
    } else {
      const names: Record<string, string> = {
        rewe: 'REWE',
        edeka: 'EDEKA',
        aldi_nord: 'Aldi Nord',
        aldi_sued: 'Aldi Süd',
        lidl: 'Lidl',
        penny: 'Penny',
        kaufland: 'Kaufland'
      };
      const name = names[retailer] || retailer;
      this.comingSoonNotice.set(`${name}: Coming soon – aktuell ist Netto Marken-Discount verfügbar.`);
    }
  }

  async ngOnInit(): Promise<void> {
    const saved = await this.retailerService.loadPreference();
    if (saved) {
      this.weeklyBudget = saved.weeklyBudget || 40;
      if (saved.branch) {
        this.selectedStore.set(saved.branch);
        if (saved.branch.retailerId === 'netto') {
          this.selectedRetailer.set('netto');
        }
      }
      if (saved.userLocation) {
        this.confirmedLocation.set(saved.userLocation);
        this.addressControl.setValue(saved.userLocation.formattedAddress);
        // Automatically search nearby stores around the saved location
        await this.nearbyStoresService.searchStores(saved.userLocation, 5);
      } else if (saved.postalCode && saved.city) {
        // Resolve saved postal code / city
        try {
          const loc = await this.locationService.geocodeAddress(`${saved.postalCode} ${saved.city}`);
          this.confirmedLocation.set(loc);
          await this.nearbyStoresService.searchStores(loc, 5);
        } catch {
          // Keep clean without inventing data
        }
      }
    }
  }

  /**
   * Option A: Use current device GPS location via browser Geolocation API
   */
  async locateMe(): Promise<void> {
    try {
      this.comingSoonNotice.set(null);
      const loc = await this.locationService.getCurrentPosition();
      this.confirmedLocation.set(loc);
      this.addressControl.setValue(loc.formattedAddress);

      // Search real supermarkets around coordinates
      const stores = await this.nearbyStoresService.searchStores(loc, 5);
      const nearestNetto = stores.find(s => s.isAvailable);
      if (nearestNetto) {
        this.selectedStore.set(nearestNetto);
      }
    } catch {
      // Error is set inside locationService
    }
  }

  /**
   * Option B: Geocode manually entered address
   */
  async submitManualAddress(): Promise<void> {
    const query = this.addressControl.value?.trim();
    if (!query) {
      this.addressControl.markAsTouched();
      return;
    }

    try {
      this.comingSoonNotice.set(null);
      const loc = await this.locationService.geocodeAddress(query);
      this.confirmedLocation.set(loc);

      // Search real supermarkets around coordinates
      const stores = await this.nearbyStoresService.searchStores(loc, 5);
      const nearestNetto = stores.find(s => s.isAvailable);
      if (nearestNetto) {
        this.selectedStore.set(nearestNetto);
      }
    } catch {
      // Error handled inside locationService
    }
  }

  /**
   * Expand search radius (e.g. from 5 km to 10 km or 20 km)
   */
  async expandRadius(radiusKm: number): Promise<void> {
    const loc = this.confirmedLocation();
    if (!loc) return;
    await this.nearbyStoresService.searchStores(loc, radiusKm);
  }

  /**
   * Store selection handler
   */
  onSelectStore(store: StoreBranch): void {
    if (store.isAvailable) {
      // Netto Marken-Discount is active in V1
      this.selectedStore.set(store);
      this.comingSoonNotice.set(null);
    } else {
      // Other retailers (EDEKA, REWE, Lidl, etc.) receive a clear Coming Soon badge
      this.comingSoonNotice.set(
        `${store.brand} (${store.street || store.city}): Dieser Händler wird demnächst für den automatischen Einkauf unterstützt.`
      );
    }
  }

  /**
   * Open route in Google Maps
   */
  openRoute(store: StoreBranch): void {
    const url = this.nearbyStoresService.getDirectionsUrl(store);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Save custom Google Maps API key
   */
  async saveApiKey(): Promise<void> {
    await this.mapsLoader.setApiKey(this.apiKeyInput);
    this.showApiKeySettings.set(false);
    // Reload search if location exists
    const loc = this.confirmedLocation();
    if (loc) {
      await this.nearbyStoresService.searchStores(loc, this.nearbyStoresService.searchRadiusKm());
    }
  }

  goBack(): void {
    this.router.navigate(['/calculator']);
  }

  /**
   * Confirm market & budget selection and navigate to How It Works (Screen 4)
   */
  async confirmSelection(): Promise<void> {
    const branch = this.selectedStore();
    const loc = this.confirmedLocation();

    // Fallback if user confirms without clicking search
    const postalCode = branch?.postalCode || loc?.postalCode || '10115';
    const city = branch?.city || loc?.city || 'Deutschland';

    const pref: RetailerPreference = {
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      branch: branch || undefined,
      postalCode,
      city,
      weeklyBudget: Number(this.weeklyBudget),
      userLocation: loc || undefined
    };

    await this.retailerService.savePreference(pref);
    this.router.navigate(['/how-it-works']);
  }
}
