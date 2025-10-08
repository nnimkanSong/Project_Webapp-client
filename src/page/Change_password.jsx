import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "../css/change.css";

function ChangePassword() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currOk, setCurrOk] = useState(null);
  const [currChecking, setCurrChecking] = useState(false);
  const [currMsg, setCurrMsg] = useState("");

  const isStrongPassword = useCallback(
    (pwd) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(String(pwd)),
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

  const submittingRef = useRef(false);

  const checkCurrent = useCallback(
  async (pwdFromSubmit) => {
    // ใช้ค่าที่ส่งมา (เช่นจาก handleSubmit) ถ้าไม่ส่งมาใช้ state ปัจจุบัน
    const val = typeof pwdFromSubmit === "string" ? pwdFromSubmit : currentPwd;

    if (!val) {
      setCurrOk(false);
      setCurrMsg("Please enter current password");
      return false;
    }

    try {
      setCurrChecking(true);
      setCurrMsg("");

      await axios.post(
        `${BASE_URL}/api/auth/check-current-password`,
        { currentPassword: val },                     // ❌ ไม่ trim/normalize
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );

      setCurrOk(true);
      return true;
    } catch (err) {
      if (err?.response?.status === 401) {
        navigate("/login");                           
        return false;
      }
      setCurrOk(false);
      setCurrMsg(err?.response?.data?.error || "Current password incorrect");
      return false;
    } finally {
      setCurrChecking(false);
    }
  },
  [BASE_URL, currentPwd, navigate]
);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading || submittingRef.current) return;

      if (currOk !== true) {
        const ok = await checkCurrent();
        if (!ok) return;
      }

      const np = newPwd.trim();
      const cp = confirmPwd.trim();
      const op = currentPwd.trim();

      if (!np || !cp) {
        return Swal.fire({ icon: "warning", title: "Missing fields" });
      }
      if (!isStrongPassword(np)) {
        return Swal.fire({ icon: "warning", title: "Weak password", html: RULE_HTML });
      }
      if (np !== cp) {
        return Swal.fire({
          icon: "warning",
          title: "Password mismatch",
          text: "New password and confirmation do not match.",
        });
      }
      if (np === op) {
        return Swal.fire({
          icon: "warning",
          title: "No change",
          text: "New password must be different from current password.",
        });
      }

      try {
        submittingRef.current = true;
        setLoading(true);

        await axios.post(
          `${BASE_URL}/api/auth/change-password`,
          { currentPassword: op, newPassword: np, confirmPassword: cp },
          { withCredentials: true }
        );

        await Swal.fire({
          icon: "success",
          title: "Password changed",
          text: "Your password has been updated.",
        });

        navigate("/");
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Failed",
          text:
            err?.response?.data?.error ||
            (err?.response?.status === 401
              ? "Session expired. Please login again."
              : "Server error"),
        });
        if (err?.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [BASE_URL, checkCurrent, confirmPwd, currentPwd, isStrongPassword, loading, navigate, newPwd, RULE_HTML, currOk]
  );

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
                  onChange={(e) => {
                    setCurrentPwd(e.target.value);
                    setCurrOk(null);
                    setCurrMsg("");
                  }}
                  onBlur={checkCurrent}
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

              {currChecking && <small style={{ color: "#64748b" }}>Checking current password…</small>}
              {currOk === true && !currChecking && (
                <small style={{ color: "#16a34a" }}>✓ Current password OK</small>
              )}
              {currOk === false && !currChecking && (
                <small style={{ color: "#ef4444" }}>{currMsg || "Current password incorrect"}</small>
              )}

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
                <button
                  className="ch-done"
                  type="submit"
                  disabled={loading || currChecking || currOk === false}
                  title={currOk === false ? "Current password incorrect" : ""}
                >
                  {loading ? "Processing..." : "Done"}
                </button>
              </div>
            </div>

          
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
