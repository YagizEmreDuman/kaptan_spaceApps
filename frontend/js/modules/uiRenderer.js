import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';

let selectedStrategyId = 'alt1';

function getTrafficLight(score) {
  if (score >= 65) return { label: 'Yüksek Risk', badge: 'bg-rose-100 text-rose-800 border-rose-300', dot: '🔴' };
  if (score >= 40) return { label: 'Orta Risk', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: '🟡' };
  return { label: 'Düşük Risk', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: '🟢' };
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

  // 1. Tek Cümlelik Sade Karar Özeti
  const recommended = strategies[1];
  const baseline = strategies[0];
  const extraProfit = Math.max(0, recommended.financialTotal - baseline.financialTotal).toLocaleString('tr-TR');

  const heroSentenceEl = document.getElementById('decision-hero-sentence');
  if (heroSentenceEl) {
    heroSentenceEl.innerHTML = `
      Tarlanızda klasik ekim yerine <strong class="text-emerald-700">${recommended.plantingWindow}</strong> aralığında 
      <strong class="text-emerald-700">${recommended.title}</strong> planına geçerseniz, hastalık riskini düşürüp sezon sonunda ortalama 
      <strong class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded">+${extraProfit} ₺ ek kazanç</strong> sağlayabilirsiniz.
    `;
  }

  // 2. Trafik Işığı Risk Özeti Rozetleri
  const fungalLight = getTrafficLight(peakFungal);
  const droughtLight = getTrafficLight(peakDrought);
  const frostLight = getTrafficLight(frostRisk);

  const badgesEl = document.getElementById('traffic-light-badges');
  if (badgesEl) {
    badgesEl.innerHTML = `
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${fungalLight.badge}">
        ${fungalLight.dot} Mantar Riski: ${fungalLight.label} (%${peakFungal})
      </span>
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${droughtLight.badge}">
        ${droughtLight.dot} Kuraklık: ${droughtLight.label} (%${peakDrought})
      </span>
      <span class="text-xs font-semibold px-3 py-1 rounded-full border ${frostLight.badge}">
        ${frostLight.dot} Don Riski: ${frostLight.label} (%${frostRisk})
      </span>
    `;
  }

  renderRotationCards(sim);
  renderSelectedStrategyDetail(strategies);
  renderPlantingTimeline(sim, selectedStrategyId);
  renderFarmerTaskCalendar(sim, selectedStrategyId);
  renderAgronomyAlerts(payload, profile);
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
              ${isSelected ? '✓ Seçili' : 'Seç'}
            </span>
          </div>

          <h4 class="text-sm font-bold text-slate-900 leading-snug">${st.title}</h4>

          <div class="mt-3 p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 flex flex-col gap-1">
            <span class="text-[10px] text-slate-500">Önerilen Ekim Zamanı</span>
            <span class="text-xs font-mono font-bold text-sky-900">${st.plantingWindow}</span>
          </div>

          <div class="mt-2.5 flex items-center justify-between text-xs">
            <span class="text-slate-500">Genel Risk:</span>
            <span class="font-semibold">${riskLight.dot} ${riskLight.label}</span>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-3 flex items-center justify-between">
          <div>
            <div class="text-[10px] text-slate-500">Tahmini Getiri</div>
            <div class="text-sm font-mono font-bold text-slate-900">${st.financialTotal.toLocaleString('tr-TR')} ₺</div>
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
      <h4 class="text-xs sm:text-sm font-bold text-slate-900">📌 Seçili Plan Detayı: ${st.title}</h4>
      <span class="text-xs font-mono font-bold text-emerald-700">${st.financialDiffText}</span>
    </div>
    <p class="text-xs text-slate-700 leading-relaxed">${st.reason}</p>
    <div class="flex flex-wrap gap-2 text-[11px]">
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">🔄 3 Sezon: <strong>${st.sequence.join(' → ')}</strong></span>
      <span class="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium">💧 Su Tasarrufu: <strong>%${st.waterSaving}</strong></span>
    </div>
  `;
}

function renderAgronomyAlerts(payload, profile) {
  const alertsContainer = document.getElementById('agronomy-alerts-list');
  if (!alertsContainer) return;

  const alerts = [
    {
      icon: '🌡️',
      title: `GDD Fenoloji Kayması (${profile.gddShift})`,
      desc: 'Isınma trendi bitkinin gelişim evrelerini öne çekiyor; erken ekim sıcak dalgasından kaçışı sağlar.'
    },
    {
      icon: '💨',
      title: `Sıcak Dalgası (${profile.heatWaveDays})`,
      desc: 'Yüksek sıcaklık tozlaşma verimini düşürebilir; erken hasat penceresi bu riski azaltır.'
    },
    {
      icon: '🧪',
      title: payload.soil.ph === 'alkali' ? 'Alkali Toprak Mikro Besin Desteği' : 'Toprak Nem Dengesi',
      desc: 'Tohumun kök salma döneminde yüzey buharlaşmasını azaltmak için minimum toprak işleme önerilir.'
    }
  ];

  alertsContainer.innerHTML = alerts.map(a => `
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <div class="text-xs font-bold text-slate-900">${a.icon} ${a.title}</div>
      <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${a.desc}</p>
    </div>
  `).join('');
}