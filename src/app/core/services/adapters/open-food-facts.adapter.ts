import { Injectable } from '@angular/core';
import { ProductItem, NutritionInfo } from '../../models/product.model';

export interface OFFProductResult {
  code: string;
  product?: {
    product_name?: string;
    product_name_de?: string;
    brands?: string;
    quantity?: string;
    image_front_url?: string;
    image_url?: string;
    selected_images?: {
      front?: {
        display?: Record<string, string>;
      };
    };
    nutriments?: Record<string, number>;
    allergens_tags?: string[];
    allergens?: string;
    ingredients_text_de?: string;
    ingredients_text?: string;
  };
  status: number;
  status_verbose?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenFoodFactsAdapter {
  private readonly v3BaseUrl = 'https://world.openfoodfacts.org/api/v3/product';
  private readonly v2DeBaseUrl = 'https://de.openfoodfacts.org/api/v2/product';
  private readonly v2WorldBaseUrl = 'https://world.openfoodfacts.org/api/v2/product';
  private readonly userAgent = 'DownKilos - Android - Version 1.0 - https://downkilos.de (contact@downkilos.de)';

  // Lokaler Cache zur Schonung der Open Food Facts Server und Vermeidung von 503-Fehlern
  private memoryCache = new Map<string, Partial<ProductItem>>();

  /**
   * Ruft offizielle Produktdaten zu einem verifizierten Barcode (EAN) ab.
   * Bevorzugt die aktuelle offizielle Open Food Facts API v3 mit Fallback auf v2.
   */
  async fetchProductByBarcode(barcode: string): Promise<Partial<ProductItem> | null> {
    const cleanEan = barcode.trim();
    if (!cleanEan) return null;

    if (this.memoryCache.has(cleanEan)) {
      return this.memoryCache.get(cleanEan)!;
    }

    try {
      // 1. Offizielle API v3 anfragen
      const v3Response = await this.queryOFF(`${this.v3BaseUrl}/${cleanEan}.json`);
      if (v3Response && (v3Response.status === 1 || (v3Response as any).status === 'success') && v3Response.product) {
        const item = this.mapOFFToProduct(cleanEan, v3Response.product);
        this.memoryCache.set(cleanEan, item);
        return item;
      }

      // 2. Fallback: Deutsche v2-Instanz
      const v2Response = await this.queryOFF(`${this.v2DeBaseUrl}/${cleanEan}.json`);
      if (v2Response && v2Response.status === 1 && v2Response.product) {
        const item = this.mapOFFToProduct(cleanEan, v2Response.product);
        this.memoryCache.set(cleanEan, item);
        return item;
      }

      // 3. Fallback: World v2-Instanz
      const worldResponse = await this.queryOFF(`${this.v2WorldBaseUrl}/${cleanEan}.json`);
      if (worldResponse && worldResponse.status === 1 && worldResponse.product) {
        const item = this.mapOFFToProduct(cleanEan, worldResponse.product);
        this.memoryCache.set(cleanEan, item);
        return item;
      }

      return null;
    } catch (err) {
      console.warn(`[OpenFoodFactsAdapter] Abruf für EAN ${cleanEan} nicht erreichbar:`, err);
      return null;
    }
  }

  private async queryOFF(url: string): Promise<OFFProductResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.userAgent
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return null;
      }
      return (await res.json()) as OFFProductResult;
    } catch {
      return null;
    }
  }

  mapOFFToProduct(ean: string, raw: NonNullable<OFFProductResult['product']>): Partial<ProductItem> {
    const name = raw.product_name_de || raw.product_name || 'Netto Artikel';
    const brand = raw.brands?.split(',')[0]?.trim() || 'Netto Marken-Discount';
    const quantity = raw.quantity || 'Packung';
    
    // Bild ermitteln (bevorzugt deutsches Front-Foto)
    const frontDe = raw.selected_images?.front?.display?.['de'];
    const imageUrl = frontDe || raw.image_front_url || raw.image_url || 'images/products/rice.jpg';

    // Nährwerte je 100g extrahieren
    const nutriments = raw.nutriments || {};
    const calories = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0;
    const protein = nutriments['proteins_100g'] ?? 0;
    const carbs = nutriments['carbohydrates_100g'] ?? 0;
    const fat = nutriments['fat_100g'] ?? 0;
    const fiber = nutriments['fiber_100g'] ?? 0;

    const allergens = raw.allergens_tags?.map(t => t.replace('en:', '').replace('de:', '')) || [];

    const nutrition: NutritionInfo = {
      caloriesPer100g: Math.round(calories * 10) / 10,
      proteinPer100g: Math.round(protein * 10) / 10,
      carbsPer100g: Math.round(carbs * 10) / 10,
      fatPer100g: Math.round(fat * 10) / 10,
      fiberPer100g: Math.round(fiber * 10) / 10
    };

    return {
      ean,
      name,
      brand,
      packageSize: quantity,
      imageUrl,
      imageSource: 'Open Food Facts (de.openfoodfacts.org)',
      imageLicense: 'ODbL / CC-BY-SA 3.0 / 4.0 Open Food Facts contributors',
      retailer: 'netto_marken_discount',
      retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
      nutrition,
      allergens,
      ingredientsText: raw.ingredients_text_de || raw.ingredients_text || '',
      dataSource: 'open_food_facts',
      dataQualityStatus: calories > 0 ? 'verified' : 'partial'
    };
  }
}
