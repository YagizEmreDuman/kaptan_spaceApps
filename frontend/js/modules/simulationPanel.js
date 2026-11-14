const IRRIGATION_OPTIONS = [
  { value: 'damla_sulama', label: '💧 Damla' },
  { value: 'yagmurlama', label: '🚿 Yağmurlama' },
  { value: 'salma_sulama', label: '🌊 Salma' },
  { value: 'kuru_tarim', label: '🌧️ Kuru Tarım' }
];

const CROP_OPTIONS = [
  { value: 'bugday', label: '🌾 Ekmeklik Buğday' },
  { value: 'misir', label: '🌽 Dane Mısır' },
  { value: 'domates', label: '🍅 Salçalık Domates' },
  { value: 'aycicegi', label: '🌻 Ayçiçeği' },
  { value: 'pamuk', label: '☁️ Pamuk' },
  { value: 'seker_pancari', label: '🌱 Şeker Pancarı' }
];

export function renderSimulationPanel(basePayload, onSimulateCallback) {
  const container = document.getElementById('simulation-panel-box');
  if (!container) return;

  const simState = {
    rainDeltaPct: basePayload.simOverrides?.rainDeltaPct ?? 0,
    humidityIncrease: basePayload.simOverrides?.humidityIncrease ?? 0,
    irrigation: basePayload.cropAndResources.irrigation,
    targetCrop: basePayload.cropAndResources.targetCrop
  };

  function emitChange() {
    const leftIrrigation = document.getElementById('irrigation');
    const leftCrop = document.getElementById('target-crop');
    if (leftIrrigation) leftIrrigation.value = simState.irrigation;
    if (leftCrop) leftCrop.value = simState.targetCrop;

    const updatedPayload = {
      ...basePayload,
      cropAndResources: {
        ...basePayload.cropAndResources,
        irrigation: simState.irrigation,
        targetCrop: simState.targetCrop
      },
      simOverrides: {
        rainDeltaPct: simState.rainDeltaPct,
        humidityIncrease: simState.humidityIncrease
      }
    };

    onSimulateCallback(updatedPayload);
  }

  function updateView() {
    const rainSign = simState.rainDeltaPct > 0 ? '+' : '';
    const humSign = simState.humidityIncrease > 0 ? '+' : '';

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3.5">
        <div class="flex items-center gap-2">
          <span class="text-base">🎛️</span>
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-white tracking-tight">Canlı İklim & Tarla Simülasyon Laboratuvarı</h3>
            <p class="text-[11px] text-slate-400">Değişiklikler anında <code class="text-emerald-400 font-mono">POST /api/simulate-rotation</code> ucuna gönderilir</p>
          </div>
        </div>
        <button
          type="button"
          id="sim-reset-btn"
          class="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
        >
          ↺ Sıfırla
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
        <!-- 1. Yağış & Nem Senaryo Sürgüleri (5 Kolon) -->
        <div class="md:col-span-5 rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between gap-2.5">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label for="sim-rain-slider" class="text-[11px] font-medium text-slate-300">Yağış Değişimi (rainChangePercent)</label>
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ${rainSign}${simState.rainDeltaPct}%
              </span>
            </div>
            <input
              type="range"
              id="sim-rain-slider"
              min="-40"
              max="40"
              step="5"
              value="${simState.rainDeltaPct}"
              class="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div class="border-t border-slate-800/80 pt-2">
            <div class="flex items-center justify-between mb-1">
              <label for="sim-humidity-slider" class="text-[11px] font-medium text-slate-300">Nem Artışı (humidityIncrease)</label>
              <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ${humSign}${simState.humidityIncrease}%
              </span>
            </div>
            <input
              type="range"
              id="sim-humidity-slider"
              min="-20"
              max="35"
              step="5"
              value="${simState.humidityIncrease}"
              class="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        <!-- 2. Sulama Yöntemi Seçici (4 Kolon) -->
        <div class="md:col-span-4 rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between gap-2">
          <span class="text-[11px] font-medium text-slate-300">Sulama Rejimi (farmerInputs.irrigation)</span>
          <div class="grid grid-cols-2 gap-1.5">
            ${IRRIGATION_OPTIONS.map(opt => {
              const active = opt.value === simState.irrigation;
              return `
                <button
                  type="button"
                  data-sim-irrigation="${opt.value}"
                  class="px-2 py-1.5 rounded-lg text-[11px] font-medium border transition cursor-pointer text-left truncate ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }"
                >
                  ${opt.label}
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 3. Ürün Seçici (3 Kolon) -->
        <div class="md:col-span-3 rounded-xl bg-slate-950/70 border border-slate-800 p-3 flex flex-col justify-between gap-2">
          <label for="sim-crop-select" class="text-[11px] font-medium text-slate-300">Baz Ürün</label>
          <select
            id="sim-crop-select"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
          >
            ${CROP_OPTIONS.map(c => `
              <option value="${c.value}" ${c.value === simState.targetCrop ? 'selected' : ''}>
                ${c.label}
              </option>
            `).join('')}
          </select>
          <span class="text-[10px] text-slate-400">Rotasyon & takvimi yeniler</span>
        </div>
      </div>
    `;

    document.getElementById('sim-rain-slider').addEventListener('input', (e) => {
      simState.rainDeltaPct = Number(e.target.value);
      updateView();
      emitChange();
    });

    document.getElementById('sim-humidity-slider').addEventListener('input', (e) => {
      simState.humidityIncrease = Number(e.target.value);
      updateView();
      emitChange();
    });

    container.querySelectorAll('[data-sim-irrigation]').forEach(btn => {
      btn.addEventListener('click', () => {
        simState.irrigation = btn.dataset.simIrrigation;
        updateView();
        emitChange();
      });
    });

    document.getElementById('sim-crop-select').addEventListener('change', (e) => {
      simState.targetCrop = e.target.value;
      updateView();
      emitChange();
    });

    document.getElementById('sim-reset-btn').addEventListener('click', () => {
      simState.rainDeltaPct = 0;
      simState.humidityIncrease = 0;
      simState.irrigation = basePayload.cropAndResources.irrigation;
      simState.targetCrop = basePayload.cropAndResources.targetCrop;
      updateView();
      emitChange();
    });
  }

  updateView();
}