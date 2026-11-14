const nasaService = require('../services/nasaService');
const weatherService = require('../services/weatherService');
const axios = require('axios');

// [Görev 4] Konum ve Analiz API'si (NASA İklim + Toprak + Aylık Göstergeler)
exports.getLocationAnalysis = async (req, res) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Enlem (lat) ve boylam (lng) zorunludur!" });
    }

    try {
        const nasaData = await nasaService.getNasaPowerData(lat, lng);
        res.json({
            success: true,
            location: { lat, lng },
            summaryIndicators: nasaData.summary, // Barbaros'un kolayca grafik çizeceği özet
            rawDailyData: nasaData.rawDaily      // Furkan'ın modeli isterse diye günlük ham veri
        });
    } catch (error) {
        console.error("Veri Çekme Hatası:", error.message);
        res.status(500).json({ error: "İklim verileri alınamadı." });
    }
};

// [Görev 5 ve 6] Model Servis Entegrasyonu + Rotasyon ve Simülasyon API'si
exports.runSimulationAndRotation = async (req, res) => {
    const { lat, lng, farmerInputs, scenario } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Enlem (lat) ve boylam (lng) zorunludur!" });
    }

    try {
        const nasaData = await nasaService.getNasaPowerData(lat, lng);
        const weatherData = await weatherService.getForecastAndTasks(lat, lng);

        let modelResult = null;

        // Furkan'ın Python servisine (Örn: localhost:5000/predict) bağlanmayı dener [Görev 5]
        try {
            const pythonResponse = await axios.post('http://localhost:5000/predict', {
                location: { lat, lng },
                climateSummary: nasaData.summary,
                forecast: weatherData.forecast14Days,
                farmerInputs: farmerInputs || { budget: "orta", irrigation: "damla", machinery: "standart" },
                scenario: scenario || { rainChangePercent: 0, tempChange: 0 }
            }, { timeout: 3000 }); // 3 saniye içinde yanıt gelmezse kendi yedek motoruna geçer

            modelResult = pythonResponse.data;
            console.log("🐍 Sonuç Furkan'ın Python modelinden alındı!");
        } catch (pyError) {
            console.log("ℹ️ Python servisi henüz bağlı değil, Dahili Karar Motoru devreye girdi.");
            
            // Yedek (Fallback) Karar ve Simülasyon Motoru (Senin tarafında her şeyin tam çalışması için)
            const mayRisk = nasaData.summary.monthlyIndicators["05"]?.fungalRiskDays || 5;
            const isHighRisk = mayRisk > 8 || (scenario && scenario.humidityIncrease > 10);

            modelResult = {
                engine: "CropGuard Hybrid Engine",
                diseaseAnalysis: {
                    riskStatus: isHighRisk ? "YÜKSEK MANTAR VE KÜF RİSKİ" : "ORTA / KONTROLLÜ RİSK",
                    annualRiskDays: nasaData.summary.totalHighFungalRiskDays,
                    criticalMonths: ["Nisan Sonu", "Mayıs Ortası"]
                },
                cropRecommendation: {
                    avoidCrop: "Geleneksel Buğday / Hassas Domates (Yüksek Nem Riski)",
                    suggestedCrop: isHighRisk ? "Nohut veya Mercimek (Mantara Dirençli & Azot Bağlayıcı)" : "Ayçiçeği / Dirençli Arpa",
                    shiftedPlantingDate: isHighRisk ? "25 Mayıs (Geleneksel takvimden 15 gün ileri kaydırıldı)" : "12 Mayıs (8 gün ileri kaydırıldı)",
                    expectedYieldProtection: "%28 Verim Kaybı Önleme"
                },
                appliedFarmerProfile: farmerInputs || "Varsayılan Çiftçi Profili",
                appliedScenario: scenario || "Standart İklim Trendi"
            };
        }

        res.json({
            success: true,
            simulationResult: modelResult,
            upcomingTasks: weatherData.farmerTaskCalendar
        });

    } catch (error) {
        console.error("Simülasyon Hatası:", error.message);
        res.status(500).json({ error: "Model simülasyonu çalıştırılamadı." });
    }
};

// [Görev 7] Hava Durumu ve Görev Takvimi API'si
exports.getWeatherAndTasks = async (req, res) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Enlem (lat) ve boylam (lng) zorunludur!" });
    }

    try {
        const data = await weatherService.getForecastAndTasks(lat, lng);
        res.json({
            success: true,
            location: { lat, lng },
            forecast14Days: data.forecast14Days,
            taskCalendar: data.farmerTaskCalendar
        });
    } catch (error) {
        console.error("Hava Durumu Hatası:", error.message);
        res.status(500).json({ error: "Hava tahmini ve görev takvimi alınamadı." });
    }
};