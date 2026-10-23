export type PriceStatus = 
  | 'confirmed_offer'  // Aktuell bestätigter Netto-Angebotspreis
  | 'last_observed'    // Zuletzt beobachteter Netto-Preis
  | 'user_reported'    // Selbst eingetragener Netto-Preis
  | 'licensed_data'    // Preis aus einer lizenzierten Datenquelle
  | 'unknown'          // Preis unbekannt
  // Abwärtskompatible Aliase
  | 'verified'         // Alias für confirmed_offer
  | 'recent'           // Alias für last_observed
  | 'missing';         // Alias für unknown

export type DataQualityStatus = 'verified' | 'partial' | 'pending';

export type ProductCategory = 'fruits_veg' | 'meat_fish' | 'dairy' | 'grains' | 'pantry' | 'all';

export type ProductDataSource = 
  | 'open_prices' 
  | 'open_food_facts' 
  | 'netto_official_offer' 
  | 'verified_catalog' 
  | 'user_input' 
  | 'licensed_retail';

export interface NutritionInfo {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}

export interface PriceHistoryEntry {
  id: string;
  productId: string;
  ean?: string;
  price: number;
  priceStatus: PriceStatus;
  priceSource: string;
  observedDate: string;
  validFrom?: string;
  validUntil?: string;
  regionBranch?: string;
  recordedAt: string;
  notes?: string;
}

export interface ImportLogEntry {
  id: string;
  sourceAdapter: string;
  timestamp: string;
  itemsScanned: number;
  itemsImported: number;
  itemsUpdated: number;
  itemsFailed: number;
  status: 'success' | 'partial' | 'failed';
  details?: string;
}

export interface ProductItem {
  id: string;
  ean?: string;
  name: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  imageSource?: string;
  imageLicense: string;
  retailer: 'netto' | 'netto_marken_discount';
  retailerScope?: string; // Strikte Unterscheidung von Netto mit dem Hund
  packageSize: string;
  packageWeightGrams: number;
  price: number | null; // null if unknown
  priceUnit: string;
  priceStatus: PriceStatus;
  dataSource: ProductDataSource;
  priceSource?: string;
  lastUpdated: string; // ISO Date (YYYY-MM-DD)
  validFrom?: string;
  validUntil?: string;
  regionBranch?: string;
  dataQualityStatus: DataQualityStatus;
  nutrition: NutritionInfo;
  allergens: string[];
  ingredientsText?: string;
  isDemoData?: boolean;
}

export interface UserPriceOverride {
  productId: string;
  price: number;
  updatedAt: string;
  storeLocation?: string;
}

export interface ProductFilterOptions {
  query?: string;
  category?: ProductCategory;
  priceStatus?: PriceStatus | 'all';
  dataQuality?: DataQualityStatus | 'all';
}
