import { TRANSLATIONS } from '../data/translations.js';

const STORAGE_KEY = 'cropguard_lang';
let currentLang = localStorage.getItem(STORAGE_KEY) || 'tr';

export function getCurrentLang() {
  return currentLang;
}

export function t(key, vars = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  let str = dict[key] ?? TRANSLATIONS.tr[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v));
  }
  return str;
}

export function getLocalizedMonths() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.tr;
  return dict.months || TRANSLATIONS.tr.months;
}

export function applyTranslations() {
  document.documentElement.lang = currentLang;

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

export function initI18n(onLanguageChangeCallback) {
  const switcher = document.getElementById('language-switcher');

  if (switcher) {
    switcher.value = currentLang;
    switcher.addEventListener('change', (e) => {
      currentLang = e.target.value;
      localStorage.setItem(STORAGE_KEY, currentLang);
      applyTranslations();

      if (typeof onLanguageChangeCallback === 'function') {
        onLanguageChangeCallback(currentLang);
      }
    });
  }

  applyTranslations();
}