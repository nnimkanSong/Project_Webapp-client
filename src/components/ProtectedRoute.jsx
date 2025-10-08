// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState(null); // null = กำลังเช็ก
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/auth/me`, {
          withCredentials: true,
          signal: controller.signal,
          validateStatus: s => s < 500, // ให้ 401/403 ไม่โยน error มาที่ catch
        });
        if (!alive) return;
        setAuth(Boolean(res.data?.ok));   // 200 + ok:true = มี session (มี sid ใช้งานได้)
      } catch (e) {
        if (!alive) return;
        // network error / server down -> ถือว่าไม่ผ่าน
        setAuth(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  if (auth === null) return <p>Loading...</p>;

  return auth
    ? children
    : <Navigate to="/login" replace state={{ from: location }} />;
}
