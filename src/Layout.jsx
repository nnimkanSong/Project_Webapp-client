import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Nav from './components/Nav';
import './css/layout.css'

const Layout = () => {
  return (
    <div className='bg'>
      <header>
        <Nav/>
      </header>

      <main>
        <Outlet />
      </main>
      {/* <footer> */}
    </div>
    
  );
};

export default Layout;
