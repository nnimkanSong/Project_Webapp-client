import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Home from "./Home";
import Login from "./page/Login";
import Booking from "./page/Booking";
import Create_acount from "./page/Create_acount";
import Change_password from "./page/Change_password";

const App = () => {
  return (
    <Routes>
      {/* Route ครอบ Layout */}
      <Route element={<Layout />}></Route>

      {/* Route ไม่ใช้ Layout */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/Booking" element={<Booking />} />
      <Route path="/create" element={<Create_acount />} />
      <Route path="/change" element={<Change_password />} />
    </Routes>
  );
};

export default App;
