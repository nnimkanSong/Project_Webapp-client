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

/* ===================== URL Helpers ====================== */

const CLOUDINARY_HOST_RE = /(^|\.)res\.cloudinary\.com$/i;

function isAbsoluteUrl(u) {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

/** ปกติ Cloudinary ต้องมี .../image/upload/<transform?>/path */
function fixCloudinaryUrl(u, transform = "f_auto,q_auto,dpr_auto,w_1600,c_fill,g_auto") {
  try {
    const url = new URL(u);
    if (!CLOUDINARY_HOST_RE.test(url.hostname)) return u;

    const parts = url.pathname.split("/").filter(Boolean);
    // หา segment "image" และ "upload"
    const idxImage = parts.findIndex((p) => p === "image");
    const idxUpload = parts.findIndex((p) => p === "upload");

    // ถ้ามี image แต่ไม่มี upload => แทรก upload+transform ต่อท้าย image
    if (idxImage !== -1 && idxUpload === -1) {
      parts.splice(idxImage + 1, 0, "upload", transform);
    }
    // ถ้ามี upload แล้ว แต่หลัง upload ยังไม่มี transform -> แทรก transform
    else if (idxUpload !== -1) {
      const after = parts[idxUpload + 1] || "";
      const hasTransform = after && /^[a-z0-9_,:-]+$/i.test(after);
      if (!hasTransform) parts.splice(idxUpload + 1, 0, transform);
    }
    // ถ้าไม่เจอ "image" เลย (พาธผิดรูปแบบ) ก็พยายามยัด /image/upload/transform ไว้หน้าพาธที่เหลือ
    else if (idxImage === -1) {
      parts.unshift("image", "upload", transform);
    }

    url.pathname = "/" + parts.join("/");
    return url.toString();
  } catch {
    return u;
  }
}

/** ถ้าเป็นชื่อไฟล์โลคัล ให้บังคับไปที่ `/images/<filename>` (ต้องมีไฟล์ใน public/images จริง) */
function fixLocalUrl(u) {
  if (!u) return u;
  // ตัด ./public/ ออก
  u = u.replace(/^\.?\/?public\//, "/");
  // ถ้าเป็นชื่อไฟล์เปล่าๆ หรือเริ่มด้วย ./ หรือ ไม่มีโฟลเดอร์หน้าไฟล์ ⇒ ส่งไป /images/...
  const looksBare =
    !u.startsWith("/") &&
    !u.startsWith("./") &&
    !u.startsWith("../") &&
    !u.includes("/");
  if (looksBare) return `/images/${u}`;

  // ./images/foo.jpg -> /images/foo.jpg
  if (u.startsWith("./images/")) return u.replace("./images/", "/images/");
  // images/foo.jpg -> /images/foo.jpg
  if (u.startsWith("images/")) return `/${u}`;

  // ถ้าเริ่มด้วย / แล้วก็ปล่อยผ่าน (คาดว่าเป็นพาธสาธารณะถูกแล้ว)
  return u;
}

/** ตัวรวม: ถ้า absolute + cloudinary ⇒ fixCloudinaryUrl, ถ้าไม่ absolute ⇒ fixLocalUrl */
function normalizeSrc(u) {
  if (!u) return u;
  if (isAbsoluteUrl(u)) {
    try {
      const url = new URL(u);
      if (CLOUDINARY_HOST_RE.test(url.hostname)) {
        return fixCloudinaryUrl(u);
      }
      return u; // absolute แต่ไม่ใช่ cloudinary
    } catch {
      return u;
    }
  }
  // ไม่ absolute ⇒ ถือว่าเป็นไฟล์ใน public
  return fixLocalUrl(u);
}

/** สร้าง srcset (เฉพาะ Cloudinary) เพื่อ responsive */
function buildSrcSet(u) {
  try {
    const url = new URL(u);
    if (!CLOUDINARY_HOST_RE.test(url.hostname)) return undefined;

    const parts = url.pathname.split("/").filter(Boolean);
    const idxUpload = parts.findIndex((p) => p === "upload");
    if (idxUpload === -1) return undefined;

    const t = parts[idxUpload + 1] || "";
    const hasTransform = t && /^[a-z0-9_,:-]+$/i.test(t);
    const baseT = hasTransform ? t.split(",") : [];
    const widths = [360, 640, 960, 1280, 1600, 1920];

    const candidates = widths.map((w) => {
      const t2 = [...baseT.filter((k) => !/^w_/.test(k)), `w_${w}`].join(",");
      const p2 = [...parts];
      if (hasTransform) p2[idxUpload + 1] = t2;
      else p2.splice(idxUpload + 1, 0, t2);

      const u2 = new URL(url.toString());
      u2.pathname = "/" + p2.join("/");
      return `${u2.toString()} ${w}w`;
    });

    return candidates.join(", ");
  } catch {
    return undefined;
  }
}

/* ===================== Normalizer & Fetch ====================== */

function normalizeImages(raw = [], { roomCode = "ROOM" } = {}) {
  return raw
    .map((item, i) => {
      if (typeof item === "string") {
        return { src: normalizeSrc(item), alt: `${roomCode} • ${i + 1}` };
      }
      const srcRaw = item?.url || item?.secure_url || item?.imageUrl || item?.src || item?.path || "";
      const alt = item?.alt || item?.caption || item?.label || `${roomCode} • ${i + 1}`;
      if (!srcRaw) return null;

      const src = normalizeSrc(srcRaw);
      return {
        src,
        alt,
        isPrimary: !!item?.isPrimary,
        sortOrder: Number(item?.sortOrder ?? i),
        width: item?.width ? Number(item.width) : undefined,
        height: item?.height ? Number(item.height) : undefined,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);
}

/** ไล่ดึงทุกหน้า (ถ้าหลังบ้านมี cursor) */
async function fetchAll(apiInstance, path, params = {}, signal) {
  const all = [];
  let next = null, page = 0;

  do {
    const res = await apiInstance.get(path, { params: { ...params, pageToken: next, page: next }, signal });
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

/* ===================== Component ====================== */

/**
 * Slider
 * props:
 *  - roomCode: โค้ดห้อง (ใช้ alt/ชิป)
 *  - fetchPath: endpoint (ไม่ส่ง = เดาเป็น /api/rooms/${roomCode}/images)
 *  - query: เพิ่มพารามิเตอร์ (เช่น { limit: 100 })
 *  - fallback: รูปสำรอง (โลคัล)
 *  - aspect: ป้องกัน CLS
 *  - maxItems: จำกัดรูปฝั่ง FE
 */
export default function Slider({
  roomCode = "E113",
  fetchPath,
  query = {},
  fallback = [
    { src: "E113_1.jpg", alt: "Room 1" },
    { src: "E113_2.jpg", alt: "Room 2" },
    { src: "E113_3.jpg", alt: "Room 3" },
    { src: "E113_4.jpg", alt: "Room 4" },
  ],
  aspect = "16 / 9",
  maxItems = 80,
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

        const raw = await fetchAll(api, finalPath, _query, controller.signal);
        const imgs = normalizeImages(raw, { roomCode }).slice(0, Math.max(1, Number(maxItems)));

        setImages(imgs.length ? imgs : normalizeImages(fallback, { roomCode }));
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

  // ซ่อนรูปที่ 404 ออกไป (กัน error flood + UX เนียน)
  const handleImgError = (badSrc) => {
    setImages((prev) => prev.filter((it) => it.src !== badSrc));
  };

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
            const isFirst = i === 0;
            const src = img.src;
            const srcSet = isAbsoluteUrl(src) ? buildSrcSet(src) : undefined;

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
                    onError={() => handleImgError(src)}
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
