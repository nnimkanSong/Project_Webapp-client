import React from "react";
import "../css/History.css";
import Swal from "sweetalert2";

export default function History() {
  const handleCancel = () => {
    Swal.fire({
      title: "ยกเลิกหรือไม่?",
      text: "คุณแน่ใจหรือว่าต้องการยกเลิก",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#D9D9D9",
      confirmButtonText: "ใช่",
      cancelButtonText: "ไม่",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("ยกเลิกแล้ว!", "การดำเนินการถูกยกเลิกเรียบร้อย", "success");
      }
    });
  };

  return (
    <div className="card-wrapper">
      <div className="history-card">
        <h2 className="history-title">History</h2>
        <img
          src="https://i.pinimg.com/736x/70/7c/70/707c708a9baa10430897b43fecaa4acb.jpg"
          alt="profile"
          className="profile-img"
        />
        <div className="history-info">
          <p>
            <strong>User :</strong> เnwza007
          </p>
          <p>
            <strong>Room :</strong> B317
          </p>
          <p>
            <strong>Tracking :</strong> กำลังดำเนินการ...
          </p>
          <p>
            <strong>Date :</strong> 11/08/68
          </p>
          <p>
            <strong>Time :</strong> 09.30 - 12.30
          </p>
        </div>

        <div className="btn-group">
          <button className="btn-edit">Edit</button>
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
