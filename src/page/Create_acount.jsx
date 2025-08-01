import React, { useState } from "react";

function Create_acount() {
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
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Create_acount.png" alt="" />
          </div>
          <br />

          <div className="input">
            <div className="name">
              <p>User :</p>
              <hr />
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>
            <div className="box-input">
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
          <div className="btn-end">
            <div className="btn-done">
              <button className="done" onClick={handleSubmit}>
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
