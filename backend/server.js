require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ana kontrol ucu
app.get('/', (req, res) => {
    res.json({ status: 'active', team: 'Kaptan', service: 'CropGuard AI Backend' });
});

// Tüm API uçlarını /api altına bağla
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Kaptan Backend http://localhost:${PORT} adresinde çalışıyor!`);
});