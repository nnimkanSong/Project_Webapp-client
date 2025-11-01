// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import GoogleVerifyEmail from "../components/GoogleVerifyEmail";
import { isCookieAllowed } from "../lib/consent";
import CookieNotice from "../components/CookieNotice";
import Cookies from "js-cookie";
import { clearAllCookiesExceptConsent } from "../lib/consent";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// ตั้ง default เฉพาะในไฟล์นี้ (ไม่ไปยุ่ง global)
axios.defaults.withCredentials = true;

function isKMITLEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
}

// ==== Inline SVGs (แทน Font Awesome) ====
const Eye = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
  </svg>
);
const EyeOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M2.1 3.51 3.5 2.1l18.4 18.39-1.41 1.41-3.13-3.13A13.5 13.5 0 0 1 12 19c-7 0-10-7-10-7a18.3 18.3 0 0 1 4.23-5.46L2.1 3.5Zm6.9 6.9a3 3 0 0 0 4.24 4.24l-4.24-4.24ZM12 5c7 0 10 7 10 7a18.5 18.5 0 0 1-3.76 4.94l-1.44-1.44A12 12 0 0 0 20 12s-3-6-8-6c-1.23 0-2.34.28-3.33.72L7.12 5.17A10.6 10.6 0 0 1 12 5Z"/>
  </svg>
);

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [fpCooldown, setFpCooldown] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    if (e.target.name === "email") setEmailVerified(false);
  };

  useEffect(() => {
    let ignore = false;
    const email = String(formData.email || "").trim().toLowerCase();
    if (!email || !isKMITLEmail(email)) {
      setEmailVerified(false);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(
          `${BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`
        );
        const ok = data?.verificationMethod === "google" || !!data?.emailVerified;
        if (!ignore) setEmailVerified(ok);
      } catch {
        if (!ignore) setEmailVerified(false);
      }
    })();
    return () => { ignore = true; };
  }, [formData.email]);

  // ===== Google verify =====
  const verifyByGoogleOnServer = async (credential) => {
    const email = String(formData.email || "").trim().toLowerCase();

    if (!isCookieAllowed()) {
      await Swal.fire({
        icon: "warning",
        title: "การใช้คุกกี้ถูกปฏิเสธ",
        text: "คุณได้ปฏิเสธการใช้คุกกี้ ระบบจะไม่สามารถเข้าสู่ระบบได้",
      });
      return;
    }

    const token =
      typeof credential === "string"
        ? credential
        : credential?.credential || credential?.token || credential?.id_token;

    if (!token) {
      await Swal.fire({ icon: "error", title: "Verify ล้มเหลว", text: "ไม่พบ Google credential" });
      return;
    }

    try {
      await axios.post(`${BASE_URL}/api/auth/verify-google-email`,
        { expectedEmail: email, credential: token }
      );

      setEmailVerified(true);
      await Swal.fire({ icon: "success", title: "ยืนยันอีเมลผ่าน Google สำเร็จ", timer: 1200, showConfirmButton: false });
      window.location.reload();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || "Verify with Google failed";

      if (status === 400 && /mismatch/i.test(msg)) {
        await Swal.fire({ icon: "error", title: "อีเมลไม่ตรง", text: "บัญชี Google ที่เลือกไม่ตรงกับอีเมลที่กรอกไว้" });
        return;
      }
      if (status === 403) {
        await Swal.fire({ icon: "error", title: "จำกัดเฉพาะ @kmitl.ac.th", text: "ระบบนี้อนุญาตเฉพาะโดเมน @kmitl.ac.th" });
        return;
      }
      await Swal.fire({ icon: "error", title: "Verify ล้มเหลว", text: msg });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!isCookieAllowed()) {
      const res = await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้ยอมรับการใช้คุกกี้",
        html: "ระบบจำเป็นต้องใช้คุกกี้เพื่อเข้าสู่ระบบอย่างปลอดภัย<br/>คุณต้องการลบคุกกี้ทั้งหมดแล้วเริ่มใหม่หรือไม่?",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "รีโหลดคุกกี้",
        cancelButtonText: "ยกเลิก",
      });
      if (res.isConfirmed) {
        try {
          clearAllCookiesExceptConsent();
          Cookies.remove("site_cookie_consent", { path: "/" });
        } finally {
          window.location.reload();
        }
      }
      return;
    }

    const email = String(formData.email || "").trim().toLowerCase();
    if (!isKMITLEmail(email)) {
      await Swal.fire({ icon: "warning", title: "Invalid email", text: "กรุณาใช้อีเมล @kmitl.ac.th" });
      return;
    }
    if (!formData.password) {
      await Swal.fire({ icon: "warning", title: "Missing password", text: "กรุณากรอกรหัสผ่าน" });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${BASE_URL}/api/auth/login`,
        { email, password: formData.password }
      );
      if (typeof setAuth === "function") setAuth(true);
      await Swal.fire({ icon: "success", title: "Login success", timer: 1200, showConfirmButton: false });
      navigate("/");
    } catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.error || "Login failed");

      if (status === 403 && /google/i.test(msg)) {
        await Swal.fire({ icon: "info", title: "เข้าสู่ระบบด้วย Google เท่านั้น", text: "บัญชีนี้เคยยืนยันด้วย Google โปรดกดปุ่ม Google เพื่อล็อกอิน" });
        return;
      }
      if (status === 403 && /verify/i.test(msg)) {
        await Swal.fire({ icon: "info", title: "ยังไม่ได้ยืนยันอีเมล", text: "กรุณายืนยันอีเมลก่อน แล้วค่อยลองเข้าสู่ระบบอีกครั้ง" });
        return;
      }
      if (msg.includes("ไม่มี user") || /not found/i.test(msg)) {
        const result = await Swal.fire({
          icon: "error",
          title: "Login failed",
          text: msg,
          showCancelButton: true,
          confirmButtonText: "OK",
          cancelButtonText: "Sign up",
          reverseButtons: true,
        });
        if (result.dismiss === Swal.DismissReason.cancel) navigate("/register");
        return;
      }
      if (/invalid credentials/i.test(msg) || status === 401 || status === 400) {
        await Swal.fire({ icon: "error", title: "Login failed", text: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        return;
      }
      if (status === 429) {
        await Swal.fire({ icon: "warning", title: "ชั่วคราว", text: "พยายามบ่อยเกินไป กรุณาลองใหม่ภายหลัง" });
        return;
      }
      if (!err?.response) {
        await Swal.fire({ icon: "error", title: "Network error", text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" });
        return;
      }
      await Swal.fire({ icon: "error", title: "Login failed", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // ----- OTP flow (เดิม) -----
  async function flowEnterOtp(email) {
    let canResend = true;
    while (true) {
      const otpModal = await Swal.fire({
        title: "กรอกรหัส OTP",
        input: "text",
        inputLabel: `ส่งไปที่ ${email}`,
        inputPlaceholder: "6 หลัก",
        inputAttributes: { maxlength: 6, inputmode: "numeric", autocapitalize: "off", autocorrect: "off" },
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "ยืนยันโค้ด",
        cancelButtonText: "ยกเลิก",
        denyButtonText: canResend ? "ส่งรหัสใหม่" : "รอ 30s",
        allowOutsideClick: () => !Swal.isLoading(),
        didOpen: () => {
          if (!canResend) {
            let tLeft = 30;
            const denyBtn = Swal.getDenyButton();
            denyBtn.disabled = true;
            denyBtn.textContent = `รอ ${tLeft}s`;
            const timer = setInterval(() => {
              tLeft--;
              if (tLeft > 0) denyBtn.textContent = `รอ ${tLeft}s`;
              else {
                clearInterval(timer);
                denyBtn.disabled = false;
                denyBtn.textContent = "ส่งรหัสใหม่";
                canResend = true;
              }
            }, 1000);
          }
        },
        preConfirm: async (otp) => {
          const code = String(otp || "").trim();
          if (!/^\d{6}$/.test(code)) return Swal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
          try {
            const { data } = await axios.post(`${BASE_URL}/api/auth/verify-reset-otp`, { email, otp: code });
            return data || true;
          } catch (err) {
            const msg = err.response?.data?.error || "โค้ดไม่ถูกต้อง/หมดอายุ";
            Swal.showValidationMessage(msg);
          }
        },
      });

      if (otpModal.isDenied) {
        if (!canResend) continue;
        try {
          await axios.post(`${BASE_URL}/api/auth/resend-reset-otp`, { email });
          await Swal.fire({ icon: "info", title: "ส่งรหัสใหม่แล้ว", text: "โปรดตรวจสอบอีเมล/สแปม", timer: 1500, showConfirmButton: false });
          canResend = false;
        } catch (err) {
          await Swal.fire({ icon: "error", title: "ส่งรหัสใหม่ไม่สำเร็จ", text: err.response?.data?.error || "Server error" });
        }
        continue;
      }

      if (otpModal.isConfirmed && otpModal.value) {
        await Swal.fire({ icon: "success", title: "ยืนยันสำเร็จ", timer: 1200, showConfirmButton: false });
        return { ok: true };
      }
      return { ok: false };
    }
  }

  useEffect(() => {
    if (fpCooldown <= 0) return;
    const t = setInterval(() => setFpCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [fpCooldown]);

  const handleForgot = async () => {
    if (fpCooldown > 0) return;
    const emailStep = await Swal.fire({
      title: "ลืมรหัสผ่าน",
      input: "email",
      inputLabel: "กรอกอีเมลที่ใช้สมัคร",
      inputPlaceholder: "name@kmitl.ac.th",
      confirmButtonText: "ส่งรหัส/ลิงก์รีเซ็ต",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      allowEnterKey: () => !Swal.isLoading(),
      preConfirm: async (val) => {
        const email = String(val || "").trim().toLowerCase();
        if (!email) return Swal.showValidationMessage("กรุณากรอกอีเมล");
        if (!isKMITLEmail(email)) return Swal.showValidationMessage("กรุณาใช้อีเมลโดเมน @kmitl.ac.th");
        try {
          await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email });
          return email;
        } catch (err) {
          const msg = err?.response?.status === 429
            ? "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง"
            : err?.response?.data?.error || "ส่งคำขอล้มเหลว";
          Swal.showValidationMessage(msg);
        }
      },
    });

    if (!emailStep.isConfirmed) return;
    setFpCooldown(30);

    const email = emailStep.value;
    const verified = await flowEnterOtp(email);
    if (!verified.ok) return;

    const params = new URLSearchParams({ email });
    if (verified.token) params.set("token", verified.token);
    navigate(`/reset-password?${params.toString()}`);
  };

  return (
    <div className="login-bg">
      <CookieNotice />
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="Logo" />
          </div>

          {/* Verify ด้วย Google */}
          <div className="btn-google">
            <GoogleVerifyEmail
              expectedEmail={formData.email}
              disabled={!formData.email || !isKMITLEmail(formData.email)}
              onVerified={verifyByGoogleOnServer}
            />
          </div>

          <div className="line">
            <hr />
            <p>and</p>
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
                {/* สถานะ verify */}
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  {formData.email ? (
                    emailVerified ? (
                      <span style={{ color: "#16a34a" }}>✓ Email verified</span>
                    ) : (
                      <span style={{ color: "#ef4444" }}>✗ Not verified</span>
                    )
                  ) : null}
                </div>

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
                    title={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p style={{ color: "red" }}>{error}</p>}
            <br />

            <div className="btn-forgot">
              <div className="forgotwrap">
                <button
                  type="button"
                  className="forgot"
                  onClick={handleForgot}
                  disabled={fpCooldown > 0}
                  title={fpCooldown > 0 ? `รอ ${fpCooldown}s` : "ขอรหัสรีเซ็ต"}
                >
                  {fpCooldown > 0
                    ? `Forgot password? (รอ ${fpCooldown}s)`
                    : "Forgot password?"}
                </button>
              </div>
            </div>

            <div className="btn-end">
              <a className="create" href="/register">Create account</a>
              <div className="btn-done">
                <button className="done" type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Done"}
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
