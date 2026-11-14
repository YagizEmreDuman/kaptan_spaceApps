const axios = require('axios');
const NodeCache = require('node-cache');

const climateCache = new NodeCache({ stdTTL: 3600 });

async function getNasaPowerData(lat, lng) {
    const cacheKey = `nasa_${lat}_${lng}`;

    if (climateCache.has(cacheKey)) {
        console.log("⚡ Veriler Önbellekten (Cache) getirildi!");
        return climateCache.get(cacheKey);
    }

    console.log("🛰️ NASA POWER API'den veri çekiliyor...");
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,RH2M,T2MDEW,PRECTOTCORR&community=AG&longitude=${lng}&latitude=${lat}&start=20230101&end=20231231&format=JSON`;

    const response = await axios.get(nasaUrl);
    const rawData = response.data.properties.parameter;

    climateCache.set(cacheKey, rawData);
    return rawData;
}

module.exports = { getNasaPowerData };