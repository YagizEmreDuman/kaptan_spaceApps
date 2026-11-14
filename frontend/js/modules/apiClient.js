import { runAgronomySimulation } from './riskCalculator.js';

export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  ENDPOINTS: {
    ANALYZE_LOCATION: '/analyze-location',
    WEATHER_TASKS: '/weather-tasks',
    SIMULATE_ROTATION: '/simulate-rotation'
  },
  TIMEOUT_MS: 8000
};

// Senin form değerlerini backend arkadaşının beklediği Türkçe string formatına çevirir
function mapPayloadToBackendContracts(payload) {
  const lat = Number(payload.location.latitude.toFixed(4));
  const lng = Number(payload.location.longitude.toFixed(4));

  const budgetMap = {
    dusuk: 'düşük',
    orta: 'orta',
    yuksek: 'yüksek'
  };

  const irrigationMap = {
    damla_sulama: 'damla',
    yagmurlama: 'yağmurlama',
    salma_sulama: 'salma',
    kuru_tarim: 'kuru'
  };

  const hasMachinery =
    Array.isArray(payload.cropAndResources.machinery) &&
    payload.cropAndResources.machinery.length > 0;

  return {
    locationBody: { lat, lng },
    weatherBody: { lat, lng },
    simulationBody: {
      lat,
      lng,
      farmerInputs: {
        budget: budgetMap[payload.cropAndResources.budgetLevel] || 'orta',
        irrigation: irrigationMap[payload.cropAndResources.irrigation] || 'damla',
        machinery: hasMachinery ? 'var' : 'yok'
      },
      scenario: {
        rainChangePercent: payload.simOverrides?.rainDeltaPct ?? 0,
        humidityIncrease: payload.simOverrides?.humidityIncrease ?? 0
      }
    }
  };
}

// Ortak POST yardımcı fonksiyonu
async function postJson(endpoint, bodyObj) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`${endpoint} -> HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * 3 Backend Ucunu Yönetir:
 * - onlySimulation = false: Konum analizi + 14 günlük hava/görev + rotasyon simülasyonu hepsini çeker
 * - onlySimulation = true: Sadece /api/simulate-rotation ucunu günceller (slider hareketlerinde hızlı çalışır)
 */
export async function fetchAllBackendData(payload, { onlySimulation = false, cachedData = null } = {}) {
  const contracts = mapPayloadToBackendContracts(payload);
  const baseSim = runAgronomySimulation(payload);

  const requests = onlySimulation
    ? [
        Promise.resolve(cachedData?.rawLocation || null),
        Promise.resolve(cachedData?.rawWeather || null),
        postJson(API_CONFIG.ENDPOINTS.SIMULATE_ROTATION, contracts.simulationBody)
      ]
    : [
        postJson(API_CONFIG.ENDPOINTS.ANALYZE_LOCATION, contracts.locationBody),
        postJson(API_CONFIG.ENDPOINTS.WEATHER_TASKS, contracts.weatherBody),
        postJson(API_CONFIG.ENDPOINTS.SIMULATE_ROTATION, contracts.simulationBody)
      ];

  const [locRes, weatherRes, simRes] = await Promise.allSettled(requests);

  const rawLocation = locRes.status === 'fulfilled' ? locRes.value : null;
  const rawWeather = weatherRes.status === 'fulfilled' ? weatherRes.value : null;
  const rawSim = simRes.status === 'fulfilled' ? simRes.value : null;

  const successCount = [rawLocation, rawWeather, rawSim].filter(Boolean).length;
  const errors = [locRes, weatherRes, simRes]
    .filter(r => r.status === 'rejected')
    .map(r => r.reason?.message || 'Bağlantı hatası');

  // 1. UÇ DÖNÜŞÜMÜ: summaryIndicators -> Grafik & Risk Dizileri
  const mergedProfile = { ...baseSim.profile };
  let monthlyFungal = [...baseSim.monthlyFungal];
  let monthlyDrought = [...baseSim.monthlyDrought];

  if (rawLocation?.summaryIndicators) {
    const si = rawLocation.summaryIndicators;

    // Backend dizi ([{...}, ...]) veya nesne ({ rain: [...], tempDiff: [...] }) dönerse ikisini de yakala
    if (Array.isArray(si) && si.length >= 12) {
      mergedProfile.rain2026 = si.slice(0, 12).map(m => Number(m.rain ?? m.rainfall ?? m.precipitation ?? 30));
      mergedProfile.temp2026 = si.slice(0, 12).map(m => Number(m.temp ?? m.temperature ?? m.tempDiff ?? 15));
      monthlyFungal = si.slice(0, 12).map(m => Math.min(98, Math.round(Number(m.fungalRiskDays ?? m.fungalRisk ?? 10) * 3.2)));
      monthlyDrought = si.slice(0, 12).map(m => Math.min(99, Math.max(5, Math.round(100 - Number(m.soilMoisture ?? 50)))));
    } else if (typeof si === 'object') {
      if (Array.isArray(si.rain) && si.rain.length === 12) mergedProfile.rain2026 = si.rain;
      if (Array.isArray(si.rainfall) && si.rainfall.length === 12) mergedProfile.rain2026 = si.rainfall;
      if (Array.isArray(si.tempDiff) && si.tempDiff.length === 12) {
        mergedProfile.temp2026 = baseSim.profile.temp2026.map((t, i) => +(t + Number(si.tempDiff[i] || 0)).toFixed(1));
      }
      if (Array.isArray(si.fungalRiskDays) && si.fungalRiskDays.length === 12) {
        monthlyFungal = si.fungalRiskDays.map(d => Math.min(98, Math.round(Number(d) * 3.2)));
      }
      if (Array.isArray(si.soilMoisture) && si.soilMoisture.length === 12) {
        monthlyDrought = si.soilMoisture.map(sm => Math.min(99, Math.max(5, Math.round(100 - Number(sm)))));
      }
    }
  }

  // 2. UÇ DÖNÜŞÜMÜ: forecast14Days & taskCalendar
  const apiForecast14Days = Array.isArray(rawWeather?.forecast14Days) ? rawWeather.forecast14Days : null;
  const apiTaskCalendar = Array.isArray(rawWeather?.taskCalendar) ? rawWeather.taskCalendar : null;

  // 3. UÇ DÖNÜŞÜMÜ: simulationResult & upcomingTasks -> Rotasyon Kartları & Yaklaşan Görevler
  const strategies = [...baseSim.strategies];
  if (rawSim?.simulationResult) {
    const sr = rawSim.simulationResult;
    const alt1 = { ...strategies[1] };

    if (sr.recommendedCrop || sr.resistantCrop) {
      const cropName = sr.recommendedCrop || sr.resistantCrop;
      alt1.title = `${cropName} (Backend AI Önerisi)`;
      alt1.sequence = [cropName, alt1.sequence[1], alt1.sequence[2]];
    }
    if (sr.shiftedPlantingDate || sr.plantingWindow) {
      alt1.plantingWindow = sr.shiftedPlantingDate || sr.plantingWindow;
    }
    if (sr.diseaseRisk !== undefined || sr.fungalRisk !== undefined) {
      const riskVal = Number(sr.diseaseRisk ?? sr.fungalRisk);
      if (!Number.isNaN(riskVal)) alt1.fungalRisk = Math.min(99, Math.max(5, Math.round(riskVal)));
    }

    strategies[1] = alt1;
  }

  const apiUpcomingTasks = Array.isArray(rawSim?.upcomingTasks) ? rawSim.upcomingTasks : null;

  return {
    status: successCount === 3 ? 'live' : successCount > 0 ? 'partial' : 'fallback',
    successCount,
    errors,
    sentContracts: contracts,
    rawLocation,
    rawWeather,
    rawSim,
    data: {
      ...baseSim,
      profile: mergedProfile,
      monthlyFungal,
      monthlyDrought,
      peakFungal: Math.max(...monthlyFungal),
      peakDrought: Math.max(...monthlyDrought),
      strategies,
      apiForecast14Days,
      apiTaskCalendar,
      apiUpcomingTasks
    }
  };
}