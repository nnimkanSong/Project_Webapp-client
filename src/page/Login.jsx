import React, { useState } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import GoogleVerifyEmail from "../components/GoogleVerifyEmail";

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // ✅ เพิ่ม state นี้
  const [verified, setVerified] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "email") setVerified(false); // เปลี่ยนอีเมลเมื่อไหร่ให้ต้อง verify ใหม่
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api/auth/login", formData);
      const token = res.data.token;
      localStorage.setItem("token", token);
      setAuth?.(true);
      navigate("/booking");
    } catch (err) {
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

          {/* ปุ่มยืนยันอีเมลด้วย Google (custom) */}
          <div className="btn-google">
            <GoogleVerifyEmail
              expectedEmail={formData.email}
              disabled={!formData.email}
              onVerified={() => setVerified(true)}   // ✅ ได้ผลลัพธ์แล้วตั้งค่า
            />
          </div>

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
                    required
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

                {/* แสดงสถานะ verify */}
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  {formData.email ? (
                    verified ? (
                      <span style={{ color: "#3adb76" }}>✓ Email verified</span>
                    ) : (
                      <span style={{ color: "#ff6b6b" }}>Please verify your email with Google</span>
                    )
                  ) : null}
                </div>
              </div>

              <br />
              <a href="/forgot-password">Forgot password?</a>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="btn-end">
              <a className="create" href="/register">Create account</a>
              <div className="btn-done">
                {/* ✅ ป้องกันกดก่อน verify (ยังไง backend ก็กันอีกชั้น) */}
                <button
                  className="done"
                  type="submit"
                  disabled={!verified || !formData.password}
                  title={!verified ? "Verify your email first" : ""}
                >
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
