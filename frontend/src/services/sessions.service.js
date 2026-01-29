import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const sessionsService = {
    
    getMySessions: async () => {
        const response = await api.get('/sessions/me');
        return response.data.sessions || [];
    },

    removeMySession: async (sessionId) => {
        const response = await api.delete(`/sessions/me/${sessionId}`);
        return response.data;
    },

    getUserSessions: async (userId) => {
        const response = await api.get(`/sessions/user/${userId}`);
        return response.data.sessions || [];
    },

    removeUserSession: async (userId, sessionId) => {
        const response = await api.delete(`/sessions/user/${userId}/${sessionId}`);
        return response.data;
    },

    removeAllUserSessions: async (userId) => {
        const response = await api.delete(`/sessions/user/${userId}`);
        return response.data;
    },

    getStats: async () => {
        const response = await api.get('/sessions/stats');
        return response.data;
    },
};

export default sessionsService;
