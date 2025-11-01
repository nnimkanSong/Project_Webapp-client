import React, { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade, Navigation, A11y } from "swiper/modules";
import { api } from "../api";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "../css/Slider.css";

/* ===========================================================
🧩 Cloudinary Utilities
=========================================================== */

function ensureCloudinaryUrlSafe(url) {
  try {
    const u = new URL(url);
    if (!/res.cloudinary.com/i.test(u.hostname)) return url;
    u.protocol = "https:";
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx !== -1) {
      for (let i = idx + 1; i < parts.length; i++) {
        if (/^[a-z0-9_,:-]+$/i.test(parts[i])) continue;
        parts[i] = encodeURIComponent(decodeURIComponent(parts[i]));
      }
      u.pathname = parts.join("/");
    }
    return u.toString();
  } catch {
    return url;
  }
}

function withCloudinaryTransform(url, transform = "f_auto,q_auto,dpr_auto,c_fill,g_auto,w_1600") {
  try {
    const u = new URL(ensureCloudinaryUrlSafe(url));
    if (!/res.cloudinary.com/i.test(u.hostname)) return url;
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return url;

    ```
const next = parts[idx + 1] || "";
const looksLikeTransform = next && /^[a-z0-9_,:-]+$/i.test(next);
const base = looksLikeTransform ? next.split(",").filter((t) => !/^w_/.test(t)) : [];
const final = [...base, ...transform.split(",")].join(",");

if (looksLikeTransform) parts[idx + 1] = final;
else parts.splice(idx + 1, 0, final);

u.pathname = parts.join("/");
return u.toString();
```

  } catch {
    return url;
  }
}

function buildSrcSet(url) {
  try {
    const u = new URL(url);
    if (!/res.cloudinary.com/i.test(u.hostname)) return undefined;
    const widths = [360, 640, 960, 1280, 1600, 1920];
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "upload");
    if (idx === -1) return undefined;


    const t = parts[idx + 1] || "";
    const hasT = t && /^[a-z0-9_,:-]+$/i.test(t);
    const baseTs = hasT ? t.split(",").filter((x) => !/^w_/.test(x)) : [];

    return widths
      .map((w) => {
        const ts = [...baseTs, `w_${w}`].join(",");
        const p2 = [...parts];
        if (hasT) p2[idx + 1] = ts;
        else p2.splice(idx + 1, 0, ts);
        const u2 = new URL(u.toString());
        u2.pathname = p2.join("/");
        return `${u2.toString()} ${w}w`;
      })
      .join(", ");


  } catch {
    return undefined;
  }
}


function normalizeImages(raw = [], { roomCode = "ROOM" } = {}) {
  return raw
    .map((item, i) => {
      const src =
        typeof item === "string"
          ? item
          : item?.secure_url ||
          item?.url ||
          item?.imageUrl ||
          item?.src ||
          item?.path ||
          "";
      const alt =
        (typeof item === "string"
          ? ""
          : item?.alt || item?.caption || item?.label) ||
        `${roomCode} • ${i + 1}`;
      if (!src) return null;
      const safe = ensureCloudinaryUrlSafe(src);
      const tuned = withCloudinaryTransform(safe);
      return {
        src: tuned,
        raw: safe,
        alt,
        isPrimary: !!item?.isPrimary,
        sortOrder: Number(item?.sortOrder ?? i),
        width: item?.width ? Number(item.width) : undefined,
        height: item?.height ? Number(item.height) : undefined,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder
    );
}


async function fetchAll(apiInstance, path, params = {}) {
  const all = [];
  let next = null,
    page = 0;

  do {
    const res = await apiInstance.get(path, {
      params: { ...params, pageToken: next, page: next },
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
    if (page > 50) break;
  } while (next);

  return all;
}


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
  maxItems = 80,
}) {
  const progressRef = useRef(null);
  const [images, setImages] = useState(() =>
    normalizeImages(fallback, { roomCode })
  );
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
        const sliced = imgs.slice(0, Math.max(1, Number(maxItems)));
        if (mounted)
          setImages(
            sliced.length ? sliced : normalizeImages(fallback, { roomCode })
          );
      } catch (e) {
        console.warn("⚠️ Load images error:", e);
        if (mounted) {
          setErr(
            e?.response?.data?.message || e?.message || "Load images failed"
          );
          setImages(normalizeImages(fallback, { roomCode }));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [finalPath, JSON.stringify(query), roomCode, maxItems]);

  return (<div className="slider-root">
    <div className="slider-box" style={{ aspectRatio: aspect }}> <button className="slider-nav prev" aria-label="Previous slide"> <svg viewBox="0 0 24 24"> <path d="M15 6l-6 6 6 6" /> </svg> </button> <button className="slider-nav next" aria-label="Next slide"> <svg viewBox="0 0 24 24"> <path d="M9 6l6 6-6 6" /> </svg> </button>

      ```
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
        navigation={{
          prevEl: ".slider-nav.prev",
          nextEl: ".slider-nav.next",
        }}
        a11y={{ enabled: true }}
        onAutoplayTimeLeft={(_, __, progress) => {
          progressRef.current?.style.setProperty(
            "--progress",
            String(1 - progress)
          );
        }}
      >
        {images.map((img, i) => {
          const isFirst = i === 0;
          const srcSet = buildSrcSet(img.src);
          return (
            <SwiperSlide key={`${img.src}-${i}`}>
              <div className="slide-media" style={{ aspectRatio: aspect }}>
                <img
                  src={img.src}
                  srcSet={srcSet}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1170px"
                  alt={img.alt || `${roomCode} • ${i + 1}`}
                  loading={isFirst ? "eager" : "lazy"}
                  fetchPriority={isFirst ? "high" : "auto"}
                  decoding="async"
                  width={img.width}
                  height={img.height}
                  className="kenburns"
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.dataset.triedRaw) {
                      el.dataset.triedRaw = "1";
                      el.src = img.raw;
                    } else {
                      el.src = "/fallback.jpg";
                    }
                  }}
                />
                <div className="slide-overlay" aria-hidden>
                  <div className="slide-chip">
                    {`${roomCode} • ${i + 1}/${images.length}`}
                  </div>
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
