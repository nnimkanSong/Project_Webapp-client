// src/pages/Booking.jsx
import '../page/Booking.css';
import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Slider from '../components/Slider';
import { useNavigate } from 'react-router-dom';

export default function Booking() {
  const navigate = useNavigate();

  // คำนวณวันที่วันนี้เพื่อห้ามเลือกย้อนหลัง
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
  }, []);

  const [formData, setFormData] = useState({
    room: '',
    date: '',
    startTime: '',
    endTime: '',
    people: '',
    objective: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'people') {
      const v = value === '' ? '' : Math.max(1, Number(value));
      setFormData({ ...formData, [name]: v });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { room, date, startTime, endTime, people, objective } = formData;

    if (!room || !date || !startTime || !endTime || !people || !objective) {
      Swal.fire({ title: 'Failure', text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง', icon: 'error', confirmButtonText: 'OK' });
      return;
    }
    if (endTime <= startTime) {
      Swal.fire({ title: 'เวลาไม่ถูกต้อง', text: 'กรุณาเลือกเวลาสิ้นสุดให้มากกว่าเวลาเริ่ม', icon: 'warning', confirmButtonText: 'OK' });
      return;
    }

    const payload = {
      room,
      date,
      timeRange: { start: startTime, end: endTime },
      people: Number(people),
      objective,
    };
    // TODO: เรียก API ส่ง payload

    Swal.fire({
      title: 'Succeed!',
      text: 'คุณได้ทำการจองสำเร็จแล้ว โปรดรอการยืนยันจากเจ้าหน้าที่',
      icon: 'success',
      confirmButtonText: 'OK',
      showClass: { popup: 'swal2-show animate__animated animate__fadeInUp' },
      hideClass: { popup: 'swal2-hide animate__animated animate__fadeOutDown' },
    });

    setFormData({ room: '', date: '', startTime: '', endTime: '', people: '', objective: '' });
  };

  return (
    <>
      <div className="booking-page">
        <div className="content">
          {/* ซ้าย: สไลด์รูป */}
          <div className="image-section">
            <Slider />
          </div>

          {/* ขวา: ฟอร์ม */}
          <div className="form-section">
            <h2>Booking</h2>
            <form className="booking-form" onSubmit={handleSubmit}>
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

              <label className="time-row">
                Time :
                <div className="time-range">
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                  <span className="time-sep">to</span>
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
                  inputMode="numeric"
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

              <div className="Buttoning">
                <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Back</button>
                <button type="submit" className="btn-primary">Book</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
