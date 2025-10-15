import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const Nav = ({ isAuthenticated, setAuth }) => {
  const shellRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();
  const lastScrollY = useRef(window.scrollY);

  // 👇 ตัวแปรตรวจจับ zoom
  const zoomHidingRef = useRef(false);
  const baseDpr = useRef(window.devicePixelRatio || 1);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);

      // ถ้ากำลังซูมอยู่ → ซ่อนไว้เลย
      if (zoomHidingRef.current) return;

      // ตรวจทิศทาง scroll
      if (y > lastScrollY.current && y > 80) setHidden(true); // scroll ลง → ซ่อน
      else if (y < lastScrollY.current) setHidden(false); // scroll ขึ้น → แสดง

      lastScrollY.current = y;
    };

    const evaluateZoom = () => {
      const vvScale =
        typeof window.visualViewport?.scale === "number"
          ? window.visualViewport.scale
          : null;

      const zoomed =
        vvScale
          ? vvScale > 1.02
          : (window.devicePixelRatio || 1) / baseDpr.current > 1.02;

      if (zoomed) {
        zoomHidingRef.current = true;
        setHidden(true); // ซ่อนตอน zoom-in
      } else {
        zoomHidingRef.current = false;
        setHidden(false); // กลับมาเมื่อเลิกซูม
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", evaluateZoom, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", evaluateZoom, { passive: true });
      window.visualViewport.addEventListener("scroll", evaluateZoom, { passive: true });
    }

    evaluateZoom();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", evaluateZoom);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", evaluateZoom);
        window.visualViewport.removeEventListener("scroll", evaluateZoom);
      }
    };
  }, []);

  async function handleLogout() {
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
      await Swal.fire({
        icon: "success",
        title: "ออกจากระบบสำเร็จ",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (e) {
      Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถออกจากระบบได้", "error");
      console.error("Logout error", e);
    } finally {
      setAuth?.(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <>
      <header ref={shellRef} className={`nav-shell ${hidden ? "nav-hide" : ""}`}>
        <nav className={`nav-inner ${scrolled ? "is-scrolled" : ""}`}>
          <Link className="nav-logo" to="/">
            <img src="/Heow2.png" alt="Logo" />
          </Link>

          <ul className="nav-menu">
            <li><Link className="nav-link" to="/profile">Profile</Link></li>
            <li><Link className="nav-link" to="/booking">Booking</Link></li>
            <li><Link className="nav-link" to="/history">History</Link></li>
            <li><Link className="nav-link" to="/feedback">Feedback</Link></li>

            {!isAuthenticated ? (
              <li>
                <button className="nav-cta" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            ) : (
              <li>
                <Link className="nav-cta" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
      <div className="nav-spacer" />
    </>
  );
};

export default Nav;
