let forecastRangeDays = 14; // Backend 14 gün döndürdüğü için varsayılan 14 gün
let taskFilter = 'all';
const completedTasks = new Set();

const TURKISH_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const TURKISH_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function generateForecastDays(sim) {
  const { profile, payload, apiForecast14Days } = sim;
  const rainDeltaPct = payload.simOverrides?.rainDeltaPct ?? 0;
  const today = new Date();
  const currentMonthIdx = today.getMonth();

  const baseTemp = profile.temp2026[currentMonthIdx] ?? 15;
  const monthlyRain = profile.rain2026[currentMonthIdx] ?? 35;
  const dailyRainProb = Math.min(0.75, Math.max(0.05, (monthlyRain / 110) * (1 + rainDeltaPct / 100)));
  const seed = Math.abs(Math.round((payload.location.latitude + payload.location.longitude) * 100));

  const days = [];

  for (let i = 0; i < 30; i++) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() + i);

    // Eğer ilk 14 gün backend'den geldiyse onu kullan
    const apiDay = apiForecast14Days && apiForecast14Days[i] ? apiForecast14Days[i] : null;

    const wave = Math.sin((i + seed) * 0.65);
    const wave2 = Math.cos((i * 1.3 + seed) * 0.45);

    const maxTemp = apiDay
      ? Math.round(Number(apiDay.maxTemp ?? apiDay.tempMax ?? apiDay.temp ?? baseTemp + 3))
      : Math.round(baseTemp + 4 + wave * 3.8);
    const minTemp = apiDay
      ? Math.round(Number(apiDay.minTemp ?? apiDay.tempMin ?? maxTemp - 7))
      : Math.round(baseTemp - 4 + wave2 * 2.5);

    const rainSignal = (Math.sin((i * 2.1 + seed) * 0.9) + 1) / 2;
    const isRainy = rainSignal < dailyRainProb;
    const rainMm = apiDay
      ? Math.round(Number(apiDay.rain ?? apiDay.rainfall ?? apiDay.precipitation ?? 0))
      : isRainy
        ? Math.max(2, Math.round((dailyRainProb - rainSignal) * 38 * (1 + rainDeltaPct / 100)))
        : 0;

    const humidity = apiDay
      ? Math.round(Number(apiDay.humidity ?? 55))
      : Math.min(96, Math.max(28, Math.round((isRainy ? 76 : 48) + wave2 * 14 + rainDeltaPct * 0.2)));

    const windKmh = apiDay
      ? Math.round(Number(apiDay.windSpeed ?? apiDay.wind ?? 12))
      : Math.max(5, Math.round(13 + Math.abs(wave * 11)));

    let icon = '☀️';
    if (rainMm >= 12) icon = '⛈️';
    else if (rainMm > 0) icon = '🌧️';
    else if (humidity >= 72) icon = '⛅';
    else if (minTemp <= 1) icon = '❄️';

    let fieldStatus = { label: 'İlaçlamaya Uygun', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' };
    if (rainMm > 0) {
      fieldStatus = { label: 'Yağışlı • Bekle', color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' };
    } else if (windKmh >= 18) {
      fieldStatus = { label: 'Rüzgârlı • Püskürtme Yapma', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' };
    } else if (minTemp <= 1) {
      fieldStatus = { label: 'Don Uyarısı', color: 'text-rose-300 bg-rose-500/10 border-rose-500/30' };
    }

    days.push({
      dayIndex: i + 1,
      dateLabel: apiDay?.date || `${dateObj.getDate()} ${TURKISH_MONTHS_SHORT[dateObj.getMonth()]}`,
      dayName: i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : TURKISH_DAYS_SHORT[dateObj.getDay()],
      maxTemp,
      minTemp,
      rainMm,
      humidity,
      windKmh,
      icon,
      fieldStatus
    });
  }

  return days;
}

function buildAgronomyTasks(sim, forecast, selectedStrategyId) {
  const { payload, cropLabel, strategies, apiTaskCalendar, apiUpcomingTasks } = sim;
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[1];

  // Backend'den gelen taskCalendar ve upcomingTasks varsa doğrudan standart formata çevir
  const backendRawTasks = [
    ...(Array.isArray(apiTaskCalendar) ? apiTaskCalendar : []),
    ...(Array.isArray(apiUpcomingTasks) ? apiUpcomingTasks : [])
  ];

  if (backendRawTasks.length > 0) {
    return backendRawTasks.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `api-task-${idx}`,
          dayTag: `Gün ${idx * 3 + 1}`,
          priority: idx < 2 ? 'critical' : 'planned',
          priorityLabel: idx < 2 ? 'API KRİTİK UYARI' : 'API GÖREVİ',
          title: item,
          desc: 'Backend iklim ve simülasyon motoru tarafından önerilen saha aksiyonu.',
          equipment: '🛰️ API Önerisi',
          weatherContext: `${forecast[Math.min(idx * 2, 13)].maxTemp}°C`
        };
      }
      return {
        id: item.id || `api-task-${idx}`,
        dayTag: item.date || item.day || `Gün ${idx * 3 + 1}`,
        priority: item.priority === 'high' || item.critical || idx < 2 ? 'critical' : 'planned',
        priorityLabel: item.category || (idx < 2 ? 'KRİTİK UYARI' : 'PLANLI GÖREV'),
        title: item.title || item.task || item.name || 'Tarımsal Operasyon',
        desc: item.description || item.desc || item.note || 'Hava tahmin penceresine göre planlandı.',
        equipment: item.equipment || '🚜 Saha Ekipmanı',
        weatherContext: item.weather || `${forecast[0].maxTemp}°C`
      };
    });
  }

  // Backend henüz kapalıysa yerel akıllı görev listesi
  const hasSprayer = payload.cropAndResources.machinery.includes('pulverizator');
  const hasMibzer = payload.cropAndResources.machinery.includes('mibzer');
  const isClay = payload.soil.type === 'killi';
  const isDryFarming = payload.cropAndResources.irrigation === 'kuru_tarim';

  const idealSprayDay = forecast.find(d => d.dayIndex >= 2 && d.rainMm === 0 && d.windKmh < 16) || forecast[2];
  const firstRainDay = forecast.find(d => d.dayIndex >= 3 && d.rainMm > 0);
  const dryWindowDay = forecast.find(d => d.dayIndex >= 5 && d.rainMm === 0 && d.minTemp > 2) || forecast[5];

  return [
    {
      id: 'task-soil-prep',
      dayTag: `Gün 1–2 (${forecast[0].dateLabel})`,
      priority: 'critical',
      priorityLabel: 'KRİTİK ÖNCELİK',
      title: isClay ? 'Killi Toprak Yüzey Drenajı Kontrolü' : 'Tohum Yatağı Nem Kilitleme',
      desc: 'Yüzey buharlaşmasını kesmek için minimum toprak işleme ile mevcut nem rezervini koruyun.',
      equipment: '🚜 Traktör',
      weatherContext: `${forecast[0].maxTemp}°C / Nem %${forecast[0].humidity}`
    },
    {
      id: 'task-planting-window',
      dayTag: `Gün ${dryWindowDay.dayIndex} (${dryWindowDay.dateLabel})`,
      priority: 'critical',
      priorityLabel: 'EKİM PENCERESİ',
      title: `${cropLabel} İçin Kaydırılmış Ekim Hazırlığı (${activeStrategy.plantingWindow})`,
      desc: `Seçili "${activeStrategy.title}" planına göre sertifikalı tohum ekim ayarını tamamlayın.`,
      equipment: hasMibzer ? '🌱 Hassas Mibzer' : '🌱 Mibzer Ayarı',
      weatherContext: `${dryWindowDay.icon} ${dryWindowDay.maxTemp}°C`
    },
    {
      id: 'task-fungal-shield',
      dayTag: `Gün ${idealSprayDay.dayIndex} (${idealSprayDay.dateLabel})`,
      priority: 'critical',
      priorityLabel: 'HASTALIK BARİYERİ',
      title: 'Düşük Rüzgâr Penceresinde Önleyici Fungisit / Biyolojik Koruma',
      desc: `Rüzgâr hızı ${idealSprayDay.windKmh} km/sa seviyesindeyken sürüklenme kaybı olmadan koruma uygulayın.`,
      equipment: hasSprayer ? '💨 Pülverizatör' : '💨 İlaçlama Ekipmanı',
      weatherContext: `Rüzgâr ${idealSprayDay.windKmh} km/sa`
    },
    {
      id: 'task-irrigation-plan',
      dayTag: firstRainDay ? `Gün ${Math.max(1, firstRainDay.dayIndex - 1)}` : 'Gün 10',
      priority: 'planned',
      priorityLabel: isDryFarming ? 'NEM TAKİBİ' : 'SULAMA PLANI',
      title: firstRainDay
        ? `Beklenen Yağış (${firstRainDay.rainMm} mm) Öncesi Sulamayı Ertele`
        : 'Kök Gelişimi İçin Kontrollü Sulama Turu',
      desc: 'Aşırı nem birikimiyle mantar riskini tetiklemeden kök bölgesini dengede tutun.',
      equipment: '💧 Sulama',
      weatherContext: firstRainDay ? `🌧️ ${firstRainDay.rainMm} mm` : '☀️ Açık'
    }
  ];
}

export function renderFarmerTaskCalendar(sim, selectedStrategyId) {
  const container = document.getElementById('farmer-task-calendar-box');
  if (!container) return;

  const forecastAll = generateForecastDays(sim);
  const visibleForecast = forecastAll.slice(0, forecastRangeDays);
  const allTasks = buildAgronomyTasks(sim, forecastAll, selectedStrategyId);

  const filteredTasks = allTasks.filter(t => {
    if (taskFilter === 'critical') return t.priority === 'critical';
    if (taskFilter === 'pending') return !completedTasks.has(t.id);
    return true;
  });

  const doneCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const progressPct = Math.round((doneCount / allTasks.length) * 100);

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-base">📋</span>
          <h3 class="text-sm font-bold text-white tracking-tight">Çiftçi Görev Takvimi & ${forecastRangeDays} Günlük Hava Tahmini</h3>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          <code class="text-purple-300 font-mono">/api/weather-tasks</code> tahmin verileri ve tarla aksiyonları
        </p>
      </div>

      <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button type="button" data-range="14" class="px-3 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
          forecastRangeDays === 14 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
        }">14 Günlük (API)</button>
        <button type="button" data-range="30" class="px-3 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
          forecastRangeDays === 30 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
        }">30 Günlük</button>
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2">
      ${visibleForecast.map(day => `
        <div class="min-w-[116px] shrink-0 rounded-xl bg-slate-950/80 border border-slate-800/90 p-2.5 flex flex-col justify-between gap-2">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-mono font-bold text-white">${day.dateLabel}</span>
            <span class="text-[10px] text-slate-400">${day.dayName}</span>
          </div>
          <div class="flex items-center justify-between my-0.5">
            <span class="text-xl">${day.icon}</span>
            <div class="text-right font-mono">
              <div class="text-xs font-bold text-amber-300">${day.maxTemp}°</div>
              <div class="text-[10px] text-slate-400">${day.minTemp}°</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-300 bg-slate-900/90 rounded-lg p-1.5">
            <span>💧 ${day.rainMm}mm</span>
            <span>💨 ${day.windKmh}km</span>
          </div>
          <div class="text-[9px] font-mono text-center px-1.5 py-0.5 rounded border truncate ${day.fieldStatus.color}">
            ${day.fieldStatus.label}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="flex flex-col gap-3 pt-1">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-purple-300">Önerilen Tarımsal Görevler</h4>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
            ${doneCount}/${allTasks.length} Tamamlandı (%${progressPct})
          </span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px]">
          <button type="button" data-task-filter="all" class="px-2.5 py-1 rounded-lg border cursor-pointer ${taskFilter === 'all' ? 'border-purple-500/50 bg-purple-500/15 text-purple-200' : 'border-slate-800 bg-slate-900/60 text-slate-400'}">Tümü</button>
          <button type="button" data-task-filter="critical" class="px-2.5 py-1 rounded-lg border cursor-pointer ${taskFilter === 'critical' ? 'border-rose-500/50 bg-rose-500/15 text-rose-200' : 'border-slate-800 bg-slate-900/60 text-slate-400'}">Kritik</button>
          <button type="button" data-task-filter="pending" class="px-2.5 py-1 rounded-lg border cursor-pointer ${taskFilter === 'pending' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200' : 'border-slate-800 bg-slate-900/60 text-slate-400'}">Bekleyen</button>
        </div>
      </div>

      <div class="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300" style="width: ${progressPct}%"></div>
      </div>

      <div class="flex flex-col gap-2">
        ${filteredTasks.map(task => {
          const isDone = completedTasks.has(task.id);
          const badgeStyle = task.priority === 'critical'
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
            : 'bg-sky-500/15 text-sky-300 border-sky-500/35';

          return `
            <label class="cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition ${
              isDone ? 'bg-slate-950/40 border-slate-800/60 opacity-65' : 'bg-slate-900/80 border-slate-800 hover:border-purple-500/40'
            }">
              <input type="checkbox" data-task-check="${task.id}" ${isDone ? 'checked' : ''} class="mt-1 w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono font-bold text-purple-300">${task.dayTag}</span>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeStyle}">${task.priorityLabel}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">${task.equipment}</span>
                    <span class="hidden sm:inline px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">${task.weatherContext}</span>
                  </div>
                </div>
                <h5 class="text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}">${task.title}</h5>
                <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">${task.desc}</p>
              </div>
            </label>
          `;
        }).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll('[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      forecastRangeDays = Number(btn.dataset.range);
      renderFarmerTaskCalendar(sim, selectedStrategyId);
    });
  });

  container.querySelectorAll('[data-task-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      taskFilter = btn.dataset.taskFilter;
      renderFarmerTaskCalendar(sim, selectedStrategyId);
    });
  });

  container.querySelectorAll('[data-task-check]').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const id = e.target.dataset.taskCheck;
      if (e.target.checked) completedTasks.add(id);
      else completedTasks.delete(id);
      renderFarmerTaskCalendar(sim, selectedStrategyId);
    });
  });
}