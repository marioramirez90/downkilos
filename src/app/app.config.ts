import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';
import { DE_TRANSLATIONS } from './core/i18n/de.translations';

export function initTranslations(translate: TranslateService) {
  return () => {
    translate.setTranslation('de', DE_TRANSLATIONS);
    translate.use('de');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTranslateService({ fallbackLang: 'de', lang: 'de' }),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslateService],
      multi: true
    }
  ]
};

