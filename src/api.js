// src/api.js
import axios from "axios";
import Swal from "sweetalert2";
import { isCookieAllowed } from "./lib/consent"; // ✅ เพิ่มบรรทัดนี้

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: true, // ค่าเริ่มต้น
});

// ✅ Interceptor ตรวจทุก request ก่อนส่งออก
api.interceptors.request.use(
  (config) => {
    // ถ้าผู้ใช้ปฏิเสธคุกกี้ → ห้ามส่ง request ที่ต้องใช้ cookie
    if (config.withCredentials && !isCookieAllowed()) {
      Swal.fire({
        icon: "warning",
        title: "ปฏิเสธการใช้คุกกี้",
        text: "คุณได้ปฏิเสธการใช้คุกกี้ ระบบจะไม่บันทึกการเข้าสู่ระบบหรือ session ใดๆ",
      });
      // ยกเลิก request
      return Promise.reject(new Error("Cookie consent required"));
    }
    return config;
  },
  (error) => Promise.reject(error)
);
