import { Injectable } from '@angular/core';
import { ProductItem } from '../../models/product.model';

export interface CommercialFeedPayload {
  licenseKey: string;
  provider: string; // e.g., 'RetailDataServices GmbH'
  validUntil: string;
  items: Array<{
    gtin: string;
    tradeItemDescription: string;
    brandName: string;
    netContent: number;
    netContentUnit: string;
    retailPriceEuro: number;
    recommendedRetailPrice?: number;
    validFromDate: string;
    validToDate?: string;
    storeChain: string; // Strikte Validierung auf 'Netto Marken-Discount'
    imageUrl?: string;
    caloriesKcal100g: number;
    protein100g: number;
    carbs100g: number;
    fat100g: number;
    fiber100g?: number;
    allergens?: string[];
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class LicensedRetailDataAdapter {
  /**
   * Prüft die Lizenzgültigkeit eines kommerziellen Datenfeeds.
   */
  validateLicense(licenseKey: string): boolean {
    // Vorbereitung für kommerzielle Datenlieferung (z.B. GS1 Sync / Lizenzserver)
    return Boolean(licenseKey && licenseKey.startsWith('NETTO-COMMERCIAL-DATA-'));
  }

  /**
   * Verarbeitet lizenzierte Discounterdaten und überführt sie in das Down-Kilos-Format.
   */
  processCommercialFeed(payload: CommercialFeedPayload): {
    success: boolean;
    products: Partial<ProductItem>[];
    message: string;
  } {
    if (!this.validateLicense(payload.licenseKey)) {
      return {
        success: false,
        products: [],
        message: 'Ungültiger oder abgelaufener Lizenzschlüssel für kommerzielle Discounterdaten.'
      };
    }

    const validProducts: Partial<ProductItem>[] = [];

    for (const item of payload.items) {
      // Strikte Trennung: Nur Netto Marken-Discount zulassen
      const chain = (item.storeChain || '').toLowerCase();
      if (!chain.includes('netto') || chain.includes('hund') || chain.includes('scottie')) {
        continue;
      }

      validProducts.push({
        id: `licensed-${item.gtin}`,
        ean: item.gtin,
        name: item.tradeItemDescription,
        brand: item.brandName,
        category: 'pantry',
        packageSize: `${item.netContent} ${item.netContentUnit}`,
        packageWeightGrams: item.netContentUnit.toLowerCase() === 'kg' ? item.netContent * 1000 : item.netContent,
        price: Math.round(item.retailPriceEuro * 100) / 100,
        priceUnit: '€',
        priceStatus: 'licensed_data',
        dataSource: 'licensed_retail',
        priceSource: `Lizenzierter Datenfeed (${payload.provider})`,
        lastUpdated: item.validFromDate || new Date().toISOString().split('T')[0],
        validFrom: item.validFromDate,
        validUntil: item.validToDate,
        retailer: 'netto_marken_discount',
        retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
        imageUrl: item.imageUrl || 'images/products/rice.jpg',
        imageSource: `Lizenzierte Bilddatenbank (${payload.provider})`,
        imageLicense: 'Kommerzielle Handelslizenz',
        dataQualityStatus: 'verified',
        allergens: item.allergens || [],
        nutrition: {
          caloriesPer100g: item.caloriesKcal100g,
          proteinPer100g: item.protein100g,
          carbsPer100g: item.carbs100g,
          fatPer100g: item.fat100g,
          fiberPer100g: item.fiber100g || 0
        }
      });
    }

    return {
      success: true,
      products: validProducts,
      message: `${validProducts.length} lizenzierte Netto-Produkte erfolgreich verarbeitet.`
    };
  }
}
