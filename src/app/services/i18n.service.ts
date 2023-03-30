import { registerLocaleData } from '@angular/common';
import { Injectable } from '@angular/core';
import { loadTranslations } from '@angular/localize';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  locale =
    localStorage.getItem('locale') ??
    (navigator.language.slice(0, 2) === 'de' ? 'de' : 'en');

  async loadTranslation() {
    // Use web pack magic string to only include required locale data
    const localeModule = await import(
      /* webpackInclude: /(de|en)\.mjs$/ */
      `node_modules/@angular/common/locales/${this.locale}.mjs`
    );

    // Set locale for built in pipes, etc.
    registerLocaleData(localeModule.default);

    if (this.locale !== 'en') {
      await import(`src/assets/locales/${this.locale}/messages.json`).then(
        (m) => loadTranslations(m.default)
      );
    }
  }

  setLocale(locale: string): void {
    localStorage.setItem('locale', locale);
    location.reload();
  }

  getAppLocale(): string {
    return localStorage.getItem('locale') ?? 'en';
  }
}
