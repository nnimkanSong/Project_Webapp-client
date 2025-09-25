import React, { useState } from "react";
import "../css/History_admin.css";
import { FaEdit } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const History = () => {
  const [data, setData] = useState([
    { user: "lnwza001", room: "B317", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "E107", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza006", room: "E111", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza004", room: "E113", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "B317", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "E107", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza006", room: "E111", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza004", room: "E113", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "B317", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "E107", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza006", room: "E111", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza004", room: "E113", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "B317", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza001", room: "E107", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza006", room: "E111", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
    { user: "lnwza004", room: "E113", detail: "กำลังดำเนินการ....", status: "", date: "11/08/68", time: "09.30 - 12.30" },
  ]);

  const handleEdit = (item, index) => {
    MySwal.fire({
      title: "History",
      html: `
        <div class="ha-swal-content">
            <img src="https://i.pravatar.cc/150" class="ha-swal-avatar" />
            <p><b>User :</b> ${item.user}</p>
            <p><b>Room :</b> ${item.room}</p>
            <p><b>Tracking :</b> ${item.detail}</p>
            <p><b>Date :</b> ${item.date} &nbsp;&nbsp; <b>Time :</b> ${item.time}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Accept",
      cancelButtonText: "Reject",
      customClass: {
        confirmButton: "ha-swal-accept-btn",
        cancelButton: "ha-swal-reject-btn",
        popup: "ha-swal-popup",
        title: "ha-swal-title",
      }
    }).then((result) => {
      const newData = [...data];
      if (result.isConfirmed) {
        const newData = [...data];
        newData[index].detail = "ยืนยันการจอง";
        newData[index].status = "approved";
        setData(newData);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // กด Reject → แสดง popup ยืนยัน
        Swal.fire({
          title: "Are you sure ?",
          html: `
            <p>คุณแน่ใจใช่ไหมที่ปฏิเสธคำขอนี้</p>
            <p>หากคุณดำเนินการต่อ คำร้องนี้จะถูกยกเลิกและไม่สามารถกู้คืนได้</p>
            <p><b>คุณต้องการดำเนินการต่อหรือไม่?</b></p>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          customClass: {
            confirmButton: "ha-swal-yes-btn",
            cancelButton: "ha-swal-no-btn",
            popup: "ha-swal-popup",
          }
        }).then((confirmResult) => {
          if (confirmResult.isConfirmed) {
            // กดยืนยัน Reject
            const newData = [...data];
            newData[index].detail = "ไม่อนุมัติการจอง";
            newData[index].status = "rejected";
            setData(newData);
          }
        });
      }
    });
  };

  return (
    <div className="ha-history-container">
      <h2 className="ha-history-title">History</h2>
      <div className="ha-history-list">
        {data.map((item, index) => (
          <div key={index} className="ha-history-item">
            <span className="ha-user">User : {item.user}</span>
            <span>{item.room}</span>
            <span
              className={
                item.status === "approved"
                  ? "ha-status-approved"
                  : item.status === "rejected"
                  ? "ha-status-rejected"
                  : ""
              }
            >
              {item.detail}
            </span>
            <span>{item.date}</span>
            <span>{item.time}</span>
            <button className="ha-edit-btn" onClick={() => handleEdit(item, index)}>
              <FaEdit />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
