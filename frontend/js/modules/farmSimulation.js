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
    this.root.innerHTML = `<div class="farm-heading"><div><span class="farm-eyebrow">SANAL TARLA</span><h3>Tarım Simülasyonu</h3>
      <p>İki ürünü aynı koşullarda deneyin. Bu alandaki seçimler formunuzu veya NASA kayıtlarını değiştirmez.</p></div><span class="farm-label">Temsili animasyon</span></div>
      <div class="farm-layout"><div class="farm-playground">
        <canvas id="farm-field" role="img" aria-label="Seçilen ürünün temsili gelişim animasyonu"></canvas>
        <div class="farm-stage-heading"><strong id="farm-stage"></strong><span id="farm-elapsed"></span></div>
        <ol class="farm-stages">${STAGES.map((label, index) => `<li data-farm-stage="${index}">${index + 1}. ${esc(label)}</li>`).join('')}</ol>
        <div class="farm-playback"><button id="farm-start" type="button">▶ Başlat</button><button id="farm-pause" type="button">Ⅱ Duraklat</button>
          <button id="farm-reset" type="button">↺ Sıfırla</button><label>Hız <select id="farm-speed" aria-label="Animasyon hızı"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
          <span id="farm-clock-status" role="status"></span></div>
        <p class="farm-note">Süre, sanal animasyon saniyesidir. Aşamalar ve büyüme hızı gerçek fenoloji veya hasat tarihi tahmini değildir.</p>
      </div><div class="farm-controls">
        <label>Senaryo A · mevcut ürün<select id="farm-crop-a">${options(this.crops[0])}</select></label>
        <label>Senaryo B · alternatif ürün<select id="farm-crop-b">${options(this.crops[1])}</select></label>
        ${[
          ['rainfallChangePct', 'Yağış değişimi', '%', -100, 100, 5],
          ['temperatureChangeC', 'Sıcaklık değişimi', '°C', -10, 15, .5],
          ['irrigationAvailabilityChangePct', 'Sulama erişimi değişimi', '%', -100, 100, 5]
        ].map(([key, label, unit, min, max, step]) => `<label>${label}<output id="farm-value-${key}">0 ${unit}</output>
          <input id="farm-${key}" data-farm-condition="${key}" data-unit="${unit}" type="range" min="${min}" max="${max}" step="${step}" value="0"></label>`).join('')}
        <p class="farm-note">Sulama kontrolü mevcut motorun göreli erişim girdisidir; litre veya mm sulama miktarı hesaplanmaz.</p>
        <div id="farm-api-status" role="status" aria-live="polite"></div>
      </div></div>
      <div class="farm-comparison" id="farm-comparison" aria-label="Aynı koşullarda ürün karşılaştırması"></div>
      <div class="farm-evidence"><section><h4>NASA başlangıç koşulları</h4><div id="farm-baseline"></div></section>
        <section><h4>Senaryo katmanı · seçili ürün</h4><div id="farm-scenario"></div></section></div>
      <p class="farm-visual-explanation" id="farm-visual-explanation"></p>
      <details class="farm-limitations"><summary>Model ve görsel sınırları</summary>
        <p>Motor genel bir varsayımsal senaryo baskısı ve sezgisel uygunluk indeksi üretir. Ayrı su stresi, sıcaklık stresi, biyolojik büyüme hızı, kesin hasat miktarı veya ölüm olasılığı üretmez.</p>
        <p>Renk ve eğim genel baskı indeksinin temsilidir; sağlıklı büyüme, yavaşlama, solma veya kuruma teşhisi değildir. Yağış ve sulama efektleri kullanıcı varsayımlarını gösterir. Ürünler aynı baskı indeksini alabilir; bu biyolojik eşdeğerlik anlamına gelmez.</p>
        <p>Eksik NASA yağış tahmini geçmiş ortalamayla tamamlanmaz. Tüm büyüme aşamaları görsel anlatım içindir.</p>
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
    this.get('api-status').textContent = 'İki senaryo karar motorunda değerlendiriliyor…';
    this.updateEvidence();
    this.debounce = setTimeout(async () => {
      const controller = new AbortController(); this.controller = controller;
      this.timeout = setTimeout(() => controller.abort(), 45000);
      const requests = comparisonRequests(this.payload, this.crops, this.conditions);
      const responses = await Promise.allSettled(requests.map(request => requestFarmPrediction(request, controller.signal)));
      if (revision !== this.revision) return;
      clearTimeout(this.timeout);
      this.results = responses.map(response => response.status === 'fulfilled' ? response.value : null);
      this.errors = responses.map(response => response.status === 'rejected' ? response.reason?.message || 'Yanıt alınamadı' : null);
      const count = this.results.filter(Boolean).length;
      this.root.dataset.evaluationState = count === 2 ? 'ready' : count ? 'partial' : 'error';
      this.get('api-status').textContent = count === 2 ? 'A ve B aynı iklim ve sulama girdileriyle değerlendirildi.'
        : 'Model yanıtı eksik. Animasyon bu durumda yalnızca ürün ve aşama görselidir; örnek model sonucu kullanılmaz.';
      this.updateEvidence(); this.paint();
    }, wait);
  }
  updateEvidence() {
    const view = modelView(this.results[this.active]);
    const baseline = this.results[this.active]?.forecast || this.baseline?.forecast;
    const history = this.results[this.active]?.historicalClimate || this.baseline?.historicalClimate;
    const definition = (label, value) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
    this.get('baseline').innerHTML = `<dl>${[
      ['Geçerli ay', formatMonth(baseline?.validMonth)],
      ['Sıcaklık tahmini', `${num(baseline?.temperatureC)} °C`],
      ['Yağış tahmini', baseline?.monthlyPrecipitationMm == null ? 'Tahmin yok' : `${num(baseline.monthlyPrecipitationMm)} mm`],
      ['WET3 toprak nemi', num(baseline?.soilWetnessWet3Index, 4)],
      ['Geçmiş yağış · ayrı referans', `${num(history?.monthlyMeanPrecipitationMm)} mm (${history?.referencePeriod || '—'})`]
    ].map(([label, value]) => definition(label, value)).join('')}</dl>`;
    this.get('scenario').innerHTML = `<dl>${[
      ['Görseldeki ürün', this.name(this.crops[this.active])],
      ['Yağış değişimi', `${this.conditions.rainfallChangePct}%`],
      ['Sıcaklık değişimi', `${this.conditions.temperatureChangeC} °C`],
      ['Sulama erişimi değişimi', `${this.conditions.irrigationAvailabilityChangePct}%`],
      ['Formdaki sulama', this.payload.cropAndResources.irrigation === 'kuru_tarim' ? 'Sulama yok' : 'Sulama var'],
      ['Motorun senaryo sıcaklığı', `${num(view.scenarioTemperature)} °C`],
      ['Motorun senaryo yağışı', view.scenarioPrecipitation === null ? 'Hesaplanamadı; tahmin yok veya yanıt bekleniyor' : `${num(view.scenarioPrecipitation)} mm`]
    ].map(([label, value]) => definition(label, value)).join('')}</dl>`;
    this.get('comparison').innerHTML = this.crops.map((crop, index) => {
      const result = modelView(this.results[index]);
      return `<button type="button" data-farm-view="${index}" aria-pressed="${this.active === index}">
        <span>Senaryo ${index === 0 ? 'A' : 'B'}</span><strong>${esc(this.name(crop))}</strong>
        <span>Genel senaryo baskısı: <b>${num(result.pressure)}/100</b></span>
        <span>Sezgisel uygunluk: <b>${num(result.suitability)}/100</b></span>
        <small>${this.errors[index] ? esc(this.errors[index]) : 'Kalibre risk veya verim olasılığı değildir.'}</small></button>`;
    }).join('');
    this.get('comparison').querySelectorAll('[data-farm-view]').forEach(button => button.addEventListener('click', () => {
      this.active = Number(button.dataset.farmView); this.updateEvidence(); this.paint();
    }));
    this.get('visual-explanation').textContent = view.pressure === null
      ? 'Model sonucu bekleniyor veya alınamadı. Ürün silüeti ve sanal aşamalar gösteriliyor; bitki sağlığı sonucu üretilmiyor.'
      : `Yaprak rengi ve eğimi motorun ${num(view.pressure)}/100 genel senaryo baskısını temsil eder. Bu bir su/sıcaklık stresi veya solma teşhisi değildir. İlerleme yalnızca animasyon zamanına bağlıdır.`;
  }
  updateClock() {
    this.get('stage').textContent = STAGES[this.clock.stage];
    this.get('elapsed').textContent = `${num(this.clock.seconds)} sanal saniye`;
    this.get('clock-status').textContent = this.clock.running ? 'Çalışıyor' : this.clock.progress === 1 ? 'Animasyon tamamlandı' : 'Duraklatıldı';
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
    this.get('field').setAttribute('aria-label', `${this.name(crop)} · ${STAGES[this.clock.stage]} · temsili animasyon`);
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
