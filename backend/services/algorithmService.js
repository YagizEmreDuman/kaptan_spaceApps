const axios = require('axios');

const algorithm = axios.create({
    baseURL: process.env.ALGORITHM_URL || 'http://127.0.0.1:5000',
    timeout: 4000
});

let localEnginePromise = null;
function getLocalEngine() {
    if (!localEnginePromise) {
        localEnginePromise = import('../../frontend/js/modules/localAlgorithmEngine.js');
    }
    return localEnginePromise;
}

async function predict(payload) {
    try {
        return (await algorithm.post('/predict', payload)).data;
    } catch (error) {
        if (!error.response) {
            const { assessLocal } = await getLocalEngine();
            return assessLocal(payload);
        }
        throw error;
    }
}

async function catalog() {
    try {
        return (await algorithm.get('/catalog')).data;
    } catch (error) {
        if (!error.response) {
            const { getLocalCatalog } = await getLocalEngine();
            return getLocalCatalog();
        }
        throw error;
    }
}

module.exports = { predict, catalog };
