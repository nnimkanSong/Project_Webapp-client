import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";
import { api } from "../api";

/* ---------- Helpers: normalize payload ---------- */
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

/* ---------- Responsive variants ----------
   พยายามสร้าง URL หลายขนาด/ฟอร์แมตจาก src เดิม
   ถ้า backend ไม่รองรับ query พวก ?w=…&fmt=… ก็จะ fallback เป็นรูปเดิม
------------------------------------------------ */
function buildVariants(src) {
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://x");
    // ถ้าเป็นไฟล์ static ใน public เช่น /images/xxx.jpg ก็ใช้ base ตรง ๆ
    const base = u.pathname + (u.search ? u.search : "");
    const make = (w, fmt) => {
      // heuristic: ถ้าเป็น http(s) ที่ไม่รองรับ query แปลงไม่ได้ → ใช้ไฟล์เดิม
      if (u.origin && !/^\/|^https?:\/\//i.test(base)) return { url: src, w };
      const hasQuery = base.includes("?");
      const join = hasQuery ? "&" : "?";
      return { url: `${base}${join}w=${w}&fmt=${fmt}`, w };
    };
    return {
      // ลอง AVIF/WebP ก่อน ถ้าเสิร์ฟไม่ได้ เบราว์เซอร์จะไป fallback เอง
      avif: [640, 960, 1280].map((w) => make(w, "avif")),
      webp: [640, 960, 1280].map((w) => make(w, "webp")),
      jpg:  [640, 960, 1280].map((w) => make(w, "jpg")),
      fallback: src,
    };
  } catch {
    return {
      avif: [], webp: [], jpg: [], fallback: src
    };
  }
}

/* ---------- Single responsive image (card & expanded) ---------- */
function PictureImage({
  src,
  alt = "",
  width = 420,
  height = 280,
  loading = "lazy",
  decoding = "async",
  fetchPriority,         // "high" เฉพาะรูปที่เห็นจริง ๆ
  className,
  style,
}) {
  const v = useMemo(() => buildVariants(src), [src]);
  const srcSet = (arr) => arr.map(({ url, w }) => `${url} ${w}w`).join(", ");

  return (
    <picture>
      {!!v.avif.length && <source type="image/avif" srcSet={srcSet(v.avif)} sizes="(max-width:640px) 90vw, (max-width:1024px) 50vw, 420px" />}
      {!!v.webp.length && <source type="image/webp" srcSet={srcSet(v.webp)} sizes="(max-width:640px) 90vw, (max-width:1024px) 50vw, 420px" />}
      {/* fallback เป็น jpg/ไฟล์เดิม */}
      <img
        src={v.jpg[0]?.url || v.fallback}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        className={className}
        style={{ aspectRatio: `${width} / ${height}`, objectFit: "cover", display: "block", ...style }}
      />
    </picture>
  );
}

/* ============================================================= */

const Sliderhome = ({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  details = [],
  fetchPath,
  fetchQuery = {},
  roomCode,
  interval = 2500,
  rounded = true,
  statusByRoom = {},
  showStatus = true,
}) => {
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(normalizeImagesProp(images, { roomCode: roomCode || "" }));
  const [loading, setLoading] = useState(!!fetchPath);
  const [err, setErr] = useState("");

  const timerRef = useRef(null);
  const hoveringRef = useRef(false);
  const touchingRef = useRef(false);

  /* ---- IntersectionObserver: เริ่มสไลด์เมื่อมองเห็นเท่านั้น ---- */
  const wrapperRef = useRef(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin: "0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ---- โหลดจาก API ---- */
  useEffect(() => {
    let mounted = true;
    if (!fetchPath) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(fetchPath, { params: fetchQuery });
        const list = normalizeFromApi(res?.data, { roomCode: roomCode || "" });
        if (mounted) setItems(list.length ? list : normalizeImagesProp(images, { roomCode: roomCode || "" }));
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

  /* ---- ถ้าไม่มี fetchPath ใช้จาก props ---- */
  useEffect(() => {
    if (!fetchPath) setItems(normalizeImagesProp(images, { roomCode: roomCode || "" }));
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

  /* ---- ออโต้สไลด์: เฉพาะตอนเห็นจริง + ไม่โฮเวอร์/ทัช/ไม่ expanded ---- */
  const start = () => {
    stop();
    if (len <= 1 || !inView) return;
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
  useEffect(() => { start(); return stop; }, [interval, expanded, len, inView]); // eslint-disable-line

  const onMouseEnter = () => (hoveringRef.current = true);
  const onMouseLeave = () => (hoveringRef.current = false);
  const onTouchStart = () => (touchingRef.current = true);
  const onTouchEnd = () => (touchingRef.current = false);

  const openExpanded = () => setExpanded(true);
  const closeExpanded = () => setExpanded(false);

  if (!len && !loading) return null;

  /* ---- เรนเดอร์เฉพาะ: idx ปัจจุบัน + ข้างเคียง (ลดงาน DOM) ---- */
  const visibleSet = new Set([safeIdx(idx), safeIdx(idx - 1), safeIdx(idx + 1)]);

  return (
    <div
      ref={wrapperRef}
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
              <div className={styles.error} role="alert">โหลดรูปไม่สำเร็จ • ใช้รูปสำรอง</div>
            )}

            {items.map((it, i) => {
              if (!visibleSet.has(i)) return null; // render only current +/-1
              return (
                <PictureImage
                  key={`${it.src}-${i}`}
                  src={it.src}
                  alt={it.alt || `slide ${i + 1}`}
                  className={`${styles.singleImage} ${i === idx ? styles.active : ""}`}
                  loading="lazy"
                  decoding="async"
                  // ให้รูปปัจจุบันมี priority มากขึ้น (ช่วย first visible slide)
                  fetchPriority={i === idx ? "high" : undefined}
                  width={420}
                  height={280}
                />
              );
            })}

            {showStatus && (
              <div
                className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]}`}
                aria-label={`Room ${currentRoomCode || ""} status: ${statusLabelMap[roomStatus]}`}
                title={currentRoomCode ? `${currentRoomCode}: ${statusLabelMap[roomStatus]}` : statusLabelMap[roomStatus]}
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
              <div className={styles.media} onClick={closeExpanded}>
                {!!len && (
                  <PictureImage
                    src={items[idx]?.src}
                    alt={items[idx]?.alt || info.title}
                    // รูปใหญ่ขึ้น: กำหนดขนาดกัน CLS สำหรับ layout ด้านซ้าย
                    width={960}
                    height={640}
                    loading="eager"
                    fetchPriority="high"
                  />
                )}
                {showStatus && (
                  <div
                    className={`${styles.statusBadge} ${styles[`st_${roomStatus}`]} ${styles.statusOnMedia}`}
                    title={currentRoomCode ? `${currentRoomCode}: ${statusLabelMap[roomStatus]}` : statusLabelMap[roomStatus]}
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
