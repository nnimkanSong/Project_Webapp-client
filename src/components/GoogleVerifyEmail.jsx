// src/components/GoogleVerifyEmail.jsx
import React, { useEffect, useRef } from "react";

export default function GoogleVerifyEmail({ expectedEmail, onVerified, disabled }) {
  const btnRef = useRef(null);
  const inited = useRef(false);

  const emailRef = useRef("");
  useEffect(() => {
    emailRef.current = (expectedEmail || "").trim();
  }, [expectedEmail]);

  useEffect(() => {
    if (inited.current) return;

    const timer = setInterval(() => {
      if (!btnRef.current) return;
      if (window.google) {
        clearInterval(timer);
        inited.current = true;

        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: "popup",
        });

        // render button จริง แต่ซ่อน
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
        });
        btnRef.current.style.display = "none"; // ⛔ ซ่อนปุ่มจริง
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  async function handleCredentialResponse(response) {
    const fromRef = emailRef.current;
    const fromDom = (document.querySelector('input[name="email"]')?.value || "").trim();
    const currentEmail = fromRef || fromDom;

    if (!response?.credential) {
      alert("ไม่พบ credential จาก Google");
      return;
    }
    if (!currentEmail) {
      alert("กรอกอีเมลของคุณก่อนกด Verify");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-google-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential: response.credential,
          expectedEmail: currentEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Verify failed");

      onVerified?.(data);
      alert("✅ ยืนยันอีเมลสำเร็จ: " + data.email);
    } catch (e) {
      alert("❌ " + e.message);
    }
  }

  // ปุ่ม custom สวย ๆ
  const triggerGoogle = () => {
    if (btnRef.current) {
      const realBtn = btnRef.current.querySelector("div[role=button]");
      if (realBtn) realBtn.click(); // trigger ปุ่มจริงที่ซ่อนอยู่
    }
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* ปุ่มจริง (ซ่อน) */}
      <div ref={btnRef} />

      {/* ปุ่ม custom */}
      <button
        type="button"
        onClick={triggerGoogle}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          backgroundColor: disabled ? "#8197AC" : "#4285F4",
          color: "#fff",
          fontWeight: "600",
          fontSize: "18px",
          padding: "12px 20px",
          borderRadius: "12px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          width: "400px",
          transition: "0.2s",
        }}
      >
        <img
          src="/google_logo.png"
          alt="Google"
          style={{ width: "24px", height: "24px", background: "white", borderRadius: "50%" }}
        />
        Verify with Google
      </button>
    </div>
  );
}
