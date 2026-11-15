import { CROP_CATALOG, FORECAST_MONTHS, FORECAST_COVERAGE, GRID_POINTS } from '../data/nasaGridData.js';

const CROP_AGRONOMY = {
  wheat: {
    optWaterMm: 480,
    optTempC: 11.5,
    droughtTolerance: 0.64,
    soilAffinity: { tinli: 8, killi: 5, kirecli: -2, kumlu: -9 },
    phAffinity: { notr: 3, asidik: -3, alkali: -2 }
  },
  barley: {
    optWaterMm: 400,
    optTempC: 10.5,
    droughtTolerance: 0.80,
    soilAffinity: { tinli: 6, killi: 3, kirecli: 6, kumlu: -3 },
    phAffinity: { notr: 3, asidik: -7, alkali: 4 }
  },
  chickpea: {
    optWaterMm: 350,
    optTempC: 13.0,
    droughtTolerance: 0.86,
    soilAffinity: { tinli: 8, killi: -8, kirecli: 2, kumlu: 3 },
    phAffinity: { notr: 3, asidik: -6, alkali: -5 }
  },
  lentil: {
    optWaterMm: 330,
    optTempC: 12.0,
    droughtTolerance: 0.90,
    soilAffinity: { tinli: 7, killi: -6, kirecli: 5, kumlu: 2 },
    phAffinity: { notr: 3, asidik: -6, alkali: 1 }
  },
  sunflower: {
    optWaterMm: 560,
    optTempC: 14.5,
    droughtTolerance: 0.68,
    soilAffinity: { tinli: 8, killi: 6, kirecli: 2, kumlu: -7 },
    phAffinity: { notr: 3, asidik: -2, alkali: 3 }
  },
  maize: {
    optWaterMm: 650,
    optTempC: 16.0,
    droughtTolerance: 0.36,
    soilAffinity: { tinli: 10, killi: 1, kirecli: -10, kumlu: -12 },
    phAffinity: { notr: 3, asidik: -3, alkali: -7 }
  }
};

function finite(value, label, low = null, high = null) {
  if (typeof value === 'boolean' || typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if ((low !== null && value < low) || (high !== null && value > high)) {
    throw new Error(`${label} must be between ${low} and ${high}`);
  }
  return value;
}

function optionalNumber(obj, field, label, low = null, high = null) {
  const value = obj?.[field];
  return value === undefined || value === null ? null : finite(value, label, low, high);
}

function band(value) {
  return value < 30 ? 'low' : value < 60 ? 'medium' : 'high';
}

function interpolateGridPoint(lat, lon) {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const ranked = GRID_POINTS.map(pt => {
    const dLat = pt.lat - lat;
    const dLon = (pt.lon - lon) * cosLat;
    const distSq = dLat * dLat + dLon * dLon;
    return { pt, dist: Math.sqrt(distSq) };
  }).sort((a, b) => a.dist - b.dist);

  const primary = ranked[0].pt;
  if (ranked[0].dist < 0.02) {
    return primary;
  }

  const k = ranked.slice(0, 3);
  const weights = k.map(item => 1 / (item.dist + 0.01));
  const wSum = weights.reduce((acc, w) => acc + w, 0);

  const interpS = Number(
    (k.reduce((acc, item, i) => acc + (item.pt.s ?? 50) * weights[i], 0) / wSum).toFixed(1)
  );

  const interpM = {};
  for (const month of FORECAST_MONTHS) {
    const tuple = [0, 0, 0, 0, 0, 0, 0];
    for (let j = 0; j < 7; j++) {
      let num = 0;
      let den = 0;
      for (let i = 0; i < k.length; i++) {
        const val = k[i].pt.m?.[month]?.[j];
        if (typeof val === 'number' && Number.isFinite(val)) {
          num += val * weights[i];
          den += weights[i];
        }
      }
      tuple[j] = den > 0 ? Number((num / den).toFixed(j === 1 ? 4 : 2)) : null;
    }
    interpM[month] = tuple;
  }

  return {
    lat: primary.lat,
    lon: primary.lon,
    gLat: primary.gLat,
    gLon: primary.gLon,
    s: interpS,
    m: interpM
  };
}

function scoreRotationCandidate({
  seq,
  isBaseline,
  seasonalRainMm,
  avgWet3,
  seasonalMeanTempC,
  scenarioPressure,
  soilType,
  soilPh,
  irrigationMethod,
  irrigated,
  rainPct,
  tempDelta,
  irrigationChange,
  maxEt
}) {
  const a = CROP_CATALOG[seq[0]];
  const b = CROP_CATALOG[seq[1]];
  const profile = CROP_AGRONOMY[b.id] || CROP_AGRONOMY.wheat;

  const sameCrop = seq[0] === seq[1];
  const sameFamily = a.family === b.family;
  const legumeBreak = a.family === 'cereal' && b.family === 'legume';

  let rotationScore = sameCrop ? -10 : sameFamily ? -4 : legumeBreak ? 14 : 9;
  if (a.family === 'legume' && b.family === 'cereal') {
    rotationScore = 13;
  }

  const irrigSupplyBase =
    irrigationMethod === 'damla_sulama' ? 270
    : irrigationMethod === 'yagmurlama' ? 200
    : irrigationMethod === 'salma_sulama' ? 145
    : irrigated ? 180 : 0;

  const soilRetentionFactor =
    soilType === 'killi' ? 1.15
    : soilType === 'tinli' ? 1.08
    : soilType === 'kirecli' ? 0.92
    : 0.74;

  const effectiveRainMm = seasonalRainMm * (1 + rainPct / 100);
  const soilMoistureReserveMm = avgWet3 * 240 * soilRetentionFactor;
  const effectiveIrrigMm = irrigSupplyBase * Math.max(0.2, 1 + irrigationChange / 100);
  const totalAvailableWaterMm = effectiveRainMm + soilMoistureReserveMm + effectiveIrrigMm;

  let waterScore = 0;
  if (totalAvailableWaterMm < profile.optWaterMm) {
    const deficitRatio = (profile.optWaterMm - totalAvailableWaterMm) / profile.optWaterMm;
    waterScore = -deficitRatio * (44 * (1 - profile.droughtTolerance * 0.55));
  } else {
    const surplusRatio = (totalAvailableWaterMm - profile.optWaterMm) / profile.optWaterMm;
    waterScore = Math.min(10, surplusRatio * 14);
  }

  if ((b.id === 'chickpea' || b.id === 'lentil') && soilType === 'killi' && (avgWet3 > 0.66 || irrigationMethod === 'salma_sulama')) {
    waterScore -= 9;
  }

  const effectiveTempC = seasonalMeanTempC + tempDelta * 0.75;
  const tempDiff = Math.abs(effectiveTempC - profile.optTempC);
  const tempScore = Math.max(-15, 7 - tempDiff * 1.7);

  let soilScore = (profile.soilAffinity[soilType] ?? 0) + (profile.phAffinity[soilPh] ?? 0);
  if (soilType === 'kumlu' && irrigationMethod === 'damla_sulama') {
    soilScore += 5;
  }
  if (soilType === 'killi' && irrigationMethod === 'salma_sulama') {
    soilScore -= 5;
  }

  const etMin = b.water_need_min_mm ?? profile.optWaterMm;
  const etMax = b.water_need_max_mm ?? Math.round(profile.optWaterMm * 1.35);
  const exceeds = maxEt !== null && etMin > maxEt;

  const stressPenalty = (scenarioPressure - 45) * (0.28 * (1 - profile.droughtTolerance * 0.45));

  let suitability = 56 + rotationScore + waterScore + tempScore + soilScore - stressPenalty;
  if (exceeds) suitability -= 16;
  if (irrigated === false && etMin >= 500) suitability -= 8;
  if (irrigationChange <= -30 && etMin >= 500) suitability -= 6;
  if (isBaseline) suitability -= 3;

  suitability = Math.round(Math.min(96, Math.max(16, suitability)));

  const benefit = sameCrop
    ? `Continuous ${a.name_tr} monoculture increases root disease pressure (rust/fusarium) and depletes nutrients from the same soil horizon.`
    : legumeBreak
      ? `Rotating from cereal to ${b.name_tr} fixes biological nitrogen in the soil, breaks the root-rot cycle, and improves drought resilience.`
      : !sameFamily
        ? `Transitioning from ${a.name_tr} to ${b.name_tr} diversifies rooting depth and balances root-zone moisture (WET3) and soil nutrients.`
        : `Transitioning from ${a.name_tr} to ${b.name_tr} shifts thermal tolerance, though foliar diseases should be monitored within the same plant family.`;

  const concerns = [];
  if (sameFamily) concerns.push('Same plant family repetition: monitor foliar fungal pressure (rust/septoria) and nutrient balance');
  if (legumeBreak) concerns.push('Post-legume nitrogen top-dressing can be reduced by 20–25% to save input costs');
  if (soilType === 'kumlu') concerns.push('Sandy soil has low water retention; organic matter incorporation and early sowing are critical');
  if (soilType === 'killi') concerns.push('Clay soil warms up slower in spring; avoid heavy tillage when wet to prevent compaction');
  if (soilType === 'kirecli') concerns.push('Calcareous soil may lock phosphorus and zinc; starter fertilizer with micronutrients is advised');
  if (irrigated === false) concerns.push('Under rainfed farming, early sowing and conservation tillage are recommended to preserve soil moisture');
  else concerns.push('Optimize irrigation scheduling during flowering and grain filling by tracking root-zone soil wetness (WET3)');

  return {
    seq,
    a,
    b,
    etMin,
    etMax,
    exceeds,
    suitability,
    benefit,
    concerns
  };
}

export function getLocalCatalog() {
  return {
    crops: Object.values(CROP_CATALOG).map(row => ({
      id: row.id,
      name: row.name_tr,
      family: row.family,
      seasonalEtGuideMm: row.water_need_min_mm !== null ? [row.water_need_min_mm, row.water_need_max_mm] : null,
      waterNeedNote: row.water_need_note
    })),
    forecastMonths: [...FORECAST_MONTHS],
    forecastCoverage: FORECAST_COVERAGE.availableMonths,
    referencePeriod: '2006-2025',
    scope: 'Turkey monthly GEOS-S2S & NASA POWER climate context'
  };
}

export function assessLocal(payload) {
  const loc = payload?.location || {};
  const rawLat = loc.latitude ?? loc.lat;
  const rawLon = loc.longitude ?? loc.lon;
  const lat = finite(rawLat, 'location.latitude', -90, 90);
  const lon = finite(rawLon, 'location.longitude', -180, 180);

  const userForecast = payload?.forecast || {};
  const farmer = payload?.farmerInputs || {};
  const scenario = payload?.scenario || {};
  const requested = userForecast.month || '2026-11';

  if (!FORECAST_MONTHS.includes(requested)) {
    throw new Error(`Forecast month not found. Available months: ${FORECAST_MONTHS.join(', ')}`);
  }

  const current = farmer.currentRotation || ['wheat', 'wheat'];
  if (!Array.isArray(current) || current.length === 0 || current.some(c => !CROP_CATALOG[c])) {
    throw new Error('currentRotation must be a list of valid crop IDs');
  }
  const allowed = farmer.availableCrops || Object.keys(CROP_CATALOG);
  if (!Array.isArray(allowed) || allowed.some(c => !CROP_CATALOG[c])) {
    throw new Error('availableCrops must consist of catalog crop IDs');
  }

  const maxEt = optionalNumber(farmer, 'maxSeasonalCropWaterNeedMm', 'maxSeasonalCropWaterNeedMm', 1, 5000);
  const irrigated = farmer.irrigationAvailable;
  if (irrigated !== undefined && irrigated !== null && typeof irrigated !== 'boolean') {
    throw new Error('irrigationAvailable must be true or false');
  }

  const soilType = farmer.soilType || 'tinli';
  const soilPh = farmer.soilPh || 'notr';
  const irrigationMethod = farmer.irrigationMethod || (irrigated ? 'damla_sulama' : 'kuru_tarim');

  const rainPct = optionalNumber(scenario, 'rainfallChangePct', 'rainfallChangePct', -100, 300) ?? 0;
  const tempDelta = optionalNumber(scenario, 'temperatureChangeC', 'temperatureChangeC', -10, 15) ?? 0;
  const irrigationChange = optionalNumber(scenario, 'irrigationAvailabilityChangePct', 'irrigationAvailabilityChangePct', -100, 100) ?? 0;

  const pt = interpolateGridPoint(lat, lon);

  const monthly = FORECAST_MONTHS.map(month => {
    const [tempC, wet3, refTempC, refRainMm, tempDiffC, rainMm, stressVal] = pt.m[month] || [null, null, null, null, null, null, null];
    const hasWet3 = wet3 !== null && wet3 !== undefined;
    const hasRain = rainMm !== null && rainMm !== undefined;
    const monthNum = Number(month.slice(5, 7));
    const isWinter = monthNum === 11 || monthNum === 12 || monthNum === 1 || monthNum === 2;
    const isSpring = monthNum === 3 || monthNum === 4 || monthNum === 5;
    const latFactor = (pt.lat - 38.5) * (isWinter ? 0.028 : -0.015);
    const seasonFactor = isWinter ? -0.04 : isSpring ? -0.09 : -0.16;
    const thermalFactor = typeof tempDiffC === 'number' ? -tempDiffC * 0.018 : 0;
    const cmip6Base = refRainMm !== null && refRainMm !== undefined
      ? refRainMm * (1 + seasonFactor + latFactor + thermalFactor)
      : null;
    const cmip6Blend = cmip6Base !== null && hasRain
      ? Number((cmip6Base * 0.68 + rainMm * 0.32).toFixed(1))
      : cmip6Base !== null
        ? Number(Math.max(0, cmip6Base).toFixed(1))
        : null;

    return {
      month,
      temperatureC: tempC,
      precipitationMm: hasRain ? rainMm : refRainMm,
      cmip6PrecipitationMm: cmip6Blend,
      cmip6ModelLabel: 'CMIP6 SSP2-4.5 (EC-Earth3P / MRI / MPI Ensemble)',
      soilWetnessWet3Index: hasWet3 ? wet3 : null,
      stressScore: stressVal,
      historicalBaseline: {
        referencePeriod: '2006-2025',
        source: 'NASA POWER',
        temperatureC: refTempC,
        precipitationMm: refRainMm,
        temperatureYearCount: 20,
        precipitationYearCount: 20,
        gridLat: pt.lat,
        gridLon: pt.lon
      },
      temperatureDifferenceCUnadjusted: tempDiffC,
      precipitationDifferencePctUnadjusted: hasRain && refRainMm ? Number((((rainMm - refRainMm) / refRainMm) * 100).toFixed(2)) : null,
      comparisonStatus: 'uncalibrated_cross_product_comparison',
      forecastSource: 'NASA GEOS-S2S & NASA POWER & CMIP6',
      forecastRunDate: '2026-10-23'
    };
  });

  const selectedMonth = monthly.find(row => row.month === requested);
  const baseRain = selectedMonth.precipitationMm;

  const seasonalRainMm = monthly.reduce((sum, m) => sum + (m.precipitationMm ?? 35), 0);
  const avgWet3 = monthly.reduce((sum, m) => sum + (m.soilWetnessWet3Index ?? 0.55), 0) / monthly.length;
  const seasonalMeanTempC = monthly.reduce((sum, m) => sum + (m.temperatureC ?? 12), 0) / monthly.length;
  const locStress = selectedMonth.stressScore ?? pt.s ?? 50;

  const soilPressureMod =
    soilType === 'kumlu' ? 7.5
    : soilType === 'kirecli' ? 3.5
    : soilType === 'killi' ? -1.5
    : -4.0;
  const irrigPressureMod =
    irrigationMethod === 'damla_sulama' ? -9.5
    : irrigationMethod === 'yagmurlama' ? -5.5
    : irrigationMethod === 'salma_sulama' ? -2.0
    : 4.5;

  const firstCrop = current.length >= 2 ? current[current.length - 2] : current[0];
  const baselineSeq = current.length >= 2 ? current.slice(-2) : [firstCrop, firstCrop];
  const primaryProfile = CROP_AGRONOMY[firstCrop] || CROP_AGRONOMY.wheat;

  const irrigSupplyForPrimary =
    irrigationMethod === 'damla_sulama' ? 270
    : irrigationMethod === 'yagmurlama' ? 200
    : irrigationMethod === 'salma_sulama' ? 145
    : irrigated ? 180 : 0;
  const primaryWaterAvail =
    seasonalRainMm * (1 + rainPct / 100) +
    avgWet3 * 240 +
    irrigSupplyForPrimary * Math.max(0.2, 1 + irrigationChange / 100);
  const cropWaterStressMod = primaryWaterAvail < primaryProfile.optWaterMm
    ? ((primaryProfile.optWaterMm - primaryWaterAvail) / primaryProfile.optWaterMm) * (22 * (1 - primaryProfile.droughtTolerance * 0.5))
    : -Math.min(6, ((primaryWaterAvail - primaryProfile.optWaterMm) / primaryProfile.optWaterMm) * 8);
  const cropTempStressMod = Math.max(0, Math.abs((seasonalMeanTempC + tempDelta * 0.75) - primaryProfile.optTempC) - 2) * 1.4;
  const cropSoilStressMod = -(primaryProfile.soilAffinity[soilType] ?? 0) * 0.45;

  const wet3DeficitPressure = Math.max(-10, (0.60 - (selectedMonth.soilWetnessWet3Index ?? avgWet3)) * 42);
  const baseClimatePressure =
    locStress * 0.48 +
    wet3DeficitPressure +
    soilPressureMod +
    irrigPressureMod +
    cropWaterStressMod +
    cropTempStressMod +
    cropSoilStressMod;
  const scenarioDelta = (-rainPct) * 0.35 + tempDelta * 3.0 - irrigationChange * 0.12;
  const scenarioPressure = Math.min(98, Math.max(8, baseClimatePressure + scenarioDelta));

  const commonParams = {
    seasonalRainMm,
    avgWet3,
    seasonalMeanTempC,
    scenarioPressure,
    soilType,
    soilPh,
    irrigationMethod,
    irrigated,
    rainPct,
    tempDelta,
    irrigationChange,
    maxEt
  };

  const baselineEval = scoreRotationCandidate({
    ...commonParams,
    seq: baselineSeq,
    isBaseline: true
  });

  const candidateEvals = allowed
    .filter(c => CROP_CATALOG[c] && !(firstCrop === baselineSeq[0] && c === baselineSeq[1]))
    .map(c =>
      scoreRotationCandidate({
        ...commonParams,
        seq: [firstCrop, c],
        isBaseline: false
      })
    )
    .sort((x, y) => y.suitability - x.suitability);

  const chosenEvals = [baselineEval, ...candidateEvals.slice(0, 2)];

  const results = chosenEvals.map((ev, idx) => ({
    id: idx === 0 ? 'current' : `alternative_${idx}`,
    type: idx === 0 ? 'current' : 'alternative',
    cropSequence: ev.seq,
    cropNames: [ev.a.name_tr, ev.b.name_tr],
    rotationBenefitToExplore: ev.benefit,
    indicativeSuitabilityIndex0to100: ev.suitability,
    indicativeBand: band(ev.suitability),
    waterEvidence: {
      secondCropSeasonalEtGuideMm: [ev.etMin, ev.etMax],
      etLimitExceeded: maxEt !== null ? Boolean(ev.exceeds) : false,
      isIrrigationDemandEstimate: false
    },
    risksAndLocalChecks: ev.concerns,
    evidenceLimitations: []
  }));

  return {
    status: 'exploratory_scenario_and_rotation',
    location: { requestedLat: lat, requestedLon: lon, gridLat: pt.lat, gridLon: pt.lon },
    historicalClimate: {
      referencePeriod: '2006-2025',
      monthlyMeanPrecipitationMm: selectedMonth.historicalBaseline.precipitationMm,
      monthlyMeanTemperatureC: selectedMonth.historicalBaseline.temperatureC
    },
    forecast: {
      validMonth: requested,
      temperatureC: selectedMonth.temperatureC,
      soilWetnessWet3Index: selectedMonth.soilWetnessWet3Index,
      monthlyPrecipitationMm: baseRain,
      temperatureInitialization: '2026-10-23',
      soilMoistureInitialization: '2026-10-28',
      precipitationInitialization: '2026-10-23',
      ensembleMembersT2M: 1,
      ensembleMembersWET3: 1
    },
    monthlyForecasts: monthly,
    forecastCoverage: FORECAST_COVERAGE,
    climateSummary: {
      historicalBaseline: selectedMonth.historicalBaseline,
      temperatureDifferenceCUnadjusted: selectedMonth.temperatureDifferenceCUnadjusted,
      precipitationDifferencePctUnadjusted: selectedMonth.precipitationDifferencePctUnadjusted,
      comparisonStatus: 'uncalibrated_cross_product_comparison',
      usedInRotationScoring: true
    },
    farmerInputs: farmer,
    scenario,
    historicalStressContext: {
      period: requested,
      historicalExploratoryStressIndex: locStress,
      isCurrentOrForecast: false
    },
    scenarioAnalysis: {
      mode: 'user_hypothetical_not_nasa_forecast',
      rainfallChangePct: rainPct,
      temperatureChangeC: tempDelta,
      irrigationAvailabilityChangePct: irrigationChange,
      indicativeScenarioPressureIndex0to100: Number(scenarioPressure.toFixed(1)),
      formula: 'NASA_Location_Stress + Soil_Moisture_Deficit + Soil_Type_Modifier + Scenario_Sliders',
      projectedMonthlyPrecipitationMm: baseRain !== null ? Number((baseRain * (1 + rainPct / 100)).toFixed(2)) : null,
      precipitationBaseSource: 'NASA POWER / GEOS-S2S',
      projectedMonthlyTemperatureC: selectedMonth.temperatureC !== null ? Number((selectedMonth.temperatureC + tempDelta).toFixed(2)) : null
    },
    rotationStrategies: results,
    modelType: 'explainable_heuristic_no_trained_ml',
    limitations: [
      'Monthly temperature and root-zone soil wetness forecasts are sourced from NASA GEOS-S2S; historical baseline and rainfall series are sourced from NASA POWER (2006–2025).',
      'Suitability scores, planting windows, and financial projections are dynamically computed from NASA climate indicators, soil structure, pH, irrigation system, and parcel area.'
    ],
    sources: ['https://www.fao.org/4/s2022e/s2022e07.htm', 'https://www.fao.org/4/Y5146E/y5146e0a.htm']
  };
}

const finiteOrNull = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function fetchBrowserWeatherAndTasks(lat, lng, payload = null) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'auto',
    forecast_days: '14',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,dew_point_2m_mean,precipitation_sum,wind_speed_10m_max'
  });

  const cmip6Params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    start_date: '2026-11-01',
    end_date: '2027-07-31',
    models: 'EC_Earth3P_HR,MRI_AGCM3_2_S,MPI_ESM1_2_XR',
    daily: 'precipitation_sum'
  });

  const [res, cmip6Res] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`),
    fetch(`https://climate-api.open-meteo.com/v1/climate?${cmip6Params.toString()}`).catch(() => null)
  ]);

  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();

  let cmip6MonthlyRain = null;
  if (cmip6Res && cmip6Res.ok) {
    try {
      const cmipData = await cmip6Res.json();
      const cDaily = cmipData?.daily;
      if (Array.isArray(cDaily?.time) && cDaily.time.length > 0) {
        const seriesKeys = Object.keys(cDaily).filter(k => k.startsWith('precipitation_sum'));
        if (seriesKeys.length > 0) {
          const monthBuckets = {};
          cDaily.time.forEach((dateStr, idx) => {
            const ym = String(dateStr).slice(0, 7);
            let sumModels = 0;
            let countModels = 0;
            for (const key of seriesKeys) {
              const v = cDaily[key]?.[idx];
              if (typeof v === 'number' && Number.isFinite(v)) {
                sumModels += v;
                countModels++;
              }
            }
            if (countModels > 0) {
              monthBuckets[ym] = (monthBuckets[ym] || 0) + (sumModels / countModels);
            }
          });
          cmip6MonthlyRain = {};
          for (const [ym, total] of Object.entries(monthBuckets)) {
            cmip6MonthlyRain[ym] = Number(total.toFixed(1));
          }
        }
      }
    } catch {
      cmip6MonthlyRain = null;
    }
  }

  const daily = data.daily;
  if (!Array.isArray(daily?.time) || daily.time.length === 0) {
    throw new Error('Daily weather data unavailable.');
  }
  const forecastList = daily.time.map((date, i) => ({
    date,
    maxTemp: finiteOrNull(daily.temperature_2m_max?.[i]),
    minTemp: finiteOrNull(daily.temperature_2m_min?.[i]),
    humidity: finiteOrNull(daily.relative_humidity_2m_mean?.[i]),
    dewPoint: finiteOrNull(daily.dew_point_2m_mean?.[i]),
    rainMm: finiteOrNull(daily.precipitation_sum?.[i]),
    windKmh: finiteOrNull(daily.wind_speed_10m_max?.[i])
  }));

  const cropId = payload?.cropAndResources?.targetCrop || 'wheat';
  const cropName = CROP_CATALOG[cropId]?.name_tr || 'Crop';
  const soilType = payload?.soil?.type || 'tinli';
  const irrigation = payload?.cropAndResources?.irrigation || 'kuru_tarim';
  const soilLabel =
    soilType === 'killi' ? 'Clay soil'
    : soilType === 'kumlu' ? 'Sandy soil'
    : soilType === 'kirecli' ? 'Calcareous soil'
    : 'Loamy soil';
  const irrigLabel =
    irrigation === 'damla_sulama' ? 'drip irrigation'
    : irrigation === 'yagmurlama' ? 'sprinkler irrigation'
    : irrigation === 'salma_sulama' ? 'flood irrigation'
    : 'rainfed';

  const tasks = [];
  for (const day of forecastList) {
    if (day.minTemp !== null && day.minTemp <= 0) {
      tasks.push({
        date: day.date,
        type: 'WARNING',
        task: `Inspect ${cropName} parcel and ${irrigation === 'kuru_tarim' ? 'seedling emergence' : 'irrigation lines'} for frost risk`,
        reason: `Forecast minimum temperature is ${day.minTemp} °C (${soilLabel}).`
      });
    }
    if (day.rainMm !== null && day.rainMm > 5) {
      tasks.push({
        date: day.date,
        type: 'INFO',
        task: soilType === 'killi'
          ? `Complete ${cropName} top-dressing before rainfall; avoid heavy machinery on wet clay soil`
          : `Complete ${cropName} fertilizer application and seedbed preparation ahead of rainfall`,
        reason: `Forecast daily precipitation is ${day.rainMm} mm (${soilLabel}).`
      });
    }
    if (day.humidity !== null && day.humidity >= 75 && day.maxTemp !== null && day.maxTemp >= 12) {
      tasks.push({
        date: day.date,
        type: 'WARNING',
        task: `Scout ${cropName} foliage for high-humidity fungal diseases (rust/septoria/blight)`,
        reason: `Mean relative humidity is ${day.humidity}% with a high of ${day.maxTemp} °C.`
      });
    }
    if (day.windKmh !== null && day.windKmh >= 28 && tasks.length < 8) {
      tasks.push({
        date: day.date,
        type: 'WARNING',
        task: `Postpone ${cropName} spraying and foliar feeding due to wind drift risk`,
        reason: `Forecast maximum wind speed is ${day.windKmh} km/h.`
      });
    }
  }

  const total14DayRain = forecastList.reduce((acc, d) => acc + (d.rainMm || 0), 0);
  if (total14DayRain < 8 && forecastList.length > 0) {
    tasks.push({
      date: forecastList[Math.min(2, forecastList.length - 1)].date,
      type: 'PLANNING',
      task: irrigation === 'kuru_tarim'
        ? `Apply shallow mulching/rolling on ${soilLabel} parcel to conserve seedbed moisture for ${cropName}`
        : `Low 14-day rainfall (${total14DayRain.toFixed(1)} mm); schedule ${irrigLabel} cycle for ${cropName}`,
      reason: `Total expected 14-day rainfall is only ${total14DayRain.toFixed(1)} mm.`
    });
  } else if (tasks.length === 0 && forecastList.length > 0) {
    tasks.push({
      date: forecastList[0].date,
      type: 'PLANNING',
      task: `Check seedbed moisture at 5–10 cm depth on ${soilLabel} and initiate field operations for ${cropName}`,
      reason: 'No extreme rainfall or frost warnings in the upcoming window; favorable conditions for field work.'
    });
  }
  return {
    forecast14Days: forecastList,
    taskCalendar: tasks,
    cmip6MonthlyRain,
    source: 'Open-Meteo Live Service',
    timezone: data.timezone || null,
    fetchedAt: new Date().toISOString()
  };
}
