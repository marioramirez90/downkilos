import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { StorageService } from '../../core/services/storage.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { ProductItem } from '../../core/models/product.model';
import { FoodLogItem } from '../../core/models/food-log.model';
import { MealType } from '../../core/models/recipe.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

export interface PortionOption {
  label: string;
  amountGrams: number;
  isCustom?: boolean;
}

@Component({
  selector: 'app-food-diary',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './food-diary.component.html',
  styleUrl: './food-diary.component.scss'
})
export class FoodDiaryComponent implements OnInit {
  private router = inject(Router);
  private productService = inject(ProductService);
  readonly foodLogService = inject(FoodLogService);
  private storageService = inject(StorageService);
  private calorieService = inject(CalorieCalculatorService);

  readonly searchQuery = signal<string>('');
  readonly selectedProduct = signal<ProductItem | null>(null);
  readonly selectedMealType = signal<MealType>('breakfast');
  readonly selectedPortionOption = signal<PortionOption | null>(null);
  readonly customGrams = signal<number>(100);
  readonly toastMessage = signal<string | null>(null);
  readonly showManualModal = signal<boolean>(false);

  // Manuelle Eingabe
  manualName = signal<string>('');
  manualCalories = signal<number | null>(null);
  manualPortion = signal<string>('1 Portion');

  // Filter Quick Chips
  readonly filterChips = [
    { label: 'Eier', query: 'Eier' },
    { label: 'Toast', query: 'Toast' },
    { label: 'Bananen', query: 'Banane' },
    { label: 'Skyr / Joghurt', query: 'Skyr' },
    { label: 'Quark', query: 'Quark' },
    { label: 'Bohnen', query: 'Bohnen' },
    { label: 'Getränke', query: 'Getränk' }
  ];

  readonly targetKcal = computed(() => {
    const profile = this.storageService.profile();
    if (!profile) return 2000;
    const calc = this.calorieService.calculate(profile);
    return calc.dailyTargetKcal || 2000;
  });

  readonly eatenKcal = computed(() => this.foodLogService.eatenCalories());
  readonly remainingKcal = computed(() => Math.max(0, this.targetKcal() - this.eatenKcal()));
  readonly todayItems = computed(() => this.foodLogService.loggedItems().filter(i => i.status === 'eaten'));

  readonly searchResults = computed<ProductItem[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.productService.products();
    if (!query) {
      // Beliebte Vorlagen
      return all.slice(0, 10);
    }
    return all.filter(p => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchBrand = p.brand?.toLowerCase().includes(query);
      const matchCategory = p.category?.toLowerCase().includes(query);
      return matchName || matchBrand || matchCategory;
    });
  });

  readonly currentPortionOptions = computed<PortionOption[]>(() => {
    const p = this.selectedProduct();
    if (!p) return [];

    const options: PortionOption[] = [];

    // Fall 1: Stückgut wie Eier oder Scheibenbrot
    if (p.pieceUnitName && p.pieceWeightGrams && p.pieceWeightGrams > 0) {
      const u = p.pieceUnitName;
      const w = p.pieceWeightGrams;
      options.push({ label: `1 ${u} (${w} g)`, amountGrams: w });
      options.push({ label: `2 ${u}en (${w * 2} g)`.replace('eien', 'eier').replace('Eien', 'Eier'), amountGrams: w * 2 });
      options.push({ label: `3 ${u}en (${w * 3} g)`.replace('eien', 'eier').replace('Eien', 'Eier'), amountGrams: w * 3 });
      options.push({ label: 'Eigene Menge', amountGrams: w, isCustom: true });
      return options;
    }

    // Fall 2: Banane / Obst
    if (p.id.includes('banana') || p.name.toLowerCase().includes('banane')) {
      options.push({ label: '1 Banane (ca. 120 g essbar)', amountGrams: 120 });
      options.push({ label: '2 Bananen (ca. 240 g)', amountGrams: 240 });
      options.push({ label: '1/2 Banane (ca. 60 g)', amountGrams: 60 });
      options.push({ label: 'Eigene Menge', amountGrams: 120, isCustom: true });
      return options;
    }

    // Fall 3: Skyr / Joghurt / Quark
    if (p.name.toLowerCase().includes('skyr') || p.name.toLowerCase().includes('joghurt') || p.name.toLowerCase().includes('quark')) {
      options.push({ label: '100 g', amountGrams: 100 });
      options.push({ label: '200 g', amountGrams: 200 });
      const full = p.packageWeightGrams > 0 ? p.packageWeightGrams : 500;
      options.push({ label: `Ganzer Becher (${full} g)`, amountGrams: full });
      options.push({ label: 'Eigene Menge', amountGrams: 150, isCustom: true });
      return options;
    }

    // Fall 4: Getränke
    if (p.category === 'beverages' || p.name.toLowerCase().includes('getränk') || p.name.toLowerCase().includes('tee') || p.name.toLowerCase().includes('saft')) {
      options.push({ label: '100 ml', amountGrams: 100 });
      options.push({ label: '250 ml (1 Glas)', amountGrams: 250 });
      const full = p.packageWeightGrams > 0 ? p.packageWeightGrams : 500;
      options.push({ label: `Ganze Flasche (${full} ml)`, amountGrams: full });
      options.push({ label: 'Eigene Menge', amountGrams: 250, isCustom: true });
      return options;
    }

    // Standard-Optionen
    const serving = p.servingSizeGrams || 100;
    options.push({ label: `${serving} g (1 Portion)`, amountGrams: serving });
    options.push({ label: '100 g', amountGrams: 100 });
    if (p.packageWeightGrams && p.packageWeightGrams !== serving && p.packageWeightGrams !== 100) {
      options.push({ label: `Ganze Packung (${p.packageWeightGrams} g)`, amountGrams: p.packageWeightGrams });
    }
    options.push({ label: 'Eigene Menge', amountGrams: serving, isCustom: true });

    return options;
  });

  readonly calculatedNutrition = computed(() => {
    const p = this.selectedProduct();
    if (!p || !p.nutrition) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0, available: false };
    }

    const opt = this.selectedPortionOption();
    const grams = opt?.isCustom ? (this.customGrams() || 0) : (opt?.amountGrams || 100);

    const yieldFactor = p.edibleYieldPercent || 1.0;
    const edibleGrams = Math.round(grams * yieldFactor);
    const factor = edibleGrams / 100;

    const calories = Math.round(p.nutrition.caloriesPer100g * factor);
    const protein = Math.round(p.nutrition.proteinPer100g * factor * 10) / 10;
    const carbs = Math.round(p.nutrition.carbsPer100g * factor * 10) / 10;
    const fat = Math.round(p.nutrition.fatPer100g * factor * 10) / 10;

    return {
      calories,
      protein,
      carbs,
      fat,
      grams,
      edibleGrams,
      available: true
    };
  });

  async ngOnInit(): Promise<void> {
    await this.storageService.loadProfile();
    this.foodLogService.loadTodayLog();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  setChipQuery(q: string): void {
    this.searchQuery.set(q);
  }

  selectProduct(p: ProductItem): void {
    this.selectedProduct.set(p);
    const options = this.currentPortionOptions();
    if (options.length > 0) {
      this.selectedPortionOption.set(options[0]);
      this.customGrams.set(options[0].amountGrams);
    }
  }

  clearSelectedProduct(): void {
    this.selectedProduct.set(null);
    this.selectedPortionOption.set(null);
  }

  choosePortionOption(opt: PortionOption): void {
    this.selectedPortionOption.set(opt);
    if (!opt.isCustom) {
      this.customGrams.set(opt.amountGrams);
    }
  }

  /**
   * Speichert den tatsächlichen Verzehr als gegessen (Section 7).
   */
  logAsEaten(): void {
    const p = this.selectedProduct();
    if (!p) return;

    const nutrition = this.calculatedNutrition();
    if (!nutrition.available || nutrition.grams <= 0) {
      this.showToast('Bitte eine gültige Portionsmenge wählen.');
      return;
    }

    const opt = this.selectedPortionOption();
    const displayQty = opt?.isCustom
      ? `${nutrition.grams} g (${nutrition.calories} kcal)`
      : `${opt?.label || nutrition.grams + ' g'} (≈ ${nutrition.calories} kcal)`;

    const newItem: FoodLogItem = {
      id: `eaten-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      imageUrl: p.imageUrl,
      mealType: this.selectedMealType(),
      amountGrams: nutrition.grams,
      displayQuantity: displayQty,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      portionCost: 0,
      status: 'eaten',
      loggedAt: new Date().toISOString()
    };

    const updated = [newItem, ...this.foodLogService.loggedItems()];
    this.foodLogService.loggedItems.set(updated);
    try {
      localStorage.setItem('down_kilos_today_food_log', JSON.stringify(updated));
    } catch {}

    this.showToast(`Als gegessen eingetragen: ${p.name} (+${nutrition.calories} kcal)`);
    this.clearSelectedProduct();
    this.searchQuery.set('');
  }

  deleteFoodItem(id: string): void {
    this.foodLogService.removeItem(id);
    this.showToast('Lebensmittel aus dem Tagesprotokoll entfernt.');
  }

  openManualEntry(): void {
    this.manualName.set('');
    this.manualCalories.set(null);
    this.manualPortion.set('1 Portion');
    this.showManualModal.set(true);
  }

  closeManualEntry(): void {
    this.showManualModal.set(false);
  }

  submitManualFood(): void {
    const name = this.manualName().trim();
    const cals = this.manualCalories();
    if (!name || cals === null || cals < 0) {
      this.showToast('Bitte Namen und Kalorien angeben.');
      return;
    }

    this.foodLogService.addManualItem(
      name,
      cals,
      this.manualPortion().trim() || '1 Portion',
      this.selectedMealType(),
      'eaten'
    );

    this.showToast(`Eingetragen: ${name} (+${cals} kcal)`);
    this.closeManualEntry();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 2800);
  }
}
