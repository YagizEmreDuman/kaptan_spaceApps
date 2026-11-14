import { initMapManager, refreshMapSize } from './modules/mapManager.js';
import { initFormManager } from './modules/formManager.js';
import { fetchAllBackendData } from './modules/apiClient.js';
import { renderClimateCharts } from './modules/chartManager.js';
import { renderDashboardUI } from './modules/uiRenderer.js';
import { renderSimulationPanel } from './modules/simulationPanel.js';
import { initI18n, applyTranslations, t } from './modules/i18nManager.js';

let lastUsedPayload = null;
let lastApiResult = null;

function showScreen(screenName) {
  const setupScreen = document.getElementById('setup-screen');
  const loadingScreen = document.getElementById('api-loading-state');
  const analysisScreen = document.getElementById('climate-panel');
  const backBtn = document.getElementById('back-to-setup-btn');

  setupScreen?.classList.add('hidden');
  loadingScreen?.classList.add('hidden');
  loadingScreen?.classList.remove('flex');
  analysisScreen?.classList.add('hidden');
  analysisScreen?.classList.remove('flex');

  if (screenName === 'setup') {
    setupScreen?.classList.remove('hidden');
    backBtn?.classList.add('hidden');
    backBtn?.classList.remove('inline-flex');
    refreshMapSize();
  } else if (screenName === 'loading') {
    loadingScreen?.classList.remove('hidden');
    loadingScreen?.classList.add('flex');
    backBtn?.classList.remove('hidden');
    backBtn?.classList.add('inline-flex');
  } else if (screenName === 'analysis') {
    analysisScreen?.classList.remove('hidden');
    analysisScreen?.classList.add('flex');
    backBtn?.classList.remove('hidden');
    backBtn?.classList.add('inline-flex');
  }
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach((b) => {
        b.className = 'tab-btn flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-sky-50 transition cursor-pointer';
      });
      btn.className = 'tab-btn flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer bg-emerald-500 text-white shadow-xs';

      tabPanes.forEach((pane) => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
          pane.classList.add('flex');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('flex');
        }
      });

      // Grafik sekmesine geçildiğinde Chart.js boyutunu tazele
      if (targetId === 'tab-simulation' && lastApiResult?.data) {
        renderClimateCharts(
          lastApiResult.data.profile,
          lastApiResult.data.monthlyDrought,
          lastApiResult.data.monthlyFungal
        );
      }
    });
  });
}

function renderApiStatusBanner(result, onRetry) {
  const banner = document.getElementById('api-status-banner');
  if (!banner) return;

  banner.classList.remove('hidden');

  if (result.status === 'live') {
    banner.className = 'rounded-xl px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs';
    banner.innerHTML = `<span>🟢 <strong>Canlı Backend Bağlantısı Aktif (3/3 API)</strong></span><span class="font-mono text-[10px]">localhost:3000</span>`;
  } else {
    banner.className = 'rounded-xl px-3.5 py-2 border border-amber-300 bg-amber-50 text-amber-900 flex flex-wrap items-center justify-between gap-2 text-xs';
    banner.innerHTML = `
      <span>⚠️ <strong>Yerel Simülasyon Modu:</strong> ${result.errors[0] || 'Sunucu kapalı'}</span>
      <button type="button" id="api-retry-btn" class="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-mono text-[11px] font-semibold cursor-pointer">↻ Tekrar Dene</button>
    `;
    document.getElementById('api-retry-btn')?.addEventListener('click', () => {
      if (lastUsedPayload) onRetry(lastUsedPayload);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n(() => {
    if (lastApiResult?.data) {
      renderClimateCharts(
        lastApiResult.data.profile,
        lastApiResult.data.monthlyDrought,
        lastApiResult.data.monthlyFungal
      );
      applyTranslations();
    }
  });

  initMapManager();
  initTabs();

  document.getElementById('back-to-setup-btn')?.addEventListener('click', () => {
    showScreen('setup');
  });

  async function executeAnalysis(activePayload, { onlySimulation = false, switchScreen = true } = {}) {
    lastUsedPayload = activePayload;

    if (switchScreen) showScreen('loading');

    const result = await fetchAllBackendData(activePayload, {
      onlySimulation,
      cachedData: lastApiResult
    });
    lastApiResult = result;

    if (switchScreen) showScreen('analysis');

    renderDashboardUI(result.data);
    renderClimateCharts(
      result.data.profile,
      result.data.monthlyDrought,
      result.data.monthlyFungal
    );

    renderApiStatusBanner(result, (retryPayload) =>
      executeAnalysis(retryPayload, { onlySimulation: false, switchScreen: true })
    );

    applyTranslations();
  }

  initFormManager((initialPayload) => {
    renderSimulationPanel(initialPayload, (simulatedPayload) => {
      executeAnalysis(simulatedPayload, { onlySimulation: true, switchScreen: false });
    });

    executeAnalysis(initialPayload, { onlySimulation: false, switchScreen: true });
  });
});