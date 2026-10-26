import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealReminderService } from '../../../core/services/meal-reminder.service';

@Component({
  selector: 'app-meal-reminder-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meal-reminder-dialog.component.html',
  styleUrl: './meal-reminder-dialog.component.scss'
})
export class MealReminderDialogComponent {
  readonly reminderService = inject(MealReminderService);

  readonly promptData = computed(() => this.reminderService.activePrompt());

  readonly mealLabel = computed(() => {
    const data = this.promptData();
    if (!data) return 'Mahlzeit';
    switch (data.slot) {
      case 'breakfast': return 'Frühstück';
      case 'lunch': return 'Mittagessen';
      case 'dinner': return 'Abendessen';
      default: return 'Mahlzeit';
    }
  });

  readonly titleText = computed(() => {
    const data = this.promptData();
    if (!data) return '';
    switch (data.slot) {
      case 'breakfast': return 'Hast du heute schon gefrühstückt?';
      case 'lunch': return 'Hast du heute schon zu Mittag gegessen?';
      case 'dinner': return 'Hast du heute schon zu Abend gegessen?';
      default: return 'Hast du deine Mahlzeit schon gegessen?';
    }
  });

  readonly plannedTitle = computed(() => {
    const data = this.promptData();
    return data?.plannedRecipe?.title || 'Porridge mit Banane & Beeren';
  });

  async onConfirmPlanned(): Promise<void> {
    const data = this.promptData();
    if (!data) return;
    await this.reminderService.confirmAsPlanned(data.slot, data.date);
  }

  onSelectAlternative(): void {
    const data = this.promptData();
    if (!data) return;
    this.reminderService.openAlternativeFoodInput(data.slot, data.date);
  }

  onNothingYet(): void {
    const data = this.promptData();
    if (!data) return;
    this.reminderService.recordNothingYet(data.slot, data.date);
  }

  close(): void {
    this.reminderService.closePrompt();
  }
}
