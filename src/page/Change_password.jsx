// src/pages/ResetPassword.jsx 
import React, { useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "../css/change.css";

const Eye = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  </svg>
);
const EyeOff = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M2.1 3.51 3.5 2.1l18.4 18.39-1.41 1.41-3.13-3.13A13.5 13.5 0 0 1 12 19c-7 0-10-7-10-7a18.3 18.3 0 0 1 4.23-5.46L2.1 3.5Zm6.9 6.9a3 3 0 0 0 4.24 4.24l-4.24-4.24ZM12 5c7 0 10 7 10 7a18.5 18.5 0 0 1-3.76 4.94l-1.44-1.44A12 12 0 0 0 20 12s-3-6-8-6c-1.23 0-2.34.28-3.33.72L7.12 5.17A10.6 10.6 0 0 1 12 5Z" />
  </svg>
);

function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  const email = (params.get("email") || "").trim().toLowerCase();
  const resetToken = (params.get("token") || "").trim();

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isStrongPassword = useCallback(
    (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(String(pwd)),
    []
  );

  const RULE_HTML = useMemo(
    () =>
      "Password must have at least 8 characters and include:<br/>" +
      "• lowercase a-z<br/>" +
      "• uppercase A-Z<br/>" +
      "• a number<br/>" +
      "• a special character",
    []
  );
  
  const PWD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}";
  const PWD_MSG = "ต้องมี ≥8 ตัว, มี a-z, A-Z, 0-9 และอักขระพิเศษ";

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;

      if (!email) {
        return Swal.fire({ icon: "error", title: "Invalid link" });
      }

      const np = newPwd.trim();
      const cp = confirmPwd.trim();

      if (!np || !cp) return Swal.fire({ icon: "warning", title: "Missing fields" });
      if (!isStrongPassword(np))
        return Swal.fire({ icon: "warning", title: "Weak password", html: RULE_HTML });
      if (np !== cp)
        return Swal.fire({ icon: "warning", title: "Password mismatch" });

      try {
        setLoading(true);
        await axios.post(
          `${BASE_URL}/api/auth/reset-password`,
          { newPassword: np },
          { withCredentials: true }
        );

        await Swal.fire({
          icon: "success",
          title: "Password updated",
          text: "Your password has been changed successfully.",
        });
        navigate("/login");
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          (err?.response?.status === 400 ? "Invalid or expired reset token." : "Server error");
        Swal.fire({ icon: "error", title: "Failed", text: msg });
      } finally {
        setLoading(false);
      }
    },
    [BASE_URL, email, newPwd, confirmPwd, isStrongPassword, RULE_HTML, loading, navigate]
  );

  return (
    <div className="change-bg">
      <div className="ch-box">
        <div className="ch-rgb">
          <div className="ch-logo">
            <img src="/Chang_password.png" alt="Reset Password" />
          </div>

          <form className="ch-input" onSubmit={handleSubmit}>
            <div className="ch-name">
              <p>New password :</p>
              <p>Confirm password :</p>
            </div>

            <div className="ch-box-input">
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
                  pattern={PWD_PATTERN}
                  title={PWD_MSG}
                  inputMode="text"
                  aria-label="New Password"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <hr />

              <div className="input-wrap-ch">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={loading || !newPwd}
                  autoComplete="new-password"
                  className="pwd-input"
                  required
                  inputMode="text"
                  aria-label="Confirm Password"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  disabled={!newPwd}
                >
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </form>

          <div className="ch-btn-end" style={{ marginTop: 16 }}>
            <div className="ch-btn-done">
              <button className="ch-done" onClick={handleSubmit} disabled={loading}>
                {loading ? "Loading..." : "Done"}
              </button>
            </div>
          </div>

          {email ? (
            <small style={{ marginTop: 12, color: "#64748b", alignSelf: "center" }}>
              resetting for: <b>{email}</b>
            </small>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
