import { Injectable, inject, signal } from '@angular/core';
import {
  ProductCategory,
  ProductItem,
  PriceHistoryEntry,
  ImportLogEntry,
  ProductFilterOptions
} from '../models/product.model';
import { NETTO_PRODUCT_CATALOG } from '../models/netto-catalog.data';
import { OpenFoodFactsAdapter } from './adapters/open-food-facts.adapter';
import { OpenPricesAdapter } from './adapters/open-prices.adapter';
import { NettoOfferImportAdapter } from './adapters/netto-offer-import.adapter';
import { ManualPriceAdapter } from './adapters/manual-price.adapter';
import { LicensedRetailDataAdapter, CommercialFeedPayload } from './adapters/licensed-retail-data.adapter';

import { classifyProductCategory } from './product-classifier.util';
import { ProductValidatorService, CatalogValidationReport } from './product-validator.service';

const PRODUCTS_STORAGE_KEY = 'down_kilos_netto_products';
const PRICE_HISTORY_STORAGE_KEY = 'down_kilos_price_history';
const IMPORT_LOGS_STORAGE_KEY = 'down_kilos_import_logs';
const USER_PRICES_STORAGE_KEY = 'down_kilos_user_prices';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private offAdapter = inject(OpenFoodFactsAdapter);
  private openPricesAdapter = inject(OpenPricesAdapter);
  private offerAdapter = inject(NettoOfferImportAdapter);
  private manualAdapter = inject(ManualPriceAdapter);
  private licensedAdapter = inject(LicensedRetailDataAdapter);
  private validator = inject(ProductValidatorService);

  readonly products = signal<ProductItem[]>([]);
  readonly priceHistory = signal<PriceHistoryEntry[]>([]);
  readonly importLogs = signal<ImportLogEntry[]>([]);
  readonly isSyncing = signal<boolean>(false);

  constructor() {
    this.loadInitialData();
  }

  loadInitialData(): void {
    // 1. Produkte laden (lokale Anpassungen oder Seed-Katalog)
    const storedProducts = this.getFromStorage<ProductItem[] | null>(PRODUCTS_STORAGE_KEY, null);
    
    // Map der offiziellen Katalog-Produkte mit 100% verifizierten Original-Netto-Fotos
    const officialCatalogMap = new Map<string, ProductItem>(
      NETTO_PRODUCT_CATALOG.map(p => [p.id, p])
    );

    let catalog: ProductItem[];
    let needsResave = false;

    if (!storedProducts || storedProducts.length === 0) {
      catalog = [...NETTO_PRODUCT_CATALOG];
      needsResave = true;
    } else {
      // 1. Aktualisiere veraltete/lokale Bild-URLs auf die echten Netto-OFF-Bilder
      catalog = storedProducts.map(p => {
        const official = officialCatalogMap.get(p.id);
        if (official) {
          // Falls im Storage noch ein altes Platzhalter-Bild liegt oder das Bild abweicht, zwingend aktualisieren
          if (!p.imageUrl || p.imageUrl.startsWith('images/') || p.imageUrl !== official.imageUrl) {
            needsResave = true;
            return {
              ...p,
              imageUrl: official.imageUrl,
              brand: official.brand || p.brand,
              ean: official.ean || p.ean,
              imageSource: official.imageSource || p.imageSource,
              imageLicense: official.imageLicense || p.imageLicense
            };
          }
        }
        return p;
      });

      // 2. Füge alle Produkte aus NETTO_PRODUCT_CATALOG hinzu, die noch nicht im Storage waren
      const existingIds = new Set(catalog.map(p => p.id));
      const missingProducts = NETTO_PRODUCT_CATALOG.filter(p => !existingIds.has(p.id));
      if (missingProducts.length > 0) {
        catalog = [...catalog, ...missingProducts];
        needsResave = true;
      }
    }

    // 3. Sicherheitsbereinigung: Garantiere, dass KEIN Produkt einen lokalen Platzhalter ('images/products/...') behält
    catalog = catalog.map(p => {
      let updated = p;
      if (p.imageUrl && p.imageUrl.startsWith('images/')) {
        const fallback = officialCatalogMap.get(p.id);
        if (fallback && fallback.imageUrl && !fallback.imageUrl.startsWith('images/')) {
          needsResave = true;
          updated = { ...updated, imageUrl: fallback.imageUrl };
        }
      }

      // 4. Strikte Kategorie-Korrektur (Haferdrink -> plant_drinks, Nudeln -> pasta_rice, Salami -> meat_sausage etc.)
      const accurateCat = classifyProductCategory(updated);
      if (updated.category !== accurateCat) {
        needsResave = true;
        updated = { ...updated, category: accurateCat };
      }

      // 5. Preis-Plausibilisierung: Keine negativen oder Fantasie-Preise
      if (updated.price !== null && updated.price !== undefined) {
        if (isNaN(updated.price) || updated.price <= 0) {
          needsResave = true;
          updated = {
            ...updated,
            price: null,
            priceStatus: 'unknown',
            priceUnit: 'Preis nicht verfügbar'
          };
        }
      }

      return updated;
    });

    if (needsResave) {
      this.saveToStorage(PRODUCTS_STORAGE_KEY, catalog);
    }

    // 2. Preisverläufe laden
    const storedHistory = this.getFromStorage<PriceHistoryEntry[]>(PRICE_HISTORY_STORAGE_KEY, []);
    
    // Falls noch keine Historie existiert, Initialhistorie aus dem Katalog erzeugen
    if (storedHistory.length === 0) {
      const initialHistory: PriceHistoryEntry[] = catalog
        .filter(p => p.price !== null)
        .map(p => ({
          id: `init-${p.id}`,
          productId: p.id,
          ean: p.ean,
          price: p.price!,
          priceStatus: p.priceStatus,
          priceSource: p.priceSource || 'Stammdaten Netto',
          observedDate: p.lastUpdated,
          validFrom: p.validFrom,
          validUntil: p.validUntil,
          regionBranch: p.regionBranch || 'Bundesweit',
          recordedAt: new Date().toISOString(),
          notes: 'Initiale Erfassung'
        }));
      this.priceHistory.set(initialHistory);
      this.saveToStorage(PRICE_HISTORY_STORAGE_KEY, initialHistory);
    } else {
      this.priceHistory.set(storedHistory);
    }

    // 3. Import-Logs laden
    const storedLogs = this.getFromStorage<ImportLogEntry[]>(IMPORT_LOGS_STORAGE_KEY, []);
    this.importLogs.set(storedLogs);

    // 4. Benutzerdefinierte Preise berücksichtigen (Abwärtskompatibilität)
    const userPrices = this.getFromStorage<Record<string, number>>(USER_PRICES_STORAGE_KEY, {});
    catalog = catalog.map(p => {
      const userPrice = userPrices[p.id];
      if (userPrice !== undefined) {
        return {
          ...p,
          price: userPrice,
          priceStatus: 'user_reported' as const,
          dataSource: 'user_input' as const,
          priceSource: 'Selbst eingetragener Netto-Preis',
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      }
      return p;
    });

    this.products.set(catalog);
  }

  getAllProducts(): ProductItem[] {
    return this.products();
  }

  validateCatalog(): CatalogValidationReport {
    return this.validator.validateCatalog(this.products());
  }

  getProductById(id: string): ProductItem | undefined {
    return this.products().find(p => p.id === id);
  }

  getProductByEan(ean: string): ProductItem | undefined {
    return this.products().find(p => p.ean === ean.trim());
  }

  searchProducts(query: string, category: ProductCategory = 'all'): ProductItem[] {
    return this.filterProducts({ query, category });
  }

  filterProducts(filter: ProductFilterOptions): ProductItem[] {
    const q = (filter.query || '').trim().toLowerCase();
    const category = filter.category || 'all';
    const status = filter.priceStatus || 'all';
    const quality = filter.dataQuality || 'all';

    return this.products().filter(p => {
      const matchesQuery = !q || 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        (p.ean && p.ean.includes(q));
      
      const matchesCategory = category === 'all' || p.category === category;
      const matchesStatus = status === 'all' || p.priceStatus === status;
      const matchesQuality = quality === 'all' || p.dataQualityStatus === quality;

      return matchesQuery && matchesCategory && matchesStatus && matchesQuality;
    });
  }

  /**
   * Aktualisiert den Preis eines Produkts und führt die Preis-Historie lückenlos weiter.
   * Ein neuer Preis darf vorherige Daten nicht unkontrolliert überschreiben!
   */
  updateProductPrice(
    productId: string,
    newPrice: number,
    recordedBy: string = 'user_in_store',
    location: string = 'Netto Filiale vor Ort',
    note?: string
  ): void {
    if (newPrice < 0) return;
    const currentProducts = this.products();
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    const { updatedProduct, historyEntry } = this.manualAdapter.createManualPriceEntry(
      product,
      newPrice,
      recordedBy,
      location,
      note
    );

    const updatedList = currentProducts.map(p => p.id === productId ? updatedProduct : p);
    this.products.set(updatedList);
    this.saveToStorage(PRODUCTS_STORAGE_KEY, updatedList);

    // Historie erweitern
    const newHistory = [historyEntry, ...this.priceHistory()];
    this.priceHistory.set(newHistory);
    this.saveToStorage(PRICE_HISTORY_STORAGE_KEY, newHistory);
  }

  /**
   * Alias für UI-Aufrufe
   */
  updateUserPrice(productId: string, newPrice: number): void {
    this.updateProductPrice(productId, newPrice);
  }

  /**
   * Fügt ein neues Produkt hinzu (mit Duplikatsprüfung).
   */
  addProduct(newProduct: ProductItem): { success: boolean; message: string } {
    const current = this.products();
    
    // Duplikatsprüfung anhand EAN
    if (newProduct.ean) {
      const exists = current.some(p => p.ean === newProduct.ean);
      if (exists) {
        return { success: false, message: `Ein Produkt mit EAN ${newProduct.ean} existiert bereits.` };
      }
    }

    // Duplikatsprüfung anhand Name + Marke + Menge
    const duplicate = current.some(p => 
      p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase() &&
      p.brand.trim().toLowerCase() === newProduct.brand.trim().toLowerCase() &&
      p.packageSize.trim().toLowerCase() === newProduct.packageSize.trim().toLowerCase()
    );

    if (duplicate) {
      return { success: false, message: 'Ein identisches Produkt mit gleicher Marke und Größe existiert bereits.' };
    }

    const updated = [newProduct, ...current];
    this.products.set(updated);
    this.saveToStorage(PRODUCTS_STORAGE_KEY, updated);

    // Initialer Preisverlauf
    if (newProduct.price !== null) {
      const historyEntry: PriceHistoryEntry = {
        id: `price-hist-${Date.now()}`,
        productId: newProduct.id,
        ean: newProduct.ean,
        price: newProduct.price,
        priceStatus: newProduct.priceStatus,
        priceSource: newProduct.priceSource || 'Neu angelegt',
        observedDate: newProduct.lastUpdated,
        regionBranch: newProduct.regionBranch,
        recordedAt: new Date().toISOString(),
        notes: 'Neu im Katalog'
      };
      const newHistory = [historyEntry, ...this.priceHistory()];
      this.priceHistory.set(newHistory);
      this.saveToStorage(PRICE_HISTORY_STORAGE_KEY, newHistory);
    }

    return { success: true, message: 'Produkt erfolgreich hinzugefügt.' };
  }

  /**
   * Aktualisiert Produkteigenschaften.
   */
  updateProduct(id: string, updates: Partial<ProductItem>): void {
    const current = this.products();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) return;

    const existing = current[index];
    const updatedItem: ProductItem = { ...existing, ...updates };

    // Wenn der Preis geändert wurde, Historie schreiben
    if (updates.price !== undefined && updates.price !== existing.price && updates.price !== null) {
      const historyEntry: PriceHistoryEntry = {
        id: `price-hist-${Date.now()}`,
        productId: existing.id,
        ean: updatedItem.ean,
        price: updates.price,
        priceStatus: updatedItem.priceStatus,
        priceSource: updatedItem.priceSource || 'Admin-Korrektur',
        observedDate: updatedItem.lastUpdated || new Date().toISOString().split('T')[0],
        recordedAt: new Date().toISOString(),
        notes: 'Admin-Korrektur'
      };
      const newHistory = [historyEntry, ...this.priceHistory()];
      this.priceHistory.set(newHistory);
      this.saveToStorage(PRICE_HISTORY_STORAGE_KEY, newHistory);
    }

    current[index] = updatedItem;
    this.products.set([...current]);
    this.saveToStorage(PRODUCTS_STORAGE_KEY, current);
  }

  /**
   * Entfernt ein Produkt aus dem Katalog.
   */
  deleteProduct(id: string): void {
    const updated = this.products().filter(p => p.id !== id);
    this.products.set(updated);
    this.saveToStorage(PRODUCTS_STORAGE_KEY, updated);
  }

  /**
   * Weist einem Produkt einen Barcode zu und gleicht automatisch Bild und Nährwerte über Open Food Facts ab.
   */
  async assignBarcode(productId: string, newEan: string): Promise<boolean> {
    const cleanEan = newEan.trim();
    if (!cleanEan) return false;

    // Open Food Facts Daten abfragen
    const offData = await this.offAdapter.fetchProductByBarcode(cleanEan);
    const updates: Partial<ProductItem> = { ean: cleanEan };

    if (offData) {
      if (offData.imageUrl) updates.imageUrl = offData.imageUrl;
      if (offData.imageSource) updates.imageSource = offData.imageSource;
      if (offData.imageLicense) updates.imageLicense = offData.imageLicense;
      if (offData.nutrition && offData.nutrition.caloriesPer100g > 0) {
        updates.nutrition = offData.nutrition;
      }
      if (offData.allergens && offData.allergens.length > 0) {
        updates.allergens = offData.allergens;
      }
      updates.dataQualityStatus = 'verified';
    }

    this.updateProduct(productId, updates);
    return true;
  }

  /**
   * Synchronisiert einen Artikel mit Open Prices nach beobachteten Netto-Preisen.
   */
  async syncPriceWithOpenPrices(productId: string): Promise<boolean> {
    const product = this.getProductById(productId);
    if (!product || !product.ean) return false;

    const prices = await this.openPricesAdapter.fetchPricesForBarcode(product.ean);
    const latest = this.openPricesAdapter.getLatestPrice(prices);

    if (latest) {
      this.updateProduct(productId, {
        price: latest.price,
        priceStatus: 'last_observed',
        dataSource: 'open_prices',
        priceSource: latest.source,
        lastUpdated: latest.date,
        regionBranch: latest.location
      });
      return true;
    }

    return false;
  }

  /**
   * Importiert Angebote aus CSV.
   */
  importOffersFromCsv(csvText: string): { imported: number; updated: number; failed: number } {
    const items = this.offerAdapter.parseOffersFromCsv(csvText);
    let imported = 0;
    let updated = 0;

    for (const item of items) {
      if (!item.name || item.price === undefined) continue;

      const existing = item.ean ? this.getProductByEan(item.ean) : undefined;
      if (existing) {
        this.updateProduct(existing.id, {
          price: item.price,
          priceStatus: item.priceStatus,
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          lastUpdated: item.lastUpdated
        });
        updated++;
      } else {
        const fullItem: ProductItem = {
          id: item.id || `netto-import-${Date.now()}-${Math.random()}`,
          ean: item.ean,
          name: item.name,
          brand: item.brand || 'Netto Marken-Discount',
          category: item.category || 'fruits_veg',
          packageSize: item.packageSize || '1 Pckg.',
          packageWeightGrams: item.packageWeightGrams || 500,
          price: item.price,
          priceUnit: item.priceUnit || '€',
          priceStatus: item.priceStatus || 'confirmed_offer',
          dataSource: 'netto_official_offer',
          priceSource: item.priceSource || 'Netto Import',
          lastUpdated: item.lastUpdated || new Date().toISOString().split('T')[0],
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          regionBranch: item.regionBranch || 'Bundesweit',
          retailer: 'netto_marken_discount',
          retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
          imageUrl: item.imageUrl || 'images/products/carrots.jpg',
          imageLicense: 'Herstellerangaben',
          dataQualityStatus: 'verified',
          allergens: [],
          nutrition: item.nutrition || {
            caloriesPer100g: 50,
            proteinPer100g: 1,
            carbsPer100g: 5,
            fatPer100g: 0.5
          }
        };
        this.addProduct(fullItem);
        imported++;
      }
    }

    this.recordImportLog('NettoOfferImportAdapter (CSV)', items.length, imported, updated, 0, 'success');
    return { imported, updated, failed: 0 };
  }

  /**
   * Importiert Angebote aus JSON.
   */
  importOffersFromJson(jsonText: string): { imported: number; updated: number; failed: number } {
    const items = this.offerAdapter.parseOffersFromJson(jsonText);
    let imported = 0;
    let updated = 0;

    for (const item of items) {
      if (!item.name || item.price === undefined) continue;

      const existing = item.ean ? this.getProductByEan(item.ean) : undefined;
      if (existing) {
        this.updateProduct(existing.id, {
          price: item.price,
          priceStatus: item.priceStatus,
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          lastUpdated: item.lastUpdated
        });
        updated++;
      } else {
        const fullItem: ProductItem = {
          id: item.id || `netto-import-${Date.now()}-${Math.random()}`,
          ean: item.ean,
          name: item.name,
          brand: item.brand || 'Netto Marken-Discount',
          category: item.category || 'fruits_veg',
          packageSize: item.packageSize || '1 Pckg.',
          packageWeightGrams: item.packageWeightGrams || 500,
          price: item.price,
          priceUnit: item.priceUnit || '€',
          priceStatus: item.priceStatus || 'confirmed_offer',
          dataSource: 'netto_official_offer',
          priceSource: item.priceSource || 'Netto Import',
          lastUpdated: item.lastUpdated || new Date().toISOString().split('T')[0],
          validFrom: item.validFrom,
          validUntil: item.validUntil,
          regionBranch: item.regionBranch || 'Bundesweit',
          retailer: 'netto_marken_discount',
          retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
          imageUrl: item.imageUrl || 'images/products/carrots.jpg',
          imageLicense: 'Herstellerangaben',
          dataQualityStatus: 'verified',
          allergens: [],
          nutrition: item.nutrition || {
            caloriesPer100g: 50,
            proteinPer100g: 1,
            carbsPer100g: 5,
            fatPer100g: 0.5
          }
        };
        this.addProduct(fullItem);
        imported++;
      }
    }

    this.recordImportLog('NettoOfferImportAdapter (JSON)', items.length, imported, updated, 0, 'success');
    return { imported, updated, failed: 0 };
  }

  /**
   * Verarbeitet lizenzierte Handelsdatenlieferung.
   */
  importCommercialFeed(payload: CommercialFeedPayload): { success: boolean; message: string } {
    const result = this.licensedAdapter.processCommercialFeed(payload);
    if (!result.success) {
      this.recordImportLog('LicensedRetailDataAdapter', payload.items?.length || 0, 0, 0, payload.items?.length || 0, 'failed', result.message);
      return result;
    }

    let count = 0;
    for (const item of result.products) {
      if (item.name && item.price !== undefined) {
        this.addProduct(item as ProductItem);
        count++;
      }
    }

    this.recordImportLog('LicensedRetailDataAdapter', payload.items.length, count, 0, 0, 'success', result.message);
    return { success: true, message: `${count} lizenzierte Netto-Produkte importiert.` };
  }

  /**
   * Protokolliert Synchronisations- und Importvorgänge.
   */
  private recordImportLog(
    adapter: string,
    scanned: number,
    imported: number,
    updated: number,
    failed: number,
    status: 'success' | 'partial' | 'failed',
    details?: string
  ): void {
    const log: ImportLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceAdapter: adapter,
      timestamp: new Date().toISOString(),
      itemsScanned: scanned,
      itemsImported: imported,
      itemsUpdated: updated,
      itemsFailed: failed,
      status,
      details
    };

    const newLogs = [log, ...this.importLogs()];
    this.importLogs.set(newLogs);
    this.saveToStorage(IMPORT_LOGS_STORAGE_KEY, newLogs);
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }
}
