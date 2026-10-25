import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MealReminderService } from '../../../core/services/meal-reminder.service';
import { ReminderSettings } from '../../../core/models/reminder.model';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-reminders-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './reminders-settings.component.html',
  styleUrl: './reminders-settings.component.scss'
})
export class RemindersSettingsComponent {
  private router = inject(Router);
  readonly reminderService = inject(MealReminderService);

  readonly settings = computed(() => this.reminderService.settings());
  readonly toastMessage = signal<string | null>(null);

  // Lokale Kopie zur Bearbeitung
  readonly enabled = signal<boolean>(this.settings().enabled);
  readonly breakfastEnabled = signal<boolean>(this.settings().breakfastEnabled);
  readonly lunchEnabled = signal<boolean>(this.settings().lunchEnabled);
  readonly dinnerEnabled = signal<boolean>(this.settings().dinnerEnabled);

  readonly breakfastTime = signal<string>(this.settings().breakfastTime || '12:00');
  readonly lunchTime = signal<string>(this.settings().lunchTime || '17:00');
  readonly dinnerTime = signal<string>(this.settings().dinnerTime || '21:00');

  readonly onlyOpenMeals = signal<boolean>(this.settings().onlyOpenMeals);
  readonly paused = signal<boolean>(this.settings().paused);
  readonly privacyMode = signal<boolean>(this.settings().privacyMode);

  async toggleMasterEnabled(): Promise<void> {
    const nextVal = !this.enabled();
    this.enabled.set(nextVal);
    await this.saveCurrentSettings();
    if (nextVal) {
      this.showToast('Erinnerungen aktiviert.');
    } else {
      this.showToast('Erinnerungen deaktiviert.');
    }
  }

  async onSettingChange(): Promise<void> {
    await this.saveCurrentSettings();
  }

  private async saveCurrentSettings(): Promise<void> {
    const update: Partial<ReminderSettings> = {
      enabled: this.enabled(),
      breakfastEnabled: this.breakfastEnabled(),
      lunchEnabled: this.lunchEnabled(),
      dinnerEnabled: this.dinnerEnabled(),
      breakfastTime: this.breakfastTime(),
      lunchTime: this.lunchTime(),
      dinnerTime: this.dinnerTime(),
      onlyOpenMeals: this.onlyOpenMeals(),
      paused: this.paused(),
      privacyMode: this.privacyMode()
    };
    await this.reminderService.updateSettings(update);
  }

  async testReminderNow(slot: 'breakfast' | 'lunch' | 'dinner' = 'breakfast'): Promise<void> {
    await this.reminderService.simulateTestReminder(slot);
    this.showToast(`Test-Erinnerung für ${slot === 'breakfast' ? 'Frühstück' : slot === 'lunch' ? 'Mittagessen' : 'Abendessen'} gesendet!`);
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 2800);
  }
}
