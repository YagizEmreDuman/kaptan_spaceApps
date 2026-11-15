import { API_CONFIG } from './apiClient.js';

// Uses the existing Node proxy, which forwards the unchanged body to POST :5000/predict.
export async function requestFarmPrediction(body, signal) {
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SIMULATE_ROTATION}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body), signal
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.detail || `HTTP ${response.status}`);
  if (!data.simulationResult?.scenarioAnalysis || !Array.isArray(data.simulationResult.rotationStrategies)) {
    throw new Error('Karar motoru simülasyon göstergelerini döndürmedi.');
  }
  return data.simulationResult;
}
