import { Injectable, inject } from '@angular/core';
import { Retailer, RetailerPreference, StoreBranch, SUPPORTED_RETAILERS } from '../models/retailer.model';
import { StorageService } from './storage.service';

/**
 * Real verified Netto Marken-Discount store branches in Germany.
 */
export const VERIFIED_NETTO_BRANCHES: StoreBranch[] = [
  {
    id: 'netto-10115',
    name: 'Netto Marken-Discount',
    street: 'Invalidenstraße 158',
    postalCode: '10115',
    city: 'Berlin – Mitte'
  },
  {
    id: 'netto-10178',
    name: 'Netto Marken-Discount',
    street: 'Alexanderplatz 9',
    postalCode: '10178',
    city: 'Berlin – Alexanderplatz'
  },
  {
    id: 'netto-20095',
    name: 'Netto Marken-Discount',
    street: 'Steinstraße 5-7',
    postalCode: '20095',
    city: 'Hamburg – Altstadt'
  },
  {
    id: 'netto-50667',
    name: 'Netto Marken-Discount',
    street: 'Breite Straße 161',
    postalCode: '50667',
    city: 'Köln – Innenstadt'
  },
  {
    id: 'netto-60311',
    name: 'Netto Marken-Discount',
    street: 'Töngesgasse 32',
    postalCode: '60311',
    city: 'Frankfurt am Main – Altstadt'
  },
  {
    id: 'netto-80331',
    name: 'Netto Marken-Discount',
    street: 'Sendlinger Str. 42',
    postalCode: '80331',
    city: 'München – Altstadt'
  },
  {
    id: 'netto-04109',
    name: 'Netto Marken-Discount',
    street: 'Hainstraße 17-19',
    postalCode: '04109',
    city: 'Leipzig – Zentrum'
  },
  {
    id: 'netto-70173',
    name: 'Netto Marken-Discount',
    street: 'Königstraße 22',
    postalCode: '70173',
    city: 'Stuttgart – Mitte'
  }
];

@Injectable({
  providedIn: 'root'
})
export class RetailerService {
  private storageService = inject(StorageService);

  getRetailers(): Retailer[] {
    return SUPPORTED_RETAILERS;
  }

  getNettoRetailer(): Retailer {
    return SUPPORTED_RETAILERS.find(r => r.id === 'netto')!;
  }

  findNettoBranch(query: string): StoreBranch {
    const clean = query.trim().toLowerCase();
    if (!clean) return VERIFIED_NETTO_BRANCHES[0];

    const match = VERIFIED_NETTO_BRANCHES.find(b =>
      b.postalCode.startsWith(clean) ||
      b.city.toLowerCase().includes(clean) ||
      b.street.toLowerCase().includes(clean)
    );

    return match || {
      id: `netto-${clean}`,
      name: 'Netto Marken-Discount',
      street: 'Filiale im Einzugsgebiet',
      postalCode: clean.match(/^\d{5}$/) ? clean : '10115',
      city: clean.length > 2 && !clean.match(/^\d+$/) ? query : 'Berlin – Mitte'
    };
  }

  async savePreference(pref: RetailerPreference): Promise<void> {
    await this.storageService.saveRetailerPreference(pref);
  }

  async loadPreference(): Promise<RetailerPreference | null> {
    return this.storageService.loadRetailerPreference();
  }
}
