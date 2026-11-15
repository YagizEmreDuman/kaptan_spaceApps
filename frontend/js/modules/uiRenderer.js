import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';
<<<<<<< HEAD
import { escapeHtml as esc, formatNumber as num, formatMonth } from './displayUtils.js';

let selectedStrategyId = null;
=======
import { t } from './i18nManager.js';

let selectedStrategyId = 'alt1';

function getTrafficLight(score) {
  if (score >= 65) return { label: t('risk_high'), badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: '🔴' };
  if (score >= 40) return { label: t('risk_mid'), badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: '🟡' };
  return { label: t('risk_low'), badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: '🟢' };
}
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d

export function renderDashboardUI(sim) {
  const { payload, prediction, strategies } = sim;
  document.getElementById('report-coords').textContent =
<<<<<<< HEAD
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
=======
    `${payload.location.latitude.toFixed(2)}°, ${payload.location.longitude.toFixed(2)}°`;
  document.getElementById('report-title').textContent =
    `${profile.name} • ${cropLabel} (${soilLabel})`;
  document.getElementById('report-area').textContent =
    `${payload.soil.areaDekar} da`;

  const recommended = strategies[1];
  const baseline = strategies[0];
  const extraProfit = Math.max(0, recommended.financialTotal - baseline.financialTotal).toLocaleString();

  const heroSentenceEl = document.getElementById('decision-hero-sentence');
  if (heroSentenceEl) {
    heroSentenceEl.innerHTML = t('hero_sentence', {
      window: recommended.plantingWindow,
      title: recommended.title,
      profit: extraProfit
    });
  }

  const fungalLight = getTrafficLight(peakFungal);
  const droughtLight = getTrafficLight(peakDrought);
  const frostLight = getTrafficLight(frostRisk);

  const badgesEl = document.getElementById('traffic-light-badges');
  if (badgesEl) {
    badgesEl.innerHTML = `
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${fungalLight.badge}">
        ${fungalLight.dot} ${t('risk_fungal_lbl')}: ${fungalLight.label} (%${peakFungal})
      </span>
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${droughtLight.badge}">
        ${droughtLight.dot} ${t('risk_drought_lbl')}: ${droughtLight.label} (%${peakDrought})
      </span>
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${frostLight.badge}">
        ${frostLight.dot} ${t('risk_frost_lbl')}: ${frostLight.label} (%${frostRisk})
      </span>
    `;
  }

>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
  renderRotationCards(sim);
  renderSelectedStrategyDetail(sim);
  renderPlantingTimeline(sim, selectedStrategyId);
<<<<<<< HEAD
  renderFarmerTaskCalendar(sim);
  renderEvidence(sim);
=======
  renderFarmerTaskCalendar(sim, selectedStrategyId);
  renderAgronomyAlerts(profile);
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
}

function renderRotationCards(sim) {
  const grid = document.getElementById('rotation-cards-grid');
  if (!grid) return;
<<<<<<< HEAD
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
=======

  grid.innerHTML = strategies.map(st => {
    const isSelected = st.id === selectedStrategyId;
    const borderStyle = isSelected ? st.selectedClass : 'border-slate-200 bg-white hover:border-sky-300';
    const riskLight = getTrafficLight(Math.max(st.fungalRisk, st.droughtRisk));

    return `
      <div data-strategy-id="${st.id}" class="rotation-card cursor-pointer rounded-2xl border p-4 flex flex-col justify-between gap-3 ${borderStyle}">
        <div>
          <div class="flex items-center justify-between gap-1 mb-2">
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${st.badgeClass}">${st.badge}</span>
            <span class="text-[11px] font-bold ${isSelected ? 'text-emerald-700' : 'text-slate-400'}">
              ${isSelected ? t('card_selected') : t('card_select')}
            </span>
          </div>

          <h4 class="text-sm font-bold text-slate-900 leading-snug">${st.title}</h4>

          <div class="mt-3 p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col gap-1">
            <span class="text-[10px] text-slate-500">${t('card_planting_win')}</span>
            <span class="text-xs font-mono font-bold text-sky-900">${st.plantingWindow}</span>
          </div>

          <div class="mt-2.5 flex items-center justify-between text-xs">
            <span class="text-slate-500">${t('card_general_risk')}</span>
            <span class="font-semibold">${riskLight.dot} ${riskLight.label}</span>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-3 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-slate-500">${t('card_est_revenue')}</div>
            <div class="text-sm font-mono font-bold text-slate-900">${st.financialTotal.toLocaleString()} ₺</div>
          </div>
          <span class="text-[11px] font-mono font-bold px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            ${st.yieldDeltaText}
          </span>
        </div>
      </div>
    `;
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
  }).join('');
  grid.querySelectorAll('[data-strategy-id]').forEach(card => card.addEventListener('click', () => {
    selectedStrategyId = card.dataset.strategyId;
    renderRotationCards(sim);
    renderSelectedStrategyDetail(sim);
    renderPlantingTimeline(sim, selectedStrategyId);
  }));
}

<<<<<<< HEAD
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
=======
function renderSelectedStrategyDetail(strategies) {
  const detailBox = document.getElementById('selected-strategy-detail');
  if (!detailBox) return;

  const st = strategies.find(s => s.id === selectedStrategyId) || strategies[1];

  detailBox.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="text-xs sm:text-sm font-bold text-slate-900">${t('detail_title')} ${st.title}</h4>
      <span class="text-xs font-mono font-bold text-emerald-700">${st.financialDiffText}</span>
    </div>
    <p class="text-xs text-slate-700 leading-relaxed">${st.reason}</p>
    <div class="flex flex-wrap gap-2 text-[11px]">
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">${t('detail_seq')} <strong>${st.sequence.join(' → ')}</strong></span>
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">${t('detail_water')} <strong>%${st.waterSaving}</strong></span>
    </div>
  `;
}

function renderAgronomyAlerts(profile) {
  const alertsContainer = document.getElementById('agronomy-alerts-list');
  if (!alertsContainer) return;

  const alerts = [
    {
      icon: '🌡️',
      title: t('alert_gdd_title', { shift: profile.gddShift }),
      desc: t('alert_gdd_desc')
    },
    {
      icon: '💨',
      title: t('alert_heat_title', { days: profile.heatWaveDays }),
      desc: t('alert_heat_desc')
    },
    {
      icon: '🧪',
      title: t('alert_soil_title'),
      desc: t('alert_soil_desc')
    }
  ];

  alertsContainer.innerHTML = alerts.map(a => `
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <div class="text-xs font-bold text-slate-900">${a.icon} ${a.title}</div>
      <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${a.desc}</p>
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
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
