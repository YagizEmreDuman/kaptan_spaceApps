const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.get('/catalog', apiController.getCatalog);

// Location, Climate & Soil Analysis Endpoint
router.post('/analyze-location', apiController.getLocationAnalysis);

// Model Forecast, Rotation & Scenario Simulation Endpoint
router.post('/simulate-rotation', apiController.runSimulationAndRotation);

// 14-Day Weather Forecast & Farmer Task Calendar Endpoint
router.post('/weather-tasks', apiController.getWeatherAndTasks);

module.exports = router;
