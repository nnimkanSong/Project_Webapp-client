import '../page/Booking.css';
import React, { useState } from 'react';
import Swal from 'sweetalert2';

function Booking() {
  const [formData, setFormData] = useState({
    room: '',
    date: '',
    time: '',
    people: '',
    objective: ''
  });

  // ====== เริ่ม: ข้อมูลและสถานะของแกลเลอรีรูป ======
  const images = [
    "/img/room1.jpg",
    "/img/room2.jpg",
    "/img/room3.jpg",
    "/img/room4.jpg",
    "/img/room5.jpg",
    "/img/room6.jpg",
  ];
  const VISIBLE = 4; // ถ้าอยากแสดง 5 รูป เปลี่ยนเป็น 5
  const [slideIndex, setSlideIndex] = useState(0);

  const next = () => {
    if (slideIndex < images.length - VISIBLE) setSlideIndex(slideIndex + 1);
  };
  const prev = () => {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  };
  // ====== จบ: ข้อมูลและสถานะของแกลเลอรีรูป ======

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.room || !formData.date || !formData.time || !formData.people || !formData.objective) {
      Swal.fire({
        title: 'failure',
        text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
        icon: 'error',
        confirmButtonText: 'OK',
      });
      return;
    }

    Swal.fire({
      title: 'Succeed!',
      text: 'คุณได้ทำการจองสำเร็จแล้ว โปรดรอการยืนยันจากเจ้าหน้าที่',
      icon: 'success',
      confirmButtonText: 'OK',
    });

    setFormData({
      room: '',
      date: '',
      time: '',
      people: '',
      objective: ''
    });
    setSlideIndex(0); // รีเซ็ตตำแหน่งแกลเลอรี
  };

  return (
    <div>
      {/* กล่อง booking */}
      <div className="booking-page">
        <div className="content">
          {/* ========= แทนที่ image-section เดิมด้วย Carousel ========= */}
          <div className="image-section">
            <div className="carousel">
              <button
                type="button"
                className="carousel-btn"
                onClick={prev}
                disabled={slideIndex === 0}
                aria-label="Previous"
              >
                ◀
              </button>

              <div className="carousel-viewport">
                <div
                  className="carousel-track"
                  style={{ transform: `translateX(-${(100 / VISIBLE) * slideIndex}%)` }}
                >
                  {images.map((src, i) => (
                    <div className="carousel-item" key={i}>
                      <img src={src} alt={`room-${i}`} />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="carousel-btn"
                onClick={next}
                disabled={slideIndex >= images.length - VISIBLE}
                aria-label="Next"
              >
                ▶
              </button>
            </div>
          </div>
          {/* =========================================================== */}

          <div className="form-section">
            <h2>Booking</h2>
            <form className="booking-form" onSubmit={handleSubmit}>
              <label>
                Room :
                <select name="room" value={formData.room} onChange={handleChange}>
                  <option value="">-- เลือกห้อง --</option>
                  <option>E107</option>
                  <option>E111</option>
                  <option>E113</option>
                  <option>B317</option>
                </select>
              </label>
              <label>
                Date :
                <input type="date" name="date" value={formData.date} onChange={handleChange} />
              </label>
              <label>
                Time :
                <input type="time" name="time" value={formData.time} onChange={handleChange} />
              </label>
              <label>
                People :
                <input type="number" name="people" value={formData.people} onChange={handleChange} />
              </label>
              <label>
                Objective :
                <input type="text" name="objective" value={formData.objective} onChange={handleChange} />
              </label>
              <button type="submit">Book</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
