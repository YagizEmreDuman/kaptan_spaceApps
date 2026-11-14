import { getLocalizedMonths } from './i18nManager.js';

let tempRainChartInstance = null;
let riskIndexChartInstance = null;

export function renderClimateCharts(profile, monthlyDrought, monthlyFungal) {
  const months = getLocalizedMonths();

  const ctx1 = document.getElementById('tempRainChart').getContext('2d');
  if (tempRainChartInstance) tempRainChartInstance.destroy();

  tempRainChartInstance = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: '2026 Yağış (mm)',
          data: profile.rain2026,
          backgroundColor: 'rgba(14, 165, 233, 0.78)', // Gökyüzü Mavisi
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: 'Tarihsel Yağış (mm)',
          data: profile.rainHist,
          backgroundColor: 'rgba(186, 230, 253, 0.85)', // Açık Buz Mavisi
          borderColor: '#7dd3fc',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: 'Ort. Sıcaklık (°C)',
          data: profile.temp2026,
          type: 'line',
          borderColor: '#eab308', // Güneş Sarısı
          backgroundColor: '#fef08a',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 3.5,
          pointBackgroundColor: '#eab308',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#334155', font: { size: 10, family: 'Inter' }, boxWidth: 12 }
        }
      },
      scales: {
        x: {
          ticks: { color: '#475569', font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          type: 'linear',
          position: 'left',
          ticks: { color: '#0369a1', font: { size: 10 } },
          grid: { color: 'rgba(148, 163, 184, 0.22)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          ticks: { color: '#b45309', font: { size: 10 } },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });

  const ctx2 = document.getElementById('riskIndexChart').getContext('2d');
  if (riskIndexChartInstance) riskIndexChartInstance.destroy();

  riskIndexChartInstance = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Kuraklık & Sıcak Stresi (%)',
          data: monthlyDrought,
          borderColor: '#eab308', // Güneş Sarısı / Kehribar
          backgroundColor: 'rgba(254, 240, 138, 0.45)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3
        },
        {
          label: 'Mantar / Patojen Riski (%)',
          data: monthlyFungal,
          borderColor: '#16a34a', // Taze Çayır Yeşili
          backgroundColor: 'rgba(187, 247, 208, 0.45)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#334155', font: { size: 10, family: 'Inter' }, boxWidth: 12 }
        }
      },
      scales: {
        x: {
          ticks: { color: '#475569', font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#475569', font: { size: 10 } },
          grid: { color: 'rgba(148, 163, 184, 0.22)' }
        }
      }
    }
  });
}