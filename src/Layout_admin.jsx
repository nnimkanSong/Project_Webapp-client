import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/sidebar';
import './css/layout_admin.css';

const Layout_admin = () => {
  return (
    <div className="app-layout bg">
      {/* Sidebar ตรึงซ้าย */}
      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      {/* เนื้อหาเริ่มบนสุด ขนานกับ sidebar */}
      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">© 2025 My App</footer>
    </div>
  );
};

export default Layout_admin;
