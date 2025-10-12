// src/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true, // ✅ สำคัญ: ให้เบราเซอร์ส่ง/รับคุกกี้อัตโนมัติ
});
