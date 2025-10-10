import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'
import Sliderhome from './components/Sliderhome';
import LiquidGlass from 'liquid-glass-react'
const Home = () => {
  return (
    <div className='pg-home'>
      <div className='top'>
        <img src="./home_top.png" alt="" />
      </div>
      
      <div className='midle'>
        <div>Status Now</div>
        <div>
          <p>All</p>
          <p>num</p>
        </div>
        <div>
          <p>Available</p>
          <p>num</p>
        </div>
        <div>
          <p>Use</p>
          <p>num</p>
        </div>
        <div>
          <p>Renovation</p>
          <p>num</p>
        </div>
      </div>
      <div className='end'>
        <Sliderhome/>
      </div>
      <a href="/login"></a>
    </div>
  );
};

export default Home;
