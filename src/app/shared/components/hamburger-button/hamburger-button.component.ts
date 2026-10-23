import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'app-hamburger-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hamburger-button.component.html',
  styleUrl: './hamburger-button.component.scss'
})
export class HamburgerButtonComponent {
  private menuService = inject(MenuService);

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuService.toggle();
  }
}
