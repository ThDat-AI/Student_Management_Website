// src/api/index.jsx
import axios from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/index';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
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
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url.includes('/api/auth/token/')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    if (!refreshToken) {
      console.log("Không có refresh token, đăng xuất.");
      localStorage.clear();
      window.location.href = '/login';
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const rs = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = rs.data;
      localStorage.setItem(ACCESS_TOKEN, access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      originalRequest.headers['Authorization'] = `Bearer ${access}`;
      
      processQueue(null, access);
      return api(originalRequest);

    } catch (_error) {
      processQueue(_error, null);
      console.log("Refresh token đã hết hạn, đăng xuất.");
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(_error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;