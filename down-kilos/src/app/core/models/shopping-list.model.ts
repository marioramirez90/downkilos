import { ProductCategory } from './product.model';

export interface ShoppingListItem {
  id: string;
  productId?: string;
  name: string;
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
}

export interface ShoppingListSummary {
  totalItems: number;
  checkedItems: number;
  totalCost: number;
  isComplete: boolean;
}
