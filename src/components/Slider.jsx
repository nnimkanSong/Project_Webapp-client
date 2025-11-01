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

/** --- Cloudinary helpers -------------------------------------------------- */

function isCloudinary(url) {
  try {
    const u = new URL(url);
    return /res\.cloudinary\.com/i.test(u.hostname);
  } catch {
    return false;
  }
}

/** ใส่ Cloudinary transform ถ้ายังไม่มี segment ถัดจาก "upload" */
function withCloudinaryTransform(
  url,
  transform = "f_auto,q_auto:eco,dpr_auto,w_1024,h_768,c_fill,g_auto"
) {
  try {
    const u = new URL(url);
    if (!/res\.cloudinary\.com/i.test(u.hostname)) return url;
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx !== -1) {
      const next = parts[idx + 1] || "";
      if (!next || !/^[a-z0-9_,:-]+$/i.test(next)) parts.splice(idx + 1, 0, transform);
      u.pathname = parts.join("/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

/** ★ NEW: ใส่ transform แบบ “กำหนดความกว้าง” และคงอัตราส่วน 4:3 (h = 0.75 * w) */
function withCloudinaryWidth(url, width) {
  const h = Math.round(width * 0.75); // 4:3
  return withCloudinaryTransform(url, `f_auto,q_auto:eco,dpr_auto,w_${width},h_${h},c_fill,g_auto`);
}

/** ★ NEW: gen srcset หลาย breakpoints (เฉพาะ Cloudinary) */
function cloudinarySrcset(baseUrl, widths = [480, 768, 1024, 1600]) {
  if (!isCloudinary(baseUrl)) return ""; // ถ้าไม่ใช่ Cloudinary ปล่อยว่าง (browser จะใช้ src หลัก)
  return widths.map((w) => `${withCloudinaryWidth(baseUrl, w)} ${w}w`).join(", ");
}

/** ลบเลขเวอร์ชัน /v1234567 (ใช้ตอนภาพ 404 คาดว่า version ตาย) */
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

/** แปลง payload หลากหลาย → {src,alt} + แทรก transform พื้นฐาน (1024×768) */
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

/** ------------------------------------------------------------------------ */

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
          {images.map((img, i) => {
            // ★ NEW: ทำ responsive image เฉพาะลิงก์ Cloudinary
            const isCld = isCloudinary(img.src);
            const src = isCld
              ? withCloudinaryWidth(img.src, 1024)
              : img.src;

            const srcSet = isCld
              ? cloudinarySrcset(img.src, [480, 768, 1024, 1600])
              : undefined;

            const sizes = "(max-width: 768px) 100vw, 1024px"; // ★ NEW: จอบนมือถือลดขนาดรูป, จอใหญ่ cap ไว้ ~1024px

            // เพิ่ม width/height เพื่อกัน CLS ให้สอดคล้องกับ 4:3
            const width = 1024;
            const height = 768;

            // LCP hint: slide แรกเท่านั้นให้ priority สูงขึ้นเล็กน้อย (ไม่ใช้ preload เพื่อเลี่ยง warning)
            const fetchpriority = i === 0 ? "high" : "auto";

            return (
              <SwiperSlide key={`${img.src}-${i}`}>
                <div className="slide-media">
                  <img
                    src={src}
                    {...(srcSet ? { srcSet, sizes } : {})}  // ★ NEW
                    alt={img.alt || `${roomCode} • ${i + 1}`}
                    loading={i === 0 ? "eager" : "lazy"}     // แรกสุด eager เพื่อลด LCP
                    fetchpriority={fetchpriority}            // ★ NEW
                    decoding="async"
                    className="kenburns"
                    width={width}                             // ★ NEW
                    height={height}
                    onError={handleImgError}
                  />
                  <div className="slide-overlay" aria-hidden="true">
                    <div className="slide-chip">{`${roomCode} • ${i + 1}/${n}`}</div>
                    <h3 className="slide-title">{img.alt || " "}</h3>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
          {!n && (
            <SwiperSlide>
              <div className="slide-media">
                <img src="/placeholder.jpg" alt="No images" width="1024" height="768" />
              </div>
            </SwiperSlide>
          )}
        </Swiper>

        <div ref={progressRef} className="autoplay-progress" />
      </div>
    </div>
  );
}
