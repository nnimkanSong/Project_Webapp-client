import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import Login from './page/Login';
import Create_acount from './page/Create_acount';
import Profile_user from './page/Profile_user';
import Change_password from './page/Change_password';
import Admin_booking from './page/Admin_booking';
import Admin_feedback from './page/Admin_feedback';
import History from './page/History';

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
          path="/Profile/user"
          element={
            <PublicRoute>
              <Profile_user />
            </PublicRoute>
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

      {/* Route ไม่ใช้ Layout */}
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Profile_user" element={<Profile_user />} />
      <Route path="/create" element={<Create_acount />} />
      <Route path="/change" element={<Change_password />} />
      <Route path="/Admin_booking" element={<Admin_booking />} />
      <Route path="/Admin_feedback" element={<Admin_feedback />} />
      <Route path="/History" element={<History />} />
    </Routes>
  );
};

export default App;
