import { initMapManager, refreshMapSize } from './modules/mapManager.js';
import { initFormManager } from './modules/formManager.js';
import { fetchAllBackendData, fetchCatalog } from './modules/apiClient.js';
import { getLocalCatalog } from './modules/localAlgorithmEngine.js';
import { renderClimateCharts } from './modules/chartManager.js';
import { renderDashboardUI } from './modules/uiRenderer.js';
import { renderSimulationPanel, cancelPendingSimulation } from './modules/simulationPanel.js';
import { initI18n, applyTranslations, t } from './modules/i18nManager.js';
import { escapeHtml, formatMonth } from './modules/displayUtils.js';
import { syncFarmSimulationContext, pauseFarmSimulation } from './modules/farmSimulation.js';

let lastUsedPayload = null;
let lastApiResult = null;
let metadata = getLocalCatalog();
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
  banner.innerHTML = `<strong>${result.algorithmAvailable ? 'Algorithm data loaded' : 'Algorithm data unavailable'}</strong>
    <span> · Daily weather: ${result.weatherAvailable ? 'loaded from service' : 'unavailable'}</span>
    ${result.errors.map(error => `<p class="mt-1">${escapeHtml(error)}</p>`).join('')}
    ${result.errors.length ? '<button id="api-retry-btn" class="mt-2 underline font-semibold" type="button">Retry</button>' : ''}`;
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
      if (button.dataset.tab === 'tab-simulation' && lastApiResult) renderClimateCharts(lastApiResult.data);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initI18n(() => {
    const activeSoil = document.querySelector('input[name="soilType"]:checked')?.value || 'tinli';
    const soilHintEl = document.getElementById('soil-risk-hint');
    if (soilHintEl) soilHintEl.textContent = t(`soil_hint_${activeSoil}`);
    if (lastApiResult) renderResult(lastApiResult);
  });
  initMapManager();
  initTabs();

  function applyCatalogToDom(cat) {
    const status = document.getElementById('data-setup-status');
    const cropSelect = document.getElementById('target-crop');
    const monthSelect = document.getElementById('forecast-month');
    const prevCrop = cropSelect?.value;
    const prevMonth = monthSelect?.value;
    if (cropSelect) {
      cropSelect.innerHTML = cat.crops.map(crop => `<option value="${escapeHtml(crop.id)}">${escapeHtml(crop.name)}</option>`).join('');
      if (prevCrop && cat.crops.some(c => c.id === prevCrop)) cropSelect.value = prevCrop;
    }
    if (monthSelect) {
      monthSelect.innerHTML = cat.forecastMonths.map(month => `<option value="${escapeHtml(month)}">${escapeHtml(formatMonth(month))}</option>`).join('');
      if (prevMonth && cat.forecastMonths.includes(prevMonth)) monthSelect.value = prevMonth;
    }
    if (status) {
      status.textContent = `${cat.crops.length} crops · ${cat.forecastMonths.length} forecast months · Historical baseline: ${cat.referencePeriod}. Monthly algorithm data covers Turkey.`;
    }
    for (const id of ['analyze-btn', 'quick-demo-btn']) {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    }
  }

  async function loadCatalog() {
    applyCatalogToDom(metadata);
    try {
      metadata = await fetchCatalog();
      applyCatalogToDom(metadata);
    } catch {
      metadata = getLocalCatalog();
      applyCatalogToDom(metadata);
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
    if (switchScreen) showScreen('loading');
    else {
      const banner = document.getElementById('api-status-banner');
      banner.textContent = 'Updating algorithm results…';
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

  initFormManager(payload => {
    const activeMeta = metadata || getLocalCatalog();
    renderSimulationPanel(payload, simulated => executeAnalysis(simulated, { onlySimulation: true, switchScreen: false }), activeMeta);
    executeAnalysis(payload);
  });
  loadCatalog();
});
