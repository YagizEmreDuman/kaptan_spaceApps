const nasaService = require('../services/nasaService');

exports.getLocationAnalysis = async (req, res) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Enlem (lat) ve boylam (lng) zorunludur!" });
    }

    try {
        const climateData = await nasaService.getNasaPowerData(lat, lng);
        res.json({
            success: true,
            location: { lat, lng },
            indicators: climateData
        });
    } catch (error) {
        console.error("Veri Çekme Hatası:", error.message);
        res.status(500).json({ error: "İklim verileri alınamadı." });
    }
};

exports.runSimulationAndRotation = async (req, res) => {
    const { lat, lng, farmerInputs } = req.body;

    try {
        const climateData = await nasaService.getNasaPowerData(lat, lng);

        const mockRecommendation = {
            riskLevel: "Yüksek Mantar Riski (Mayıs Ortası)",
            suggestedCrop: "Nohut (Dirençli Alternatif)",
            shiftedPlantingDate: "25 Mayıs 2027 (Gelenekselden 15 gün geç)"
        };

        res.json({
            success: true,
            result: mockRecommendation
        });
    } catch (error) {
        console.error("Simülasyon Hatası:", error.message);
        res.status(500).json({ error: "Model simülasyonu çalıştırılamadı." });
    }
};