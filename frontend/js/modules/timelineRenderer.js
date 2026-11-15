import { escapeHtml as esc, formatNumber as num } from './displayUtils.js';
import { getLocalizedMonths } from './i18nManager.js';

const isBrowser = typeof globalThis.window !== 'undefined';

function findMonthForecast(monthlyForecasts, yyyyMm) {
  if (!Array.isArray(monthlyForecasts)) return null;
  return monthlyForecasts.find(m => m.month === yyyyMm) || null;
}

export function renderPlantingTimeline(sim, selectedStrategyId) {
  const box = document.getElementById('planting-timeline-box');
  if (!box) return;
  const strategy = sim.strategies.find(item => item.id === selectedStrategyId) || sim.strategies[0];

  if (!isBrowser) {
    box.innerHTML = `<h3 class="text-sm font-bold text-slate-900">Rotasyon sırası</h3>
      ${strategy ? `<div class="flex flex-wrap items-center gap-3">${strategy.sequence.map((name, index) =>
        `<div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><span class="text-xs text-slate-500">${index + 1}. ürün</span><p class="text-sm font-semibold">${esc(name)}</p></div>`
      ).join('<span aria-hidden="true">→</span>')}</div>` : '<p class="text-xs text-slate-600">Rotasyon sırası alınamadı.</p>'}
      <p class="text-xs text-slate-500">Algorithm ekim ve hasat tarihi üretmiyor. Takvim tarihleri için veri bulunmuyor.</p>`;
    return;
  }

  if (!strategy) {
    box.innerHTML = '<p class="text-xs text-slate-600">Rotasyon sırası alınamadı.</p>';
    return;
  }

  const months = getLocalizedMonths();
  const seqIds = Array.isArray(strategy.cropSequence) ? strategy.cropSequence : [];
  const activeCropId = (strategy.type === 'current' ? seqIds[0] : seqIds[1]) || sim.payload?.cropAndResources?.targetCrop || 'wheat';
  const isSpringCrop = ['maize', 'sunflower', 'chickpea'].includes(activeCropId);
  const windowLabel = strategy.plantingWindow || (isSpringCrop ? 'Mart – Nisan' : 'Eylül – Ekim');

  const soilType = sim.payload?.soil?.type || 'tinli';
  const soilLabel = sim.soilLabel || 'Tınlı Toprak';
  const irrigation = sim.payload?.cropAndResources?.irrigation || 'kuru_tarim';
  const irrigLabel =
    irrigation === 'damla_sulama' ? 'Damla Sulama'
    : irrigation === 'yagmurlama' ? 'Yağmurlama'
    : irrigation === 'salma_sulama' ? 'Salma Sulama'
    : 'Kuru Tarım';

  const mf = sim.monthlyForecasts || [];
  const nov = findMonthForecast(mf, '2026-11');
  const feb = findMonthForecast(mf, '2027-02');
  const mar = findMonthForecast(mf, '2027-03');
  const apr = findMonthForecast(mf, '2027-04');
  const may = findMonthForecast(mf, '2027-05');
  const jun = findMonthForecast(mf, '2027-06');
  const jul = findMonthForecast(mf, '2027-07');

  const soilPrepNote =
    soilType === 'killi' ? `${soilLabel}: ağır tavda sıkışmayı önlemek için çizel ile derin havalandırma.`
    : soilType === 'kumlu' ? `${soilLabel}: nem kaybını azaltmak için minimum sürüm ve organik madde takviyesi.`
    : soilType === 'kirecli' ? `${soilLabel}: fosfor kilitlenmesine karşı kükürtlü/mikro elementli taban gübresi.`
    : `${soilLabel}: dengeli tohum yatağı hazırlığı ve taban gübresi uygulaması.`;

  const milestones = isSpringCrop
    ? [
        {
          m: `${months[1]} – ${months[2]}`,
          title: 'Toprak Hazırlığı & Tav Kontrolü',
          desc: `${soilPrepNote} (${feb ? `Şubat ort: ${num(feb.temperatureC)} °C, yağış: ${num(feb.precipitationMm)} mm` : ''})`,
          color: 'bg-sky-500'
        },
        {
          m: windowLabel,
          title: 'Dinamik Optimum Ekim Penceresi',
          desc: `${strategy.sequence[1] || strategy.sequence[0]} tohum ekimi (${irrigLabel} · Su tasarruf hedefi: %${num(strategy.waterSaving)}).`,
          color: 'bg-emerald-500'
        },
        {
          m: months[3],
          title: 'Çimlenme & Kök Gelişimi',
          desc: `Nisan NASA tahmini: ${apr ? `${num(apr.temperatureC)} °C, yağış ${num(apr.precipitationMm)} mm, kök nemi WET3: ${num(apr.soilWetnessWet3Index, 2)}` : 'toprak nemi takibi'}.`,
          color: 'bg-emerald-400'
        },
        {
          m: months[4],
          title: 'Vejetatif Gelişim & Üst Besleme',
          desc: `Mayıs NASA tahmini: ${may ? `${num(may.temperatureC)} °C, yağış ${num(may.precipitationMm)} mm` : ''} — ${soilLabel} yapısına uygun üst gübreleme.`,
          color: 'bg-sky-500'
        },
        {
          m: months[5],
          title: 'Çiçeklenme & Su Stresi Kalkanı',
          desc: `Haziran NASA tahmini: ${jun ? `${num(jun.temperatureC)} °C, WET3: ${num(jun.soilWetnessWet3Index, 2)}` : ''} — ${irrigLabel} ile kritik nem yönetimi.`,
          color: 'bg-amber-500'
        },
        {
          m: months[6],
          title: 'Dane / Tabla Dolumu',
          desc: `Temmuz NASA tahmini: ${jul ? `${num(jul.temperatureC)} °C, yağış ${num(jul.precipitationMm)} mm` : ''} — sıcak dalgasına karşı erken olgunlaşma avantajı.`,
          color: 'bg-sky-600'
        },
        {
          m: `${months[7]} – ${months[8]}`,
          title: 'Hasat & Verim Koruma',
          desc: `${strategy.yieldDeltaText} hedefiyle güvenli hasat ve nem kontrolü (${num(sim.payload?.soil?.areaDekar)} da).`,
          color: 'bg-amber-600'
        },
        {
          m: `${months[9]} – ${months[10]}`,
          title: 'Rotasyon Döngüsü & Anız Yönetimi',
          desc: `${strategy.title} nöbeti sonrası toprak organik madde kazanımı ve yeni sezon hazırlığı.`,
          color: 'bg-emerald-600'
        }
      ]
    : [
        {
          m: months[8],
          title: 'Toprak Hazırlığı & Tav Kontrolü',
          desc: soilPrepNote,
          color: 'bg-sky-500'
        },
        {
          m: windowLabel,
          title: 'Dinamik Optimum Ekim Penceresi',
          desc: `${strategy.sequence[1] || strategy.sequence[0]} ekimi (${irrigLabel} · Su tasarruf hedefi: %${num(strategy.waterSaving)}).`,
          color: 'bg-emerald-500'
        },
        {
          m: `${months[10]} – ${months[0]}`,
          title: 'Çimlenme & Kardeşlenme',
          desc: `Kasım NASA tahmini: ${nov ? `${num(nov.temperatureC)} °C, yağış ${num(nov.precipitationMm)} mm, WET3: ${num(nov.soilWetnessWet3Index, 2)}` : 'kış öncesi kök gelişimi'}.`,
          color: 'bg-emerald-400'
        },
        {
          m: months[2],
          title: 'Sapa Kalkma & İlkbahar Beslemesi',
          desc: `Mart NASA tahmini: ${mar ? `${num(mar.temperatureC)} °C, yağış ${num(mar.precipitationMm)} mm, WET3: ${num(mar.soilWetnessWet3Index, 2)}` : ''} — ${soilLabel} için azotlu üst gübreleme.`,
          color: 'bg-sky-500'
        },
        {
          m: months[3],
          title: 'Hastalık & Pas Kalkanı',
          desc: `Nisan NASA tahmini: ${apr ? `${num(apr.temperatureC)} °C, yağış ${num(apr.precipitationMm)} mm` : ''} — bahar neminde yaprak mantarı kontrolü.`,
          color: 'bg-amber-500'
        },
        {
          m: months[4],
          title: 'Başaklanma / Çiçeklenme & Dane Dolumu',
          desc: `Mayıs NASA tahmini: ${may ? `${num(may.temperatureC)} °C, yağış ${num(may.precipitationMm)} mm, WET3: ${num(may.soilWetnessWet3Index, 2)}` : ''} — ${irrigLabel} ile su stresi yönetimi.`,
          color: 'bg-sky-600'
        },
        {
          m: `${months[5]} – ${months[6]}`,
          title: 'Erken Hasat & Depolama',
          desc: `Haziran–Temmuz (${jun ? `${num(jun.temperatureC)}–${num(jul?.temperatureC)} °C` : ''}) aşırı sıcakları öncesi ${strategy.yieldDeltaText} ile hasat.`,
          color: 'bg-amber-600'
        },
        {
          m: `${months[7]} – ${months[8]}`,
          title: 'Rotasyon Geçişi (2. Ürün Hazırlığı)',
          desc: `${strategy.title} rotasyonu ile toprakta azot/nem dengesinin korunması.`,
          color: 'bg-emerald-600'
        }
      ];

  box.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
      <div>
        <h3 class="text-base font-bold text-slate-900">📅 Rotasyon Sırası & 12 Aylık Fenolojik Ekim Takvimi</h3>
        <p class="text-xs text-slate-500">Seçili strateji, NASA aylık tahminleri ve <strong>${esc(soilLabel)}</strong> yapısına göre: <strong>${esc(strategy.title)}</strong></p>
      </div>
      <span class="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
        🌱 ${esc(windowLabel)}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      ${strategy.sequence.map((name, index) => `
        <div class="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5">
          <span class="text-[11px] font-mono text-emerald-700 font-semibold">${index + 1}. Sezon Ürünü</span>
          <p class="text-sm font-bold text-slate-900">${esc(name)}</p>
        </div>
      `).join('<span aria-hidden="true" class="text-emerald-600 font-bold text-lg">→</span>')}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
      ${milestones.map(item => `
        <div class="timeline-item pb-2">
          <span class="timeline-dot ${item.color}"></span>
          <div class="rounded-xl bg-white border border-slate-200 p-3">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold text-slate-900">${esc(item.title)}</span>
              <span class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">${esc(item.m)}</span>
            </div>
            <p class="text-[11px] text-slate-600 mt-1">${esc(item.desc)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
