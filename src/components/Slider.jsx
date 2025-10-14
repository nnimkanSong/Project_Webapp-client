// src/components/Slider.jsx
import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade, Navigation, A11y } from "swiper/modules";
import { api } from "../api"; // ✅ ใช้ axios instance เดิมของโปรเจกต์

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "../css/Slider.css";

/**
 * Helper: แทรก Cloudinary transformation แบบปลอดภัย (ถ้าเป็น Cloudinary URL)
 * ตัวอย่าง: .../upload/v123/abc.jpg -> .../upload/w_1600,c_fill,q_auto,f_auto/abc.jpg
 */
function withCloudinaryTransform(url, transform = "w_1600,c_fill,q_auto,f_auto") {
  try {
    const u = new URL(url);
    if (!/res\.cloudinary\.com/i.test(u.hostname)) return url;
    // ถ้ามี segment 'upload' อยู่ ให้สอด param หลังมัน
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx !== -1) {
      // กันกรณีมี transform เดิมอยู่แล้ว
      const next = parts[idx + 1] || "";
      if (!next || !/^[a-z0-9_,-]+$/i.test(next)) {
        parts.splice(idx + 1, 0, transform);
      }
      u.pathname = parts.join("/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Normalize ให้กลายเป็น { src, alt } เสมอ
 */
function normalizeImages(raw = [], { roomCode = "E113" } = {}) {
  return raw
    .map((item, i) => {
      if (typeof item === "string") {
        return { src: item, alt: `${roomCode} • ${i + 1}` };
      }
      const src =
        item?.url ||
        item?.secure_url ||
        item?.path ||
        item?.src ||
        item?.imageUrl ||
        "";
      const alt = item?.alt || item?.caption || item?.label || `${roomCode} • ${i + 1}`;
      return src ? { src, alt } : null;
    })
    .filter(Boolean)
    .map((it) => ({ ...it, src: withCloudinaryTransform(it.src) }));
}

/**
 * Slider
 * props:
 *  - roomCode: ใช้ประกอบ alt / chip (ดีสำหรับสไลด์รูปห้อง)
 *  - fetchPath: endpoint API ที่จะเรียก เช่น "/media?room=E113" หรือ "/rooms/E113/images"
 *  - query:     ถ้าต้องการ set params เพิ่ม เช่น { limit: 8 }
 *  - fallback:  array fallback เมื่อโหลดไม่ได้
 */
export default function Slider({
  roomCode = "E113",
  fetchPath = "/media?room=E113", // ✅ ปรับให้ตรงกับ backend ของคุณ
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // 🔧 ถ้า fetchPath เป็นแบบมี query string อยู่แล้ว ก็ใช้ได้เลย
        const res = await api.get(fetchPath, { params: query });
        const data = res?.data ?? [];

        // รองรับกรณี data ห่อเป็น { items: [...] } หรือ { data: [...] }
        const raw = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const imgs = normalizeImages(raw, { roomCode });
        if (mounted) {
          setImages(imgs.length ? imgs : fallback);
        }
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
    return () => {
      mounted = false;
    };
  }, [fetchPath, JSON.stringify(query), roomCode]);

  return (
    <div className="slider-root">
      <div className="slider-box">
        <button className="slider-nav prev" aria-label="Previous slide">
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button className="slider-nav next" aria-label="Next slide">
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
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
          loop
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={900}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true }}
          navigation={{ prevEl: ".slider-nav.prev", nextEl: ".slider-nav.next" }}
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
                />
                <div className="slide-overlay" aria-hidden>
                  <div className="slide-chip">
                    {`${roomCode} • ${i + 1}/${images.length}`}
                  </div>
                  <h3 className="slide-title">{img.alt || " "}</h3>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <div ref={progressRef} className="autoplay-progress" />
      </div>
    </div>
  );
}
