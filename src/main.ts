/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { loadTranslations } from '@angular/localize';
import { registerLocaleData } from '@angular/common';

import { getLocale, importLocale, setLocale } from '../src/locale/i18n';

const locale = getLocale();
setLocale(locale, sessionStorage);

Promise.all([fetch(`/assets/i18n/${locale}.json`), importLocale(locale)])
  .then((responses) => {
    if (!responses[0].ok) {
      throw new Error(`HTTP error ${responses[0].status}`);
    }

    console.log('Translation file loaded:', responses[0]);
    const moduleLocale = responses[1].default[0];
    console.log('moduleLocale is', moduleLocale);
    console.log('third thing is', responses);

    registerLocaleData(responses[1].default, moduleLocale);

    return responses[0].json();
  })
  .then((result) => {
    loadTranslations(result.translations);
    console.log('translations loaded w/ result', result);

    bootstrapApplication(AppComponent, appConfig).catch((err) =>
      console.error(err)
    );
  });
