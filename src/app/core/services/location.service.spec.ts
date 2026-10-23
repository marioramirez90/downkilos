import { TestBed } from '@angular/core/testing';
import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate Haversine distance correctly in kilometers', () => {
    // Alexanderplatz Berlin: 52.5219, 13.4132
    // Brandenburger Tor Berlin: 52.5163, 13.3777
    const dist = service.calculateHaversineDistanceKm(52.5219, 13.4132, 52.5163, 13.3777);
    expect(dist).toBeGreaterThan(2.0);
    expect(dist).toBeLessThan(3.0);
  });

  it('should reject invalid or empty query when geocoding', async () => {
    await expect(service.geocodeAddress('')).rejects.toThrow();
    await expect(service.geocodeAddress(' ')).rejects.toThrow();
  });
});
