import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import Login from "./page/Login";
import Create_acount from "./page/Create_acount";
import Change_password from "./page/Change_password";
import Forgot from "./page/Forgot";
import Starf from "./page/Starf";
import ProtectedRoute from "./components/ProtectedRoute";
import { useState } from "react";
import PublicRoute from "./components/PublicRoute";
const App = () => {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));

  return (
    <Routes>
      {/* Route ครอบ Layout */}
      <Route element={<Layout  isAuthenticated={isAuthenticated} setAuth={setAuth}/>}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Route ไม่ใช้ Layout */}
      <Route path="/login" element={<Login setAuth={setAuth} />} />
      <Route path="/starf" element={<Starf />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Create_acount />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={
        <PublicRoute>
          <Change_password />
        </PublicRoute>
        } />

    </Routes>
  );
};

export default App;
