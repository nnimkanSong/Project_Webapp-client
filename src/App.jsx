import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import Login from "./page/Login";
import Create_acount from "./page/Create_acount";
import ResetPassword from "./page/Change_password";
import Forgot from "./page/Forgot";
import Starf from "./page/Starf";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Booking from "./page/Booking";
import Profile_user from "./page/Profile_user";
import FeedbackForm from "./page/Feedback";
import History from "./page/History";
import BookingTable from "./page/admin/Admin_booking";
import Layout_admin from "./Layout_admin";
import Admin_usermanagement from "./page/admin/Admin_usermanagement";
import Admin_profile from "./page/admin/Profile_admin";
import Admin_history from "./page/admin/History_admin";
import Admin_dashboard from "./page/admin/Admindashboard";
import Admin_feedback from "./page/admin/Admin_feedback";


const App = () => {
  const [isAuthenticated, setAuth] = useState(!!localStorage.getItem("token"));

  return (
    
    <Routes>
      {/* กลุ่มที่ใช้ Layout */}
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
        {/* admin feedback */}

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
            <ResetPassword  />
          </PublicRoute>
        }
      />
      {/* admin page แสดงใน Layout ด้วย */}
      <Route
        element={
          <Layout_admin isAuthenticated={isAuthenticated} setAuth={setAuth} />
        }
      >
        <Route path="/admin/booking" element={<BookingTable />} />
        <Route path="/admin/profile" element={<Admin_profile />} />
        <Route
          path="/admin/users-management"
          element={<Admin_usermanagement />}
        />
        <Route
          path="/admin/history"
          element={<Admin_history />}
        />
        <Route
          path="/admin/dashboard"
          element={<Admin_dashboard />}
        />
        <Route
          path="/admin/feedback"
          element={<Admin_feedback />}
          />
      </Route>
    </Routes>
  );
};

export default App;
