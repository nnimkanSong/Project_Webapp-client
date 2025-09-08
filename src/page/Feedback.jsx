import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../css/FeedbackForm.css';

const roomOptions = ['B317', 'E107', 'E111', 'E113'];

const FeedbackForm = () => {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [equipment, setEquipment] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setDropdownOpen(false);
  };

  const isFormComplete =
    selectedRoom &&
    rating > 0 &&
    comment.trim() !== '' &&
    equipment.trim() !== '';

  const handleSubmit = () => {
    if (isFormComplete) {
      Swal.fire({
        title: 'คุณได้ทำการส่งคำร้องสำเร็จแล้ว',
        text: 'ขอบคุณที่ใช้บริการครับ',
        icon: 'success',
        confirmButtonText: 'Done'
      }).then(() => {
        // เคลียร์ฟอร์มหรือทำอย่างอื่นหลังจากกดตกลง
        setSelectedRoom('');
        setRating(0);
        setComment('');
        setEquipment('');
      });
    }
  };

  return (
    <div className="feedback-back">
      <div className="feedback-form">
        <h2>Feedback</h2>

        {/* Room */}
        <div className="form-group horizontal">
          <label>Room :</label>
          <div
            className={`custom-dropdown ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            <div className="dropdown-selected">
              {selectedRoom || 'Select a room'}
              <i className={`fa-solid ${dropdownOpen ? 'fa-angle-up' : 'fa-angle-down'} dropdown-arrow`}></i>
            </div>
            {dropdownOpen && (
              <ul className="dropdown-list">
                {roomOptions.map((room) => (
                  <li
                    key={room}
                    className={room === selectedRoom ? 'selected' : ''}
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
        <div className="form-group horizontal">
          <label>Comments:</label>
          <input
            type="text"
            placeholder="How was your experience? Let's tell us to know!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Complacence (Rating) */}
        <div className="form-group horizontal">
          <label>Complacence :</label>
          <div className="star-rating">
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <span
                  key={starValue}
                  className={`star ${starValue <= (hover || rating) ? 'filled' : ''}`}
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

        {/* Broken Equipment */}
        <div className="form-group horizontal">
          <label>Broken Equipment:</label>
          <input
            type="text"
            placeholder="e.g. Air conditioner doesn't work or table should be fixed."
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>

        {/* Done Button */}
        <button disabled={!isFormComplete} onClick={handleSubmit}>
          Done
        </button>
      </div>
    </div>
  );
};

export default FeedbackForm;