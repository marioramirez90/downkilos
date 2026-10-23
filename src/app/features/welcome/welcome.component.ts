import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, LogoComponent, TranslatePipe],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss'
})
export class WelcomeComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  showLoginInfo = false;

  ngOnInit() {
    const hasPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');
    if (!hasPreview && this.storageService.isOnboardingCompleted()) {
      this.router.navigate(['/dashboard']);
    }
  }

  startOnboarding() {
    this.router.navigate(['/how-it-works']);
  }

  continueGuest() {
    this.router.navigate(['/how-it-works']);
  }

  showLoginNotice() {
    this.showLoginInfo = true;
    setTimeout(() => {
      this.showLoginInfo = false;
    }, 4500);
  }
}
