import "../css/Profile_user.css";
import React, { useState } from "react";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [user, setUser] = useState({
    username: "lnwza007",
    studentId: "66200999",
    email: "lnwza007@kmitl.ac.th",
    password: "***************",
    photo: "https://scontent.fbkk34-3.fna.fbcdn.net/v/t39.30808-6/304863289_559294862656453_1405459667628279729_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeEaSbcY4e16o1tgHgE2qBhbMbgyry5SemYxuDKvLlJ6ZupzVtr9D7LtdlUCbKghdD3976kNvuV1p02ScvSBi-T3&_nc_ohc=Fwt2R_7fW_gQ7kNvwG1UBCz&_nc_oc=Adn27su_sOw0fLNTRO_m-Ma20nzL_BIZ9zQwUcWOXz65gyJTAN-XacIYt4TnwLSJXt4&_nc_zt=23&_nc_ht=scontent.fbkk34-3.fna&_nc_gid=3RBarUpZM4GkCgtLm-Gncg&oh=00_AfaO_kZAFFATOLvpzYK8Et8PGtzUerTMMB5koXL6GIMKcw&oe=68C8525C"
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
