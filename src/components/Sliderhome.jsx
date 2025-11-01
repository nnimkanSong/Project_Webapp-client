import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";
import { api } from "../api";

// --- helpers: normalize payload ---
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
      // รองรับ width/height ถ้ามีจาก backend (กัน CLS ดียิ่งขึ้น)
      const width = it?.width ? Number(it.width) : undefined;
      const height = it?.height ? Number(it.height) : undefined;
      return src ? { src, alt, width, height } : null;
    })
    .filter(Boolean);
}
function normalizeImagesProp(images = [], { roomCode = "" } = {}) {
  return images.map((it, i) =>
    typeof it === "string" ? { src: it, alt: `${roomCode} • ${i + 1}` } : it
  );
}

// --- main component ---
const Sliderhome = ({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  details = [],
  fetchPath,       // เช่น "/api/rooms/E113/images" -> ดึงจาก DB
  fetchQuery = {},
  roomCode,
  interval = 2500,
  rounded = true,
  statusByRoom = {},
  showStatus = true,
  /** อัตราส่วนรูปเพื่อกัน CLS ถ้า backend ไม่ส่ง width/height มา */
  aspect = "16 / 9",
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
  const wrapperRef = useRef(null);
  const visibleRef = useRef(true);

  // โหลดภาพจาก API (ถ้ามี)
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

  // ไม่มี fetchPath -> ใช้ props
  useEffect(() => {
    if (!fetchPath) {
      setItems(normalizeImagesProp(images, { roomCode: roomCode || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(images), roomCode, fetchPath]);

  const len = items.length;
  const safeIdx = (i) => ((i % len) + len) % len;

  // รายละเอียดของการ์ดปัจจุบัน
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

  // --- autoplay: หยุดเมื่อ mouse hover / touch / expanded / ไม่มองเห็น / แท็บไม่โฟกัส
  const start = () => {
    stop();
    if (len <= 1) return;
    timerRef.current = setInterval(() => {
      if (!hoveringRef.current && !touchingRef.current && !expanded && visibleRef.current && !document.hidden) {
        setIdx((p) => (p + 1) % len);
      }
    }, interval);
  };
  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => { start(); return stop; }, [interval, expanded, len]); // eslint-disable-line

  // สังเกตการณ์ viewport เพื่อหยุด/เล่น autoplay
  useEffect(() => {
    if (!wrapperRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { root: null, threshold: 0.15 }
    );
    io.observe(wrapperRef.current);
    const onVis = () => {}; // แค่ reference เพื่อถ้าจะต่อยอด
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // Preload สไลด์ถัดไปไว้ใน cache ให้สลับนิ่มขึ้น
  useEffect(() => {
    if (len <= 1) return;
    const next = items[safeIdx(idx + 1)];
    if (!next?.src) return;
    const img = new Image();
    img.decoding = "async";
    img.src = next.src;
  }, [idx, len, items]);

  const onMouseEnter = () => (hoveringRef.current = true);
  const onMouseLeave = () => (hoveringRef.current = false);
  const onTouchStart = () => (touchingRef.current = true);
  const onTouchEnd = () => (touchingRef.current = false);

  const openExpanded = () => setExpanded(true);
  const closeExpanded = () => setExpanded(false);

  if (!len && !loading) return null;

  // utility: สร้าง srcSet/sizes อย่างปลอดภัย (ถ้าไม่มี CDN ก็คืนค่าปกติ)
  const buildSrcSet = (src) => {
    // ถ้ามี query รูปแบบ ?w= ใช้แตกขนาดเอง; ถ้าไม่มี ก็ปล่อย src เดียว
    if (!src || /\?w=/.test(src)) return undefined;
    return undefined;
  };
  const sizes = "(max-width: 640px) 88vw, (max-width: 1024px) 40vw, 300px";

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
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
          <div className={styles.singleStage} style={{ aspectRatio: aspect }}>
            {loading && <div className={styles.skeleton}>กำลังโหลดรูป…</div>}
            {!loading && err && (
              <div className={styles.error} role="alert">
                โหลดรูปไม่สำเร็จ • ใช้รูปสำรอง
              </div>
            )}

            {items.map((it, i) => {
              const isActive = i === idx;
              // รูปที่แสดงอยู่: eager + fetchPriority สูงสุด (ช่วย LCP ของการ์ดแรก)
              const eagerProps = isActive
                ? { loading: "eager", fetchPriority: "high" }
                : { loading: "lazy", fetchPriority: "auto" };

              return (
                <img
                  key={`${it.src}-${i}`}
                  src={it.src}
                  alt={it.alt || `slide ${i + 1}`}
                  width={it.width}
                  height={it.height}
                  srcSet={buildSrcSet(it.src)}
                  sizes={sizes}
                  className={`${styles.singleImage} ${isActive ? styles.active : ""}`}
                  decoding="async"
                  {...eagerProps}
                />
              );
            })}

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
        <div className={styles.expandedOverlay} role="dialog" aria-modal="true" aria-label="Image detail">
          <div className={`${styles.expandedCard} ${rounded ? styles.rounded : ""}`}>
            <div className={styles.split}>
              <div className={styles.media} onClick={closeExpanded} style={{ aspectRatio: aspect }}>
                {!!len && (
                  <img
                    src={items[idx]?.src}
                    alt={items[idx]?.alt || info.title}
                    width={items[idx]?.width}
                    height={items[idx]?.height}
                    decoding="async"
                    loading="eager"
                    fetchPriority="high"
                  />
                )}
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
          <div className={styles.backdrop} onClick={closeExpanded} />
        </div>
      )}
    </div>
  );
};

export default Sliderhome;
