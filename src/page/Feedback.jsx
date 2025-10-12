import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import styles from "../css/FeedbackForm.module.css";
import { api } from "../feedback_api";

const roomOptions = ["B317", "E107", "E111", "E113"];

const FeedbackForm = () => {
  const [studentNumber, setStudentNumber] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [equipment, setEquipment] = useState("");
  const dropdownRef = useRef(null);

  // 🔹 ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ ดึงข้อมูล student_number + room จาก backend โดยใช้ token ใน cookie
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/bookings/latest"); // ✅ token อยู่ใน cookie แล้ว
        console.log("Fetched data:", res.data);
        setStudentNumber(res.data.studentNumber || "");
        setSelectedRoom(res.data.room || "");
      } catch (err) {
        console.error("Error fetching:", err.response?.data || err.message);
        Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
      }
    };
    fetchData();
  }, []);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setDropdownOpen(false);
  };

  const isFormComplete = selectedRoom && rating && comment && equipment;

  const handleSubmit = async () => {
    if (!isFormComplete) return;
    try {
      await api.post("/api/feedback", {
        room: selectedRoom,
        rating,
        comment,
        equipment,
      });
      Swal.fire("ส่ง Feedback สำเร็จ!", "ขอบคุณสำหรับข้อมูล", "success");
      setRating(0);
      setComment("");
      setEquipment("");
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด", err.message, "error");
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.feedbackBack}>
        <div className={styles.feedbackForm}>
          <h2>Feedback</h2>

          {/* Student Number */}
          <div className={styles.formGroup}>
            <label>Student Number :</label>
            <input type="text" value={studentNumber || "Loading..."} readOnly />
          </div>

          {/* Room Dropdown */}
          <div className={styles.formGroup}>
            <label>Room :</label>
            <div
              className={`${styles.customDropdown} ${dropdownOpen ? styles.open : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              ref={dropdownRef}
            >
              <div className={styles.dropdownSelected}>
                {selectedRoom || "Select a room"}
                <i
                  className={`fa-solid ${
                    dropdownOpen ? "fa-angle-up" : "fa-angle-down"
                  } ${styles.dropdownArrow}`}
                ></i>
              </div>
              {dropdownOpen && (
                <ul className={styles.dropdownList}>
                  {roomOptions.map((room) => (
                    <li
                      key={room}
                      className={room === selectedRoom ? styles.selected : ""}
                      onClick={() => handleSelectRoom(room)}
                    >
                      {room}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className={styles.formGroup}>
            <label>Comments:</label>
            <input
              type="text"
              placeholder="Your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Rating */}
          <div className={styles.formGroup}>
            <label>Complacence :</label>
            <div className={styles.starRating}>
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                return (
                  <span
                    key={starValue}
                    className={`${styles.star} ${
                      starValue <= (hover || rating) ? styles.filled : ""
                    }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <i className="fa-solid fa-star"></i>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Equipment */}
          <div className={styles.formGroup}>
            <label>Broken Equipment:</label>
            <input
              type="text"
              placeholder="e.g. Air conditioner doesn't work"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            />
          </div>

          <button
            className={styles.button}
            disabled={!isFormComplete}
            onClick={handleSubmit}
          >
            Done
          </button>
        </div>
      </div>
    </main>
  );
};

export default FeedbackForm;
