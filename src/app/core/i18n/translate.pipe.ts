import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DE_TRANSLATIONS } from './de.translations';

function getNestedValue(obj: Record<string, any>, path: string): string {
  if (!obj || !path) return path;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translateService = inject(TranslateService, { optional: true });
  private cdr = inject(ChangeDetectorRef, { optional: true });
  private sub?: { unsubscribe: () => void };

  constructor() {
    if (this.translateService?.onLangChange) {
      this.sub = this.translateService.onLangChange.subscribe(() => {
        this.cdr?.markForCheck();
      });
    }
  }

  transform(key: string, params?: Record<string, any>): string {
    if (!key) return '';
    if (this.translateService) {
      const val = this.translateService.instant(key, params);
      if (val && val !== key) {
        return val;
      }
    }
    // Fallback to bundled translations
    let fallback = getNestedValue(DE_TRANSLATIONS, key);
    if (params && typeof fallback === 'string') {
      for (const [pKey, pVal] of Object.entries(params)) {
        fallback = fallback.replace(new RegExp(`{{${pKey}}}`, 'g'), String(pVal));
      }
    }
    return fallback;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
