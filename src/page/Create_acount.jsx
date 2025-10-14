// src/pages/Create_account.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import "../css/create.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// --- Const / Pattern ---
const MAX_LEN = 8; // ความยาวรหัสนักศึกษา
const PWD_MSG = "ต้องมี ≥8 ตัว, มี a-z, A-Z, 0-9 และอักขระพิเศษ";
const PWD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}";
const KMITL_PATTERN = "[a-zA-Z0-9._%+-]+@kmitl\\.ac\\.th";

export default function Create_account() {
  const [formData, setFormData] = useState({
    username: "",
    studentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  // refs
  const formRef = useRef(null);
  const pwdRef = useRef(null);
  const confirmRef = useRef(null);

  // ✅ เพิ่มให้ด้วย: handleChange ทั่วไป
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // เปลี่ยน password: ตั้ง customValidity แต่ไม่ report ตอน blur
  const handlePwdChange = (e) => {
    const v = e.target.value;
    setFormData((p) => ({ ...p, password: v }));

    if (!v) {
      pwdRef.current?.setCustomValidity("กรุณากรอกรหัสผ่าน");
    } else if (!new RegExp(`^${PWD_PATTERN}$`).test(v)) {
      pwdRef.current?.setCustomValidity(PWD_MSG);
    } else {
      pwdRef.current?.setCustomValidity("");
    }

    // ถ้าเคยกรอก confirm แล้ว ให้เคลียร์ error ไว้ก่อน (ไปเช็คตอน submit)
    if (confirmRef.current) confirmRef.current.setCustomValidity("");
  };

  // เปลี่ยน confirm: แค่เก็บค่า ไม่เด้งเตือนตอน blur
  const handleConfirmChange = (e) => {
    const v = e.target.value;
    setFormData((p) => ({ ...p, confirmPassword: v }));
    confirmRef.current?.setCustomValidity("");
  };

  const promptOtpAndVerify = async (email) => {
    const result = await Swal.fire({
      title: "Enter OTP",
      input: "text",
      inputLabel: `OTP sent to ${email}`,
      inputPlaceholder: "6-digit code",
      inputAttributes: {
        maxlength: 6,
        inputmode: "numeric",
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      denyButtonText: "Resend OTP",
      allowOutsideClick: false,
    });

    if (result.isConfirmed && result.value) {
      try {
        await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
          email,
          otp: String(result.value).trim(),
        });
        await Swal.fire({
          icon: "success",
          title: "Verified!",
          text: "Email verified successfully",
        });
        navigate("/login");
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Verification failed",
          text: err.response?.data?.error || "Server error",
        });
        return promptOtpAndVerify(email);
      }
    } else if (result.isDenied) {
      try {
        await axios.post(`${BASE_URL}/api/auth/resend-otp`, { email });
        await Swal.fire({
          icon: "info",
          title: "Resent",
          text: "A new OTP has been sent.",
        });
        return promptOtpAndVerify(email);
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Resend failed",
          text: err.response?.data?.error || "Server error",
        });
        return promptOtpAndVerify(email);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1) ให้เบราว์เซอร์เช็ก required/pattern ก่อน
    if (!formRef.current?.reportValidity()) return;

    // 2) เช็คว่ารหัสผ่านตรงกัน (เด้งบับเบิลเฉพาะตอน submit)
    if ((formData.password ?? "") !== (formData.confirmPassword ?? "")) {
      confirmRef.current?.setCustomValidity("รหัสผ่านไม่ตรงกัน");
      confirmRef.current?.reportValidity();
      return;
    } else {
      confirmRef.current?.setCustomValidity("");
    }

    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const studentNumber = formData.studentNumber.trim();

    try {
      setLoading(true);
      const { data } = await axios.post(`${BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
        studentNumber,
      });

      await Swal.fire({
        icon: "info",
        title: "Almost there",
        text: "We sent an OTP to your email. Please verify.",
        confirmButtonText: "OK",
      });

      await promptOtpAndVerify(data?.email || email);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || "Server error";
      await Swal.fire({
        icon: "error",
        title: "Registration failed",
        text: errorMsg,
        confirmButtonText: "OK",
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-bg">
      <div className="cr-box">
        <div className="cr-rgb">
          <div className="cr-logo">
            <img src="/Create_acount.png" alt="" />
          </div>

          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="cr-input">
              <div className="cr-name">
                <p>User :</p>
                <hr />
                <p>Student Number :</p>
                <hr />
                <p>Email :</p>
                <hr />
                <p>Password :</p>
                <hr />
                <p>Confirm Password :</p>
              </div>

              <div className="cr-box-input">
                {/* Username */}
                <input
                  name="username"
                  type="text"
                  placeholder="User"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <hr />

                {/* Student Number (digits only) */}
                <input
                  name="studentNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Student Number"
                  autoComplete="off"
                  value={formData.studentNumber ?? ""}
                  maxLength={MAX_LEN}
                  pattern={`\\d{${MAX_LEN}}`}     // ✅ ให้ browser ช่วยเช็ก
                  title={`กรุณากรอกตัวเลข ${MAX_LEN} หลัก`}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    setFormData((prev) => ({
                      ...prev,
                      studentNumber: onlyDigits.slice(0, MAX_LEN),
                    }));
                  }}
                  aria-label="Student Number"
                  required
                />
                <hr />

                {/* Email (KMITL only) */}
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.name@kmitl.ac.th"
                  autoComplete="email"
                  required
                  pattern={KMITL_PATTERN}
                  title="กรุณาใช้อีเมล @kmitl.ac.th เท่านั้น"
                />
                <hr />

                {/* Password */}
                <div className="input-wrap-cr">
                  <input
                    ref={pwdRef}
                    name="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password ?? ""}
                    onChange={handlePwdChange}
                    autoComplete="new-password"
                    className="pwd-input"
                    required
                    pattern={PWD_PATTERN}
                    title={PWD_MSG}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    <i
                      className={
                        showPwd ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                      }
                    />
                  </button>
                </div>
                <hr />

                {/* Confirm Password (disabled จนกว่าจะมี password) */}
                <div className="input-wrap-cr">
                  <input
                    ref={confirmRef}
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword ?? ""}
                    onChange={handleConfirmChange}
                    autoComplete="new-password"
                    className="pwd-input"
                    required
                    disabled={!formData.password}
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    disabled={!formData.password}
                  >
                    <i
                      className={
                        showConfirm
                          ? "fa-solid fa-eye-slash"
                          : "fa-solid fa-eye"
                      }
                    />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p style={{ color: "red", marginTop: 10 }}>{error}</p>
            )}

            <div className="cr-btn-end">
              <div className="cr-btn-done">
                <button className="cr-done" type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Done"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* เสริม: กรอบแดงอัตโนมัติเมื่อ invalid */}
      <style>{`
        .pwd-input:invalid { border: 1px solid #ef4444; }
        input:disabled { opacity: .7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
