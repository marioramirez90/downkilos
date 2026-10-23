export type PriceStatus = 'verified' | 'recent' | 'user_reported' | 'missing';

export type ProductCategory = 'fruits_veg' | 'meat_fish' | 'dairy' | 'grains' | 'pantry' | 'all';

export type ProductDataSource = 'open_prices' | 'open_food_facts' | 'verified_catalog' | 'user_input';

export interface NutritionInfo {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
}

export interface ProductItem {
  id: string;
  ean?: string;
  name: string;
  brand: string;
  category: ProductCategory;
  imageUrl: string;
  imageLicense: string;
  retailer: 'netto';
  packageSize: string;
  packageWeightGrams: number;
  price: number | null; // null if missing
  priceUnit: string;
  priceStatus: PriceStatus;
  dataSource: ProductDataSource;
  lastUpdated: string;
  nutrition: NutritionInfo;
  allergens: string[];
  isDemoData?: boolean;
}

export interface UserPriceOverride {
  productId: string;
  price: number;
  updatedAt: string;
}
