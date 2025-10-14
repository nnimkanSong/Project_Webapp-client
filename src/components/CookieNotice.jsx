// src/components/CookieNotice.jsx
import CookieConsent from "react-cookie-consent";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { clearAllCookiesExceptConsent } from "../lib/consent";

export default function CookieNotice() {
  const handleAccept = () => {
    const banner = document.querySelector(".cookie-banner");
    if (!banner) return;

    // ✅ เพิ่มคลาส slide-up เพื่อให้เลื่อนขึ้นแล้วค่อยซ่อน
    banner.classList.add("slide-up");
    Cookies.set("site_cookie_consent", "true", { expires: 150, path: "/" });
    console.log("✅ ผู้ใช้ยอมรับคุกกี้แล้ว");

    setTimeout(() => {
      banner.style.display = "none"; // ซ่อนหลัง animation
    }, 900);
  };

  const handleDecline = () => {
    clearAllCookiesExceptConsent();
    Cookies.set("site_cookie_consent", "false", { expires: 150, path: "/" });

    // ❌ ไม่ซ่อนแบนเนอร์ แต่ขึ้น SweetAlert สีขาว
    Swal.fire({
      icon: "info",
      title: "ปฏิเสธการใช้คุกกี้",
      text: "ระบบจะไม่สามารถเข้าสู่ระบบหรือจดจำสถานะของคุณได้",
      confirmButtonText: "เข้าใจแล้ว",
      background: "#ffffff",
      color: "#0f172a",
      iconColor: "#0ea5e9",
      customClass: {
        popup: "cookie-alert-popup",
        title: "cookie-alert-title",
        htmlContainer: "cookie-alert-text",
      },
    });
  };

  return (
    <CookieConsent
      location="top"
      cookieName="site_cookie_consent"
      buttonText="ตกลง"
      declineButtonText="ปฏิเสธ"
      enableDeclineButton
      disableStyles={false}
      onAccept={handleAccept}
      onDecline={handleDecline}
      containerClasses="cookie-banner"

      /* 🎨 การ์ดหลัก */
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%) translateY(-60px)",
        top: 20,
        width: "min(1120px, 92vw)",
        zIndex: 2147483647,
        background:
          "linear-gradient(180deg, rgba(14,23,38,0.92) 0%, rgba(8,14,27,0.92) 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        padding: "14px 18px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        backdropFilter: "blur(8px)",
        opacity: 0,
        animation: "slideDown 0.8s ease forwards",
      }}

      contentStyle={{
        margin: 0,
        padding: 0,
        flex: "1 1 auto",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 260,
      }}

      buttonStyle={{
        background: "linear-gradient(180deg, #52c0f4 0%, #38bdf8 100%)",
        color: "#0b1220",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 10,
        padding: "10px 20px",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 0.2,
        boxShadow: "0 6px 18px rgba(56,189,248,0.25)",
        cursor: "pointer",
        transition: "all 0.25s ease",
      }}

      declineButtonStyle={{
        background: "linear-gradient(180deg, #f46a6a 0%, #ef4444 100%)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 10,
        padding: "10px 20px",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 0.2,
        marginRight: 10,
        boxShadow: "0 6px 18px rgba(239,68,68,0.25)",
        cursor: "pointer",
        transition: "all 0.25s ease",
      }}

      ButtonComponent={(props) => (
        <button
          {...props}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-1px)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.97)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "translateY(-1px)")
          }
          style={props.style}
        />
      )}
    >
      {/* 🌀 ไอคอน */}
      <span
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          background: "rgba(74, 222, 255, 0.12)",
          border: "1px solid rgba(125, 211, 252, 0.35)",
          fontSize: 16,
          color: "#93c5fd",
          flexShrink: 0,
        }}
        title="Cookie Notice"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2a9.96 9.96 0 0 0-7.07 2.93A10 10 0 1 0 21.07 9c-2 .4-4.07-.98-4.57-3a3.99 3.99 0 0 1-3.5 2 4 4 0 0 1-4-4c0-.35.04-.68.1-1Z" />
          <circle cx="8.5" cy="12.5" r="1.2" />
          <circle cx="12" cy="9" r="1.2" />
          <circle cx="14.5" cy="14.5" r="1.2" />
        </svg>
      </span>

      {/* 🧾 ข้อความ */}
      <p
        style={{
          margin: 0,
          color: "#e2e8f0",
          lineHeight: 1.5,
          fontSize: 15,
          fontWeight: 500,
        }}
      >
        เว็บไซต์นี้ใช้คุกกี้เพื่อให้สามารถเข้าสู่ระบบและรักษาความปลอดภัยของบัญชีผู้ใช้ได้อย่างถูกต้อง
        <a
          href="/privacy-policy"
          style={{
            color: "#8bd5ff",
            textDecoration: "underline",
            marginLeft: 8,
            fontWeight: 600,
          }}
        >
          อ่านเพิ่มเติม
        </a>
      </p>

      {/* 🔹 Animation keyframes */}
      <style>
        {`
          @keyframes slideDown {
            0% { opacity: 0; transform: translateX(-50%) translateY(-60px); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0); }
          }

          .cookie-banner.slide-up {
            animation: slideUp 0.8s ease forwards;
          }

          @keyframes slideUp {
            0% { opacity: 1; transform: translateX(-50%) translateY(0); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-60px); }
          }

          .swal2-popup.cookie-alert-popup {
            border-radius: 12px !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
          }
          .cookie-alert-title {
            font-weight: 700 !important;
            color: #0f172a !important;
            font-size: 1.2rem !important;
          }
          .cookie-alert-text {
            font-weight: 500 !important;
            color: #1e293b !important;
          }
        `}
      </style>
    </CookieConsent>
  );
}
