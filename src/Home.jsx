import React from 'react';
import { Link } from 'react-router-dom';
import './css/layout.css'
const Home = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <Link to="/login">Go to Login</Link>
    </div>
  );
};

export default Home;
