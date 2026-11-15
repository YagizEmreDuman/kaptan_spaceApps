import { t, getLocalizedMonths } from './i18nManager.js';

export function renderPlantingTimeline(sim, selectedStrategyId) {
  const container = document.getElementById('planting-timeline-box');
  if (!container) return;

  const months = getLocalizedMonths();
  const strategy = sim.strategies.find(s => s.id === selectedStrategyId) || sim.strategies[1];
  const isSpringCrop = ['misir', 'domates', 'aycicegi', 'pamuk', 'seker_pancari'].includes(
    sim.payload.cropAndResources.targetCrop
  );

  const milestones = isSpringCrop
    ? [
        { m: `${months[1]} – ${months[2]}`, title: t('tl_prep'), desc: t('tl_prep_desc'), color: 'bg-sky-500' },
        { m: strategy.plantingWindow, title: t('tl_sow'), desc: t('tl_sow_desc'), color: 'bg-emerald-500' },
        { m: months[4], title: t('tl_germ'), desc: t('tl_germ_desc'), color: 'bg-emerald-400' },
        { m: months[5], title: t('tl_prot'), desc: t('tl_prot_desc'), color: 'bg-amber-500' },
        { m: months[6], title: t('tl_fill'), desc: t('tl_fill_desc'), color: 'bg-sky-500' },
        { m: `${months[7]} – ${months[8]}`, title: t('tl_harv'), desc: t('tl_harv_desc'), color: 'bg-amber-600' },
        { m: `${months[9]} – ${months[11]}`, title: t('tl_cover'), desc: t('tl_cover_desc'), color: 'bg-emerald-600' }
      ]
    : [
        { m: months[8], title: t('tl_prep'), desc: t('tl_prep_desc'), color: 'bg-sky-500' },
        { m: strategy.plantingWindow, title: t('tl_sow'), desc: t('tl_sow_desc'), color: 'bg-emerald-500' },
        { m: `${months[10]} – ${months[0]}`, title: t('tl_germ'), desc: t('tl_germ_desc'), color: 'bg-emerald-400' },
        { m: months[2], title: t('tl_veg'), desc: t('tl_veg_desc'), color: 'bg-sky-500' },
        { m: months[3], title: t('tl_prot'), desc: t('tl_prot_desc'), color: 'bg-amber-500' },
        { m: months[4], title: t('tl_fill'), desc: t('tl_fill_desc'), color: 'bg-sky-600' },
        { m: `${months[5]} – ${months[6]}`, title: t('tl_harv'), desc: t('tl_harv_desc'), color: 'bg-amber-600' }
      ];

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
      <div>
        <h3 class="text-base font-bold text-slate-900">📅 ${t('timeline_title')}</h3>
        <p class="text-xs text-slate-500">${t('timeline_sub')} <strong>${strategy.title}</strong></p>
      </div>
      <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
        ${strategy.plantingWindow}
      </span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
      ${milestones
        .map(
          (item) => `
          <div class="timeline-item pb-3">
            <span class="timeline-dot ${item.color}"></span>
            <div class="rounded-xl bg-white border border-slate-200 p-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-slate-900">${item.title}</span>
                <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">${item.m}</span>
              </div>
              <p class="text-[11px] text-slate-600 mt-1">${item.desc}</p>
            </div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
}