import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { MealReminderDialogComponent } from './shared/components/meal-reminder-dialog/meal-reminder-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MealReminderDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('down-kilos');
  private router = inject(Router);
  private location = inject(Location);

  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#15803D' });
      } catch {
        // Ignored on unsupported platforms
      }

      CapApp.addListener('backButton', ({ canGoBack }) => {
        const currentUrl = this.router.url;
        if (currentUrl === '/dashboard' || currentUrl === '/' || currentUrl === '/welcome') {
          CapApp.minimizeApp();
        } else if (canGoBack) {
          this.location.back();
        } else {
          this.router.navigate(['/dashboard']);
        }
      });
    }
  }
}
