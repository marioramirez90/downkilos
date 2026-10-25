import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

export interface MoreNavigationItem {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  icon: 'products' | 'recipes' | 'progress' | 'profile' | 'settings' | 'planner' | 'market' | 'calculator' | 'guide';
}

@Component({
  selector: 'app-more',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  templateUrl: './more.component.html',
  styleUrl: './more.component.scss'
})
export class MoreComponent {
  private router = inject(Router);

  readonly primaryItems: MoreNavigationItem[] = [
    {
      id: 'products',
      title: 'Produkte entdecken',
      subtitle: 'Netto-Produkte, Nährwerte & Barcode-Scanner.',
      route: '/discover',
      icon: 'products'
    },
    {
      id: 'recipes',
      title: 'Rezepte entdecken',
      subtitle: 'Einfache Gerichte mit Zutaten und Kalorien.',
      route: '/recipes',
      icon: 'recipes'
    },
    {
      id: 'progress',
      title: 'Meine Fortschritte',
      subtitle: 'Sieh dir deine Gewichtsentwicklung an.',
      route: '/progress',
      icon: 'progress'
    },
    {
      id: 'profile',
      title: 'Mein Profil & Ziele',
      subtitle: 'Persönliche Angaben und Kalorienziel.',
      route: '/settings/profile',
      icon: 'profile'
    },
    {
      id: 'settings',
      title: 'Einstellungen',
      subtitle: 'Datenschutz und App-Verwaltung.',
      route: '/settings',
      icon: 'settings'
    }
  ];

  readonly secondaryItems: MoreNavigationItem[] = [
    {
      id: 'planner',
      title: 'Mahlzeitenplan',
      subtitle: 'Tages- und Wochenplanung mit Netto-Zutaten.',
      route: '/meal-planner',
      icon: 'planner'
    },
    {
      id: 'market',
      title: 'Dein Markt',
      subtitle: 'Netto Marken-Discount Filiale wählen.',
      route: '/retailers',
      icon: 'market'
    },
    {
      id: 'calculator',
      title: 'Kalorienrechner',
      subtitle: 'Dein persönlicher Kalorien- und Defizitplan.',
      route: '/calculator',
      icon: 'calculator'
    },
    {
      id: 'dietary',
      title: 'Ernährungsprofil',
      subtitle: 'Ernährungsform, Allergien & Unverträglichkeiten.',
      route: '/dietary-profile',
      icon: 'recipes'
    },
    {
      id: 'guide',
      title: 'So funktioniert’s',
      subtitle: 'Prinzipien für gesundes und dauerhaftes Abnehmen.',
      route: '/how-it-works',
      icon: 'guide'
    }
  ];

  navigateTo(route: string): void {
    if (route === '/dietary-profile') {
      this.router.navigate(['/dietary-profile'], { queryParams: { returnUrl: '/more' } });
    } else {
      this.router.navigate([route]);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
}
