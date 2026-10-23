import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { MenuService } from '../../../core/services/menu.service';
import { StorageService } from '../../../core/services/storage.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LogoComponent, TranslatePipe],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss'
})
export class SidebarMenuComponent {
  menuService = inject(MenuService);
  storageService = inject(StorageService);

  closeMenu(): void {
    this.menuService.close();
  }

  userName(): string {
    return this.storageService.profile()?.name || 'Gast-Nutzer';
  }

  userInitial(): string {
    const name = this.userName();
    return name ? name.charAt(0).toUpperCase() : 'D';
  }

  userWeightInfo(): string {
    const prof = this.storageService.profile();
    if (!prof) return 'Ziel: Wohlfühlgewicht';
    return `${prof.currentWeight} kg → ${prof.targetWeight || 62} kg Ziel`;
  }
}
