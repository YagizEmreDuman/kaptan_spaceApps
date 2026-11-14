export const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export const SOIL_LABELS = {
  tinli: 'Tınlı Toprak',
  killi: 'Killi Toprak',
  kumlu: 'Kumlu Toprak',
  kirecli: 'Kireçli Toprak'
};

export const REGIONAL_CLIMATE_DB = {
  konya: {
    name: 'Türkiye — Konya Ovası',
    rain2026: [34, 30, 32, 36, 38, 20, 5, 4, 11, 25, 31, 38],
    rainHist: [38, 33, 35, 42, 45, 25, 7, 6, 14, 28, 34, 42],
    temp2026: [1.2, 2.8, 7.4, 12.6, 17.5, 22.1, 25.8, 25.6, 20.9, 14.5, 8.1, 3.0],
    baseFungal: [22, 28, 44, 72, 78, 42, 15, 12, 20, 35, 28, 24],
    baseDrought: [18, 22, 30, 44, 62, 82, 92, 94, 78, 52, 32, 20],
    frostRisk: 55,
    gddShift: '+16 gün erken',
    heatWaveDays: '28 gün (>35°C)'
  },
  cukurova: {
    name: 'Türkiye — Çukurova (Adana)',
    rain2026: [105, 88, 72, 54, 42, 18, 6, 5, 16, 44, 78, 112],
    rainHist: [112, 94, 78, 58, 46, 22, 8, 7, 19, 48, 84, 118],
    temp2026: [10.4, 11.6, 14.8, 18.9, 23.2, 27.1, 29.8, 30.2, 27.4, 22.6, 16.5, 11.9],
    baseFungal: [38, 46, 64, 82, 86, 58, 32, 30, 42, 54, 44, 40],
    baseDrought: [12, 15, 22, 34, 50, 72, 84, 86, 68, 42, 22, 14],
    frostRisk: 14,
    gddShift: '+12 gün erken',
    heatWaveDays: '42 gün (>35°C)'
  },
  midwest: {
    name: 'ABD — Midwest Mısır Kuşağı (Iowa)',
    rain2026: [24, 28, 52, 84, 108, 116, 94, 88, 74, 58, 42, 30],
    rainHist: [26, 30, 56, 88, 112, 122, 104, 96, 80, 62, 46, 32],
    temp2026: [-6.5, -3.8, 3.4, 10.8, 17.2, 22.6, 25.1, 24.0, 19.2, 12.1, 3.6, -3.9],
    baseFungal: [12, 15, 28, 52, 74, 82, 76, 68, 48, 28, 16, 12],
    baseDrought: [14, 16, 20, 26, 34, 48, 68, 72, 54, 34, 20, 15],
    frostRisk: 64,
    gddShift: '+14 gün erken',
    heatWaveDays: '19 gün (>35°C)'
  },
  castilla: {
    name: 'İspanya — Castilla-La Mancha',
    rain2026: [32, 28, 30, 38, 34, 16, 4, 5, 18, 36, 40, 36],
    rainHist: [36, 32, 34, 44, 40, 20, 6, 7, 22, 42, 46, 42],
    temp2026: [5.4, 7.1, 10.6, 13.8, 18.4, 24.2, 28.1, 27.6, 22.4, 15.8, 9.6, 6.1],
    baseFungal: [24, 30, 46, 66, 62, 30, 12, 12, 24, 42, 34, 26],
    baseDrought: [22, 26, 34, 48, 68, 86, 95, 94, 80, 54, 34, 24],
    frostRisk: 38,
    gddShift: '+17 gün erken',
    heatWaveDays: '36 gün (>35°C)'
  },
  matogrosso: {
    name: 'Brezilya — Mato Grosso (Güney Yarımküre)',
    rain2026: [265, 240, 210, 115, 32, 8, 5, 12, 48, 135, 195, 250],
    rainHist: [280, 255, 225, 125, 38, 12, 8, 15, 55, 148, 210, 265],
    temp2026: [26.8, 26.6, 26.7, 26.4, 25.1, 23.8, 23.9, 25.8, 27.6, 27.8, 27.2, 26.9],
    baseFungal: [88, 86, 82, 64, 34, 18, 14, 18, 36, 62, 78, 85],
    baseDrought: [12, 14, 18, 36, 68, 88, 94, 92, 74, 42, 22, 14],
    frostRisk: 4,
    gddShift: '+11 gün erken',
    heatWaveDays: '48 gün (>35°C)'
  },
  bavaria: {
    name: 'Almanya — Bavyera Tarım Havzası',
    rain2026: [48, 44, 52, 58, 78, 92, 96, 88, 68, 56, 52, 50],
    rainHist: [50, 46, 54, 60, 82, 98, 102, 94, 72, 58, 54, 52],
    temp2026: [-0.8, 0.9, 5.2, 9.8, 14.6, 18.2, 20.4, 19.9, 15.4, 9.8, 4.1, 0.4],
    baseFungal: [20, 24, 38, 58, 76, 84, 80, 74, 56, 38, 26, 22],
    baseDrought: [10, 12, 16, 24, 32, 42, 52, 50, 36, 22, 14, 10],
    frostRisk: 68,
    gddShift: '+13 gün erken',
    heatWaveDays: '9 gün (>35°C)'
  },
  flevoland: {
    name: 'Hollanda — Flevoland Polderleri',
    rain2026: [66, 52, 54, 44, 56, 64, 74, 78, 72, 76, 74, 72],
    rainHist: [68, 54, 56, 46, 58, 66, 76, 80, 74, 78, 76, 74],
    temp2026: [3.2, 3.8, 6.6, 10.1, 14.2, 17.0, 19.2, 19.0, 15.8, 11.4, 7.1, 4.1],
    baseFungal: [32, 36, 48, 62, 74, 80, 82, 84, 76, 60, 44, 36],
    baseDrought: [8, 10, 14, 22, 30, 38, 44, 42, 28, 16, 10, 8],
    frostRisk: 46,
    gddShift: '+12 gün erken',
    heatWaveDays: '6 gün (>35°C)'
  }
};