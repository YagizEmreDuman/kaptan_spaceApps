import { escapeHtml as esc } from './displayUtils.js';

export function renderPlantingTimeline(sim, selectedStrategyId) {
  const box = document.getElementById('planting-timeline-box');
  if (!box) return;
  const strategy = sim.strategies.find(item => item.id === selectedStrategyId);
  box.innerHTML = `<h3 class="text-sm font-bold text-slate-900">Rotasyon sırası</h3>
    ${strategy ? `<div class="flex flex-wrap items-center gap-3">${strategy.sequence.map((name, index) =>
      `<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><span class="text-xs text-slate-500">${index + 1}. ürün</span><p class="text-sm font-semibold">${esc(name)}</p></div>`
    ).join('<span aria-hidden="true">→</span>')}</div>` : '<p class="text-xs text-slate-600">Rotasyon sırası alınamadı.</p>'}
    <p class="text-xs text-slate-500">Algorithm ekim ve hasat tarihi üretmiyor. Takvim tarihleri için veri bulunmuyor.</p>`;
}
