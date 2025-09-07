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
import FeedbackForm from "./page/Feedback";
import Profile_user from "./page/Profile_user";
import History from "./page/History";
import BookingTable from "./page/Admin_booking";

const App = () => {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));

  return (
    <Routes>
      {/* Route ครอบ Layout */}
      <Route
        element={<Layout isAuthenticated={isAuthenticated} setAuth={setAuth} />}
      >
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile_user />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
      

      <Route
        path="/starf"
        element={
          <ProtectedRoute>
            <Starf />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <Change_password />
          </ProtectedRoute>
        }
      />
      </Route>

      {/* Route ไม่ใช้ Layout */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Create_acount />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login setAuth={setAuth} />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <Forgot />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/booking"
        element={
          <PublicRoute>
            <BookingTable />
          </PublicRoute>
        }
      />
</Routes>
  );
};

export default App;
