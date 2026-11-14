const axios = require('axios');
const NodeCache = require('node-cache');

const climateCache = new NodeCache({ stdTTL: 3600 });

async function getNasaPowerData(lat, lng) {
    const cacheKey = `nasa_${lat}_${lng}`;

    if (climateCache.has(cacheKey)) {
        console.log("⚡ NASA Verileri Önbellekten (Cache) getirildi!");
        return climateCache.get(cacheKey);
    }

    console.log("🛰️ NASA POWER API'den veri çekiliyor...");
    // T2M: Sıcaklık, T2M_MAX/MIN: Gece-Gündüz farkı için, RH2M: Bağıl Nem, T2MDEW: Çiy Noktası, PRECTOTCORR: Yağış, GWETTOP: Yüzey Toprak Nemi
    const params = "T2M,T2M_MAX,T2M_MIN,RH2M,T2MDEW,PRECTOTCORR,GWETTOP";
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lng}&latitude=${lat}&start=20230101&end=20231231&format=JSON`;

    const response = await axios.get(nasaUrl);
    const raw = response.data.properties.parameter;

    // Furkan ve Barbaros için veriyi işleme (Gece-gündüz sıcaklık farkı ve aylık özetler)
    const processedData = processClimateData(raw);

    const result = {
        rawDaily: raw,
        summary: processedData
    };

    climateCache.set(cacheKey, result);
    return result;
}

function processClimateData(raw) {
    const dates = Object.keys(raw.T2M);
    let highFungalRiskDays = 0;
    const monthlySummary = {};

    dates.forEach(date => {
        const month = date.substring(4, 6); // "01", "02" vb.
        const temp = raw.T2M[date];
        const tempMax = raw.T2M_MAX[date];
        const tempMin = raw.T2M_MIN[date];
        const humidity = raw.RH2M[date];
        const dewPoint = raw.T2MDEW[date];
        const rain = raw.PRECTOTCORR[date];
        const soilMoisture = raw.GWETTOP[date];

        // Gece-gündüz sıcaklık farkı (CropGuard AI özel metriği)
        const diurnalRange = +(tempMax - tempMin).toFixed(2);

        // Mantar üreme eşiği: Nem > %75 ve Sıcaklık 15-28 derece arası
        const isFungalRisk = (humidity > 75 && temp >= 15 && temp <= 28);
        if (isFungalRisk) highFungalRiskDays++;

        if (!monthlySummary[month]) {
            monthlySummary[month] = { tempSum: 0, humSum: 0, rainSum: 0, diffSum: 0, soilSum: 0, riskDays: 0, count: 0 };
        }

        monthlySummary[month].tempSum += temp;
        monthlySummary[month].humSum += humidity;
        monthlySummary[month].rainSum += rain;
        monthlySummary[month].diffSum += diurnalRange;
        monthlySummary[month].soilSum += soilMoisture;
        if (isFungalRisk) monthlySummary[month].riskDays += 1;
        monthlySummary[month].count += 1;
    });

    // Aylık ortalamaları netleştirme
    const formattedMonths = {};
    for (const m in monthlySummary) {
        const d = monthlySummary[m];
        formattedMonths[m] = {
            avgTemp: +(d.tempSum / d.count).toFixed(1),
            avgHumidity: +(d.humSum / d.count).toFixed(1),
            totalRain: +(d.rainSum).toFixed(1),
            avgTempDiff: +(d.diffSum / d.count).toFixed(1), // Gece-gündüz farkı
            avgSoilMoisture: +(d.soilSum / d.count).toFixed(2), // Toprak göstergesi
            fungalRiskDays: d.riskDays
        };
    }

    return {
        totalHighFungalRiskDays: highFungalRiskDays,
        monthlyIndicators: formattedMonths
    };
}

module.exports = { getNasaPowerData };