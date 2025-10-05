import "../css/Profile_user.css";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../api"; // ถ้า instance ของคุณเป็น default export ให้เปลี่ยนเป็น: import api from "../api";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const lastPreviewUrlRef = useRef(null);

  const [user, setUser] = useState({
    username: "",
    student_number: "",
    email: "",
    user_type: "user", // ✅ เพิ่ม user_type
    photoUrl: "https://placehold.co/200x200?text=Profile",
  });

  // ตั้ง Authorization header ครั้งเดียว
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }, []);

  // โหลดโปรไฟล์
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/profile/me");
        const d = res.data;
        setUser((prev) => ({
          ...prev,
          username: d.username,
          student_number: d.student_number || "",
          email: d.email,
          user_type: d.user_type || "user", // ✅ รับค่าจาก API
          // server แปลงเป็น URL พร้อมใช้ให้แล้ว
          photoUrl: d.photoUrl || prev.photoUrl,
        }));
      } catch (e) {
        console.error("load profile error:", e);
      } finally {
        setLoading(false);
      }
    })();

    // cleanup preview URL
    return () => {
      if (lastPreviewUrlRef.current) {
        URL.revokeObjectURL(lastPreviewUrlRef.current);
      }
    };
  }, []);

  // อัปโหลดรูป
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ทำ preview ชั่วคราว
    const localUrl = URL.createObjectURL(file);
    // cleanup preview ก่อนหน้า
    if (lastPreviewUrlRef.current) {
      URL.revokeObjectURL(lastPreviewUrlRef.current);
    }
    lastPreviewUrlRef.current = localUrl;
    setUser((prev) => ({ ...prev, photoUrl: localUrl }));

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/api/profile/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // ใช้ URL จริงจาก server (Cloudinary)
      setUser((prev) => ({ ...prev, photoUrl: res.data.url }));
    } catch (err) {
      console.error("upload photo error:", err);
      // ถ้าอัปโหลดพลาด ย้อนกลับรูปเดิม
      setUser((prev) => ({
        ...prev,
        photoUrl: prev.photoUrl?.startsWith("blob:")
          ? "https://placehold.co/200x200?text=Profile"
          : prev.photoUrl,
      }));
    }
  };

  // บันทึกข้อมูลพื้นฐาน (ไม่ส่ง photoUrl เพราะอัปเดตผ่าน /photo แล้ว)
  const handleSave = async () => {
    try {
      const payload = {
        username: user.username,
        student_number: user.student_number,
        // ❌ ไม่ส่ง user_type (ห้ามแก้จากหน้าผู้ใช้) และไม่ส่ง photoUrl
      };
      const res = await api.put("/api/profile", payload);
      setUser((prev) => ({
        ...prev,
        username: res.data.username,
        student_number: res.data.student_number || "",
        email: res.data.email,
        user_type: res.data.user_type || prev.user_type, // ✅ รับกลับมาเพื่อความชัดเจน
        // photoUrl คงค่าปัจจุบันที่แสดงอยู่
      }));
      setIsEditing(false);
      setShowPopup(true);
    } catch (e) {
      console.error("save profile error:", e);
      alert(e?.response?.data?.error || "Update failed");
    }
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

  // helper: แต่ง badge ตาม role
  const roleClass =
    user.user_type === "admin"
      ? "badge admin"
      : user.user_type === "vip"
      ? "badge vip"
      : "badge user";

  return (
    <div className="page">
      <div className="profile-page">
        <div className="profile-card">
          <h2 className="profile-title">Profile</h2>

          {/* รูปโปรไฟล์ */}
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
              <button
                className="btn small"
                onClick={() => fileRef.current?.click()}
              >
                Change photo
              </button>
            )}
          </div>

          {/* ข้อมูล */}
          <div className="profile-info-grid">
            <div className="label">Username :</div>
            <div className="value">
              {isEditing ? (
                <input
                  type="text"
                  value={user.username}
                  onChange={(e) =>
                    setUser((p) => ({ ...p, username: e.target.value }))
                  }
                />
              ) : (
                <b>{user.username}</b>
              )}
            </div>

            <div className="label">Student ID :</div>
            <div className="value">
              {/* {isEditing ? (
                <input
                  type="text"
                  value={user.student_number}
                  onChange={(e) =>
                    setUser((p) => ({ ...p, student_number: e.target.value }))
                  }
                />
              ) : (
                <b>{user.student_number || "-"}</b>
              )} */}
              <b>{user.student_number}</b>
            </div>

            <div className="label">Email :</div>
            <div className="value">
              <b>{user.email}</b>
            </div>

            {/* ✅ แทน Password ด้วย User type */}
            <div className="label">User type :</div>
            <div className="value">
              <span className={roleClass}>{user.user_type}</span>
            </div>
          </div>

          {/* ปุ่ม */}
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

            {/* ปุ่ม Reset Password */}
            <button
              className="btn reset"
              onClick={() => (window.location.href = "/Forgot")}
              aria-label="Reset your password"
              title="Reset your password"
            >
              <svg
                className="btn-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 8V6a4 4 0 0 1 8 0v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect
                  x="6"
                  y="8"
                  width="12"
                  height="12"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 13v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Reset password
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

      {/* Popup */}
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
