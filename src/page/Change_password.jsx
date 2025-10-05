import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "../css/change.css";

function ChangePassword() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [email, setEmail] = useState("");
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  // toggle สำหรับแต่ละช่อง
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ---------- validators ----------
  const isKMITLEmail = (v) =>
    /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(v).trim());

  const isStrongPassword = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(String(pwd));

  // ---------- OTP modal ----------
  const promptChangeOtpAndVerify = async (email) => {
    while (true) {
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
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async (val) => {
          const code = String(val || "").trim();
          if (code.length !== 6) {
            return Swal.showValidationMessage("Please enter the 6-digit code");
          }
          try {
            await axios.post(`${BASE_URL}/api/auth/verify-change-otp`, {
              email,
              otp: code,
            });
            return true;
          } catch (err) {
            Swal.showValidationMessage(
              err.response?.data?.error || "Invalid/expired code"
            );
          }
        },
      });

      if (result.isDismissed) return false;

      if (result.isDenied) {
        try {
          await axios.post(`${BASE_URL}/api/auth/resend-change-otp`, { email });
          await Swal.fire({
            icon: "info",
            title: "Resent",
            text: "A new OTP has been sent.",
            timer: 1400,
            showConfirmButton: false,
          });
        } catch (err) {
          await Swal.fire({
            icon: "error",
            title: "Resend failed",
            text: err.response?.data?.error || "Server error",
          });
        }
        continue; // วนรับใหม่
      }

      if (result.isConfirmed) {
        await Swal.fire({
          icon: "success",
          title: "Verified!",
          timer: 1000,
          showConfirmButton: false,
        });
        return true;
      }
    }
  };

  // ---------- submit flow ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // 1) validate
    const em = String(email || "").toLowerCase().trim();
    if (!em || !currentPwd || !newPwd || !confirmPwd) {
      return Swal.fire({ icon: "warning", title: "Missing fields" });
    }
    if (!isKMITLEmail(em)) {
      return Swal.fire({
        icon: "warning",
        title: "Invalid email",
        text: "Please use your @kmitl.ac.th email.",
      });
    }
    if (!isStrongPassword(newPwd)) {
      return Swal.fire({
        icon: "warning",
        title: "Weak password",
        html:
          "Password must have at least 8 characters and include:<br/>" +
          "• lowercase a-z<br/>" +
          "• uppercase A-Z<br/>" +
          "• a number<br/>" +
          "• a special character",
      });
    }
    if (newPwd !== confirmPwd) {
      return Swal.fire({
        icon: "warning",
        title: "Password mismatch",
        text: "New password and confirmation do not match.",
      });
    }
    if (newPwd === currentPwd) {
      return Swal.fire({
        icon: "warning",
        title: "No change",
        text: "New password must be different from current password.",
      });
    }

    try {
      setLoading(true);

      // header ใส่ JWT ถ้ามี
      const headers = {};
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;

      // 2) ขอ OTP สำหรับ "เปลี่ยนรหัสผ่าน"
      await axios.post(
        `${BASE_URL}/api/auth/request-change-otp`,
        { email: em },
        { headers }
      );

      // 3) ให้ผู้ใช้กรอก/ยืนยัน OTP
      const ok = await promptChangeOtpAndVerify(em);
      if (!ok) {
        setLoading(false);
        return;
      }

      // 4) เปลี่ยนรหัสผ่าน
      await axios.post(
        `${BASE_URL}/api/auth/change-password`,
        { email: em, currentPassword: currentPwd, newPassword: newPwd },
        { headers }
      );

      await Swal.fire({
        icon: "success",
        title: "Password changed",
        text: "Your password has been updated. Please login again.",
      });

      // ออกจากระบบแล้วพาไปหน้า login
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          err.response?.data?.error ||
          (err.response?.status === 401
            ? "Session expired. Please login again."
            : "Server error"),
      });
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-bg">
      <div className="ch-box">
        <div className="ch-rgb">
          <div className="ch-logo">
            <img src="/Chang_password.png" alt="Change Password" />
          </div>

          <form className="ch-input" onSubmit={handleSubmit}>
            <div className="ch-name">
              <p>Current password :</p>
              <p>New password :</p>
              <p>Confirm password :</p>
            </div>

            <div className="ch-box-input">
              
              <div className="input-wrap-ch">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Current Password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pwd-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  <i className={showCurrent ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
              <hr />
              <div className="input-wrap-ch">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="New Password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pwd-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  <i className={showNew ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
              <hr />

              <div className="input-wrap-ch">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className="pwd-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  <i className={showConfirm ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
            </div>

          </form>
            <div className="ch-btn-end" style={{ marginTop: 16 }}>
              <div className="ch-btn-done">
                <button className="ch-done" type="submit" disabled={loading}>
                  {loading ? "Processing..." : "Done"}
                </button>
              </div>
            </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            • ใช้อีเมล @kmitl.ac.th เท่านั้น
            <br />
            • รหัสผ่านใหม่ควรต่างจากรหัสเดิม และมีความยาว ≥ 8 ตัว พร้อมตัวพิมพ์เล็ก/ใหญ่ ตัวเลข และอักขระพิเศษ
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
