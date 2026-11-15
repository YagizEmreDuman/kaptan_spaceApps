const axios = require('axios');
const NodeCache = require('node-cache');
const weatherCache = new NodeCache({ stdTTL: 1800 });
const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : null;

async function getForecastAndTasks(lat, lng) {
    const cacheKey = `weather_${lat}_${lng}`;
    if (weatherCache.has(cacheKey)) return weatherCache.get(cacheKey);
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        timeout: 12000,
        params: {
            latitude: lat, longitude: lng, timezone: 'auto', forecast_days: 14,
            temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
            daily: 'temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,dew_point_2m_mean,precipitation_sum,wind_speed_10m_max'
        }
    });
    const daily = response.data.daily;
    if (!Array.isArray(daily?.time) || daily.time.length === 0) {
        throw new Error('Günlük hava verisi bulunamadı.');
    }
    const forecastList = daily.time.map((date, i) => ({
        date,
        maxTemp: finite(daily.temperature_2m_max?.[i]),
        minTemp: finite(daily.temperature_2m_min?.[i]),
        humidity: finite(daily.relative_humidity_2m_mean?.[i]),
        dewPoint: finite(daily.dew_point_2m_mean?.[i]),
        rainMm: finite(daily.precipitation_sum?.[i]),
        windKmh: finite(daily.wind_speed_10m_max?.[i])
    }));
    // Notices are derived only from returned measurements/forecasts, never dates
    // or "suitable for spraying" claims generated from missing inputs.
    const tasks = [];
    for (const day of forecastList) {
        if (day.minTemp !== null && day.minTemp <= 0) tasks.push({
            date: day.date, type: 'UYARI', task: 'Düşük sıcaklık için saha kontrolü',
            reason: `Tahmini en düşük sıcaklık ${day.minTemp} °C.`
        });
        if (day.rainMm !== null && day.rainMm > 5) tasks.push({
            date: day.date, type: 'BİLGİ', task: 'Yağış öncesi saha planını kontrol edin',
            reason: `Tahmini günlük toplam yağış ${day.rainMm} mm.`
        });
    }
    const result = { forecast14Days: forecastList, farmerTaskCalendar: tasks,
        source: 'Open-Meteo', timezone: response.data.timezone || null,
        fetchedAt: new Date().toISOString() };
    weatherCache.set(cacheKey, result);
    return result;
}

module.exports = { getForecastAndTasks };
