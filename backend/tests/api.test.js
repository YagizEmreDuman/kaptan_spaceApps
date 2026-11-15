const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = require('../server');
const algorithm = require('../services/algorithmService');
const weather = require('../services/weatherService');
const prediction = JSON.parse(fs.readFileSync(path.join(__dirname, '../../algorithm/NASA data/output/forecast_integration/ankara_predict.json'), 'utf8'));
let server, base;
before(async () => {
  server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('proxy forwards exact algorithm contract and all monthly/rotation results', async () => {
  let received;
  algorithm.predict = async payload => { received = payload; return prediction; };
  weather.getForecastAndTasks = async () => { throw new Error('rotation must not depend on daily weather'); };
  const body = { location: { latitude: 39.9334, longitude: 32.8597 }, forecast: { month: '2027-01' },
    farmerInputs: { currentRotation: ['maize', 'maize'], irrigationAvailable: false },
    scenario: { rainfallChangePct: -30, temperatureChangeC: 2, irrigationAvailabilityChangePct: -20 } };
  const response = await post('/api/simulate-rotation', body);
  assert.equal(response.status, 200);
  assert.deepEqual(received, { ...body, climateSummary: {} });
  const data = await response.json();
  assert.deepEqual(data.simulationResult, prediction);
  assert.equal(data.simulationResult.monthlyForecasts.length, 9);
});

test('algorithm unavailable returns 503 with no substitute decision engine', async () => {
  algorithm.predict = async () => { throw new Error('ECONNREFUSED'); };
  const response = await post('/api/simulate-rotation', { lat: 39.9, lng: 32.8 });
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.equal(data.simulationResult, undefined);
  assert.ok(data.error);
});

test('upstream unsupported-location errors retain 422 and message', async () => {
  algorithm.predict = async () => { throw { response: { status: 422, data: { detail: 'Unsupported location' } } }; };
  const response = await post('/api/simulate-rotation', { lat: 0, lng: 0 });
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, 'Unsupported location');
  assert.equal((await post('/api/simulate-rotation', { lat: '39', lng: 32 })).status, 400);
});

test('catalogue comes from algorithm and outages do not use fixed crop choices', async () => {
  const catalog = { crops: [{ id: 'lentil', name: 'Mercimek' }], forecastMonths: ['2026-11'] };
  algorithm.catalog = async () => catalog;
  assert.deepEqual(await (await fetch(base + '/api/catalog')).json(), catalog);
  algorithm.catalog = async () => { throw new Error('offline'); };
  assert.equal((await fetch(base + '/api/catalog')).status, 503);
});

test('daily weather fields and missing values pass through unchanged', async () => {
  const days = [{ date: '2030-01-02', maxTemp: 0, minTemp: null, rainMm: 0, windKmh: null }];
  weather.getForecastAndTasks = async () => ({ source: 'test only', forecast14Days: days, farmerTaskCalendar: [] });
  const response = await post('/api/weather-tasks', { lat: 39.9, lng: 32.8 });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).forecast14Days, days);
  weather.getForecastAndTasks = async () => { throw new Error('offline'); };
  assert.equal((await post('/api/weather-tasks', { lat: 39.9, lng: 32.8 })).status, 503);
});

test('backend serves the frontend and its module files', async () => {
  const response = await fetch(base + '/');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /id="data-setup-status"/);
  assert.equal((await fetch(base + '/js/main.js')).status, 200);
  assert.match(await (await fetch(base + '/api/config.js')).text(), /location.origin/);
});
