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
  if (!crop) throw new Error('Algorithm kataloğundan bir ürün seçin.');
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

async function requestJson(endpoint, body) {
  if (isBackendOffline()) {
    throw new Error('Yerel sunucu çevrimdışı; tarayıcı motoru kullanılıyor.');
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
    if (error.name === 'AbortError') throw new Error('Veri servisi zamanında yanıt vermedi.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCatalog() {
  try {
    const metadata = await requestJson(API_CONFIG.ENDPOINTS.CATALOG);
    if (!Array.isArray(metadata.crops) || metadata.crops.length === 0 ||
        !Array.isArray(metadata.forecastMonths) || metadata.forecastMonths.length === 0) {
      throw new Error('Algorithm ürün kataloğu veya tahmin kapsamı boş.');
    }
    return metadata;
  } catch (error) {
    if (isBrowser) {
      return getLocalCatalog();
    }
    throw error;
  }
}

export async function fetchAllBackendData(payload, { onlySimulation = false, cachedData = null, metadata = null } = {}) {
  const contract = mapPayloadToAlgorithm(payload);
  const sameLocation = cachedData?.data?.payload?.location?.latitude === payload.location.latitude &&
    cachedData?.data?.payload?.location?.longitude === payload.location.longitude;
  const reuseWeather = onlySimulation && sameLocation && cachedData?.rawWeather;
  const [predictionResult, weatherResult] = await Promise.allSettled([
    requestJson(API_CONFIG.ENDPOINTS.SIMULATE_ROTATION, contract).then(response => {
      if (!Array.isArray(response.simulationResult?.monthlyForecasts) ||
          !Array.isArray(response.simulationResult?.rotationStrategies)) {
        throw new Error('Algorithm yanıtında aylık tahmin veya rotasyon verisi eksik.');
      }
      if (isBrowser && response.simulationResult?.climateSummary?.usedInRotationScoring === false) {
        return assessLocal(contract);
      }
      return response.simulationResult;
    }).catch(error => {
      if (isBrowser) {
        return assessLocal(contract);
      }
      throw error;
    }),
    reuseWeather ? Promise.resolve(cachedData.rawWeather) :
      requestJson(API_CONFIG.ENDPOINTS.WEATHER_TASKS, {
        lat: payload.location.latitude, lng: payload.location.longitude
      }).then(response => {
        if (!Array.isArray(response.forecast14Days) || response.forecast14Days.length === 0) {
          throw new Error('Günlük hava yanıtında tahmin bulunamadı.');
        }
        return response;
      }).catch(error => {
        if (isBrowser) {
          return fetchBrowserWeatherAndTasks(payload.location.latitude, payload.location.longitude, payload);
        }
        throw error;
      })
  ]);
  const prediction = predictionResult.status === 'fulfilled' ? predictionResult.value : null;
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  const errors = [];
  if (!prediction) errors.push(`Algorithm: ${predictionResult.reason?.message || 'Veri alınamadı'}`);
  if (!weather) errors.push(`Günlük hava: ${weatherResult.reason?.message || 'Veri alınamadı'}`);
  return {
    status: prediction && weather ? 'live' : prediction || weather ? 'partial' : 'error',
    algorithmAvailable: Boolean(prediction), weatherAvailable: Boolean(weather),
    errors, rawPrediction: prediction, rawWeather: weather,
    data: buildDashboardData(payload, prediction, weather, metadata || cachedData?.data?.metadata)
  };
}
