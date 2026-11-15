const algorithmService = require('../services/algorithmService');
const weatherService = require('../services/weatherService');

function coordinates(body) {
    const lat = body.location?.latitude ?? body.location?.lat ?? body.lat;
    const lon = body.location?.longitude ?? body.location?.lon ?? body.lng;
    if (typeof lat !== 'number' || typeof lon !== 'number' ||
        !Number.isFinite(lat) || !Number.isFinite(lon) ||
        Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        throw new Error('Geçerli enlem ve boylam gereklidir.');
    }
    return { latitude: lat, longitude: lon };
}

function serviceError(res, error, message) {
    const upstreamStatus = error.response?.status;
    const status = upstreamStatus >= 400 && upstreamStatus < 500 ? upstreamStatus : 503;
    const detail = error.response?.data?.detail;
    return res.status(status).json({ error: typeof detail === 'string' ? detail : message });
}

exports.getCatalog = async (_req, res) => {
    try {
        res.json(await algorithmService.catalog());
    } catch (error) {
        serviceError(res, error, 'Algorithm servisine ulaşılamadı. Ürün kataloğu yüklenemedi.');
    }
};

exports.getLocationAnalysis = async (req, res) => {
    let location;
    try { location = coordinates(req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    try {
        const result = await algorithmService.predict({ location, forecast: req.body.forecast || {} });
        res.json({ success: true, location: result.location, summaryIndicators: result.climateSummary,
            monthlyForecasts: result.monthlyForecasts, historicalClimate: result.historicalClimate,
            rawDailyData: null });
    } catch (error) {
        serviceError(res, error, 'Algorithm iklim verileri alınamadı.');
    }
};

exports.runSimulationAndRotation = async (req, res) => {
    let location;
    try { location = coordinates(req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    try {
        const result = await algorithmService.predict({
            location,
            climateSummary: req.body.climateSummary || {},
            forecast: req.body.forecast || {},
            farmerInputs: req.body.farmerInputs || {},
            scenario: req.body.scenario || {}
        });
        res.json({ success: true, simulationResult: result, upcomingTasks: [] });
    } catch (error) {
        serviceError(res, error, 'Algorithm servisine ulaşılamadı. Tahmin ve rotasyon sonuçları alınamadı.');
    }
};

exports.getWeatherAndTasks = async (req, res) => {
    let location;
    try { location = coordinates(req.body); }
    catch (error) { return res.status(400).json({ error: error.message }); }
    try {
        const data = await weatherService.getForecastAndTasks(location.latitude, location.longitude);
        res.json({ success: true, location, source: data.source, fetchedAt: data.fetchedAt,
            timezone: data.timezone, forecast14Days: data.forecast14Days,
            taskCalendar: data.farmerTaskCalendar });
    } catch (error) {
        serviceError(res, error, 'Günlük hava servisi veri döndürmedi. Örnek hava tahmini kullanılmadı.');
    }
};
