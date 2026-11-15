import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FarmClock, STAGES, comparisonRequests, modelView, contextKey } from '../js/modules/farmSimulationModel.js';
import { requestFarmPrediction } from '../js/modules/farmSimulationApi.js';
import { API_CONFIG } from '../js/modules/apiClient.js';

const payload = {
  location: { latitude: 39.9334, longitude: 32.8597 }, forecastMonth: '2026-11',
  soil: { type: 'tinli', ph: 'notr', areaDekar: 120 },
  cropAndResources: { targetCrop: 'wheat', irrigation: 'kuru_tarim', budgetLevel: 'orta', machinery: ['traktor'] },
  simOverrides: { rainDeltaPct: 10, temperatureChangeC: 1, irrigationAvailabilityChangePct: 5 }
};
const prediction = JSON.parse(readFileSync(new URL('../../algorithm/NASA data/output/forecast_integration/ankara_predict.json', import.meta.url)));
const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

test('two crops use identical climate and irrigation through the existing request fields', () => {
  const requests = comparisonRequests(payload, ['wheat', 'barley'], {
    rainfallChangePct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20
  });
  assert.deepEqual(requests[0].scenario, { rainfallChangePct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20 });
  assert.deepEqual(requests[0].scenario, requests[1].scenario);
  assert.deepEqual(requests[0].location, requests[1].location);
  assert.deepEqual(requests[0].forecast, { month: '2026-11' });
  assert.deepEqual(requests[0].farmerInputs.currentRotation, ['wheat', 'wheat']);
  assert.deepEqual(requests[1].farmerInputs.currentRotation, ['barley', 'barley']);
  assert.equal(requests[0].farmerInputs.irrigationAvailable, requests[1].farmerInputs.irrigationAvailable);
  assert.deepEqual(Object.keys(requests[0]).sort(), ['climateSummary', 'farmerInputs', 'forecast', 'location', 'scenario']);
});

test('simulation never mutates farmer inputs, machinery or source climate data', () => {
  const inputBefore = JSON.stringify(payload);
  const sourceBefore = JSON.stringify(prediction);
  const requests = comparisonRequests(payload, ['maize', 'sunflower'], { rainfallChangePct: 50, temperatureChangeC: 4, irrigationAvailabilityChangePct: 100 });
  requests[0].farmerInputs.machinery.push('unit-test-only');
  assert.equal(JSON.stringify(payload), inputBefore);
  assert.equal(JSON.stringify(prediction), sourceBefore);
});

test('animation visits all five illustrative stages and stops at the final stage', () => {
  const clock = new FarmClock();
  assert.equal(clock.stage, 0); assert.equal(STAGES.length, 5);
  clock.start();
  for (let stage = 1; stage < 5; stage++) { clock.advance(6); assert.equal(clock.stage, stage); }
  clock.advance(6); assert.equal(clock.progress, 1); assert.equal(clock.running, false);
  clock.advance(100); assert.equal(clock.seconds, 30);
});

test('pause and resume preserve animation time without implying real growing days', () => {
  const clock = new FarmClock(); clock.start(); clock.advance(2); clock.pause(); clock.advance(10);
  assert.equal(clock.seconds, 2);
  clock.start(); clock.advance(1); assert.equal(clock.seconds, 3);
});

test('speed affects animation time only; reset restores paused initial state', () => {
  const clock = new FarmClock(); clock.start(); clock.setSpeed(4); clock.advance(1);
  assert.equal(clock.seconds, 4);
  clock.pause(); clock.setSpeed(8); assert.equal(clock.speed, 4);
  clock.reset(); assert.equal(clock.stage, 0); assert.equal(clock.speed, 1); assert.equal(clock.running, false);
  clock.advance(10); assert.equal(clock.seconds, 0);
});

test('only actual engine indicators are displayed; missing rainfall stays null', () => {
  const result = modelView(prediction);
  assert.equal(result.pressure, prediction.scenarioAnalysis.indicativeScenarioPressureIndex0to100);
  assert.equal(result.suitability, prediction.rotationStrategies[0].indicativeSuitabilityIndex0to100);
  assert.equal(result.forecastPrecipitation, null);
  assert.equal(result.scenarioPrecipitation, null);
  assert.equal(result.forecastTemperature, prediction.forecast.temperatureC);
  assert.ok(Object.values(modelView(null)).every(value => value === null));
  assert.equal(modelView({ forecast: { temperatureC: 0 } }).forecastTemperature, 0);
  assert.equal(modelView({ scenarioAnalysis: { indicativeScenarioPressureIndex0to100: NaN } }).pressure, null);
});

test('comparison client reuses the existing proxy to POST the unchanged algorithm contract', async () => {
  const body = comparisonRequests(payload, ['wheat'], { rainfallChangePct: 0, temperatureChangeC: 0, irrigationAvailabilityChangePct: 0 })[0];
  let received;
  globalThis.fetch = async (url, options) => {
    received = { url, options };
    return new Response(JSON.stringify({ simulationResult: prediction }), { status: 200 });
  };
  const result = await requestFarmPrediction(body, new AbortController().signal);
  assert.equal(received.url, API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SIMULATE_ROTATION);
  assert.equal(received.options.method, 'POST');
  assert.deepEqual(JSON.parse(received.options.body), body);
  assert.deepEqual(result, prediction);
});

test('API failure or insufficient indicators never produce substitute model values', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'algorithm offline' }), { status: 503 });
  await assert.rejects(requestFarmPrediction({}, undefined), /offline/);
  globalThis.fetch = async () => new Response(JSON.stringify({ simulationResult: { forecast: {} } }), { status: 200 });
  await assert.rejects(requestFarmPrediction({}, undefined), /göstergelerini/);
});

test('separate component context is stable during parent scenario rerenders', () => {
  const data = { payload, metadata: { crops: [{ id: 'wheat' }, { id: 'barley' }] } };
  const before = contextKey(data);
  const changed = structuredClone(data); changed.payload.simOverrides.rainDeltaPct = -100;
  assert.equal(contextKey(changed), before);
  changed.payload.location.latitude = 37.8746;
  assert.notEqual(contextKey(changed), before);
});
