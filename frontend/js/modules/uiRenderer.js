import { renderPlantingTimeline } from './timelineRenderer.js';
import { renderFarmerTaskCalendar } from './taskCalendar.js';

let selectedStrategyId = 'alt1';

export function renderDashboardUI(sim) {
  const emptyState = document.getElementById('empty-state');
  const climatePanel = document.getElementById('climate-panel');

  if (emptyState) emptyState.classList.add('hidden');
  if (climatePanel) {
    climatePanel.classList.remove('hidden');
    climatePanel.classList.add('flex');
  }

  const {
    payload,
    profile,
    cropLabel,
    soilLabel,
    peakFungal,
    peakDrought,
    frostRisk,
    estYieldLoss,
    strategies
  } = sim;

  document.getElementById('report-coords').textContent =
    `${payload.location.latitude.toFixed(2)}°K, ${payload.location.longitude.toFixed(2)}°D`;
  document.getElementById('report-title').textContent =
    `${profile.name} — ${cropLabel} (${soilLabel})`;
  document.getElementById('report-area').textContent =
    `${payload.soil.areaDekar} da`;

  document.getElementById('kpi-fungal-score').textContent = `%${peakFungal}`;
  document.getElementById('kpi-fungal-label').textContent =
    peakFungal >= 75 ? 'Kritik Sporülasyon' : peakFungal >= 55 ? 'Yüksek Risk' : 'Kontrollü Risk';
  document.getElementById('kpi-fungal-desc').textContent =
    payload.soil.type === 'killi'
      ? 'Killi toprak nemi hapsederek mantarı tetikliyor'
      : 'Bahar çiy süresi ve ılıman geceler riski artırıyor';

  document.getElementById('kpi-drought-score').textContent = `%${peakDrought}`;
  document.getElementById('kpi-drought-label').textContent =
    peakDrought >= 80 ? 'Şiddetli Su Stresi' : 'Orta-Yüksek Açık';
  document.getElementById('kpi-drought-desc').textContent =
    payload.cropAndResources.irrigation === 'kuru_tarim'
      ? 'Kuru tarımda yaz yağış kaybı verimi vurur'
      : 'Buharlaşma artışı sulama aralığını sıklaştırıyor';

  document.getElementById('kpi-frost-score').textContent = `%${frostRisk}`;
  document.getElementById('kpi-frost-label').textContent =
    frostRisk >= 50 ? 'Yüksek Don Tehlikesi' : 'Düşük-Orta Risk';
  document.getElementById('kpi-yield-loss').textContent = `-%${estYieldLoss}`;

  renderRotationCards(sim);
  renderSelectedStrategyDetail(strategies);
  renderPlantingTimeline(sim, selectedStrategyId);
  renderFarmerTaskCalendar(sim, selectedStrategyId);
  renderAgronomyAlerts(payload, profile);
}

function renderRotationCards(sim) {
  const { strategies } = sim;
  const grid = document.getElementById('rotation-cards-grid');
  if (!grid) return;

  grid.innerHTML = strategies.map(st => {
    const isSelected = st.id === selectedStrategyId;
    const borderStyle = isSelected
      ? st.selectedClass
      : 'border-slate-800 bg-slate-900/55 hover:border-slate-700';

    return `
      <div
        data-strategy-id="${st.id}"
        class="rotation-card cursor-pointer rounded-xl border p-4 flex flex-col justify-between gap-3 ${borderStyle}"
      >
        <div>
          <div class="flex items-center justify-between gap-1 mb-2">
            <span class="text-[9px] font-mono font-semibold px-2 py-0.5 rounded border ${st.badgeClass}">
              ${st.badge}
            </span>
            <span class="text-[10px] font-mono ${isSelected ? st.accentText + ' font-bold' : 'text-slate-500'}">
              ${isSelected ? '● SEÇİLİ' : '○ İncele'}
            </span>
          </div>

          <h4 class="text-xs font-bold text-white leading-snug">${st.title}</h4>
          <p class="text-[11px] text-slate-400 mt-0.5">${st.subtitle}</p>

          <div class="mt-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/90">
            <div class="text-[10px] text-slate-400">Ekim Penceresi</div>
            <div class="text-[11px] font-mono font-semibold ${st.accentText}">${st.plantingWindow}</div>
          </div>

          <div class="mt-2.5">
            <div class="text-[10px] text-slate-400 mb-1">3 Sezonluk Rotasyon Akışı:</div>
            <div class="flex flex-col gap-1">
              ${st.sequence.map((item, idx) => `
                <div class="flex items-center gap-1.5 text-[11px] text-slate-200 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60">
                  <span class="text-[9px] font-mono text-slate-500">S${idx + 1}</span>
                  <span class="truncate">${item}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="border-t border-slate-800/80 pt-2.5 flex flex-col gap-2">
          <div>
            <div class="flex justify-between text-[10px] mb-0.5">
              <span class="text-slate-400">Mantar Riski</span>
              <span class="font-mono font-semibold text-slate-200">%${st.fungalRisk}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full ${st.fungalRisk > 50 ? 'bg-rose-500' : 'bg-emerald-400'}" style="width: ${st.fungalRisk}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-[10px] mb-0.5">
              <span class="text-slate-400">Kuraklık Stresi</span>
              <span class="font-mono font-semibold text-slate-200">%${st.droughtRisk}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full ${st.droughtRisk > 55 ? 'bg-amber-500' : 'bg-sky-400'}" style="width: ${st.droughtRisk}%"></div>
            </div>
          </div>

          <div class="mt-1 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div>
              <div class="text-[10px] text-slate-400">Tahmini Getiri</div>
              <div class="text-xs font-mono font-bold text-white">${st.financialTotal.toLocaleString('tr-TR')} ₺</div>
            </div>
            <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${st.accentText}">
              ${st.yieldDeltaText}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.rotation-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedStrategyId = card.dataset.strategyId;
      renderRotationCards(sim);
      renderSelectedStrategyDetail(strategies);
      renderPlantingTimeline(sim, selectedStrategyId);
      renderFarmerTaskCalendar(sim, selectedStrategyId);
    });
  });
}

function renderSelectedStrategyDetail(strategies) {
  const detailBox = document.getElementById('selected-strategy-detail');
  if (!detailBox) return;

  const st = strategies.find(s => s.id === selectedStrategyId) || strategies[1];
  const baseline = strategies[0];
  const fungalDrop = baseline.fungalRisk - st.fungalRisk;

  detailBox.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono px-2 py-0.5 rounded border ${st.badgeClass}">AKTİF SENARYO</span>
        <h4 class="text-xs sm:text-sm font-bold text-white">${st.title}</h4>
      </div>
      <span class="text-xs font-mono font-semibold ${st.accentText}">${st.financialDiffText}</span>
    </div>

    <p class="text-xs text-slate-300 leading-relaxed">
      <strong class="text-white">Agronomi Gerekçesi:</strong> ${st.reason}
    </p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
      <div class="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
        <div class="text-[10px] text-slate-400">Mantar Risk Değişimi</div>
        <div class="text-xs font-mono font-bold mt-0.5 ${fungalDrop > 0 ? 'text-emerald-400' : 'text-rose-400'}">
          ${fungalDrop > 0 ? `-${fungalDrop} Puan Azalma` : 'Koruma Yok'}
        </div>
      </div>

      <div class="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
        <div class="text-[10px] text-slate-400">Sulama Tasarrufu</div>
        <div class="text-xs font-mono font-bold mt-0.5 ${st.waterSaving > 0 ? 'text-sky-400' : 'text-slate-400'}">
          ${st.waterSaving > 0 ? `%${st.waterSaving} Daha Az Su` : '%0'}
        </div>
      </div>

      <div class="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
        <div class="text-[10px] text-slate-400">Toprak & Azot Etkisi</div>
        <div class="text-[11px] font-medium text-slate-200 mt-0.5 leading-tight">${st.soilImpact}</div>
      </div>

      <div class="rounded-lg bg-slate-950/70 border border-slate-800/80 p-2.5">
        <div class="text-[10px] text-slate-400">Bütçe & Ekipman Uyumu</div>
        <div class="text-[11px] font-medium text-slate-200 mt-0.5 leading-tight">${st.equipmentNote}</div>
      </div>
    </div>
  `;
}

function renderAgronomyAlerts(payload, profile) {
  const alertsContainer = document.getElementById('agronomy-alerts-list');
  if (!alertsContainer) return;

  const alerts = [
    {
      icon: '🌡️',
      title: `Büyüme Derece Günleri (GDD): ${profile.gddShift}`,
      desc: 'Isınma trendi bitkinin gelişim evrelerini öne çekiyor; geleneksel tarihte ekim yapılırsa çiçeklenme sıcak dalgasına yakalanıyor.',
      badge: 'FENOLOJİ KAYMASI',
      badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30'
    },
    {
      icon: '💨',
      title: `Buhar Basıncı Açığı (VPD) & Tozlaşma`,
      desc: `Bölgede beklenen ${profile.heatWaveDays} periyodu, stoma kapanmasına ve polen canlılığının düşmesine yol açarak verimi kırpıyor.`,
      badge: 'SICAK DALGASI',
      badgeColor: 'text-rose-300 bg-rose-500/10 border-rose-500/30'
    },
    {
      icon: '🧪',
      title: payload.soil.ph === 'alkali' ? 'Alkali Toprakta Mikro Besin Kilidi' : 'Toprak Nem Rezervi & Çimlenme',
      desc: payload.soil.ph === 'alkali'
        ? 'pH > 7.5 nedeniyle çinko ve demir alımı yavaşlar; kuraklık stresiyle birleştiğinde bitki direnci zayıflar.'
        : 'Yüzey nemi hızla buharlaştığı için tohumun kök salma döneminde kesintisiz nem penceresi hedeflenmeli.',
      badge: 'TOPRAK ETKİLEŞİMİ',
      badgeColor: 'text-sky-300 bg-sky-500/10 border-sky-500/30'
    }
  ];

  alertsContainer.innerHTML = alerts.map(a => `
    <div class="rounded-xl bg-slate-900/85 border border-slate-800 p-3 flex flex-col justify-between gap-2">
      <div>
        <div class="flex items-center justify-between gap-1 mb-1.5">
          <span class="text-base">${a.icon}</span>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${a.badgeColor}">${a.badge}</span>
        </div>
        <h4 class="text-xs font-semibold text-slate-100 leading-snug">${a.title}</h4>
        <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${a.desc}</p>
      </div>
    </div>
  `).join('');
}