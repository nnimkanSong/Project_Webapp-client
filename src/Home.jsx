// Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Sliderhome from "./components/Sliderhome";
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

  // สำหรับทำ animation เมื่อค่าตัวเลขมีการเปลี่ยน
  const [changed, setChanged] = useState({
    total: false,
    avail: false,
    inuse: false,
    reno: false,
  });

  // เก็บค่าเดิมไว้เปรียบเทียบ + กัน re-render เกินจำเป็น
  const prevRef = useRef(stat);

  // ✅ Preload HERO เพื่อ LCP เร็วขึ้น (เฉพาะ CHP_4173.jpg)
  useEffect(() => {
    const HREF = "/CHP_4173.jpg";
    const ID = "preload-hero-chp-4173";
    if (document.getElementById(ID)) return;
    const link = document.createElement("link");
    link.id = ID;
    link.rel = "preload";
    link.as = "image";
    link.href = HREF;
    document.head.appendChild(link);
    return () => link.remove();
  }, []);

  // ✅ ดึงสถานะ + ทำให้เร็วขึ้น:
  // - หยุด poll เมื่อแท็บไม่โฟกัส
  // - กัน request ซ้อนด้วย AbortController + inFlight guard
  // - อัปเดต state เฉพาะเมื่อมี diff จริง ๆ
  useEffect(() => {
    let mounted = true;
    let timerId = null;
    let controller = new AbortController();
    let inFlight = false;

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      controller.abort(); // ยกเลิกตัวเก่า (ถ้ามี)
      controller = new AbortController();

      try {
        const { data } = await api.get("/api/tracking/now", {
          signal: controller.signal,
        });
        if (!mounted) return;

        const next = {
          totalRooms: data.totalRooms ?? 0,
          available: data.available ?? 0,
          inUse: data.inUse ?? 0,
          renovation: data.renovation ?? 0,
          breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
        };

        const prev = prevRef.current;
        const hasDiff =
          prev.totalRooms !== next.totalRooms ||
          prev.available !== next.available ||
          prev.inUse !== next.inUse ||
          prev.renovation !== next.renovation ||
          (prev.breakdown?.length || 0) !== (next.breakdown?.length || 0);

        if (hasDiff) {
          setChanged({
            total: prev.totalRooms !== next.totalRooms,
            avail: prev.available !== next.available,
            inuse: prev.inUse !== next.inUse,
            reno: prev.renovation !== next.renovation,
          });
          setStat(next);
          prevRef.current = next;

          // เอา animation ออกภายใน 800ms เฉพาะตอนมีการเปลี่ยนจริง
          setTimeout(() => {
            setChanged({ total: false, avail: false, inuse: false, reno: false });
          }, 800);
        }

        // อัปเดตเวลา (นาที) แบบเบา ๆ
        setNowText(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
          console.error("tracking error:", err);
        }
      } finally {
        inFlight = false;
      }
    };

    // เริ่มโหลดทันที
    load();

    const startPolling = () => {
      if (timerId) return;
      // ใช้ 30s เท่าเดิม แต่จะทำงานเฉพาะตอนแท็บ visible
      timerId = setInterval(() => {
        if (document.visibilityState === "visible" && navigator.onLine) {
          load();
        }
      }, 30000);
    };

    const stopPolling = () => {
      if (timerId) clearInterval(timerId);
      timerId = null;
    };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        startPolling();
        // ดึงทันทีเมื่อกลับมาโฟกัส
        load();
      } else {
        stopPolling();
      }
    };

    const onOnline = () => {
      // กลับมาออนไลน์ ดึงข้อมูลทันที
      load();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", stopPolling);

    // ตั้งต้นตามสถานะปัจจุบัน
    onVis();

    return () => {
      mounted = false;
      stopPolling();
      controller.abort();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", stopPolling);
    };
  }, []);

  // ✅ แปลง breakdown เป็น map: { E107:'in-use', E111:'available', ... }
  const statusByRoom = useMemo(() => {
    const map = {};
    const list = stat.breakdown || [];
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      const code = String(b?.room || "").trim().toUpperCase();
      if (code) map[code] = b?.status; // 'available' | 'in-use' | 'renovation'
    }
    return map;
  }, [stat.breakdown]);

  return (
    <div className="pg-home">
      {/* HERO */}
      <CookieNotice />
      <div className="top">
        <img
          src="./CHP_4173.jpg"
          alt="KMITL CE Building"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
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

      {/* ROOM CARDS */}
      <div className="end">
        {/* E107 */}
        <Sliderhome
          roomCode="E107"
          fetchPath="/api/rooms/E107/images" // ← ดึงจาก DB
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
          fetchPath="/api/rooms/E111/images" // ← ดึงจาก DB
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
          fetchPath="/api/rooms/E113/images" // ← ดึงจาก DB
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
      </div>

      <a href="/login" aria-hidden="true" />
    </div>
  );
};

export default Home;
