import { TRANSLATIONS } from '../data/translations.js';

const currentLang = 'en';

export function getCurrentLang() {
  return currentLang;
}

export function t(key, vars = {}) {
  const dict = TRANSLATIONS.en;
  let str = dict[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function getLocalizedMonths() {
  return TRANSLATIONS.en.months;
}

export function applyTranslations() {
  if (typeof document === 'undefined' || !document.querySelectorAll) return;
  if (document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated) {
      el.textContent = translated;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key);
    if (translated) {
      el.setAttribute('placeholder', translated);
    }
  });
}

export function initI18n() {
  applyTranslations();
}
