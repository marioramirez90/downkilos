import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { PriceService } from '../../../core/services/price.service';
import { ShoppingListService } from '../../../core/services/shopping-list.service';
import { ProductCategory, ProductItem, PriceHistoryEntry } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.scss'
})
export class ProductCatalogComponent {
  productService = inject(ProductService);
  priceService = inject(PriceService);
  shoppingListService = inject(ShoppingListService);

  searchQuery = '';
  selectedCategory = signal<ProductCategory>('all');
  selectedStatusFilter = signal<string>('all');
  selectedProductDetails = signal<ProductItem | null>(null);
  addedToast = signal<string | null>(null);

  readonly categories: { id: ProductCategory; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'fruits_veg', label: 'Obst & Gemüse' },
    { id: 'meat_fish', label: 'Fleisch & Fisch' },
    { id: 'dairy', label: 'Milch & Kühlung' },
    { id: 'grains', label: 'Getreide & Reis' }
  ];

  filteredProducts(): ProductItem[] {
    const list = this.productService.searchProducts(this.searchQuery, this.selectedCategory());
    const status = this.selectedStatusFilter();
    if (status === 'all') return list;
    return list.filter(p => p.priceStatus === status);
  }

  getProductPriceHistory(productId: string): PriceHistoryEntry[] {
    return this.productService.priceHistory().filter(h => h.productId === productId);
  }

  openProductDetails(item: ProductItem, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedProductDetails.set(item);
  }

  closeProductDetails() {
    this.selectedProductDetails.set(null);
  }

  addProductToShoppingList(item: ProductItem, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.shoppingListService.addProductToShoppingList(item);
    this.addedToast.set(`"${item.name}" zur Einkaufsliste hinzugefügt!`);
    setTimeout(() => {
      this.addedToast.set(null);
    }, 2500);
  }
}
