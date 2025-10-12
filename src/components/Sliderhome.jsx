import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";

/**
 * Card เดี่ยวรูปเปลี่ยนอัตโนมัติ (Auto-Fade)
 * - แสดงใบเดียวตามดีไซน์ในรูป
 * - ภาพสลับด้วยเอฟเฟกต์ fade
 * - Hover / touch จะหยุดชั่วคราว
 * - คลิกเพื่อเปิด Expanded (2:1) พร้อมรายละเอียด
 * - แสดงไฟสถานะห้อง (available / in-use / renovation / unknown)
 */
const Sliderhome = ({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  // details: [{ title, subtitle, price, description, extra, room }]
  details = [],
  interval = 2500,
  rounded = true,
  // 👇 ส่ง map สถานะจาก parent: { E107: 'available', E111: 'in-use', ... }
  statusByRoom = {},
  showStatus = true,
}) => {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef(null);
  const hoveringRef = useRef(false);
  const touchingRef = useRef(false);

  const len = images.length;
  const safeIdx = (i) => ((i % len) + len) % len;

  const info = useMemo(() => {
    const d = details[safeIdx(idx)] || {};
    return {
      title: d.title || `JA Resorts`,
      subtitle: d.subtitle || `Hatta, Jabeljais`,
      price: d.price || `AED 456`,
      description: d.description || `รายละเอียดของรูปที่ ${safeIdx(idx) + 1}`,
      extra: d.extra || null,
      room: d.room || d.price || null, // เผื่อคุณใส่ room แยกไว้
    };
  }, [idx, details, len]);

  // สถานะห้องปัจจุบันของใบที่โชว์
  const roomCode = info.room; // เช่น "E107"
  const roomStatus = (roomCode && statusByRoom?.[roomCode]) || "unknown";
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

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, expanded, len]);

  const onMouseEnter = () => (hoveringRef.current = true);
  const onMouseLeave = () => (hoveringRef.current = false);
  const onTouchStart = () => (touchingRef.current = true);
  const onTouchEnd = () => (touchingRef.current = false);

  const openExpanded = () => setExpanded(true);
  const closeExpanded = () => setExpanded(false);

  if (!len) return null;

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
      {/* การ์ดเดี่ยวตามดีไซน์ */}
      {!expanded && (
        <div
          className={`${styles.singleCard} ${rounded ? styles.rounded : ""}`}
          onClick={openExpanded}
          role="button"
          aria-label="Open image details"
        >
          {/* เวทีซ้อนรูปแบบ fade */}
          <div className={styles.singleStage}>
            {images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`slide ${i + 1} of ${len}`}
                className={`${styles.singleImage} ${
                  i === idx ? styles.active : ""
                }`}
                loading="lazy"
              />
            ))}

            {/* 🔵 ไฟสถานะห้อง (มุมซ้ายบน) */}
            {showStatus && (
              <div
                className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]}`}
                aria-label={`Room ${roomCode || ""} status: ${statusLabelMap[roomStatus]}`}
                title={
                  roomCode
                    ? `${roomCode}: ${statusLabelMap[roomStatus]}`
                    : statusLabelMap[roomStatus]
                }
              >
                <span className={styles.dot} />
                {roomCode && <span className={styles.statusText}>{roomCode}</span>}
              </div>
            )}

            {/* แถบข้อมูลทับด้านล่าง */}
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

      {/* Expanded 2:1 พร้อมข้อมูลยาว */}
      {expanded && (
        <div
          className={styles.expandedOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Image detail"
        >
          <div
            className={`${styles.expandedCard} ${
              rounded ? styles.rounded : ""
            }`}
          >
            <div className={styles.split}>
              <div className={styles.media} onClick={closeExpanded}>
                <img src={images[idx]} alt={info.title} />
                {/* ไฟสถานะซ้ำใน expanded มุมบนซ้าย */}
                {showStatus && (
                  <div
                    className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]} ${styles.statusOnMedia}`}
                    title={
                      roomCode
                        ? `${roomCode}: ${statusLabelMap[roomStatus]}`
                        : statusLabelMap[roomStatus]
                    }
                  >
                    <span className={styles.dot} />
                    {roomCode && <span className={styles.statusText}>{roomCode}</span>}
                  </div>
                )}
              </div>
              <aside className={styles.info}>
                <div className={styles.infoHeader}>
                  <h3 className={styles.infoTitle}>{info.title}</h3>
                  <button
                    className={styles.closeBtn}
                    onClick={closeExpanded}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <p className={styles.infoDesc}>{info.description}</p>
                {info.extra && (
                  <div className={styles.infoExtra}>{info.extra}</div>
                )}
                {len > 1 && (
                  <div className={styles.expandedNav}>
                    <button
                      onClick={() => setIdx((p) => safeIdx(p - 1))}
                      aria-label="Previous"
                    >
                      ‹
                    </button>
                    <span>
                      {safeIdx(idx) + 1} / {len}
                    </span>
                    <button
                      onClick={() => setIdx((p) => safeIdx(p + 1))}
                      aria-label="Next"
                    >
                      ›
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
          <div className={styles.backdrop} onClick={closeExpanded} />
        </div>
      )}
    </div>
  );
};

export default Sliderhome;
