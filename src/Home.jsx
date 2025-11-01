// Home.jsx
import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
// ลบ import เดิมของ Sliderhome แล้วใช้ lazy แทน
// import Sliderhome from "./components/Sliderhome";
const Sliderhome = lazy(() => import("./components/Sliderhome"));

import { api } from "./api";
import { Clock } from "lucide-react";
import CookieNotice from "./components/CookieNotice";

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

  // ทำ animation เมื่อค่าตัวเลขมีการเปลี่ยน
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
      {/* HERO (ทำเป็น LCP: picture + fetchPriority="high") */}
      <CookieNotice />
      <div className="top">
        <picture>
          {/* ปรับ path ให้ตรงกับไฟล์จริงของคุณ (เช่น /images/... ใน public) */}
          <source srcSet="/images/CHP_4173.avif" type="image/avif" />
          <source srcSet="/images/CHP_4173.webp" type="image/webp" />
          <img
            src="/images/CHP_4173.jpg" // ถ้าไฟล์อยู่ข้าง ๆ ให้ใช้ "./CHP_4173.jpg"
            alt="KMITL CE Building"
            width="1920"
            height="1080"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="hero-img"
          />
        </picture>
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
          <div className={`stat-num sub0 ${changed.total ? "bump updated" : ""}`}>
            {stat.totalRooms}
          </div>
        </div>

        <div className="field">
          <div className="label">Available</div>
          <div className={`stat-num sub1 ${changed.avail ? "bump updated" : ""}`}>
            {stat.available}
          </div>
        </div>

        <div className="field">
          <div className="label">In Use</div>
          <div className={`stat-num sub2 ${changed.inuse ? "bump updated" : ""}`}>
            {stat.inUse}
          </div>
        </div>

        <div className="field">
          <div className="label">Renovation</div>
          <div className={`stat-num sub3 ${changed.reno ? "bump updated" : ""}`}>
            {stat.renovation}
          </div>
        </div>
      </div>

      {/* SECTION TITLE */}
      <div className="able">
        <p>CE Rooms</p>
        <span className="able-underline" />
      </div>

      {/* ROOM CARDS (lazy load เพื่อลด render-blocking) */}
      <div className="end">
        <Suspense fallback={null}>
          {/* E107 */}
          <Sliderhome
            roomCode="E107"
            fetchPath="/api/rooms/E107/images"
            details={[
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
              // (รายการซ้ำของคุณคงเดิม)
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Laboratory",
                subtitle: "Computer Engineering",
                price: "E107",
                room: "E107",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ทำแลป</li>
                    </ul>
                  </ul>
                ),
              },
            ]}
            interval={2400}
            rounded
            statusByRoom={statusByRoom}
            showStatus
          />

          {/* E111 */}
          <Sliderhome
            roomCode="E111"
            fetchPath="/api/rooms/E111/images"
            details={[
              {
                title: "Meeting",
                subtitle: "Computer Engineering",
                price: "E111",
                room: "E111",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 40 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>white board</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              // ... (คงเดิมรายการซ้ำ)
              {
                title: "Meeting",
                subtitle: "Computer Engineering",
                price: "E111",
                room: "E111",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 40 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>white board</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Meeting",
                subtitle: "Computer Engineering",
                price: "E111",
                room: "E111",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 40 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>white board</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Meeting",
                subtitle: "Computer Engineering",
                price: "E111",
                room: "E111",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 40 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>โปรเจคเตอร์</li>
                      <li>แอร์</li>
                      <li>white board</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
            ]}
            interval={3200}
            statusByRoom={statusByRoom}
            showStatus
          />

          {/* E113 */}
          <Sliderhome
            roomCode="E113"
            fetchPath="/api/rooms/E113/images"
            details={[
              {
                title: "Computer Club",
                subtitle: "Computer Engineering",
                price: "E113",
                room: "E113",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>TV</li>
                      <li>แอร์</li>
                      <li>3D Printer</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              // ... (คงเดิมรายการซ้ำ)
              {
                title: "Computer Club",
                subtitle: "Computer Engineering",
                price: "E113",
                room: "E113",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>TV</li>
                      <li>แอร์</li>
                      <li>3D Printer</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Computer Club",
                subtitle: "Computer Engineering",
                price: "E113",
                room: "E113",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>TV</li>
                      <li>แอร์</li>
                      <li>3D Printer</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Computer Club",
                subtitle: "Computer Engineering",
                price: "E113",
                room: "E113",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>TV</li>
                      <li>แอร์</li>
                      <li>3D Printer</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Computer Club",
                subtitle: "Computer Engineering",
                price: "E113",
                room: "E113",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 30 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>TV</li>
                      <li>แอร์</li>
                      <li>3D Printer</li>
                      <li>working space</li>
                    </ul>
                  </ul>
                ),
              },
            ]}
            interval={2000}
            rounded={false}
            statusByRoom={statusByRoom}
            showStatus
          />

          {/* B317 */}
          <Sliderhome
            roomCode="B317"
            fetchPath="/api/rooms/B317/images"
            statusByRoom={statusByRoom}
            details={[
              {
                title: "Server",
                subtitle: "Computer Engineering",
                price: "B317",
                room: "B317",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 50 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>ตู้ Server</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ Network</li>
                    </ul>
                  </ul>
                ),
              },
              // ... (คงเดิมรายการซ้ำ)
              {
                title: "Server",
                subtitle: "Computer Engineering",
                price: "B317",
                room: "B317",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 50 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>ตู้ Server</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ Network</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Server",
                subtitle: "Computer Engineering",
                price: "B317",
                room: "B317",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 50 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>ตู้ Server</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ Network</li>
                    </ul>
                  </ul>
                ),
              },
              {
                title: "Server",
                subtitle: "Computer Engineering",
                price: "B317",
                room: "B317",
                extra: (
                  <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                    <li>ความจุ: 50 คน</li>
                    <li>อุปกรณ์</li>
                    <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                      <li>ตู้ Server</li>
                      <li>แอร์</li>
                      <li>อุปกรณ์ Network</li>
                    </ul>
                  </ul>
                ),
              },
            ]}
          />
        </Suspense>
      </div>

      <a href="/login" aria-hidden="true" />
    </div>
  );
};

export default Home;
