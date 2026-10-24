import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/settings']);
  }
}
