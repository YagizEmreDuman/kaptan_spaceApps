// Real-browser checks limited to the added farm simulation and its existing API.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const origin = process.env.CROPGUARD_TEST_BASE_URL || 'http://localhost:3000';
const executable = process.env.CROPGUARD_TEST_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cropguard-farm-browser-'));
const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0',
  `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
const passed = [];
try {
  let diagnostics = '';
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Browser startup timeout')), 20000);
    browser.on('error', error => { clearTimeout(timer); reject(error); });
    browser.stderr.on('data', bytes => {
      diagnostics += bytes;
      const match = diagnostics.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    browser.on('exit', code => { clearTimeout(timer); reject(new Error(`Browser exited ${code}: ${diagnostics}`)); });
  });
  socket = new WebSocket(endpoint); await once(socket, 'open');
  let sequence = 0;
  const pending = new Map(), requests = [], exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const command = (method, params) => send(method, params, sessionId);
  await command('Page.enable'); await command('Runtime.enable'); await command('Network.enable');
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async (expression, label) => {
    const deadline = Date.now() + 65000;
    while (Date.now() < deadline) { if (await evaluate(expression)) return; await delay(100); }
    throw new Error(`Timed out: ${label}; exceptions: ${JSON.stringify(exceptions)}`);
  };
  const farmReady = () => wait('document.getElementById("farm-simulation-root")?.dataset.evaluationState === "ready"', 'model response A/B');
  const change = (id, value, event = 'change') => evaluate(`document.getElementById(${JSON.stringify(id)}).value=${JSON.stringify(value)};
    document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));`);
  const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
  const modelRequests = () => requests.filter(request => request.url.endsWith('/api/simulate-rotation') && request.postData);
  const progress = () => evaluate('Number(document.getElementById("farm-field").dataset.progress)');
  const canvasHash = async () => createHash('sha256').update(await evaluate('document.getElementById("farm-field").toDataURL()')).digest('hex');
  const artifactDirectory = fileURLToPath(new URL('./artifacts/', import.meta.url));
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const screenshot = async name => {
    const clip = await evaluate(`(()=>{const r=document.getElementById('farm-simulation-root').getBoundingClientRect();return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`);
    const image = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    fs.writeFileSync(path.join(artifactDirectory, name), Buffer.from(image.data, 'base64'));
  };
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await command('Page.navigate', { url: origin });
  await wait('document.getElementById("analyze-btn")?.disabled === false', 'existing catalogue');
  await change('target-crop', 'wheat'); await change('forecast-month', '2026-11');
  await evaluate(`document.getElementById('lat-input').value='39.9334';document.getElementById('lng-input').value='32.8597';
    document.getElementById('advisor-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));`);
  await wait('document.getElementById("farm-crop-a") && !document.getElementById("climate-panel").classList.contains("hidden")', 'existing analysis');
  await evaluate('document.querySelector("[data-tab=tab-farm-simulation]").click();document.getElementById("farm-field").scrollIntoView({block:"center"})');
  await farmReady(); await delay(250);
  const mainSnapshot = await evaluate(`JSON.stringify(['target-crop','forecast-month','irrigation','soil-ph','field-area','lat-input','lng-input'].map(id=>[id,document.getElementById(id).value]))`);
  const headline = await evaluate('document.getElementById("decision-hero-sentence").textContent');
  assert.equal(await evaluate('document.getElementById("farm-crop-a").options.length'), 6);
  assert.equal(await evaluate('document.getElementById("farm-field").dataset.cropId'), 'wheat');
  passed.push('1. New simulation opens with the live project catalogue');
  passed.push('2. Wheat artwork is selected');

  await click('farm-start'); await delay(450); await click('farm-pause');
  const regular = await progress(); assert.ok(regular > 0);
  await delay(300); assert.equal(await progress(), regular);
  await change('farm-speed', '4'); await click('farm-start'); await delay(450); await click('farm-pause');
  assert.ok((await progress()) - regular > regular * 1.5);
  await click('farm-reset'); await farmReady(); assert.equal(await progress(), 0);
  await change('farm-speed', '4'); await click('farm-start');
  await wait('Number(document.getElementById("farm-field").dataset.stage) >= 3', 'advanced plant artwork');
  await click('farm-pause');
  const hashes = new Set([await canvasHash()]);
  for (const crop of ['barley', 'chickpea', 'lentil', 'sunflower', 'maize']) {
    await change('farm-crop-b', crop); await farmReady();
    assert.equal(await evaluate('document.getElementById("farm-field").dataset.cropId'), crop);
    hashes.add(await canvasHash());
  }
  assert.equal(hashes.size, 6);
  passed.push('3. All six catalogue crops produce distinct live canvas artwork');

  for (const [id, value, key, label] of [
    ['farm-rainfallChangePct', '-40', 'rainfallChangePct', '4. Rainfall scenario updates'],
    ['farm-temperatureChangeC', '4', 'temperatureChangeC', '5. Temperature scenario updates'],
    ['farm-irrigationAvailabilityChangePct', '50', 'irrigationAvailabilityChangePct', '6. Irrigation scenario updates']
  ]) {
    const count = modelRequests().length;
    const before = await canvasHash();
    await change(id, value, 'input');
    assert.notEqual(await canvasHash(), before);
    await farmReady();
    const pair = modelRequests().slice(count).slice(-2).map(request => JSON.parse(request.postData));
    assert.equal(pair.length, 2); assert.equal(pair[0].scenario[key], Number(value));
    assert.deepEqual(pair[0].scenario, pair[1].scenario);
    const model = await (await fetch(origin + '/api/simulate-rotation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pair[0]) })).json();
    const actualPressure = model.simulationResult.scenarioAnalysis.indicativeScenarioPressureIndex0to100;
    assert.ok((await evaluate('document.getElementById("farm-comparison").textContent')).includes(String(actualPressure)));
    passed.push(label);
  }
  await click('farm-start');
  await wait('document.getElementById("farm-field").dataset.stage === "4"', 'fifth illustrative stage');
  await click('farm-pause');
  passed.push('7. Start, pause, reset, 4x speed and growth stages work');

  const requestCount = modelRequests().length;
  await evaluate('document.querySelector(\'[data-farm-view="0"]\').click()');
  assert.equal(await evaluate('document.getElementById("farm-field").dataset.cropId'), 'wheat');
  await evaluate('document.querySelector(\'[data-farm-view="1"]\').click()');
  assert.equal(await evaluate('document.getElementById("farm-field").dataset.cropId'), 'maize');
  assert.equal(modelRequests().length, requestCount);
  assert.equal(await evaluate(`JSON.stringify(['target-crop','forecast-month','irrigation','soil-ph','field-area','lat-input','lng-input'].map(id=>[id,document.getElementById(id).value]))`), mainSnapshot);
  assert.equal(await evaluate('document.getElementById("decision-hero-sentence").textContent'), headline);
  const original = JSON.parse(modelRequests()[0].postData);
  const direct = await (await fetch('http://127.0.0.1:5000/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(original) })).json();
  assert.equal(direct.monthlyForecasts.length, 9);
  passed.push('8. Existing POST :5000/predict and main farmer inputs remain intact');
  passed.push('9. A/B switching preserves identical conditions and simulation time');
  await screenshot('farm-simulation-desktop.png');

  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('document.getElementById("farm-simulation-root").scrollIntoView({block:"start"})'); await delay(200);
  assert.ok(await evaluate('document.getElementById("farm-simulation-root").scrollWidth <= document.getElementById("farm-simulation-root").clientWidth + 1'));
  assert.ok(await evaluate('document.getElementById("farm-field").getBoundingClientRect().width < 390'));
  await screenshot('farm-simulation-mobile.png');
  passed.push('10. Mobile layout fits a 390px viewport');

  await command('Network.setBlockedURLs', { urls: ['*api/simulate-rotation*'] });
  await change('farm-temperatureChangeC', '5', 'input');
  await wait('document.getElementById("farm-simulation-root").dataset.evaluationState === "error"', 'explicit API failure');
  assert.match(await evaluate('document.getElementById("farm-comparison").textContent'), /—/);
  await command('Network.setBlockedURLs', { urls: [] });
  await click('farm-reset'); await farmReady();
  assert.equal(await progress(), 0);
  assert.equal(await evaluate('document.getElementById("farm-speed").value'), '1');
  assert.equal(await evaluate('document.getElementById("farm-crop-b").value'), 'barley');
  assert.deepEqual(exceptions, []);
  console.log(JSON.stringify({ passed, apiFailureHandled: true, javascriptErrors: 0, artifacts: artifactDirectory }, null, 2));
} finally {
  socket?.close(); browser.kill();
}
