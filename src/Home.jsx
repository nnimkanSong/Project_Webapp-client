// Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Sliderhome from "./components/Sliderhome";
import { api } from "./api";

const Home = () => {
  const [stat, setStat] = useState({
    totalRooms: 0,
    available: 0,
    inUse: 0,
    renovation: 0,
    breakdown: [],        // ✅ เก็บ breakdown มาด้วย
  });

  const [nowText, setNowText] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data } = await api.get("/api/tracking/now");
        if (mounted) {
          setStat({
            totalRooms: data.totalRooms ?? 0,
            available: data.available ?? 0,
            inUse: data.inUse ?? 0,
            renovation: data.renovation ?? 0,
            breakdown: data.breakdown ?? [],   // ✅ เก็บมาด้วย
          });
          setNowText(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("tracking error:", err);
      }
    };

    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  // ✅ แปลง breakdown เป็น map: { E107:'in-use', E111:'available', ... }
  const statusByRoom = useMemo(() => {
    const map = {};
    (stat.breakdown || []).forEach(b => {
      const code = String(b.room || "").trim().toUpperCase();
      map[code] = b.status; // 'available' | 'in-use' | 'renovation'
    });
    return map;
  }, [stat.breakdown]);

  return (
    <div className="pg-home">
      <div className="top">
        <img src="./CHP_4173.jpg" alt="" />
      </div>

      <div className="midle">
        <div className="field">
          <div className="label">Status Now</div>
          <div className="sub">{nowText}</div>
        </div>

        <div className="field">
          <div className="label">All</div>
          <div className="sub0">{stat.totalRooms}</div>
        </div>

        <div className="field">
          <div className="label">Available</div>
          <div className="sub1">{stat.available}</div>
        </div>

        <div className="field">
          <div className="label">In Use</div>
          <div className="sub2">{stat.inUse}</div>
        </div>

        <div className="field">
          <div className="label">Renovation</div>
          <div className="sub3">{stat.renovation}</div>
        </div>
      </div>

      <div className="able">
        <p>CE Rooms</p>
      </div>

      <div className="end">
        {/* E107 */}
        <Sliderhome
          images={["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"]}
          details={[
            { title: "Laboratory", subtitle: "Computer Engineering", price: "E107", room: "E107" },
            { title: "Laboratory", subtitle: "Computer Engineering", price: "E107", room: "E107" },
            { title: "Laboratory", subtitle: "Computer Engineering", price: "E107", room: "E107" },
            { title: "Laboratory", subtitle: "Computer Engineering", price: "E107", room: "E107" },
          ]}
          interval={2400}
          rounded
          statusByRoom={statusByRoom}   // ✅ ส่งสถานะเข้าไป
          showStatus
        />

        {/* E111 */}
        <Sliderhome
          images={["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"]}
          details={[
            { title: "Meeting", subtitle: "Computer Engineering", price: "E111", room: "E111" },
            { title: "Meeting", subtitle: "Computer Engineering", price: "E111", room: "E111" },
            { title: "Meeting", subtitle: "Computer Engineering", price: "E111", room: "E111" },
            { title: "Meeting", subtitle: "Computer Engineering", price: "E111", room: "E111" },
          ]}
          interval={3200}
          statusByRoom={statusByRoom}
          showStatus
        />

        {/* E113 */}
        <Sliderhome
          images={["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"]}
          details={[
            { title: "Computer Club", subtitle: "Computer Engineering", price: "E113", room: "E113" },
            { title: "Computer Club", subtitle: "Computer Engineering", price: "E113", room: "E113" },
            { title: "Computer Club", subtitle: "Computer Engineering", price: "E113", room: "E113" },
            { title: "Computer Club", subtitle: "Computer Engineering", price: "E113", room: "E113" },
          ]}
          interval={2000}
          rounded={false}
          statusByRoom={statusByRoom}
          showStatus
        />

        {/* B317 */}
        <Sliderhome
          images={["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"]}
          details={[
            { title: "Server", subtitle: "Computer Engineering", price: "B317", room: "B317" },
            { title: "Server", subtitle: "Computer Engineering", price: "B317", room: "B317" },
            { title: "Server", subtitle: "Computer Engineering", price: "B317", room: "B317" },
            { title: "Server", subtitle: "Computer Engineering", price: "B317", room: "B317" },
          ]}
          interval={2000}
          rounded={false}
          statusByRoom={statusByRoom}
          showStatus
        />
      </div>

      <a href="/login"></a>
    </div>
  );
};

export default Home;
