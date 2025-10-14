// src/pages/ResetPassword.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import styles from "../css/ResetPasswordAdmin.module.css"; // ✅ ใช้ CSS Module (เปลี่ยนจาก import ธรรมดา)

function ResetPasswordAdmin() {
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
    <div className={styles["change-bg"]}>
      <div className={styles["ch-box"]}>
        <div className={styles["ch-rgb"]}>
          <div className={styles["ch-logo"]}>
            <img src="/Chang_password.png" alt="Reset Password" />
          </div>

          {/* ✅ ปุ่มอยู่ "ใน" form แล้ว */}
          <form className={styles["ch-input"]} onSubmit={handleSubmit}>
            <div className={styles["ch-name"]}>
              <p>New password :</p>
              <p>Confirm password :</p>
            </div>

            <div className={styles["ch-box-input"]}>
              {/* New Password */}
              <div className={styles["input-wrap-ch"]}>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="New Password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  className={styles["pwd-input"]}
                  required
                  pattern={PWD_PATTERN}
                  title={PWD_MSG}
                  inputMode="text"
                  aria-label="New Password"
                />
                <button
                  type="button"
                  className={styles["toggle-visibility"]}
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  <i className={showNew ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>

              <hr className={styles.hr} />

              {/* Confirm Password */}
              <div className={styles["input-wrap-ch"]}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={loading || !newPwd}
                  autoComplete="new-password"
                  className={styles["pwd-input"]}
                  required
                  inputMode="text"
                  aria-label="Confirm Password"
                />
                <button
                  type="button"
                  className={styles["toggle-visibility"]}
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  disabled={!newPwd}
                >
                  <i className={showConfirm ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                </button>
              </div>
            </div>
          </form>

          <div className={styles["ch-btn-end"]} style={{ marginTop: 16 }}>
            <div className={styles["ch-btn-done"]}>
              <button className={styles["ch-done"]} onClick={handleSubmit} disabled={loading}>
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

export default ResetPasswordAdmin;
