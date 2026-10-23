import { ProductCategory, PriceStatus } from './product.model';

export interface ShoppingListItem {
  id: string;
  productId?: string;
  ean?: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  imageUrl: string;
  neededAmount: number;
  neededUnit: string;
  packageSize: string;
  packageCount: number;
  packagePrice: number | null;
  totalCost: number | null;
  isChecked: boolean;
  isCustom?: boolean;
  priceStatus?: PriceStatus;
  priceSource?: string;
  observationDate?: string;
  isOlderPrice?: boolean;
  inPantry?: boolean; // Vorrat vorhanden
}

export interface ShoppingListSummary {
  totalItems: number;
  checkedItems: number;
  totalCost: number;
  isComplete: boolean;
  hasOlderPrices: boolean;
  hasMissingPrices: boolean;
  budgetBufferPercent: number;
  budgetBufferAmount: number;
  totalCostWithBuffer: number;
  estimateNotice?: string;
}
