import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../../core/services/storage.service';
import { CalorieCalculatorService } from '../../../core/services/calorie-calculator.service';
import {
  ActivityLevel,
  BiologicalGender,
  DietaryPreference,
  UserGoal,
  UserProfile
} from '../../../core/models/user-profile.model';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-goals-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './goals-edit.component.html',
  styleUrl: './goals-edit.component.scss'
})
export class GoalsEditComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private calorieCalculator = inject(CalorieCalculatorService);

  readonly profile = signal<UserProfile | null>(null);

  // 1. Körperdaten
  height = signal<number>(168);
  currentWeight = signal<number>(78);
  targetWeight = signal<number>(68);
  activityLevel = signal<ActivityLevel>('light');

  // 2. Ziele
  goal = signal<UserGoal>('lose_weight');
  targetPaceWeeklyKg = signal<number>(0.5);

  // 3. Ernährungsvorlieben
  isVegetarian = signal<boolean>(false);
  isVegan = signal<boolean>(false);
  isLactoseFree = signal<boolean>(false);
  isGlutenFree = signal<boolean>(false);
  noPork = signal<boolean>(false);

  // UI Zustand
  isSaving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  toastMessage = signal<string | null>(null);

  // Vollständige Optionslisten für fehlerfreie Vorauswahl
  readonly heightOptions = Array.from({ length: 81 }, (_, i) => 140 + i); // 140 bis 220 cm
  readonly weightOptions = Array.from({ length: 141 }, (_, i) => 40 + i); // 40 bis 180 kg
  readonly targetWeightOptions = Array.from({ length: 111 }, (_, i) => 40 + i); // 40 bis 150 kg

  // Live berechnetes Kalorienziel basierend auf aktuellen Formulardaten
  readonly calculatedTargetCalories = computed(() => {
    const p = this.profile();
    const gender: BiologicalGender = p?.gender || 'female';
    const birthDate = p?.birthDate || '1990-05-14';
    const age = this.calorieCalculator.calculateAge(birthDate);

    const bmr = this.calorieCalculator.calculateBmr(
      this.currentWeight(),
      this.height(),
      age,
      gender
    );

    const tdee = this.calorieCalculator.calculateTdee(bmr, this.activityLevel());

    if (this.goal() === 'lose_weight') {
      const pace = this.targetPaceWeeklyKg();
      // 7700 kcal / kg Fettgewebe geteilt durch 7 Tage
      const rawDeficit = Math.round((pace * 7700) / 7);
      const deficit = Math.min(800, Math.max(250, rawDeficit));
      const minSafe = gender === 'female' ? 1200 : 1500;
      return Math.max(minSafe, tdee - deficit);
    } else if (this.goal() === 'gain_weight') {
      return tdee + 300;
    } else {
      return tdee;
    }
  });

  async ngOnInit(): Promise<void> {
    const p = await this.storageService.loadProfile();
    this.profile.set(p);

    if (p) {
      this.height.set(p.height || 168);
      this.currentWeight.set(p.currentWeight || 78);
      this.targetWeight.set(p.targetWeight || 68);
      this.activityLevel.set(p.activityLevel || 'light');
      this.goal.set(p.goal || 'lose_weight');
      this.targetPaceWeeklyKg.set(p.targetPaceWeeklyKg || 0.5);

      // Ernährungsvorlieben & Allergien
      if (p.dietaryPreference === 'vegan') {
        this.isVegan.set(true);
      } else if (p.dietaryPreference === 'vegetarian') {
        this.isVegetarian.set(true);
      }

      const allergies = p.allergies || [];
      this.isLactoseFree.set(allergies.includes('laktosefrei') || allergies.includes('lactose'));
      this.isGlutenFree.set(allergies.includes('glutenfrei') || allergies.includes('gluten'));
      this.noPork.set(allergies.includes('kein_schweinefleisch') || allergies.includes('no_pork'));

      // Zusätzliche Synchronisation mit dem erweiterten Ernährungsprofil
      const dp = this.storageService.loadDietaryProfile();
      if (dp) {
        if (dp.dietaryForm === 'vegan') this.isVegan.set(true);
        if (dp.dietaryForm === 'vegetarian') this.isVegetarian.set(true);
        if (dp.intolerances?.includes('lactose')) this.isLactoseFree.set(true);
        if (dp.intolerances?.includes('gluten_sensitivity') || dp.allergies?.includes('gluten')) this.isGlutenFree.set(true);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  goToDietaryProfile(): void {
    this.router.navigate(['/dietary-profile'], { queryParams: { returnUrl: '/settings/goals' } });
  }

  async saveChanges(): Promise<void> {
    if (this.height() < 100 || this.height() > 250) {
      this.errorMessage.set('Bitte gib eine gültige Körpergröße an (100–250 cm).');
      return;
    }
    if (this.currentWeight() < 30 || this.currentWeight() > 300) {
      this.errorMessage.set('Bitte gib ein gültiges Gewicht an (30–300 kg).');
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    const current = this.profile();
    const oldWeight = current?.currentWeight;
    const newWeight = this.currentWeight();

    // 1. Wenn Gewicht geändert wurde, datierte Aufzeichnung in Gewichtshistorie hinzufügen
    if (oldWeight !== undefined && oldWeight !== newWeight) {
      await this.storageService.addWeightEntry(newWeight, undefined, 'Aktualisiert in Einstellungen');
    }

    // 2. Vorlieben & Allergien zusammenstellen
    let dietaryPref: DietaryPreference = 'omnivore';
    if (this.isVegan()) {
      dietaryPref = 'vegan';
    } else if (this.isVegetarian()) {
      dietaryPref = 'vegetarian';
    }

    const allergies: string[] = [];
    if (this.isLactoseFree()) allergies.push('laktosefrei');
    if (this.isGlutenFree()) allergies.push('glutenfrei');
    if (this.noPork()) allergies.push('kein_schweinefleisch');

    const updated: UserProfile = {
      ...(current || {
        id: 'guest_profile',
        name: 'Gast',
        birthDate: '1990-05-14',
        gender: 'female',
        createdAt: new Date().toISOString()
      }),
      height: this.height(),
      currentWeight: newWeight,
      targetWeight: this.targetWeight(),
      activityLevel: this.activityLevel(),
      goal: this.goal(),
      targetPaceWeeklyKg: this.targetPaceWeeklyKg(),
      dietaryPreference: dietaryPref,
      allergies,
      updatedAt: new Date().toISOString()
    };

    try {
      await this.storageService.saveProfile(updated);
      this.profile.set(updated);
      this.showToast('Körperdaten und Ziele erfolgreich gespeichert.');

      setTimeout(() => {
        this.router.navigate(['/settings']);
      }, 700);
    } catch {
      this.errorMessage.set('Fehler beim Speichern der Ziele.');
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
