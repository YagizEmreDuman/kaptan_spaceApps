import { REGIONAL_CLIMATE_DB, SOIL_LABELS } from '../data/climateData.js';
import { CROP_ROTATION_TEMPLATES } from '../data/rotationData.js';

export function runAgronomySimulation(payload) {
  let baseProfile = REGIONAL_CLIMATE_DB[payload.location.region];
  if (!baseProfile) {
    const latFactor = Math.max(0, (42 - payload.location.latitude) * 1.4);
    baseProfile = {
      name: `Özel Parsel (${payload.location.latitude.toFixed(2)}°K)`,
      rain2026: [62, 54, 48, 42, 34, 18, 6, 5, 14, 34, 52, 65],
      rainHist: [70, 60, 54, 46, 40, 24, 10, 8, 18, 40, 58, 72],
      temp2026: [4, 5.8, 9.5, 14.5, 19.8, 24.8, 28.2, 28.0, 23.1, 16.8, 10.4, 5.5].map(t => +(t + latFactor * 0.4).toFixed(1)),
      baseFungal: [25, 32, 46, 68, 74, 45, 18, 16, 26, 40, 32, 26],
      baseDrought: [16, 20, 28, 42, 58, 76, 88, 90, 75, 50, 30, 18],
      frostRisk: Math.round(Math.min(75, Math.max(15, (payload.location.latitude - 35) * 9))),
      gddShift: '+15 gün erken',
      heatWaveDays: '24 gün (>35°C)'
    };
  }

  // Simülasyon Panelinden Gelen Yağış Anomalisi (%)
  const rainDeltaPct = payload.simOverrides?.rainDeltaPct ?? 0;
  const adjustedRain2026 = baseProfile.rain2026.map(r =>
    Math.max(0, Math.round(r * (1 + rainDeltaPct / 100)))
  );

  const profile = {
    ...baseProfile,
    rain2026: adjustedRain2026
  };

  let fungalBonus = Math.round(rainDeltaPct * 0.25);
  let droughtBonus = Math.round(-rainDeltaPct * 0.45);

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