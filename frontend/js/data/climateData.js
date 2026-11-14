export const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export const REGIONAL_CLIMATE_DB = {
  konya: {
    name: 'Konya Ovası',
    rain2026: [34, 28, 31, 44, 38, 16, 4, 3, 9, 22, 29, 36],
    rainHist: [40, 34, 36, 42, 45, 24, 7, 5, 13, 28, 34, 42],
    temp2026: [1.4, 3.2, 7.8, 13.1, 18.2, 23.4, 27.1, 26.8, 21.5, 14.8, 8.1, 2.9],
    baseFungal: [15, 20, 35, 64, 72, 38, 12, 10, 18, 32, 25, 18],
    baseDrought: [20, 25, 32, 40, 55, 76, 89, 92, 81, 60, 38, 24],
    frostRisk: 62,
    gddShift: '+14 gün erken',
    heatWaveDays: '19 gün (>35°C)'
  },
  cukurova: {
    name: 'Çukurova Havzası',
    rain2026: [98, 82, 68, 49, 35, 14, 5, 4, 15, 44, 76, 105],
    rainHist: [112, 92, 75, 55, 44, 20, 8, 6, 19, 48, 84, 118],
    temp2026: [10.8, 12.1, 15.4, 19.6, 24.1, 28.3, 31.4, 31.9, 28.5, 23.2, 16.9, 12.2],
    baseFungal: [45, 52, 68, 84, 88, 62, 35, 38, 48, 56, 50, 46],
    baseDrought: [10, 14, 22, 36, 52, 74, 86, 88, 72, 45, 22, 12],
    frostRisk: 18,
    gddShift: '+18 gün erken',
    heatWaveDays: '34 gün (>36°C)'
  },
  ege: {
    name: 'Büyük Menderes Havzası',
    rain2026: [86, 74, 58, 42, 26, 9, 2, 2, 11, 36, 68, 92],
    rainHist: [98, 84, 66, 48, 33, 14, 4, 3, 15, 42, 76, 104],
    temp2026: [9.2, 10.6, 13.8, 18.2, 23.1, 27.9, 30.8, 30.5, 26.2, 20.6, 14.8, 10.5],
    baseFungal: [38, 44, 58, 74, 68, 36, 18, 16, 28, 44, 42, 38],
    baseDrought: [12, 18, 28, 44, 62, 82, 93, 94, 79, 52, 26, 15],
    frostRisk: 24,
    gddShift: '+16 gün erken',
    heatWaveDays: '29 gün (>36°C)'
  },
  trakya: {
    name: 'Ergene / Trakya Havzası',
    rain2026: [58, 49, 46, 48, 52, 34, 18, 14, 26, 45, 56, 62],
    rainHist: [64, 54, 50, 49, 54, 41, 24, 19, 31, 51, 61, 68],
    temp2026: [3.8, 5.4, 9.1, 14.4, 19.6, 24.5, 27.4, 27.1, 22.3, 16.1, 10.2, 5.4],
    baseFungal: [28, 34, 48, 72, 82, 64, 32, 28, 42, 52, 38, 30],
    baseDrought: [15, 18, 24, 32, 42, 62, 78, 82, 66, 42, 24, 16],
    frostRisk: 54,
    gddShift: '+11 gün erken',
    heatWaveDays: '16 gün (>35°C)'
  },
  gap: {
    name: 'Harran Ovası',
    rain2026: [68, 56, 48, 32, 18, 3, 0, 0, 4, 21, 44, 64],
    rainHist: [78, 65, 56, 39, 24, 5, 1, 1, 6, 26, 51, 74],
    temp2026: [6.4, 8.3, 12.6, 18.1, 24.2, 30.6, 34.8, 34.4, 29.1, 22.1, 13.8, 8.1],
    baseFungal: [32, 38, 52, 48, 30, 10, 5, 5, 10, 24, 34, 34],
    baseDrought: [18, 24, 38, 58, 78, 94, 98, 98, 89, 68, 40, 22],
    frostRisk: 35,
    gddShift: '+20 gün erken',
    heatWaveDays: '48 gün (>38°C)'
  }
};

export const SOIL_LABELS = {
  tinli: 'Tınlı Toprak',
  killi: 'Killi Toprak',
  kumlu: 'Kumlu Toprak',
  kirecli: 'Kireçli / Alüvyal'
};

export const SOIL_HINTS = {
  tinli: { text: 'Dengeli nem tutulumu (İdeal)', color: 'text-emerald-400' },
  killi: { text: '⚠️ Yüksek nem: Mantar riski yüksek', color: 'text-amber-400' },
  kumlu: { text: '💧 Hızlı kuruma: Su stresi riski', color: 'text-sky-400' },
  kirecli: { text: '🧪 Yüksek pH: Mikro besin kilidi', color: 'text-purple-400' }
};