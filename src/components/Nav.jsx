import React from 'react';
const Nav = ( isAuthenticated, setAuth) => {
  return (
    <nav>
      <div className="logo"><img src="/Logo_Home.png" alt="" /></div>
      <ul>
        {isAuthenticated ? (
          <><li>Profile</li>
            <li>Booking </li>
            <li>History</li>
            <li>Feedback</li>
            <li><a href="/starf">Admin</a></li>
            
          </>
          
        ) : (
          <>
            <li>Profile</li>
            <li>Booking </li>
            <li>History</li>
            <li>Feedback</li>
          </>
          
        )}
        
        
      </ul>
    </nav>
  );
};

export default Nav;
