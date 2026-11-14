import { REGIONAL_CLIMATE_DB, SOIL_LABELS } from '../data/climateData.js';
import { CROP_ROTATION_TEMPLATES } from '../data/rotationData.js';

// Güney Yarımküre (lat < 0) için 12 aylık veriyi 6 ay kaydırır (Ocak <-> Temmuz)
function shiftSixMonths(arr) {
  return [...arr.slice(6), ...arr.slice(0, 6)];
}

// Dünya haritasında serbest tıklanan herhangi bir koordinat için enlem bazlı iklim profili üretir
function buildGlobalCoordinateProfile(lat, lng) {
  const absLat = Math.abs(lat);
  const isSouthern = lat < 0;
  const hemiLabel = isSouthern ? 'G' : 'K';
  const lonLabel = lng < 0 ? 'B' : 'D';

  let rainBase, tempBase, fungalBase, droughtBase, frostRisk, heatWaveDays;

  if (absLat < 23.5) {
    // Tropikal Kuşak (Ekvator çevresi: sıcak ve nemli)
    rainBase = [190, 180, 175, 140, 95, 65, 55, 60, 85, 130, 165, 185];
    tempBase = [26.5, 26.8, 27.0, 26.8, 26.0, 25.2, 25.0, 25.5, 26.2, 26.6, 26.6, 26.5];
    fungalBase = [80, 82, 78, 68, 52, 40, 36, 38, 48, 64, 74, 78];
    droughtBase = [18, 18, 22, 32, 48, 62, 68, 65, 50, 34, 22, 18];
    frostRisk = 5;
    heatWaveDays = '38 gün (>35°C)';
  } else if (absLat < 38) {
    // Subtropikal / Akdeniz & Kurak Kuşak
    rainBase = [58, 50, 44, 34, 22, 8, 3, 4, 12, 32, 48, 60];
    tempBase = [9.5, 11.0, 14.2, 18.2, 22.8, 27.2, 30.1, 29.8, 26.0, 20.5, 14.6, 10.6];
    fungalBase = [30, 36, 52, 68, 60, 30, 14, 14, 24, 42, 36, 32];
    droughtBase = [18, 22, 30, 46, 66, 84, 93, 92, 76, 50, 30, 20];
    frostRisk = 22;
    heatWaveDays = '36 gün (>35°C)';
  } else if (absLat < 52) {
    // Orta Enlem / Ilıman Tarım Kuşağı
    rainBase = [54, 48, 52, 56, 64, 60, 48, 44, 50, 56, 58, 56];
    tempBase = [1.5, 3.2, 7.6, 12.8, 17.8, 22.0, 24.8, 24.4, 19.8, 13.8, 7.5, 2.8];
    fungalBase = [24, 30, 45, 68, 76, 66, 46, 40, 48, 46, 34, 26];
    droughtBase = [14, 16, 22, 32, 46, 62, 74, 76, 58, 36, 20, 15];
    frostRisk = 54;
    heatWaveDays = '18 gün (>35°C)';
  } else {
    // Yüksek Enlem / Soğuk Kuşak
    rainBase = [42, 36, 38, 42, 52, 66, 74, 72, 60, 54, 48, 45];
    tempBase = [-6.0, -4.5, 0.5, 6.8, 12.6, 16.8, 19.0, 18.1, 13.2, 7.2, 1.2, -3.8];
    fungalBase = [15, 18, 28, 46, 64, 74, 76, 72, 56, 38, 22, 16];
    droughtBase = [10, 12, 16, 24, 34, 44, 50, 48, 34, 20, 14, 10];
    frostRisk = 76;
    heatWaveDays = '5 gün (>35°C)';
  }

  // Güney Yarımküre'deyse mevsimleri 6 ay tersine çevir
  const finalRain2026 = isSouthern ? shiftSixMonths(rainBase) : rainBase;
  const finalRainHist = finalRain2026.map(r => Math.round(r * 1.1));
  const finalTemp2026 = isSouthern ? shiftSixMonths(tempBase) : tempBase;
  const finalFungal = isSouthern ? shiftSixMonths(fungalBase) : fungalBase;
  const finalDrought = isSouthern ? shiftSixMonths(droughtBase) : droughtBase;

  return {
    name: `Global Parsel (${absLat.toFixed(2)}°${hemiLabel}, ${Math.abs(lng).toFixed(2)}°${lonLabel})`,
    rain2026: finalRain2026,
    rainHist: finalRainHist,
    temp2026: finalTemp2026,
    baseFungal: finalFungal,
    baseDrought: finalDrought,
    frostRisk,
    gddShift: '+15 gün erken',
    heatWaveDays
  };
}

export function runAgronomySimulation(payload) {
  let baseProfile = REGIONAL_CLIMATE_DB[payload.location.region];
  if (!baseProfile) {
    baseProfile = buildGlobalCoordinateProfile(
      payload.location.latitude,
      payload.location.longitude
    );
  }

  const rainDeltaPct = payload.simOverrides?.rainDeltaPct ?? 0;
  const humidityInc = payload.simOverrides?.humidityIncrease ?? 0;

  const adjustedRain2026 = baseProfile.rain2026.map(r =>
    Math.max(0, Math.round(r * (1 + rainDeltaPct / 100)))
  );

  const profile = {
    ...baseProfile,
    rain2026: adjustedRain2026
  };

  let fungalBonus = Math.round(rainDeltaPct * 0.25 + humidityInc * 0.45);
  let droughtBonus = Math.round(-rainDeltaPct * 0.45 - humidityInc * 0.2);

  if (payload.soil.type === 'killi') fungalBonus += 14;
  if (payload.soil.type === 'kumlu') droughtBonus += 15;
  if (payload.cropAndResources.irrigation === 'kuru_tarim') droughtBonus += 18;
  if (payload.cropAndResources.irrigation === 'salma_sulama') fungalBonus += 12;
  if (payload.cropAndResources.irrigation === 'damla_sulama') droughtBonus -= 10;

  const monthlyFungal = profile.baseFungal.map(v => Math.min(98, Math.max(5, v + fungalBonus)));
  const monthlyDrought = profile.baseDrought.map(v => Math.min(99, Math.max(5, v + droughtBonus)));

  const peakFungal = Math.max(...monthlyFungal);
  const peakDrought = Math.max(...monthlyDrought);
  const frostRisk = profile.frostRisk;
  const estYieldLoss = Math.min(75, Math.max(6, Math.round((peakFungal * 0.16) + (peakDrought * 0.18))));

  const cropKey = payload.cropAndResources.targetCrop;
  const tpl = CROP_ROTATION_TEMPLATES[cropKey] || CROP_ROTATION_TEMPLATES.bugday;
  const strategies = buildStrategies(payload, tpl, peakFungal, peakDrought, estYieldLoss);

  return {
    payload,
    profile,
    cropLabel: tpl.label,
    soilLabel: SOIL_LABELS[payload.soil.type],
    monthlyFungal,
    monthlyDrought,
    peakFungal,
    peakDrought,
    frostRisk,
    estYieldLoss,
    strategies
  };
}

function buildStrategies(payload, tpl, peakFungal, peakDrought, estYieldLoss) {
  const area = Math.max(1, payload.soil.areaDekar);
  const budget = payload.cropAndResources.budgetLevel;
  const irrigation = payload.cropAndResources.irrigation;
  const hasMibzer = payload.cropAndResources.machinery.includes('mibzer');

  const baselineNetPerDekar = Math.round(tpl.baseRevenuePerDekar * (1 - estYieldLoss / 100));
  const baselineTotal = baselineNetPerDekar * area;

  const alt1Fungal = Math.max(12, Math.round(peakFungal * 0.42));
  const alt1Drought = Math.max(15, Math.round(peakDrought * 0.56));
  const alt1WaterSave = irrigation === 'kuru_tarim' ? 14 : 22;
  const alt1YieldGainPct = Math.round(estYieldLoss * 0.78 + 6);
  const alt1Total = Math.round(baselineTotal * (1 + alt1YieldGainPct / 100));

  const alt2Fungal = Math.max(8, Math.round(peakFungal * 0.25));
  const alt2Drought = Math.max(10, Math.round(peakDrought * 0.38));
  const alt2WaterSave = irrigation === 'kuru_tarim' ? 24 : 35;
  const alt2YieldGainPct = Math.round(estYieldLoss * 0.92 + 11);
  const alt2Total = Math.round(baselineTotal * (1 + alt2YieldGainPct / 100));

  const budgetLabelMap = { dusuk: 'Ekonomik Bütçe', orta: 'Dengeli Bütçe', yuksek: 'Esnek / Hibrit Bütçe' };

  return [
    {
      id: 'baseline',
      selectedClass: 'selected-baseline',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      accentText: 'text-rose-400',
      ...tpl.baseline,
      fungalRisk: peakFungal,
      droughtRisk: peakDrought,
      waterSaving: 0,
      yieldDeltaText: `-%${estYieldLoss} Kayıp Riski`,
      financialTotal: baselineTotal,
      financialDiffText: `Referans Senaryo (${area} da)`,
      equipmentNote: 'Mevcut ekipman düzeni (Yüksek fungisit ihtiyacı)'
    },
    {
      id: 'alt1',
      selectedClass: 'selected-alt1',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      accentText: 'text-emerald-400',
      ...tpl.alt1,
      fungalRisk: alt1Fungal,
      droughtRisk: alt1Drought,
      waterSaving: alt1WaterSave,
      yieldDeltaText: `+%${alt1YieldGainPct} Verim Koruma`,
      financialTotal: alt1Total,
      financialDiffText: `+${(alt1Total - baselineTotal).toLocaleString('tr-TR')} ₺ Net Kazanç Farkı`,
      equipmentNote: budget === 'dusuk' ? 'Sertifikalı tohum desteği ile bütçeye uygun' : `${budgetLabelMap[budget]} ile tam uyumlu`
    },
    {
      id: 'alt2',
      selectedClass: 'selected-alt2',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
      accentText: 'text-sky-400',
      ...tpl.alt2,
      fungalRisk: alt2Fungal,
      droughtRisk: alt2Drought,
      waterSaving: alt2WaterSave,
      yieldDeltaText: `+%${alt2YieldGainPct} Maksimum Kazanç`,
      financialTotal: alt2Total,
      financialDiffText: `+${(alt2Total - baselineTotal).toLocaleString('tr-TR')} ₺ Net Kazanç Farkı`,
      equipmentNote: `${budgetLabelMap[budget]} & ${hasMibzer ? 'Mevcut Mibzer' : 'Standart Ekipman'} uyumlu`
    }
  ];
}