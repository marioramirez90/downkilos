import { TestBed } from '@angular/core/testing';
import { NearbyStoresService } from './nearby-stores.service';
import { StoreBranch } from '../models/retailer.model';

describe('NearbyStoresService', () => {
  let service: NearbyStoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NearbyStoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate verified Google Maps directions URL', () => {
    const store: StoreBranch = {
      id: 'store-1',
      placeId: 'ChIJTestPlaceId',
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      brand: 'Netto Marken-Discount',
      name: 'Netto Marken-Discount',
      street: 'Invalidenstraße 158',
      postalCode: '10115',
      city: 'Berlin',
      formattedAddress: 'Invalidenstraße 158, 10115 Berlin',
      lat: 52.5305,
      lng: 13.3888,
      isAvailable: true
    };

    const url = service.getDirectionsUrl(store);
    expect(url).toContain('https://www.google.com/maps/dir/?api=1');
    expect(url).toContain('destination_place_id=ChIJTestPlaceId');
    expect(url).toContain('Invalidenstra%C3%9Fe');
  });
});
