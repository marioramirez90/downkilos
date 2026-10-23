import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
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
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storageService = inject(StorageService);

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly goalOptions = GOAL_OPTIONS;
  readonly availableAllergies: string[] = ['Laktose', 'Gluten', 'Nüsse', 'Soja', 'Fruktose'];
  isSubmitting = false;

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
    }
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

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formVal = this.form.value;
      const profile: UserProfile = {
        id: 'guest_profile',
        name: formVal.name.trim(),
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
      this.router.navigate(['/calculator']);
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/how-it-works']);
  }
}
