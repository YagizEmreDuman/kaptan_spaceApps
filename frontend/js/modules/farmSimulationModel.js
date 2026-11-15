import { mapPayloadToAlgorithm } from './apiClient.js';

// Animation seconds only. These durations are UI timing, not biological rates.
export const STAGES = ['Seed / Sowing', 'Germination', 'Vegetative Growth', 'Mature Plant', 'Ready for Harvest (Illustrative)'];
export const ANIMATION_DURATION_SECONDS = 30;

export class FarmClock {
  constructor() { this.seconds = 0; this.running = false; this.speed = 1; }
  start() { if (this.seconds < ANIMATION_DURATION_SECONDS) this.running = true; }
  pause() { this.running = false; }
  reset() { this.seconds = 0; this.running = false; this.speed = 1; }
  setSpeed(speed) { if ([1, 2, 4].includes(speed)) this.speed = speed; }
  advance(realSeconds) {
    if (this.running && Number.isFinite(realSeconds) && realSeconds > 0) {
      this.seconds = Math.min(ANIMATION_DURATION_SECONDS, this.seconds + realSeconds * this.speed);
      if (this.seconds === ANIMATION_DURATION_SECONDS) this.running = false;
    }
  }
  get progress() { return this.seconds / ANIMATION_DURATION_SECONDS; }
  get stage() { return Math.min(STAGES.length - 1, Math.floor(this.progress * STAGES.length)); }
}

export function comparisonRequests(basePayload, crops, conditions) {
  return crops.map(crop => mapPayloadToAlgorithm({
    ...structuredClone(basePayload),
    cropAndResources: { ...structuredClone(basePayload.cropAndResources), targetCrop: crop },
    simOverrides: {
      rainDeltaPct: conditions.rainfallChangePct,
      temperatureChangeC: conditions.temperatureChangeC,
      irrigationAvailabilityChangePct: conditions.irrigationAvailabilityChangePct
    }
  }));
}

export function modelView(result) {
  const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const current = result?.rotationStrategies?.find(strategy => strategy.type === 'current');
  return {
    pressure: finite(result?.scenarioAnalysis?.indicativeScenarioPressureIndex0to100),
    suitability: finite(current?.indicativeSuitabilityIndex0to100),
    scenarioTemperature: finite(result?.scenarioAnalysis?.projectedMonthlyTemperatureC),
    scenarioPrecipitation: finite(result?.scenarioAnalysis?.projectedMonthlyPrecipitationMm),
    forecastTemperature: finite(result?.forecast?.temperatureC),
    forecastPrecipitation: finite(result?.forecast?.monthlyPrecipitationMm),
    soilWetness: finite(result?.forecast?.soilWetnessWet3Index)
  };
}

export function contextKey(data) {
  return JSON.stringify([data.payload.location.latitude, data.payload.location.longitude,
    data.payload.forecastMonth, data.payload.cropAndResources.targetCrop,
    data.payload.cropAndResources.irrigation, data.payload.soil,
    data.metadata?.crops?.map(crop => crop.id)]);
}
