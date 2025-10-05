import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

function PublicRoute({ children }) {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
          { withCredentials: true } // ✅ ส่ง cookie sid ไป
        );
        if (res.data.ok) {
          setAuth(true); // ล็อกอินแล้ว
        } else {
          setAuth(false); // ยังไม่ได้ล็อกอิน
        }
      } catch (err) {
        setAuth(false);
      }
    };

    checkSession();
  }, []);

  if (auth === null) {
    return <p>Loading...</p>; // หรือ spinner
  }

  // ถ้าล็อกอินอยู่ → ไปหน้า Home ทันที
  if (auth) {
    return <Navigate to="/" replace />;
  }

  // ถ้ายังไม่ล็อกอิน → ให้แสดง children (เช่นหน้า Login/Register)
  return children;
}

export default PublicRoute;
