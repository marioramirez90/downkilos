import { TestBed } from '@angular/core/testing';
import { PriceService } from './price.service';

describe('PriceService', () => {
  let service: PriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format numbers into German currency notation (e.g. 2,99 €)', () => {
    expect(service.formatPrice(2.99)).toBe('2,99 €');
    expect(service.formatPrice(0.89)).toBe('0,89 €');
  });

  it('should return "Preis nicht verfügbar" when price is null', () => {
    expect(service.formatPrice(null)).toBe('Preis nicht verfügbar');
    expect(service.formatPrice(undefined)).toBe('Preis nicht verfügbar');
  });

  it('should calculate portion price accurately', () => {
    // 2.99 € for 400g package, recipe uses 150g
    // (2.99 / 400) * 150 = 1.12125 -> 1.12 €
    const portionPrice = service.calculatePortionPrice(2.99, 150, 400);
    expect(portionPrice).toBe(1.12);
  });

  it('should return correct status badges', () => {
    expect(service.getStatusBadge('verified').label).toBe('Verifiziert');
    expect(service.getStatusBadge('missing').label).toBe('Preis fehlt');
    expect(service.getStatusBadge('user_reported').label).toBe('Selbst erfasst');
  });
});
