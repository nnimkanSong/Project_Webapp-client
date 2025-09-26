import React, { useState } from "react";
import "../css/sidebar.css";

const items = [
  { key: "admin", label: "Admin", icon: AdminIcon },
  { key: "profile", label: "Profile", icon: ProfileIcon },
  { key: "booking", label: "Booking", icon: HomeIcon },
  { key: "history", label: "History", icon: HistoryIcon },
  { key: "feedback", label: "Feedback", icon: DocIcon },
  { key: "dashboard", label: "Dashboard", icon: ChartIcon },
  { key: "users", label: "Users Management", icon: UsersIcon },
];

export default function Sidebar({
  initialCollapsed = false,
  onSelect,
  defaultActive = "booking",
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [active, setActive] = useState(defaultActive);

  const handleSelect = (key) => {
    setActive(key);
    onSelect?.(key);
  };

  return (
    <aside className={`sb ${collapsed ? "sb--collapsed" : ""}`}>
      {/* header */}
      <div className="sb__header">
        <div className="sb__brand">
          <div className="sb__logo">
            <LogoIcon />
          </div>
          {!collapsed && <div className="sb__title">Oculis</div>}
        </div>

        <button
          className="sb__collapse"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      {/* search (สไตล์ให้คล้ายภาพซ้าย) */}
      <div className="sb__search">
        <SearchIcon />
        {!collapsed && <input placeholder="Search" />}
      </div>

      {/* menu */}
      <nav className="sb__menu">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              className={`sb__item ${isActive ? "is-active" : ""}`}
              onClick={() => handleSelect(key)}
              data-tooltip={collapsed ? label : undefined}
            >
              <span className="sb__icon">
                <Icon active={isActive} />
              </span>
              {!collapsed && <span className="sb__label">{label}</span>}
              {!collapsed && key === "booking" && (
                <span className="sb__badge">New</span>
              )}
              {(!collapsed && key === "dashboard") && (
                <span className="sb__chev">›</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* footer action + user card */}
      <div className="sb__footer">
        <button className="sb__cta">
          <PlusIcon />
          {!collapsed && <span>New Post</span>}
        </button>

        <div className="sb__user">
          <img
            src="https://i.pravatar.cc/64?img=15"
            alt="avatar"
            className="sb__avatar"
          />
          {!collapsed && (
            <div className="sb__userInfo">
              <div className="sb__userName">Jane Cooper</div>
              <div className="sb__userRole">UX Designer</div>
            </div>
          )}
          <MoreIcon />
        </div>
      </div>
    </aside>
  );
}

/* ---------------- Icons (inline SVG สไตล์มินิมอล) ---------------- */

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
      {collapsed ? (
        // ถ้า sidebar ปิด → ให้โชว์ลูกศรชี้ขวา (→)
        <path d="M10 6l6 6-6 6V6z" fill="currentColor" />
      ) : (
        // ถ้า sidebar เปิด → ให้โชว์ลูกศรชี้ซ้าย (←)
        <path d="M14 6l-6 6 6 6V6z" fill="currentColor" />
      )}
    </svg>
  );
}


function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M10.5 4a6.5 6.5 0 015.2 10.4l3.1 3.1-1.4 1.4-3.1-3.1A6.5 6.5 0 1110.5 4zm0 2a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="6" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function AdminIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 2l7 4v5c0 5-3 9-7 11-4-2-7-6-7-11V6l7-4z"
        fill="currentColor"
        opacity={active ? 1 : 0.9}
      />
      <circle cx="12" cy="11" r="2.2" fill="#0f1419" />
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
