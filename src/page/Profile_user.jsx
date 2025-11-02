// src/pages/Profile.jsx
import "../css/Profile_user.css";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../api"; // axios instance withCredentials: true

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fpCooldown, setFpCooldown] = useState(0); // ✅ cooldown เหมือนหน้า Login
  const fileRef = useRef(null);
  const lastPreviewUrlRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    studentNumber: "",
    email: "",
    userType: "user",
    photoUrl: "https://placehold.co/200x200?text=Profile",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/profile/me");
        setUser((prev) => ({
          ...prev,
          username: data.username || "",
          studentNumber: data.studentNumber || "",
          email: data.email || "",
          userType: data.userType || "user",
          photoUrl: data.photoUrl || prev.photoUrl,
        }));
      } catch (e) {
        console.error("load profile error:", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (lastPreviewUrlRef.current) {
        URL.revokeObjectURL(lastPreviewUrlRef.current);
      }
    };
  }, []);

  // ✅ Timer ลด cooldown เหมือนหน้า Login
  useEffect(() => {
    if (fpCooldown <= 0) return;
    const t = setInterval(() => setFpCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [fpCooldown]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    if (lastPreviewUrlRef.current) URL.revokeObjectURL(lastPreviewUrlRef.current);
    lastPreviewUrlRef.current = localUrl;
    setUser((prev) => ({ ...prev, photoUrl: localUrl }));

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/profile/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => ({ ...prev, photoUrl: res.data.url }));
    } catch (err) {
      console.error("upload photo error:", err);
      setUser((prev) => ({
        ...prev,
        photoUrl: prev.photoUrl?.startsWith("blob:")
          ? "https://placehold.co/200x200?text=Profile"
          : prev.photoUrl,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        username: user.username,
        studentNumber: user.studentNumber,
      };
      const { data } = await api.put("/api/profile", payload);
      setUser((prev) => ({
        ...prev,
        username: data.username,
        studentNumber: data.studentNumber || "",
        email: data.email,
        userType: data.userType || prev.userType,
      }));
      setIsEditing(false);
      setShowPopup(true);
    } catch (e) {
      console.error("save profile error:", e);
      alert(e?.response?.data?.error || "Update failed");
    }
  };

  // ===== Forgot/OTP flow เหมือนหน้า Login =====
  async function flowEnterOtp(email) {
    let canResend = true;
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
        denyButtonText: canResend ? "ส่งรหัสใหม่" : "รอ 30s",
        allowOutsideClick: () => !Swal.isLoading(),
        didOpen: () => {
          if (!canResend) {
            let tLeft = 30;
            const denyBtn = Swal.getDenyButton();
            denyBtn.disabled = true;
            denyBtn.textContent = `รอ ${tLeft}s`;
            const timer = setInterval(() => {
              tLeft--;
              if (tLeft > 0) denyBtn.textContent = `รอ ${tLeft}s`;
              else {
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
          if (!/^\d{6}$/.test(code)) return Swal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
          try {
            const { data } = await api.post("/api/auth/verify-reset-otp", { email, otp: code });
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
          await api.post("/api/auth/resend-reset-otp", { email });
          await Swal.fire({ icon: "info", title: "ส่งรหัสใหม่แล้ว", text: "โปรดตรวจสอบอีเมล/สแปม", timer: 1500, showConfirmButton: false });
          canResend = false;
        } catch (err) {
          await Swal.fire({ icon: "error", title: "ส่งรหัสใหม่ไม่สำเร็จ", text: err.response?.data?.error || "Server error" });
        }
        continue;
      }

      if (otpModal.isConfirmed && otpModal.value) {
        await Swal.fire({ icon: "success", title: "ยืนยันสำเร็จ", timer: 1200, showConfirmButton: false });
        return { ok: true };
      }
      return { ok: false };
    }
  }

  const handleForgot = async () => {
    if (fpCooldown > 0) return;

    const initialEmail = String(user.email || "").trim().toLowerCase();

    const emailStep = await Swal.fire({
      title: "ลืมรหัสผ่าน",
      input: "email",
      inputLabel: "กรอกอีเมลที่ใช้สมัคร",
      inputValue: initialEmail,
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
        if (!/^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(email))
          return Swal.showValidationMessage("กรุณาใช้อีเมลโดเมน @kmitl.ac.th");

        try {
          // ตรวจว่ามี user ในระบบ
          const check = await api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
          if (!check.data?.emailVerified && !check.data?.verificationMethod) {
            Swal.showValidationMessage("ไม่พบบัญชีผู้ใช้ในระบบนี้");
            return false;
          }

          await api.post("/api/auth/forgot-password", { email });
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

  if (loading) {
    return (
      <div className="page">
        <div className="profile-page">
          <div className="profile-card">Loading…</div>
        </div>
      </div>
    );
  }

  const roleClass =
    user.userType === "admin"
      ? "badge admin"
      : user.userType === "vip"
      ? "badge vip"
      : "badge user";

  return (
    <div className="page">
      <div className="profile-page">
        <div className="profile-card">
          <h2 className="profile-title">Profile</h2>

          <div className="profile-image">
            <img src={user.photoUrl} alt="Profile" className="profile-photo" />
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              ref={fileRef}
              onChange={handleFile}
              style={{ display: "none" }}
            />
            {isEditing && (
              <button className="btn small" onClick={() => fileRef.current?.click()}>
                Change photo
              </button>
            )}
          </div>

          <div className="profile-info-grid">
            <div className="label">Username :</div>
            <div className="value">
              {isEditing ? (
                <input
                  type="text"
                  value={user.username}
                  onChange={(e) => setUser((p) => ({ ...p, username: e.target.value }))}
                />
              ) : (
                <b>{user.username || "-"}</b>
              )}
            </div>

            <div className="label">Student ID :</div>
            <div className="value">
              <b>{user.studentNumber || "-"}</b>
            </div>

            <div className="label">Email :</div>
            <div className="value">
              <b>{user.email || "-"}</b>
            </div>

            <div className="label">User type :</div>
            <div className="value">
              <span className={roleClass}>{(user.userType || "user").toUpperCase()}</span>
            </div>
          </div>

          <div className="button-group" style={{ flexWrap: "wrap" }}>
            <button
              onClick={() => {
                if (isEditing) setIsEditing(false);
                else window.location.href = "/";
              }}
              className="btn back"
            >
              Back
            </button>

            {/* ✅ ปรับให้ปุ่ม Reset password ใช้ flow forgot เหมือนหน้า Login */}
            <button
              className="btn reset"
              onClick={handleForgot}
              disabled={fpCooldown > 0}
              aria-label="Reset your password"
              title={fpCooldown > 0 ? `รอ ${fpCooldown}s` : "Reset your password"}
            >
              {fpCooldown > 0 ? `Reset password (รอ ${fpCooldown}s)` : "Reset password"}
            </button>

            {isEditing ? (
              <button className="btn edit" onClick={handleSave}>
                Save
              </button>
            ) : (
              <button className="btn edit" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <button className="popup-close" onClick={() => setShowPopup(false)}>
              ×
            </button>
            <div className="popup-icon">✔</div>
            <h2>Succeed</h2>
            <p>ข้อมูลของคุณได้รับการอัปเดตเรียบร้อย</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
