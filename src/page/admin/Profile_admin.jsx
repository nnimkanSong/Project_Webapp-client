// src/pages/Profile_admin.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";          // ✅ เพิ่ม
import "../../css/Profile_admin.css";
import { api } from "../../api";                         // axios instance (withCredentials: true)
import Swal from "sweetalert2";

const themedSwal = Swal.mixin({
  customClass: {
    popup: "ap-swal",
    title: "ap-swal-title",
    htmlContainer: "ap-swal-text",
    confirmButton: "ap-swal-confirm",
    cancelButton: "ap-swal-cancel",
    input: "ap-input",
    actions: "ap-swal-actions",
  },
  buttonsStyling: false, // ให้ใช้ class ของเราแทนสไตล์ default
  backdrop: true,
});

// ✅ ตัวช่วยตรวจอีเมลโดเมน KMITL
const isKMITLEmail = (email) =>
  /^[a-zA-Z0-9._%+-]+@(?:kmitl\.ac\.th|mail\.kmitl\.ac\.th|student\.kmitl\.ac\.th)$/i
    .test(String(email || "").trim());

// ✅ flow กรอก OTP แบบง่าย (ปรับตามระบบจริงของคุณได้)
// ใน Profile_admin.jsx
async function flowEnterOtp(email) {
  const r = await themedSwal.fire({
    title: "กรอกรหัสยืนยัน (OTP)",
    input: "text",
    inputLabel: `ส่งไปที่ ${email}`,
    inputPlaceholder: "เช่น 123456",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    showLoaderOnConfirm: true,
 allowOutsideClick: () => !themedSwal.isLoading(),
 allowEnterKey:   () => !themedSwal.isLoading(),
    preConfirm: async (otp) => {
      const code = String(otp || "").trim();
      if (!/^\d{6}$/.test(code)) return themedSwal.showValidationMessage("กรุณากรอก OTP 6 หลัก");
      try {
        const { data } = await api.post("/api/auth/verify-reset-otp", { email, otp: code }); // withCredentials= true ใน instance แล้ว
        return data || true;
      } catch (err) {
        themedSwal.showValidationMessage(err.response?.data?.error || "โค้ดไม่ถูกต้อง/หมดอายุ");
      }
    },
  });
  return r.isConfirmed ? { ok: true } : { ok: false };
}




const Profile = () => {
  const navigate = useNavigate();                       // ✅ ใช้ navigate
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const lastPreviewUrlRef = useRef(null);
  const [fpCooldown, setFpCooldown] = useState(0);

  const [user, setUser] = useState({
    username: "",
    studentNumber: "",
    email: "",
    userType: "user",
    photoUrl: "https://placehold.co/200x200?text=Profile",
  });

  // ✅ นับถอยหลัง cooldown
  useEffect(() => {
    if (fpCooldown <= 0) return;
    const t = setInterval(() => setFpCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [fpCooldown]);

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
      if (lastPreviewUrlRef.current) URL.revokeObjectURL(lastPreviewUrlRef.current);
    };
  }, []);

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
  const handleForgot = useCallback(async () => {
    if (fpCooldown > 0) return;

    const emailStep = await themedSwal.fire({
      title: "ลืมรหัสผ่าน",
      input: "email",
      inputLabel: "กรอกอีเมลที่ใช้สมัคร",
      inputPlaceholder: "name@kmitl.ac.th",
      confirmButtonText: "ส่งรหัส/ลิงก์รีเซ็ต",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
      inputAttributes: { autocapitalize: "off", autocorrect: "off" },
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !themedSwal.isLoading(),
      allowEnterKey: () => !themedSwal.isLoading(),
      preConfirm: async (val) => {
        const email = String(val || "").trim().toLowerCase();
        if (!email) return themedSwal.showValidationMessage("กรุณากรอกอีเมล");
        if (!isKMITLEmail(email)) {
          return themedSwal.showValidationMessage("กรุณาใช้อีเมลโดเมน @kmitl.ac.th");
        }

        try {
          // ✅ ส่งแบบแนบ cookie (สำหรับเซิร์ฟเวอร์ set HttpOnly cookie)
          await api.post(
            "/api/auth/forgot-password",
            { email },
            { withCredentials: true } // สำคัญมาก — เพื่อให้เซิร์ฟเวอร์ตั้ง cookie ได้
          );
          return email;
        } catch (err) {
          const msg =
            err?.response?.status === 429
              ? "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง"
              : err?.response?.data?.error || "ส่งคำขอล้มเหลว";
          themedSwal.showValidationMessage(msg);
        }
      },
    });

    if (!emailStep.isConfirmed) return;

    setFpCooldown(30);
    const email = emailStep.value;

    // ✅ Flow OTP เหมือนเดิม
    const verified = await flowEnterOtp(email);
    if (!verified?.ok) return;

    // ✅ ตอนนี้ไม่ต้องแนบ token ใน URL แล้ว
    // เพราะ backend ใช้ HttpOnly cookie อยู่แล้ว
    navigate(`/admin/reset-password?email=${encodeURIComponent(email)}`);
  }, [fpCooldown, navigate]);




  const handleSave = async () => {
    try {
      const payload = { username: user.username, studentNumber: user.studentNumber };
      const { data } = await api.put("/api/profile", payload);

      setUser((prev) => ({
        ...prev,
        username: data.username,
        studentNumber: data.studentNumber || "",
        email: data.email,
        userType: data.userType || prev.userType,
      }));
      setIsEditing(false);

      // ✅ SweetAlert สไตล์ทองพรีเมียม
      await themedSwal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ!",
        text: "ข้อมูลของคุณได้รับการอัปเดตเรียบร้อยแล้ว",
        confirmButtonText: "ตกลง",
      });

    } catch (e) {
      console.error("save profile error:", e);
      await themedSwal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: e?.response?.data?.error || "บันทึกข้อมูลไม่สำเร็จ",
        confirmButtonText: "ลองใหม่",
      });
    }
  };
  const roleClass =
    user.userType === "admin"
      ? "badge admin"
      : user.userType === "vip"
        ? "badge vip"
        : "badge user";


  return (
    <div className="ap-profile-page">
      <div className="ap-profile-card">
        <h2 className="ap-profile-title">Profile</h2>

        {/* รูปโปรไฟล์ */}
        <div className="ap-profile-image">
          <img src={user.photoUrl} alt="Profile" className="ap-profile-photo" />
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            ref={fileRef}
            onChange={handleFile}
            style={{ display: "none" }}
          />
          {isEditing && (
            <button className="ap-btn ap-small" onClick={() => fileRef.current?.click()}>
              Change photo
            </button>
          )}
        </div>

        {/* ข้อมูล */}
        <div className="ap-profile-info-grid">
          <div className="ap-label">Username :</div>
          <div className="ap-value">
            {isEditing ? (
              <input
                type="text"
                value={user.username}
                onChange={(e) => setUser((p) => ({ ...p, username: e.target.value }))}
                className="ap-input"
              />
            ) : (
              <b>{user.username || "-"}</b>
            )}
          </div>

          <div className="ap-label">Student ID :</div>
          <div className="ap-value">
            <b>{user.studentNumber || "-"}</b>
          </div>

          <div className="ap-label">Email :</div>
          <div className="ap-value">
            <b>{user.email || "-"}</b>
          </div>

          <div className="ap-label">User type :</div>
          <div className="ap-value">
            <span className={roleClass}>{(user.userType || "user").toUpperCase()}</span>
          </div>
        </div>

        {/* ปุ่ม */}
        <div className="ap-button-group" style={{ flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (isEditing) setIsEditing(false);
              else window.location.href = "/";
            }}
            className="ap-btn ap-back"
          >
            Back
          </button>

          <button
            className="ap-btn ap-reset"
            onClick={handleForgot}
            aria-label="Reset your password"
            disabled={fpCooldown > 0}
            title={fpCooldown > 0 ? `รอ ${fpCooldown}s` : "ขอรหัสรีเซ็ต"}
          >
            {fpCooldown > 0 ? `Reset password (${fpCooldown}s)` : "Reset password"}
          </button>

          {isEditing ? (
            <button className="ap-btn ap-edit" onClick={handleSave}>
              Save
            </button>
          ) : (
            <button className="ap-btn ap-edit" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup-card">
            <button className="ap-popup-close" onClick={() => setShowPopup(false)}>
              ×
            </button>
            <div className="ap-popup-icon">✔</div>
            <h2>Succeed</h2>
            <p>ข้อมูลของคุณได้รับการอัปเดตเรียบร้อย</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
