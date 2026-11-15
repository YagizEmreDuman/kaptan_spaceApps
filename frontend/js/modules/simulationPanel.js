import { t } from './i18nManager.js';

export function renderSimulationPanel(initialPayload, onSimulateChange) {
  const container = document.getElementById('simulation-panel-box');
  if (!container) return;

  const rainVal = initialPayload.simOverrides?.rainDeltaPct ?? 0;
  const humVal = initialPayload.simOverrides?.humidityIncrease ?? 0;

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/70 pb-3 mb-4">
      <div>
        <h3 class="text-base font-bold text-slate-900">🎛️ ${t('sim_title')}</h3>
        <p class="text-xs text-slate-600">${t('sim_sub')}</p>
      </div>
      <button type="button" id="sim-reset-btn" class="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs font-semibold text-amber-900 cursor-pointer transition">
        ↺ ${t('sim_reset')}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="bg-white rounded-xl p-3.5 border border-slate-200">
        <div class="flex justify-between text-xs font-semibold mb-2">
          <span class="text-slate-700">${t('sim_rain_lbl')}</span>
          <span id="sim-rain-val" class="font-mono text-sky-700 font-bold">${rainVal > 0 ? '+' : ''}${rainVal}%</span>
        </div>
        <input type="range" id="sim-rain-slider" min="-50" max="50" step="5" value="${rainVal}" class="w-full accent-sky-600 cursor-pointer" />
      </div>

      <div class="bg-white rounded-xl p-3.5 border border-slate-200">
        <div class="flex justify-between text-xs font-semibold mb-2">
          <span class="text-slate-700">${t('sim_hum_lbl')}</span>
          <span id="sim-hum-val" class="font-mono text-emerald-700 font-bold">+${humVal}%</span>
        </div>
        <input type="range" id="sim-hum-slider" min="0" max="30" step="5" value="${humVal}" class="w-full accent-emerald-600 cursor-pointer" />
      </div>
    </div>
  `;

  const rainSlider = document.getElementById('sim-rain-slider');
  const humSlider = document.getElementById('sim-hum-slider');
  const rainDisplay = document.getElementById('sim-rain-val');
  const humDisplay = document.getElementById('sim-hum-val');
  const resetBtn = document.getElementById('sim-reset-btn');

  function triggerUpdate() {
    const r = Number(rainSlider.value);
    const h = Number(humSlider.value);
    rainDisplay.textContent = `${r > 0 ? '+' : ''}${r}%`;
    humDisplay.textContent = `+${h}%`;

    if (typeof onSimulateChange === 'function') {
      onSimulateChange({
        ...initialPayload,
        simOverrides: { rainDeltaPct: r, humidityIncrease: h }
      });
    }
  }

  rainSlider?.addEventListener('input', triggerUpdate);
  humSlider?.addEventListener('input', triggerUpdate);
  resetBtn?.addEventListener('click', () => {
    rainSlider.value = 0;
    humSlider.value = 0;
    triggerUpdate();
  });
}