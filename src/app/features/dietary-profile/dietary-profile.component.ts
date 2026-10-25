import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import {
  COMMON_FRUIT_ALLERGENS,
  DEFAULT_DIETARY_PROFILE,
  DietaryForm,
  DietaryProfile,
  EU_14_ALLERGENS,
  EXCLUSION_SUGGESTIONS_DATABASE,
  INTOLERANCE_OPTIONS,
  SearchSuggestionItem
} from '../../core/models/dietary-profile.model';

@Component({
  selector: 'app-dietary-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dietary-profile.component.html',
  styleUrl: './dietary-profile.component.scss'
})
export class DietaryProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storageService = inject(StorageService);

  readonly returnUrl = signal<string | null>(null);
  readonly isEditMode = computed(() => {
    return !!this.returnUrl() || this.storageService.isOnboardingCompleted();
  });

  readonly intoleranceOptions = INTOLERANCE_OPTIONS;
  readonly eu14Allergens = EU_14_ALLERGENS;
  readonly fruitAllergens = COMMON_FRUIT_ALLERGENS;

  // Form states
  readonly selectedDietaryForm = signal<DietaryForm>('omnivore');
  readonly selectedIntolerances = signal<string[]>([]);
  readonly selectedAllergies = signal<string[]>([]);
  readonly customExcludedFoods = signal<string[]>([]);
  readonly selectedDislikes = signal<string[]>([]);

  // Search & Auto-suggestions state
  readonly excludeSearchQuery = signal<string>('');
  isSearchFocused = false;
  customDislikeInput = '';
  isSaving = false;

  // Standard dislike options for rapid selection
  readonly standardDislikes: string[] = [
    'Pilze',
    'Zwiebeln',
    'Brokkoli',
    'Oliven',
    'Fisch',
    'Paprika',
    'Rosenkohl',
    'Koriander',
    'Knoblauch'
  ];

  readonly filteredSuggestions = computed<SearchSuggestionItem[]>(() => {
    const q = this.excludeSearchQuery().trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const excluded = this.customExcludedFoods().map(e => e.toLowerCase());
    return EXCLUSION_SUGGESTIONS_DATABASE.filter(item =>
      (item.term.toLowerCase().includes(q) || item.clarification.toLowerCase().includes(q)) &&
      !excluded.includes(item.term.toLowerCase())
    ).slice(0, 6);
  });

  async ngOnInit(): Promise<void> {
    const returnUrlParam = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrlParam) {
      this.returnUrl.set(returnUrlParam);
    }

    const existing = this.storageService.loadDietaryProfile();
    if (existing) {
      this.selectedDietaryForm.set(existing.dietaryForm || 'omnivore');
      this.selectedIntolerances.set(existing.intolerances || []);
      this.selectedAllergies.set(existing.allergies || []);
      this.customExcludedFoods.set(existing.customExcludedFoods || []);
      this.selectedDislikes.set(existing.dislikes || []);
    } else {
      // Sync initial data from user profile if available
      const prof = await this.storageService.loadProfile();
      if (prof) {
        if (prof.dietaryPreference) {
          const formMap: Record<string, DietaryForm> = {
            vegetarian: 'vegetarian',
            vegan: 'vegan',
            omnivore: 'omnivore'
          };
          this.selectedDietaryForm.set(formMap[prof.dietaryPreference] || 'omnivore');
        }
        if (prof.allergies && prof.allergies.length > 0) {
          this.selectedAllergies.set([...prof.allergies]);
        }
      }
    }
  }

  // --- Intolerances Handling ---
  toggleIntolerance(id: string): void {
    if (id === 'none') {
      if (this.selectedIntolerances().includes('none')) {
        this.selectedIntolerances.set([]);
      } else {
        this.selectedIntolerances.set(['none']);
      }
      return;
    }

    const current = this.selectedIntolerances().filter(i => i !== 'none');
    if (current.includes(id)) {
      this.selectedIntolerances.set(current.filter(i => i !== id));
    } else {
      this.selectedIntolerances.set([...current, id]);
    }
  }

  isIntoleranceSelected(id: string): boolean {
    return this.selectedIntolerances().includes(id);
  }

  // --- Allergies Handling ---
  toggleAllergy(id: string): void {
    const current = this.selectedAllergies();
    if (current.includes(id)) {
      this.selectedAllergies.set(current.filter(a => a !== id));
    } else {
      this.selectedAllergies.set([...current, id]);
    }
  }

  isAllergySelected(id: string): boolean {
    return this.selectedAllergies().includes(id);
  }

  // --- Search & Custom Exclusions ---
  selectSuggestion(item: SearchSuggestionItem): void {
    if (!this.customExcludedFoods().includes(item.term)) {
      this.customExcludedFoods.update(list => [...list, item.term]);
    }
    this.excludeSearchQuery.set('');
    this.isSearchFocused = false;
  }

  addCustomExclusion(): void {
    const trimmed = this.excludeSearchQuery().trim();
    if (!trimmed) return;

    if (!this.customExcludedFoods().includes(trimmed)) {
      this.customExcludedFoods.update(list => [...list, trimmed]);
    }
    this.excludeSearchQuery.set('');
    this.isSearchFocused = false;
  }

  removeExclusion(term: string): void {
    this.customExcludedFoods.update(list => list.filter(e => e !== term));
  }

  // --- Dietary Form Handling ---
  selectDietaryForm(form: DietaryForm): void {
    this.selectedDietaryForm.set(form);
  }

  // --- Dislikes Handling ---
  toggleDislike(dislike: string): void {
    const current = this.selectedDislikes();
    if (current.includes(dislike)) {
      this.selectedDislikes.set(current.filter(d => d !== dislike));
    } else {
      this.selectedDislikes.set([...current, dislike]);
    }
  }

  isDislikeSelected(dislike: string): boolean {
    return this.selectedDislikes().includes(dislike);
  }

  addCustomDislike(): void {
    const trimmed = this.customDislikeInput.trim();
    if (!trimmed) return;

    if (!this.selectedDislikes().includes(trimmed)) {
      this.selectedDislikes.update(list => [...list, trimmed]);
    }
    this.customDislikeInput = '';
  }

  // --- Navigation & Save ---
  goBack(): void {
    const target = this.returnUrl();
    if (target) {
      this.router.navigate([target]);
    } else if (this.storageService.isOnboardingCompleted()) {
      this.router.navigate(['/settings']);
    } else {
      this.router.navigate(['/retailers']);
    }
  }

  async saveAndContinue(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const profile: DietaryProfile = {
        dietaryForm: this.selectedDietaryForm(),
        intolerances: this.selectedIntolerances().filter(i => i !== 'none'),
        allergies: this.selectedAllergies(),
        customExcludedFoods: this.customExcludedFoods(),
        dislikes: this.selectedDislikes(),
        updatedAt: new Date().toISOString()
      };

      this.storageService.saveDietaryProfile(profile);

      const target = this.returnUrl();
      if (target) {
        await this.router.navigate([target]);
      } else if (this.storageService.isOnboardingCompleted()) {
        await this.router.navigate(['/settings']);
      } else {
        this.storageService.setOnboardingStep('dietary');
        await this.router.navigate(['/meal-planner']);
      }
    } finally {
      this.isSaving = false;
    }
  }
}
