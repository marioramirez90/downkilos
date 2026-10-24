import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RetailerPreference } from '../../core/models/retailer.model';
import { RetailerService } from '../../core/services/retailer.service';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-retailers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HamburgerButtonComponent
  ],
  templateUrl: './retailers.component.html',
  styleUrl: './retailers.component.scss'
})
export class RetailersComponent implements OnInit {
  private router = inject(Router);
  private retailerService = inject(RetailerService);

  readonly allRetailers = this.retailerService.getRetailers();

  // In V1, Netto Marken-Discount is the only active retailer
  selectedRetailer = signal<string>('netto');
  comingSoonNotice = signal<string | null>(null);
  weeklyBudget = 40;

  async ngOnInit(): Promise<void> {
    const saved = await this.retailerService.loadPreference();
    if (saved) {
      this.weeklyBudget = saved.weeklyBudget || 40;
      if (saved.retailerId) {
        this.selectedRetailer.set(saved.retailerId);
      }
    }
  }

  selectRetailer(retailer: string): void {
    if (retailer === 'netto') {
      this.selectedRetailer.set('netto');
      this.comingSoonNotice.set(null);
    } else {
      const names: Record<string, string> = {
        rewe: 'REWE',
        edeka: 'EDEKA',
        'aldi-nord': 'Aldi Nord',
        'aldi-sued': 'Aldi Süd',
        aldi_nord: 'Aldi Nord',
        aldi_sued: 'Aldi Süd',
        lidl: 'Lidl',
        penny: 'Penny',
        kaufland: 'Kaufland'
      };
      const name = names[retailer] || retailer;
      this.comingSoonNotice.set(`${name}: Coming soon – aktuell ist Netto Marken-Discount verfügbar.`);
    }
  }

  goBack(): void {
    this.router.navigate(['/calculator']);
  }

  async confirmSelection(): Promise<void> {
    if (this.selectedRetailer() !== 'netto') {
      return;
    }

    // Save selection without inventing fake addresses
    const pref: RetailerPreference = {
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      postalCode: '',
      city: '',
      weeklyBudget: Number(this.weeklyBudget)
    };

    await this.retailerService.savePreference(pref);
    this.router.navigate(['/loading'], { queryParams: { step: 'dashboard' } });
  }
}
