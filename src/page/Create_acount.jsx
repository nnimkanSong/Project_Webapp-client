import React, { useState } from "react";
import '../css/create.css'
function Create_acount() {
  const [username, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log(data);
      alert('Account created!');
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to create account');
    }
  };

  return (
    <div className="create-bg">
      <div className="cr-box">
        <div className="cr-rgb">
          <div className="cr-logo">
            <img src="/Create_acount.png" alt="" />
          </div>
          <br />

          <div className="cr-input">
            <div className="cr-name">
              <p>User :</p>
              <hr />
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>
            <div className="cr-box-input">
              <input
                type="text"
                placeholder="User"
                value={username}
                onChange={(e) => setUser(e.target.value)}
              />
              <hr />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <hr />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <br />
          </div>
          <div className="cr-btn-end">
            <div className="cr-btn-done">
              <button className="cr-done" onClick={handleSubmit}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Create_acount;
