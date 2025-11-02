// src/pages/Create_account.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import "../css/create.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const MAX_LEN = 8;
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

  const formRef = useRef(null);
  const pwdRef = useRef(null);
  const confirmRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

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

    if (confirmRef.current) confirmRef.current.setCustomValidity("");
  };

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
    if (!formRef.current?.reportValidity()) return;

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
                <input
                  name="username"
                  type="text"
                  placeholder="User"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <hr />

                <input
                  name="studentNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="Student Number"
                  autoComplete="off"
                  value={formData.studentNumber ?? ""}
                  maxLength={MAX_LEN}
                  pattern={`\\d{${MAX_LEN}}`}
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
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M17.94 17.94C16.24 19.06 14.2 19.75 12 19.75C7 19.75 2.73 16.09 1 12C1.68 10.37 2.69 8.93 4 7.76M8.46 8.46C9.45 7.56 10.67 7 12 7C15.31 7 18 9.69 18 13C18 14.33 17.44 15.55 16.54 16.54M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M1 12C2.73 16.09 7 19.75 12 19.75C17 19.75 21.27 16.09 23 12C21.27 7.91 17 4.25 12 4.25C7 4.25 2.73 7.91 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <hr />

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
                    {showConfirm ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M17.94 17.94C16.24 19.06 14.2 19.75 12 19.75C7 19.75 2.73 16.09 1 12C1.68 10.37 2.69 8.93 4 7.76M8.46 8.46C9.45 7.56 10.67 7 12 7C15.31 7 18 9.69 18 13C18 14.33 17.44 15.55 16.54 16.54M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M1 12C2.73 16.09 7 19.75 12 19.75C17 19.75 21.27 16.09 23 12C21.27 7.91 17 4.25 12 4.25C7 4.25 2.73 7.91 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

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

      <style>{`
        .pwd-input:invalid { border: 1px solid #ef4444; }
        input:disabled { opacity: .7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
