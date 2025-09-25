import React, { useState } from "react";
import "../css/Profile_user.css";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState({
    username: "lnwza007",
    studentId: "66200999",
    email: "lnwza007@kmitl.ac.th",
    password: "***************",
    photo: "https://i.pinimg.com/736x/70/7c/70/707c708a9baa10430897b43fecaa4acb.jpg"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="page">
      <div className="profile-page">
        <div className="profile-card">
          <h2 className="profile-title">Profile</h2>

          <div className="profile-image">
            <img src={user.photo} alt="Profile" />
          </div>

          <div className="profile-info">
            {isEditing ? (
              <>
                <div>
                  <span>User Name :</span>
                  <input
                    type="text"
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <span>Student ID :</span>
                  <input
                    type="text"
                    name="studentId"
                    value={user.studentId}
                    disabled
                  />
                </div>
                <div>
                  <span>Email :</span>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <span>Password :</span>
                  <input
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <>
                <div><span>User Name :</span> {user.username}</div>
                <div><span>Student ID :</span> {user.studentId}</div>
                <div><span>Email :</span> {user.email}</div>
                <div><span>Password :</span> {"*".repeat(user.password.length)}</div>
              </>
            )}
          </div>

          <div className="button-group">
            <button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false); //ถ้าอยู่โหมดแก้ไข → กลับไปโหมดดูอย่างเดียว
                } else {
                  window.location.href = "/"; //ถ้าอยู่โหมดดู → กลับหน้า Home
                }
              }}
              className="btn back"
            >
              Back
            </button>

            {isEditing ? (
              <button
                className="btn edit"
                onClick={() => {
                  setIsEditing(false);
                  setShowPopup(true); //กด Done แล้วให้เปิด popup
                }}
              >
                Done
              </button>
            ) : (
              <button className="btn edit" onClick={() => setIsEditing(true)}>Edit</button>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <button className="popup-close" onClick={() => setShowPopup(false)}>×</button>
            <div className="popup-icon">✔</div>
            <h2>Succeed</h2>
            <p>ข้อมูลของคุณได้รับการอัปเดตเรียบร้อย<br/>คุณสามารถดำเนินการต่อหรือกลับไปยังหน้าหลักได้</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
