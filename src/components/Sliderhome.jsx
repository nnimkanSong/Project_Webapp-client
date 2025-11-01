import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";
import { api } from "../api";

// แปลง payload จาก API -> [{src, alt}]
function normalizeFromApi(data, { roomCode = "" } = {}) {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
    ? data.data
    : [];

  return raw
    .map((it, i) => {
      if (typeof it === "string") return { src: it, alt: `${roomCode} • ${i + 1}` };
      const src = it?.url || it?.src || it?.imageUrl || it?.path || "";
      const alt = it?.alt || it?.caption || it?.label || `${roomCode} • ${i + 1}`;
      return src ? { src, alt } : null;
    })
    .filter(Boolean);
}

function normalizeImagesProp(images = [], { roomCode = "" } = {}) {
  return images.map((it, i) =>
    typeof it === "string" ? { src: it, alt: `${roomCode} • ${i + 1}` } : it
  );
}

const Sliderhome = ({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  details = [],
  fetchPath,        // เช่น "/api/rooms/E113/images" -> ดึงจาก DB
  fetchQuery = {},
  roomCode,
  interval = 2500,
  rounded = true,
  statusByRoom = {},
  showStatus = true,
}) => {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(
    normalizeImagesProp(images, { roomCode: roomCode || "" })
  );
  const [loading, setLoading] = useState(!!fetchPath);
  const [err, setErr] = useState("");

  const timerRef = useRef(null);
  const hoveringRef = useRef(false);
  const touchingRef = useRef(false);

  // ✅ โหลด “จาก Database ผ่าน API” เท่านั้น
  useEffect(() => {
    let mounted = true;
    if (!fetchPath) return;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(fetchPath, { params: fetchQuery });
        const list = normalizeFromApi(res?.data, { roomCode: roomCode || "" });
        if (mounted) {
          setItems(list.length ? list : normalizeImagesProp(images, { roomCode: roomCode || "" }));
        }
      } catch (e) {
        if (mounted) {
          setErr(e?.response?.data?.message || e?.message || "Load images failed");
          setItems(normalizeImagesProp(images, { roomCode: roomCode || "" }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPath, JSON.stringify(fetchQuery), roomCode]);

  // ถ้าไม่มี fetchPath ก็ใช้ props images ตามเดิม
  useEffect(() => {
    if (!fetchPath) {
      setItems(normalizeImagesProp(images, { roomCode: roomCode || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(images), roomCode, fetchPath]);

  const len = items.length;
  const safeIdx = (i) => ((i % len) + len) % len;

  const info = useMemo(() => {
    const d = details[safeIdx(idx)] || {};
    return {
      title: d.title || ``,
      subtitle: d.subtitle || ``,
      price: d.price || ``,
      description: d.description || `รายละเอียดของรูปที่ ${safeIdx(idx) + 1}`,
      extra: d.extra || null,
      room: d.room || roomCode || null,
    };
  }, [idx, details, len, roomCode]);

  const currentRoomCode = info.room || null;
  const roomStatus = (currentRoomCode && statusByRoom?.[currentRoomCode]) || "unknown";
  const statusLabelMap = {
    available: "Available",
    "in-use": "In Use",
    renovation: "Renovation",
    unknown: "Unknown",
  };

  const start = () => {
    stop();
    if (len <= 1) return;
    timerRef.current = setInterval(() => {
      if (!hoveringRef.current && !touchingRef.current && !expanded) {
        setIdx((p) => (p + 1) % len);
      }
    }, interval);
  };
  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => { start(); return stop; }, [interval, expanded, len]); // eslint-disable-line

  const onMouseEnter = () => (hoveringRef.current = true);
  const onMouseLeave = () => (hoveringRef.current = false);
  const onTouchStart = () => (touchingRef.current = true);
  const onTouchEnd = () => (touchingRef.current = false);

  const openExpanded = () => setExpanded(true);
  const closeExpanded = () => setExpanded(false);

  if (!len && !loading) return null;

  return (
    <div
      className={styles.wrapper}
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Single-card auto switching"
    >
      {!expanded && (
        <div
          className={`${styles.singleCard} ${rounded ? styles.rounded : ""}`}
          onClick={openExpanded}
          role="button"
          aria-label="Open image details"
        >
          <div className={styles.singleStage}>
            {loading && <div className={styles.skeleton}>กำลังโหลดรูป…</div>}
            {!loading && err && (
              <div className={styles.error} role="alert">
                โหลดรูปไม่สำเร็จ • ใช้รูปสำรอง
              </div>
            )}

            {items.map((it, i) => (
              <img
                key={`${it.src}-${i}`}
                src={it.src}
                alt={it.alt || `slide ${i + 1}`}
                className={`${styles.singleImage} ${i === idx ? styles.active : ""}`}
                loading="lazy"
                decoding="async"
              />
            ))}

            {showStatus && (
              <div
                className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]}`}
                aria-label={`Room ${currentRoomCode || ""} status: ${statusLabelMap[roomStatus]}`}
                title={
                  currentRoomCode
                    ? `${currentRoomCode}: ${statusLabelMap[roomStatus]}`
                    : statusLabelMap[roomStatus]
                }
              >
                <span className={styles.dot} />
                {currentRoomCode && <span className={styles.statusText}>{currentRoomCode}</span>}
              </div>
            )}

            <div className={styles.overlayCard}>
              <div className={styles.overlayTop}>
                <span className={styles.overlayTitle}>{info.title}</span>
                <span className={styles.overlayPrice}>{info.price}</span>
              </div>
              <div className={styles.overlaySub}>{info.subtitle}</div>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div
          className={styles.expandedOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Image detail"
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === "Escape") closeExpanded(); }}
        >
          <div
            className={`${styles.expandedCard} ${rounded ? styles.rounded : ""}`}
            role="document"
            onClick={(e) => e.stopPropagation()}      // กันคลิกภายใน card ไหลไป backdrop
          >
            <div className={styles.split}>
              <div
                className={styles.media}
                onClick={(e) => e.stopPropagation()}   // กันคลิกบนรูปไหลไปปิด
                onDoubleClick={(e) => e.preventDefault()} // กัน double-tap ยิง click ซ้ำบนมือถือ
              >
                {!!len && <img src={items[idx]?.src} alt={items[idx]?.alt || info.title} />}
                {showStatus && (
                  <div
                    className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]} ${styles.statusOnMedia}`}
                    title={
                      currentRoomCode
                        ? `${currentRoomCode}: ${statusLabelMap[roomStatus]}`
                        : statusLabelMap[roomStatus]
                    }
                  >
                    <span className={styles.dot} />
                    {currentRoomCode && <span className={styles.statusText}>{currentRoomCode}</span>}
                  </div>
                )}
              </div>

              <aside className={styles.info}>
                <div className={styles.infoHeader}>
                  <h3 className={styles.infoTitle}>{info.title}</h3>
                  <button className={styles.closeBtn} onClick={closeExpanded} aria-label="Close">✕</button>
                </div>
                <p className={styles.infoDesc}>{info.description}</p>
                {info.extra && <div className={styles.infoExtra}>{info.extra}</div>}
                {len > 1 && (
                  <div className={styles.expandedNav}>
                    <button onClick={() => setIdx((p) => safeIdx(p - 1))} aria-label="Previous">‹</button>
                    <span>{safeIdx(idx) + 1} / {len}</span>
                    <button onClick={() => setIdx((p) => safeIdx(p + 1))} aria-label="Next">›</button>
                  </div>
                )}
              </aside>
            </div>
          </div>

          {/* คลิก “ฉากหลังจริง ๆ” เท่านั้นถึงจะปิด */}
          <div
            className={styles.backdrop}
            onClick={(e) => { if (e.currentTarget === e.target) closeExpanded(); }}
          />
        </div>
      )}
    </div>
  );
};

export default Sliderhome;
