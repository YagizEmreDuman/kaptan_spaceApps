import { initMapManager, refreshMapSize } from './modules/mapManager.js';
import { initFormManager } from './modules/formManager.js';
import { fetchAllBackendData, fetchCatalog } from './modules/apiClient.js';
import { renderClimateCharts } from './modules/chartManager.js';
import { renderDashboardUI } from './modules/uiRenderer.js';
import { renderSimulationPanel, cancelPendingSimulation } from './modules/simulationPanel.js';
import { initI18n, applyTranslations } from './modules/i18nManager.js';
import { escapeHtml, formatMonth } from './modules/displayUtils.js';
import { syncFarmSimulationContext, pauseFarmSimulation } from './modules/farmSimulation.js';

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
      if (button.dataset.tab === 'tab-simulation' && lastApiResult) renderClimateCharts(lastApiResult.data);
    });
  });
}

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

  initFormManager(payload => {
    if (!metadata) return;
    renderSimulationPanel(payload, simulated => executeAnalysis(simulated, { onlySimulation: true, switchScreen: false }), metadata);
    executeAnalysis(payload);
  });
  loadCatalog();
});
