import { escapeHtml as esc, formatMonth } from './displayUtils.js';

let pendingSimulation = null;
export function cancelPendingSimulation() {
  clearTimeout(pendingSimulation);
  pendingSimulation = null;
}

export function renderSimulationPanel(basePayload, onSimulate, metadata) {
  cancelPendingSimulation();
  const box = document.getElementById('simulation-panel-box');
  if (!box) return;
  const initial = {
    rainDeltaPct: basePayload.simOverrides?.rainDeltaPct ?? 0,
    temperatureChangeC: basePayload.simOverrides?.temperatureChangeC ?? 0,
    irrigationAvailabilityChangePct: basePayload.simOverrides?.irrigationAvailabilityChangePct ?? 0,
    crop: basePayload.cropAndResources.targetCrop,
    irrigation: basePayload.cropAndResources.irrigation,
    month: basePayload.forecastMonth
  };
  const state = { ...initial };
  function emit() {
    cancelPendingSimulation();
    pendingSimulation = setTimeout(() => {
      onSimulate({ ...basePayload,
        forecastMonth: state.month,
        cropAndResources: { ...basePayload.cropAndResources, targetCrop: state.crop, irrigation: state.irrigation },
        simOverrides: { rainDeltaPct: state.rainDeltaPct, temperatureChangeC: state.temperatureChangeC,
          irrigationAvailabilityChangePct: state.irrigationAvailabilityChangePct }
      });
    }, 300);
  }
  const sliders = [
    { key: 'rainDeltaPct', label: 'Yağış değişimi (%)', min: -100, max: 100, step: 5 },
    { key: 'temperatureChangeC', label: 'Sıcaklık değişimi (°C)', min: -10, max: 15, step: .5 },
    { key: 'irrigationAvailabilityChangePct', label: 'Sulama erişimi değişimi (%)', min: -100, max: 100, step: 5 }
  ];
  function render() {
    box.innerHTML = `<div class="flex justify-between gap-3"><div><h3 class="text-sm font-bold">Senaryo karşılaştırması</h3>
      <p class="text-xs text-slate-500 mt-1">Değişiklikler algorithm motorunda yeniden hesaplanır. Bunlar kullanıcı varsayımlarıdır; hava tahminini değiştirmez.</p></div>
      <button id="sim-reset-btn" type="button" class="text-xs underline shrink-0">Sıfırla</button></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">${sliders.map(slider => `
        <label class="text-xs">${esc(slider.label)} <output id="sim-${slider.key}-value" class="font-mono font-bold">${state[slider.key]}</output>
        <input id="sim-${slider.key}" data-sim-slider="${slider.key}" class="w-full mt-3 accent-emerald-600" type="range"
          min="${slider.min}" max="${slider.max}" step="${slider.step}" value="${state[slider.key]}"></label>`).join('')}</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
        <label>Ürün<select id="sim-crop-select" class="w-full border rounded-lg p-2 mt-1">${metadata.crops.map(crop =>
          `<option value="${esc(crop.id)}" ${crop.id === state.crop ? 'selected' : ''}>${esc(crop.name)}</option>`).join('')}</select></label>
        <label>Tahmin ayı<select id="sim-month-select" class="w-full border rounded-lg p-2 mt-1">${metadata.forecastMonths.map(month =>
          `<option value="${esc(month)}" ${month === state.month ? 'selected' : ''}>${esc(formatMonth(month))}</option>`).join('')}</select></label>
        <label>Sulama<select id="sim-irrigation-select" class="w-full border rounded-lg p-2 mt-1">${[
          ['damla_sulama', 'Damla sulama'], ['yagmurlama', 'Yağmurlama'], ['salma_sulama', 'Salma sulama'], ['kuru_tarim', 'Kuru tarım']
        ].map(([value, label]) => `<option value="${value}" ${value === state.irrigation ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      </div>
      <p class="text-[11px] text-slate-500 mt-3">Yağış tahmini yoksa senaryo yağış miktarı da boş kalır. Puanlama sulama yönteminin ayrıntısını değil, sulama bulunup bulunmadığını kullanır.</p>`;
    box.querySelectorAll('[data-sim-slider]').forEach(input => input.addEventListener('input', () => {
      state[input.dataset.simSlider] = Number(input.value);
      document.getElementById(`sim-${input.dataset.simSlider}-value`).textContent = input.value;
      emit();
    }));
    for (const [id, key] of [['sim-crop-select', 'crop'], ['sim-month-select', 'month'], ['sim-irrigation-select', 'irrigation']]) {
      document.getElementById(id).addEventListener('change', event => { state[key] = event.target.value; emit(); });
    }
    document.getElementById('sim-reset-btn').addEventListener('click', () => { Object.assign(state, initial); render(); emit(); });
  }
  render();
}
