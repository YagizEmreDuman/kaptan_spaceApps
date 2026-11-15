import { initMapManager, refreshMapSize } from './modules/mapManager.js';
import { initFormManager } from './modules/formManager.js';
import { fetchAllBackendData, fetchCatalog } from './modules/apiClient.js';
import { renderClimateCharts } from './modules/chartManager.js';
import { renderDashboardUI } from './modules/uiRenderer.js';
<<<<<<< HEAD
import { renderSimulationPanel, cancelPendingSimulation } from './modules/simulationPanel.js';
import { initI18n, applyTranslations } from './modules/i18nManager.js';
import { escapeHtml, formatMonth } from './modules/displayUtils.js';
import { syncFarmSimulationContext, pauseFarmSimulation } from './modules/farmSimulation.js';
=======
import { renderSimulationPanel } from './modules/simulationPanel.js';
import { runAgronomySimulation } from './modules/riskCalculator.js';
import { initI18n, applyTranslations, t } from './modules/i18nManager.js';
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d

let lastUsedPayload = null;
let lastApiResult = null;
let metadata = null;
let analysisVersion = 0;

function showScreen(name) {
  for (const [screen, id] of [['setup', 'setup-screen'], ['loading', 'api-loading-state'], ['analysis', 'climate-panel']]) {
    const node = document.getElementById(id);
    node?.classList.toggle('hidden', name !== screen);
    if (screen !== 'setup') node?.classList.toggle('flex', name === screen);
  }
  const back = document.getElementById('back-to-setup-btn');
  back?.classList.toggle('hidden', name === 'setup');
  back?.classList.toggle('inline-flex', name !== 'setup');
  if (name === 'setup') refreshMapSize();
}

function renderStatus(result, retry) {
  const banner = document.getElementById('api-status-banner');
  if (!banner) return;
  banner.className = `rounded-xl px-4 py-3 border text-xs ${result.algorithmAvailable
    ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`;
  banner.innerHTML = `<strong>${result.algorithmAvailable ? 'Algorithm verileri alındı' : 'Algorithm verileri alınamadı'}</strong>
    <span> · Günlük hava: ${result.weatherAvailable ? 'servisten alındı' : 'kullanılamıyor'}</span>
    ${result.errors.map(error => `<p class="mt-1">${escapeHtml(error)}</p>`).join('')}
    ${result.errors.length ? '<button id="api-retry-btn" class="mt-2 underline font-semibold" type="button">Tekrar dene</button>' : ''}`;
  document.getElementById('api-retry-btn')?.addEventListener('click', retry);
}

function renderResult(result) {
  renderDashboardUI(result.data);
  renderClimateCharts(result.data);
  syncFarmSimulationContext(result.data);
  applyTranslations();
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(item => {
        const active = item === button;
        item.classList.toggle('bg-emerald-500', active);
        item.classList.toggle('text-white', active);
        item.classList.toggle('text-slate-600', !active);
      });
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('hidden', pane.id !== button.dataset.tab);
        pane.classList.toggle('flex', pane.id === button.dataset.tab);
      });
<<<<<<< HEAD
      if (button.dataset.tab === 'tab-simulation' && lastApiResult) renderClimateCharts(lastApiResult.data);
=======

      if (targetId === 'tab-simulation' && lastApiResult?.data) {
        renderClimateCharts(
          lastApiResult.data.profile,
          lastApiResult.data.monthlyDrought,
          lastApiResult.data.monthlyFungal
        );
      }
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
    });
  });
}

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
  initI18n(() => { if (lastApiResult) renderResult(lastApiResult); });
  initMapManager();
  initTabs();

  async function loadCatalog() {
    const status = document.getElementById('data-setup-status');
    const cropSelect = document.getElementById('target-crop');
    const monthSelect = document.getElementById('forecast-month');
    for (const id of ['analyze-btn', 'quick-demo-btn']) document.getElementById(id).disabled = true;
    status.textContent = 'Algorithm ürün kataloğu ve tahmin ayları yükleniyor…';
    try {
      metadata = await fetchCatalog();
      cropSelect.innerHTML = metadata.crops.map(crop => `<option value="${escapeHtml(crop.id)}">${escapeHtml(crop.name)}</option>`).join('');
      monthSelect.innerHTML = metadata.forecastMonths.map(month => `<option value="${escapeHtml(month)}">${escapeHtml(formatMonth(month))}</option>`).join('');
      status.textContent = `${metadata.crops.length} ürün · ${metadata.forecastMonths.length} tahmin ayı · Geçmiş referansı: ${metadata.referencePeriod}. Aylık algorithm verileri Türkiye kapsamındadır.`;
      for (const id of ['analyze-btn', 'quick-demo-btn']) document.getElementById(id).disabled = false;
    } catch (error) {
      metadata = null;
      cropSelect.innerHTML = '<option value="">Ürün verisi alınamadı</option>';
      monthSelect.innerHTML = '<option value="">Tahmin ayları alınamadı</option>';
      status.innerHTML = `${escapeHtml(error.message)} <button type="button" id="catalog-retry-btn" class="underline font-semibold">Tekrar dene</button>`;
      document.getElementById('catalog-retry-btn')?.addEventListener('click', loadCatalog);
    }
  }

  document.getElementById('back-to-setup-btn')?.addEventListener('click', () => {
    pauseFarmSimulation();
    cancelPendingSimulation();
    analysisVersion += 1;
    showScreen('setup');
  });

  async function executeAnalysis(payload, { onlySimulation = false, switchScreen = true } = {}) {
    const version = ++analysisVersion;
    lastUsedPayload = payload;
=======
function renderApiStatusBanner(result, onRetry) {
  const banner = document.getElementById('api-status-banner');
  if (!banner) return;

  banner.classList.remove('hidden');

  if (result.status === 'live') {
    banner.className = 'rounded-xl px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center justify-between text-xs';
    banner.innerHTML = `<span>🟢 <strong>${t('api_live')}</strong></span><span class="font-mono text-[10px]">localhost:3000</span>`;
  } else {
    banner.className = 'rounded-xl px-3.5 py-2 border border-amber-300 bg-amber-50 text-amber-900 flex flex-wrap items-center justify-between gap-2 text-xs';
    banner.innerHTML = `
      <span>⚠️ <strong>${t('api_local')}</strong> ${result.errors[0] || t('api_offline')}</span>
      <button type="button" id="api-retry-btn" class="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-mono text-[11px] font-semibold cursor-pointer">${t('api_retry')}</button>
    `;
    document.getElementById('api-retry-btn')?.addEventListener('click', () => {
      if (lastUsedPayload) onRetry(lastUsedPayload);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  async function executeAnalysis(activePayload, { onlySimulation = false, switchScreen = true } = {}) {
    lastUsedPayload = activePayload;

>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
    if (switchScreen) showScreen('loading');
    else {
      const banner = document.getElementById('api-status-banner');
      banner.textContent = 'Algorithm sonuçları güncelleniyor…';
      banner.classList.remove('hidden');
    }
    let result;
    try {
      result = await fetchAllBackendData(payload, { onlySimulation, cachedData: lastApiResult, metadata });
    } catch (error) {
      // Invalid form contracts cannot reuse previous results.
      result = { algorithmAvailable: false, weatherAvailable: false, errors: [error.message], data: null };
    }
    if (version !== analysisVersion) return;
    if (!result.data) {
      showScreen('setup');
      document.getElementById('data-setup-status').textContent = result.errors.join(' · ');
      return;
    }
    lastApiResult = result;
    if (switchScreen) showScreen('analysis');
    renderResult(result);
    renderStatus(result, () => executeAnalysis(lastUsedPayload));
  }

<<<<<<< HEAD
  initFormManager(payload => {
    if (!metadata) return;
    renderSimulationPanel(payload, simulated => executeAnalysis(simulated, { onlySimulation: true, switchScreen: false }), metadata);
    executeAnalysis(payload);
=======
  // Dil değiştiğinde hem kurulum ekranını hem de açıksa analiz ekranındaki tüm kartları/grafikleri anında yeniden çiz
  initI18n(() => {
    const activeSoil = document.querySelector('input[name="soilType"]:checked')?.value || 'tinli';
    const soilHintEl = document.getElementById('soil-risk-hint');
    if (soilHintEl) soilHintEl.textContent = t(`soil_hint_${activeSoil}`);

    if (lastUsedPayload && lastApiResult?.data) {
      const localizedSim = runAgronomySimulation(lastUsedPayload);
      localizedSim.profile.rain2026 = lastApiResult.data.profile.rain2026;
      localizedSim.profile.rainHist = lastApiResult.data.profile.rainHist;
      localizedSim.profile.temp2026 = lastApiResult.data.profile.temp2026;
      localizedSim.monthlyDrought = lastApiResult.data.monthlyDrought;
      localizedSim.monthlyFungal = lastApiResult.data.monthlyFungal;
      lastApiResult.data = localizedSim;

      renderSimulationPanel(lastUsedPayload, (simulatedPayload) => {
        executeAnalysis(simulatedPayload, { onlySimulation: true, switchScreen: false });
      });
      renderDashboardUI(localizedSim);
      renderClimateCharts(
        localizedSim.profile,
        localizedSim.monthlyDrought,
        localizedSim.monthlyFungal
      );
      renderApiStatusBanner(lastApiResult, (retryPayload) =>
        executeAnalysis(retryPayload, { onlySimulation: false, switchScreen: true })
      );
    }
    applyTranslations();
  });

  initMapManager();
  initTabs();

  document.getElementById('back-to-setup-btn')?.addEventListener('click', () => {
    showScreen('setup');
  });

  initFormManager((initialPayload) => {
    renderSimulationPanel(initialPayload, (simulatedPayload) => {
      executeAnalysis(simulatedPayload, { onlySimulation: true, switchScreen: false });
    });

    executeAnalysis(initialPayload, { onlySimulation: false, switchScreen: true });
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
  });
  loadCatalog();
});
