const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/catalog', apiController.getCatalog);

// [Görev 4] Konum, İklim ve Toprak Analizi Ucu
router.post('/analyze-location', apiController.getLocationAnalysis);

// [Görev 5 & 6] Model Tahmini, Rotasyon ve Senaryo Simülasyonu Ucu
router.post('/simulate-rotation', apiController.runSimulationAndRotation);

// [Görev 7] 14 Günlük Hava Durumu ve Çiftçi Görev Takvimi Ucu
router.post('/weather-tasks', apiController.getWeatherAndTasks);

module.exports = router;
