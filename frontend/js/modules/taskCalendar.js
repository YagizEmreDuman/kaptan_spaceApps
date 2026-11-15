<<<<<<< HEAD
﻿import { escapeHtml as esc, formatNumber as num, formatMonth, formatDay } from './displayUtils.js';
import { finiteNumber } from './riskCalculator.js';

const completedTasks = new Set();

export function normalizeForecastDays(days) {
  if (!Array.isArray(days)) return [];
  return days.filter(day => /^\d{4}-\d{2}-\d{2}$/.test(day?.date || '')).map(day => ({
    date: day.date, maxTemp: finiteNumber(day.maxTemp), minTemp: finiteNumber(day.minTemp),
    rainMm: finiteNumber(day.rainMm), humidity: finiteNumber(day.humidity), windKmh: finiteNumber(day.windKmh)
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export function renderFarmerTaskCalendar(sim) {
  const box = document.getElementById('farmer-task-calendar-box');
  if (!box) return;
  const days = normalizeForecastDays(sim.apiForecast14Days);
  const months = sim.monthlyForecasts;
  const tasks = sim.apiTaskCalendar.filter(task => task && typeof task === 'object' && task.date && (task.task || task.title));
  const locationKey = `${sim.payload.location.latitude},${sim.payload.location.longitude}`;
  box.innerHTML = `<h3 class="text-sm font-bold text-slate-900">Aylık iklim tahminleri</h3>
    <p class="text-xs text-slate-500">NASA GEOS-S2S · Yağış ve toprak nemi yalnızca mevcut aylarda gösterilir. Çizgi (—), veri bulunmadığını belirtir.</p>
    ${months.length ? `<div class="overflow-x-auto"><table class="w-full text-xs text-left border-collapse">
      <thead><tr class="border-b text-slate-500"><th class="p-2">Ay</th><th class="p-2">Tahmin °C</th><th class="p-2">Geçmiş °C</th><th class="p-2">Tahmin yağış mm</th><th class="p-2">Geçmiş yağış mm</th><th class="p-2">WET3 (0–1)</th><th class="p-2">Sıcaklık başlangıcı</th></tr></thead>
      <tbody>${months.map(month => `<tr class="border-b border-slate-100 ${month.month === sim.prediction?.forecast?.validMonth ? 'bg-emerald-50' : ''}">
        <td class="p-2 whitespace-nowrap">${esc(formatMonth(month.month))}</td><td class="p-2">${num(month.temperatureC)}</td>
        <td class="p-2">${num(month.historicalBaseline?.temperatureC)}</td><td class="p-2">${num(month.precipitationMm)}</td>
        <td class="p-2">${num(month.historicalBaseline?.precipitationMm)}</td><td class="p-2">${num(month.soilWetnessWet3Index, 4)}</td>
        <td class="p-2 whitespace-nowrap">${esc(month.forecastRunDate || '—')}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="text-sm text-slate-600">Aylık tahminler alınamadı.</p>'}
    <h3 class="text-sm font-bold text-slate-900 border-t pt-4">Günlük hava durumu${days.length ? ` · ${days.length} gün` : ''}</h3>
    <p class="text-xs text-slate-500">${esc(sim.weatherSource || 'Günlük hava servisi kullanılamıyor')}${sim.weatherTimezone ? ` · ${esc(sim.weatherTimezone)}` : ''}
      ${sim.weatherFetchedAt ? ` · Alınma zamanı: ${esc(new Date(sim.weatherFetchedAt).toLocaleString('tr-TR'))}` : ''}</p>
    ${days.length ? `<div class="flex gap-3 overflow-x-auto pb-2">${days.map(day => `
      <div class="min-w-[145px] rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs space-y-2">
        <strong class="block whitespace-nowrap">${esc(formatDay(day.date))}</strong>
        <p>En yüksek: ${num(day.maxTemp)} °C</p><p>En düşük: ${num(day.minTemp)} °C</p>
        <p>Yağış: ${num(day.rainMm)} mm</p><p>Nem: ${num(day.humidity)} %</p><p>En yüksek rüzgâr: ${num(day.windKmh)} km/sa</p>
      </div>`).join('')}</div>` : '<p class="text-sm text-slate-600">Günlük hava verisi alınamadı. Aylık tahminlerden günlük hava durumu üretilmiyor.</p>'}
    <h4 class="text-sm font-bold border-t pt-4">Servisten gelen saha bildirimleri</h4>
    <div class="space-y-2">${tasks.length ? tasks.map(task => {
      const key = `${locationKey}|${task.date}|${task.type}|${task.task || task.title}`;
      return `<label class="flex gap-3 rounded-xl border p-3 text-xs cursor-pointer">
        <input type="checkbox" data-task-check="${esc(key)}" ${completedTasks.has(key) ? 'checked' : ''}>
        <span><strong>${esc(formatDay(task.date))} · ${esc(task.type || '')}</strong>
        <span class="block mt-1">${esc(task.task || task.title)}</span><span class="block text-slate-500 mt-1">${esc(task.reason || task.description || '')}</span></span></label>`;
    }).join('') : '<p class="text-xs text-slate-600">Servisten tarihli saha bildirimi gelmedi. Örnek görev oluşturulmadı.</p>'}</div>`;
  box.querySelectorAll('[data-task-check]').forEach(checkbox => checkbox.addEventListener('change', () => {
    if (checkbox.checked) completedTasks.add(checkbox.dataset.taskCheck);
    else completedTasks.delete(checkbox.dataset.taskCheck);
  }));
}
=======
import { t } from './i18nManager.js';

export function renderFarmerTaskCalendar(sim, selectedStrategyId) {
  const container = document.getElementById('farmer-task-calendar-box');
  if (!container) return;

  const strategy = sim.strategies.find(s => s.id === selectedStrategyId) || sim.strategies[1];
  const avgTemp = Math.round(sim.profile.temp2026[4] || 18);

  const weatherWindow = [
    { day: '1–3', icon: '☀️', temp: `${avgTemp + 2}°C`, status: t('w_clear') },
    { day: '4–7', icon: '🌦️', temp: `${avgTemp - 1}°C`, status: t('w_humid') },
    { day: '8–10', icon: '💨', temp: `${avgTemp}°C`, status: t('w_wind') },
    { day: '11–14', icon: '🌤️', temp: `${avgTemp + 3}°C`, status: t('w_warm') }
  ];

  const tasks = [
    { id: 't1', text: t('task_1'), priority: t('prio_high'), badge: 'bg-rose-100 text-rose-800 border-rose-200', checked: true },
    { id: 't2', text: t('task_2'), priority: t('prio_high'), badge: 'bg-rose-100 text-rose-800 border-rose-200', checked: false },
    { id: 't3', text: t('task_3'), priority: t('prio_mid'), badge: 'bg-amber-100 text-amber-800 border-amber-200', checked: false },
    { id: 't4', text: t('task_4'), priority: t('prio_mid'), badge: 'bg-amber-100 text-amber-800 border-amber-200', checked: false },
    { id: 't5', text: t('task_5'), priority: t('prio_mid'), badge: 'bg-sky-100 text-sky-800 border-sky-200', checked: false }
  ];

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
      <div>
        <h3 class="text-base font-bold text-slate-900">🌦️ ${t('tasks_title')}</h3>
        <p class="text-xs text-slate-500">${t('tasks_sub')} <strong>${strategy.title}</strong></p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div class="lg:col-span-5 flex flex-col gap-2.5">
        <h4 class="text-xs font-bold uppercase tracking-wider text-sky-800">${t('weather_strip_title')}</h4>
        <div class="grid grid-cols-2 gap-2.5">
          ${weatherWindow
            .map(
              (w) => `
              <div class="rounded-xl bg-sky-50/70 border border-sky-200 p-3 flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-bold text-sky-900">Day ${w.day}</span>
                  <span class="text-lg">${w.icon}</span>
                </div>
                <div class="text-base font-mono font-bold text-slate-900">${w.temp}</div>
                <div class="text-[11px] font-medium text-slate-600">${w.status}</div>
              </div>
            `
            )
            .join('')}
        </div>
      </div>

      <div class="lg:col-span-7 flex flex-col gap-2">
        ${tasks
          .map(
            (task) => `
            <label class="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 cursor-pointer transition">
              <div class="flex items-center gap-2.5">
                <input type="checkbox" ${task.checked ? 'checked' : ''} class="w-4 h-4 accent-emerald-600 rounded cursor-pointer" />
                <span class="text-xs font-medium text-slate-800">${task.text}</span>
              </div>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${task.badge}">
                ${task.priority}
              </span>
            </label>
          `
          )
          .join('')}
      </div>
    </div>
  `;
}
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
