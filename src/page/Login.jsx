import React, { useState } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import { api } from "../api"; // ✅ ใช้ axios instance

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/login", formData);
      console.log("RES:", res.data);

      const token = res.data.token;
      if (!token) throw new Error("No token in response");

      localStorage.setItem("token", token);
      setAuth?.(true);
      navigate("/booking"); // ✅ พอ login สำเร็จพาไป booking page
    } catch (err) {
      console.error("Login error:", err.response?.data);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="Logo" />
          </div>

          <button className="btn-google" type="button">
            <img src="/google_logo.png" alt="Google" />
            <p>Login with Google</p>
          </button>

          <div className="line">
            <hr />
            <p>or</p>
            <hr />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input">
              <div className="name">
                <p>Email :</p>
                <hr />
                <p>Password :</p>
              </div>

              <div className="box-input">
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <hr />
                <div className="input-wrap">
                  <input
                    name="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-label="Password"
                    autoComplete="new-password"
                    className="pwd-input"
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    <i className={showPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                  </button>
                </div>
              </div>

              <br />
              <a href="/forgot-password">Forgot password?</a>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="btn-end">
              <a className="create" href="/register">
                Create account
              </a>
              <div className="btn-done">
                <button className="done" type="submit">
                  Done
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
