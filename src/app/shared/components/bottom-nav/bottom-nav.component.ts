import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  private router = inject(Router);

  readonly isMoreActive = computed(() => {
    const url = this.router.url;
    return (
      url.startsWith('/progress') ||
      url.startsWith('/settings') ||
      url.startsWith('/einstellungen') ||
      url.startsWith('/recipes')
    );
  });
}
