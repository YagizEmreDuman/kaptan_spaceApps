import { MONTHS } from '../data/climateData.js';

let tempRainChartInstance = null;
let riskIndexChartInstance = null;

export function renderClimateCharts(profile, monthlyDrought, monthlyFungal) {
  if (tempRainChartInstance) tempRainChartInstance.destroy();
  const ctx1 = document.getElementById('tempRainChart').getContext('2d');
  tempRainChartInstance = new Chart(ctx1, {
    data: {
      labels: MONTHS,
      datasets: [
        {
          type: 'line',
          label: '2026 Ort. Sıcaklık (°C)',
          data: profile.temp2026,
          borderColor: '#f59e0b',
          backgroundColor: '#f59e0b',
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 2.5,
          yAxisID: 'yTemp'
        },
        {
          type: 'bar',
          label: '2026 Beklenen Yağış (mm)',
          data: profile.rain2026,
          backgroundColor: 'rgba(16, 185, 129, 0.65)',
          borderRadius: 4,
          yAxisID: 'yRain'
        },
        {
          type: 'bar',
          label: 'Tarihsel Normal (mm)',
          data: profile.rainHist,
          backgroundColor: 'rgba(100, 116, 139, 0.3)',
          borderRadius: 4,
          yAxisID: 'yRain'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
        yRain: { type: 'linear', position: 'left', ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.35)' } },
        yTemp: { type: 'linear', position: 'right', ticks: { color: '#fbbf24', font: { size: 10 } }, grid: { drawOnChartArea: false } }
      }
    }
  });

  if (riskIndexChartInstance) riskIndexChartInstance.destroy();
  const ctx2 = document.getElementById('riskIndexChart').getContext('2d');
  riskIndexChartInstance = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Kuraklık & Su Stresi (%)',
          data: monthlyDrought,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.14)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2.5
        },
        {
          label: 'Mantar / Zararlı Riski (%)',
          data: monthlyFungal,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.14)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10 } } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
        y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(51, 65, 85, 0.35)' } }
      }
    }
  });
}