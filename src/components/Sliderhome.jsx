import React, { useEffect, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";

const Sliderhome = ({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  details = [], // [{title, description, extra}, ...] ยาวเท่ากับ images (ถ้าไม่มีจะโชว์ค่า default)
  autoPlay = true,
  interval = 1000,
  rounded = true,
}) => {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  const go = (i) => setIndex((prev) => (i + images.length) % images.length);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  const stopAuto = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  const startAuto = () => {
    stopAuto();
    timerRef.current = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      interval
    );
  };

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!autoPlay || images.length <= 1 || prefersReducedMotion || expanded) return;
    startAuto();
    return stopAuto;
  }, [autoPlay, interval, images.length, prefersReducedMotion, expanded]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight" && !expanded) next();
    if (e.key === "ArrowLeft" && !expanded) prev();
    if (e.key === "Escape" && expanded) setExpanded(false);
  };

  // touch swipe
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX.current == null || expanded) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    touchStartX.current = null;
  };

  if (!images.length) return null;

  const info = details[index] || {};
  const title = info.title || `รูปที่ ${index + 1}`;
  const description = info.description || `รายละเอียดของรูปที่ ${index + 1}`;
  const extra = info.extra || null;

  const openExpanded = (i) => {
    setIndex(i);
    setExpanded(true);
    stopAuto();
  };

  const closeExpanded = () => {
  setExpanded(false);
  setIndex(0);
  if (autoPlay && !prefersReducedMotion && images.length > 1) startAuto();
};


  return (
    <div
      className={styles.wrapper}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={stopAuto}
      onMouseLeave={() => {
        if (autoPlay && !prefersReducedMotion && images.length > 1 && !expanded) startAuto();
      }}
      aria-roledescription="carousel"
      aria-label="Image carousel"
    >
      {/* arrows (ซ่อนเมื่อ expanded) */}
      {/* {!expanded && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            className={`${styles.arrow} ${styles.left}`}
            onClick={prev}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            className={`${styles.arrow} ${styles.right}`}
            onClick={next}
          >
            ›
          </button>
        </>
      )} */}

      {/* viewport ปกติ */}
      {!expanded && (
        <div
          className={`${styles.viewport} ${rounded ? styles.rounded : ""}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={styles.track}
            style={{ transform: `translateX(-${index * (100 / 3)}%)` }}  // ✅ เลื่อนทีละ 1/3
          >
            {images.map((src, i) => (
              <div
                className={styles.slide}
                key={i}
                aria-hidden={!(i >= index && i < index + 3)}  // ✅ hidden ถ้าอยู่นอกรอบ
              >
                <img
                  src={src}
                  alt={`slide ${i + 1} of ${images.length}`}
                  loading="lazy"
                  onClick={() => openExpanded(i)}
                  className={styles.clickable}
                />
              </div>
            ))}
          </div>

        </div>
      )}

      {/* dots (ซ่อนเมื่อ expanded) */}
      {!expanded && (
        <div className={styles.dots} role="tablist" aria-label="Carousel Pagination">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              className={`${styles.dot} ${i === index ? styles.active : ""}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}

      {/* Expanded Mode: รูป 2 ส่วน : ข้อมูล 1 ส่วน */}
      {expanded && (
        <div className={styles.expandedOverlay} role="dialog" aria-modal="true" aria-label="Image detail">
          <div className={`${styles.expandedCard} ${rounded ? styles.rounded : ""}`}>
            <div className={styles.split}>
              <div className={styles.media} onClick={closeExpanded}>
                <img src={images[index]} alt={title} />
              </div>
              <aside className={styles.info}>
                <div className={styles.infoHeader}>
                  <h3 className={styles.infoTitle}>{title}</h3>
                  <button className={styles.closeBtn} onClick={closeExpanded} aria-label="Close">✕</button>
                </div>
                <p className={styles.infoDesc}>{description}</p>

                {/* เนื้อหาเพิ่มเติมที่ส่งมาทาง details.extra (เช่น JSX string/simple html-text) */}
                {extra && <div className={styles.infoExtra}>{extra}</div>}

                {/* ปุ่มเลื่อนภาพถัดไป/ก่อนหน้าในโหมด expanded */}
                {images.length > 1 && (
                  <div className={styles.expandedNav}>
                    <button onClick={() => go(index - 1)} aria-label="Previous">‹</button>
                    <span>{index + 1} / {images.length}</span>
                    <button onClick={() => go(index + 1)} aria-label="Next">›</button>
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
