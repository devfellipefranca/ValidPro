import axios from 'axios';

const API_URL = 'https://sua-api.com'; // Substitua pela URL da sua API

export const fetchData = async (endpoint) => {
    try {
        const response = await axios.get(`${API_URL}/${endpoint}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
};

export const postData = async (endpoint, data) => {
    try {
        const response = await axios.post(`${API_URL}/${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        throw error;
    }
};