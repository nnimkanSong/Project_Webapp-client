import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// ---------------- Chart Component ----------------
function Chart({ data }) {
  const COLORS = ["#ff9999", "#99ccff", "#99ff99", "#ffcc99"];

  const grouped = data.reduce((acc, f) => {
    acc[f.room] = (acc[f.room] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(grouped).map(room => ({
    name: room,
    value: grouped[room],
  }));

  return (
    <ResponsiveContainer width={150} height={150}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

// ---------------- FeedbackCard Component ----------------
function FeedbackCard({ feedback }) {
  return (
    <div className="feedback-card">
      <span>{feedback.userId}</span>
      <span>{feedback.room}</span>
      <span>{feedback.date}</span>
      <span>⭐ {feedback.rating}</span>
      <span>{feedback.comment}</span>
      <span>{feedback.equipment}</span>
    </div>
  );
}

// ---------------- Main Feedback Page ----------------
export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterEquipment, setFilterEquipment] = useState("all");

  useEffect(() => {
    // mock API หรือเปลี่ยนเป็น endpoint จริง
    fetch("/api/feedback")
      .then(res => res.json())
      .then(data => setFeedbacks(data));
  }, []);

  const filteredFeedback = feedbacks.filter(f => {
    return (
      (filterRoom === "all" || f.room === filterRoom) &&
      (filterEquipment === "all" || f.equipment === filterEquipment)
    );
  });

  const avgRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
        ).toFixed(2)
      : 0;

  return (
    <div className="feedback-container">
      <h2>Feedback</h2>

      <div className="feedback-stats">
        <Chart data={feedbacks} />
        <div className="stat-box">⭐ {avgRating}</div>
        <div className="stat-box">{feedbacks.length} Total Feedback</div>
      </div>

      <div className="filters">
        <label>
          Filter by room:
          <select onChange={e => setFilterRoom(e.target.value)}>
            <option value="all">All</option>
            <option value="E113">E113</option>
            <option value="E111">E111</option>
            <option value="E107">E107</option>
            <option value="E317">E317</option>
          </select>
        </label>

        <label>
          Filter by Equipment:
          <select onChange={e => setFilterEquipment(e.target.value)}>
            <option value="all">All</option>
            <option value="แอร์">แอร์</option>
            <option value="ขยะ">ขยะ</option>
            <option value="โต๊ะ">โต๊ะ</option>
            <option value="ไม้ตี">ไม้ตี</option>
          </select>
        </label>
      </div>

      <div className="feedback-list">
        {filteredFeedback.map((f, idx) => (
          <FeedbackCard key={idx} feedback={f} />
        ))}
      </div>
    </div>
  );
}
