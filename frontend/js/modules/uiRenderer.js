import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';
import { escapeHtml as esc, formatNumber as num, formatMonth } from './displayUtils.js';

let selectedStrategyId = null;

export function renderDashboardUI(sim) {
  const { payload, prediction, strategies } = sim;
  document.getElementById('report-coords').textContent =
    `${num(payload.location.latitude, 4)}°, ${num(payload.location.longitude, 4)}°`;
  document.getElementById('report-title').textContent = `${sim.profile.name} • ${sim.cropLabel} (${sim.soilLabel})`;
  document.getElementById('report-area').textContent = `${num(payload.soil.areaDekar)} da`;
  if (!strategies.some(strategy => strategy.id === selectedStrategyId)) selectedStrategyId = strategies[0]?.id || null;
  const scored = strategies.filter(strategy => typeof strategy.score === 'number');
  const best = scored.reduce((current, strategy) => !current || strategy.score > current.score ? strategy : current, null);
  const hero = document.getElementById('decision-hero-sentence');
  hero.textContent = best
    ? `Motorun en yüksek sezgisel puanlı seçeneği: ${best.title} (${num(best.score)}/100). Bu puan, verim veya başarı olasılığı değildir.`
    : 'Algorithm sonucu alınamadı. Rotasyon, verim veya gelir için örnek değer gösterilmiyor.';
  const forecast = prediction?.forecast;
  document.getElementById('traffic-light-badges').innerHTML = forecast ? [
    `${formatMonth(forecast.validMonth)} sıcaklık tahmini: ${num(forecast.temperatureC)} °C`,
    `Aylık yağış tahmini: ${forecast.monthlyPrecipitationMm == null ? 'Veri yok' : `${num(forecast.monthlyPrecipitationMm)} mm`}`,
    `WET3 toprak nemi: ${num(forecast.soilWetnessWet3Index, 4)} (boyutsuz)`
  ].map(label => `<span class="text-xs px-3 py-1 rounded-full border border-sky-200 bg-sky-50">${esc(label)}</span>`).join('')
    : '<span class="text-xs text-slate-600">İklim tahmin verisi alınamadı.</span>';
  renderRotationCards(sim);
  renderSelectedStrategyDetail(sim);
  renderPlantingTimeline(sim, selectedStrategyId);
  renderFarmerTaskCalendar(sim);
  renderEvidence(sim);
}

function renderRotationCards(sim) {
  const grid = document.getElementById('rotation-cards-grid');
  if (!grid) return;
  if (!sim.strategies.length) {
    grid.innerHTML = '<p class="text-sm text-slate-600 md:col-span-3">Rotasyon karşılaştırması için algorithm servisine bağlantı gerekiyor.</p>';
    return;
  }
  grid.innerHTML = sim.strategies.map(strategy => {
    const selected = strategy.id === selectedStrategyId;
    const water = strategy.waterEvidence?.secondCropSeasonalEtGuideMm;
    return `<button type="button" data-strategy-id="${esc(strategy.id)}" aria-pressed="${selected}"
      class="rotation-card text-left rounded-2xl border p-4 flex flex-col gap-3 ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}">
      <span class="text-[11px] font-semibold text-emerald-800">${strategy.type === 'current' ? 'MEVCUT ROTASYON' : 'ALTERNATİF ROTASYON'} ${selected ? ' · Seçili' : ''}</span>
      <h4 class="text-sm font-bold text-slate-900">${esc(strategy.title)}</h4>
      <p class="text-xs text-slate-600">${esc(strategy.rotationBenefitToExplore)}</p>
      <div class="rounded-xl bg-sky-50 p-3 text-xs">Sezgisel uygunluk indeksi: <strong>${num(strategy.score)}/100</strong></div>
      <p class="text-[11px] text-slate-600">İkinci ürün sezonluk ET rehberi: ${water ? `${num(water[0])}–${num(water[1])} mm` : 'Doğrulanmış aralık yok'}</p>
      <p class="text-[11px] text-slate-500">Ekim tarihi, verim ve gelir tahmini sunulmuyor.</p>
    </button>`;
  }).join('');
  grid.querySelectorAll('[data-strategy-id]').forEach(card => card.addEventListener('click', () => {
    selectedStrategyId = card.dataset.strategyId;
    renderRotationCards(sim);
    renderSelectedStrategyDetail(sim);
    renderPlantingTimeline(sim, selectedStrategyId);
  }));
}

function renderSelectedStrategyDetail(sim) {
  const box = document.getElementById('selected-strategy-detail');
  if (!box) return;
  const selected = sim.strategies.find(strategy => strategy.id === selectedStrategyId);
  if (!selected) { box.textContent = 'Seçilebilir rotasyon verisi yok.'; return; }
  box.innerHTML = `<h4 class="text-sm font-bold">${esc(selected.title)}</h4>
    <p class="text-xs">${esc(selected.rotationBenefitToExplore)}</p>
    <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1">${(selected.risksAndLocalChecks || []).map(check => `<li>${esc(check)}</li>`).join('')}</ul>
    ${(selected.evidenceLimitations || []).map(note => `<p class="text-[11px] text-slate-500">${esc(note)}</p>`).join('')}`;
}

function renderEvidence(sim) {
  const box = document.getElementById('agronomy-alerts-list');
  if (!box) return;
  const prediction = sim.prediction;
  if (!prediction) { box.textContent = 'Algorithm açıklamaları alınamadı.'; return; }
  const history = prediction.historicalStressContext;
  const scenario = prediction.scenarioAnalysis;
  box.innerHTML = `<div class="rounded-xl border p-3 text-xs">
      <h4 class="font-bold">Geçmiş stres bağlamı</h4>
      <p>${esc(history?.period)}: ${num(history?.historicalExploratoryStressIndex)}/100</p>
      <p class="text-slate-500">Geçmiş betimleyici indeks; güncel risk veya tahmin değildir.</p>
    </div>
    <div class="rounded-xl border p-3 text-xs">
      <h4 class="font-bold">Kullanıcı senaryosu</h4>
      <p>Varsayımsal baskı indeksi: ${num(scenario?.indicativeScenarioPressureIndex0to100)}/100</p>
      <p>Seçilen ay senaryo sıcaklığı: ${num(scenario?.projectedMonthlyTemperatureC)} °C</p>
      <p>Seçilen ay senaryo yağışı: ${num(scenario?.projectedMonthlyPrecipitationMm)} mm</p>
      <p class="text-slate-500">NASA tahmininin yerine geçmez.</p>
    </div>
    <div class="rounded-xl border p-3 text-xs">
      <h4 class="font-bold">Veri kaynakları</h4>
      <p>NASA GEOS-S2S · Tarihsel NASA POWER ${esc(prediction.historicalClimate?.referencePeriod)}</p>
      <p>Günlük hava: ${esc(sim.weatherSource || 'Veri yok')}</p>
      <p class="text-slate-500">Toprak pH’sı, bütçe ve makine için bu motor ek puan hesaplamıyor.</p>
    </div>
    <ul class="md:col-span-3 list-disc pl-5 text-xs text-slate-600 space-y-1">${(prediction.limitations || []).map(note => `<li>${esc(note)}</li>`).join('')}</ul>`;
}
