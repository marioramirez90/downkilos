import { Injectable, inject } from '@angular/core';
import { ProductItem } from '../models/product.model';
import { ProductService } from './product.service';
import { OpenFoodFactsAdapter } from './adapters/open-food-facts.adapter';
import { classifyProductCategory, getProductServingDetail } from './product-classifier.util';

export interface ProductLookupResult {
  found: boolean;
  source: 'local_catalog' | 'open_food_facts' | 'none';
  product: ProductItem | null;
  errorMessage?: string;
  rawEan: string;
}

export interface IProductLookupService {
  lookupByBarcode(barcode: string): Promise<ProductLookupResult>;
}

@Injectable({
  providedIn: 'root'
})
export class ProductLookupService implements IProductLookupService {
  private productService = inject(ProductService);
  private offAdapter = inject(OpenFoodFactsAdapter);

  /**
   * Normalisiert und bereinigt den Barcode (EAN-13, EAN-8, UPC-A, UPC-E).
   */
  normalizeBarcode(barcode: string): string {
    return (barcode || '').trim().replace(/[^0-9]/g, '');
  }

  /**
   * 2-Stufen-Suche nach Barcode:
   * 1. Suche im lokalen Down-Kilos-Katalog (1.003+ Netto-Artikel)
   * 2. Falls nicht vorhanden: Abfrage der offiziellen Open Food Facts API (v3/v2)
   */
  async lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
    const cleanEan = this.normalizeBarcode(barcode);
    if (!cleanEan || cleanEan.length < 8 || cleanEan.length > 14) {
      return {
        found: false,
        source: 'none',
        product: null,
        errorMessage: 'Ungültiger Barcode. Bitte prüfe die Ziffern (8-14 Ziffern erforderlich).',
        rawEan: barcode
      };
    }

    // Stufe 1: Lokaler Produktkatalog
    const localProducts = this.productService.products();
    const localMatch = localProducts.find(p => {
      if (!p.ean) return false;
      const pClean = p.ean.trim().replace(/[^0-9]/g, '');
      if (pClean === cleanEan) return true;
      // Berücksichtige führende Nullen bei UPC-A / EAN-13 Konvertierung
      return pClean.replace(/^0+/, '') === cleanEan.replace(/^0+/, '');
    });

    if (localMatch) {
      return {
        found: true,
        source: 'local_catalog',
        product: localMatch,
        rawEan: cleanEan
      };
    }

    // Stufe 2: Prüfung der Internetverbindung vor API-Aufruf
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        found: false,
        source: 'none',
        product: null,
        errorMessage: 'Keine Internetverbindung verfügbar. Bitte prüfe dein Netzwerk.',
        rawEan: cleanEan
      };
    }

    // Stufe 3: Open Food Facts API
    try {
      const offData = await this.offAdapter.fetchProductByBarcode(cleanEan);
      if (offData && offData.name && offData.nutrition) {
        const category = classifyProductCategory({
          name: offData.name,
          packageSize: offData.packageSize,
          id: `off-${cleanEan}`
        });

        const serving = getProductServingDetail({
          name: offData.name,
          packageWeightGrams: offData.packageWeightGrams,
          nutrition: offData.nutrition
        });

        const newProduct: ProductItem = {
          id: `off-${cleanEan}`,
          ean: cleanEan,
          name: offData.name,
          brand: offData.brand || 'Handelsmarke',
          category: category,
          packageSize: offData.packageSize || '1 Packung',
          packageWeightGrams: offData.packageWeightGrams || 500,
          servingSizeGrams: serving.servingWeightGrams,
          pieceUnitName: serving.pieceUnitName,
          servingUnit: serving.servingLabel,
          nutrition: offData.nutrition,
          price: null, // Keine erfundenen Preise!
          priceUnit: '€',
          priceStatus: 'unknown',
          priceSource: 'Preis nicht verfügbar',
          dataSource: 'open_food_facts',
          lastUpdated: new Date().toISOString().split('T')[0],
          retailer: 'netto_marken_discount',
          retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
          imageUrl: offData.imageUrl || 'https://images.openfoodfacts.net/images/products/placeholder.jpg',
          imageSource: offData.imageSource || 'Open Food Facts (world.openfoodfacts.org)',
          imageLicense: offData.imageLicense || 'ODbL / CC-BY-SA',
          dataQualityStatus: offData.nutrition.caloriesPer100g > 0 ? 'verified' : 'partial',
          allergens: offData.allergens || [],
          ingredientsText: offData.ingredientsText || ''
        };

        // Produkt sofort in den App-Katalog aufnehmen
        this.productService.addProduct(newProduct);

        return {
          found: true,
          source: 'open_food_facts',
          product: newProduct,
          rawEan: cleanEan
        };
      }
    } catch (err) {
      console.warn('[ProductLookupService] Fehler beim Open Food Facts Abruf:', err);
      return {
        found: false,
        source: 'none',
        product: null,
        errorMessage: 'Verbindung zu Open Food Facts fehlgeschlagen. Bitte versuche es erneut.',
        rawEan: cleanEan
      };
    }

    // Stufe 4: Kein Produkt gefunden
    return {
      found: false,
      source: 'none',
      product: null,
      errorMessage: 'Produkt noch nicht gefunden',
      rawEan: cleanEan
    };
  }
}
