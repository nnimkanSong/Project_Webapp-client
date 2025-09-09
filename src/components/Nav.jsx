import React from 'react';
const Nav = ( isAuthenticated, setAuth) => {
  return (
    <nav>
      <div className="logo"><a href="/"><img src="/Logo_Home.png" alt="" /></a></div>
      <ul>
        {isAuthenticated ? (
          <><li><a href="/profile">Profile</a></li>
            <li><a href="/Booking">Booking</a> </li>
            <li><a href="/history">History</a></li>
            <li><a href="/feedback">Feedback</a></li>
            {/* <li><a href="/starf">Admin</a></li> */}
            
          </>
          
        ) : (
          <>
            <li><a href="/profile">Profile</a></li>
            <li><a href="/Booking">Booking</a> </li>
            <li><a href="/history">History</a></li>
            <li><a href="/feedback">Feedback</a></li>
          </>
          
        )}
        
        
      </ul>
    </nav>
  );
};

export default Nav;
