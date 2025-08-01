import React, { useState } from "react";
import "../css/Login.css";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login successful!");
        // ทำอย่างอื่น เช่น เก็บ token, redirect ฯลฯ
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Login error");
    }
  };
  return (
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="" />
          </div>
          <button className="btn-google">
            <img src="/google_logo.png" alt="" />
            <p>Login with Google</p>
          </button>
          <div className="line">
            <hr />
            <p>or</p>
            <hr />
          </div>
          <br />

          <div className="input">
            <div className="name">
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>
            <div className="box-input">
              <input
                type="email"
                name=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <hr />
              <input
                type="password"
                name=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <br />
            <a href="/chang_password">Forgot password?</a>
          </div>
          <div className="btn-end">
            <a className="create" href="/create">
              Create account
            </a>
            <div className="btn-done">
              <button className="done" onClick={handleLogin}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
