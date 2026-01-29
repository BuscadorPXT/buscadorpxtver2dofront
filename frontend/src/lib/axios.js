import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {

    console.log('[API Error]', {
      url: error.config?.url,
      status: error.response?.status,
      code: error.code,
      message: error.message,
      isNetworkError: !error.response,
    });
    
    return Promise.reject(error);
  }
);

export default api;
