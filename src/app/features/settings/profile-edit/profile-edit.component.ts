import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { CalorieCalculatorService } from '../../../core/services/calorie-calculator.service';
import { BiologicalGender, UserProfile } from '../../../core/models/user-profile.model';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.scss'
})
export class ProfileEditComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieCalculator = inject(CalorieCalculatorService);

  readonly profile = signal<UserProfile | null>(null);

  // Formularfelder
  name = signal<string>('');
  email = signal<string>('');
  birthDate = signal<string>('');
  gender = signal<BiologicalGender>('female');

  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  toastMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const p = await this.storageService.loadProfile();
    this.profile.set(p);

    if (p) {
      this.name.set(p.name || '');
      this.email.set(p.email || '');
      this.birthDate.set(p.birthDate || '1990-05-14');
      this.gender.set(p.gender || 'female');
    }
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  goToGoals(): void {
    this.router.navigate(['/settings/goals']);
  }

  async saveChanges(): Promise<void> {
    const trimmedName = this.name().trim();
    if (!trimmedName) {
      this.errorMessage.set('Bitte gib deinen Namen ein.');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const current = this.profile();
    const updated: UserProfile = {
      ...(current || {
        id: 'guest_profile',
        currentWeight: 75,
        height: 175,
        activityLevel: 'moderate',
        goal: 'lose_weight',
        createdAt: new Date().toISOString()
      }),
      name: trimmedName,
      email: this.email().trim() || undefined,
      birthDate: this.birthDate() || '1990-05-14',
      gender: this.gender(),
      updatedAt: new Date().toISOString()
    };

    try {
      await this.storageService.saveProfile(updated);
      this.profile.set(updated);
      this.showToast('Profil erfolgreich aktualisiert.');

      setTimeout(() => {
        this.router.navigate(['/settings']);
      }, 700);
    } catch {
      this.errorMessage.set('Fehler beim Speichern der Änderungen.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2800);
  }
}
