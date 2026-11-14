const axios = require('axios');
const NodeCache = require('node-cache');

const weatherCache = new NodeCache({ stdTTL: 1800 }); // 30 dakika önbellek

async function getForecastAndTasks(lat, lng) {
    const cacheKey = `weather_${lat}_${lng}`;

    if (weatherCache.has(cacheKey)) {
        console.log("⚡ Hava Tahmini ve Görevler Önbellekten getirildi!");
        return weatherCache.get(cacheKey);
    }

    console.log("🌦️ 14 Günlük Hava Tahmini ve Görev Takvimi oluşturuluyor...");
    // 14 günlük sıcaklık, nem, çiy noktası ve yağış tahmini
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,dew_point_2m_mean,precipitation_sum&timezone=auto&forecast_days=14`;

    const response = await axios.get(url);
    const daily = response.data.daily;

    const forecastList = [];
    const taskSchedule = [];

    for (let i = 0; i < daily.time.length; i++) {
        const date = daily.time[i];
        const maxT = daily.temperature_2m_max[i];
        const minT = daily.temperature_2m_min[i];
        const hum = daily.relative_humidity_2m_mean[i];
        const dew = daily.dew_point_2m_mean[i];
        const rain = daily.precipitation_sum[i];
        const tempDiff = +(maxT - minT).toFixed(1);

        forecastList.push({
            date,
            maxTemp: maxT,
            minTemp: minT,
            tempDiff,
            humidity: hum,
            dewPoint: dew,
            rainMm: rain
        });

        // Çiftçi Görev Takvimi Algoritması [Görev 7]
        if (hum > 75 && maxT >= 16 && maxT <= 28) {
            taskSchedule.push({
                date,
                type: "KRİTİK_UYARI",
                task: "Yüksek mantar üreme riski! Sulamayı durdurun ve koruyucu ilaçlama planlayın.",
                reason: `Nem %${hum} ve sıcaklık ${maxT}°C (Mantar eşiği aşıldı)`
            });
        } else if (rain > 5.0) {
            taskSchedule.push({
                date,
                type: "BİLGİ",
                task: "Traktör/Makine girişine uygun değil (Çamur riski). Gübrelemeyi erteleyin.",
                reason: `${rain} mm yağış bekleniyor.`
            });
        } else if (tempDiff > 14) {
            taskSchedule.push({
                date,
                type: "ÖNERİ",
                task: "Gece-gündüz sıcaklık farkı yüksek. Soğuğa hassas fideleri koruyun.",
                reason: `Sıcaklık farkı ${tempDiff}°C (Gündüz ${maxT}°C / Gece ${minT}°C)`
            });
        }
    }

    // Hiç ekstrem durum yoksa standart görev ekle
    if (taskSchedule.length === 0) {
        taskSchedule.push({
            date: daily.time[0],
            type: "UYGUN",
            task: "İklim şartları stabil. Ekim, toprak işleme ve standart sulama için uygun hafta.",
            reason: "Hastalık veya aşırı yağış eşiği tespit edilmedi."
        });
    }

    const result = {
        forecast14Days: forecastList,
        farmerTaskCalendar: taskSchedule
    };

    weatherCache.set(cacheKey, result);
    return result;
}

module.exports = { getForecastAndTasks };