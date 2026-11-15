import { API_CONFIG, isBackendOffline, markBackendOffline } from './apiClient.js';
import { assessLocal } from './localAlgorithmEngine.js';

const isBrowser = typeof globalThis.window !== 'undefined';

// Uses the existing Node proxy, which forwards the unchanged body to POST :5000/predict.
export async function requestFarmPrediction(body, signal) {
  if (isBackendOffline()) {
    return assessLocal(body);
  }
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SIMULATE_ROTATION}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body), signal
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || `HTTP ${response.status}`);
    if (!data.simulationResult?.scenarioAnalysis || !Array.isArray(data.simulationResult.rotationStrategies)) {
      throw new Error('Karar motoru simülasyon göstergelerini döndürmedi.');
    }
    if (isBrowser && data.simulationResult?.climateSummary?.usedInRotationScoring === false) {
      return assessLocal(body);
    }
    return data.simulationResult;
  } catch (error) {
    if (isBrowser && error.name !== 'AbortError') {
      markBackendOffline();
      return assessLocal(body);
    }
    throw error;
  }
}
