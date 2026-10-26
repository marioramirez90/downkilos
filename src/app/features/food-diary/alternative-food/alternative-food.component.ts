import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { MealReminderService } from '../../../core/services/meal-reminder.service';
import { ProductItem } from '../../../core/models/product.model';
import { FoodLogItem } from '../../../core/models/food-log.model';
import { MealType, Recipe } from '../../../core/models/recipe.model';

export interface SelectedAlternativeItem {
  id: string;
  productId?: string;
  name: string;
  brand?: string;
  imageUrl: string;
  quantityText: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isPiece: boolean;
  pieceCount: number;
  caloriesPer100g: number;
  servingSizeGrams: number;
}

@Component({
  selector: 'app-alternative-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alternative-food.component.html',
  styleUrl: './alternative-food.component.scss'
})
export class AlternativeFoodComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private reminderService = inject(MealReminderService);

  readonly mealSlot = signal<MealType>('breakfast');
  readonly mealDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly plannedRecipe = signal<Recipe | null>(null);

  readonly searchQuery = signal<string>('');
  readonly selectedItems = signal<SelectedAlternativeItem[]>([]);
  readonly activeTab = signal<'search' | 'manual'>('search');

  // Manuelle Eingabe
  readonly manualName = signal<string>('');
  readonly manualCalories = signal<number | null>(null);
  readonly manualPortion = signal<string>('1 Portion');

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const slot = (params['slot'] as MealType) || 'breakfast';
      const date = params['date'] || new Date().toISOString().split('T')[0];
      this.mealSlot.set(slot);
      this.mealDate.set(date);

      const planned = this.reminderService.getPlannedRecipe(slot, date);
      this.plannedRecipe.set(planned);
    });
  }

  readonly mealLabel = computed(() => {
    switch (this.mealSlot()) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'dinner': return 'Abendessen';
      default: return 'Mahlzeit';
    }
  });

  readonly searchResults = computed<ProductItem[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.productService.products();
    if (!q) {
      // Wenn Suchfeld leer: zeige beliebte Basics (Banane, Brot, Skyr, Eier, Haferflocken)
      return all.filter(p => 
        p.id.includes('banana') ||
        p.id.includes('toast') ||
        p.id.includes('skyr') ||
        p.id.includes('egg') ||
        p.id.includes('apple')
      ).slice(0, 6);
    }
    return all.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 15);
  });

  readonly totalCalories = computed(() => {
    return this.selectedItems().reduce((sum, item) => sum + item.calories, 0);
  });

  readonly totalProtein = computed(() => {
    return Math.round(this.selectedItems().reduce((sum, item) => sum + item.protein, 0) * 10) / 10;
  });

  readonly totalCarbs = computed(() => {
    return Math.round(this.selectedItems().reduce((sum, item) => sum + item.carbs, 0) * 10) / 10;
  });

  readonly totalFat = computed(() => {
    return Math.round(this.selectedItems().reduce((sum, item) => sum + item.fat, 0) * 10) / 10;
  });

  addProductToSelection(product: ProductItem): void {
    const isPiece = product.category === 'fruits_veg' || product.category === 'eggs' || product.name.toLowerCase().includes('banan') || product.name.toLowerCase().includes('ei');
    const pieceWeight = product.servingSizeGrams || (isPiece ? 115 : 100);
    const edibleYield = product.edibleYieldPercent || 1.0;
    const edibleGrams = Math.round(pieceWeight * edibleYield);

    const calsPer100 = product.nutrition.caloriesPer100g;
    const calories = Math.round((calsPer100 * edibleGrams) / 100);
    const protein = Math.round(((product.nutrition.proteinPer100g * edibleGrams) / 100) * 10) / 10;
    const carbs = Math.round(((product.nutrition.carbsPer100g * edibleGrams) / 100) * 10) / 10;
    const fat = Math.round(((product.nutrition.fatPer100g * edibleGrams) / 100) * 10) / 10;

    const newItem: SelectedAlternativeItem = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      quantityText: isPiece ? '1 Stück' : `${pieceWeight} g`,
      grams: pieceWeight,
      calories,
      protein,
      carbs,
      fat,
      isPiece,
      pieceCount: 1,
      caloriesPer100g: calsPer100,
      servingSizeGrams: pieceWeight
    };

    this.selectedItems.update(items => [...items, newItem]);
    this.searchQuery.set('');
  }

  updateItemCount(index: number, delta: number): void {
    this.selectedItems.update(items => {
      const copy = [...items];
      const item = copy[index];
      if (!item) return copy;

      if (item.isPiece) {
        const newCount = Math.max(1, item.pieceCount + delta);
        const totalGrams = newCount * item.servingSizeGrams;
        const cals = Math.round((item.caloriesPer100g * totalGrams) / 100);
        copy[index] = {
          ...item,
          pieceCount: newCount,
          grams: totalGrams,
          calories: cals,
          quantityText: `${newCount} Stück`
        };
      } else {
        const newGrams = Math.max(25, item.grams + (delta * 50));
        const cals = Math.round((item.caloriesPer100g * newGrams) / 100);
        copy[index] = {
          ...item,
          grams: newGrams,
          calories: cals,
          quantityText: `${newGrams} g`
        };
      }
      return copy;
    });
  }

  removeItemFromSelection(index: number): void {
    this.selectedItems.update(items => items.filter((_, i) => i !== index));
  }

  addManualItemToSelection(): void {
    const name = this.manualName().trim();
    const cals = this.manualCalories();
    if (!name || !cals || cals <= 0) return;

    const newItem: SelectedAlternativeItem = {
      id: `manual-${Date.now()}`,
      name,
      imageUrl: 'images/down-kilos-leaf.png',
      quantityText: this.manualPortion().trim() || '1 Portion',
      grams: 150,
      calories: Math.round(cals),
      protein: 0,
      carbs: 0,
      fat: 0,
      isPiece: false,
      pieceCount: 1,
      caloriesPer100g: Math.round(cals / 1.5),
      servingSizeGrams: 150
    };

    this.selectedItems.update(items => [...items, newItem]);
    this.manualName.set('');
    this.manualCalories.set(null);
    this.manualPortion.set('1 Portion');
    this.activeTab.set('search');
  }

  confirmAndLogAlternative(): void {
    const items = this.selectedItems();
    if (items.length === 0) return;

    const slot = this.mealSlot();
    const dateStr = this.mealDate();

    // Wandle in FoodLogItems um
    const foodLogItems: FoodLogItem[] = items.map(it => ({
      id: `alt-log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      productId: it.productId,
      name: it.name,
      brand: it.brand,
      category: 'product',
      imageUrl: it.imageUrl,
      mealType: slot,
      amountGrams: it.grams,
      displayQuantity: it.quantityText,
      calories: it.calories,
      protein: it.protein,
      carbs: it.carbs,
      fat: it.fat,
      portionCost: 0,
      status: 'eaten' as const,
      loggedAt: new Date().toISOString()
    }));

    // Im Reminder-Service und FoodLog registrieren
    this.reminderService.recordAlternativeItems(slot, foodLogItems, dateStr);

    // Zurück zum Dashboard
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
