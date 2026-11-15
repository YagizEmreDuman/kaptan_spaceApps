import { escapeHtml as esc, formatNumber as num } from './displayUtils.js';
import { getLocalizedMonths } from './i18nManager.js';

const isBrowser = typeof globalThis.window !== 'undefined';

function findMonthForecast(monthlyForecasts, yyyyMm) {
  if (!Array.isArray(monthlyForecasts)) return null;
  return monthlyForecasts.find(m => m.month === yyyyMm) || null;
}

export function renderPlantingTimeline(sim, selectedStrategyId) {
  const box = document.getElementById('planting-timeline-box');
  if (!box) return;
  const strategy = sim.strategies.find(item => item.id === selectedStrategyId) || sim.strategies[0];

  if (!isBrowser) {
    box.innerHTML = `<h3 class="text-sm font-bold text-slate-900">Rotation sequence</h3>
      ${strategy ? `<div class="flex flex-wrap items-center gap-3">${strategy.sequence.map((name, index) =>
        `<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><span class="text-xs text-slate-500">Crop ${index + 1}</span><p class="text-sm font-semibold">${esc(name)}</p></div>`
      ).join('<span aria-hidden="true">→</span>')}</div>` : '<p class="text-xs text-slate-600">Rotation sequence unavailable.</p>'}
      <p class="text-xs text-slate-500">Algorithm does not generate planting and harvest dates. No data available for calendar dates.</p>`;
    return;
  }

  if (!strategy) {
    box.innerHTML = '<p class="text-xs text-slate-600">Rotation sequence unavailable.</p>';
    return;
  }

  const months = getLocalizedMonths();
  const seqIds = Array.isArray(strategy.cropSequence) ? strategy.cropSequence : [];
  const activeCropId = (strategy.type === 'current' ? seqIds[0] : seqIds[1]) || sim.payload?.cropAndResources?.targetCrop || 'wheat';
  const isSpringCrop = ['maize', 'sunflower', 'chickpea'].includes(activeCropId);
  const windowLabel = strategy.plantingWindow || (isSpringCrop ? 'March – April' : 'September – October');

  const soilType = sim.payload?.soil?.type || 'tinli';
  const soilLabel = sim.soilLabel || 'Loamy Soil';
  const irrigation = sim.payload?.cropAndResources?.irrigation || 'kuru_tarim';
  const irrigLabel =
    irrigation === 'damla_sulama' ? 'Drip Irrigation'
    : irrigation === 'yagmurlama' ? 'Sprinkler Irrigation'
    : irrigation === 'salma_sulama' ? 'Flood Irrigation'
    : 'Dry Farming (Rainfed)';

  const mf = sim.monthlyForecasts || [];
  const nov = findMonthForecast(mf, '2026-11');
  const feb = findMonthForecast(mf, '2027-02');
  const mar = findMonthForecast(mf, '2027-03');
  const apr = findMonthForecast(mf, '2027-04');
  const may = findMonthForecast(mf, '2027-05');
  const jun = findMonthForecast(mf, '2027-06');
  const jul = findMonthForecast(mf, '2027-07');

  const soilPrepNote =
    soilType === 'killi' ? `${soilLabel}: deep chisel aeration to prevent compaction under heavy moisture.`
    : soilType === 'kumlu' ? `${soilLabel}: minimum tillage and organic matter supplementation to reduce moisture loss.`
    : soilType === 'kirecli' ? `${soilLabel}: sulfur and micronutrient-enriched base fertilizer against phosphorus lock-up.`
    : `${soilLabel}: balanced seedbed preparation and base fertilizer application.`;

  const milestones = isSpringCrop
    ? [
        {
          m: `${months[1]} – ${months[2]}`,
          title: 'Soil Preparation & Moisture Check',
          desc: `${soilPrepNote} (${feb ? `Feb avg: ${num(feb.temperatureC)} °C, rain: ${num(feb.precipitationMm)} mm` : ''})`,
          color: 'bg-sky-500'
        },
        {
          m: windowLabel,
          title: 'Dynamic Optimal Planting Window',
          desc: `${strategy.sequence[1] || strategy.sequence[0]} sowing (${irrigLabel} · Water saving target: ${num(strategy.waterSaving)}%).`,
          color: 'bg-emerald-500'
        },
        {
          m: months[3],
          title: 'Germination & Root Establishment',
          desc: `April NASA forecast: ${apr ? `${num(apr.temperatureC)} °C, rain ${num(apr.precipitationMm)} mm, root moisture WET3: ${num(apr.soilWetnessWet3Index, 2)}` : 'soil moisture monitoring'}.`,
          color: 'bg-emerald-400'
        },
        {
          m: months[4],
          title: 'Vegetative Growth & Top-Dressing',
          desc: `May NASA forecast: ${may ? `${num(may.temperatureC)} °C, rain ${num(may.precipitationMm)} mm` : ''} — top-dressing tailored for ${soilLabel}.`,
          color: 'bg-sky-500'
        },
        {
          m: months[5],
          title: 'Flowering & Water Stress Shield',
          desc: `June NASA forecast: ${jun ? `${num(jun.temperatureC)} °C, WET3: ${num(jun.soilWetnessWet3Index, 2)}` : ''} — critical moisture management with ${irrigLabel}.`,
          color: 'bg-amber-500'
        },
        {
          m: months[6],
          title: 'Grain / Head Filling',
          desc: `July NASA forecast: ${jul ? `${num(jul.temperatureC)} °C, rain ${num(jul.precipitationMm)} mm` : ''} — early maturation advantage against heatwaves.`,
          color: 'bg-sky-600'
        },
        {
          m: `${months[7]} – ${months[8]}`,
          title: 'Harvest & Yield Protection',
          desc: `Safe harvest and grain moisture check targeting ${strategy.yieldDeltaText} (${num(sim.payload?.soil?.areaDekar)} da).`,
          color: 'bg-amber-600'
        },
        {
          m: `${months[9]} – ${months[10]}`,
          title: 'Rotation Cycle & Residue Management',
          desc: `Soil organic matter recovery and next-season preparation following ${strategy.title} rotation.`,
          color: 'bg-emerald-600'
        }
      ]
    : [
        {
          m: months[8],
          title: 'Soil Preparation & Moisture Check',
          desc: soilPrepNote,
          color: 'bg-sky-500'
        },
        {
          m: windowLabel,
          title: 'Dynamic Optimal Planting Window',
          desc: `${strategy.sequence[1] || strategy.sequence[0]} sowing (${irrigLabel} · Water saving target: ${num(strategy.waterSaving)}%).`,
          color: 'bg-emerald-500'
        },
        {
          m: `${months[10]} – ${months[0]}`,
          title: 'Germination & Tillering',
          desc: `November NASA forecast: ${nov ? `${num(nov.temperatureC)} °C, rain ${num(nov.precipitationMm)} mm, WET3: ${num(nov.soilWetnessWet3Index, 2)}` : 'pre-winter root establishment'}.`,
          color: 'bg-emerald-400'
        },
        {
          m: months[2],
          title: 'Stem Elongation & Spring Nutrition',
          desc: `March NASA forecast: ${mar ? `${num(mar.temperatureC)} °C, rain ${num(mar.precipitationMm)} mm, WET3: ${num(mar.soilWetnessWet3Index, 2)}` : ''} — nitrogen top-dressing for ${soilLabel}.`,
          color: 'bg-sky-500'
        },
        {
          m: months[3],
          title: 'Disease & Rust Shield',
          desc: `April NASA forecast: ${apr ? `${num(apr.temperatureC)} °C, rain ${num(apr.precipitationMm)} mm` : ''} — foliar fungal inspection under spring humidity.`,
          color: 'bg-amber-500'
        },
        {
          m: months[4],
          title: 'Heading / Flowering & Grain Filling',
          desc: `May NASA forecast: ${may ? `${num(may.temperatureC)} °C, rain ${num(may.precipitationMm)} mm, WET3: ${num(may.soilWetnessWet3Index, 2)}` : ''} — water stress management with ${irrigLabel}.`,
          color: 'bg-sky-600'
        },
        {
          m: `${months[5]} – ${months[6]}`,
          title: 'Early Harvest & Storage',
          desc: `Harvest with ${strategy.yieldDeltaText} prior to June–July (${jun ? `${num(jun.temperatureC)}–${num(jul?.temperatureC)} °C` : ''}) extreme heat.`,
          color: 'bg-amber-600'
        },
        {
          m: `${months[7]} – ${months[8]}`,
          title: 'Rotation Transition (2nd Crop Prep)',
          desc: `Preserving soil nitrogen and moisture balance through ${strategy.title} rotation.`,
          color: 'bg-emerald-600'
        }
      ];

  box.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
      <div>
        <h3 class="text-base font-bold text-slate-900">📅 Rotation Sequence & 12-Month Phenological Planting Calendar</h3>
        <p class="text-xs text-slate-500">Tailored to selected strategy, NASA monthly forecasts, and <strong>${esc(soilLabel)}</strong> structure: <strong>${esc(strategy.title)}</strong></p>
      </div>
      <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
        🌱 ${esc(windowLabel)}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      ${strategy.sequence.map((name, index) => `
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5">
          <span class="text-[11px] font-mono text-emerald-700 font-semibold">Season ${index + 1} Crop</span>
          <p class="text-sm font-bold text-slate-900">${esc(name)}</p>
        </div>
      `).join('<span aria-hidden="true" class="text-emerald-600 font-bold text-lg">→</span>')}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
      ${milestones.map(item => `
        <div class="timeline-item pb-2">
          <span class="timeline-dot ${item.color}"></span>
          <div class="rounded-xl bg-white border border-slate-200 p-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-900">${esc(item.title)}</span>
              <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">${esc(item.m)}</span>
            </div>
            <p class="text-[11px] text-slate-600 mt-1">${esc(item.desc)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
