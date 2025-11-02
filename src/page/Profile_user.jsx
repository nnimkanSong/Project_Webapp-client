import "../css/Profile_user.css";
import React, { useEffect, useRef, useState } from "react";
import { api } from "../api"; // axios instance withCredentials: true

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const lastPreviewUrlRef = useRef(null);

  const [user, setUser] = useState({
    username: "",
    studentNumber: "",
    email: "",
    userType: "user",
    photoUrl: "https://placehold.co/200x200?text=Profile",
  });

  // ✅ ไม่ต้องตั้ง Authorization header / ไม่ต้องอ่าน localStorage token แล้ว
  // useEffect(() => {}, []);

  // โหลดโปรไฟล์
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

    // preview ชั่วคราว
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
      // ย้อนกลับรูปเดิมถ้าอัปโหลดพลาด
      setUser((prev) => ({
        ...prev,
        photoUrl: prev.photoUrl?.startsWith("blob:")
          ? "https://placehold.co/200x200?text=Profile"
          : prev.photoUrl,
      }));
    }
  };

  // บันทึกข้อมูลพื้นฐาน
  const handleSave = async () => {
    try {
      const payload = {
        username: user.username,
        studentNumber: user.studentNumber, // ✅ ใช้ camelCase
      };
      const { data } = await api.put("/api/profile", payload);
      setUser((prev) => ({
        ...prev,
        username: data.username,
        studentNumber: data.studentNumber || "",
        email: data.email,
        userType: data.userType || prev.userType,
        // photoUrl คงค่าปัจจุบัน
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
              <button className="btn small" onClick={() => fileRef.current?.click()}>
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

            <button
              className="btn reset"
              onClick={() => (window.location.href = "/reset-password")}
              aria-label="Reset your password"
              title="Reset your password"
            >
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
