import React, { useState, useEffect } from "react";
import "../css/Login.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import GoogleVerifyEmail from "../components/GoogleVerifyEmail";
import { isCookieAllowed } from "../lib/consent";
import CookieNotice from "../components/CookieNotice";
/* ✅ เพิ่ม */
import Cookies from "js-cookie";
import { clearAllCookiesExceptConsent } from "../lib/consent";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function isKMITLEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
}

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
          `${BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
          { withCredentials: true }
        );
        const ok = data?.verificationMethod === "google" || !!data?.emailVerified;
        if (!ignore) setEmailVerified(ok);
      } catch {
        if (!ignore) setEmailVerified(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [formData.email]);

  // ✅ verify ด้วย Google
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
      await Swal.fire({
        icon: "error",
        title: "Verify ล้มเหลว",
        text: "ไม่พบ Google credential",
      });
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/auth/verify-google-email`,
        { expectedEmail: email, credential: token },
        { withCredentials: true }
      );

      setEmailVerified(true);

      await Swal.fire({
        icon: "success",
        title: "ยืนยันอีเมลผ่าน Google สำเร็จ",
        timer: 1200,
        showConfirmButton: false,
      });

      window.location.reload();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || "Verify with Google failed";

      if (status === 400 && /mismatch/i.test(msg)) {
        await Swal.fire({
          icon: "error",
          title: "อีเมลไม่ตรง",
          text: "บัญชี Google ที่เลือกไม่ตรงกับอีเมลที่กรอกไว้",
        });
        return;
      }
      if (status === 403) {
        await Swal.fire({
          icon: "error",
          title: "จำกัดเฉพาะ @kmitl.ac.th",
          text: "ระบบนี้อนุญาตเฉพาะโดเมน @kmitl.ac.th",
        });
        return;
      }

      await Swal.fire({ icon: "error", title: "Verify ล้มเหลว", text: msg });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // ✅ หากยังไม่ยอมรับคุกกี้: เสนอปุ่มลบคุกกี้ทั้งหมดและรีโหลด
    if (!isCookieAllowed()) {
      const res = await Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้ยอมรับการใช้คุกกี้",
        html:
          "ระบบจำเป็นต้องใช้คุกกี้เพื่อเข้าสู่ระบบอย่างปลอดภัย<br/>" +
          "คุณต้องการลบคุกกี้ทั้งหมดแล้วเริ่มใหม่หรือไม่?",
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: "รีโหลดคุกกี้",
        cancelButtonText: "ยกเลิก",
        background: "#ffffff",
        color: "#0f172a",
      });

      if (res.isConfirmed) {
        try {
          clearAllCookiesExceptConsent();
          Cookies.remove("site_cookie_consent", { path: "/" }); // ลบ consent ด้วย เพื่อให้แบนเนอร์เด้ง
        } finally {
          window.location.reload(); // ✅ รีโหลดเพื่อเริ่ม flow consent ใหม่
        }
      }
      return; // ยุติการ submit
    }

    const email = String(formData.email || "").trim().toLowerCase();

    if (!isKMITLEmail(email)) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid email",
        text: "กรุณาใช้อีเมล @kmitl.ac.th",
      });
      return;
    }

    if (!formData.password) {
      await Swal.fire({
        icon: "warning",
        title: "Missing password",
        text: "กรุณากรอกรหัสผ่าน",
      });
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${BASE_URL}/api/auth/login`,
        { email, password: formData.password },
        { withCredentials: true }
      );

      if (typeof setAuth === "function") setAuth(true);

      await Swal.fire({
        icon: "success",
        title: "Login success",
        timer: 1200,
        showConfirmButton: false,
      });

      navigate("/");
    } catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.error || "Login failed");

      if (status === 403 && /google/i.test(msg)) {
        await Swal.fire({
          icon: "info",
          title: "เข้าสู่ระบบด้วย Google เท่านั้น",
          text: "บัญชีนี้เคยยืนยันด้วย Google โปรดกดปุ่ม Google เพื่อล็อกอิน",
        });
        return;
      }

      if (status === 403 && /verify/i.test(msg)) {
        await Swal.fire({
          icon: "info",
          title: "ยังไม่ได้ยืนยันอีเมล",
          text: "กรุณายืนยันอีเมลก่อน แล้วค่อยลองเข้าสู่ระบบอีกครั้ง",
        });
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
        if (result.dismiss === Swal.DismissReason.cancel) {
          navigate("/register");
        }
        return;
      }

      if (/invalid credentials/i.test(msg) || status === 401 || status === 400) {
        await Swal.fire({
          icon: "error",
          title: "Login failed",
          text: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        });
        return;
      }

      if (status === 429) {
        await Swal.fire({
          icon: "warning",
          title: "ชั่วคราว",
          text: "พยายามบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
        });
        return;
      }

      if (!err?.response) {
        await Swal.fire({
          icon: "error",
          title: "Network error",
          text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        });
        return;
      }

      await Swal.fire({ icon: "error", title: "Login failed", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // ----- OTP flow เดิม (คงไว้) -----
  async function flowEnterOtp(email) {
    let canResend = true;
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
        denyButtonText: canResend ? "ส่งรหัสใหม่" : "รอ 30s",
        allowOutsideClick: () => !Swal.isLoading(),
        didOpen: () => {
          if (!canResend) {
            let timeLeft = 30;
            const denyBtn = Swal.getDenyButton();
            denyBtn.disabled = true;
            denyBtn.textContent = `รอ ${timeLeft}s`;
            const timer = setInterval(() => {
              timeLeft--;
              if (timeLeft > 0) {
                denyBtn.textContent = `รอ ${timeLeft}s`;
              } else {
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
          if (!/^\d{6}$/.test(code)) {
            return Swal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
          }
          try {
            const { data } = await axios.post(
              `${BASE_URL}/api/auth/verify-reset-otp`,
              { email, otp: code },
              { withCredentials: true }
            );
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
          await axios.post(
            `${BASE_URL}/api/auth/resend-reset-otp`,
            { email },
            { withCredentials: true }
          );
          await Swal.fire({
            icon: "info",
            title: "ส่งรหัสใหม่แล้ว",
            text: "โปรดตรวจสอบอีเมล/สแปม",
            timer: 1500,
            showConfirmButton: false,
          });
          canResend = false;
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
        if (!isKMITLEmail(email)) {
          return Swal.showValidationMessage("กรุณาใช้อีเมลโดเมน @kmitl.ac.th");
        }
        try {
          await axios.post(
            `${BASE_URL}/api/auth/forgot-password`,
            { email },
            { withCredentials: true }
          );
          return email;
        } catch (err) {
          const msg =
            err?.response?.status === 429
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

          {/* ปุ่มยืนยันอีเมลด้วย Google */}
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
                  >
                    <i
                      className={
                        showPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                      }
                    />
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
              <a className="create" href="/register">
                Create account
              </a>
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
