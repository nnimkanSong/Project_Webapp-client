// Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Sliderhome from "./components/Sliderhome";
import { api } from "./api";
import { Clock } from "lucide-react";

const Home = () => {
  const [stat, setStat] = useState({
    totalRooms: 0,
    available: 0,
    inUse: 0,
    renovation: 0,
    breakdown: [],
  });

  const [nowText, setNowText] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  // สำหรับทำ animation เมื่อค่าตัวเลขมีการเปลี่ยน
  const [changed, setChanged] = useState({
    total: false,
    avail: false,
    inuse: false,
    reno: false,
  });

  // เก็บค่าเดิมไว้เปรียบเทียบ
  const prevRef = useRef(stat);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get("/api/tracking/now");
        if (!mounted) return;

        const next = {
          totalRooms: data.totalRooms ?? 0,
          available: data.available ?? 0,
          inUse: data.inUse ?? 0,
          renovation: data.renovation ?? 0,
          breakdown: data.breakdown ?? [],
        };

        // เช็คการเปลี่ยนแปลงเพื่อใส่คลาสกระพริบ/เด้ง
        const prev = prevRef.current;
        setChanged({
          total: prev.totalRooms !== next.totalRooms,
          avail: prev.available !== next.available,
          inuse: prev.inUse !== next.inUse,
          reno: prev.renovation !== next.renovation,
        });

        setStat(next);
        prevRef.current = next;

        setNowText(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        // เอา animation ออกภายใน 800ms
        setTimeout(() => {
          setChanged({ total: false, avail: false, inuse: false, reno: false });
        }, 800);
      } catch (err) {
        console.error("tracking error:", err);
      }
    };

    load();
    const t = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  // ✅ แปลง breakdown เป็น map: { E107:'in-use', E111:'available', ... }
  const statusByRoom = useMemo(() => {
    const map = {};
    (stat.breakdown || []).forEach((b) => {
      const code = String(b.room || "").trim().toUpperCase();
      map[code] = b.status; // 'available' | 'in-use' | 'renovation'
    });
    return map;
  }, [stat.breakdown]);

  return (
    <div className="pg-home">
      {/* HERO */}
      <div className="top">
        <img src="./CHP_4173.jpg" alt="KMITL CE Building" />
      </div>

      {/* GLASS STATUS BAR */}
      <div className="midle">
        <div className="field field-clock">
          <div className="label">
            <Clock size={18} className="icon-clock" />
            <span>Status Now</span>
          </div>
          <div className="sub">{nowText}</div>
        </div>

        <div className="field">
          <div className="label">All</div>
          <div
            className={`stat-num sub0 ${changed.total ? "bump updated" : ""}`}
          >
            {stat.totalRooms}
          </div>
        </div>

        <div className="field">
          <div className="label">Available</div>
          <div
            className={`stat-num sub1 ${changed.avail ? "bump updated" : ""}`}
          >
            {stat.available}
          </div>
        </div>

        <div className="field">
          <div className="label">In Use</div>
          <div
            className={`stat-num sub2 ${changed.inuse ? "bump updated" : ""}`}
          >
            {stat.inUse}
          </div>
        </div>

        <div className="field">
          <div className="label">Renovation</div>
          <div
            className={`stat-num sub3 ${changed.reno ? "bump updated" : ""}`}
          >
            {stat.renovation}
          </div>
        </div>
      </div>

      {/* SECTION TITLE */}
      <div className="able">
        <p>CE Rooms</p>
        <span className="able-underline" />
      </div>

      {/* ROOM CARDS */}
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
          statusByRoom={statusByRoom}
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

      <a href="/login" aria-hidden="true" />
    </div>
  );
};

export default Home;
