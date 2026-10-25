import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { MealPlannerService } from './meal-planner.service';
import { FoodLogService } from './food-log.service';
import { Recipe, MealType } from '../models/recipe.model';

export type ActiveMealSlot = 'breakfast' | 'lunch' | 'dinner' | 'all_completed';

export interface MealWindowDefinition {
  slot: 'breakfast' | 'lunch' | 'dinner';
  label: string;
  timeRangeText: string;
  startHour: number;
  endHour: number;
}

export const MEAL_WINDOWS: MealWindowDefinition[] = [
  {
    slot: 'breakfast',
    label: 'Frühstück',
    timeRangeText: '06:00 – 12:00 Uhr',
    startHour: 6,
    endHour: 12
  },
  {
    slot: 'lunch',
    label: 'Mittagessen',
    timeRangeText: '12:00 – 17:00 Uhr',
    startHour: 12,
    endHour: 17
  },
  {
    slot: 'dinner',
    label: 'Abendessen',
    timeRangeText: '17:00 – 23:00 Uhr',
    startHour: 17,
    endHour: 23
  }
];

const GERMAN_WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

@Injectable({
  providedIn: 'root'
})
export class MealScheduleService implements OnDestroy {
  private mealPlanner = inject(MealPlannerService);
  private foodLog = inject(FoodLogService);

  readonly currentTime = signal<Date>(new Date());
  private timerId: any = null;
  private visibilityHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;

  constructor() {
    this.setupTimeListener();
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (typeof window !== 'undefined') {
      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler);
      }
      if (this.focusHandler) {
        window.removeEventListener('focus', this.focusHandler);
      }
    }
  }

  /**
   * Kontrollierte Zeitaktualisierung:
   * Aktualisiert regelmäßig (alle 60 Sek.) sowie bei App-Reaktivierung / Focus.
   */
  private setupTimeListener(): void {
    if (typeof window === 'undefined') return;

    this.timerId = setInterval(() => {
      this.refreshCurrentTime();
    }, 60_000);

    this.visibilityHandler = () => {
      if (!document.hidden) {
        this.refreshCurrentTime();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.focusHandler = () => {
      this.refreshCurrentTime();
    };
    window.addEventListener('focus', this.focusHandler);
  }

  refreshCurrentTime(): void {
    this.currentTime.set(new Date());
  }

  /**
   * Manuelles Setzen für Tests oder Simulation
   */
  setCurrentTime(date: Date): void {
    this.currentTime.set(date);
  }

  /**
   * Deutscher Wochentagsname (z. B. "Montag", "Dienstag", ...)
   */
  readonly weekdayName = computed(() => {
    const d = this.currentTime();
    return GERMAN_WEEKDAYS[d.getDay()];
  });

  /**
   * Tag-Index für den Wochenplan (0 = Montag, ..., 6 = Sonntag)
   */
  readonly dayIndex = computed(() => {
    const d = this.currentTime();
    return (d.getDay() + 6) % 7;
  });

  /**
   * Bestimmt das zeitlich reguläre Basis-Zeitfenster anhand der Geräteuhrzeit:
   * 06:00 – 11:59:59 -> breakfast
   * 12:00 – 16:59:59 -> lunch
   * 17:00 – 22:59:59 -> dinner
   * Vor 06:00 Uhr -> breakfast
   * Nach 23:00 Uhr -> dinner (sofern noch nicht gegessen) oder breakfast für Folgetag
   */
  readonly baseTimeSlot = computed<'breakfast' | 'lunch' | 'dinner'>(() => {
    const now = this.currentTime();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    // 06:00 Uhr = 360 Min, 12:00 Uhr = 720 Min
    if (totalMinutes < 720) {
      return 'breakfast';
    }
    // 12:00 Uhr = 720 Min, 17:00 Uhr = 1020 Min
    if (totalMinutes < 1020) {
      return 'lunch';
    }
    // 17:00 Uhr = 1020 Min, 23:00 Uhr = 1380 Min
    if (totalMinutes < 1380) {
      return 'dinner';
    }
    // Nach 23:00 Uhr
    return 'dinner';
  });

  /**
   * Prüft, welche Mahlzeiten heute bereits gegessen wurden.
   */
  readonly eatenMealTypes = computed<Set<MealType>>(() => {
    const items = this.foodLog.loggedItems();
    const set = new Set<MealType>();
    for (const item of items) {
      if (item.status === 'eaten') {
        set.add(item.mealType);
      }
    }
    return set;
  });

  /**
   * Intelligente aktive Mahlzeit:
   * Wenn das Frühstück bereits als gegessen erfasst wurde,
   * wechselt die Anzeige automatisch zum Mittagessen (auch vor 12 Uhr!).
   * Wenn alle Mahlzeiten des Tages erledigt sind, wird 'all_completed' signalisiert.
   */
  readonly activeMealSlot = computed<ActiveMealSlot>(() => {
    const base = this.baseTimeSlot();
    const eaten = this.eatenMealTypes();

    if (base === 'breakfast') {
      if (!eaten.has('breakfast')) return 'breakfast';
      if (!eaten.has('lunch')) return 'lunch';
      if (!eaten.has('dinner')) return 'dinner';
      return 'all_completed';
    }

    if (base === 'lunch') {
      if (!eaten.has('lunch')) return 'lunch';
      if (!eaten.has('dinner')) return 'dinner';
      if (!eaten.has('breakfast')) return 'breakfast';
      return 'all_completed';
    }

    // dinner
    if (!eaten.has('dinner')) return 'dinner';
    if (!eaten.has('breakfast') && !eaten.has('lunch')) {
      // Wenn weder Frühstück noch Mittagessen gegessen wurden,
      // aber der Abend vorbei ist:
      return 'all_completed';
    }
    return 'all_completed';
  });

  /**
   * Dynamische Zeitfenster-Informationen für die aktuelle aktive Mahlzeit
   */
  readonly currentWindowDef = computed<MealWindowDefinition | null>(() => {
    const slot = this.activeMealSlot();
    if (slot === 'all_completed') return null;
    return MEAL_WINDOWS.find(w => w.slot === slot) || MEAL_WINDOWS[0];
  });

  /**
   * Dynamische linke Überschrift, z. B. "Frühstück für Montag"
   */
  readonly dynamicHeading = computed(() => {
    const slot = this.activeMealSlot();
    const weekday = this.weekdayName();
    if (slot === 'all_completed') {
      return `Alle Mahlzeiten für ${weekday} erledigt`;
    }
    const def = this.currentWindowDef();
    const label = def?.label || 'Mahlzeit';
    return `${label} für ${weekday}`;
  });

  /**
   * Dynamische rechte Zeitspanne, z. B. "06:00 – 12:00 Uhr"
   */
  readonly dynamicTimeRangeText = computed(() => {
    const def = this.currentWindowDef();
    return def ? def.timeRangeText : '';
  });

  /**
   * Lädt das geplante Rezept für den aktuellen Tag und die aktive Mahlzeit aus dem Wochenplan
   */
  readonly plannedRecipeForActiveSlot = computed<Recipe | null>(() => {
    const slot = this.activeMealSlot();
    if (slot === 'all_completed') return null;

    const plan = this.mealPlanner.weeklyPlan();
    const idx = this.dayIndex();
    const dayPlan = plan[idx];
    if (!dayPlan) return null;

    const recipe = dayPlan[slot];
    return recipe || null;
  });

  /**
   * Geplante Portionen für die aktive Mahlzeit (Standard: 1)
   */
  readonly plannedPortionsForActiveSlot = computed<number>(() => {
    const slot = this.activeMealSlot();
    if (slot === 'all_completed') return 1;

    const plan = this.mealPlanner.weeklyPlan();
    const idx = this.dayIndex();
    const dayPlan = plan[idx];
    if (!dayPlan || !dayPlan.portions) return 1;

    return dayPlan.portions[slot] || 1;
  });

  /**
   * Markiert das aktuell geplante Rezept als gegessen und trägt es im FoodLog ein.
   * Gibt die ID des erstellten Eintrags zurück (für Undo).
   */
  markCurrentMealAsEaten(): string | null {
    const recipe = this.plannedRecipeForActiveSlot();
    const slot = this.activeMealSlot();
    if (!recipe || slot === 'all_completed') return null;

    const portions = this.plannedPortionsForActiveSlot();
    const calories = Math.round((recipe.calories || 0) * portions);
    const protein = Math.round((recipe.protein || 0) * portions * 10) / 10;
    const carbs = Math.round((recipe.carbs || 0) * portions * 10) / 10;
    const fat = Math.round((recipe.fat || 0) * portions * 10) / 10;

    // Eindeutige ID für diesen Eintrag
    const logId = `planned-${slot}-${Date.now()}`;
    const portionCost = Math.round((recipe.pricePerPortion * portions) * 100) / 100;

    const newItem = {
      id: logId,
      recipeId: recipe.id,
      name: recipe.title,
      category: 'recipe' as const,
      imageUrl: recipe.imageUrl,
      mealType: slot,
      amountGrams: 350 * portions,
      displayQuantity: portions === 1 ? '1 Portion' : `${portions} Portionen`,
      calories,
      protein,
      carbs,
      fat,
      portionCost,
      status: 'eaten' as const,
      loggedAt: new Date().toISOString(),
      isRecipe: true
    };

    const current = this.foodLog.loggedItems();
    // Prüfe, ob genau dieses Rezept für diese Mahlzeit heute bereits existiert
    const alreadyLogged = current.some(i => i.recipeId === recipe.id && i.mealType === slot && i.status === 'eaten');
    if (alreadyLogged) {
      return null;
    }

    const updated = [newItem, ...current];
    this.foodLog.loggedItems.set(updated);
    try {
      localStorage.setItem('down_kilos_today_food_log', JSON.stringify(updated));
    } catch {
      // ignore
    }

    return logId;
  }

  /**
   * Macht das Eintragen rückgängig
   */
  undoEatenMeal(logId: string): void {
    this.foodLog.removeItem(logId);
  }
}
