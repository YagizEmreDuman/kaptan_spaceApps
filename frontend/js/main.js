import { initMapManager } from './modules/mapManager.js';
import { initFormManager } from './modules/formManager.js';
import { fetchAllBackendData } from './modules/apiClient.js';
import { renderClimateCharts } from './modules/chartManager.js';
import { renderDashboardUI } from './modules/uiRenderer.js';
import { renderSimulationPanel } from './modules/simulationPanel.js';

let lastUsedPayload = null;
let lastApiResult = null;

function setLoadingState(isLoading) {
  const analyzeBtn = document.getElementById('analyze-btn');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('api-loading-state');
  const climatePanel = document.getElementById('climate-panel');

  if (analyzeBtn) {
    analyzeBtn.disabled = isLoading;
    analyzeBtn.classList.toggle('opacity-60', isLoading);
    analyzeBtn.innerHTML = isLoading
      ? `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
         </svg>
         <span>3 API Ucu Sorgulanıyor...</span>`
      : `<span>İklim & Rotasyon Simülasyonunu Çalıştır</span>
         <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
         </svg>`;
  }

  if (isLoading) {
    if (emptyState) emptyState.classList.add('hidden');
    if (climatePanel) {
      climatePanel.classList.add('hidden');
      climatePanel.classList.remove('flex');
    }
    if (loadingState) {
      loadingState.classList.remove('hidden');
      loadingState.classList.add('flex');
    }
  } else if (loadingState) {
    loadingState.classList.add('hidden');
    loadingState.classList.remove('flex');
  }
}

function renderApiStatusBanner(result, onRetry) {
  const banner = document.getElementById('api-status-banner');
  if (!banner) return;

  banner.classList.remove('hidden');

  if (result.status === 'live') {
    banner.className =
      'rounded-xl px-3.5 py-2.5 border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span><strong>Backend Entegrasyonu Aktif (3/3 Uç Bağlı):</strong> analyze-location, weather-tasks ve simulate-rotation canlı çalışıyor.</span>
      </div>
      <span class="text-[10px] font-mono text-emerald-400">localhost:3000 OK</span>
    `;
  } else {
    banner.className =
      'rounded-xl px-3.5 py-2.5 border border-amber-500/40 bg-amber-950/30 text-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs';
    banner.innerHTML = `
      <div class="flex items-center gap-2">
        <span>⚠️</span>
        <span>
          <strong>${result.status === 'partial' ? `Kısmi API Bağlantısı (${result.successCount}/3 Uç)` : 'Yedek Simülasyon Modu'}:</strong>
          <span class="text-amber-300/85">${result.errors[0] || 'localhost:3000 kapalı'} — Eksik uçlar yerel motorla tamamlandı.</span>
        </span>
      </div>
      <button
        type="button"
        id="api-retry-btn"
        class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 font-mono text-[11px] font-semibold transition cursor-pointer"
      >
        ↻ Uçları Tekrar Dene
      </button>
    `;

    const retryBtn = document.getElementById('api-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (lastUsedPayload) onRetry(lastUsedPayload);
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMapManager();

  async function executeAnalysis(activePayload, { onlySimulation = false, showFullLoader = true } = {}) {
    lastUsedPayload = activePayload;

    if (showFullLoader) setLoadingState(true);

    const result = await fetchAllBackendData(activePayload, {
      onlySimulation,
      cachedData: lastApiResult
    });
    lastApiResult = result;

    if (showFullLoader) setLoadingState(false);

    renderDashboardUI(result.data);
    renderClimateCharts(
      result.data.profile,
      result.data.monthlyDrought,
      result.data.monthlyFungal
    );

    renderApiStatusBanner(result, (retryPayload) =>
      executeAnalysis(retryPayload, { onlySimulation: false, showFullLoader: true })
    );
  }

  initFormManager((initialPayload) => {
    renderSimulationPanel(initialPayload, (simulatedPayload) => {
      // Slider değişiminde sadece /api/simulate-rotation ucuna istek at
      executeAnalysis(simulatedPayload, { onlySimulation: true, showFullLoader: false });
    });

    // İlk form gönderiminde 3 uca birden istek at
    executeAnalysis(initialPayload, { onlySimulation: false, showFullLoader: true });
  });
});