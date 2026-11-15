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
    ? 'Eksik tahminler boş bırakılır. Geçmiş ortalamaları ayrı seridir. Sıcaklık farkları kaynaklar arası kalibrasyonsuz karşılaştırmadır.'
    : 'Grafik için algorithm verisi alınamadı.';
  if (typeof Chart === 'undefined') {
    if (status) status.textContent += ' Grafik kütüphanesi yüklenemedi; değerler aylık veri tablosunda görülebilir.';
    return;
  }
  const labels = months.map(month => formatMonth(month.month, getCurrentLang()));
  const options = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: '#334155', font: { size: 10 }, boxWidth: 12 } } },
    scales: { x: { grid: { display: false } },
      y: { position: 'left', title: { display: true, text: 'Yağış (mm/ay)' } },
      temperature: { position: 'right', title: { display: true, text: 'Sıcaklık (°C)' }, grid: { drawOnChartArea: false } } }
  };
  climateChart = new Chart(document.getElementById('tempRainChart'), {
    type: 'bar', data: { labels, datasets: [
      { label: 'GEOS-S2S yağış tahmini (mm)', data: months.map(month => month.precipitationMm),
        backgroundColor: '#0ea5e9', yAxisID: 'y' },
      { label: 'CMIP6 yağış projeksiyonu (mm)', data: months.map(month => month.cmip6PrecipitationMm ?? null),
        backgroundColor: '#10b981', yAxisID: 'y' },
      { label: 'POWER geçmiş yağış ortalaması (mm)', data: months.map(month => month.historicalBaseline?.precipitationMm ?? null),
        backgroundColor: '#bae6fd', yAxisID: 'y' },
      { label: 'GEOS-S2S sıcaklık tahmini (°C)', type: 'line', data: months.map(month => month.temperatureC),
        borderColor: '#d97706', yAxisID: 'temperature', spanGaps: false },
      { label: 'POWER geçmiş sıcaklık ortalaması (°C)', type: 'line', data: months.map(month => month.historicalBaseline?.temperatureC ?? null),
        borderColor: '#64748b', borderDash: [5, 5], yAxisID: 'temperature', spanGaps: false }
    ] }, options
  });
  differenceChart = new Chart(document.getElementById('riskIndexChart'), {
    type: 'bar', data: { labels, datasets: [
      { label: 'GEOS-S2S − POWER sıcaklık farkı (°C, kalibrasyonsuz)',
        data: months.map(month => month.temperatureDifferenceCUnadjusted), backgroundColor: '#f59e0b' }
    ] }, options: { responsive: true, maintainAspectRatio: false,
      plugins: options.plugins,
      scales: { y: { title: { display: true, text: 'Sıcaklık farkı (°C)' } } } }
  });
}
