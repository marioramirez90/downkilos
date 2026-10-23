import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Retailer, RetailerPreference, StoreBranch } from '../../core/models/retailer.model';
import { RetailerService } from '../../core/services/retailer.service';

import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-retailers',
  standalone: true,
  imports: [CommonModule, FormsModule, HamburgerButtonComponent],
  templateUrl: './retailers.component.html',
  styleUrl: './retailers.component.scss'
})
export class RetailersComponent implements OnInit {
  private router = inject(Router);
  private retailerService = inject(RetailerService);

  readonly allRetailers = this.retailerService.getRetailers();
  readonly otherRetailers = this.allRetailers.filter(r => !r.isAvailable);

  currentBranch = signal<StoreBranch>({
    id: 'netto-10115',
    name: 'Netto Marken-Discount',
    street: 'Invalidenstraße 158',
    postalCode: '10115',
    city: 'Berlin – Mitte'
  });

  isEditingLocation = signal<boolean>(false);
  searchLocationQuery = '';
  weeklyBudget = 40;
  comingSoonNotice = signal<string | null>(null);

  async ngOnInit() {
    const saved = await this.retailerService.loadPreference();
    if (saved) {
      this.weeklyBudget = saved.weeklyBudget || 40;
      if (saved.postalCode && saved.city) {
        this.currentBranch.set({
          id: 'saved-branch',
          name: 'Netto Marken-Discount',
          street: saved.branch?.street || 'Filiale im Einzugsgebiet',
          postalCode: saved.postalCode,
          city: saved.city
        });
      }
    }
  }

  applyLocationSearch() {
    if (!this.searchLocationQuery.trim()) return;
    const branch = this.retailerService.findNettoBranch(this.searchLocationQuery);
    this.currentBranch.set(branch);
    this.isEditingLocation.set(false);
    this.searchLocationQuery = '';
  }

  onSelectOtherRetailer(retailer: Retailer) {
    this.comingSoonNotice.set(`Coming soon – ${retailer.name} wird bald unterstützt.`);
    setTimeout(() => {
      this.comingSoonNotice.set(null);
    }, 4000);
  }

  goBack() {
    this.router.navigate(['/calculator']);
  }

  async confirmSelection() {
    const branch = this.currentBranch();
    const pref: RetailerPreference = {
      retailerId: 'netto',
      retailerName: 'Netto Marken-Discount',
      branch,
      postalCode: branch.postalCode,
      city: branch.city,
      weeklyBudget: Number(this.weeklyBudget)
    };

    await this.retailerService.savePreference(pref);
    this.router.navigate(['/dashboard']);
  }
}
