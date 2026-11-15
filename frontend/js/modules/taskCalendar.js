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