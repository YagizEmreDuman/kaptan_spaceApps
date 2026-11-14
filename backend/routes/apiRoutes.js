const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.post('/analyze-location', apiController.getLocationAnalysis);
router.post('/simulate-rotation', apiController.runSimulationAndRotation);

module.exports = router;