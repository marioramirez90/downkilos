import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, LogoComponent, ButtonComponent, HamburgerButtonComponent, TranslatePipe],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  showLoginInfo = false;

  ngOnInit() {
    if (this.storageService.isOnboardingCompleted()) {
      this.router.navigate(['/dashboard']);
    }
  }

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
