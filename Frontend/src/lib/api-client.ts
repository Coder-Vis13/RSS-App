import axios from "axios";
import { supabase } from "./supabase";

const API_BASE_URL = "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE_URL,
  // withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const get = async (url: string, params?: Record<string, any>) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error: any) {
    console.error("GET error:", error.response?.data || error.message);
    throw error;
  }
};

export const post = async (
  url: string,
  body?: any,
  params?: Record<string, any>,
) => {
  try {
    const response = await api.post(url, body, { params });
    return response.data;
  } catch (error: any) {
    console.error("POST error:", error.response?.data || error.message);
    throw error;
  }
};

export const put = async (
  url: string,
  body?: any,
  params?: Record<string, any>,
) => {
  try {
    const response = await api.put(url, body, { params });
    return response.data;
  } catch (error: any) {
    console.error("PUT error:", error.response?.data || error.message);
    throw error;
  }
};

export const del = async (url: string, params?: Record<string, any>) => {
  try {
    const response = await api.delete(url, { params });
    return response.data;
  } catch (error: any) {
    console.error("DELETE error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;

