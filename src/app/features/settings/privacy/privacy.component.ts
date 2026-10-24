import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, BottomNavComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/settings']);
  }
}
