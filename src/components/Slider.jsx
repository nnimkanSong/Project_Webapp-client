// src/components/Slider.jsx
import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade, Navigation, A11y } from "swiper/modules";
import { api } from "../api";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "../css/Slider.css";

/** Cloudinary transform (แบบเดิม) + ปรับให้ไม่ซ้อนทับกับ segment ที่มีอยู่ */
function withCloudinaryTransform(url, transform = "f_auto,q_auto,dpr_auto,w_1600,c_fill,g_auto") {
  try {
    const u = new URL(url);
    if (!/res\.cloudinary\.com/i.test(u.hostname)) return url;
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx !== -1) {
      const next = parts[idx + 1] || "";
      // ถ้า segment ถัดจาก upload ยังไม่ใช่ transformation ให้แทรก
      if (!next || !/^[a-z0-9_,:-]+$/i.test(next)) parts.splice(idx + 1, 0, transform);
      u.pathname = parts.join("/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** ลบเลขเวอร์ชัน /v1234567 ออกจากพาธ (ใช้ตอนภาพ 404 คาดว่า version ตาย) */
function stripCloudinaryVersion(url) {
  try {
    const u = new URL(url);
    if (!/res\.cloudinary\.com/i.test(u.hostname)) return url;
    u.pathname = u.pathname.replace(/\/v\d+\//, "/");
    return u.toString();
  } catch {
    return url;
  }
}

/** แปลง payload หลากหลาย → {src,alt} + แทรก transform */
function normalizeImages(raw = [], { roomCode = "ROOM" } = {}) {
  return raw
    .map((item, i) => {
      if (typeof item === "string") return { src: item, alt: `${roomCode} • ${i + 1}` };
      const src =
        item?.url || item?.secure_url || item?.imageUrl || item?.src || item?.path || "";
      const alt = item?.alt || item?.caption || item?.label || `${roomCode} • ${i + 1}`;
      return src
        ? { src, alt, isPrimary: !!item?.isPrimary, sortOrder: Number(item?.sortOrder ?? i) }
        : null;
    })
    .filter(Boolean)
    .map((it) => ({ ...it, src: withCloudinaryTransform(it.src) }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
}

/** ดึงทุกหน้า (มี nextPageToken/nextCursor/next) */
async function fetchAll(apiInstance, path, params = {}) {
  const all = [];
  let next = null, page = 0;

  do {
    const res = await apiInstance.get(path, { params: { ...params, pageToken: next, page: next } });
    const data = res?.data ?? {};
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.items) ? data.items
      : Array.isArray(data.data) ? data.data
      : [];
    all.push(...items);

    next = data.nextPageToken || data.nextCursor || data.next || null;
    page += 1;
    if (page > 50) break;
  } while (next);

  return all;
}

/**
 * Slider (เวอร์ชันกันตาย)
 * - ปรับ loop/autoplay/nav/pagination ตามจำนวนสไลด์จริง
 * - watchOverflow ปิด gesture/arrow อัตโนมัติเมื่อสไลด์น้อย
 * - onError: ลอง strip /v123/ แล้วรีโหลด 1 ครั้ง ก่อนลง placeholder
 */
export default function Slider({
  roomCode = "E113",
  fetchPath,
  query = {},
  fallback = [
    { src: "/E113_1.jpg", alt: "Room 1" },
    { src: "/E113_2.jpg", alt: "Room 2" },
    { src: "/E113_3.jpg", alt: "Room 3" },
    { src: "/E113_4.jpg", alt: "Room 4" },
  ],
}) {
  const progressRef = useRef(null);
  const [images, setImages] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const finalPath = fetchPath || `/api/rooms/${roomCode}/images`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const raw = await fetchAll(api, finalPath, query);
        const imgs = normalizeImages(raw, { roomCode });
        if (mounted) setImages(imgs.length ? imgs : fallback);
      } catch (e) {
        console.warn("⚠️ Load images error:", e);
        if (mounted) {
          setErr(e?.response?.data?.message || e?.message || "Load images failed");
          setImages(fallback);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [finalPath, JSON.stringify(query), roomCode]);

  const n = images?.length ?? 0;
  const loopable = n > 1; // ต้องมี >=2 สไลด์ถึงจะ loop/fade ได้เนียน

  /** onError: 1) ลองตัด /v123/ ออก  2) ถ้ายังพัง → placeholder */
  function handleImgError(e) {
    const img = e.currentTarget;
    const tried = img.dataset.tried || "0";
    const srcNow = img.currentSrc || img.src || "";

    if (tried === "0") {
      img.dataset.tried = "1";
      const retry = stripCloudinaryVersion(srcNow);
      if (retry && retry !== srcNow) {
        img.src = retry;
        return;
      }
    }
    // สุดท้ายค่อยลง placeholder (กัน loop error)
    img.dataset.tried = "2";
    img.src = "/placeholder.jpg";
  }

  return (
    <div className="slider-root">
      <div className="slider-box">
        <button className="slider-nav prev" aria-label="Previous slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button className="slider-nav next" aria-label="Next slide">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        {loading && (
          <div className="slide-skeleton" aria-busy="true" aria-live="polite">
            กำลังโหลดรูปภาพ…
          </div>
        )}
        {!loading && err && (
          <div className="slide-error" role="alert">
            ไม่สามารถโหลดรูปจากฐานข้อมูลได้ • ใช้รูปสำรองแทน
          </div>
        )}

        <Swiper
          modules={[Pagination, Autoplay, EffectFade, Navigation, A11y]}
          slidesPerView={1}
          spaceBetween={0}
          loop={loopable}
          watchOverflow
          effect={loopable ? "fade" : "slide"}        // ถ้ามีรูปเดียว ไม่ต้อง fade
          fadeEffect={{ crossFade: true }}
          speed={900}
          autoplay={
            loopable
              ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
              : false
          }
          pagination={loopable ? { clickable: true } : false}
          navigation={loopable ? { prevEl: ".slider-nav.prev", nextEl: ".slider-nav.next" } : false}
          allowTouchMove={n > 1}
          a11y={{ enabled: true }}
          onAutoplayTimeLeft={(_, __, progress) => {
            progressRef.current?.style.setProperty("--progress", String(1 - progress));
          }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={`${img.src}-${i}`}>
              <div className="slide-media">
                <img
                  src={img.src}
                  alt={img.alt || `${roomCode} • ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="kenburns"
                  onError={handleImgError}
                />
                <div className="slide-overlay" aria-hidden="true">
                  <div className="slide-chip">{`${roomCode} • ${i + 1}/${n}`}</div>
                  <h3 className="slide-title">{img.alt || " "}</h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
          {!n && (
            <SwiperSlide>
              <div className="slide-media">
                <img src="/placeholder.jpg" alt="No images" />
              </div>
            </SwiperSlide>
          )}
        </Swiper>

        <div ref={progressRef} className="autoplay-progress" />
      </div>
    </div>
  );
}
