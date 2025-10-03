// src/components/Nav.jsx
import React, { useEffect, useRef, useState } from "react";

const Nav = ({ isAuthenticated }) => {
  const shellRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  // update nav height
  useEffect(() => {
    const updateHeight = () => {
      if (!shellRef.current) return;
      const h = shellRef.current.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--nav-height", `${h}px`);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // toggle background เวลา scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header ref={shellRef} className="nav-shell">
        <nav className={`nav-inner ${scrolled ? "is-scrolled" : ""}`}>
          <a className="nav-logo" href="/">
            <img src="/Logo_Home.png" alt="Logo" />
          </a>
          <ul className="nav-menu">
            <li><a className="nav-link" href="/profile">Profile</a></li>
            <li><a className="nav-link" href="/booking">Booking</a></li>
            <li><a className="nav-link" href="/history">History</a></li>
            <li><a className="nav-link" href="/feedback">Feedback</a></li>
            {isAuthenticated ? (
                <a className="nav-cta" href="/logout">Login</a>
              ) : (
                <a className="nav-cta" href="/login">Logout</a>
              )}
          </ul>
        </nav>
      </header>
      <div className="nav-spacer" />
    </>
  );
};

export default Nav;
