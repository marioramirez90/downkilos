import { TestBed } from '@angular/core/testing';
import { GoogleMapsLoaderService, LOCAL_STORAGE_MAPS_KEY } from './google-maps-loader.service';

describe('GoogleMapsLoaderService', () => {
  let service: GoogleMapsLoaderService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleMapsLoaderService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and read API key from localStorage', () => {
    service.setApiKey('AIzaSyTestKey123456');
    expect(localStorage.getItem(LOCAL_STORAGE_MAPS_KEY)).toBe('AIzaSyTestKey123456');
    expect(service.hasApiKey()).toBe(true);
  });

  it('should handle missing API key cleanly', async () => {
    service.setApiKey('');
    expect(service.hasApiKey()).toBe(false);
    await expect(service.loadGoogleMaps()).rejects.toThrow();
  });
});
