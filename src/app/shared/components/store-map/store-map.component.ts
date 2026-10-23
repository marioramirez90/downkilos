/// <reference types="google.maps" />
import {
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  computed,
  signal,
  effect,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreBranch, UserLocation } from '../../../core/models/retailer.model';
import { GoogleMapsLoaderService } from '../../../core/services/google-maps-loader.service';
import { NearbyStoresService } from '../../../core/services/nearby-stores.service';

@Component({
  selector: 'app-store-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store-map.component.html',
  styleUrl: './store-map.component.scss'
})
export class StoreMapComponent implements OnDestroy {
  @ViewChild('mapCanvas') mapCanvasRef?: ElementRef<HTMLDivElement>;

  private mapsLoader = inject(GoogleMapsLoaderService);
  private nearbyStoresService = inject(NearbyStoresService);

  userLocation = input<UserLocation | null>(null);
  stores = input<StoreBranch[]>([]);
  selectedStore = input<StoreBranch | null>(null);

  storeSelected = output<StoreBranch>();
  routeRequested = output<StoreBranch>();

  isGoogleMapActive = signal<boolean>(false);

  private googleMapInstance: google.maps.Map | null = null;
  private userMarker: google.maps.Marker | null = null;
  private storeMarkers: google.maps.Marker[] = [];

  constructor() {
    // React to changes in user location or stores to update Google Map
    effect(() => {
      const loc = this.userLocation();
      const list = this.stores();
      const isLoaded = this.mapsLoader.isLoaded();

      if (isLoaded && loc && this.mapCanvasRef?.nativeElement) {
        this.initOrUpdateGoogleMap(loc, list);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearMarkers();
  }

  onSelectStore(store: StoreBranch): void {
    this.storeSelected.emit(store);
  }

  openRoute(store: StoreBranch): void {
    const url = this.nearbyStoresService.getDirectionsUrl(store);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    this.routeRequested.emit(store);
  }

  /**
   * Relative SVG coordinate projection for visual map fallback
   */
  readonly svgStorePoints = computed(() => {
    const loc = this.userLocation();
    const list = this.stores();
    if (!loc || list.length === 0) return [];

    // Scale lat/lng deltas to 10-90 SVG space around center (50, 50)
    const latSpan = 0.045; // ~5km in lat
    const lngSpan = 0.065; // ~5km in lng

    return list.map((s) => {
      const dLat = s.lat - loc.lat;
      const dLng = s.lng - loc.lng;

      // Invert Y for screen coordinates (north is up)
      const x = Math.max(10, Math.min(90, 50 + (dLng / lngSpan) * 40));
      const y = Math.max(10, Math.min(90, 50 - (dLat / latSpan) * 40));

      return {
        store: s,
        x: Math.round(x),
        y: Math.round(y)
      };
    });
  });

  private initOrUpdateGoogleMap(location: UserLocation, storeList: StoreBranch[]): void {
    if (typeof google === 'undefined' || !google.maps) return;
    const canvas = this.mapCanvasRef?.nativeElement;
    if (!canvas) return;

    this.isGoogleMapActive.set(true);

    const center = new google.maps.LatLng(location.lat, location.lng);

    if (!this.googleMapInstance) {
      this.googleMapInstance = new google.maps.Map(canvas, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
    } else {
      this.googleMapInstance.setCenter(center);
    }

    this.clearMarkers();

    // 1. Add User Marker
    this.userMarker = new google.maps.Marker({
      position: center,
      map: this.googleMapInstance,
      title: 'Dein Standort',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#278F39',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      }
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(center);

    // 2. Add Supermarket Markers
    storeList.forEach((store) => {
      const pos = new google.maps.LatLng(store.lat, store.lng);
      bounds.extend(pos);

      const isNetto = store.isAvailable;
      const marker = new google.maps.Marker({
        position: pos,
        map: this.googleMapInstance,
        title: store.brand + ' - ' + store.name,
        icon: isNetto
          ? {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                  <circle cx="15" cy="15" r="14" fill="#FFF200" stroke="#ED1C24" stroke-width="2.5"/>
                  <text x="15" y="19" font-size="11" font-weight="900" fill="#ED1C24" text-anchor="middle" font-family="sans-serif">N</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(30, 30)
            }
          : {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#64748B" stroke="#FFFFFF" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24)
            }
      });

      marker.addListener('click', () => {
        this.onSelectStore(store);
      });

      this.storeMarkers.push(marker);
    });

    if (storeList.length > 0 && this.googleMapInstance) {
      this.googleMapInstance.fitBounds(bounds);
    }
  }

  private clearMarkers(): void {
    if (this.userMarker) {
      this.userMarker.setMap(null);
      this.userMarker = null;
    }
    this.storeMarkers.forEach((m) => m.setMap(null));
    this.storeMarkers = [];
  }
}
