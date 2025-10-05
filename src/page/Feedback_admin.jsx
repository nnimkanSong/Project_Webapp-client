import React, { useMemo, useState, useEffect } from "react";
import "../css/feedback_admin.css";

const rooms = ["room", "E317", "E111", "E107", "E113"];
const equipments = ["Equipment", "แอร์", "ไมค์", "โปรเจ็กเตอร์", "โต๊ะ" , "เก้าอี้", "ไฟ", "Wi-Fi"];

const mockFeedback = [
  { id: 1, studentId: "66200033", room: "E317", date: "11/08/68", rating: 4.80, comment: "ห้องเย็นมาก ปรับแอร์ไม่ได้ ถ้าปิดก็ร้อนเกิน",   equipment: "แอร์ไม่เย็น……" },
  { id: 2, studentId: "66200033", room: "E113", date: "11/08/68", rating: 4.99, comment: "ห้องสะอาด แต่มีกลิ่นเหม็น",    equipment: "ไมค์พังใช้งานไม่ได้" },
  { id: 3, studentId: "66200033", room: "E113", date: "11/08/68", rating: 4.80, comment: "คนคิดพูด…..",     equipment: "มาก……" },
  { id: 4, studentId: "66200033", room: "E113", date: "11/08/68", rating: 4.80, comment: "คนคิดเต้น…..",     equipment: "ไฟไม่สว่าง" },
  { id: 5, studentId: "66200033", room: "E113", date: "11/08/68", rating: 4.80, comment: "คนคิดตา…..",      equipment: "Wi-Fiไม่ดี เพราะแก่…" },
];

export default function FeedbackPage() {
  const [room, setRoom]   = useState("room");
  const [equip, setEquip] = useState("Equipment");

  const [feedbackData, setFeedbackData] = useState([]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch("https://yourserver.com/api/feedback");
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setFeedbackData(data);
      } catch (err) {
        console.warn("ใช้ mock data แทนเพราะโหลดจริงไม่สำเร็จ:", err);
        setFeedbackData(mockFeedback);
      }
    };

    fetchFeedback();
  }, []);

  const filtered = useMemo(() => {
    return feedbackData.filter((x) =>
      (room === "room" || x.room === room) &&
      (equip === "Equipment" || x.equipment.includes(equip))
    );
  }, [room, equip, feedbackData]);

  return (
    <div className="fb-page">
      <div className="fb-shell">
        <h1 className="fb-title">Feedback</h1>

        <div className="fb-top">
          <div className="fb-card fb-donut">
            <div className="donut"><div className="donut-hole" /></div>
            <ul className="legend">
              <li><span className="dot c1" /> B317</li>
              <li><span className="dot c2" /> E111</li>
              <li><span className="dot c3" /> E107</li>
              <li><span className="dot c4" /> E113</li>
            </ul>
          </div>

          <div className="fb-card fb-center">
            <div className="big">★ 5.00</div>
          </div>

          <div className="fb-card fb-right">
            <div className="big">127</div>
            <div className="sub">Total Feedback</div>
          </div>
        </div>

        <div className="fb-filters">
          <div className="filter">
            <small>Filter by room</small>
            <div className="select-like">
              <select value={room} onChange={(e) => setRoom(e.target.value)}>
                {rooms.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="chev">▾</span>
            </div>
          </div>

          <div className="filter">
            <small>Filter by Equipment</small>
            <div className="select-like">
              <select value={equip} onChange={(e) => setEquip(e.target.value)}>
                {equipments.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="chev">▾</span>
            </div>
          </div>
        </div>

        <ul className="fb-list">
          {filtered.map((x) => (
            <li className="row" key={x.id}>
              <div className="cell sid">{x.studentId}</div>
              <div className="cell room">{x.room}</div>
              <div className="cell date">{x.date}</div>
              <div className="cell rating"><span className="mini-star">★</span>{x.rating.toFixed(2)}</div>
              <div className="cell comment" title={x.comment}>{x.comment}</div>
              <div className="cell equip" title={x.equipment}>{x.equipment}</div>
              <button className="cell info" aria-label="more">i</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
