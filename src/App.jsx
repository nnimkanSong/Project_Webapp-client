import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import Login from './page/Login';
import Create_acount from './page/Create_acount';
import Profile_user from './page/Profile_user';
import Change_password from './page/Change_password';
import Profile_admin from './page/Profile_admin';
import History_admin from './page/History_admin';
const App = () => {
  return (
    <Routes>
      {/* Route ครอบ Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Route ไม่ใช้ Layout */}
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Profile_user" element={<Profile_user />} />
      <Route path="/create" element={<Create_acount />} />
      <Route path="/change" element={<Change_password />} />
      <Route path="/Profile_admin" element={<Profile_admin />} />
      <Route path="/History_admin" element={<History_admin />} />
    </Routes>
  );
};

export default App;
