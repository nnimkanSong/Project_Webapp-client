import React, { useState } from "react";
import "../css/Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    e.preventDefault();
    setError("");
    console.log("handleSubmit fired:", formData); // ✅ ดูว่าข้อมูลที่ส่งไปถูกมั้ย

    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        formData
      );

      // ✅ ใส่ตรงนี้เพื่อตรวจ response ที่ได้จาก server
      console.log("RES STATUS:", res.status);
      console.log("RES DATA:", res.data);

      const token = res.data.token || res.data.accessToken;
      if (!token) throw new Error("No token in response");

      localStorage.setItem("token", token);
      setAuth?.(true);
      navigate("/");
    } catch (err) {
      console.error(
        "ERR:",
        err.response?.status,
        err.response?.data,
        err.message
      );
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="" />
          </div>

          <button className="btn-google" type="button">
            <img src="/google_logo.png" alt="" />
            <p>Login with Google</p>
          </button>

          <div className="line">
            <hr />
            <p>or</p>
            <hr />
          </div>

          {/* ✅ ใช้ form ครอบ และใช้ type="submit" */}
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
