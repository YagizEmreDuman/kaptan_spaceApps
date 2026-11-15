import { buildDashboardData } from './riskCalculator.js';
import { getLocalCatalog, assessLocal, fetchBrowserWeatherAndTasks } from './localAlgorithmEngine.js';

const browserLocation = globalThis.location;
const isBrowser = typeof globalThis.window !== 'undefined';
let backendOfflineInBrowser = false;

export function isBackendOffline() {
  return isBrowser && backendOfflineInBrowser;
}

export function markBackendOffline() {
  if (isBrowser) backendOfflineInBrowser = true;
}

export const API_CONFIG = {
  BASE_URL: globalThis.CROPGUARD_API_BASE_URL ||
    (browserLocation?.port === '3000' ? `${browserLocation.origin}/api` : 'http://localhost:3000/api'),
  ENDPOINTS: { CATALOG: '/catalog', WEATHER_TASKS: '/weather-tasks', SIMULATE_ROTATION: '/simulate-rotation' },
  TIMEOUT_MS: isBrowser ? 2500 : 45000
};

export function mapPayloadToAlgorithm(payload) {
  const crop = payload.cropAndResources.targetCrop;
  if (!crop) throw new Error('Select a crop from the algorithm catalog.');
  return {
    location: { latitude: payload.location.latitude, longitude: payload.location.longitude },
    climateSummary: {},
    forecast: payload.forecastMonth ? { month: payload.forecastMonth } : {},
    farmerInputs: {
      currentRotation: [crop, crop],
      irrigationAvailable: payload.cropAndResources.irrigation !== 'kuru_tarim',
      irrigationMethod: payload.cropAndResources.irrigation,
      budgetLevel: payload.cropAndResources.budgetLevel,
      machinery: payload.cropAndResources.machinery,
      soilType: payload.soil.type, soilPh: payload.soil.ph, fieldAreaDekar: payload.soil.areaDekar
    },
    scenario: {
      rainfallChangePct: payload.simOverrides?.rainDeltaPct ?? 0,
      temperatureChangeC: payload.simOverrides?.temperatureChangeC ?? 0,
      irrigationAvailabilityChangePct: payload.simOverrides?.irrigationAvailabilityChangePct ?? 0
    }
  };
}

function translateLegacyTasksToEnglish(weatherResponse) {
  if (!weatherResponse || !Array.isArray(weatherResponse.taskCalendar)) return weatherResponse;
  return {
    ...weatherResponse,
    taskCalendar: weatherResponse.taskCalendar.map(item => {
      if (!item || typeof item !== 'object') return item;
      const typeMap = { UYARI: 'WARNING', 'BİLGİ': 'INFO', PLANLAMA: 'PLANNING' };
      let task = item.task || item.title || '';
      let reason = item.reason || item.description || '';
      if (task === 'Düşük sıcaklık için saha kontrolü') task = 'Field inspection for low temperature';
      if (task === 'Yağış öncesi saha planını kontrol edin') task = 'Review field schedule before rainfall';
      if (task === 'Toprak tavı ve ekim/gübreleme penceresi kontrolü') task = 'Check soil moisture and sowing/fertilizer window';
      reason = reason
        .replace(/^Tahmini en düşük sıcaklık\s*/i, 'Forecast minimum temperature ')
        .replace(/^Tahmini günlük toplam yağış\s*/i, 'Forecast daily total precipitation ')
        .replace(/Yağışsız ve ılıman hava \(([0-9.,]+)\s*°C\); saha işlemleri için uygun pencere\./i, 'Dry and mild weather ($1 °C); suitable window for field operations.');
      return {
        ...item,
        type: typeMap[item.type] || item.type,
        task,
        reason
      };
    })
  };
}

async function requestJson(endpoint, body) {
  if (isBackendOffline()) {
    throw new Error('Local server offline; using browser engine.');
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (isBrowser) markBackendOffline();
    if (error.name === 'AbortError') throw new Error('Data service did not respond in time.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCatalog() {
  if (isBrowser) {
    return getLocalCatalog();
  }
  const metadata = await requestJson(API_CONFIG.ENDPOINTS.CATALOG);
  if (!Array.isArray(metadata.crops) || metadata.crops.length === 0 ||
      !Array.isArray(metadata.forecastMonths) || metadata.forecastMonths.length === 0) {
    throw new Error('Algorithm crop catalog or forecast scope is empty.');
  }
  return metadata;
}

export async function fetchAllBackendData(payload, { onlySimulation = false, cachedData = null, metadata = null } = {}) {
  const contract = mapPayloadToAlgorithm(payload);
  const sameLocation = cachedData?.data?.payload?.location?.latitude === payload.location.latitude &&
    cachedData?.data?.payload?.location?.longitude === payload.location.longitude;
  const reuseWeather = onlySimulation && sameLocation && cachedData?.rawWeather;
  const [predictionResult, weatherResult] = await Promise.allSettled([
    isBrowser
      ? Promise.resolve().then(() => assessLocal(contract))
      : requestJson(API_CONFIG.ENDPOINTS.SIMULATE_ROTATION, contract).then(response => {
          if (!Array.isArray(response.simulationResult?.monthlyForecasts) ||
              !Array.isArray(response.simulationResult?.rotationStrategies)) {
            throw new Error('Monthly forecast or rotation data missing in algorithm response.');
          }
          return response.simulationResult;
        }),
    reuseWeather ? Promise.resolve(cachedData.rawWeather) :
      isBrowser
        ? fetchBrowserWeatherAndTasks(payload.location.latitude, payload.location.longitude, payload).catch(() =>
            requestJson(API_CONFIG.ENDPOINTS.WEATHER_TASKS, {
              lat: payload.location.latitude, lng: payload.location.longitude
            }).then(response => {
              if (!Array.isArray(response.forecast14Days) || response.forecast14Days.length === 0) {
                throw new Error('No forecast found in daily weather response.');
              }
              return translateLegacyTasksToEnglish(response);
            })
          )
        : requestJson(API_CONFIG.ENDPOINTS.WEATHER_TASKS, {
            lat: payload.location.latitude, lng: payload.location.longitude
          }).then(response => {
            if (!Array.isArray(response.forecast14Days) || response.forecast14Days.length === 0) {
              throw new Error('No forecast found in daily weather response.');
            }
            return translateLegacyTasksToEnglish(response);
          })
  ]);
  const prediction = predictionResult.status === 'fulfilled' ? predictionResult.value : null;
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const errors = [];
  if (!prediction) errors.push(`Algorithm: ${predictionResult.reason?.message || 'Data unavailable'}`);
  if (!weather) errors.push(`Daily weather: ${weatherResult.reason?.message || 'Data unavailable'}`);
  return {
    status: prediction && weather ? 'live' : prediction || weather ? 'partial' : 'error',
    algorithmAvailable: Boolean(prediction), weatherAvailable: Boolean(weather),
    errors, rawPrediction: prediction, rawWeather: weather,
    data: buildDashboardData(payload, prediction, weather, metadata || cachedData?.data?.metadata)
  };
}
