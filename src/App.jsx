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
import ResetPasswordAdmin from "./page/Change_password_admin";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}
const App = () => {
  const [isAuthenticated, setAuth] = useState(!!getCookie("token"));

  return (
    
    <Routes>
      {/* กลุ่มที่ใช้ Layout */}
      <Route
        element={<Layout isAuthenticated={isAuthenticated} setAuth={setAuth} />}
      >
        <Route
          path="/"
          element={
            <ProtectedRoute redirectAdminToDashboard>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* คงตามเดิม: Booking เป็น PublicRoute */}
        <Route
          path="/Booking"
          element={
            <ProtectedRoute redirectAdminToDashboard>
              <Booking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback"
          element={
            <ProtectedRoute redirectAdminToDashboard>
              <FeedbackForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Profile"
          element={
            <ProtectedRoute redirectAdminToDashboard>
              <Profile_user />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute redirectAdminToDashboard>
              <History />
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
          // <ProtectedRoute>
            <ResetPassword  />
          // </ProtectedRoute>
        }
      />
      {/* admin page แสดงใน Layout ด้วย */}
      <Route
        element={
          <Layout_admin isAuthenticated={isAuthenticated} setAuth={setAuth} />
        }
      >
        <Route path="/admin/booking" element={
          <ProtectedRoute>

          <BookingTable />
          </ProtectedRoute>
          
          } />
        <Route 
        path="/admin/profile"
        element={
          <Admin_profile />} />
        <Route
          path="/admin/users-management"
          element={
            <ProtectedRoute>
              
          <Admin_usermanagement />
            </ProtectedRoute>
        
        }
        />
        <Route
          path="/admin/history"
          element={
            <ProtectedRoute requireAdmin>
              <Admin_history />
            </ProtectedRoute>
        }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
            <Admin_dashboard />

          </ProtectedRoute>
        }
        />
      </Route>
        <Route
          path="/admin/reset-password"
          element={
            <ProtectedRoute requireAdmin>
            <ResetPasswordAdmin />

          </ProtectedRoute>
        }
        />

    </Routes>
  );
};

export default App;
