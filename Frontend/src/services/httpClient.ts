// // services/httpClient.ts
// import axios from 'axios';
// import type { AxiosInstance } from 'axios';

// const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// const httpClient: AxiosInstance = axios.create({
//   baseURL: API_BASE,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   // you might set timeout, etc.
// });

// // // Request interceptor example: add auth token
// // httpClient.interceptors.request.use(config => {
// //   const token = localStorage.getItem('authToken'); // or from context
// //   if (token) {
// //     config.headers['Authorization'] = `Bearer ${token}`;
// //   }
// //   return config;
// // }, error => Promise.reject(error));

// // Response interceptor example: global error handling
// httpClient.interceptors.response.use(
//   response => response,
//   error => {
//     console.error('API error:', error);
//     return Promise.reject(error);
//   }
// );

// export default httpClient;
