const axios = require('axios');

const algorithm = axios.create({
    baseURL: process.env.ALGORITHM_URL || 'http://127.0.0.1:5000',
    timeout: 30000
});

async function predict(payload) {
    return (await algorithm.post('/predict', payload)).data;
}

async function catalog() {
    return (await algorithm.get('/catalog')).data;
}

module.exports = { predict, catalog };
