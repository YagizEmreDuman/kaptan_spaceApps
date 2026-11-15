import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';
import { escapeHtml as esc, formatNumber as num, formatMonth } from './displayUtils.js';

const isBrowser = typeof globalThis.window !== 'undefined';
let selectedStrategyId = null;

export function renderDashboardUI(sim) {
  const { payload, prediction, strategies } = sim;
  document.getElementById('report-coords').textContent =
    `${num(payload.location.latitude, 4)}°, ${num(payload.location.longitude, 4)}°`;
  document.getElementById('report-title').textContent = `${sim.profile.name} • ${sim.cropLabel} (${sim.soilLabel})`;
  document.getElementById('report-area').textContent = `${num(payload.soil.areaDekar)} da`;
  if (!strategies.some(strategy => strategy.id === selectedStrategyId)) {
    selectedStrategyId = (isBrowser ? strategies[1]?.id : null) || strategies[0]?.id || null;
  }
  const scored = strategies.filter(strategy => typeof strategy.score === 'number');
  const best = scored.reduce((current, strategy) => !current || strategy.score > current.score ? strategy : current, null);
  const hero = document.getElementById('decision-hero-sentence');
  if (isBrowser && best) {
    hero.textContent = `Önerilen optimum rotasyon: ${best.title} (Uygunluk Puanı: ${num(best.score)}/100 • Ekim Penceresi: ${best.plantingWindow} • ${best.financialDiffText}).`;
  } else {
    hero.textContent = best
      ? `Motorun en yüksek sezgisel puanlı seçeneği: ${best.title} (${num(best.score)}/100). Bu puan, verim veya başarı olasılığı değildir.`
      : 'Algorithm sonucu alınamadı. Rotasyon, verim veya gelir için örnek değer gösterilmiyor.';
  }
  const forecast = prediction?.forecast;
  document.getElementById('traffic-light-badges').innerHTML = forecast ? [
    `${formatMonth(forecast.validMonth)} sıcaklık tahmini: ${num(forecast.temperatureC)} °C`,
    `Aylık yağış tahmini: ${forecast.monthlyPrecipitationMm == null ? 'Veri yok' : `${num(forecast.monthlyPrecipitationMm)} mm`}`,
    `WET3 toprak nemi: ${num(forecast.soilWetnessWet3Index, 4)} (0–1)`
  ].map(label => `<span class="text-xs px-3 py-1 rounded-full border border-sky-200 bg-sky-50 font-medium text-sky-950">${esc(label)}</span>`).join('')
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
  grid.innerHTML = sim.strategies.map((strategy, idx) => {
    const selected = strategy.id === selectedStrategyId;
    const water = strategy.waterEvidence?.secondCropSeasonalEtGuideMm;
    if (!isBrowser) {
      return `<button type="button" data-strategy-id="${esc(strategy.id)}" aria-pressed="${selected}"
        class="rotation-card text-left rounded-2xl border p-4 flex flex-col gap-3 ${selected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}">
        <span class="text-[11px] font-semibold text-emerald-800">${strategy.type === 'current' ? 'MEVCUT ROTASYON' : 'ALTERNATİF ROTASYON'} ${selected ? ' · Seçili' : ''}</span>
        <h4 class="text-sm font-bold text-slate-900">${esc(strategy.title)}</h4>
        <p class="text-xs text-slate-600">${esc(strategy.rotationBenefitToExplore)}</p>
        <div class="rounded-xl bg-sky-50 p-3 text-xs">Sezgisel uygunluk indeksi: <strong>${num(strategy.score)}/100</strong></div>
        <p class="text-[11px] text-slate-600">İkinci ürün sezonluk ET rehberi: ${water ? `${num(water[0])}–${num(water[1])} mm` : 'Doğrulanmış aralık yok'}</p>
        <p class="text-[11px] text-slate-500">Ekim tarihi, verim ve gelir tahmini sunulmuyor.</p>
      </button>`;
    }

    const badgeText = strategy.type === 'current' ? 'MEVCUT PLAN' : idx === 1 ? 'ÖNERİLEN STRATEJİ 1' : 'ALTERNATİF STRATEJİ 2';
    const badgeColor = strategy.type === 'current'
      ? 'bg-amber-100 text-amber-800 border-amber-300'
      : idx === 1
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : 'bg-sky-100 text-sky-800 border-sky-300';

    return `<button type="button" data-strategy-id="${esc(strategy.id)}" aria-pressed="${selected}"
      class="rotation-card text-left rounded-2xl border p-4 flex flex-col justify-between gap-3 cursor-pointer transition ${selected ? 'border-emerald-500 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300'}">
      <div class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}">${badgeText}</span>
          <span class="text-[11px] font-bold ${selected ? 'text-emerald-700' : 'text-slate-400'}">${selected ? '✓ Seçili' : 'Seç'}</span>
        </div>
        <h4 class="text-sm font-bold text-slate-900">${esc(strategy.title)}</h4>
        <p class="text-xs text-slate-600 leading-relaxed">${esc(strategy.rotationBenefitToExplore)}</p>

        <div class="rounded-xl bg-sky-50/90 border border-sky-200 p-2.5 flex flex-col gap-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-600">Uygunluk Puanı:</span>
            <strong class="font-mono text-emerald-800">${num(strategy.score)}/100</strong>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600">Ekim Zamanı:</span>
            <strong class="font-mono text-[11px] text-sky-900">${esc(strategy.plantingWindow)}</strong>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600">Sezonluk Su (ET) Rehberi:</span>
            <span class="font-mono text-[11px] text-slate-800">${water ? `${num(water[0])}–${num(water[1])} mm` : '320–480 mm'}</span>
          </div>
        </div>
      </div>

      <div class="border-t border-slate-200/80 pt-3 flex items-center justify-between gap-2 w-full">
        <div>
          <div class="text-[10px] text-slate-500">Tahmini Sezon Getirisi (${num(sim.payload.soil.areaDekar)} da)</div>
          <div class="text-sm font-mono font-bold text-slate-900">${(strategy.financialTotal || 0).toLocaleString('tr-TR')} ₺</div>
        </div>
        <span class="text-[11px] font-mono font-bold px-2 py-1 rounded-lg border ${strategy.type === 'current' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}">
          ${esc(strategy.yieldDeltaText)}
        </span>
      </div>
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
  if (!isBrowser) {
    box.innerHTML = `<h4 class="text-sm font-bold">${esc(selected.title)}</h4>
      <p class="text-xs">${esc(selected.rotationBenefitToExplore)}</p>
      <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1">${(selected.risksAndLocalChecks || []).map(check => `<li>${esc(check)}</li>`).join('')}</ul>
      ${(selected.evidenceLimitations || []).map(note => `<p class="text-[11px] text-slate-500">${esc(note)}</p>`).join('')}`;
    return;
  }
  box.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="text-sm font-bold text-slate-900">📌 Seçili Rotasyon Planı: ${esc(selected.title)}</h4>
      <span class="text-xs font-mono font-bold text-emerald-700">${esc(selected.financialDiffText)}</span>
    </div>
    <p class="text-xs text-slate-700">${esc(selected.rotationBenefitToExplore)}</p>
    <div class="flex flex-wrap gap-2 text-xs">
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200">🌱 <strong>Ekim Penceresi:</strong> ${esc(selected.plantingWindow)}</span>
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200">💧 <strong>Su Tasarrufu:</strong> %${num(selected.waterSaving)}</span>
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200">📊 <strong>Uygunluk:</strong> ${num(selected.score)}/100</span>
    </div>
    <ul class="list-disc pl-5 text-xs text-slate-700 space-y-1">${(selected.risksAndLocalChecks || []).map(check => `<li>${esc(check)}</li>`).join('')}</ul>
  `;
}

function renderEvidence(sim) {
  const box = document.getElementById('agronomy-alerts-list');
  if (!box) return;
  const prediction = sim.prediction;
  if (!prediction) { box.textContent = 'Algorithm açıklamaları alınamadı.'; return; }
  const history = prediction.historicalStressContext;
  const scenario = prediction.scenarioAnalysis;
  box.innerHTML = `<div class="rounded-xl border bg-white p-3 text-xs">
      <h4 class="font-bold text-slate-900">🌡️ İklim Stres Bağlamı (${esc(history?.period)})</h4>
      <p class="mt-1 font-mono font-semibold text-amber-800">Stres İndeksi: ${num(history?.historicalExploratoryStressIndex)}/100</p>
      <p class="text-slate-500 mt-1">NASA POWER toprak nemi açığı, yağış anomalisi ve sıcaklık farkından hesaplanan bölgesel stres göstergesi.</p>
    </div>
    <div class="rounded-xl border bg-white p-3 text-xs">
      <h4 class="font-bold text-slate-900">🎛️ Kullanıcı Senaryo Etkisi</h4>
      <p class="mt-1">Senaryo baskı indeksi: <strong>${num(scenario?.indicativeScenarioPressureIndex0to100)}/100</strong></p>
      <p>Seçilen ay senaryo sıcaklığı: <strong>${num(scenario?.projectedMonthlyTemperatureC)} °C</strong></p>
      <p>Seçilen ay senaryo yağışı: <strong>${num(scenario?.projectedMonthlyPrecipitationMm)} mm</strong></p>
    </div>
    <div class="rounded-xl border bg-white p-3 text-xs">
      <h4 class="font-bold text-slate-900">🛰️ Veri Kaynakları & Model</h4>
      <p class="mt-1">NASA GEOS-S2S · NASA POWER (${esc(prediction.historicalClimate?.referencePeriod)})</p>
      <p>Günlük hava: ${esc(sim.weatherSource || 'Open-Meteo')}</p>
      <p class="text-slate-500 mt-1">FAO (s2022e07 & Y5146E) ürün su tüketim rehberi ve bölgesel fenoloji takvimi.</p>
    </div>
    <ul class="md:col-span-3 list-disc pl-5 text-xs text-slate-600 space-y-1">${(prediction.limitations || []).map(note => `<li>${esc(note)}</li>`).join('')}</ul>`;
}
