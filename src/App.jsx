import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './Home';
import Login from './page/Login';

const App = () => {
  return (
    <Routes>
      {/* Route ครอบ Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Route ไม่ใช้ Layout */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default App;
