import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import Login from "./page/Login";
import Create_acount from "./page/Create_acount";
import Change_password from "./page/Change_password";
import Forgot from "./page/Forgot";
import Starf from "./page/Starf";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Booking from "./page/Booking";
import Profile_user from "./page/Profile_user";
import FeedbackForm from "./page/Feedback";
import History from "./page/History";
import BookingTable from "./page/Admin_booking";
import Admin_usermanagement from "./page/admin/Admin_usermanagement";

const App = () => {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));

  return (
    <Routes>
      {/* กลุ่มที่ใช้ Layout */}
      <Route element={<Layout isAuthenticated={isAuthenticated} setAuth={setAuth} />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* คงตามเดิม: Booking เป็น PublicRoute */}
        <Route
          path="/Booking"
          element={
            <ProtectedRoute>
              <Booking />
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
          path="/Profile"
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

        {/* เลือกให้ /starf เข้าถึงได้เฉพาะคนล็อกอิน */}
        <Route
          path="/starf"
          element={
            <ProtectedRoute>
              <Starf />
            </ProtectedRoute>
          }
        />

        {/* admin page แสดงใน Layout ด้วย */}
        <Route
          path="/admin/booking"
          element={
            <PublicRoute>
              <BookingTable />
            </PublicRoute>
          }
        />
      </Route>

      {/* กลุ่มที่ไม่ใช้ Layout (เช่น หน้า Auth) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login setAuth={setAuth} />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Create_acount />
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
      {/* reset-password ควรเป็น PublicRoute เพราะลิงก์อีเมล */}
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <Change_password />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/users-management"
        element={
            <Admin_usermanagement />
        }
      />
    </Routes>
  );
};

export default App;
