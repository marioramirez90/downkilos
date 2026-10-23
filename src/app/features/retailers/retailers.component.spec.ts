import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RetailersComponent } from './retailers.component';
import { RetailerService } from '../../core/services/retailer.service';
import { LocationService } from '../../core/services/location.service';
import { NearbyStoresService } from '../../core/services/nearby-stores.service';
import { StoreBranch, UserLocation } from '../../core/models/retailer.model';

describe('RetailersComponent', () => {
  let component: RetailersComponent;
  let fixture: ComponentFixture<RetailersComponent>;
  let router: Router;
  let retailerService: RetailerService;
  let locationService: LocationService;
  let nearbyStoresService: NearbyStoresService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RetailersComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    router = TestBed.inject(Router);
    retailerService = TestBed.inject(RetailerService);
    locationService = TestBed.inject(LocationService);
    nearbyStoresService = TestBed.inject(NearbyStoresService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RetailersComponent);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the retailers component', () => {
    expect(component).toBeTruthy();
  });

  it('should show location prompt section', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Wo möchtest du einkaufen?');
    expect(el.textContent).toContain('Aktuellen Standort ermitteln');
  });

  it('should handle GPS location request when clicking locateMe', async () => {
    const mockLoc: UserLocation = {
      lat: 52.52,
      lng: 13.40,
      formattedAddress: 'Alexanderplatz 1, 10178 Berlin',
      postalCode: '10178',
      city: 'Berlin',
      isGps: true
    };
    vi.spyOn(locationService, 'getCurrentPosition').mockResolvedValue(mockLoc);
    vi.spyOn(nearbyStoresService, 'searchStores').mockResolvedValue([]);

    await component.locateMe();
    fixture.detectChanges();

    expect(component.confirmedLocation()?.formattedAddress).toBe('Alexanderplatz 1, 10178 Berlin');
    expect(component.addressControl.value).toBe('Alexanderplatz 1, 10178 Berlin');
  });

  it('should handle manual address submission and search nearby stores', async () => {
    const mockLoc: UserLocation = {
      lat: 53.55,
      lng: 9.99,
      formattedAddress: 'Mönckebergstraße 1, 20095 Hamburg',
      postalCode: '20095',
      city: 'Hamburg',
      isGps: false
    };
    vi.spyOn(locationService, 'geocodeAddress').mockResolvedValue(mockLoc);
    const searchSpy = vi.spyOn(nearbyStoresService, 'searchStores').mockResolvedValue([]);

    component.addressControl.setValue('Hamburg');
    await component.submitManualAddress();
    fixture.detectChanges();

    expect(searchSpy).toHaveBeenCalledWith(mockLoc, 5);
    expect(component.confirmedLocation()?.city).toBe('Hamburg');
  });

  it('should allow selecting Netto branch and save on confirm', async () => {
    const nettoStore: StoreBranch = {
      id: 'netto-test',
      placeId: 'netto-place-1',
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      brand: 'Netto Marken-Discount',
      name: 'Netto Marken-Discount',
      street: 'Hauptstraße 10',
      postalCode: '10115',
      city: 'Berlin',
      formattedAddress: 'Hauptstraße 10, 10115 Berlin',
      lat: 52.53,
      lng: 13.38,
      distanceKm: 0.8,
      isAvailable: true
    };

    component.onSelectStore(nettoStore);
    expect(component.selectedStore()?.id).toBe('netto-test');

    const saveSpy = vi.spyOn(retailerService, 'savePreference');
    await component.confirmSelection();

    expect(saveSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show coming soon notice when selecting non-Netto store', () => {
    const reweStore: StoreBranch = {
      id: 'rewe-test',
      retailerId: 'rewe',
      retailerName: 'REWE',
      brand: 'REWE',
      name: 'REWE',
      street: 'Kastanienallee 5',
      postalCode: '10435',
      city: 'Berlin',
      formattedAddress: 'Kastanienallee 5, 10435 Berlin',
      lat: 52.54,
      lng: 13.41,
      distanceKm: 1.2,
      isAvailable: false
    };

    component.onSelectStore(reweStore);
    fixture.detectChanges();

    expect(component.comingSoonNotice()).toContain('REWE');
    expect(component.comingSoonNotice()).toContain('demnächst');
  });
});
