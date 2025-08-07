import React, { useState } from "react";
import '../css/change.css'
function Change_password() {
  const [username, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/register', {
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
    <div className="change-bg">
      <div className="ch-box">
        <div className="ch-rgb">
          <div className="ch-logo">
            <img src="/Chang_password.png" alt="" />
          </div>
          <br />

          <div className="ch-input">
            <div className="ch-name">
              <p>User :</p>
              <p>New password :</p>
              <p>Confirm password :</p>
            </div>
            <div className="ch-box-input">
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
          <div className="ch-btn-end">
            <div className="ch-btn-done">
              <button className="ch-done" onClick={handleSubmit}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Change_password;
