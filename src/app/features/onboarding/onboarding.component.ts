import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StorageService } from '../../core/services/storage.service';
import { FoodLogService } from '../../core/services/food-log.service';
import { ShoppingListService } from '../../core/services/shopping-list.service';
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
  BiologicalGender,
  DietaryPreference,
  GOAL_OPTIONS,
  UserProfile
} from '../../core/models/user-profile.model';

import { HamburgerButtonComponent } from '../../shared/components/hamburger-button/hamburger-button.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HamburgerButtonComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.scss'
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storageService = inject(StorageService);
  private foodLogService = inject(FoodLogService);
  private shoppingListService = inject(ShoppingListService);

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly goalOptions = GOAL_OPTIONS;
  readonly availableAllergies: string[] = ['Laktose', 'Gluten', 'Nüsse', 'Soja', 'Fruktose'];
  isSubmitting = false;
  formErrorMessage: string | null = null;
  private draftSubscription?: Subscription;

  // STRICT REQUIREMENT: No dummy data in production. All fields start empty on first launch.
  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    birthDate: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    height: [null as number | null, [Validators.required, Validators.min(100), Validators.max(250)]],
    currentWeight: [null as number | null, [Validators.required, Validators.min(35), Validators.max(250)]],
    targetWeight: [null as number | null],
    activityLevel: ['', [Validators.required]],
    goal: ['lose_weight', [Validators.required]],
    dietaryPreference: ['omnivore'],
    allergies: [[] as string[]]
  });

  async ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('reset') === 'true') {
      await this.storageService.resetAllData();
      return;
    }

    if (this.route.snapshot.queryParamMap.get('testUser') === 'true') {
      this.form.patchValue({
        name: 'Mario',
        birthDate: '1990-05-14',
        gender: 'male',
        height: 180,
        currentWeight: 82,
        activityLevel: 'moderate',
        goal: 'lose_weight'
      });
      return;
    }

    const existing = await this.storageService.loadProfile();
    if (existing) {
      this.form.patchValue({
        name: existing.name || '',
        birthDate: existing.birthDate || '',
        gender: existing.gender || '',
        height: existing.height || null,
        currentWeight: existing.currentWeight || null,
        targetWeight: existing.targetWeight || null,
        activityLevel: existing.activityLevel || '',
        goal: existing.goal || 'lose_weight',
        dietaryPreference: existing.dietaryPreference || 'omnivore',
        allergies: existing.allergies || []
      });
    } else {
      // Restore draft if saved previously
      const draft = this.storageService.getOnboardingDraft();
      if (draft && typeof draft === 'object') {
        this.form.patchValue(draft);
      }
    }

    // Auto-save draft on every change to prevent data loss on crashes or accidental reloads
    this.draftSubscription = this.form.valueChanges.subscribe(val => {
      if (!this.isSubmitting) {
        this.storageService.saveOnboardingDraft(val);
      }
    });

    this.storageService.setOnboardingStep('personal-data');
  }

  ngOnDestroy(): void {
    this.draftSubscription?.unsubscribe();
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  setGender(gender: 'female' | 'male') {
    this.form.patchValue({ gender });
    this.form.get('gender')?.markAsTouched();
    this.form.get('gender')?.markAsDirty();
  }

  selectActivity(level: ActivityLevel) {
    this.form.patchValue({ activityLevel: level });
    this.form.get('activityLevel')?.markAsTouched();
    this.form.get('activityLevel')?.markAsDirty();
  }

  setDietaryPreference(pref: DietaryPreference) {
    this.form.patchValue({ dietaryPreference: pref });
  }

  toggleAllergy(allergy: string) {
    const current: string[] = this.form.get('allergies')?.value || [];
    const index = current.indexOf(allergy);
    let updated: string[];
    if (index >= 0) {
      updated = current.filter(a => a !== allergy);
    } else {
      updated = [...current, allergy];
    }
    this.form.patchValue({ allergies: updated });
  }

  isAllergySelected(allergy: string): boolean {
    const current: string[] = this.form.get('allergies')?.value || [];
    return current.includes(allergy);
  }

  private scrollToFirstInvalidField(): void {
    if (typeof document === 'undefined') return;
    const invalidKey = Object.keys(this.form.controls).find(k => this.form.controls[k].invalid);
    if (!invalidKey) return;

    // Map control names to specific input or section IDs
    const element = document.querySelector(
      `#${invalidKey}Input, [formControlName="${invalidKey}"]`
    );
    if (element) {
      if (typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const htmlEl = element as HTMLElement;
      if (typeof htmlEl.focus === 'function') {
        htmlEl.focus();
      }
    }
  }

  async onSubmit() {
    // Prevent duplicate simultaneous submissions
    if (this.isSubmitting) {
      return;
    }

    this.formErrorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formErrorMessage = 'Bitte fülle alle Pflichtfelder (Name, Geburtsdatum, Geschlecht, Größe, Gewicht, Aktivitätslevel) korrekt aus.';
      this.scrollToFirstInvalidField();
      return;
    }

    this.isSubmitting = true;

    try {
      const formVal = this.form.value;
      const profile: UserProfile = {
        id: 'guest_profile',
        name: (formVal.name || '').trim(),
        birthDate: formVal.birthDate,
        gender: formVal.gender as BiologicalGender,
        height: Number(formVal.height),
        currentWeight: Number(formVal.currentWeight),
        targetWeight: formVal.targetWeight ? Number(formVal.targetWeight) : undefined,
        activityLevel: formVal.activityLevel as ActivityLevel,
        goal: formVal.goal,
        dietaryPreference: formVal.dietaryPreference || 'omnivore',
        allergies: formVal.allergies || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.storageService.saveProfile(profile);
      this.storageService.clearOnboardingDraft();
      this.storageService.setOnboardingStep('calorie-target');
      this.foodLogService.clearTodayLog();
      this.shoppingListService.clearAllItems();
      await this.router.navigate(['/loading'], { queryParams: { step: 'calculate' } });
    } catch (err: unknown) {
      console.error('Error saving profile in onboarding:', err);
      this.formErrorMessage = 'Beim Speichern deiner Daten ist ein Fehler aufgetreten. Bitte versuche es erneut.';
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/how-it-works']);
  }
}
