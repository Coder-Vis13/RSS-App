import axios from "axios";
import { getAccessToken, refreshSession, clearAccessToken } from "../auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshSession();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        clearAccessToken();
      }
    }
    return Promise.reject(error);
  },
);

export const get = async (url: string, params?: Record<string, any>) => {
  const response = await api.get(url, { params });
  return response.data;
};

export const post = async (
  url: string,
  body?: any,
  params?: Record<string, any>,
) => {
  const response = await api.post(url, body, { params });
  return response.data;
};

export const put = async (
  url: string,
  body?: any,
  params?: Record<string, any>,
) => {
  const response = await api.put(url, body, { params });
  return response.data;
};

export const del = async (url: string, params?: Record<string, any>) => {
  const response = await api.delete(url, { params });
  return response.data;
};

export default api;
