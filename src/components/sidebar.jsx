// Sidebar.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../css/sidebar.css";
import { Power , CalendarCheck} from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { VscArchive } from "react-icons/vsc";
import { Shield, ShieldCheck, ShieldUser, UserCog, Crown } from "lucide-react";
<CalendarCheck size={14} />

const items = [
  { key: "profile", label: "Profile", icon: ProfileIcon },
  { key: "booking", label: "Booking", icon: VscArchive },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "feedback", label: "Feedback", icon: DocIcon },
  { key: "dashboard", label: "Dashboard", icon: ChartIcon },
  { key: "users", label: "Users Management", icon: UsersIcon },
  { key: "logout", label: "Logout", icon: Power }, // จะไม่เรนเดอร์ในเมนู เราจะไปวางที่ footer
];
const PATH_BY_KEY = {
  admin: "/admin/dashboard",
  dashboard: "/admin/dashboard",
  profile: "/admin/profile",
  booking: "/admin/booking",
  history: "/admin/history",
  feedback: "/admin/feedback",
  users: "/admin/users-management",
};

export default function Sidebar({ initialCollapsed = false, onSelect, setAuth }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // ✅ Logout + SweetAlert2
  function handleLogout() {
    return async () => {
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
        Swal.fire({ icon: "success", title: "ออกจากระบบสำเร็จ", showConfirmButton: false, timer: 1500 });
      } catch (e) {
        Swal.fire("เกิดข้อผิดพลาด!", "ไม่สามารถออกจากระบบได้", "error");
      } finally {
        setAuth?.(false);
        navigate("/login", { replace: true });
      }
    };
  }

  return (
    <aside className={`sb ${collapsed ? "sb--collapsed" : ""}`}>
      {/* Header */}
      <div className="sb__header">
        <div className="sb__brand">
          <div className="sb__logo"><ShieldUser /></div>
          {!collapsed && <div className="sb__title">Admin</div>}
        </div>
        <button
          className="sb__collapse"
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      {/* Menu (ไม่รวม Logout) */}
      <nav className="sb__menu">
        {items
          .filter(i => i.key !== "logout")
          .map(({ key, label, icon: Icon }) => {
            const to = PATH_BY_KEY[key] || "/admin/booking";
            return (
              <NavLink
                key={key}
                to={to}
                onClick={() => onSelect?.(key)}
                className={({ isActive }) => `sb__item ${isActive ? "is-active" : ""}`}
                data-tooltip={collapsed ? label : undefined}
              >
                <span className="sb__icon"><Icon /></span>
                {!collapsed && <span className="sb__label">{label}</span>}
                {!collapsed && key === "booking" && <span className="sb__badge">New</span>}
                {!collapsed && key === "dashboard" && <span className="sb__chev">›</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer: ปุ่ม Logout ตรึงล่าง */}
      <div className="sb__footer">
        <button
          type="button"
          onClick={handleLogout()}
          className={`logout ${collapsed ? "logout--icon" : "logout--full"}`}
          title="Logout"
        >
          <span className="logout__inner">
            <span className="logout__icon"><Power size={18} /></span>
            {!collapsed && <span className="logout__label">Logout</span>}
          </span>
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Icons ---------------- */
function LogoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c8aff" />
          <stop offset="1" stopColor="#6a5cff" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#g)" />
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9" />
    </svg>
  );
}
function CollapseIcon({ collapsed }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {collapsed ? <path d="M10 6l6 6-6 6V6z" fill="currentColor" /> : <path d="M14 6l-6 6 6 6V6z" fill="currentColor" />}
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="currentColor" />
      <path d="M4 20a8 8 0 0116 0H4z" fill="currentColor" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-9z" fill="currentColor" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M13 3a9 9 0 100 18 9 9 0 000-18zm-1 5h2v5h4v2h-6V8z" fill="currentColor" />
      <path d="M2 12h3l-1.5 2.5z" fill="currentColor" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" fill="currentColor" />
      <path d="M14 2v6h6" fill="#0f1419" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 19h16v2H4zM7 10h3v7H7zM11 6h3v11h-3zM15 12h3v5h-3z" fill="currentColor" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="9" cy="8" r="3" fill="currentColor" />
      <path d="M2 20a7 7 0 0114 0H2z" fill="currentColor" />
      <circle cx="17.5" cy="10" r="2.2" fill="currentColor" />
      <path d="M14.3 20h7.2a5.4 5.4 0 00-7.2-4.2z" fill="currentColor" />
    </svg>
  );
}
