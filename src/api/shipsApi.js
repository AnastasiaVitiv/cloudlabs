import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
});

export const shipsApi = {
    getShips: (params = {}) => {
        console.log( params);
        return api.get('/ships', { params });
    },

    getShipById: (id) => {
        return api.get(`/ships/${id}`);
    },

    logAction: (endpoint, params = {}) => {
        return api.get(`/${endpoint}`, { params });
    },
    
};

export default api;
