import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { WeightEntry } from '../../core/models/weight-log.model';
import { BottomNavComponent } from '../../shared/components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-weight',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  templateUrl: './weight.component.html',
  styleUrl: './weight.component.scss'
})
export class WeightComponent implements OnInit {
  private router = inject(Router);
  private storageService = inject(StorageService);

  readonly weightHistory = computed(() => this.storageService.weightHistory());
  readonly profile = computed(() => this.storageService.profile());

  readonly currentWeight = computed<number | null>(() => {
    const list = this.weightHistory();
    if (list && list.length > 0) {
      return list[list.length - 1].weight;
    }
    const p = this.profile();
    return p?.currentWeight ?? null;
  });

  inputWeight: number | null = null;
  inputDate: string = new Date().toISOString().split('T')[0];
  inputNote: string = '';
  toastMessage = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
    this.storageService.loadWeightHistory();
    const curr = this.currentWeight();
    if (curr) {
      this.inputWeight = curr;
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  async saveWeight(): Promise<void> {
    if (!this.inputWeight || this.inputWeight < 30 || this.inputWeight > 300) {
      this.showToast('Bitte ein realistisches Gewicht zwischen 30 und 300 kg eingeben.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const rounded = Number(this.inputWeight.toFixed(1));
      const note = this.inputNote.trim() || undefined;
      await this.storageService.addWeightEntry(rounded, this.inputDate, note);
      this.showToast(`Gewicht ${rounded.toFixed(1)} kg erfolgreich gespeichert!`);
      this.inputNote = '';
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteEntry(id: string): Promise<void> {
    await this.storageService.deleteWeightEntry(id);
    this.showToast('Eintrag gelöscht.');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 2800);
  }
}
