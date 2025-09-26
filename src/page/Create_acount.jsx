import React, { useState } from "react";
import axios from "axios";
import "../css/create.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function Create_acount() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false); 
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStrongPassword = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);

  const promptOtpAndVerify = async (email) => {
    const result = await Swal.fire({
      title: "Enter OTP",
      input: "text",
      inputLabel: `OTP sent to ${email}`,
      inputPlaceholder: "6-digit code",
      inputAttributes: { maxlength: 6, autocapitalize: "off", autocorrect: "off" },
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      denyButtonText: "Resend OTP",
      allowOutsideClick: false
    });

    if (result.isConfirmed && result.value) {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL;
        await axios.post(`${BASE_URL}/api/auth/verify-otp`, { email, otp: result.value });
        await Swal.fire({ icon: "success", title: "Verified!", text: "Email verified successfully" });
        navigate("/login");
      } catch (err) {
        await Swal.fire({ icon: "error", title: "Verification failed", text: err.response?.data?.error || "Server error" });
        return promptOtpAndVerify(email);
      }
    } else if (result.isDenied) {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      await axios.post(`${BASE_URL}/api/auth/resend-otp`, { email });
      await Swal.fire({ icon: "info", title: "Resent", text: "A new OTP has been sent." });
      return promptOtpAndVerify(email);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(formData.password)) {
      setError("Password ต้องมีอย่างน้อย 8 ตัว และมีตัวพิมพ์เล็ก/ใหญ่ ตัวเลข และอักขระพิเศษ");
      return;
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const { data } = await axios.post(`${BASE_URL}/api/auth/register`, formData);

      await Swal.fire({
        icon: "info",
        title: "Almost there",
        text: "We sent an OTP to your email. Please verify.",
        confirmButtonText: "OK"
      });

      await promptOtpAndVerify(data.email || formData.email);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Server error");
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
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
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
              {/* ✅ OPTIONAL: แสดงคำแนะนำความแข็งแรงของรหัสผ่าน */}
              {!isStrongPassword(formData.password) && formData.password.length > 0 && (
                <small style={{ color: "#cc6600" }}>
                  ต้องมี ≥8 ตัว, มี a-z, A-Z, 0-9 และอักขระพิเศษ
                </small>
              )}
            </div>

            {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
          </div>

          <div className="cr-btn-end">
            <div className="cr-btn-done">
              {/* ✅ CHANGED: type=button แล้วคุมด้วย handleSubmit */}
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

export default Create_acount;
