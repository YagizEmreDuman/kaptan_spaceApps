import { escapeHtml as esc, formatNumber as num, formatMonth, formatDay } from './displayUtils.js';
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
  box.innerHTML = `<h3 class="text-sm font-bold text-slate-900">Monthly climate forecasts</h3>
    <p class="text-xs text-slate-500">NASA GEOS-S2S · NASA POWER (2006–2025) · CMIP6 Multi-Model (EC-Earth3P / MRI / MPI) Precipitation Projection. A dash (—) indicates no data.</p>
    ${months.length ? `<div class="overflow-x-auto"><table class="w-full text-xs text-left border-collapse">
      <thead><tr class="border-b text-slate-500"><th class="p-2">Month</th><th class="p-2">Forecast °C</th><th class="p-2">Historical °C</th><th class="p-2">Forecast rain mm</th><th class="p-2 text-emerald-800 font-semibold">CMIP6 rain mm</th><th class="p-2">Historical rain mm</th><th class="p-2">WET3 (0–1)</th><th class="p-2">Temp run date</th></tr></thead>
      <tbody>${months.map(month => `<tr class="border-b border-slate-100 ${month.month === sim.prediction?.forecast?.validMonth ? 'bg-emerald-50' : ''}">
        <td class="p-2 whitespace-nowrap">${esc(formatMonth(month.month))}</td><td class="p-2">${num(month.temperatureC)}</td>
        <td class="p-2">${num(month.historicalBaseline?.temperatureC)}</td><td class="p-2">${num(month.precipitationMm)}</td>
        <td class="p-2 font-mono font-semibold text-emerald-800">${num(month.cmip6PrecipitationMm)}</td>
        <td class="p-2">${num(month.historicalBaseline?.precipitationMm)}</td><td class="p-2">${num(month.soilWetnessWet3Index, 4)}</td>
        <td class="p-2 whitespace-nowrap">${esc(month.forecastRunDate || '—')}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="text-sm text-slate-600">Monthly forecasts unavailable.</p>'}
    <h3 class="text-sm font-bold text-slate-900 border-t pt-4">Daily weather forecast${days.length ? ` · ${days.length} days` : ''}</h3>
    <p class="text-xs text-slate-500">${esc(sim.weatherSource || 'Daily weather service unavailable')}${sim.weatherTimezone ? ` · ${esc(sim.weatherTimezone)}` : ''}
      ${sim.weatherFetchedAt ? ` · Fetched at: ${esc(new Date(sim.weatherFetchedAt).toLocaleString('en-US'))}` : ''}</p>
    ${days.length ? `<div class="flex gap-3 overflow-x-auto pb-2">${days.map(day => `
      <div class="min-w-[145px] rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs space-y-2">
        <strong class="block whitespace-nowrap">${esc(formatDay(day.date))}</strong>
        <p>Max: ${num(day.maxTemp)} °C</p><p>Min: ${num(day.minTemp)} °C</p>
        <p>Rain: ${num(day.rainMm)} mm</p><p>Humidity: ${num(day.humidity)} %</p><p>Max wind: ${num(day.windKmh)} km/h</p>
      </div>`).join('')}</div>` : '<p class="text-sm text-slate-600">Daily weather data unavailable. Daily weather is not synthesized from monthly forecasts.</p>'}
    <h4 class="text-sm font-bold border-t pt-4">Field notifications from service</h4>
    <div class="space-y-2">${tasks.length ? tasks.map(task => {
      const key = `${locationKey}|${task.date}|${task.type}|${task.task || task.title}`;
      return `<label class="flex gap-3 rounded-xl border p-3 text-xs cursor-pointer">
        <input type="checkbox" data-task-check="${esc(key)}" ${completedTasks.has(key) ? 'checked' : ''}>
        <span><strong>${esc(formatDay(task.date))} · ${esc(task.type || '')}</strong>
        <span class="block mt-1">${esc(task.task || task.title)}</span><span class="block text-slate-500 mt-1">${esc(task.reason || task.description || '')}</span></span></label>`;
    }).join('') : '<p class="text-xs text-slate-600">No dated field notifications received from the service. No sample tasks were generated.</p>'}</div>`;
  box.querySelectorAll('[data-task-check]').forEach(checkbox => checkbox.addEventListener('change', () => {
    if (checkbox.checked) completedTasks.add(checkbox.dataset.taskCheck);
    else completedTasks.delete(checkbox.dataset.taskCheck);
  }));
}
