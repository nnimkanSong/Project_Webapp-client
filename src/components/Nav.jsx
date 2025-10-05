import React from 'react';
import axios from 'axios';
const Nav = ({ isAuthenticated, setAuth }) => {
  const handleLogout = async (setAuth) => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );

    if (typeof setAuth === "function") {
      setAuth(false);
    }

    window.location.href = "/login";
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

  return (
    <nav>
      <div className="logo">
        <a href="/">
          <img src="/Logo_Home.png" alt="Home Logo" />
        </a>
      </div>
      <ul>
        {isAuthenticated ? (
          <>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/Booking">Booking</a></li>
            <li><a href="/history">History</a></li>
            <li><a href="/feedback">Feedback</a></li>
            
          </>
        ) : (
          <>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/Booking">Booking</a></li>
            <li><a href="/history">History</a></li>
            <li><a href="/feedback">Feedback</a></li>
            <li>
              <button onClick={handleLogout} style={{background:"none",border:"none",cursor:"pointer",color:"red"}}>
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Nav;
