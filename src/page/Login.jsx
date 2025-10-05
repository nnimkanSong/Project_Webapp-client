import React, { useState } from "react";
import "../css/Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Login = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  function isKMITLEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${BASE_URL}/api/auth/login`,
        formData,
        { withCredentials: true }   // <<< สำคัญมาก
      );

      // backend จะสร้าง session + ส่ง cookie (sid) มาแล้ว
      setAuth?.(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };


  async function flowEnterOtp(email) {
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
        denyButtonText: "ส่งรหัสใหม่",
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async (otp) => {
          const code = String(otp || "").trim();
          if (code.length !== 6) {
            return Swal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
          }
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
        try {
          await axios.post(`${BASE_URL}/api/auth/resend-reset-otp`, { email });
          await Swal.fire({ icon: "info", title: "ส่งรหัสใหม่แล้ว", text: "โปรดตรวจสอบอีเมล/สแปม", timer: 1500, showConfirmButton: false });
        } catch (err) {
          await Swal.fire({ icon: "error", title: "ส่งรหัสใหม่ไม่สำเร็จ", text: err.response?.data?.error || "Server error" });
        }
        continue; // เปิดกรอก OTP อีกรอบ
      }

      if (otpModal.isConfirmed && otpModal.value) {
        await Swal.fire({ icon: "success", title: "ยืนยันสำเร็จ", timer: 1200, showConfirmButton: false });
        return { ok: true, token: otpModal.value?.resetToken }; // <- ใช้ token นี้
      }

      // ยกเลิก
      return { ok: false };
    }
  }

  const handleForgot = async (navigate) => {
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
          return email; // ส่ง email ไปใช้ในขั้นตอน OTP
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

    // 👉 ต่อด้วยกรอก OTP
    const verified = await flowEnterOtp(email);
    if (!verified.ok) return;

    // 👉 ไปหน้า reset-password (แนบ token หากแบ็กเอนด์ส่งมา)
    const params = new URLSearchParams({ email });
    if (verified.token) params.set("token", verified.token);

    navigate(`/reset-password?${params.toString()}`);
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
                    autoComplete="new-password"     // หรือ "current-password" ตามหน้า
                    className="pwd-input"
                  />
                  <button
                    type="button"
                    className="toggle-visibility-l"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    aria-pressed={showPwd}
                  >
                    <i className={showPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                  </button>
                </div>

              </div>
            </div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <br />
            <div className="btn-forgot">
              <button
                type="button"
                className="forgot"
                onClick={() => handleForgot(navigate)}
              >
                Forgot password?
              </button>
            </div>
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
