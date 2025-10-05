import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState(null); // null = กำลังเช็ค, true/false = ผลลัพธ์

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
          { withCredentials: true } // ✅ ต้องมีเพื่อส่ง cookie sid ไป
        );
        if (res.data.ok) {
          setAuth(true);
        } else {
          setAuth(false);
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

  return auth ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
