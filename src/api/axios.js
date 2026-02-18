import axios from 'axios';

const api = axios.create({
    baseURL: 'https://e-commerce-voice-assist-backend.onrender.com/api',
});

export default api;
