import { TestBed } from '@angular/core/testing';
import { RetailerService } from './retailer.service';
import { StorageService } from './storage.service';

describe('RetailerService', () => {
  let service: RetailerService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetailerService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return Netto Marken-Discount as the only available retailer in V1', () => {
    const retailers = service.getRetailers();
    const available = retailers.filter(r => r.isAvailable);
    expect(available.length).toBe(1);
    expect(available[0].id).toBe('netto');
  });

  it('should find verified Netto branch by postal code or city', () => {
    const branchBerlin = service.findNettoBranch('10115');
    expect(branchBerlin.city).toContain('Berlin');
    expect(branchBerlin.postalCode).toBe('10115');

    const branchHamburg = service.findNettoBranch('Hamburg');
    expect(branchHamburg.city).toContain('Hamburg');
  });

  it('should save and load retailer preferences', async () => {
    await service.savePreference({
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      postalCode: '10115',
      city: 'Berlin – Mitte',
      weeklyBudget: 50
    });

    const loaded = await service.loadPreference();
    expect(loaded?.weeklyBudget).toBe(50);
  });
});
