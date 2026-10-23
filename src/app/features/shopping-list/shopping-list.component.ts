import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import { PriceService } from '../../core/services/price.service';
import { ProductCategory } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent, HamburgerButtonComponent],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent {
  private router = inject(Router);
  shoppingService = inject(ShoppingListService);
  priceService = inject(PriceService);

  showInfo = signal<boolean>(false);
  showAddModal = signal<boolean>(false);
  newItemName = '';
  newItemPrice: number | null = 1.49;

  setCategory(cat: ProductCategory) {
    this.shoppingService.selectedCategory.set(cat);
  }

  addCustomItem() {
    if (!this.newItemName.trim()) return;
    this.shoppingService.addCustomItem(this.newItemName, this.newItemPrice);
    this.newItemName = '';
    this.showAddModal.set(false);
  }

  openListInStore() {
    // Mode for shopping directly at Netto
    alert('Einkaufsmodus aktiviert! Hake deine Artikel beim Einkauf im Netto-Markt einfach ab.');
  }

  goBack() {
    this.router.navigate(['/meal-planner']);
  }
}
