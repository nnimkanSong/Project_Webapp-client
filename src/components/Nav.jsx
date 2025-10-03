// src/components/Nav.jsx
import React from "react";

const Nav = ({ isAuthenticated }) => {
  return (
    <header className="nav-shell">
      <nav className="nav-inner">
        <a className="nav-logo" href="/">
          <img src="/Logo_Home.png" alt="Logo" />
        </a>

        <ul className="nav-menu">
          <li><a className="nav-link" href="/profile">Profile</a></li>
          <li><a className="nav-link" href="/booking">Booking</a></li>
          <li><a className="nav-link" href="/history">History</a></li>
          <li><a className="nav-link" href="/feedback">Feedback</a></li>
          <li>
            {/* ปุ่ม CTA แบบ gradient border */}
            {isAuthenticated ? (
              <a className="nav-cta" href="/logout">Logout</a>
            ) : (
              <a className="nav-cta" href="/login">Logout</a>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Nav;
