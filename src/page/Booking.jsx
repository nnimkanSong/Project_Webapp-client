// src/pages/Booking.jsx
import "../page/Booking.css";
import React, { useMemo, useState } from "react";
import Swal from "sweetalert2";
import Slider from "../components/Slider";
import { useNavigate } from "react-router-dom";
import { api } from "../api"; // ✅ ใช้ axios instance

export default function Booking() {
  const navigate = useNavigate();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, []);

  const [formData, setFormData] = useState({
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    people: "",
    objective: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "people") {
      const v = value === "" ? "" : Math.max(1, Number(value));
      setFormData({ ...formData, [name]: v });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { room, date, startTime, endTime, people, objective } = formData;

    // ✅ Validation ฝั่ง client
    if (!room || !date || !startTime || !endTime || !people || !objective) {
      Swal.fire("Failure", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }
    if (endTime <= startTime) {
      Swal.fire("เวลาไม่ถูกต้อง", "กรุณาเลือกเวลาสิ้นสุดให้มากกว่าเวลาเริ่ม", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Unauthorized", "กรุณาเข้าสู่ระบบก่อนทำการจอง", "error");
        navigate("/login");
        return;
      }

      // ✅ ยิงไปที่ backend พร้อมแนบ token
      const res = await api.post(
        "/api/booking",
        { room, date, startTime, endTime, people, objective },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Succeed!", "คุณได้ทำการจองสำเร็จแล้ว โปรดรอการยืนยัน", "success");

      setFormData({
        room: "",
        date: "",
        startTime: "",
        endTime: "",
        people: "",
        objective: "",
      });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Booking failed", "error");
    }
  };

  return (
    <div className="bookg-page">
      <div className="bookg-content">
        <div className="bookg-image">
          <Slider />
        </div>
        <div className="bookg-form-card">
          <h2>Booking</h2>
          <form className="bookg-form" onSubmit={handleSubmit}>
            <label>
              Room :
              <select name="room" value={formData.room} onChange={handleChange}>
                <option value="">-- เลือกห้อง --</option>
                <option value="E107">E107</option>
                <option value="E111">E111</option>
                <option value="E113">E113</option>
                <option value="B317">B317</option>
              </select>
            </label>

            <label>
              Date :
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={today}
              />
            </label>

            <label className="bookg-time-row">
              Time :
              <div className="bookg-time-range">
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                />
                <span className="bookg-time-sep">to</span>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label>
              People :
              <input
                type="number"
                name="people"
                value={formData.people}
                onChange={handleChange}
                min={1}
                placeholder="เช่น 10"
              />
            </label>

            <label>
              Objective :
              <input
                type="text"
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                placeholder="เช่น สอบ ควิซ ประชุม"
              />
            </label>

            <div className="bookg-buttons">
              <button
                type="button"
                className="bookg-btn-ghost"
                onClick={() => navigate(-1)}
              >
                Back
              </button>
              <button type="submit" className="bookg-btn-primary">
                Book
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
