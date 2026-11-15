import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchAllBackendData, mapPayloadToAlgorithm, fetchCatalog } from '../js/modules/apiClient.js';
import { buildDashboardData } from '../js/modules/riskCalculator.js';
import { normalizeForecastDays } from '../js/modules/taskCalendar.js';
import { renderDashboardUI } from '../js/modules/uiRenderer.js';
import { formatNumber, escapeHtml } from '../js/modules/displayUtils.js';

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });
const prediction = JSON.parse(readFileSync(new URL('../../algorithm/NASA data/output/forecast_integration/ankara_predict.json', import.meta.url)));
const payload = {
  location: { latitude: 39.9334, longitude: 32.8597, label: 'Ankara' },
  forecastMonth: '2026-11', soil: { type: 'tinli', ph: 'notr', areaDekar: 120 },
  cropAndResources: { targetCrop: 'wheat', irrigation: 'kuru_tarim', budgetLevel: 'orta', machinery: [] },
  simOverrides: { rainDeltaPct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20 }
};
// Artificial daily unit-test input; never an application fallback.
const weather = { source: 'unit-test', forecast14Days: [{ date: '2030-01-02', maxTemp: 0,
  minTemp: null, rainMm: 0, humidity: null, windKmh: null }], taskCalendar: [] };
const metadata = { crops: [{ id: 'wheat', name: 'Buğday' }], forecastMonths: ['2026-11'] };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

function fakeDocument() {
  const nodes = new Map();
  globalThis.document = { getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', querySelectorAll: () => [], addEventListener() {} });
    return nodes.get(id);
  } };
  return nodes;
}

test('form maps algorithm coordinates, crops, forecast month and scenario names', () => {
  const body = mapPayloadToAlgorithm(payload);
  assert.deepEqual(body.location, { latitude: 39.9334, longitude: 32.8597 });
  assert.deepEqual(body.farmerInputs.currentRotation, ['wheat', 'wheat']);
  assert.equal(body.farmerInputs.irrigationAvailable, false);
  assert.deepEqual(body.scenario, { rainfallChangePct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20 });
  assert.deepEqual(body.forecast, { month: '2026-11' });
  assert.throws(() => mapPayloadToAlgorithm({ ...payload, cropAndResources: { targetCrop: '' } }));
});

test('real monthly values and all rotation scores reach display unchanged', async () => {
  globalThis.fetch = async url => url.endsWith('/simulate-rotation') ? json({ simulationResult: prediction }) : json(weather);
  const result = await fetchAllBackendData(payload, { metadata });
  assert.equal(result.status, 'live');
  assert.equal(result.data.monthlyForecasts.length, 9);
  assert.deepEqual(result.data.monthlyForecasts, prediction.monthlyForecasts);
  assert.deepEqual(result.data.strategies.map(s => s.score), prediction.rotationStrategies.map(s => s.indicativeSuitabilityIndex0to100));
  assert.ok(result.data.monthlyForecasts.every(month => month.precipitationMm === null));
});

test('algorithm outage clears prior results instead of generating values', async () => {
  globalThis.fetch = async () => { throw new Error('offline'); };
  const cachedData = { rawPrediction: prediction, data: buildDashboardData(payload, prediction, weather, metadata) };
  const result = await fetchAllBackendData(payload, { cachedData, metadata });
  assert.equal(result.status, 'error');
  assert.equal(result.data.prediction, null);
  assert.deepEqual(result.data.strategies, []);
  assert.deepEqual(result.data.monthlyForecasts, []);
  assert.deepEqual(result.data.apiForecast14Days, []);
});

test('daily weather outage preserves monthly forecasts without fabricated daily data', async () => {
  globalThis.fetch = async url => url.endsWith('/simulate-rotation') ? json({ simulationResult: prediction }) : json({ error: 'unavailable' }, 503);
  const result = await fetchAllBackendData(payload, { metadata });
  assert.equal(result.status, 'partial');
  assert.equal(result.algorithmAvailable, true);
  assert.equal(result.weatherAvailable, false);
  assert.equal(result.data.monthlyForecasts.length, 9);
  assert.deepEqual(result.data.apiForecast14Days, []);
});

test('algorithm 422 remains unavailable while returned daily weather is preserved', async () => {
  globalThis.fetch = async url => url.endsWith('/simulate-rotation') ? json({ error: 'unsupported location' }, 422) : json(weather);
  const result = await fetchAllBackendData(payload, { metadata });
  assert.equal(result.algorithmAvailable, false);
  assert.deepEqual(result.data.strategies, []);
  assert.equal(result.data.apiForecast14Days[0].rainMm, 0);
  assert.match(result.errors[0], /unsupported location/);
});

test('scenario reuses daily weather only for identical coordinates', async () => {
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return url.endsWith('/simulate-rotation') ? json({ simulationResult: prediction }) : json(weather); };
  const cachedData = { rawWeather: weather, data: buildDashboardData(payload, prediction, weather, metadata) };
  await fetchAllBackendData(payload, { onlySimulation: true, cachedData, metadata });
  assert.equal(calls.length, 1);
  calls.length = 0;
  await fetchAllBackendData({ ...payload, location: { latitude: 37.8746, longitude: 32.4932 } }, { onlySimulation: true, cachedData, metadata });
  assert.equal(calls.length, 2);
});

test('malformed algorithm response and empty catalogue are rejected', async () => {
  globalThis.fetch = async () => json({ simulationResult: { recommendedCrop: 'fake fallback' } });
  const result = await fetchAllBackendData(payload);
  assert.equal(result.status, 'error');
  assert.deepEqual(result.data.strategies, []);
  globalThis.fetch = async () => json({ crops: [], forecastMonths: [] });
  await assert.rejects(fetchCatalog(), /boş/);
});

test('daily dates and null fields never generate extra days or defaults', () => {
  const days = normalizeForecastDays(weather.forecast14Days);
  assert.equal(days.length, 1);
  assert.equal(days[0].date, '2030-01-02');
  assert.equal(days[0].maxTemp, 0);
  assert.equal(days[0].windKmh, null);
  assert.equal(days[0].rainMm, 0);
  assert.equal(formatNumber(null), '—');
  assert.equal(formatNumber(0), '0');
});

test('UI renders actual strategy names without invented income or planting dates', () => {
  const nodes = fakeDocument();
  renderDashboardUI(buildDashboardData(payload, prediction, weather, metadata));
  const all = [...nodes.values()].map(node => node.innerHTML + node.textContent).join(' ');
  assert.match(all, /Buğday/);
  assert.match(all, /POWER/);
  assert.doesNotMatch(all, /NaN|undefined|Net Kazanç|₺|26 Eylül|30 Günlük/);
  assert.match(nodes.get('planting-timeline-box').innerHTML, /tarihi üretmiyor/);
  assert.match(nodes.get('farmer-task-calendar-box').innerHTML, /2030/);
  assert.ok(nodes.get('farmer-task-calendar-box').innerHTML.includes('—'));
});

test('error view clears old cards and weather', () => {
  const nodes = fakeDocument();
  renderDashboardUI(buildDashboardData(payload, null, null, metadata));
  assert.match(nodes.get('rotation-cards-grid').innerHTML, /bağlantı gerekiyor/);
  assert.match(nodes.get('farmer-task-calendar-box').innerHTML, /Günlük hava verisi alınamadı/);
  assert.doesNotMatch([...nodes.values()].map(node => node.innerHTML).join(''), /2030|4\.344|NaN|undefined/);
});

test('server-provided labels are escaped in rendered HTML', () => {
  const nodes = fakeDocument();
  const bad = structuredClone(prediction);
  bad.rotationStrategies[0].cropNames = ['<img src=x onerror=alert(1)>', 'Buğday'];
  renderDashboardUI(buildDashboardData(payload, bad, weather, metadata));
  assert.doesNotMatch(nodes.get('rotation-cards-grid').innerHTML, /<img/);
  assert.match(nodes.get('rotation-cards-grid').innerHTML, /&lt;img/);
  assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
});

test('charts retain nine actual months, null rainfall and uncalibrated differences', async () => {
  fakeDocument();
  globalThis.localStorage = { getItem: () => 'tr' };
  const configs = [];
  globalThis.Chart = class { constructor(_canvas, config) { configs.push(config); } destroy() {} };
  const { renderClimateCharts } = await import('../js/modules/chartManager.js');
  renderClimateCharts(buildDashboardData(payload, prediction, weather, metadata));
  assert.equal(configs[0].data.labels.length, 9);
  assert.match(configs[0].data.labels[0], /2026/);
  assert.match(configs[0].data.labels[2], /2027/);
  assert.ok(configs[0].data.datasets[0].data.every(value => value === null));
  assert.deepEqual(configs[1].data.datasets[0].data, prediction.monthlyForecasts.map(m => m.temperatureDifferenceCUnadjusted));
});
