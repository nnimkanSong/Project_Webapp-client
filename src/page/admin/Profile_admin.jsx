import React, { useEffect, useRef, useState } from "react";
import "../../css/Profile_admin.css";
import { api } from "../../api"; // axios instance withCredentials: true

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
      setShowPopup(true);
    } catch (e) {
      console.error("save profile error:", e);
      alert(e?.response?.data?.error || "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="ap-profile-page">
        <div className="ap-profile-card">Loading…</div>
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
            onClick={() => (window.location.href = "/login")}
            aria-label="Reset your password"
            title="Reset your password"
          >
            Reset password
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
