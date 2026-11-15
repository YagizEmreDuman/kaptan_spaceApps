import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';
import { t } from './i18nManager.js';

let selectedStrategyId = 'alt1';

function getTrafficLight(score) {
  if (score >= 65) return { label: t('risk_high'), badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: '🔴' };
  if (score >= 40) return { label: t('risk_mid'), badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: '🟡' };
  return { label: t('risk_low'), badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: '🟢' };
}

export function renderDashboardUI(sim) {
  const {
    payload,
    profile,
    cropLabel,
    soilLabel,
    peakFungal,
    peakDrought,
    frostRisk,
    strategies
  } = sim;

  document.getElementById('report-coords').textContent =
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

  renderRotationCards(sim);
  renderSelectedStrategyDetail(strategies);
  renderPlantingTimeline(sim, selectedStrategyId);
  renderFarmerTaskCalendar(sim, selectedStrategyId);
  renderAgronomyAlerts(profile);
}

function renderRotationCards(sim) {
  const { strategies } = sim;
  const grid = document.getElementById('rotation-cards-grid');
  if (!grid) return;

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
  }).join('');

  grid.querySelectorAll('.rotation-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedStrategyId = card.dataset.strategyId;
      renderRotationCards(sim);
      renderSelectedStrategyDetail(strategies);
      renderPlantingTimeline(sim, selectedStrategyId);
      renderFarmerTaskCalendar(sim, selectedStrategyId);
    });
  });
}

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
    </div>
  `).join('');
}