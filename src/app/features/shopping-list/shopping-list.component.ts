import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PriceService } from '../../core/services/price.service';
import { PackageCalorieCalculatorService, CartDurationPlan } from '../../core/services/package-calorie-calculator.service';
import { CalorieCalculatorService } from '../../core/services/calorie-calculator.service';
import { StorageService } from '../../core/services/storage.service';
import { ProductCategory } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent,
    HamburgerButtonComponent,
    TranslatePipe
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent {
  private router = inject(Router);
  shoppingService = inject(ShoppingListService);
  priceService = inject(PriceService);
  private packageCalorieCalc = inject(PackageCalorieCalculatorService);
  private calorieService = inject(CalorieCalculatorService);
  private storageService = inject(StorageService);

  showInfo = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  showDurationModal = signal<boolean>(false);
  plannedDays = signal<number>(3);
  newItemName = '';
  newItemPrice: number | null = 1.49;

  durationPlan = computed<CartDurationPlan>(() => {
    const totalCals = this.shoppingService.summary().totalCalories || 0;
    const profile = this.storageService.profile();
    const target = profile ? this.calorieService.calculate(profile).dailyTargetKcal : 2000;
    return this.packageCalorieCalc.calculateCartDuration(totalCals, target, this.plannedDays());
  });

  openDurationModal() {
    this.showDurationModal.set(true);
  }

  closeDurationModal() {
    this.showDurationModal.set(false);
  }

  setDays(days: number) {
    this.plannedDays.set(days);
  }

  setCategory(cat: ProductCategory) {
    this.shoppingService.selectedCategory.set(cat);
  }

  addCustomItem() {
    if (!this.newItemName.trim()) return;
    this.shoppingService.addCustomItem(this.newItemName, this.newItemPrice);
    this.newItemName = '';
    this.showAddModal.set(false);
  }

  updateCount(id: string, delta: number): void {
    this.shoppingService.updatePackageCount(id, delta);
  }

  removeItem(id: string): void {
    this.shoppingService.removeItem(id);
  }

  openListInStore() {
    // Mode for shopping directly at Netto
    alert('Einkaufsmodus aktiviert! Hake deine Artikel beim Einkauf im Netto-Markt einfach ab.');
  }

  goBack() {
    this.router.navigate(['/discover']);
  }
}
