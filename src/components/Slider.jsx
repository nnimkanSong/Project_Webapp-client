// src/components/Slider.jsx
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade, Navigation, A11y } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import '../css/Slider.css';

// ✅ แบบใช้ไฟล์ใน /public
const images = [
  { src: '/E113_1.jpg', alt: 'Room 1' },
  { src: '/E113_2.jpg', alt: 'Room 2' },
  { src: '/E113_3.jpg', alt: 'Room 3' },
  { src: '/E113_4.jpg', alt: 'Room 4' },
];

export default function Slider() {
  const progressRef = useRef(null);

  return (
    <div className="slider-root">
      <div className="slider-box">
        <button className="slider-nav prev" aria-label="Previous slide">
          <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <button className="slider-nav next" aria-label="Next slide">
          <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
        </button>

        <Swiper
          modules={[Pagination, Autoplay, EffectFade, Navigation, A11y]} // ⛔ ลบ Zoom ออก
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
          navigation={{ prevEl: '.slider-nav.prev', nextEl: '.slider-nav.next' }}
          a11y={{ enabled: true }}
          onAutoplayTimeLeft={(_, __, progress) => {
            progressRef.current?.style.setProperty('--progress', String(1 - progress));
          }}
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="slide-media">
                {/* ⛔ ลบ swiper-zoom-container ออก ใช้ img ตรง ๆ */}
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className="kenburns"
                />
                <div className="slide-overlay" aria-hidden>
                  <div className="slide-chip">{`E113 • ${i + 1}/${images.length}`}</div>
                  <h3 className="slide-title">{img.alt}</h3>
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
