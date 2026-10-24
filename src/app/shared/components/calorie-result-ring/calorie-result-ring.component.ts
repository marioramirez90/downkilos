import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calorie-result-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calorie-result-ring.component.html',
  styleUrl: './calorie-result-ring.component.scss'
})
export class CalorieResultRingComponent {
  @Input() targetCalories: number = 2000;
  @Input() formattedCalories: string = '2.000';
  @Input() unit: string = 'kcal';
  @Input() subtitle: string = 'Tagesziel';

  /**
   * SVG Geometry Constants:
   * ViewBox: 0 0 240 240
   * Center: cx=120, cy=120
   * Radius: r=88, Stroke-width: 24
   * Circumference C = 2 * PI * 88 = 552.92
   *
   * Reference Design Arcs:
   * 1. Pale sage background ring (#E2EBE3)
   * 2. Bright vibrant green arc (#3ACC50):
   *    Starts at ~12:15 (-75° from 3 o'clock / ~15° past 12 o'clock)
   *    Sweeps clockwise by ~120° down to ~4:30 (45°)
   *    Arc length = 552.92 * (120 / 360) = 184.31
   * 3. Dark forest green arc (#005333):
   *    Starts at ~4:30 (45°)
   *    Sweeps clockwise by ~155° through bottom to ~9:30 (200°)
   *    Arc length = 552.92 * (155 / 360) = 238.06
   * 4. Open gap from ~9:30 to ~12:15 reveals the pale sage track circle (#E2EBE3).
   *
   * Both colored arcs have thick stroke (24px) and stroke-linecap="round".
   */
  readonly circumference = 552.92;
  readonly brightArcLength = 184.31;
  readonly darkArcLength = 238.06;

  readonly displayCalories = computed(() => {
    if (this.formattedCalories) return this.formattedCalories;
    return (this.targetCalories || 2000).toLocaleString('de-DE');
  });
}
