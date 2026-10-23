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

export type ProductCategory = 'fruits_veg' | 'meat_fish' | 'dairy' | 'grains' | 'pantry' | 'ready_meal' | 'all';

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
  
  // Portions- & Essbarkeits-Definitionen
  servingSizeGrams?: number;      // Übliche Portion (z.B. 150g Banane, 150g Skyr, 50g Haferflocken)
  servingUnit?: string;          // z.B. '1 Stück', '1 Portion', '1 Schale'
  edibleYieldPercent?: number;    // Essbarer Anteil (z.B. 0.68 bei Bananen wg. Schale, 1.0 bei Reis/Skyr)
  drainedWeightGrams?: number;    // Abtropfgewicht bei Dosen/Gläsern (z.B. 240g bei 400g Kidneybohnen)
  piecesPerPackage?: number;      // Stückanzahl (z.B. 20 Toastscheiben, 10 Eier)
  pieceWeightGrams?: number;      // Einzelgewicht (z.B. 25g pro Toastscheibe, 53g pro Ei)
  pieceUnitName?: string;         // Name der Einheit (z.B. 'Scheibe', 'Ei', 'Stück')
  nutritionBasis?: 'edible_raw' | 'drained_weight' | 'as_sold' | 'prepared';
  
  price: number | null;          // null wenn unbekannt (niemals erfundene Werte)
  priceUnit: string;
  priceStatus: PriceStatus;
  dataSource: ProductDataSource;
  priceSource?: string;
  lastUpdated: string;           // ISO Date (YYYY-MM-DD)
  validFrom?: string;
  validUntil?: string;
  regionBranch?: string;
  dataQualityStatus: DataQualityStatus;
  nutrition: NutritionInfo;
  allergens: string[];
  ingredientsText?: string;
  isDemoData?: boolean;

  // Intelligente Kennzeichnungen & Tags
  isLowCalorie?: boolean;        // < 40 kcal/100g
  isHighProtein?: boolean;       // > 10g Protein/100g
  isBudgetFriendly?: boolean;    // Besonders günstig (< 1,50 €)
  mealTags?: Array<'breakfast' | 'snack' | 'lunch_dinner' | 'pantry_staple'>;
}

export interface UserPriceOverride {
  productId: string;
  price: number;
  updatedAt: string;
  storeLocation?: string;
}

export type CalorieFilterType = 'all' | 'low_cal' | 'under_100_serving' | 'under_200_serving';
export type ProductSortType = 'relevance' | 'price_asc' | 'price_desc' | 'calories_asc' | 'calories_desc' | 'protein_desc';

export interface ProductFilterOptions {
  query?: string;
  category?: ProductCategory;
  priceStatus?: PriceStatus | 'all';
  dataQuality?: DataQualityStatus | 'all';
  calorieFilter?: CalorieFilterType;
  highProteinOnly?: boolean;
  budgetOnly?: boolean;
  offersOnly?: boolean;
  maxCaloriesRemaining?: number;
  excludedAllergens?: string[];
  sortBy?: ProductSortType;
}
