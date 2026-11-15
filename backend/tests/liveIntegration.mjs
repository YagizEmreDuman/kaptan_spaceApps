// Optional smoke check against running REAL Python and Node services.
// Run from repository root: node backend/tests/liveIntegration.mjs
import assert from 'node:assert/strict';
const baseURL = process.env.CROPGUARD_TEST_BASE_URL || 'http://localhost:3000';
globalThis.CROPGUARD_API_BASE_URL = baseURL + '/api';
const { fetchAllBackendData, fetchCatalog } = await import('../../frontend/js/modules/apiClient.js');

const metadata = await fetchCatalog();
assert.equal(metadata.crops.length, 6);
assert.equal(metadata.forecastMonths.length, 9);
console.log('Live catalog:', metadata.crops.map(crop => crop.name).join(', '));
for (const [city, lat, lon] of [['Ankara', 39.9334, 32.8597], ['Konya', 37.8746, 32.4932]]) {
  const payload = {
    location: { latitude: lat, longitude: lon, label: city }, forecastMonth: '2026-11',
    soil: { type: 'tinli', ph: 'notr', areaDekar: 120 },
    cropAndResources: { targetCrop: 'wheat', irrigation: 'kuru_tarim', budgetLevel: 'orta', machinery: [] },
    simOverrides: {}
  };
  const result = await fetchAllBackendData(payload, { metadata });
  assert.equal(result.algorithmAvailable, true, result.errors.join('; '));
  assert.equal(result.data.monthlyForecasts.length, 9);
  assert.equal(result.data.strategies.length, 3);
  assert.ok(result.data.monthlyForecasts.every(month => month.precipitationMm === null));
  assert.deepEqual(result.data.strategies.map(strategy => strategy.score), [35, 54, 54]);
  const changed = await fetchAllBackendData({ ...payload, forecastMonth: '2027-01',
    simOverrides: { rainDeltaPct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20 }
  }, { metadata, cachedData: result, onlySimulation: true });
  assert.equal(changed.data.prediction.forecast.validMonth, '2027-01');
  assert.deepEqual(changed.data.strategies.map(strategy => strategy.score), [32, 51, 51]);
  assert.equal(changed.data.prediction.scenarioAnalysis.projectedMonthlyPrecipitationMm, null);
  console.log(city, JSON.stringify({ temperatureC: result.data.monthlyForecasts[0].temperatureC,
    forecastMonths: result.data.monthlyForecasts.length, weatherAvailable: result.weatherAvailable,
    dailyWeatherDays: result.data.apiForecast14Days.length, scenarioScores: changed.data.strategies.map(s => s.score) }));
}
const page = await fetch(baseURL + '/');
assert.equal(page.status, 200);
assert.match(await page.text(), /id="data-setup-status"/);
console.log('Live frontend → Node → Python integration passed.');
