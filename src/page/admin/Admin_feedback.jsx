import React, { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import styles from "../../css/Feedback_admin.module.css";

/* ---------------- Chart Component ---------------- */
function Chart({ data }) {
  const COLORS = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"];
  const [activeData, setActiveData] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // รวม feedback ต่อห้อง
  const grouped = data.reduce((acc, f) => {
    acc[f.room] = (acc[f.room] || 0) + 1;
    return acc;
  }, {});
  
  const chartData = Object.keys(grouped).map(room => ({
    name: room,
    value: grouped[room],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // ✅ ย้าย mouse move/leave มาไว้เฉพาะพื้นที่กราฟ
  const handleAreaMouseMove = e => {
    setCursorPos({ x: e.clientX, y: e.clientY });
  };
  const handleAreaMouseLeave = () => {
    setActiveData(null);
  };

  return (
    <div className={styles.donutWrapper}>
      {/* โซนตีกรอบเฉพาะกราฟ */}
      <div
        className={styles.chartArea}
        onMouseMove={handleAreaMouseMove}
        onMouseLeave={handleAreaMouseLeave}
      >
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveData(chartData[index])}
              onMouseLeave={() => setActiveData(null)}  // ออกจาก slice ก็เคลียร์
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  style={{
                    transition: "all 0.25s ease",
                    cursor: "pointer",
                    filter: activeData?.name === entry.name ? "brightness(1.15)" : "brightness(1)",
                    transform: activeData?.name === entry.name ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center center",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {activeData && (
        <div
          className={styles.cursorTooltip}
          style={{ top: `${cursorPos.y + 10}px`, left: `${cursorPos.x + 10}px` }}
        >
          <div className={styles.tipPercent}>
            {((activeData.value / total) * 100).toFixed(1)}%
          </div>
        </div>
      )}

      <ul className={styles.donutLegend}>
        {chartData.map((entry, index) => (
          <li key={index}>
            <span
              className={styles.legendDot}
              style={{ background: COLORS[index % COLORS.length] }}
            />
            {entry.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Modal ---------------- */
function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <h3>Feedback Detail</h3>
        <p><strong>User ID:</strong> {feedback.userId}</p>
        <p><strong>Room:</strong> {feedback.room}</p>
        <p><strong>Date:</strong> {feedback.date}</p>
        <p><strong>Rating:</strong> ⭐ {feedback.rating}</p>

        {/* ✅ Comment scrollable */}
        <p><strong>Comment:</strong></p>
        <div className={styles.scrollBox}>
          {feedback.comment || "-"}
        </div>

        {/* ✅ Equipment scrollable */}
        <p><strong>Equipment:</strong></p>
        <div className={styles.scrollBox}>
          {feedback.equipment || "-"}
        </div>

        <button onClick={onClose} className={styles.closeBtn}>Close</button>
      </div>
    </div>
  );
}

/* ---------------- Feedback Card ---------------- */
function FeedbackCard({ feedback, onInfoClick }) {
  return (
    <div
      className={styles.row}
      onClick={() => onInfoClick(feedback)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onInfoClick(feedback)}
    >
      <span className={styles.cell}>{feedback.userId}</span>
      <span className={styles.cell}>{feedback.room}</span>
      <span className={styles.cell}>{feedback.date}</span>
      <span className={`${styles.cell} ${styles.rating}`}>⭐ {feedback.rating}</span>
      <span className={`${styles.cell} ${styles.comment}`}>{feedback.comment}</span>
      <span className={`${styles.cell} ${styles.equip}`}>{feedback.equipment}</span>
      <button
        className={styles.info}
        onClick={e => {
          e.stopPropagation();
          onInfoClick(feedback);
        }}
      >
        i
      </button>
    </div>
  );
}

/* ---------------- Main Component ---------------- */
export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterRoom, setFilterRoom] = useState("all");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  useEffect(() => {
    fetch("https://kmitl-rbs.online/api/admin/feedbacks"
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(f => ({
          userId: f.studentNumber,
          room: f.room,
          date: new Date(f.createdAt).toLocaleDateString("th-TH"),
          rating: f.rating,
          comment: f.comment,
          equipment: f.equipment,
        }));
        setFeedbacks(mapped);
      })
      .catch(err => console.error("Error fetching feedbacks:", err));
  }, []);

  useEffect(() => {
  const handleClickOutside = e => {
    if (!e.target.closest(`.${styles.customDropdown}`)) {
      setDropdownOpen(false);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);


  const filteredFeedback = feedbacks.filter(f =>
    filterRoom === "all" ? true : f.room === filterRoom
  );

  const roomStats = feedbacks.reduce((acc, f) => {
    if (!acc[f.room]) acc[f.room] = { total: 0, sumRating: 0 };
    acc[f.room].total += 1;
    acc[f.room].sumRating += f.rating;
    return acc;
  }, {});

  const roomSummary = Object.keys(roomStats).map(room => ({
    room,
    total: roomStats[room].total,
    avg: (roomStats[room].sumRating / roomStats[room].total).toFixed(2),
  }));

  const totalFeedback = feedbacks.length;
  const overallAvg =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(2)
      : 0;

  return (
    <div className={styles.fbPage}>
      <div className={styles.fbShell}>
        <h2 className={styles.fbTitle}>Feedback</h2>

        <div className={styles.fbTop}>
          <div className={`${styles.fbCard} ${styles.fbDonut}`}>
            <Chart data={feedbacks} />
          </div>

          <div className={`${styles.fbCard} ${styles.fbCenter}`}>
            <h4 className={styles.boxTitle}>
              {totalFeedback} <span>Total Feedback</span>
            </h4>
            <div className={styles.roomList}>
              {roomSummary.map((r, i) => (
                <div key={i} className={styles.roomItem}>
                  <span className={styles.roomName}>{r.room}</span>
                  <span className={styles.roomCount}>{r.total}</span>
                  <span className={styles.roomLabel}>feedback</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${styles.fbCard} ${styles.fbRight}`}>
            <h4 className={styles.boxTitle}>
              {overallAvg} ⭐ <span>Average Rating</span>
            </h4>
            <div className={styles.roomList}>
              {roomSummary.map((r, i) => (
                <div key={i} className={styles.roomItem}>
                  <span className={styles.roomName}>{r.room}</span>
                  <span className={styles.star}>⭐</span>
                  <span className={styles.roomAvg}>{r.avg}</span>
                  <span className={styles.roomLabel}>rating</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.fbFilters}>
          <div className={styles.filter}>
            <small>Filter by room</small>

            {/* ✅ Custom Dropdown */}
            <div
              className={`${styles.customDropdown} ${dropdownOpen ? styles.open : ""}`}
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              <div className={styles.dropdownSelected}>
                <span>{filterRoom === "all" ? "All Rooms" : filterRoom}</span>
                <span className={styles.dropdownArrow}>▼</span>
              </div>

              {dropdownOpen && (
                <ul className={styles.dropdownList}>
                  {/* All rooms */}
                  <li
                    onClick={e => {
                      e.stopPropagation();
                      setFilterRoom("all");
                      setDropdownOpen(false); // ✅ ปิดทันที
                    }}
                    className={filterRoom === "all" ? styles.selected : ""}
                  >
                    All Rooms
                  </li>

                  {/* Rooms */}
                  {roomSummary.map(r => (
                    <li
                      key={r.room}
                      onClick={e => {
                        e.stopPropagation();
                        setFilterRoom(r.room);
                        setDropdownOpen(false); // ✅ ปิดทันที
                      }}
                      className={filterRoom === r.room ? styles.selected : ""}
                    >
                      {r.room}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className={styles.fbListWrapper}>
          <div className={styles.fbList}>
            {filteredFeedback.map((f, idx) => (
              <FeedbackCard key={idx} feedback={f} onInfoClick={setSelectedFeedback} />
            ))}
          </div>
        </div>

        <FeedbackModal feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
      </div>
    </div>
  );
}
