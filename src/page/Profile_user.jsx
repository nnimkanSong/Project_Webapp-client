import React from "react";
import "../page/Profile_user"
import "../css/Profile_user.css"

const Profile = () => {
  const user = {
    username: "lnwza007",
    studentId: "66200999",
    email: "lnwza007@kmitl.ac.th",
    password: "***************",
    photo: "/path/to/photo.jpg", // เปลี่ยนเป็น path รูปจริง
  };

  return (
    <div className="profile-page">
      {/* Profile Card */}
      <div className="profile-card">
        <h2 className="profile-title">Profile</h2>

        <div className="profile-image">
          <img src={user.photo} alt="Profile" />
        </div>

        <div className="profile-info">
          <div><span>User Name :</span> {user.username}</div>
          <div><span>Student ID :</span> {user.studentId}</div>
          <div><span>Email :</span> {user.email}</div>
          <div><span>Password :</span> {user.password}</div>
        </div>

        <div className="button-group">
          <button onClick={() => window.history.back()} className="btn back">Back</button>
          <button className="btn edit">Edit</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
