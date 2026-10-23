import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageService } from '../../core/services/storage.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LogoComponent } from '../../shared/components/logo/logo.component';

export interface IntroScene {
  id: number;
  titleKey: string;
  headlineKey: string;
  descKey: string;
  noteKey?: string;
  imageSrc?: string;
  imageAlt?: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LogoComponent],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss'
})
export class HowItWorksComponent {
  private router = inject(Router);
  private storageService = inject(StorageService);

  readonly currentSceneIndex = signal<number>(0);
  readonly totalScenes = 5;

  readonly scenes: IntroScene[] = [
    {
      id: 1,
      titleKey: 'HOW_IT_WORKS.SCENE_1_TITLE',
      headlineKey: 'HOW_IT_WORKS.SCENE_1_TEXT',
      descKey: 'HOW_IT_WORKS.SCENE_1_DESC',
      imageSrc: 'images/intro/scene-1-supermarket.jpg',
      imageAlt: 'Kundin betrachtet Nährwerttabelle im Supermarkt'
    },
    {
      id: 2,
      titleKey: 'HOW_IT_WORKS.SCENE_2_TITLE',
      headlineKey: 'HOW_IT_WORKS.SCENE_2_TEXT',
      descKey: 'HOW_IT_WORKS.SCENE_2_DESC',
      noteKey: 'HOW_IT_WORKS.SCENE_2_NOTE',
      imageSrc: 'images/intro/scene-2-portions.jpg',
      imageAlt: 'Frische Lebensmittel, Salat mit Dressing und Portionen'
    },
    {
      id: 3,
      titleKey: 'HOW_IT_WORKS.SCENE_3_TITLE',
      headlineKey: 'HOW_IT_WORKS.SCENE_3_TEXT',
      descKey: 'HOW_IT_WORKS.SCENE_3_DESC',
      imageSrc: 'images/intro/scene-3-solution.jpg',
      imageAlt: 'Smartphone mit transparenter Down Kilos Nährwertübersicht'
    },
    {
      id: 4,
      titleKey: 'HOW_IT_WORKS.SCENE_4_TITLE',
      headlineKey: 'HOW_IT_WORKS.SCENE_4_TEXT',
      descKey: 'HOW_IT_WORKS.SCENE_4_DESC',
      noteKey: 'HOW_IT_WORKS.SCENE_4_NOTE',
      imageSrc: 'images/intro/scene-4-groceries.jpg',
      imageAlt: 'Einkaufszutaten und Einkaufsliste auf Holztisch'
    },
    {
      id: 5,
      titleKey: 'HOW_IT_WORKS.SCENE_5_TITLE',
      headlineKey: 'HOW_IT_WORKS.SCENE_5_TEXT',
      descKey: 'HOW_IT_WORKS.SCENE_5_DESC'
    }
  ];

  nextScene(): void {
    if (this.currentSceneIndex() < this.totalScenes - 1) {
      this.currentSceneIndex.update(idx => idx + 1);
    } else {
      this.finishIntro();
    }
  }

  prevScene(): void {
    if (this.currentSceneIndex() > 0) {
      this.currentSceneIndex.update(idx => idx - 1);
    }
  }

  goToScene(index: number): void {
    if (index >= 0 && index < this.totalScenes) {
      this.currentSceneIndex.set(index);
    }
  }

  skipIntro(): void {
    this.finishIntro();
  }

  finishIntro(): void {
    // Wenn der Nutzer das Onboarding bereits abgeschlossen hat (Aufruf aus Mehr-Menü):
    if (this.storageService.isOnboardingCompleted()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Beim ersten Start: Weiter zu Screen 3 (Mein Ziel erstellen)
    this.router.navigate(['/onboarding']);
  }
}
