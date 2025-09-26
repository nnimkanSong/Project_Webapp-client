import { useEffect, useRef, useState } from "react";
import styles from "../css/sliderhome.module.css";

function sliderhome({
  images = ["./E113_1.jpg", "./E113_2.jpg", "./E113_3.jpg", "./E113_4.jpg"],
  autoPlay = true,
  interval = 3500,
  rounded = true,
}) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const touchStartX = useRef(null);

  const go = (i) => setIndex((prev) => (i + images.length) % images.length);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // autoplay
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, interval, images.length]);

  // pause on hover
  const pause = () => timerRef.current && clearInterval(timerRef.current);

  // keyboard
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  // touch swipe
  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
    touchStartX.current = null;
  };

  if (!images.length) return null;

  return (
    <div
      className={styles.wrapper}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={pause}
      onMouseLeave={() => {
        if (autoPlay) {
          timerRef.current = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
        }
      }}
    >
      <button aria-label="Previous slide" className={`${styles.arrow} ${styles.left}`} onClick={prev}>
        ‹
      </button>

      <div
        className={`${styles.viewport} ${rounded ? styles.rounded : ""}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div className={styles.slide} key={i}>
              {/* ใช้ <img> หรือ <picture> ได้ */}
              <img src={src} alt={`slide ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <button aria-label="Next slide" className={`${styles.arrow} ${styles.right}`} onClick={next}>
        ›
      </button>

      <div className={styles.dots} role="tablist" aria-label="Carousel Pagination">
        {images.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === index}
            className={`${styles.dot} ${i === index ? styles.active : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
export default sliderhome;
