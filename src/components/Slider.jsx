import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import '../css/Slider.css';

const images = [
  { src: '/E113_1.jpg', alt: 'Room 1' },
  { src: '/E113_2.jpg', alt: 'Room 2' },
  { src: '/E113_3.jpg', alt: 'Room 3' },
  { src: '/E113_4.jpg', alt: 'Room 4' },
];

export default function Slider() {
  return (
    <div className="slider-root">
      <div className="slider-box">
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1}           // ✅ รูปเดียวเท่านั้น
          spaceBetween={0}            // ✅ ไม่มีช่องว่าง
          centeredSlides={false}      // ✅ ป้องกันการคำนวณตำแหน่งแล้วเห็นขอบ
          slidesOffsetBefore={0}
          slidesOffsetAfter={0}
          loop
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true }}
          allowTouchMove={true}
        >
          {images.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="slide-media">
                <img src={img.src} alt={img.alt} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
