<<<<<<< HEAD
﻿import { SOIL_LABELS } from '../data/climateData.js';
import { normalizeRotationStrategies } from '../data/rotationData.js';

export const finiteNumber = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
=======
import { REGIONAL_CLIMATE_DB } from '../data/climateData.js';
import { getCropRotationTemplate } from '../data/rotationData.js';
import { t } from './i18nManager.js';

function shiftSixMonths(arr) {
  return [...arr.slice(6), ...arr.slice(0, 6)];
}

function buildGlobalCoordinateProfile(lat, lng) {
  const absLat = Math.abs(lat);
  const isSouthern = lat < 0;
  const hemiLabel = isSouthern ? 'S' : 'N';
  const lonLabel = lng < 0 ? 'W' : 'E';

  let rainBase, tempBase, fungalBase, droughtBase, frostRisk, heatDays;

  if (absLat < 23.5) {
    rainBase = [190, 180, 175, 140, 95, 65, 55, 60, 85, 130, 165, 185];
    tempBase = [26.5, 26.8, 27.0, 26.8, 26.0, 25.2, 25.0, 25.5, 26.2, 26.6, 26.6, 26.5];
    fungalBase = [80, 82, 78, 68, 52, 40, 36, 38, 48, 64, 74, 78];
    droughtBase = [18, 18, 22, 32, 48, 62, 68, 65, 50, 34, 22, 18];
    frostRisk = 5;
    heatDays = 38;
  } else if (absLat < 38) {
    rainBase = [58, 50, 44, 34, 22, 8, 3, 4, 12, 32, 48, 60];
    tempBase = [9.5, 11.0, 14.2, 18.2, 22.8, 27.2, 30.1, 29.8, 26.0, 20.5, 14.6, 10.6];
    fungalBase = [30, 36, 52, 68, 60, 30, 14, 14, 24, 42, 36, 32];
    droughtBase = [18, 22, 30, 46, 66, 84, 93, 92, 76, 50, 30, 20];
    frostRisk = 22;
    heatDays = 36;
  } else if (absLat < 52) {
    rainBase = [54, 48, 52, 56, 64, 60, 48, 44, 50, 56, 58, 56];
    tempBase = [1.5, 3.2, 7.6, 12.8, 17.8, 22.0, 24.8, 24.4, 19.8, 13.8, 7.5, 2.8];
    fungalBase = [24, 30, 45, 68, 76, 66, 46, 40, 48, 46, 34, 26];
    droughtBase = [14, 16, 22, 32, 46, 62, 74, 76, 58, 36, 20, 15];
    frostRisk = 54;
    heatDays = 18;
  } else {
    rainBase = [42, 36, 38, 42, 52, 66, 74, 72, 60, 54, 48, 45];
    tempBase = [-6.0, -4.5, 0.5, 6.8, 12.6, 16.8, 19.0, 18.1, 13.2, 7.2, 1.2, -3.8];
    fungalBase = [15, 18, 28, 46, 64, 74, 76, 72, 56, 38, 22, 16];
    droughtBase = [10, 12, 16, 24, 34, 44, 50, 48, 34, 20, 14, 10];
    frostRisk = 76;
    heatDays = 5;
  }

  const finalRain2026 = isSouthern ? shiftSixMonths(rainBase) : rainBase;
  const finalRainHist = finalRain2026.map(r => Math.round(r * 1.1));
  const finalTemp2026 = isSouthern ? shiftSixMonths(tempBase) : tempBase;
  const finalFungal = isSouthern ? shiftSixMonths(fungalBase) : fungalBase;
  const finalDrought = isSouthern ? shiftSixMonths(droughtBase) : droughtBase;
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d

// A display adapter, with no browser-side agronomy or substitute climate model.
export function buildDashboardData(payload, prediction = null, weather = null, metadata = null) {
  const monthlyForecasts = Array.isArray(prediction?.monthlyForecasts)
    ? [...prediction.monthlyForecasts].sort((a, b) => a.month.localeCompare(b.month)) : [];
  const crop = metadata?.crops?.find(item => item.id === payload.cropAndResources.targetCrop);
  return {
<<<<<<< HEAD
    payload, prediction, metadata,
    cropLabel: crop?.name || payload.cropAndResources.targetCrop || 'Ürün seçilmedi',
    soilLabel: SOIL_LABELS[payload.soil.type] || payload.soil.type,
    profile: { name: payload.location.label || 'Seçilen konum' },
    monthlyForecasts,
    strategies: normalizeRotationStrategies(prediction?.rotationStrategies),
    apiForecast14Days: Array.isArray(weather?.forecast14Days) ? weather.forecast14Days : [],
    apiTaskCalendar: Array.isArray(weather?.taskCalendar) ? weather.taskCalendar : [],
    weatherSource: weather?.source || null,
    weatherFetchedAt: weather?.fetchedAt || null,
    weatherTimezone: weather?.timezone || null
  };
}
=======
    name: `${t('global_parcel')} (${absLat.toFixed(2)}°${hemiLabel}, ${Math.abs(lng).toFixed(2)}°${lonLabel})`,
    rain2026: finalRain2026,
    rainHist: finalRainHist,
    temp2026: finalTemp2026,
    baseFungal: finalFungal,
    baseDrought: finalDrought,
    frostRisk,
    gddShift: t('gdd_early'),
    heatWaveDays: t('heat_days_tpl', { d: heatDays })
  };
}

export function runAgronomySimulation(payload) {
  const regionKey = payload.location.region;
  const rawDbProfile = REGIONAL_CLIMATE_DB[regionKey];

  let baseProfile;
  if (rawDbProfile) {
    const localizedRegionName = t(`region_${regionKey}`).replace(/^[^\s]+\s/, '');
    const heatNum = parseInt(rawDbProfile.heatWaveDays, 10) || 25;
    baseProfile = {
      ...rawDbProfile,
      name: localizedRegionName,
      gddShift: t('gdd_early'),
      heatWaveDays: t('heat_days_tpl', { d: heatNum })
    };
  } else {
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
  const tpl = getCropRotationTemplate(cropKey);
  const strategies = buildStrategies(payload, tpl, peakFungal, peakDrought, estYieldLoss);

  return {
    payload,
    profile,
    cropLabel: t(`crop_name_${cropKey}`),
    soilLabel: t(`soil_name_${payload.soil.type}`),
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
  const irrigation = payload.cropAndResources.irrigation;

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

  return [
    {
      id: 'baseline',
      selectedClass: 'selected-baseline',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      badge: t('badge_baseline'),
      ...tpl.baseline,
      fungalRisk: peakFungal,
      droughtRisk: peakDrought,
      waterSaving: 0,
      yieldDeltaText: t('yield_loss_tag', { val: estYieldLoss }),
      financialTotal: baselineTotal,
      financialDiffText: t('ref_scenario', { area })
    },
    {
      id: 'alt1',
      selectedClass: 'selected-alt1',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      badge: t('badge_alt1'),
      ...tpl.alt1,
      fungalRisk: alt1Fungal,
      droughtRisk: alt1Drought,
      waterSaving: alt1WaterSave,
      yieldDeltaText: t('yield_save_tag', { val: alt1YieldGainPct }),
      financialTotal: alt1Total,
      financialDiffText: t('net_diff_text', { diff: (alt1Total - baselineTotal).toLocaleString() })
    },
    {
      id: 'alt2',
      selectedClass: 'selected-alt2',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
      badge: t('badge_alt2'),
      ...tpl.alt2,
      fungalRisk: alt2Fungal,
      droughtRisk: alt2Drought,
      waterSaving: alt2WaterSave,
      yieldDeltaText: t('yield_max_tag', { val: alt2YieldGainPct }),
      financialTotal: alt2Total,
      financialDiffText: t('net_diff_text', { diff: (alt2Total - baselineTotal).toLocaleString() })
    }
  ];
}
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
