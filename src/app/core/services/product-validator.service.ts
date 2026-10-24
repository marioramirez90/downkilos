import { Injectable } from '@angular/core';
import { ProductItem } from '../models/product.model';

export interface ProductValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ProductValidationResult {
  productId: string;
  isValid: boolean;
  issues: ProductValidationIssue[];
}

export interface CatalogValidationReport {
  totalItems: number;
  validItems: number;
  invalidItems: number;
  warningItems: number;
  results: ProductValidationResult[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductValidatorService {
  /**
   * Prüft ein einzelnes Produkt auf Korrektheit und Plausibilität.
   */
  validateProduct(product: Partial<ProductItem>): ProductValidationResult {
    const issues: ProductValidationIssue[] = [];
    const id = product.id || 'unknown';

    // 1. Produktname
    if (!product.name || product.name.trim().length < 2) {
      issues.push({ field: 'name', severity: 'error', message: 'Produktname fehlt oder ist zu kurz.' });
    }

    // 2. Marke
    if (!product.brand || product.brand.trim().length === 0) {
      issues.push({ field: 'brand', severity: 'warning', message: 'Marke ist nicht angegeben.' });
    }

    // 3. EAN / Barcode
    if (product.ean) {
      const cleanEan = product.ean.trim();
      if (!/^\d{8,14}$/.test(cleanEan)) {
        issues.push({ field: 'ean', severity: 'warning', message: `Ungültiges EAN-Format: ${cleanEan}` });
      }
    }

    // 4. Kategorie
    if (!product.category) {
      issues.push({ field: 'category', severity: 'error', message: 'Kategorie fehlt.' });
    }

    // 5. Packungsgröße & Gewicht
    if (!product.packageWeightGrams || product.packageWeightGrams <= 0) {
      issues.push({ field: 'packageWeightGrams', severity: 'error', message: 'Packungsgewicht muss > 0 sein.' });
    }

    // 6. Nährwerte (Energie, Makros)
    if (!product.nutrition) {
      issues.push({ field: 'nutrition', severity: 'error', message: 'Nährwertangaben fehlen vollständig.' });
    } else {
      const kcal = product.nutrition.caloriesPer100g;
      if (kcal === undefined || kcal === null || isNaN(kcal)) {
        issues.push({ field: 'nutrition.caloriesPer100g', severity: 'error', message: 'Kalorien pro 100g fehlen.' });
      } else {
        if (kcal < 0) {
          issues.push({ field: 'nutrition.caloriesPer100g', severity: 'error', message: 'Kalorien dürfen nicht negativ sein.' });
        }
        if (kcal > 950) {
          issues.push({ field: 'nutrition.caloriesPer100g', severity: 'warning', message: 'Unplausibel hoher Kalorienwert (> 950 kcal/100g).' });
        }
      }

      if (product.nutrition.proteinPer100g < 0 || product.nutrition.carbsPer100g < 0 || product.nutrition.fatPer100g < 0) {
        issues.push({ field: 'nutrition.macros', severity: 'error', message: 'Makronährstoffe dürfen nicht negativ sein.' });
      }
    }

    // 7. Produktbild
    if (!product.imageUrl || product.imageUrl.trim().length === 0) {
      issues.push({ field: 'imageUrl', severity: 'error', message: 'Produktbild fehlt.' });
    } else if (product.imageUrl.startsWith('images/products/')) {
      issues.push({ field: 'imageUrl', severity: 'warning', message: 'Lokaler Platzhalterpfad statt verifiziertem Foto.' });
    }

    // 8. Preis
    if (product.price !== null && product.price !== undefined) {
      if (product.price < 0) {
        issues.push({ field: 'price', severity: 'error', message: 'Preis darf nicht negativ sein.' });
      }
      if (product.price > 100) {
        issues.push({ field: 'price', severity: 'warning', message: 'Unplausibel hoher Supermarktpreis (> 100 €).' });
      }
    }

    const hasErrors = issues.some(i => i.severity === 'error');

    return {
      productId: id,
      isValid: !hasErrors,
      issues
    };
  }

  /**
   * Prüft einen gesamten Katalog von Produkten und gibt einen zusammenfassenden Prüfbericht zurück.
   */
  validateCatalog(products: Partial<ProductItem>[]): CatalogValidationReport {
    const results = products.map(p => this.validateProduct(p));
    const validItems = results.filter(r => r.isValid).length;
    const invalidItems = results.filter(r => !r.isValid).length;
    const warningItems = results.filter(r => r.issues.some(i => i.severity === 'warning')).length;

    return {
      totalItems: products.length,
      validItems,
      invalidItems,
      warningItems,
      results
    };
  }
}
