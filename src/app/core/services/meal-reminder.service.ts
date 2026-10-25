import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ActionPerformed, ScheduleOptions } from '@capacitor/local-notifications';
import { MealType, Recipe } from '../models/recipe.model';
import { FoodLogItem } from '../models/food-log.model';
import { ReminderSettings, DEFAULT_REMINDER_SETTINGS, MealReminderLogEntry } from '../models/reminder.model';
import { StorageService } from './storage.service';
import { FoodLogService } from './food-log.service';
import { MealPlannerService } from './meal-planner.service';

const REMINDER_SETTINGS_KEY = 'down_kilos_meal_reminder_settings';
const REMINDER_HISTORY_KEY = 'down_kilos_meal_reminder_history';
const ACTION_TYPE_ID = 'MEAL_REMINDER_ACTIONS';

@Injectable({
  providedIn: 'root'
})
export class MealReminderService {
  private router = inject(Router);
  private storageService = inject(StorageService);
  private foodLog = inject(FoodLogService);
  private mealPlanner = inject(MealPlannerService);

  readonly settings = signal<ReminderSettings>(this.loadSettings());
  readonly history = signal<MealReminderLogEntry[]>(this.loadHistory());
  readonly hasPermission = signal<boolean>(false);
  readonly isNative = signal<boolean>(Capacitor.isNativePlatform());
  readonly isSupported = signal<boolean>(Capacitor.isPluginAvailable('LocalNotifications'));

  // Zustand für den aktiven interaktiven In-App Erinnerungs-Dialog
  readonly activePrompt = signal<{
    slot: MealType;
    plannedRecipe: Recipe | null;
    date: string;
    isOpen: boolean;
  } | null>(null);

  constructor() {
    this.initNotifications();

    // Reagiere auf Änderungen am Wochenplan oder an den Einstellungen
    effect(() => {
      const s = this.settings();
      if (s.enabled && !s.paused) {
        this.syncReminders();
      } else {
        this.cancelAllReminders();
      }
    });
  }

  private async initNotifications(): Promise<void> {
    if (!this.isNative() || !this.isSupported()) {
      // Im Browser: Standardmäßig bereit für In-App Dialoge
      this.hasPermission.set(true);
      return;
    }

    try {
      // Prüfe Berechtigungsstatus (ohne anzufragen!)
      const check = await LocalNotifications.checkPermissions();
      this.hasPermission.set(check.display === 'granted');

      // Registriere Aktionen: "Ja, wie geplant", "Etwas anderes", "Noch nichts gegessen"
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: ACTION_TYPE_ID,
            actions: [
              {
                id: 'as_planned',
                title: 'Ja, wie geplant'
              },
              {
                id: 'something_else',
                title: 'Etwas anderes'
              },
              {
                id: 'nothing_yet',
                title: 'Noch nichts gegessen'
              }
            ]
          }
        ]
      });

      // Listener für getippte Benachrichtigungen oder Aktions-Buttons
      await LocalNotifications.addListener('localNotificationActionPerformed', async (action: ActionPerformed) => {
        const slot = (action.notification.extra?.slot as MealType) || 'breakfast';
        const dateStr = (action.notification.extra?.date as string) || new Date().toISOString().split('T')[0];

        if (action.actionId === 'as_planned') {
          await this.confirmAsPlanned(slot, dateStr);
        } else if (action.actionId === 'something_else') {
          this.openAlternativeFoodInput(slot, dateStr);
        } else if (action.actionId === 'nothing_yet') {
          this.recordNothingYet(slot, dateStr);
        } else {
          // Klick auf die Benachrichtigung selbst -> Öffne In-App Dialog
          this.showInAppPrompt(slot, dateStr);
        }
      });
    } catch (err) {
      console.warn('LocalNotifications init non-fatal error:', err);
    }
  }

  /**
   * Holt die Benachrichtigungsberechtigung erst ein, wenn der Nutzer die Funktion aktiv einschaltet.
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isNative() || !this.isSupported()) {
      this.hasPermission.set(true);
      return true;
    }

    try {
      const res = await LocalNotifications.requestPermissions();
      const granted = res.display === 'granted';
      this.hasPermission.set(granted);
      return granted;
    } catch (err) {
      console.warn('Error requesting notification permissions:', err);
      return false;
    }
  }

  /**
   * Speichert neue Einstellungen und plant Erinnerungen neu.
   */
  async updateSettings(newSettings: Partial<ReminderSettings>): Promise<void> {
    const updated: ReminderSettings = {
      ...this.settings(),
      ...newSettings
    };

    if (updated.enabled && !this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) {
        // Falls Berechtigung abgelehnt wurde, bleibt enabled false
        updated.enabled = false;
      }
    }

    this.settings.set(updated);
    try {
      localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (updated.enabled && !updated.paused) {
      await this.syncReminders();
    } else {
      await this.cancelAllReminders();
    }
  }

  /**
   * Ermittelt das geplante Rezept für einen bestimmten Wochentag/Slot
   */
  getPlannedRecipe(slot: MealType, dateStr?: string): Recipe | null {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayIndex = (targetDate.getDay() + 6) % 7;
    const plan = this.mealPlanner.weeklyPlan();
    const dayPlan = plan[dayIndex];
    if (!dayPlan) return null;
    return dayPlan[slot] || null;
  }

  /**
   * Prüft, ob für eine Mahlzeit heute bereits ein Eintrag im Tagebuch existiert
   */
  isMealAlreadyLogged(slot: MealType, dateStr?: string): boolean {
    const items = this.foodLog.getItemsForMeal(slot);
    return items.some(i => i.status === 'eaten');
  }

  /**
   * Prüft, ob der Nutzer für heute bereits auf die Erinnerung reagiert hat
   */
  hasRespondedToday(slot: MealType, dateStr?: string): boolean {
    const today = dateStr || new Date().toISOString().split('T')[0];
    return this.history().some(h => h.date === today && h.slot === slot && h.status !== 'dismissed');
  }

  /**
   * Intelligente Synchronisation:
   * Plant nur Benachrichtigungen für Mahlzeiten, die noch offen sind.
   */
  async syncReminders(): Promise<void> {
    if (!this.isNative() || !this.isSupported() || !this.settings().enabled || this.settings().paused) {
      return;
    }

    const s = this.settings();
    const slots: { slot: MealType; enabled: boolean; time: string; id: number }[] = [
      { slot: 'breakfast', enabled: s.breakfastEnabled, time: s.breakfastTime, id: 101 },
      { slot: 'lunch', enabled: s.lunchEnabled, time: s.lunchTime, id: 102 },
      { slot: 'dinner', enabled: s.dinnerEnabled, time: s.dinnerTime, id: 103 }
    ];

    const todayStr = new Date().toISOString().split('T')[0];
    const notificationsToSchedule: any[] = [];

    for (const item of slots) {
      if (!item.enabled) continue;

      // Wenn die Mahlzeit bereits gegessen oder beantwortet wurde: keine Erinnerung senden!
      if (s.onlyOpenMeals && (this.isMealAlreadyLogged(item.slot) || this.hasRespondedToday(item.slot))) {
        await this.cancelReminder(item.id);
        continue;
      }

      const plannedRecipe = this.getPlannedRecipe(item.slot);
      const recipeTitle = plannedRecipe?.title || 'deine geplante Mahlzeit';

      // Berechne Zielzeit
      const [hours, minutes] = item.time.split(':').map(n => parseInt(n, 10));
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Falls die Zeit für heute bereits in der Vergangenheit liegt:
      if (scheduledTime.getTime() <= Date.now()) {
        // Nicht mehr für heute planen
        continue;
      }

      let title = `Hast du heute schon gefrühstückt?`;
      if (item.slot === 'lunch') title = `Hast du heute schon zu Mittag gegessen?`;
      if (item.slot === 'dinner') title = `Hast du heute schon zu Abend gegessen?`;

      let body = `Du hattest ${recipeTitle} geplant. Was hast du tatsächlich gegessen?`;
      if (s.privacyMode) {
        title = 'Mahlzeiten-Erinnerung';
        body = 'Deine Mahlzeiten-Erinnerung ist da.';
      }

      notificationsToSchedule.push({
        id: item.id,
        title,
        body,
        actionTypeId: ACTION_TYPE_ID,
        schedule: { at: scheduledTime },
        extra: {
          slot: item.slot,
          date: todayStr
        }
      });
    }

    if (notificationsToSchedule.length > 0) {
      try {
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      } catch (err) {
        console.warn('Error scheduling local notifications:', err);
      }
    }
  }

  async cancelReminder(id: number): Promise<void> {
    if (!this.isNative() || !this.isSupported()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch {
      // ignore
    }
  }

  async cancelAllReminders(): Promise<void> {
    if (!this.isNative() || !this.isSupported()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }, { id: 103 }] });
    } catch {
      // ignore
    }
  }

  /**
   * Aktion: "Ja, wie geplant"
   * Trägt das geplante Rezept exakt einmal als gegessen ein.
   */
  async confirmAsPlanned(slot: MealType, dateStr?: string): Promise<boolean> {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const planned = this.getPlannedRecipe(slot, today);
    if (!planned) return false;

    // Prüfe, ob genau dieses Rezept für diesen Tag/Slot bereits eingetragen ist
    const alreadyLogged = this.foodLog.loggedItems().some(
      i => i.recipeId === planned.id && i.mealType === slot && i.status === 'eaten'
    );
    if (alreadyLogged) {
      this.closePrompt();
      return true;
    }

    // Verbuche Portion und Kalorien
    this.foodLog.logRecipe(
      planned,
      1,
      'eaten',
      planned.calories,
      planned.protein,
      planned.carbs,
      planned.fat
    );

    // Historie aktualisieren
    this.recordHistoryEntry(today, slot, 'as_planned', planned.title);

    // Erinnerung abbrechen
    const idMap: Record<MealType, number> = { breakfast: 101, lunch: 102, dinner: 103, snack: 104 };
    await this.cancelReminder(idMap[slot]);

    this.closePrompt();
    return true;
  }

  /**
   * Aktion: "Etwas anderes"
   * Navigiert zur alternativen Lebensmittel-Erfassung
   */
  openAlternativeFoodInput(slot: MealType, dateStr?: string): void {
    const today = dateStr || new Date().toISOString().split('T')[0];
    this.closePrompt();
    this.router.navigate(['/was-hast-du-gegessen/alternative'], {
      queryParams: { slot, date: today }
    });
  }

  /**
   * Aktion: "Noch nichts gegessen"
   * Bucht 0 Kalorien, belässt das geplante Rezept im Wochenplan
   */
  recordNothingYet(slot: MealType, dateStr?: string): void {
    const today = dateStr || new Date().toISOString().split('T')[0];
    this.recordHistoryEntry(today, slot, 'nothing_yet', 'Noch nichts gegessen');
    this.closePrompt();
  }

  /**
   * Speichert alternative Lebensmittel als tatsächlich gegessen
   */
  recordAlternativeItems(slot: MealType, items: FoodLogItem[], dateStr?: string): void {
    const today = dateStr || new Date().toISOString().split('T')[0];

    // Jedes alternative Lebensmittel als gegessen im FoodLog eintragen
    for (const item of items) {
      if (item.productId) {
        const prod = this.storageService ? undefined : undefined;
      }
      const existing = this.foodLog.loggedItems();
      const updated = [item, ...existing];
      this.foodLog.loggedItems.set(updated);
      try {
        localStorage.setItem('down_kilos_today_food_log', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }

    const details = items.map(i => `${i.name} (${i.calories} kcal)`).join(', ');
    this.recordHistoryEntry(today, slot, 'replaced', details);

    const idMap: Record<MealType, number> = { breakfast: 101, lunch: 102, dinner: 103, snack: 104 };
    this.cancelReminder(idMap[slot]);
  }

  private recordHistoryEntry(date: string, slot: MealType, status: any, details?: string): void {
    const entry: MealReminderLogEntry = {
      date,
      slot,
      status,
      respondedAt: new Date().toISOString(),
      details
    };
    const current = this.history();
    const filtered = current.filter(h => !(h.date === date && h.slot === slot));
    const updated = [entry, ...filtered];
    this.history.set(updated);
    try {
      localStorage.setItem(REMINDER_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  showInAppPrompt(slot: MealType, dateStr?: string): void {
    const today = dateStr || new Date().toISOString().split('T')[0];
    const planned = this.getPlannedRecipe(slot, today);
    this.activePrompt.set({
      slot,
      plannedRecipe: planned,
      date: today,
      isOpen: true
    });
  }

  closePrompt(): void {
    this.activePrompt.set(null);
  }

  /**
   * Test-Funktion: Simuliert sofort eine Mahlzeiten-Erinnerung
   */
  async simulateTestReminder(slot: MealType = 'breakfast'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const planned = this.getPlannedRecipe(slot, today);
    const title = planned ? planned.title : 'Porridge mit Banane & Beeren';

    // Zeige den In-App Dialog direkt an
    this.showInAppPrompt(slot, today);

    // Falls auf einem nativen Gerät ausgeführt: auch echte lokale Notification abfeuern
    if (this.isSupported()) {
      try {
        let notifTitle = `Hast du heute schon gefrühstückt?`;
        if (slot === 'lunch') notifTitle = `Hast du heute schon zu Mittag gegessen?`;
        if (slot === 'dinner') notifTitle = `Hast du heute schon zu Abend gegessen?`;

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 999,
              title: notifTitle,
              body: `Du hattest ${title} geplant. Was hast du tatsächlich gegessen?`,
              actionTypeId: ACTION_TYPE_ID,
              schedule: { at: new Date(Date.now() + 1000) },
              extra: { slot, date: today }
            }
          ]
        });
      } catch (err) {
        console.warn('Native test notification error:', err);
      }
    }
  }

  private loadSettings(): ReminderSettings {
    try {
      const stored = localStorage.getItem(REMINDER_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_REMINDER_SETTINGS };
  }

  private loadHistory(): MealReminderLogEntry[] {
    try {
      const stored = localStorage.getItem(REMINDER_HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }
}
