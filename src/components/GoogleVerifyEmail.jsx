// src/components/GoogleVerifyEmail.jsx
import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
});

export default function GoogleVerifyEmail({ expectedEmail, onVerified, disabled }) {
  const btnRef = useRef(null);
  const inited = useRef(false);
  const emailRef = useRef("");
  const [busy, setBusy] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    emailRef.current = (expectedEmail || "").trim();
  }, [expectedEmail]);

  useEffect(() => {
    if (inited.current) return;

    const timer = setInterval(() => {
      if (!btnRef.current) return;

      if (!window.google) {
        // ถ้าเลย 1.5s แล้วยังไม่มี window.google ให้เตือนผู้ใช้
        // (กันเคสลืม <script src="https://accounts.google.com/gsi/client" async defer></script>)
        return;
      }

      clearInterval(timer);
      inited.current = true;

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: "popup",
        });

        // render ปุ่มจริง แต่ซ่อนไว้
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
        });
        btnRef.current.style.display = "none";
      } catch (err) {
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเริ่ม Google Sign-In ได้", "error");
      }
    }, 100);

    // ตั้ง timeout แจ้งเตือนถ้า GSI ไม่มา
    const warnTimer = setTimeout(() => {
      if (!inited.current && !window.google) {
        Swal.fire(
          "ยังโหลด Google ไม่เสร็จ",
          "กรุณารีเฟรชหน้า หรือเช็คสคริปต์ GSI:\nhttps://accounts.google.com/gsi/client",
          "warning"
        );
      }
    }, 1500);

    return () => {
      clearInterval(timer);
      clearTimeout(warnTimer);
    };
  }, []);

  async function handleCredentialResponse(response) {
    const fromRef = emailRef.current;
    const fromDom = (document.querySelector('input[name="email"]')?.value || "").trim();
    const currentEmail = fromRef || fromDom;

    if (!response?.credential) {
      Swal.fire("ไม่พบข้อมูลยืนยัน", "ระบบไม่ได้รับ credential จาก Google", "error");
      return;
    }
    if (!currentEmail) {
      Swal.fire("กรุณากรอกอีเมล", "กรอกอีเมลของคุณก่อนกด Verify", "warning");
      return;
    }

    setBusy(true);
    Swal.fire({
      title: "กำลังตรวจสอบ...",
      html: "โปรดรอสักครู่",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-google-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          credential: response.credential,
          expectedEmail: currentEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Verify failed");
      }

      Swal.close();
      Toast.fire({ icon: "success", title: `ยืนยันอีเมลแล้ว: ${data.email}` });
      onVerified?.(data);
    } catch (e) {
      Swal.close();
      Swal.fire("เกิดข้อผิดพลาด", String(e.message || e), "error");
    } finally {
      setBusy(false);
    }
  }

  const triggerGoogle = () => {
    if (busy || disabled) return;
    if (!btnRef.current) {
      Swal.fire("ระบบยังไม่พร้อม", "กำลังเตรียมปุ่ม Verify โปรดลองใหม่อีกครั้ง", "info");
      return;
    }
    const realBtn = btnRef.current.querySelector("div[role=button]");
    if (realBtn) realBtn.click();
    else Swal.fire("ไม่พบปุ่ม Google", "ปุ่มจริงยังไม่ถูก render ครับ", "error");
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* ปุ่มจริง (ซ่อน) */}
      <div ref={btnRef} />

      {/* ปุ่ม custom */}
      <button
        type="button"
        onClick={triggerGoogle}
        disabled={disabled || busy}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          backgroundColor: disabled || busy ? "#8197AC" : "#4285F4",
          color: "#fff",
          fontWeight: 600,
          fontSize: "18px",
          padding: "12px 20px",
          borderRadius: "12px",
          border: "none",
          cursor: disabled || busy ? "not-allowed" : "pointer",
          width: "400px",
          transition: "0.2s",
          opacity: busy ? 0.85 : 1,
        }}
      >
        <img
          src="/google_logo.png"
          alt="Google"
          style={{ width: 24, height: 24, background: "white", borderRadius: "50%" }}
        />
        {busy ? "Verifying..." : "Verify with Google"}
      </button>
    </div>
  );
}
