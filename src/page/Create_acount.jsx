import React, { useState } from "react";
import axios from "axios";
import "../css/create.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


function isKMITLEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
}

function isStrongPassword(pwd) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(String(pwd));
}

export default function Create_acount() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const promptOtpAndVerify = async (email) => {
    const result = await Swal.fire({
      title: "Enter OTP",
      input: "text",
      inputLabel: `OTP sent to ${email}`,
      inputPlaceholder: "6-digit code",
      inputAttributes: { maxlength: 6, inputmode: "numeric", autocapitalize: "off", autocorrect: "off" },
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      denyButtonText: "Resend OTP",
      allowOutsideClick: false,
    });

    if (result.isConfirmed && result.value) {
      try {
        await axios.post(`${BASE_URL}/api/auth/verify-otp`, { email, otp: String(result.value).trim() });
        await Swal.fire({ icon: "success", title: "Verified!", text: "Email verified successfully" });
        navigate("/login");
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Verification failed",
          text: err.response?.data?.error || "Server error",
        });
        return promptOtpAndVerify(email); // 🔁 ลองใหม่
      }
    } else if (result.isDenied) {
      try {
        await axios.post(`${BASE_URL}/api/auth/resend-otp`, { email });
        await Swal.fire({ icon: "info", title: "Resent", text: "A new OTP has been sent." });
        return promptOtpAndVerify(email); // 🔁 ลองใหม่หลังส่ง OTP ใหม่
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

    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!isKMITLEmail(email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Email ต้องเป็น @kmitl.ac.th เท่านั้น",
        confirmButtonText: "OK",
      });
      return;
    } else if (!isStrongPassword(password)) {
      Swal.fire({
        icon: "error",
        title: "Weak Password",
        text: "Password ต้องมีอย่างน้อย 8 ตัว และมีตัวพิมพ์เล็ก/ใหญ่ ตัวเลข และอักขระพิเศษ",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${BASE_URL}/api/auth/register`, {
        username,
        email,
        password,
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

      Swal.fire({
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
          <br />

          <div className="cr-input">
            <div className="cr-name">
              <p>User :</p>
              <hr />
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>

            <div className="cr-box-input">
              <input
                name="username"
                type="text"
                placeholder="User"
                value={formData.username}
                onChange={handleChange}
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
              />

              {/* ตรวจสอบ email */}
              {!/^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(formData.email) &&
                formData.email.length > 0 && (
                  <small style={{ color: "#ff0000ff" }}>
                    กรุณาใช้อีเมล @kmitl.ac.th เท่านั้น
                  </small>
                )}
              {error && <p style={{ color: "red", marginTop: 10 }} > {error}</p> && <div className="cr-name" style={{ marginTop: 10 }} ></div>}

              <hr />
              {/* ✅ CHANGED: ครอบ input password + ปุ่ม toggle */}
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
              {!isStrongPassword(formData.password) && formData.password.length > 0 && (
                <small style={{ color: "#ff0000ff" }}>
                  ต้องมี ≥8 ตัว, มี a-z, A-Z, 0-9 และอักขระพิเศษ
                </small>
              )}

            </div>


          </div>

          <div className="cr-btn-end">
            <div className="cr-btn-done">
              <button className="cr-done" type="button" onClick={handleSubmit}>
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

