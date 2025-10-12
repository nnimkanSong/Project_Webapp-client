// src/pages/Booking.jsx
import "../page/Booking.css";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Slider from "../components/Slider";
import { useNavigate } from "react-router-dom";
import { api } from "../api"; // axios instance withCredentials: true

function Booking() {
  const navigate = useNavigate();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  }, []);
  

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    roomId: "",
    date: "",
    startTime: "",
    endTime: "",
    people: "",
    objective: "",
  });

  // โหลดรายชื่อห้องจาก BE
  useEffect(() => {
    (async () => {
      try {
        setLoadingRooms(true);
        setErr("");
        const r = await api.get("/api/rooms");
        setRooms(Array.isArray(r.data?.rooms) ? r.data.rooms : []);
      } catch (e) {
        console.error("Fetch /api/rooms error:", e?.response?.status, e?.response?.data);
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "ไม่สามารถโหลดรายการห้องได้";
        setErr(msg);
        Swal.fire("Error", msg, "error");
      } finally {
        setLoadingRooms(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "people") {
      const v = value === "" ? "" : Math.max(1, Number(value));
      setFormData((s) => ({ ...s, [name]: v }));
      return;
    }
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const { roomId, date, startTime, endTime, people, objective } = formData;

    // ตรวจความครบถ้วน
    if (!roomId || !date || !startTime || !endTime || !people || !objective.trim()) {
      Swal.fire("Failure", "กรุณากรอกข้อมูลให้ครบทุกช่อง", "error");
      return;
    }
    // เวลาเริ่ม-สิ้นสุด
    if (endTime <= startTime) {
      Swal.fire("เวลาไม่ถูกต้อง", "กรุณาเลือกเวลาสิ้นสุดให้มากกว่าเวลาเริ่ม", "warning");
      return;
    }

    // ตรวจเวลาเปิด/ปิดจาก room (ถ้ามี)
    const room = rooms.find((r) => r._id === roomId);
    if (room?.openAt && room?.closeAt) {
      if (!(room.openAt <= startTime && endTime <= room.closeAt)) {
        Swal.fire(
          "นอกเวลาเปิดให้จอง",
          `เวลาจองต้องอยู่ระหว่าง ${room.openAt} - ${room.closeAt}`,
          "warning"
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      await api.post("/api/bookings", {
        roomId,
        date,
        startTime,
        endTime,
        people,
        objective: String(objective).trim(),
      });

      await Swal.fire("Succeed!", "จองสำเร็จแล้ว โปรดรอการยืนยัน", "success");

      setFormData({
        roomId: "",
        date: "",
        startTime: "",
        endTime: "",
        people: "",
        objective: "",
      });
      navigate("/history");
    } catch (err) {
      console.error("POST /api/bookings error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Booking failed";
      Swal.fire("Error", msg, "error");
    } finally {
      setSubmitting(false);
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

          {err && <div className="error">{err}</div>}
          {loadingRooms && <div className="loader">กำลังโหลดรายชื่อห้อง…</div>}

          <form className="bookg-form" onSubmit={handleSubmit}>
            <label>
              Room :
              <select
                name="roomId"
                value={formData.roomId}
                onChange={handleChange}
                disabled={loadingRooms || rooms.length === 0}
              >
                <option value="">-- เลือกห้อง --</option>
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.code} {r.capacity ? `(≤ ${r.capacity} คน)` : ""}
                  </option>
                ))}
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
                disabled={submitting}
              >
                Back
              </button>
              <button type="submit" className="bookg-btn-primary" disabled={submitting}>
                {submitting ? "Booking..." : "Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


export default Booking;