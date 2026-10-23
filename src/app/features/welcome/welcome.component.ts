import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, LogoComponent, ButtonComponent, HamburgerButtonComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent {
  private router = inject(Router);
  showLoginInfo = false;

  startOnboarding() {
    this.router.navigate(['/onboarding']);
  }

  showLoginNotice() {
    this.showLoginInfo = true;
    setTimeout(() => {
      this.showLoginInfo = false;
    }, 4000);
  }
}
