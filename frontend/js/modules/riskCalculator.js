import { SOIL_LABELS } from '../data/climateData.js';
import { normalizeRotationStrategies } from '../data/rotationData.js';

export const finiteNumber = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

// A display adapter, with no browser-side agronomy or substitute climate model.
export function buildDashboardData(payload, prediction = null, weather = null, metadata = null) {
  const rawMonthly = Array.isArray(prediction?.monthlyForecasts)
    ? [...prediction.monthlyForecasts].sort((a, b) => a.month.localeCompare(b.month)) : [];
  const cmip6Map = weather?.cmip6MonthlyRain || null;
  const monthlyForecasts = cmip6Map
    ? rawMonthly.map(m => ({
        ...m,
        cmip6PrecipitationMm: typeof cmip6Map[m.month] === 'number' ? cmip6Map[m.month] : (m.cmip6PrecipitationMm ?? null)
      }))
    : rawMonthly;
  const crop = metadata?.crops?.find(item => item.id === payload.cropAndResources.targetCrop);
  return {
    payload, prediction, metadata,
    cropLabel: crop?.name || payload.cropAndResources.targetCrop || 'No crop selected',
    soilLabel: SOIL_LABELS[payload.soil.type] || payload.soil.type,
    profile: { name: payload.location.label || 'Selected Location' },
    monthlyForecasts,
    strategies: normalizeRotationStrategies(prediction?.rotationStrategies, payload, prediction),
    apiForecast14Days: Array.isArray(weather?.forecast14Days) ? weather.forecast14Days : [],
    apiTaskCalendar: Array.isArray(weather?.taskCalendar) ? weather.taskCalendar : [],
    weatherSource: weather?.source || null,
    weatherFetchedAt: weather?.fetchedAt || null,
    weatherTimezone: weather?.timezone || null
  };
}
