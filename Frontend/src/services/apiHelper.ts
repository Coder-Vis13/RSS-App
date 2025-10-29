import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; 

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const get = async (url: string, params?: any) => {
  try {
    const response = await api.get(url, { params });
    return response.data;
  } catch (error: any) {
    console.error("GET error:", error.response?.data || error.message);
    throw error;
  }
};

export const post = async (url: string, body?: any) => {
  try {
    const response = await api.post(url, body);
    return response.data;
  } catch (error: any) {
    console.error("POST error:", error.response?.data || error.message);
    throw error;
  }
};

export const put = async (url: string, body?: any) => {
  try {
    const response = await api.put(url, body);
    return response.data;
  } catch (error: any) {
    console.error("PUT error:", error.response?.data || error.message);
    throw error;
  }
};

export const del = async (url: string, params?: any) => {
  try {
    const response = await api.delete(url, { params });
    return response.data;
  } catch (error: any) {
    console.error("DELETE error:", error.response?.data || error.message);
    throw error;
  }
};

export default api;








// import httpClient from './httpClient';
// import type { AxiosResponse } from 'axios';

// //GET request
// export async function get<T>(url: string, params?: any): Promise<T> {
//   const res: AxiosResponse<T> = await httpClient.get(url, { params });
//   return res.data;
// }

// //POST request
// export async function post<TReq, TRes>(url: string, data: TReq): Promise<TRes> {
//   const res: AxiosResponse<TRes> = await httpClient.post(url, data);
//   return res.data;
// }

// //PUT request
// export async function put<TReq, TRes>(url: string, data: TReq): Promise<TRes> {
//   const res: AxiosResponse<TRes> = await httpClient.put(url, data);
//   return res.data;
// }

// //DELETE request
// export async function del<T>(url: string): Promise<T> {
//   const res: AxiosResponse<T> = await httpClient.delete(url);
//   return res.data;
// }
