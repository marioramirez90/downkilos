import { Injectable, signal, computed } from '@angular/core';
import { PantryItem, LeftoverOptimizationMessage } from '../models/pantry.model';
import { RECIPES_DATA } from '../models/recipes.data';

const PANTRY_STORAGE_KEY = 'down_kilos_digital_pantry';

@Injectable({
  providedIn: 'root'
})
export class PantryService {
  readonly items = signal<PantryItem[]>([]);

  readonly totalItemsCount = computed(() => this.items().length);

  /**
   * Intelligente Resteverwertungs-Meldungen
   */
  readonly optimizationMessages = computed<LeftoverOptimizationMessage[]>(() => {
    const list = this.items();
    const messages: LeftoverOptimizationMessage[] = [];

    for (const item of list) {
      if (item.remainingQuantityGrams <= 0) continue;

      // Finde Rezepte, die diese verbleibende Zutat nutzen können
      const matchingRecipes = RECIPES_DATA.filter(recipe => {
        return recipe.ingredients.some(ing => ing.productId === item.productId && ing.amount <= item.remainingQuantityGrams);
      });

      if (matchingRecipes.length > 0) {
        messages.push({
          pantryItemName: item.name,
          remainingGrams: item.remainingQuantityGrams,
          possibleMealsCount: matchingRecipes.length,
          text: `Du hast noch ${item.remainingQuantityGrams} ${item.unit} ${item.name} im Vorrat. Damit kannst du noch ${matchingRecipes.length} weitere Mahlzeit(en) kochen!`,
          recipeSuggestions: matchingRecipes.map(r => {
            const ing = r.ingredients.find(i => i.productId === item.productId)!;
            return {
              recipeId: r.id,
              recipeTitle: r.title,
              usedAmountGrams: ing.amount
            };
          })
        });
      }
    }

    return messages;
  });

  constructor() {
    this.loadPantry();
  }

  loadPantry(): void {
    const stored = this.getFromStorage<PantryItem[]>(PANTRY_STORAGE_KEY, []);
    if (stored && stored.length > 0) {
      this.items.set(stored);
      return;
    }

    // Standard-Vorrat für Neunutzer (z.B. Salz, Pfeffer, Rapsöl)
    const initialPantry: PantryItem[] = [
      {
        id: 'pantry-rapeseed-oil',
        productId: 'netto-rapeseed-oil-500',
        name: 'Reines Rapsöl nativ',
        brand: 'BioBio',
        category: 'pantry',
        imageUrl: 'images/products/rice.jpg',
        packageSize: '500 ml Flasche',
        initialQuantityGrams: 460,
        remainingQuantityGrams: 440,
        unit: 'ml',
        purchasedDate: new Date().toISOString().split('T')[0],
        maxStorageDays: 180,
        expiresAt: this.addDays(new Date(), 180),
        isPerishable: false,
        storageLocation: 'pantry_shelf'
      }
    ];

    this.items.set(initialPantry);
    this.savePantry(initialPantry);
  }

  /**
   * Fügt Reste aus einem getätigten Einkauf automatisch dem Vorrat hinzu.
   */
  addLeftoverFromPurchase(
    productId: string,
    name: string,
    brand: string | undefined,
    category: string,
    imageUrl: string,
    packageSize: string,
    unit: string,
    totalPackageGrams: number,
    usedGrams: number
  ): void {
    const surplus = totalPackageGrams - usedGrams;
    if (surplus <= 0) return;

    const isPerishable = category === 'meat_fish' || name.toLowerCase().includes('hähnchen') || name.toLowerCase().includes('fleisch');
    const maxDays = isPerishable ? 2 : category === 'dairy' ? 5 : 60;
    const today = new Date().toISOString().split('T')[0];

    const current = this.items();
    const existingIndex = current.findIndex(i => i.productId === productId);

    if (existingIndex >= 0) {
      const existing = current[existingIndex];
      const updatedItem: PantryItem = {
        ...existing,
        remainingQuantityGrams: existing.remainingQuantityGrams + surplus,
        purchasedDate: today,
        expiresAt: this.addDays(new Date(), maxDays)
      };
      current[existingIndex] = updatedItem;
      this.items.set([...current]);
      this.savePantry(current);
    } else {
      const newItem: PantryItem = {
        id: `pantry-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId,
        name,
        brand,
        category,
        imageUrl,
        packageSize,
        initialQuantityGrams: totalPackageGrams,
        remainingQuantityGrams: surplus,
        unit,
        purchasedDate: today,
        maxStorageDays: maxDays,
        expiresAt: this.addDays(new Date(), maxDays),
        isPerishable,
        storageLocation: isPerishable || category === 'dairy' ? 'refrigerator' : 'pantry_shelf'
      };

      const updated = [newItem, ...current];
      this.items.set(updated);
      this.savePantry(updated);
    }
  }

  /**
   * Zieht eine verbrauchte Menge aus dem Vorrat ab.
   */
  consumeFromPantry(productId: string, amountGrams: number): boolean {
    const current = this.items();
    const index = current.findIndex(i => i.productId === productId);
    if (index === -1) return false;

    const item = current[index];
    const newRemaining = Math.max(0, item.remainingQuantityGrams - amountGrams);

    if (newRemaining === 0) {
      // Vollständig aufgebraucht
      const updated = current.filter((_, idx) => idx !== index);
      this.items.set(updated);
      this.savePantry(updated);
    } else {
      current[index] = { ...item, remainingQuantityGrams: newRemaining };
      this.items.set([...current]);
      this.savePantry(current);
    }

    return true;
  }

  /**
   * Prüft, welche Zutaten eines Rezepts bereits im Vorrat vorhanden sind.
   */
  getMatchingPantryItemsForRecipe(recipe: { ingredients: Array<{ productId?: string }> }): PantryItem[] {
    const list = this.items();
    return list.filter(item => {
      return recipe.ingredients.some(ing => ing.productId === item.productId && item.remainingQuantityGrams > 0);
    });
  }

  /**
   * Manuelles Hinzufügen / Bearbeiten im Vorrat
   */
  setPantryItemAmount(id: string, amountGrams: number): void {
    const current = this.items();
    if (amountGrams <= 0) {
      const updated = current.filter(i => i.id !== id);
      this.items.set(updated);
      this.savePantry(updated);
    } else {
      const updated = current.map(i => i.id === id ? { ...i, remainingQuantityGrams: amountGrams } : i);
      this.items.set(updated);
      this.savePantry(updated);
    }
  }

  private addDays(date: Date, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private savePantry(items: PantryItem[]): void {
    try {
      localStorage.setItem(PANTRY_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}
