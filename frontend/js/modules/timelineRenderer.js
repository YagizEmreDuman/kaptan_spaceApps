import { MONTHS } from '../data/climateData.js';

const CROP_TIMELINE_DATA = {
  bugday: {
    oldLabel: '15–28 Ekim (Geleneksel)',
    oldActive: [9, 10, 11, 0, 1, 2, 3, 4, 5, 6],
    oldPlant: [9],
    oldHarvest: [6],
    alt1Label: '26 Eylül–6 Ekim (-18 Gün)',
    alt1Active: [8, 9, 10, 11, 0, 1, 2, 3, 4, 5],
    alt1Plant: [8, 9],
    alt1Harvest: [5],
    alt2Label: '22 Eylül–2 Ekim (-22 Gün)',
    alt2Active: [8, 9, 10, 11, 0, 1, 2, 3, 4],
    alt2Plant: [8],
    alt2Harvest: [4],
    alternatives: [
      {
        name: 'Sarı Pas (Yr) Dirençli Erkenci Ekmeklik Buğday',
        replaces: 'Hassas Geleneksel Buğday',
        tags: ['Sarı Pas Dirençli', 'Erkenci Hasat', '-18 Gün'],
        benefit: 'Nisan-Mayıs çiy döneminde sporülasyona yakalanmaz, Haziran sıcağından önce başak doldurur.'
      },
      {
        name: 'Kuraklığa Dayanıklı Sertifikalı Tritikale / Arpa',
        replaces: 'Kuru Tarım Riskli Parseller',
        tags: ['Düşük Su İhtiyacı', 'Derin Kök', 'Kışa Dayanıklı'],
        benefit: 'Kumlu veya yağışa bağımlı arazilerde su stresini %35 azaltır, kök çürüklüğüne dirençlidir.'
      },
      {
        name: 'Kışlık Macar Fiği (Ara Dönem Yeşil Gübre)',
        replaces: 'Boş Nadas Dönemi',
        tags: ['Doğal Azot (+12 kg/da)', 'Mantar Kıran'],
        benefit: 'Topraktaki monokültür mantar döngüsünü kırar ve bir sonraki ekim için nem tutulumunu artırır.'
      }
    ]
  },
  misir: {
    oldLabel: '25 Nisan–10 Mayıs (Geleneksel)',
    oldActive: [3, 4, 5, 6, 7, 8],
    oldPlant: [3, 4],
    oldHarvest: [8],
    alt1Label: '28 Mart–8 Nisan (-25 Gün)',
    alt1Active: [2, 3, 4, 5, 6, 7],
    alt1Plant: [2, 3],
    alt1Harvest: [7],
    alt2Label: '2–12 Nisan (-20 Gün)',
    alt2Active: [3, 4, 5, 6, 7],
    alt2Plant: [3],
    alt2Harvest: [7],
    alternatives: [
      {
        name: 'FAO 500 Erkenci Kuraklık Toleranslı Hibrit Mısır',
        replaces: 'Geçci Standart Mısır',
        tags: ['Sıcak Stresi Toleranslı', 'Erken Tozlaşma'],
        benefit: 'Temmuz-Ağustos aşırı sıcak dalgası (>35°C) başlamadan tozlaşmayı tamamlayarak koçan yanmasını önler.'
      },
      {
        name: 'Kuraklığa Dayanıklı Hibrit Tane Sorgum',
        replaces: 'Su Kısıtlı Mısır Parselleri',
        tags: ['%38 Su Tasarrufu', 'Yüksek Isı Direnci'],
        benefit: 'Yüksek sıcaklıklarda yaprak kıvırıp kendini korumaya alır; daha az sulama ile yüksek dane verimi sunar.'
      },
      {
        name: 'Kışlık Yem Bezelyesi (Örtü Bitkisi)',
        replaces: 'Kışlık Boş Tarla',
        tags: ['Toprak Nemi Koruma', 'Azot Fiksasyonu'],
        benefit: 'İlkbahar ekimi öncesi toprağı gölgeleyerek buharlaşmayı azaltır ve gübre maliyetini düşürür.'
      }
    ]
  },
  domates: {
    oldLabel: '1–15 Mayıs (Geleneksel)',
    oldActive: [4, 5, 6, 7, 8],
    oldPlant: [4],
    oldHarvest: [7, 8],
    alt1Label: '12–22 Nisan (-19 Gün)',
    alt1Active: [3, 4, 5, 6, 7],
    alt1Plant: [3],
    alt1Harvest: [6, 7],
    alt2Label: '10–20 Nisan (-21 Gün)',
    alt2Active: [3, 4, 5, 6, 7],
    alt2Plant: [3],
    alt2Harvest: [6, 7],
    alternatives: [
      {
        name: 'Mildiyö & Fusarium Dirençli Salçalık Hibrit',
        replaces: 'Hassas Açık Tozlanan Çeşitler',
        tags: ['Mildiyö Dirençli', 'Güneş Yanığı Korumalı'],
        benefit: 'Bahar neminde yaprak yanıklığını durdurur; güçlü yaprak örtüsü meyveleri Ağustos güneşinden korur.'
      },
      {
        name: 'Kışlık Arpa / Buğday (Patojen Bariyer Ekimi)',
        replaces: 'Üst Üste Domates Ekimi',
        tags: ['Toprak Dezenfeksiyonu', 'Nematod Kıran'],
        benefit: 'Solanaceae ailesi mantar sporlarının toprakta kışlamasını %80 oranında engeller.'
      },
      {
        name: 'Oturak Kuru Fasulye / Barbunya Rotasyonu',
        replaces: 'Yorgun Sebze Parseli',
        tags: ['Azot Dengeleyici', 'Kısa Vejetasyon'],
        benefit: 'Kök yumrularıyla toprağı zenginleştirir ve yüksek nemli dönemlerde ilaç ihtiyacını azaltır.'
      }
    ]
  },
  aycicegi: {
    oldLabel: '15–30 Nisan (Geleneksel)',
    oldActive: [3, 4, 5, 6, 7, 8],
    oldPlant: [3],
    oldHarvest: [8],
    alt1Label: '22 Mart–3 Nisan (-23 Gün)',
    alt1Active: [2, 3, 4, 5, 6, 7],
    alt1Plant: [2, 3],
    alt1Harvest: [7],
    alt2Label: '20–31 Mart (-25 Gün)',
    alt2Active: [2, 3, 4, 5, 6, 7],
    alt2Plant: [2],
    alt2Harvest: [7],
    alternatives: [
      {
        name: 'Orobanş & Mildiyö Dirençli Yüksek Oleik Ayçiçeği',
        replaces: 'Standart Yağlık Ayçiçeği',
        tags: ['Orobanş Dirençli', 'Yüksek Yağ Oranı'],
        benefit: 'Kış sonu nemiyle derin kazık kök geliştirir; Temmuz kuraklığında bile tabla dolumunu sürdürür.'
      },
      {
        name: 'Kuraklığa Dayanıklı Sertifikalı Nohut',
        replaces: 'Dar Tahıl-Ayçiçeği Döngüsü',
        tags: ['Minimum Su İhtiyacı', 'Doğal Azot'],
        benefit: 'Kuru tarım koşullarında bile yüksek verim verir ve ayçiçeği parazitlerinin döngüsünü kırar.'
      },
      {
        name: 'Kışlık Yulaf (Örtü & Malç Bitkisi)',
        replaces: 'Çıplak Kış Toprağı',
        tags: ['Nem Muhafazası', 'Yabancı Ot Baskılama'],
        benefit: 'Bahar rüzgarlarının yüzey nemini uçurmasını önleyerek erken ekimde homojen çimlenme sağlar.'
      }
    ]
  },
  pamuk: {
    oldLabel: '25 Nisan–10 Mayıs (Geleneksel)',
    oldActive: [3, 4, 5, 6, 7, 8, 9],
    oldPlant: [3, 4],
    oldHarvest: [9],
    alt1Label: '5–16 Nisan (-19 Gün)',
    alt1Active: [3, 4, 5, 6, 7, 8],
    alt1Plant: [3],
    alt1Harvest: [8],
    alt2Label: '3–14 Nisan (-21 Gün)',
    alt2Active: [3, 4, 5, 6, 7, 8],
    alt2Plant: [3],
    alt2Harvest: [8],
    alternatives: [
      {
        name: 'Erkenci Verticillium Solgunluğu Dirençli Pamuk',
        replaces: 'Geçci Standart Pamuk',
        tags: ['Solgunluk Dirençli', 'Eylül Sonu Hasat'],
        benefit: 'Ekim yağışları başlamadan kozalar açar; koza çürüklüğünü önler ve 2 sulama turu tasarruf sağlar.'
      },
      {
        name: 'İkinci Ürün Soya / Yerfıstığı Rotasyonu',
        replaces: 'Monokültür Pamuk',
        tags: ['Tuzluluk Dengeleyici', 'Azot Bağlayıcı'],
        benefit: 'Yoğun sulama kaynaklı toprak yorgunluğunu ve mantar yükünü azaltır.'
      },
      {
        name: 'Kışlık Bakla / Fiğ Karışımı',
        replaces: 'Boş Kış Sezonu',
        tags: ['Organik Madde', 'Kök Havalandırma'],
        benefit: 'Killi ve ağır bünyeli pamuk topraklarında su geçirgenliğini artırır.'
      }
    ]
  },
  seker_pancari: {
    oldLabel: '10–25 Nisan (Geleneksel)',
    oldActive: [3, 4, 5, 6, 7, 8, 9],
    oldPlant: [3],
    oldHarvest: [9],
    alt1Label: '16–28 Mart (-24 Gün)',
    alt1Active: [2, 3, 4, 5, 6, 7, 8],
    alt1Plant: [2],
    alt1Harvest: [8],
    alt2Label: '14–25 Mart (-26 Gün)',
    alt2Active: [2, 3, 4, 5, 6, 7, 8],
    alt2Plant: [2],
    alt2Harvest: [8],
    alternatives: [
      {
        name: 'Cercospora & Rizomani Dirençli Yüksek Polar Çeşit',
        replaces: 'Hassas Pancar Tohumları',
        tags: ['Yaprak Lekesi Dirençli', '+%1.8 Şeker Oranı'],
        benefit: 'Erken ekimle yaz sıcağı gelmeden toprağı tamamen gölgeler; yaprak yanıklığını ve mantarı durdurur.'
      },
      {
        name: 'Erkenci Maltlık / Yemlik Arpa Rotasyonu',
        replaces: 'Sık Pancar Ekimi',
        tags: ['Nematod Bariyeri', 'Erken Hasat'],
        benefit: 'Toprak kökenli nematod popülasyonunu kırarak bir sonraki pancar sezonunu güvenceye alır.'
      },
      {
        name: 'Kışlık Macar Fiği Ara Ürünü',
        replaces: 'Boş Kış Dönemi',
        tags: ['Toprak Strüktürü', 'Doğal Gübre'],
        benefit: 'Kök gelişimi için toprağı kabartır, sentetik azot ihtiyacını azaltır.'
      }
    ]
  }
};

export function renderPlantingTimeline(sim, selectedStrategyId) {
  const container = document.getElementById('planting-timeline-box');
  if (!container) return;

  const { payload, monthlyFungal, monthlyDrought, strategies } = sim;
  const cropKey = payload.cropAndResources.targetCrop;
  const bp = CROP_TIMELINE_DATA[cropKey] || CROP_TIMELINE_DATA.bugday;
  const activeStrategy = strategies.find(s => s.id === selectedStrategyId) || strategies[1];

  // Seçilen stratejiye göre aktif takvim aralığını belirle
  const isBaseline = selectedStrategyId === 'baseline';
  const activeRange = selectedStrategyId === 'alt2'
    ? { label: bp.alt2Label, active: bp.alt2Active, plant: bp.alt2Plant, harvest: bp.alt2Harvest, color: 'bg-sky-500', text: 'text-sky-300' }
    : selectedStrategyId === 'alt1'
      ? { label: bp.alt1Label, active: bp.alt1Active, plant: bp.alt1Plant, harvest: bp.alt1Harvest, color: 'bg-emerald-500', text: 'text-emerald-300' }
      : { label: bp.oldLabel, active: bp.oldActive, plant: bp.oldPlant, harvest: bp.oldHarvest, color: 'bg-rose-500', text: 'text-rose-300' };

  // 12 Aylık Görsel Zaman Çizelgesi Satırları
  const monthColumnsHtml = MONTHS.map((m, idx) => {
    const fungal = monthlyFungal[idx];
    const drought = monthlyDrought[idx];
    const isPeakRisk = fungal >= 65 || drought >= 80;
    const riskBadgeColor = fungal >= 65
      ? 'bg-amber-500/80 text-slate-950'
      : drought >= 80
        ? 'bg-rose-500/80 text-white'
        : 'bg-slate-800/70 text-slate-400';

    // Eski Takvim Hücresi
    const isOldActive = bp.oldActive.includes(idx);
    const isOldPlant = bp.oldPlant.includes(idx);
    const isOldHarvest = bp.oldHarvest.includes(idx);

    // Yeni Kaydırılmış Takvim Hücresi
    const isNewActive = activeRange.active.includes(idx);
    const isNewPlant = activeRange.plant.includes(idx);
    const isNewHarvest = activeRange.harvest.includes(idx);

    return `
      <div class="flex flex-col gap-1.5 min-w-[46px] flex-1">
        <!-- Ay Başlığı -->
        <div class="text-center text-[10px] font-mono font-semibold ${isPeakRisk ? 'text-amber-300' : 'text-slate-400'}">
          ${m}
        </div>

        <!-- Satır 1: İklim & Hastalık Risk Zirvesi -->
        <div title="${m}: Mantar %${fungal} | Kuraklık %${drought}" class="h-6 rounded-md flex items-center justify-center text-[9px] font-mono font-bold ${riskBadgeColor}">
          ${fungal >= 65 ? '🍄' + fungal : drought >= 80 ? '☀️' + drought : Math.max(fungal, drought) + '%'}
        </div>

        <!-- Satır 2: Geleneksel Eski Takvim -->
        <div class="h-5 rounded-md border border-dashed ${isOldActive ? 'border-rose-500/50 bg-rose-950/30' : 'border-slate-800/60 bg-slate-950/30'} flex items-center justify-center text-[9px] font-mono text-rose-300">
          ${isOldPlant ? 'EKİM' : isOldHarvest ? 'HASAT' : isOldActive ? '•••' : ''}
        </div>

        <!-- Satır 3: Seçili Yeni Nesil Takvim -->
        <div class="h-6 rounded-md ${isNewActive ? activeRange.color + '/25 border border-' + (isBaseline ? 'rose' : selectedStrategyId === 'alt2' ? 'sky' : 'emerald') + '-500/70' : 'bg-slate-950/30 border border-slate-800/40'} flex items-center justify-center text-[9px] font-mono font-bold ${activeRange.text}">
          ${isNewPlant ? '🌱EKİM' : isNewHarvest ? '🌾HASAT' : isNewActive ? '━━' : ''}
        </div>
      </div>
    `;
  }).join('');

  // Kronolojik Adımlar (Milestones)
  const milestones = isBaseline
    ? [
        { date: bp.oldLabel, title: 'Geleneksel Geç Ekim Penceresi', desc: 'Toprak nemi azalmaya başlarken yapılan klasik ekim, bitkiyi bahar hastalıklarıyla aynı takvime sokar.', dot: 'bg-rose-500' },
        { date: 'Bahar Pik Dönemi', title: '⚠️ Mantar & Sporülasyon Çakışması', desc: 'Bitkinin en hassas yapraklanma evresi yüksek nem ve ılıman gece sıcaklıklarıyla çakışarak fungisit ihtiyacını artırır.', dot: 'bg-amber-500' },
        { date: 'Yaz Ortası', title: 'Sıcak Dalgası Altında Geç Hasat', desc: 'Tane/meyve dolumu kuraklık ve >35°C sıcaklık stresine yakalanarak verim kaybı oluşturur.', dot: 'bg-rose-500' }
      ]
    : [
        { date: 'Ekimden 10 Gün Önce', title: 'Toprak Hazırlığı & Nem Kilitleme', desc: `${payload.soil.type.toUpperCase()} toprak yapısına uygun minimum toprak işleme ile mevcut nem rezervi korunur.`, dot: 'bg-slate-400' },
        { date: activeStrategy.plantingWindow, title: '🌱 Kaydırılmış Yeni Nesil Ekim Penceresi', desc: `Geleneksel tarihe göre öne çekilen ekim sayesinde kök sistemi risk zirveleri başlamadan güçlenir.`, dot: 'bg-emerald-400' },
        { date: 'İlkbahar Risk Zirvesi', title: '🛡️ Dirençli Genotip ile Hastalık Bariyeri', desc: 'Sertifikalı dirençli çeşit kullanımı mantar sporülasyon döneminde kimyasal ilaç maliyetini %60’a kadar düşürür.', dot: 'bg-sky-400' },
        { date: 'Erken Hasat Penceresi', title: '🌾 Sıcak Dalgası Öncesi Güvenli Hasat', desc: 'Hasat aşırı yaz kuraklığından önce tamamlanır; tarla ara dönem örtü bitkisine (yeşil gübre) hazırlanır.', dot: 'bg-emerald-400' }
      ];

  container.innerHTML = `
    <!-- Başlık -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-base">🗓️</span>
          <h3 class="text-sm font-bold text-white tracking-tight">Yeni Nesil Ekim Takvimi (12 Aylık Zaman Çizelgesi)</h3>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          Aktif Strateji: <strong class="${activeRange.text}">${activeStrategy.title}</strong> — <span class="font-mono">${activeRange.label}</span>
        </p>
      </div>
      <div class="flex items-center gap-3 text-[10px] font-mono">
        <span class="flex items-center gap-1 text-amber-300">🍄 Mantar Zirvesi</span>
        <span class="flex items-center gap-1 text-rose-300">☀️ Kuraklık Zirvesi</span>
      </div>
    </div>

    <!-- 12 Aylık Görsel Timeline Matrisi -->
    <div class="rounded-xl bg-slate-950/75 border border-slate-800 p-3.5 overflow-x-auto">
      <div class="flex items-stretch gap-1.5 min-w-[640px]">
        <!-- Sol Satır Etiketleri -->
        <div class="flex flex-col justify-between gap-1.5 pr-2 border-r border-slate-800 shrink-0 text-[10px] font-mono">
          <div class="h-4 text-slate-500">AYLAR</div>
          <div class="h-6 flex items-center text-amber-300">Risk Zirvesi</div>
          <div class="h-5 flex items-center text-rose-400/80">Eski Takvim</div>
          <div class="h-6 flex items-center font-bold ${activeRange.text}">Yeni Takvim</div>
        </div>

        <!-- 12 Ay Kolonları -->
        ${monthColumnsHtml}
      </div>
    </div>

    <!-- Alt 2 Kolon: Sol = Fenolojik Zaman Çizelgesi | Sağ = Dirençli Alternatif Ürünler -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">

      <!-- Sol (5 Kolon): Adım Adım Takvim Akışı -->
      <div class="lg:col-span-5 rounded-xl bg-slate-900/75 border border-slate-800 p-3.5 flex flex-col gap-3">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-300">Sezon İçi Operasyon Akışı</h4>
        <div class="flex flex-col gap-3">
          ${milestones.map(m => `
            <div class="timeline-item">
              <span class="timeline-dot ${m.dot}"></span>
              <div class="text-[10px] font-mono text-emerald-400">${m.date}</div>
              <div class="text-xs font-semibold text-white mt-0.5">${m.title}</div>
              <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">${m.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Sağ (7 Kolon): Dirençli Tohum & Ürün Alternatifleri -->
      <div class="lg:col-span-7 rounded-xl bg-slate-900/75 border border-slate-800 p-3.5 flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Önerilen Dirençli Tohum & Ürün Alternatifleri</h4>
          <span class="text-[10px] font-mono text-slate-400">HASSAS ÜRÜN YERİNE</span>
        </div>

        <div class="flex flex-col gap-2">
          ${bp.alternatives.map(alt => `
            <div class="rounded-lg bg-slate-950/75 border border-slate-800/90 p-2.5 hover:border-emerald-500/40 transition">
              <div class="flex flex-wrap items-center justify-between gap-1">
                <span class="text-xs font-bold text-white">🌿 ${alt.name}</span>
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/50">
                  Yerine: ${alt.replaces}
                </span>
              </div>
              <div class="flex flex-wrap gap-1 my-1.5">
                ${alt.tags.map(t => `
                  <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    ✓ ${t}
                  </span>
                `).join('')}
              </div>
              <p class="text-[11px] text-slate-400 leading-snug">${alt.benefit}</p>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}