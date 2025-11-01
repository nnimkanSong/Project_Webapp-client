// Home.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from "react";
import { Link } from "react-router-dom";
import "./Home.css";
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

  const [changed, setChanged] = useState({
    total: false,
    avail: false,
    inuse: false,
    reno: false,
  });

  const prevRef = useRef(stat);

  // ✅ ปรับระบบ preload ปลอดภัย ไม่เตือนอีก
  useEffect(() => {
    const href = "/CHP_4173.jpg";
    const EXISTING_ID = "preload-hero-chp-4173";

    if (document.getElementById(EXISTING_ID)) return;

    const afterWindowLoad = document.readyState === "complete";
    const link = document.createElement("link");
    link.id = EXISTING_ID;
    link.rel = afterWindowLoad ? "prefetch" : "preload";
    link.as = "image";
    link.href = href;

    document.head.appendChild(link);

    // ถ้าโหลดเสร็จแล้วแต่ภาพยังไม่ถูกใช้ → ลดชั้นเป็น prefetch
    let demoteTimer;
    const demote = () => {
      if (!document.getElementById(EXISTING_ID)) return;
      demoteTimer = window.setTimeout(() => {
        try {
          if (link.rel === "preload") link.rel = "prefetch";
        } catch {}
      }, 4000);
    };

    if (!afterWindowLoad) {
      window.addEventListener("load", demote, { once: true });
    }

    return () => {
      window.removeEventListener("load", demote);
      if (demoteTimer) clearTimeout(demoteTimer);
      link.remove();
    };
  }, []);

  // ✅ โหลดสถานะห้อง
  useEffect(() => {
    let mounted = true;
    let timerId;
    const controller = new AbortController();

    const load = async () => {
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
          breakdown: data.breakdown ?? [],
        };

        const prev = prevRef.current;
        if (
          prev.totalRooms !== next.totalRooms ||
          prev.available !== next.available ||
          prev.inUse !== next.inUse ||
          prev.renovation !== next.renovation ||
          (prev.breakdown?.length || 0) !== (next.breakdown?.length || 0)
        ) {
          setChanged({
            total: prev.totalRooms !== next.totalRooms,
            avail: prev.available !== next.available,
            inuse: prev.inUse !== next.inUse,
            reno: prev.renovation !== next.renovation,
          });
          setStat(next);
          prevRef.current = next;
          setTimeout(
            () =>
              setChanged({
                total: false,
                avail: false,
                inuse: false,
                reno: false,
              }),
            800
          );
        }

        setNowText(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (err) {
        if (err?.name !== "CanceledError" && err?.name !== "AbortError") {
          console.error("tracking error:", err);
        }
      }
    };

    load();
    const startPolling = () => {
      if (timerId) return;
      timerId = setInterval(load, 30000);
    };
    const stopPolling = () => {
      if (timerId) clearInterval(timerId);
      timerId = null;
    };
    const onVis = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };
    document.addEventListener("visibilitychange", onVis);
    onVis();

    return () => {
      mounted = false;
      stopPolling();
      controller.abort();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const statusByRoom = useMemo(() => {
    const map = {};
    (stat.breakdown || []).forEach((b) => {
      const code = String(b.room || "").trim().toUpperCase();
      map[code] = b.status;
    });
    return map;
  }, [stat.breakdown]);

  return (
    <div className="pg-home">
      <CookieNotice />
      <div className="top">
        <picture>
          <img
            src="/CHP_4173.jpg"
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

      {/* STATUS BAR */}
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

      <div className="able">
        <p>CE Rooms</p>
        <span className="able-underline" />
      </div>

      {/* ROOM CARDS */}
      <div className="end">
        <Suspense fallback={null}>
          <Sliderhome
            roomCode="E107"
            fetchPath="/api/rooms/E107/images"
            interval={2400}
            rounded
            statusByRoom={statusByRoom}
            showStatus
          />
          <Sliderhome
            roomCode="E111"
            fetchPath="/api/rooms/E111/images"
            interval={3200}
            statusByRoom={statusByRoom}
            showStatus
          />
          <Sliderhome
            roomCode="E113"
            fetchPath="/api/rooms/E113/images"
            interval={2000}
            rounded={false}
            statusByRoom={statusByRoom}
            showStatus
          />
          <Sliderhome
            roomCode="B317"
            fetchPath="/api/rooms/B317/images"
            statusByRoom={statusByRoom}
          />
        </Suspense>
      </div>

      <a href="/login" aria-hidden="true" />
    </div>
  );
};

export default Home;
