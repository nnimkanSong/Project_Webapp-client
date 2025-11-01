// src/components/Slider.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade, Navigation, A11y } from "swiper/modules";
import { api } from "../api";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "../css/Slider.css";

/* ===================== Helpers: URL & Images ====================== */

/** แทรก Cloudinary transformation (ถ้าเป็นลิงก์ Cloudinary) */
function withCloudinaryTransform(
  url,
  transform = "f_auto,q_auto,dpr_auto,w_1600,c_fill,g_auto"
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

/** สร้าง srcset อัตโนมัติ (เฉพาะ Cloudinary) เพื่อทำ responsive */
function buildSrcSet(url) {
  try {
    const u = new URL(url);
    if (!/res\.cloudinary\.com/i.test(u.hostname)) return undefined;

    // ดึง transform ปัจจุบัน แล้วแทนค่า w_ เป็นหลายขนาด
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return undefined;

    const t = parts[idx + 1] || "";
    const hasTransform = t && /^[a-z0-9_,:-]+$/i.test(t);
    const baseTransforms = hasTransform ? t.split(",") : [];

    // ลิสต์ความกว้างมาตรฐาน
    const widths = [360, 640, 960, 1280, 1600, 1920];

    const candidates = widths.map((w) => {
      const t2 = [
        ...baseTransforms.filter((k) => !/^w_/.test(k)), // ตัด w_ เดิมออก
        `w_${w}`,
      ].join(",");
      const p2 = [...parts];
      if (hasTransform) p2[idx + 1] = t2;
      else p2.splice(idx + 1, 0, t2);
      const u2 = new URL(u.toString());
      u2.pathname = p2.join("/");
      return `${u2.toString()} ${w}w`;
    });

    return candidates.join(", ");
  } catch {
    return undefined;
  }
}

/** แปลง payload หลากหลาย → {src, alt, isPrimary, sortOrder} + แทรก transform */
function normalizeImages(raw = [], { roomCode = "ROOM" } = {}) {
  return raw
    .map((item, i) => {
      if (typeof item === "string") return { src: item, alt: `${roomCode} • ${i + 1}` };
      const src =
        item?.url || item?.secure_url || item?.imageUrl || item?.src || item?.path || "";
      const alt = item?.alt || item?.caption || item?.label || `${roomCode} • ${i + 1}`;
      return src
        ? {
            src,
            alt,
            isPrimary: !!item?.isPrimary,
            sortOrder: Number(item?.sortOrder ?? i),
            width: item?.width ? Number(item.width) : undefined,
            height: item?.height ? Number(item.height) : undefined,
          }
        : null;
    })
    .filter(Boolean)
    .map((it) => ({ ...it, src: withCloudinaryTransform(it.src) }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
}

/* ===================== Fetch with cache & dedupe ====================== */

// in-memory cache / inflight (อายุ cache 5 นาที)
const IMG_CACHE = new Map(); // key -> { ts, items }
const INFLIGHT = new Map(); // key -> Promise
const CACHE_TTL = 5 * 60 * 1000;

function keyOf(path, params) {
  return `${path}?${JSON.stringify(params || {})}`;
}

async function fetchAllWithCache(path, params = {}, signal) {
  const key = keyOf(path, params);
  const now = Date.now();

  const cached = IMG_CACHE.get(key);
  if (cached && now - cached.ts < CACHE_TTL) return cached.items;

  let p = INFLIGHT.get(key);
  if (!p) {
    p = (async () => {
      // รองรับหน้าที่มี cursor (fetchAll)
      const all = [];
      let next = null;
      let page = 0;

      do {
        const res = await api.get(path, {
          params: { ...params, pageToken: next, page: next },
          signal,
        });
        const data = res?.data ?? {};
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
          ? data.data
          : [];
        all.push(...items);
        next = data.nextPageToken || data.nextCursor || data.next || null;
        page += 1;
        if (page > 50) break; // safety
      } while (next);

      IMG_CACHE.set(key, { ts: Date.now(), items: all });
      return all;
    })();
    INFLIGHT.set(key, p);
  }

  try {
    const result = await p;
    return result;
  } finally {
    INFLIGHT.delete(key);
  }
}

/* ===================== Main Component ====================== */

/**
 * Slider props:
 *  - roomCode: ใช้แสดงบนชิป/alt
 *  - fetchPath: endpoint (ถ้าไม่ส่ง จะเดาเป็น /api/rooms/${roomCode}/images)
 *  - query: query string เพิ่มเติม (รองรับ limit)
 *  - fallback: รูปสำรอง
 *  - aspect: ป้องกัน CLS (เช่น "16 / 9")
 *  - maxItems: จำกัดจำนวนรูปสูงสุดด้านหน้า (กัน payload บวม) – ไม่กระทบ BE
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
  aspect = "16 / 9",
  maxItems = 80, // กันดึงรูปมากเกินไป
}) {
  const progressRef = useRef(null);
  const abortRef = useRef(null);

  const finalPath = fetchPath || `/api/rooms/${roomCode}/images`;
  const _query = useMemo(() => ({ ...query }), [JSON.stringify(query)]);

  const [images, setImages] = useState(() => normalizeImages(fallback, { roomCode }));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ดึงด้วย cache+dedupe แล้ว normalize
        const raw = await fetchAllWithCache(finalPath, _query, controller.signal);
        const imgs = normalizeImages(raw, { roomCode });

        // จำกัดจำนวนฝั่ง FE อีกชั้น (ไม่ต้องแก้ BE)
        const sliced = imgs.slice(0, Math.max(1, Number(maxItems)));

        // ไม่มีรูปจาก BE → ใช้ fallback
        setImages(sliced.length ? sliced : normalizeImages(fallback, { roomCode }));
      } catch (e) {
        if (e?.name === "CanceledError" || e?.name === "AbortError") return;
        console.warn("⚠️ Load images error:", e);
        setErr(e?.response?.data?.message || e?.message || "Load images failed");
        setImages(normalizeImages(fallback, { roomCode }));
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [finalPath, _query, roomCode, maxItems]);

  return (
    <div className="slider-root">
      <div className="slider-box" style={{ aspectRatio: aspect }}>
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
          {images.map((img, i) => {
            const isFirst = i === 0; // ช่วย LCP
            const src = img.src;
            const srcSet = buildSrcSet(src);
            return (
              <SwiperSlide key={`${src}-${i}`}>
                <div className="slide-media" style={{ aspectRatio: aspect }}>
                  <img
                    src={src}
                    srcSet={srcSet}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1170px"
                    alt={img.alt || `${roomCode} • ${i + 1}`}
                    loading={isFirst ? "eager" : "lazy"}
                    fetchPriority={isFirst ? "high" : "auto"}
                    decoding="async"
                    width={img.width}
                    height={img.height}
                    className="kenburns"
                  />
                  <div className="slide-overlay" aria-hidden>
                    <div className="slide-chip">{`${roomCode} • ${i + 1}/${images.length}`}</div>
                    <h3 className="slide-title">{img.alt || " "}</h3>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div ref={progressRef} className="autoplay-progress" />
      </div>
    </div>
  );
}
