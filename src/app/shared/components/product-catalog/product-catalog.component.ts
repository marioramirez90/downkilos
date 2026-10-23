import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { PriceService } from '../../../core/services/price.service';
import { ProductCategory, ProductItem } from '../../../core/models/product.model';

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

  searchQuery = '';
  selectedCategory = signal<ProductCategory>('all');
  editingProduct = signal<ProductItem | null>(null);
  tempPriceInput: number | null = null;

  readonly categories: { id: ProductCategory; label: string }[] = [
    { id: 'all', label: 'Alle' },
    { id: 'fruits_veg', label: 'Obst & Gemüse' },
    { id: 'meat_fish', label: 'Fleisch' },
    { id: 'dairy', label: 'Milchprodukte' },
    { id: 'grains', label: 'Getreide' }
  ];

  filteredProducts(): ProductItem[] {
    return this.productService.searchProducts(this.searchQuery, this.selectedCategory());
  }

  openPriceEditor(item: ProductItem) {
    this.editingProduct.set(item);
    this.tempPriceInput = item.price !== null ? item.price : 1.99;
  }

  closePriceEditor() {
    this.editingProduct.set(null);
    this.tempPriceInput = null;
  }

  saveNewPrice() {
    const prod = this.editingProduct();
    if (prod && this.tempPriceInput !== null && this.tempPriceInput > 0) {
      this.productService.updateUserPrice(prod.id, this.tempPriceInput);
      this.closePriceEditor();
    }
  }
}
