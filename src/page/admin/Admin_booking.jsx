// src/pages/admin/AdminBooking.jsx
import React from "react";
import AdminCalendar from "../../components/AdminCalendar"; // <- path ถ้าคุณวางข้างกัน
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../css/admin-calendar.css";

export default function AdminBooking() {
  return (
    <div className="ab-page">
      <div className="ab-card">
        <div className="ab-card__head">
          <div className="ab-card__title">
            <span className="ab-card__subtitle">ADMIN</span>
            <h2>Room Booking Calendar</h2>
          </div>
          <div className="ab-card__actions">
            <a className="ab-btn" href="/admin">← Back</a>
          </div>
        </div>

        <div className="ab-card__body">
          <AdminCalendar />
        </div>
      </div>
    </div>
  );
}
