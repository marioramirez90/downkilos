import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenPricesAdapter } from './open-prices.adapter';

describe('OpenPricesAdapter', () => {
  let adapter: OpenPricesAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpenPricesAdapter]
    });
    adapter = TestBed.inject(OpenPricesAdapter);
  });

  it('should distinguish Netto Marken-Discount from Netto mit dem Hund', () => {
    // Netto Marken-Discount (rot-gelb) -> true
    expect(adapter.isNettoMarkenDiscountLocation('Netto Marken-Discount Filiale', 'Netto Marken-Discount')).toBe(true);
    expect(adapter.isNettoMarkenDiscountLocation('Netto Supermarkt', 'Netto')).toBe(true);

    // Dänisches Netto / Scottie / Netto mit dem Hund -> FALSE
    expect(adapter.isNettoMarkenDiscountLocation('Netto mit dem Hund', 'Netto ApS')).toBe(false);
    expect(adapter.isNettoMarkenDiscountLocation('Netto Scottie', 'Netto')).toBe(false);
    expect(adapter.isNettoMarkenDiscountLocation('Dänischer Netto Markt', 'Netto')).toBe(false);
  });

  it('should find latest price from records', () => {
    const records = [
      { ean: '123', price: 1.49, date: '2026-10-10', location: 'Netto', source: 'OP', isNettoMarkenDiscount: true },
      { ean: '123', price: 1.69, date: '2026-10-22', location: 'Netto', source: 'OP', isNettoMarkenDiscount: true },
      { ean: '123', price: 1.39, date: '2026-10-01', location: 'Netto', source: 'OP', isNettoMarkenDiscount: true }
    ];

    const latest = adapter.getLatestPrice(records);
    expect(latest?.price).toBe(1.69);
    expect(latest?.date).toBe('2026-10-22');
  });

  it('should handle empty records', () => {
    expect(adapter.getLatestPrice([])).toBeNull();
  });
});
