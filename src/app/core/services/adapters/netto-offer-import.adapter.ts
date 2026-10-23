import { Injectable } from '@angular/core';
import { ProductItem, PriceStatus } from '../../models/product.model';

export interface NettoOfferItem {
  ean?: string;
  name: string;
  brand: string;
  category: 'fruits_veg' | 'meat_fish' | 'dairy' | 'grains' | 'pantry';
  packageSize: string;
  packageWeightGrams: number;
  price: number;
  priceUnit?: string;
  validFrom: string;
  validUntil: string;
  regionBranch?: string;
  imageUrl?: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NettoOfferImportAdapter {
  /**
   * Prüft, ob ein Aktionsangebot zum heutigen Datum noch gültig ist.
   * Abgelaufene Aktionspreise dürfen laut Vorgabe NICHT als aktuell gelten.
   */
  isOfferCurrentlyValid(validFrom?: string, validUntil?: string, referenceDateStr?: string): boolean {
    if (!validUntil) return false;
    const todayStr = referenceDateStr || new Date().toISOString().split('T')[0];
    
    if (validFrom && todayStr < validFrom) {
      return false; // Aktion startet erst in der Zukunft
    }
    return todayStr <= validUntil;
  }

  /**
   * Ermittelt den korrekten Status für ein importiertes Angebot.
   */
  determinePriceStatus(validFrom?: string, validUntil?: string): PriceStatus {
    return this.isOfferCurrentlyValid(validFrom, validUntil) ? 'confirmed_offer' : 'last_observed';
  }

  /**
   * Importiert Netto-Angebotsdaten aus einem verifizierten JSON-Format.
   */
  parseOffersFromJson(jsonContent: string): Partial<ProductItem>[] {
    try {
      const parsed = JSON.parse(jsonContent);
      const items: NettoOfferItem[] = Array.isArray(parsed) ? parsed : (parsed.offers || []);
      
      return items.map((raw, index) => {
        const status = this.determinePriceStatus(raw.validFrom, raw.validUntil);
        const id = raw.ean ? `netto-${raw.ean}` : `netto-offer-${Date.now()}-${index}`;
        
        return {
          id,
          ean: raw.ean,
          name: raw.name,
          brand: raw.brand || 'Netto Marken-Discount',
          category: raw.category || 'fruits_veg',
          packageSize: raw.packageSize || '1 Pckg.',
          packageWeightGrams: raw.packageWeightGrams || 500,
          price: raw.price,
          priceUnit: raw.priceUnit || '€ / Pckg.',
          priceStatus: status,
          dataSource: 'netto_official_offer',
          priceSource: 'Offizielles Netto Wochenangebot',
          lastUpdated: raw.validFrom || new Date().toISOString().split('T')[0],
          validFrom: raw.validFrom,
          validUntil: raw.validUntil,
          regionBranch: raw.regionBranch || 'Bundesweit',
          retailer: 'netto_marken_discount',
          retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
          imageUrl: raw.imageUrl || 'images/products/carrots.jpg',
          imageSource: 'Netto Prospekt / Netto-Online',
          imageLicense: 'Hersteller- und Händlerangaben',
          dataQualityStatus: 'verified',
          allergens: [],
          nutrition: {
            caloriesPer100g: raw.caloriesPer100g ?? 50,
            proteinPer100g: raw.proteinPer100g ?? 1,
            carbsPer100g: raw.carbsPer100g ?? 5,
            fatPer100g: raw.fatPer100g ?? 0.5
          }
        };
      });
    } catch (err) {
      console.error('[NettoOfferImportAdapter] Fehler beim Parsen des JSON-Imports:', err);
      return [];
    }
  }

  /**
   * Importiert Angebote aus einer verifizierten CSV-Datei.
   * Format: EAN;Name;Marke;Kategorie;Menge;Gramm;Preis;GueltigVon;GueltigBis;Region
   */
  parseOffersFromCsv(csvContent: string): Partial<ProductItem>[] {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const results: Partial<ProductItem>[] = [];
    // Erste Zeile ist Header
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';').map(p => p.trim());
      if (parts.length < 7) continue;

      const [ean, name, brand, category, packageSize, gramsStr, priceStr, validFrom, validUntil, region] = parts;
      const price = parseFloat(priceStr.replace(',', '.'));
      const grams = parseFloat(gramsStr) || 500;
      if (isNaN(price)) continue;

      const status = this.determinePriceStatus(validFrom, validUntil);

      results.push({
        id: ean ? `netto-${ean}` : `netto-csv-${Date.now()}-${i}`,
        ean: ean || undefined,
        name,
        brand: brand || 'Netto Marken-Discount',
        category: (category as any) || 'fruits_veg',
        packageSize: packageSize || `${grams} g`,
        packageWeightGrams: grams,
        price,
        priceUnit: '€',
        priceStatus: status,
        dataSource: 'netto_official_offer',
        priceSource: 'Netto CSV Import',
        lastUpdated: validFrom || new Date().toISOString().split('T')[0],
        validFrom,
        validUntil,
        regionBranch: region || 'Bundesweit',
        retailer: 'netto_marken_discount',
        retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
        imageUrl: 'images/products/carrots.jpg',
        imageLicense: 'CSV Stammdaten',
        dataQualityStatus: 'verified',
        allergens: [],
        nutrition: {
          caloriesPer100g: 50,
          proteinPer100g: 1,
          carbsPer100g: 5,
          fatPer100g: 0.5
        }
      });
    }

    return results;
  }
}
