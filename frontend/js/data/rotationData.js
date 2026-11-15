const CROP_BASE_REVENUE_PER_DEKAR = {
  wheat: 4450,
  barley: 3980,
  chickpea: 5350,
  lentil: 5120,
  sunflower: 5650,
  maize: 7450
};

const CROP_WATER_NEED_MM = {
  wheat: 520,
  barley: 420,
  chickpea: 350,
  lentil: 330,
  sunflower: 620,
  maize: 680
};

const SOIL_CROP_YIELD_FACTOR = {
  wheat: { tinli: 1.09, killi: 1.04, kirecli: 0.94, kumlu: 0.81 },
  barley: { tinli: 1.06, killi: 1.01, kirecli: 1.04, kumlu: 0.89 },
  chickpea: { tinli: 1.08, killi: 0.83, kirecli: 0.97, kumlu: 0.95 },
  lentil: { tinli: 1.07, killi: 0.85, kirecli: 1.03, kumlu: 0.92 },
  sunflower: { tinli: 1.10, killi: 1.05, kirecli: 0.96, kumlu: 0.84 },
  maize: { tinli: 1.14, killi: 0.98, kirecli: 0.82, kumlu: 0.76 }
};

const PH_CROP_YIELD_FACTOR = {
  wheat: { notr: 1.03, asidik: 0.93, alkali: 0.95 },
  barley: { notr: 1.03, asidik: 0.88, alkali: 1.02 },
  chickpea: { notr: 1.04, asidik: 0.89, alkali: 0.91 },
  lentil: { notr: 1.03, asidik: 0.90, alkali: 0.98 },
  sunflower: { notr: 1.03, asidik: 0.94, alkali: 1.01 },
  maize: { notr: 1.04, asidik: 0.93, alkali: 0.87 }
};

const CROP_BASE_SOWING_DOY = {
  wheat: { doy: 290, span: 12, isSpring: false },      // ~17 Ekim
  barley: { doy: 293, span: 12, isSpring: false },     // ~20 Ekim
  lentil: { doy: 286, span: 12, isSpring: false },     // ~13 Ekim
  chickpea: { doy: 76, span: 12, isSpring: true },     // ~17 Mart
  sunflower: { doy: 106, span: 12, isSpring: true },   // ~16 Nisan
  maize: { doy: 116, span: 12, isSpring: true }        // ~26 Nisan
};

const TR_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

function formatDoyRange(startDoy, spanDays) {
  const baseYear = 2026;
  const d1 = new Date(Date.UTC(baseYear, 0, startDoy));
  const d2 = new Date(Date.UTC(baseYear, 0, startDoy + spanDays));
  const day1 = d1.getUTCDate();
  const m1 = TR_MONTH_NAMES[d1.getUTCMonth()];
  const day2 = d2.getUTCDate();
  const m2 = TR_MONTH_NAMES[d2.getUTCMonth()];
  if (m1 === m2) {
    return `${day1}–${day2} ${m1}`;
  }
  return `${day1} ${m1} – ${day2} ${m2}`;
}

function buildDynamicPlantingWindow({
  cropId,
  idx,
  tempC,
  tempDiffC,
  locStress,
  wet3,
  soilType,
  irrigation,
  scenarioTempDelta
}) {
  const base = CROP_BASE_SOWING_DOY[cropId] || CROP_BASE_SOWING_DOY.wheat;

  // Regional thermal offset for baseline sowing:
  // Warmer regions sow autumn crops slightly later and spring crops earlier.
  const thermalDelta = tempC - 10.5;
  const regionalBaselineOffset = base.isSpring
    ? Math.round(-thermalDelta * 1.35)
    : Math.round(thermalDelta * 0.85);

  const baselineStartDoy = base.doy + Math.max(-14, Math.min(14, regionalBaselineOffset));

  if (idx === 0) {
    return `${formatDoyRange(baselineStartDoy, base.span)} (Bölgesel Klasik Takvim)`;
  }

  const soilShiftDays =
    soilType === 'kumlu' ? 4
    : soilType === 'tinli' ? 1
    : soilType === 'kirecli' ? -1
    : -4; // killi warms slower and holds moisture longer

  const irrigShiftDays =
    irrigation === 'kuru_tarim' ? 3
    : irrigation === 'damla_sulama' ? -2
    : irrigation === 'yagmurlama' ? -1
    : 1;

  const stressShift = Math.round((locStress - 35) * 0.16 + (0.62 - wet3) * 14);
  const anomShift = Math.round((tempDiffC + scenarioTempDelta) * 1.45);
  const strategyBonus = idx === 1 ? 0 : 4;

  const earlyDays = Math.min(
    31,
    Math.max(6, 11 + stressShift + anomShift + soilShiftDays + irrigShiftDays + strategyBonus)
  );

  const shiftedStartDoy = baselineStartDoy - earlyDays;
  return `${formatDoyRange(shiftedStartDoy, base.span)} (-${earlyDays} Gün Erken Ekim)`;
}

export function normalizeRotationStrategies(strategies, payload = null, prediction = null) {
  if (!Array.isArray(strategies)) return [];

  const area = Math.max(1, Number(payload?.soil?.areaDekar ?? prediction?.farmerInputs?.fieldAreaDekar) || 120);
  const cropId = payload?.cropAndResources?.targetCrop || prediction?.farmerInputs?.currentRotation?.[0] || 'wheat';
  const soilType = payload?.soil?.type || prediction?.farmerInputs?.soilType || 'tinli';
  const soilPh = payload?.soil?.ph || prediction?.farmerInputs?.soilPh || 'notr';
  const irrigation = payload?.cropAndResources?.irrigation || prediction?.farmerInputs?.irrigationMethod || 'kuru_tarim';
  const budgetLevel = payload?.cropAndResources?.budgetLevel || prediction?.farmerInputs?.budgetLevel || 'orta';
  const machinery = Array.isArray(payload?.cropAndResources?.machinery)
    ? payload.cropAndResources.machinery
    : Array.isArray(prediction?.farmerInputs?.machinery)
      ? prediction.farmerInputs.machinery
      : [];

  const isDry = irrigation === 'kuru_tarim';
  const pressure = Number(prediction?.scenarioAnalysis?.indicativeScenarioPressureIndex0to100) || 50;
  const locStress = Number(prediction?.historicalStressContext?.historicalExploratoryStressIndex) || pressure;
  const wet3 = Number(prediction?.forecast?.soilWetnessWet3Index) || 0.55;
  const tempC = typeof prediction?.forecast?.temperatureC === 'number' ? prediction.forecast.temperatureC : 10.5;
  const tempDiffC = Number(prediction?.climateSummary?.temperatureDifferenceCUnadjusted) || 0;
  const scenarioTempDelta = Number(payload?.simOverrides?.temperatureChangeC ?? prediction?.scenario?.temperatureChangeC) || 0;

  const monthlyList = Array.isArray(prediction?.monthlyForecasts) ? prediction.monthlyForecasts : [];
  const seasonalRainMm = monthlyList.length > 0
    ? monthlyList.reduce((sum, m) => sum + (Number(m.precipitationMm ?? m.historicalBaseline?.precipitationMm) || 35), 0)
    : 360;

  const moisturePotential = Math.min(1.24, Math.max(0.64, wet3 * 0.78 + (seasonalRainMm / 920) * 0.52));

  const irrigYieldFactor =
    irrigation === 'damla_sulama' ? 1.23
    : irrigation === 'yagmurlama' ? 1.13
    : irrigation === 'salma_sulama' ? (soilType === 'killi' ? 0.98 : 1.06)
    : 0.89;

  const budgetOpsFactor =
    (budgetLevel === 'yuksek' ? 1.05 : budgetLevel === 'dusuk' ? 0.94 : 1.0) +
    (machinery.includes('mibzer') ? 0.03 : 0) +
    (machinery.includes('ilaclama') ? 0.02 : 0) +
    (machinery.includes('bicerdover') ? 0.02 : 0);

  const currentStrategyScore = typeof strategies[0]?.indicativeSuitabilityIndex0to100 === 'number'
    ? strategies[0].indicativeSuitabilityIndex0to100
    : 48;

  const soilStressPenaltyPct =
    soilType === 'kumlu' && isDry ? 6
    : soilType === 'killi' && irrigation === 'salma_sulama' ? 5
    : soilType === 'kirecli' ? 3
    : soilType === 'tinli' ? -2
    : 0;

  const estLossPct = Math.min(
    56,
    Math.max(
      7,
      Math.round(
        (100 - currentStrategyScore) * 0.42 +
        pressure * 0.21 +
        (1 - wet3) * 12 +
        soilStressPenaltyPct -
        (irrigation === 'damla_sulama' ? 7 : irrigation === 'yagmurlama' ? 4 : 0)
      )
    )
  );

  const baseSoilFactor0 = SOIL_CROP_YIELD_FACTOR[cropId]?.[soilType] ?? 1.0;
  const basePhFactor0 = PH_CROP_YIELD_FACTOR[cropId]?.[soilPh] ?? 1.0;
  const baseGrossPerDekar0 =
    (CROP_BASE_REVENUE_PER_DEKAR[cropId] || 4450) *
    moisturePotential *
    baseSoilFactor0 *
    basePhFactor0 *
    irrigYieldFactor *
    budgetOpsFactor;

  const baselineNetPerDekar = Math.round(baseGrossPerDekar0 * (1 - estLossPct / 100));
  const baselineTotal = Math.round(baselineNetPerDekar * area);

  return strategies.map((strategy, idx) => {
    const score = typeof strategy.indicativeSuitabilityIndex0to100 === 'number'
      ? strategy.indicativeSuitabilityIndex0to100
      : null;
    const isCurrent = strategy.type === 'current' || idx === 0;
    const seqIds = Array.isArray(strategy.cropSequence) && strategy.cropSequence.length >= 2
      ? strategy.cropSequence
      : [cropId, cropId];
    const secondCropId = seqIds[1] || cropId;

    const plantingWindow = buildDynamicPlantingWindow({
      cropId: isCurrent ? cropId : secondCropId,
      idx,
      tempC,
      tempDiffC,
      locStress,
      wet3,
      soilType,
      irrigation,
      scenarioTempDelta
    });

    const firstWater = CROP_WATER_NEED_MM[seqIds[0]] || 500;
    const secondWater = CROP_WATER_NEED_MM[secondCropId] || 420;
    const cropWaterDiffPct = Math.round(((firstWater - secondWater) / firstWater) * 55);
    const irrigWaterSaveBonus =
      irrigation === 'damla_sulama' ? 16
      : irrigation === 'yagmurlama' ? 10
      : irrigation === 'salma_sulama' ? 4
      : 8;
    const soilWaterSaveMod =
      soilType === 'tinli' ? 3
      : soilType === 'killi' ? 4
      : soilType === 'kirecli' ? 1
      : -2;

    const waterSaving = isCurrent
      ? 0
      : Math.min(
          42,
          Math.max(
            9,
            10 + Math.max(-4, cropWaterDiffPct) + irrigWaterSaveBonus + soilWaterSaveMod + (idx === 2 ? 4 : 0)
          )
        );

    const scoreDelta = Math.max(4, (score ?? 68) - currentStrategyScore);
    const soilFactorSecond = SOIL_CROP_YIELD_FACTOR[secondCropId]?.[soilType] ?? 1.0;
    const phFactorSecond = PH_CROP_YIELD_FACTOR[secondCropId]?.[soilPh] ?? 1.0;

    const yieldGainPct = isCurrent
      ? -estLossPct
      : Math.min(
          54,
          Math.max(
            9,
            Math.round(
              estLossPct * 0.62 +
              scoreDelta * 0.58 +
              (soilFactorSecond - baseSoilFactor0) * 28 +
              (idx === 2 ? 3 : 0)
            )
          )
        );

    const blendedBaseRev =
      (CROP_BASE_REVENUE_PER_DEKAR[seqIds[0]] || 4450) * 0.42 +
      (CROP_BASE_REVENUE_PER_DEKAR[secondCropId] || 4800) * 0.58;

    const altGrossPerDekar =
      blendedBaseRev *
      moisturePotential *
      ((baseSoilFactor0 * 0.4 + soilFactorSecond * 0.6)) *
      ((basePhFactor0 * 0.4 + phFactorSecond * 0.6)) *
      irrigYieldFactor *
      budgetOpsFactor;

    const altResidualLossPct = Math.max(3, Math.round(estLossPct * (1 - Math.min(0.82, (score ?? 70) / 105))));
    const altNetPerDekar = Math.round(altGrossPerDekar * (1 - altResidualLossPct / 100));

    const computedAltTotal = Math.round(altNetPerDekar * area);
    const minGuaranteedTotal = Math.round(baselineTotal * (1 + Math.max(8, yieldGainPct) / 100));
    const financialTotal = isCurrent
      ? baselineTotal
      : Math.round((computedAltTotal * 0.55) + (minGuaranteedTotal * 0.45));

    const diff = Math.max(0, financialTotal - baselineTotal);

    return {
      ...strategy,
      title: Array.isArray(strategy.cropNames) ? strategy.cropNames.join(' → ') : '',
      sequence: Array.isArray(strategy.cropNames) ? strategy.cropNames : [],
      score,
      plantingWindow,
      waterSaving,
      yieldDeltaText: isCurrent ? `-%${estLossPct} Kayıp Riski` : `+%${yieldGainPct} Verim Koruma`,
      financialTotal,
      financialDiffText: isCurrent
        ? `Referans Senaryo (${area} da)`
        : `+${diff.toLocaleString('tr-TR')} ₺ Net Kazanç Farkı`
    };
  });
}
