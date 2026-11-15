require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Let the served frontend follow PORT without embedding a fixed API address.
app.get('/api/config.js', (_req, res) => {
    res.type('application/javascript').set('Cache-Control', 'no-store')
        .send('globalThis.CROPGUARD_API_BASE_URL = location.origin + "/api";');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'active', team: 'Kaptan', service: 'CropGuard AI Backend' });
});

// Mount all API routes under /api
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, '../frontend')));

if (require.main === module) app.listen(PORT, (error) => {
    if (error) {
        console.error(`Failed to start backend: ${error.message}`);
        process.exitCode = 1;
        return;
    }
    console.log(`🚀 Kaptan Backend running at http://localhost:${PORT}!`);
});

module.exports = app;
