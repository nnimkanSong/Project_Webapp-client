import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import styles from '../css/FeedbackForm.module.css';

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
        setSelectedRoom('');
        setRating(0);
        setComment('');
        setEquipment('');
      });
    }
  };

  return (
  <main className={styles.main}>
    <div className={styles.feedbackBack}>
      <div className={styles.feedbackForm}>
        <h2>Feedback</h2>

        {/* Room */}
        <div className={styles.formGroup}>
          <label>Room :</label>
          <div
            className={`${styles.customDropdown} ${dropdownOpen ? styles.open : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            ref={dropdownRef}
          >
            <div className={styles.dropdownSelected}>
              {selectedRoom || 'Select a room'}
              <i className={`fa-solid ${dropdownOpen ? 'fa-angle-up' : 'fa-angle-down'} ${styles.dropdownArrow}`}></i>
            </div>
            {dropdownOpen && (
              <ul className={styles.dropdownList}>
                {roomOptions.map((room) => (
                  <li
                    key={room}
                    className={room === selectedRoom ? styles.selected : ''}
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
            placeholder="How was your experience? Let's tell us to know!"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Complacence (Rating) */}
        <div className={styles.formGroup}>
          <label>Complacence :</label>
          <div className={styles.starRating}>
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <span
                  key={starValue}
                  className={`${styles.star} ${starValue <= (hover || rating) ? styles.filled : ''}`}
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
        <div className={styles.formGroup}>
          <label>Broken Equipment:</label>
          <input
            type="text"
            placeholder="e.g. Air conditioner doesn't work or table should be fixed."
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>

        {/* Done Button */}
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
)
};

export default FeedbackForm;
