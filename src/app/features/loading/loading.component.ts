import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);

  loadingMessage = 'Dein Down-Kilos-Erlebnis wird vorbereitet...';

  async ngOnInit(): Promise<void> {
    // Real preparation tasks
    try {
      await this.storageService.loadProfile();
      await this.storageService.loadRetailerPreference();
      // Onboarding complete once user finishes market selection and loader
      this.storageService.setOnboardingCompleted(true);
    } catch (e) {
      console.warn('Preparation notice', e);
    }

    // Brief smooth transition to dashboard
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1200);
  }
}
