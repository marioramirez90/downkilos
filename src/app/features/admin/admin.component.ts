import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { PriceService } from '../../core/services/price.service';
import { ProductItem, ProductCategory, PriceStatus } from '../../core/models/product.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent, LogoComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private router = inject(Router);
  productService = inject(ProductService);
  priceService = inject(PriceService);

  // Authentifizierung: Geschützt mit Admin-PIN (z.B. '4200' oder Master-Passwort)
  isAuthenticated = signal<boolean>(false);
  pinInput = '';
  authError = signal<string | null>(null);

  activeTab = signal<'products' | 'import' | 'history' | 'logs'>('products');
  notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Formular: Neues Produkt / Bearbeitung
  showProductModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentEditingId: string | null = null;

  formEan = '';
  formName = '';
  formBrand = 'Netto Marken-Discount';
  formCategory: ProductCategory = 'fruits_veg';
  formPackageSize = '500 g';
  formPackageGrams = 500;
  formPrice: number | null = 1.99;
  formPriceStatus: PriceStatus = 'confirmed_offer';
  formImageUrl = 'images/products/rice.jpg';
  formImageLicense = 'Open Food Facts / CC-BY-SA 3.0';
  formCalories = 50;
  formProtein = 2;
  formCarbs = 10;
  formFat = 0.5;

  // Import-Felder
  importFormat: 'json' | 'csv' = 'json';
  importDataText = '';

  checkPin(): void {
    if (this.pinInput.trim() === '4200' || this.pinInput.trim() === 'admin') {
      this.isAuthenticated.set(true);
      this.authError.set(null);
    } else {
      this.authError.set('Ungültiger PIN. Bitte 4200 eingeben.');
    }
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.pinInput = '';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  openAddModal(): void {
    this.isEditing.set(false);
    this.currentEditingId = null;
    this.resetForm();
    this.showProductModal.set(true);
  }

  openEditModal(item: ProductItem): void {
    this.isEditing.set(true);
    this.currentEditingId = item.id;
    this.formEan = item.ean || '';
    this.formName = item.name;
    this.formBrand = item.brand;
    this.formCategory = item.category;
    this.formPackageSize = item.packageSize;
    this.formPackageGrams = item.packageWeightGrams;
    this.formPrice = item.price;
    this.formPriceStatus = item.priceStatus;
    this.formImageUrl = item.imageUrl;
    this.formImageLicense = item.imageLicense;
    this.formCalories = item.nutrition.caloriesPer100g;
    this.formProtein = item.nutrition.proteinPer100g;
    this.formCarbs = item.nutrition.carbsPer100g;
    this.formFat = item.nutrition.fatPer100g;
    this.showProductModal.set(true);
  }

  closeModal(): void {
    this.showProductModal.set(false);
  }

  async saveProduct(): Promise<void> {
    if (!this.formName.trim()) {
      this.showToast('error', 'Produktname ist erforderlich.');
      return;
    }

    if (this.isEditing() && this.currentEditingId) {
      // Produkt bearbeiten
      this.productService.updateProduct(this.currentEditingId, {
        ean: this.formEan.trim() || undefined,
        name: this.formName.trim(),
        brand: this.formBrand.trim(),
        category: this.formCategory,
        packageSize: this.formPackageSize,
        packageWeightGrams: this.formPackageGrams,
        price: this.formPrice,
        priceStatus: this.formPriceStatus,
        imageUrl: this.formImageUrl,
        imageLicense: this.formImageLicense,
        nutrition: {
          caloriesPer100g: this.formCalories,
          proteinPer100g: this.formProtein,
          carbsPer100g: this.formCarbs,
          fatPer100g: this.formFat
        }
      });
      this.showToast('success', 'Produkt erfolgreich aktualisiert.');
    } else {
      // Neues Produkt hinzufügen
      const newProd: ProductItem = {
        id: this.formEan.trim() ? `netto-${this.formEan.trim()}` : `netto-custom-${Date.now()}`,
        ean: this.formEan.trim() || undefined,
        name: this.formName.trim(),
        brand: this.formBrand.trim(),
        category: this.formCategory,
        packageSize: this.formPackageSize,
        packageWeightGrams: this.formPackageGrams,
        price: this.formPrice,
        priceUnit: '€',
        priceStatus: this.formPriceStatus,
        dataSource: 'user_input',
        priceSource: 'Administrator Erfassung',
        lastUpdated: new Date().toISOString().split('T')[0],
        regionBranch: 'Netto Bundesweit',
        retailer: 'netto_marken_discount',
        retailerScope: 'Netto Marken-Discount (rot-gelb, ohne Hund)',
        imageUrl: this.formImageUrl,
        imageSource: 'Manuell hinterlegt',
        imageLicense: this.formImageLicense,
        dataQualityStatus: 'verified',
        allergens: [],
        nutrition: {
          caloriesPer100g: this.formCalories,
          proteinPer100g: this.formProtein,
          carbsPer100g: this.formCarbs,
          fatPer100g: this.formFat
        }
      };

      const result = this.productService.addProduct(newProd);
      if (!result.success) {
        this.showToast('error', result.message);
        return;
      }
      this.showToast('success', 'Produkt erfolgreich hinzugefügt.');
    }

    this.closeModal();
  }

  async autoFetchOffForForm(): Promise<void> {
    if (!this.formEan.trim()) {
      this.showToast('error', 'Bitte zuerst einen Barcode / EAN eingeben.');
      return;
    }
    const off = await this.productService['offAdapter'].fetchProductByBarcode(this.formEan.trim());
    if (off) {
      if (off.name) this.formName = off.name;
      if (off.brand) this.formBrand = off.brand;
      if (off.packageSize) this.formPackageSize = off.packageSize;
      if (off.imageUrl) this.formImageUrl = off.imageUrl;
      if (off.imageLicense) this.formImageLicense = off.imageLicense;
      if (off.nutrition) {
        this.formCalories = off.nutrition.caloriesPer100g;
        this.formProtein = off.nutrition.proteinPer100g;
        this.formCarbs = off.nutrition.carbsPer100g;
        this.formFat = off.nutrition.fatPer100g;
      }
      this.showToast('success', 'Daten und Bild erfolgreich von Open Food Facts geladen!');
    } else {
      this.showToast('error', 'Barcode nicht in Open Food Facts gefunden.');
    }
  }

  deleteProduct(id: string, name: string): void {
    if (confirm(`Möchtest du das Produkt "${name}" wirklich entfernen?`)) {
      this.productService.deleteProduct(id);
      this.showToast('success', `Produkt "${name}" wurde gelöscht.`);
    }
  }

  executeImport(): void {
    if (!this.importDataText.trim()) {
      this.showToast('error', 'Bitte Importdaten einfügen.');
      return;
    }

    try {
      if (this.importFormat === 'json') {
        const res = this.productService.importOffersFromJson(this.importDataText);
        this.showToast('success', `${res.imported} neu importiert, ${res.updated} aktualisiert.`);
      } else {
        const res = this.productService.importOffersFromCsv(this.importDataText);
        this.showToast('success', `${res.imported} neu importiert, ${res.updated} aktualisiert.`);
      }
      this.importDataText = '';
    } catch (err) {
      this.showToast('error', 'Fehler beim Verarbeiten der Importdaten.');
    }
  }

  private resetForm(): void {
    this.formEan = '';
    this.formName = '';
    this.formBrand = 'Netto Marken-Discount';
    this.formCategory = 'fruits_veg';
    this.formPackageSize = '500 g';
    this.formPackageGrams = 500;
    this.formPrice = 1.99;
    this.formPriceStatus = 'confirmed_offer';
    this.formImageUrl = 'images/products/rice.jpg';
    this.formImageLicense = 'Open Food Facts / CC-BY-SA 3.0';
    this.formCalories = 50;
    this.formProtein = 2;
    this.formCarbs = 10;
    this.formFat = 0.5;
  }

  private showToast(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => {
      this.notification.set(null);
    }, 3500);
  }
}
