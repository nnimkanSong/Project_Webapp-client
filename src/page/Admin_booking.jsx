import React, { useState } from "react";
import DatePicker from "react-datepicker";
// import "./react-datepicker/dist/react-datepicker.css"; 
import "../css/Admin_booking.css";

export default function BookingTable() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const times = [
    "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
    "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
    "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00",
  ];

  const rooms = ["B317", "E107", "E111", "E113"];

  // ตัวอย่างข้อมูลจอง แยกตามวันและห้อง
  const bookings = {
    "2025-09-04": {
      B317: ["9:00-10:00", "10:00-11:00"],
      E107: ["9:00-10:00", "15:00-16:00"],
      E111: ["12:00-13:00", "15:00-16:00"],
      E113: ["12:00-13:00"],
    },
    "2025-09-05": {
      B317: ["8:00-9:00"],
      E107: ["12:00-13:00"],
      E111: [],
      E113: ["15:00-16:00"],
    },
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const booked = bookings[formatDate(selectedDate)] || {};

  return (
    <div className="booking-container">
      <h2 className="title">DailyBooking</h2>

      {/* DatePicker */}
      <div style={{ textAlign: "center", marginBottom: "12px" }}>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <table className="booking-table">
        <thead>
          <tr>
            <th rowSpan="2">Time</th>
            <th colSpan={rooms.length}>Room</th>
          </tr>
          <tr>
            {rooms.map((room) => (
              <th key={room}>{room}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time}>
              <td className="time-cell">{time}</td>
              {rooms.map((room) => (
                <td
                  key={room + time}
                  className={booked[room]?.includes(time) ? "booked-cell" : ""}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
