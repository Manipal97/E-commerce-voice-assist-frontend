import axios from 'axios';

const api = axios.create({
    baseURL: 'https://e-commerce-voice-assist-backend.vercel.app/api',
});

export default api;
