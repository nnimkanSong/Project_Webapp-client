// src/components/Nav.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const Nav = ({ isAuthenticated, setAuth }) => {
  const shellRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // อัปเดตความสูง nav เป็น CSS var (ออปชัน)
  // useEffect(() => {
  //   const updateHeight = () => {
  //     if (!shellRef.current) return;
  //     const h = shellRef.current.getBoundingClientRect().height;
  //     document.documentElement.style.setProperty("--nav-height", `${h}px`);
  //   };
  //   updateHeight();
  //   window.addEventListener("resize", updateHeight);
  //   return () => window.removeEventListener("resize", updateHeight);
  // }, []);

  // เปลี่ยนพื้นหลังตอน scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
      Swal.fire({
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
      <header ref={shellRef} className="nav-shell">
        <nav className={`nav-inner ${scrolled ? "is-scrolled" : ""}`}>
          <Link className="nav-logo" to="/">
            <img src="/Logo_Home.png" alt="Logo" />
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
