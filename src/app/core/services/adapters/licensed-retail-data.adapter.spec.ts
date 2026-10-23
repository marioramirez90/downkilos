import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LicensedRetailDataAdapter, CommercialFeedPayload } from './licensed-retail-data.adapter';

describe('LicensedRetailDataAdapter', () => {
  let adapter: LicensedRetailDataAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LicensedRetailDataAdapter]
    });
    adapter = TestBed.inject(LicensedRetailDataAdapter);
  });

  it('should validate license keys properly', () => {
    expect(adapter.validateLicense('NETTO-COMMERCIAL-DATA-XYZ789')).toBe(true);
    expect(adapter.validateLicense('INVALID-KEY')).toBe(false);
    expect(adapter.validateLicense('')).toBe(false);
  });

  it('should reject commercial feeds with invalid license', () => {
    const payload: CommercialFeedPayload = {
      licenseKey: 'INVALID-KEY',
      provider: 'Test Provider',
      validUntil: '2026-12-31',
      items: []
    };

    const res = adapter.processCommercialFeed(payload);
    expect(res.success).toBe(false);
    expect(res.products.length).toBe(0);
  });

  it('should process licensed Netto items and exclude non-Netto items', () => {
    const payload: CommercialFeedPayload = {
      licenseKey: 'NETTO-COMMERCIAL-DATA-TEST123',
      provider: 'Retail Data Hub',
      validUntil: '2026-12-31',
      items: [
        {
          gtin: '4311501901128',
          tradeItemDescription: 'Bio Bananen',
          brandName: 'BioBio',
          netContent: 1,
          netContentUnit: 'kg',
          retailPriceEuro: 1.69,
          validFromDate: '2026-10-20',
          storeChain: 'Netto Marken-Discount',
          caloriesKcal100g: 89,
          protein100g: 1.1,
          carbs100g: 22.8,
          fat100g: 0.3
        },
        {
          gtin: '9999999999999',
          tradeItemDescription: 'Dänische Butter',
          brandName: 'Scottie',
          netContent: 250,
          netContentUnit: 'g',
          retailPriceEuro: 2.19,
          validFromDate: '2026-10-20',
          storeChain: 'Netto mit dem Hund', // Should be strictly excluded
          caloriesKcal100g: 700,
          protein100g: 1,
          carbs100g: 1,
          fat100g: 80
        }
      ]
    };

    const res = adapter.processCommercialFeed(payload);
    expect(res.success).toBe(true);
    expect(res.products.length).toBe(1);
    expect(res.products[0].name).toBe('Bio Bananen');
    expect(res.products[0].priceStatus).toBe('licensed_data');
  });
});
