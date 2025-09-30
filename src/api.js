import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000', 
  withCredentials: false, // ใช้ JWT Bearer token ไม่ต้อง cookie
});
