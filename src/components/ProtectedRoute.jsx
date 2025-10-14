// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectAdminToDashboard = false,
}) {
  const [authState, setAuthState] = useState({ status: "checking", role: null });
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      try {
        const token = Cookies.get("token");
        const res = await axios.get(`${BASE_URL}/api/auth/me`, {
          signal: controller.signal,
          withCredentials: true,
          validateStatus: (s) => s < 500,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!alive) return;

        if (res.data?.ok) {
          const role = String(res.data.user?.role || "").toLowerCase() || null;
          setAuthState({ status: "authed", role });
        } else {
          setAuthState({ status: "unauthed", role: null });
        }
      } catch {
        if (!alive) return;
        setAuthState({ status: "unauthed", role: null });
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [location.pathname]);

  if (authState.status === "checking") return <p>Loading...</p>;

  const isAdmin = authState.role === "admin";
  const onAdminPath = location.pathname.startsWith("/admin");

  if (authState.status === "unauthed") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (redirectAdminToDashboard && isAdmin && !onAdminPath) {
    return <Navigate to="/admin/profile" replace />;
  }

  if (!isAdmin && onAdminPath) {
    return <Navigate to="/" replace />;
  }

  return children;
}
