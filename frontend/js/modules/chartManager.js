<<<<<<< HEAD
﻿import { getCurrentLang } from './i18nManager.js';
import { formatMonth } from './displayUtils.js';
=======
import { getLocalizedMonths, t } from './i18nManager.js';
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d

let climateChart = null;
let differenceChart = null;

<<<<<<< HEAD
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
=======
export function renderClimateCharts(profile, monthlyDrought, monthlyFungal) {
  const months = getLocalizedMonths();

  const ctx1 = document.getElementById('tempRainChart')?.getContext('2d');
  if (!ctx1) return;
  if (tempRainChartInstance) tempRainChartInstance.destroy();

  tempRainChartInstance = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: t('chart_rain_2026'),
          data: profile.rain2026,
          backgroundColor: 'rgba(14, 165, 233, 0.78)',
          borderColor: '#0284c7',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: t('chart_rain_hist'),
          data: profile.rainHist,
          backgroundColor: 'rgba(186, 230, 253, 0.85)',
          borderColor: '#7dd3fc',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: t('chart_temp_2026'),
          data: profile.temp2026,
          type: 'line',
          borderColor: '#eab308',
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

  const ctx2 = document.getElementById('riskIndexChart')?.getContext('2d');
  if (!ctx2) return;
  if (riskIndexChartInstance) riskIndexChartInstance.destroy();

  riskIndexChartInstance = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: t('chart_drought_risk'),
          data: monthlyDrought,
          borderColor: '#eab308',
          backgroundColor: 'rgba(254, 240, 138, 0.45)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3
        },
        {
          label: t('chart_fungal_risk'),
          data: monthlyFungal,
          borderColor: '#16a34a',
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
>>>>>>> 885cb75fda71c41ed560548b2ef94d86ee4d869d
  });
}
