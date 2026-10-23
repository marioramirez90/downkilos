import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PriceService } from '../../core/services/price.service';
import { ProductCategory } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BottomNavComponent
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent {
  private router = inject(Router);
  readonly shoppingService = inject(ShoppingListService);
  readonly priceService = inject(PriceService);

  readonly showAddModal = signal<boolean>(false);
  newItemName = '';
  newItemPrice: number | null = null;
  newItemSize = '1 Packung';

  readonly displayedItems = computed(() => {
    return this.shoppingService.filteredItems();
  });

  toggleChecked(id: string): void {
    this.shoppingService.toggleItemChecked(id);
  }

  updateCount(id: string, delta: number): void {
    this.shoppingService.updatePackageCount(id, delta);
  }

  removeItem(id: string): void {
    this.shoppingService.removeItem(id);
  }

  openAddModal(): void {
    this.newItemName = '';
    this.newItemPrice = null;
    this.newItemSize = '1 Packung';
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  addCustomItem(): void {
    const name = this.newItemName.trim();
    if (!name) return;
    this.shoppingService.addCustomItem(name, this.newItemPrice, 'pantry', this.newItemSize);
    this.newItemName = '';
    this.newItemPrice = null;
    this.showAddModal.set(false);
  }

  setCategory(cat: ProductCategory): void {
    this.shoppingService.selectedCategory.set(cat);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToDiscover(): void {
    this.router.navigate(['/discover']);
  }
}

