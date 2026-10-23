import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NettoOfferImportAdapter } from './netto-offer-import.adapter';

describe('NettoOfferImportAdapter', () => {
  let adapter: NettoOfferImportAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NettoOfferImportAdapter]
    });
    adapter = TestBed.inject(NettoOfferImportAdapter);
  });

  it('should identify valid vs expired promotional offers', () => {
    // Gueltig bis 2026-10-25 mit Referenz 2026-10-22 -> true
    expect(adapter.isOfferCurrentlyValid('2026-10-20', '2026-10-25', '2026-10-22')).toBe(true);

    // Abgelaufen am 2026-10-15 mit Referenz 2026-10-22 -> false
    expect(adapter.isOfferCurrentlyValid('2026-10-10', '2026-10-15', '2026-10-22')).toBe(false);

    // Zukunftsangebot ab 2026-11-01 -> false
    expect(adapter.isOfferCurrentlyValid('2026-11-01', '2026-11-07', '2026-10-22')).toBe(false);
  });

  it('should assign confirmed_offer to active promotions and last_observed to expired ones', () => {
    expect(adapter.determinePriceStatus('2026-01-01', '2030-01-01')).toBe('confirmed_offer');
    expect(adapter.determinePriceStatus('2020-01-01', '2020-01-07')).toBe('last_observed');
  });

  it('should parse verified Netto JSON offers', () => {
    const jsonStr = JSON.stringify([
      {
        ean: '4311501712090',
        name: 'Deutsche Bio Möhren',
        brand: 'BioBio',
        price: 1.19,
        validFrom: '2026-10-20',
        validUntil: '2026-10-25'
      }
    ]);

    const results = adapter.parseOffersFromJson(jsonStr);
    expect(results.length).toBe(1);
    expect(results[0].ean).toBe('4311501712090');
    expect(results[0].price).toBe(1.19);
    expect(results[0].retailerScope).toContain('ohne Hund');
  });

  it('should parse verified Netto CSV offers', () => {
    const csvStr = `EAN;Name;Marke;Kategorie;Menge;Gramm;Preis;GueltigVon;GueltigBis;Region
4311501712090;Deutsche Bio Möhren;BioBio;fruits_veg;1 kg;1000;1,19;2026-10-20;2026-10-25;Bundesweit`;

    const results = adapter.parseOffersFromCsv(csvStr);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Deutsche Bio Möhren');
    expect(results[0].price).toBe(1.19);
    expect(results[0].packageWeightGrams).toBe(1000);
  });
});
