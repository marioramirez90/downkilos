import { ProductCategory, PriceStatus } from './product.model';

export interface ShoppingListItem {
  id: string;
  productId?: string;
  ean?: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  imageUrl: string;
  neededAmount: number;     // Gesamt benötigte Menge (z.B. 450 g)
  neededUnit: string;
  packageSize: string;      // Ganze Packungsgröße (z.B. 500 g)
  packageWeightGrams?: number;
  packageCount: number;     // Tatsächlich zu kaufende ganze Packungen (z.B. 1 statt 3)
  packagePrice: number | null; // Preis je voller Packung bei Netto
  portionCost: number | null;  // Anteilige Kosten der tatsächlich verbrauchten Menge
  totalCost: number | null;    // Tatsächlicher Einkaufspreis = packagePrice * packageCount
  isChecked: boolean;
  isCustom?: boolean;
  priceStatus?: PriceStatus;
  priceSource?: string;
  observationDate?: string;
  isOlderPrice?: boolean;
  inPantry?: boolean;       // Vorrat vorhanden (Kaufpreis entfällt)
}

export interface ShoppingListSummary {
  totalItems: number;
  checkedItems: number;
  totalCost: number;        // Tatsächlicher voller Einkaufspreis (B)
  totalPortionCost: number; // Rechnerischer Portionspreis der Zutaten (A)
  isComplete: boolean;
  hasOlderPrices: boolean;
  hasMissingPrices: boolean;
  budgetBufferPercent: number;
  budgetBufferAmount: number;
  totalCostWithBuffer: number;
  estimateNotice?: string;
}
