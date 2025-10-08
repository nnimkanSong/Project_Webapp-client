import React, { useState } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import GoogleVerifyEmail from "../components/GoogleVerifyEmail";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function isKMITLEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
}

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    if (e.target.name === "email") setVerified(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/api/auth/login`,
        { email: formData.email, password: formData.password },
        { withCredentials: true }
      );
      if (typeof setAuth === "function") setAuth(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  async function flowEnterOtp(email) {
    while (true) {
      const otpModal = await Swal.fire({
        title: "กรอกรหัส OTP",
        input: "text",
        inputLabel: `ส่งไปที่ ${email}`,
        inputPlaceholder: "6 หลัก",
        inputAttributes: {
          maxlength: 6,
          inputmode: "numeric",
          autocapitalize: "off",
          autocorrect: "off",
        },
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "ยืนยันโค้ด",
        cancelButtonText: "ยกเลิก",
        denyButtonText: "ส่งรหัสใหม่",
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async (otp) => {
          const code = String(otp || "").trim();
          if (!/^\d{6}$/.test(code)) {
            return Swal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
          }
          try {
            const { data } = await axios.post(
              `${BASE_URL}/api/auth/verify-reset-otp`,
              { email, otp: code }
            );
            return data || true;
          } catch (err) {
            const msg =
              err.response?.data?.error || "โค้ดไม่ถูกต้อง/หมดอายุ";
            Swal.showValidationMessage(msg);
          }
        },
      });

      if (otpModal.isDenied) {
        try {
          await axios.post(`${BASE_URL}/api/auth/resend-reset-otp`, { email });
          await Swal.fire({
            icon: "info",
            title: "ส่งรหัสใหม่แล้ว",
            text: "โปรดตรวจสอบอีเมล/สแปม",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          await Swal.fire({
            icon: "error",
            title: "ส่งรหัสใหม่ไม่สำเร็จ",
            text: err.response?.data?.error || "Server error",
          });
        }
        continue;
      }

      if (otpModal.isConfirmed && otpModal.value) {
        await Swal.fire({
          icon: "success",
          title: "ยืนยันสำเร็จ",
          timer: 1200,
          showConfirmButton: false,
        });
        return { ok: true, token: otpModal.value?.resetToken };
      }

      return { ok: false };
    }
  }

  const handleForgot = async () => {
    const emailStep = await Swal.fire({
      title: "ลืมรหัสผ่าน",
      input: "email",
      inputLabel: "กรอกอีเมลที่ใช้สมัคร",
      inputPlaceholder: "name@kmitl.ac.th",
      confirmButtonText: "ส่งรหัส/ลิงก์รีเซ็ต",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (val) => {
        const email = String(val || "").trim().toLowerCase();
        if (!email) return Swal.showValidationMessage("กรุณากรอกอีเมล");
        if (!isKMITLEmail(email)) {
          return Swal.showValidationMessage("กรุณาใช้อีเมลโดเมน @kmitl.ac.th");
        }
        try {
          await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
          return email;
        } catch (err) {
          const msg =
            err.response?.status === 429
              ? "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง"
              : err.response?.data?.error || "ส่งคำขอล้มเหลว";
          Swal.showValidationMessage(msg);
        }
      },
    });

    if (!emailStep.isConfirmed) return;
    const email = emailStep.value;

    const verified = await flowEnterOtp(email);
    if (!verified.ok) return;

    const params = new URLSearchParams({ email });
    if (verified.token) params.set("token", verified.token);
    navigate(`/reset-password?${params.toString()}`);
  };

  return (
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="Logo" />
          </div>

          {/* ปุ่มยืนยันอีเมลด้วย Google (ออปชัน) */}
          <div className="btn-google">
            <GoogleVerifyEmail
              expectedEmail={formData.email}
              disabled={!formData.email}
              onVerified={() => setVerified(true)}
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
                    autoComplete="current-password"
                    className="pwd-input"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility-l"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    aria-pressed={showPwd}
                  >
                    <i
                      className={
                        showPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                      }
                    />
                  </button>
                </div>

                {/* สถานะ verify (ออปชัน) */}
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  {formData.email ? (
                    verified ? (
                      <span style={{ color: "#16a34a" }}>✓ Email verified</span>
                    ) : (
                      <span style={{ color: "#ef4444" }}>
                        Please verify your email with Google
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}
            <br />

            <div className="btn-forgot">
              <button type="button" className="forgot" onClick={handleForgot}>
                Forgot password?
              </button>
            </div>

            <div className="btn-end">
              <a className="create" href="/register">
                Create account
              </a>
              <div className="btn-done">
                {/* ถ้าต้องการ "บังคับ" verify ก่อนล็อกอิน ให้ใส่ disabled={!verified || !formData.password} */}
                <button className="done" type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Done"}
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
