import { getCurrentLang } from './i18nManager.js';
import { formatMonth } from './displayUtils.js';

let climateChart = null;
let differenceChart = null;

export function renderClimateCharts(sim) {
  climateChart?.destroy();
  differenceChart?.destroy();
  climateChart = differenceChart = null;
  const status = document.getElementById('chart-data-status');
  const months = sim.monthlyForecasts;
  if (status) status.textContent = months.length
    ? 'Missing forecasts are left blank. Historical averages are a separate series. Temperature differences are uncalibrated cross-source comparisons.'
    : 'Algorithm data unavailable for charts.';
  if (typeof Chart === 'undefined') {
    if (status) status.textContent += ' Chart library failed to load; values can be viewed in the monthly data table.';
    return;
  }
  const labels = months.map(month => formatMonth(month.month, getCurrentLang()));
  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: '#334155', font: { size: 10 }, boxWidth: 12 } } },
    scales: { x: { grid: { display: false } },
      y: { position: 'left', title: { display: true, text: 'Precipitation (mm/month)' } },
      temperature: { position: 'right', title: { display: true, text: 'Temperature (°C)' }, grid: { drawOnChartArea: false } } }
  };
  climateChart = new Chart(document.getElementById('tempRainChart'), {
    type: 'bar', data: { labels, datasets: [
      { label: 'GEOS-S2S precipitation forecast (mm)', data: months.map(month => month.precipitationMm),
        backgroundColor: '#0ea5e9', yAxisID: 'y' },
      { label: 'CMIP6 precipitation projection (mm)', data: months.map(month => month.cmip6PrecipitationMm ?? null),
        backgroundColor: '#10b981', yAxisID: 'y' },
      { label: 'POWER historical precipitation average (mm)', data: months.map(month => month.historicalBaseline?.precipitationMm ?? null),
        backgroundColor: '#bae6fd', yAxisID: 'y' },
      { label: 'GEOS-S2S temperature forecast (°C)', type: 'line', data: months.map(month => month.temperatureC),
        borderColor: '#d97706', yAxisID: 'temperature', spanGaps: false },
      { label: 'POWER historical temperature average (°C)', type: 'line', data: months.map(month => month.historicalBaseline?.temperatureC ?? null),
        borderColor: '#64748b', borderDash: [5, 5], yAxisID: 'temperature', spanGaps: false }
    ] }, options
  });
  differenceChart = new Chart(document.getElementById('riskIndexChart'), {
    type: 'bar', data: { labels, datasets: [
      { label: 'GEOS-S2S − POWER temperature difference (°C, uncalibrated)',
        data: months.map(month => month.temperatureDifferenceCUnadjusted), backgroundColor: '#f59e0b' }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      plugins: options.plugins,
      scales: { y: { title: { display: true, text: 'Temperature difference (°C)' } } } }
  });
}
