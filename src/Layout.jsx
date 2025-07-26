import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Nav from './component/nav';
import './css/layout.css'
const Layout = () => {
  return (
    <div>
      <header>
        <Nav/>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>© 2025 My App</footer>
    </div>
  );
};

export default Layout;
