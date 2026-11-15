import { escapeHtml as esc, formatNumber as num, formatMonth } from './displayUtils.js';
import { FarmClock, STAGES, comparisonRequests, modelView, contextKey } from './farmSimulationModel.js';
import { requestFarmPrediction } from './farmSimulationApi.js';
import { FarmFieldRenderer } from './farmFieldRenderer.js';

let instance = null;
const zeroConditions = () => ({ rainfallChangePct: 0, temperatureChangeC: 0, irrigationAvailabilityChangePct: 0 });

export function syncFarmSimulationContext(data) {
  const root = document.getElementById('farm-simulation-root');
  if (!root || !data.metadata?.crops?.length) return;
  const key = contextKey(data);
  if (instance?.key === key) { instance.baseline = structuredClone(data.prediction); instance.updateEvidence(); return; }
  instance?.destroy();
  instance = new FarmSimulation(root, data, key);
}

export function pauseFarmSimulation() { instance?.pause(); }

class FarmSimulation {
  constructor(root, data, key) {
    this.root = root; this.key = key;
    this.payload = structuredClone(data.payload);
    this.baseline = structuredClone(data.prediction);
    this.catalog = structuredClone(data.metadata.crops);
    this.initialCrop = this.catalog.some(crop => crop.id === this.payload.cropAndResources.targetCrop)
      ? this.payload.cropAndResources.targetCrop : this.catalog[0].id;
    this.initialAlternative = this.catalog.find(crop => crop.id !== this.initialCrop)?.id || this.initialCrop;
    this.crops = [this.initialCrop, this.initialAlternative];
    this.conditions = zeroConditions(); this.active = 0; this.results = [null, null];
    this.clock = new FarmClock(); this.revision = 0; this.visible = false;
    this.render();
    this.renderer = new FarmFieldRenderer(this.get('field'));
    this.resizeObserver = new ResizeObserver(() => this.paint());
    this.resizeObserver.observe(this.get('field'));
    this.visibilityObserver = new IntersectionObserver(entries => {
      this.visible = entries[0].isIntersecting;
      if (!this.visible) this.pause();
      this.paint();
    });
    this.visibilityObserver.observe(root);
    this.onDocumentVisibility = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', this.onDocumentVisibility);
    this.queueEvaluation(0);
    this.updateClock(); this.paint();
  }
  get(id) { return this.root.querySelector(`#farm-${id}`); }
  name(id) { return this.catalog.find(crop => crop.id === id)?.name || id; }
  render() {
    const options = selected => this.catalog.map(crop => `<option value="${esc(crop.id)}" ${crop.id === selected ? 'selected' : ''}>${esc(crop.name)}</option>`).join('');
    this.root.innerHTML = `<div class="farm-heading"><div><span class="farm-eyebrow">VIRTUAL FIELD</span><h3>Farm Simulation</h3>
      <p>Test two crops under identical conditions. Selections here do not alter your main form or NASA records.</p></div><span class="farm-label">Illustrative animation</span></div>
      <div class="farm-layout"><div class="farm-playground">
        <canvas id="farm-field" role="img" aria-label="Illustrative growth animation of the selected crop"></canvas>
        <div class="farm-stage-heading"><strong id="farm-stage"></strong><span id="farm-elapsed"></span></div>
        <ol class="farm-stages">${STAGES.map((label, index) => `<li data-farm-stage="${index}">${index + 1}. ${esc(label)}</li>`).join('')}</ol>
        <div class="farm-playback"><button id="farm-start" type="button">▶ Start</button><button id="farm-pause" type="button">Ⅱ Pause</button>
          <button id="farm-reset" type="button">↺ Reset</button><label>Speed <select id="farm-speed" aria-label="Animation speed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
          <span id="farm-clock-status" role="status"></span></div>
        <p class="farm-note">Duration is virtual animation seconds. Stages and growth speed are not actual phenology or harvest date predictions.</p>
      </div><div class="farm-controls">
        <label>Scenario A · current crop<select id="farm-crop-a">${options(this.crops[0])}</select></label>
        <label>Scenario B · alternative crop<select id="farm-crop-b">${options(this.crops[1])}</select></label>
        ${[
          ['rainfallChangePct', 'Precipitation change', '%', -100, 100, 5],
          ['temperatureChangeC', 'Temperature change', '°C', -10, 15, .5],
          ['irrigationAvailabilityChangePct', 'Irrigation access change', '%', -100, 100, 5]
        ].map(([key, label, unit, min, max, step]) => `<label>${label}<output id="farm-value-${key}">0 ${unit}</output>
          <input id="farm-${key}" data-farm-condition="${key}" data-unit="${unit}" type="range" min="${min}" max="${max}" step="${step}" value="0"></label>`).join('')}
        <p class="farm-note">Irrigation control is a relative access input to the engine; liters or mm of irrigation volume are not calculated.</p>
        <div id="farm-api-status" role="status" aria-live="polite"></div>
      </div></div>
      <div class="farm-comparison" id="farm-comparison" aria-label="Crop comparison under identical conditions"></div>
      <div class="farm-evidence"><section><h4>NASA baseline conditions</h4><div id="farm-baseline"></div></section>
        <section><h4>Scenario layer · selected crop</h4><div id="farm-scenario"></div></section></div>
      <p class="farm-visual-explanation" id="farm-visual-explanation"></p>
      <details class="farm-limitations"><summary>Model and visual limitations</summary>
        <p>The engine produces a general hypothetical scenario pressure and heuristic suitability index. It does not produce separate water stress, heat stress, biological growth rate, exact harvest volume, or mortality probability.</p>
        <p>Color and tilt represent the overall pressure index; they are not diagnoses of healthy growth, slowdown, wilting, or desiccation. Rainfall and irrigation effects show user assumptions. Crops may receive the same pressure index; this does not imply biological equivalence.</p>
        <p>Missing NASA precipitation forecasts are not filled with historical averages. All growth stages are for visual illustration.</p>
      </details>`;
    this.get('crop-a').addEventListener('change', event => this.changeCrop(0, event.target.value));
    this.get('crop-b').addEventListener('change', event => this.changeCrop(1, event.target.value));
    this.root.querySelectorAll('[data-farm-condition]').forEach(input => input.addEventListener('input', () => {
      this.conditions[input.dataset.farmCondition] = Number(input.value);
      this.get(`value-${input.dataset.farmCondition}`).textContent = `${input.value} ${input.dataset.unit}`;
      this.queueEvaluation(); this.paint();
    }));
    this.get('start').addEventListener('click', () => { this.clock.start(); this.lastFrame = null; this.animate(); this.updateClock(); });
    this.get('pause').addEventListener('click', () => this.pause());
    this.get('reset').addEventListener('click', () => this.reset());
    this.get('speed').addEventListener('change', event => { this.clock.setSpeed(Number(event.target.value)); this.updateClock(); });
  }
  changeCrop(index, crop) {
    this.crops[index] = crop; this.active = index;
    this.queueEvaluation(); this.paint();
  }
  queueEvaluation(wait = 250) {
    clearTimeout(this.debounce); clearTimeout(this.timeout);
    this.controller?.abort();
    const revision = ++this.revision;
    this.results = [null, null]; this.errors = [];
    this.root.dataset.evaluationState = 'pending';
    this.get('api-status').textContent = 'Evaluating both scenarios in the decision engine…';
    this.updateEvidence();
    this.debounce = setTimeout(async () => {
      const controller = new AbortController(); this.controller = controller;
      this.timeout = setTimeout(() => controller.abort(), 45000);
      const requests = comparisonRequests(this.payload, this.crops, this.conditions);
      const responses = await Promise.allSettled(requests.map(request => requestFarmPrediction(request, controller.signal)));
      if (revision !== this.revision) return;
      clearTimeout(this.timeout);
      this.results = responses.map(response => response.status === 'fulfilled' ? response.value : null);
      this.errors = responses.map(response => response.status === 'rejected' ? response.reason?.message || 'No response received' : null);
      const count = this.results.filter(Boolean).length;
      this.root.dataset.evaluationState = count === 2 ? 'ready' : count ? 'partial' : 'error';
      this.get('api-status').textContent = count === 2 ? 'A and B were evaluated with identical climate and irrigation inputs.'
        : 'Model response incomplete. Animation shows only crop and stage visuals; no sample model output is used.';
      this.updateEvidence(); this.paint();
    }, wait);
  }
  updateEvidence() {
    const view = modelView(this.results[this.active]);
    const baseline = this.results[this.active]?.forecast || this.baseline?.forecast;
    const history = this.results[this.active]?.historicalClimate || this.baseline?.historicalClimate;
    const definition = (label, value) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
    this.get('baseline').innerHTML = `<dl>${[
      ['Valid month', formatMonth(baseline?.validMonth)],
      ['Temperature forecast', `${num(baseline?.temperatureC)} °C`],
      ['Precipitation forecast', baseline?.monthlyPrecipitationMm == null ? 'No forecast' : `${num(baseline.monthlyPrecipitationMm)} mm`],
      ['WET3 soil moisture', num(baseline?.soilWetnessWet3Index, 4)],
      ['Historical precipitation · separate baseline', `${num(history?.monthlyMeanPrecipitationMm)} mm (${history?.referencePeriod || '—'})`]
    ].map(([label, value]) => definition(label, value)).join('')}</dl>`;
    this.get('scenario').innerHTML = `<dl>${[
      ['Displayed crop', this.name(this.crops[this.active])],
      ['Precipitation change', `${this.conditions.rainfallChangePct}%`],
      ['Temperature change', `${this.conditions.temperatureChangeC} °C`],
      ['Irrigation access change', `${this.conditions.irrigationAvailabilityChangePct}%`],
      ['Form irrigation', this.payload.cropAndResources.irrigation === 'kuru_tarim' ? 'No irrigation' : 'Irrigated'],
      ['Engine scenario temperature', `${num(view.scenarioTemperature)} °C`],
      ['Engine scenario precipitation', view.scenarioPrecipitation === null ? 'Not calculated; no forecast or awaiting response' : `${num(view.scenarioPrecipitation)} mm`]
    ].map(([label, value]) => definition(label, value)).join('')}</dl>`;
    this.get('comparison').innerHTML = this.crops.map((crop, index) => {
      const result = modelView(this.results[index]);
      return `<button type="button" data-farm-view="${index}" aria-pressed="${this.active === index}">
        <span>Scenario ${index === 0 ? 'A' : 'B'}</span><strong>${esc(this.name(crop))}</strong>
        <span>Overall scenario pressure: <b>${num(result.pressure)}/100</b></span>
        <span>Heuristic suitability: <b>${num(result.suitability)}/100</b></span>
        <small>${this.errors[index] ? esc(this.errors[index]) : 'Not a calibrated risk or yield probability.'}</small></button>`;
    }).join('');
    this.get('comparison').querySelectorAll('[data-farm-view]').forEach(button => button.addEventListener('click', () => {
      this.active = Number(button.dataset.farmView); this.updateEvidence(); this.paint();
    }));
    this.get('visual-explanation').textContent = view.pressure === null
      ? 'Awaiting model result or unavailable. Crop silhouette and virtual stages are shown; no plant health output is generated.'
      : `Leaf color and tilt represent the engine's ${num(view.pressure)}/100 overall scenario pressure. This is not a water/heat stress or wilting diagnosis. Progression depends solely on animation time.`;
  }
  updateClock() {
    this.get('stage').textContent = STAGES[this.clock.stage];
    this.get('elapsed').textContent = `${num(this.clock.seconds)} virtual seconds`;
    this.get('clock-status').textContent = this.clock.running ? 'Running' : this.clock.progress === 1 ? 'Animation complete' : 'Paused';
    this.get('start').disabled = this.clock.running || this.clock.progress === 1;
    this.get('pause').disabled = !this.clock.running;
    this.root.querySelectorAll('[data-farm-stage]').forEach(item => {
      item.classList.toggle('farm-stage-active', Number(item.dataset.farmStage) === this.clock.stage);
    });
    this.get('field').dataset.stage = String(this.clock.stage);
    this.get('field').dataset.progress = String(this.clock.progress);
  }
  paint() {
    if (!this.renderer) return;
    const crop = this.crops[this.active];
    this.get('field').dataset.cropId = crop;
    this.get('field').setAttribute('aria-label', `${this.name(crop)} · ${STAGES[this.clock.stage]} · illustrative animation`);
    this.renderer.draw({ crop, name: this.name(crop), progress: this.clock.progress,
      pressure: modelView(this.results[this.active]).pressure, conditions: this.conditions, seconds: this.clock.seconds });
  }
  animate() {
    cancelAnimationFrame(this.frame);
    if (!this.clock.running || !this.visible || document.hidden) { this.pause(); return; }
    this.frame = requestAnimationFrame(time => {
      if (this.lastFrame !== null) this.clock.advance(Math.min((time - this.lastFrame) / 1000, .25));
      this.lastFrame = time; this.updateClock(); this.paint();
      if (this.clock.running) this.animate();
    });
  }
  pause() { this.clock.pause(); cancelAnimationFrame(this.frame); this.lastFrame = null; this.updateClock(); }
  reset() {
    this.pause(); this.clock.reset(); this.conditions = zeroConditions();
    this.crops = [this.initialCrop, this.initialAlternative]; this.active = 0;
    this.get('crop-a').value = this.crops[0]; this.get('crop-b').value = this.crops[1]; this.get('speed').value = '1';
    this.root.querySelectorAll('[data-farm-condition]').forEach(input => {
      input.value = '0'; this.get(`value-${input.dataset.farmCondition}`).textContent = `0 ${input.dataset.unit}`;
    });
    this.queueEvaluation(0); this.updateClock(); this.paint();
  }
  destroy() {
    this.pause(); this.revision++; clearTimeout(this.debounce); clearTimeout(this.timeout); this.controller?.abort();
    this.resizeObserver.disconnect(); this.visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onDocumentVisibility);
  }
}
