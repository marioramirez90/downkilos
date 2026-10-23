import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import {
  ACTIVITY_OPTIONS,
  ActivityLevel,
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
  private storageService = inject(StorageService);

  readonly activityOptions = ACTIVITY_OPTIONS;
  readonly goalOptions = GOAL_OPTIONS;
  isSubmitting = false;

  form: FormGroup = this.fb.group({
    name: ['Lisa Müller', [Validators.required, Validators.minLength(2)]],
    birthDate: ['1990-05-14', [Validators.required]],
    gender: ['female', [Validators.required]],
    height: [168, [Validators.required, Validators.min(100), Validators.max(250)]],
    currentWeight: [78, [Validators.required, Validators.min(35), Validators.max(250)]],
    targetWeight: [62],
    activityLevel: ['sedentary', [Validators.required]],
    goal: ['lose_weight', [Validators.required]]
  });

  async ngOnInit() {
    const existing = await this.storageService.loadProfile();
    if (existing) {
      this.form.patchValue({
        name: existing.name,
        birthDate: existing.birthDate,
        gender: existing.gender || 'female',
        height: existing.height,
        currentWeight: existing.currentWeight,
        targetWeight: existing.targetWeight || null,
        activityLevel: existing.activityLevel,
        goal: existing.goal
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  setGender(gender: 'female' | 'male') {
    this.form.patchValue({ gender });
  }

  selectActivity(level: ActivityLevel) {
    this.form.patchValue({ activityLevel: level });
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
        gender: formVal.gender,
        height: Number(formVal.height),
        currentWeight: Number(formVal.currentWeight),
        targetWeight: formVal.targetWeight ? Number(formVal.targetWeight) : undefined,
        activityLevel: formVal.activityLevel,
        goal: formVal.goal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.storageService.saveProfile(profile);
      this.router.navigate(['/retailers']);
    } finally {
      this.isSubmitting = false;
    }
  }

  goBack() {
    this.router.navigate(['/welcome']);
  }
}
