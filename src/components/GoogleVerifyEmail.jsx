// src/components/GoogleVerifyEmail.jsx
import React, { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function isKMITLEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@kmitl\.ac\.th$/.test(String(email).trim());
}

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
      if (window.google && CLIENT_ID) {
        clearInterval(timer);
        inited.current = true;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill",
          width: 320,
        });

        btnRef.current.style.display = "none"; // ซ่อนปุ่มจริงของ GIS
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  async function handleCredentialResponse(response) {
    const fromRef = emailRef.current;
    const fromDom = (document.querySelector('input[name="email"]')?.value || "").trim();
    const currentEmail = (fromRef || fromDom).toLowerCase();

    if (!response?.credential) {
      await Swal.fire({ icon: "error", title: "Verify failed", text: "ไม่พบ credential จาก Google" });
      return;
    }
    if (!currentEmail) {
      await Swal.fire({ icon: "info", title: "กรอกอีเมลก่อน", text: "โปรดกรอกอีเมล @kmitl.ac.th ก่อนกดยืนยัน" });
      return;
    }
    if (!isKMITLEmail(currentEmail)) {
      await Swal.fire({ icon: "warning", title: "อีเมลไม่ถูกต้อง", text: "รองรับเฉพาะโดเมน @kmitl.ac.th" });
      return;
    }

    try {
      Swal.fire({
        title: "กำลังยืนยันอีเมล...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const { data } = await axios.post(
        `${BASE_URL}/api/auth/verify-google-email`,
        { credential: response.credential, expectedEmail: currentEmail },
        { withCredentials: true }
      );

      if (data?.verified) {
        await Swal.fire({ icon: "success", title: "ยืนยันอีเมลสำเร็จ", timer: 1200, showConfirmButton: false });
        onVerified?.(data);
      } else {
        await Swal.fire({ icon: "error", title: "ยืนยันไม่สำเร็จ", text: "ไม่สามารถยืนยันอีเมลได้" });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (e?.response?.status === 401 ? "Google token ไม่ถูกต้อง" : "เซิร์ฟเวอร์ผิดพลาด");
      await Swal.fire({ icon: "error", title: "ยืนยันไม่สำเร็จ", text: msg });
    }
  }

  // ✅ ใหม่: เช็คก่อน ถ้า verified แล้ว ข้าม Google ได้เลย
  const precheckAndTrigger = async () => {
    if (disabled) return;

    const email = (emailRef.current || "").toLowerCase().trim();
    if (!email) {
      await Swal.fire({ icon: "info", title: "กรอกอีเมลก่อน", text: "โปรดกรอกอีเมล @kmitl.ac.th" });
      return;
    }
    if (!isKMITLEmail(email)) {
      await Swal.fire({ icon: "warning", title: "อีเมลไม่ถูกต้อง", text: "รองรับเฉพาะโดเมน @kmitl.ac.th" });
      return;
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/is-email-verified`, { email });
      if (data?.verified) {
        await Swal.fire({
          icon: "success",
          title: "อีเมลนี้ยืนยันไว้แล้ว",
          text: "คุณสามารถเข้าสู่ระบบได้เลย",
          timer: 1200,
          showConfirmButton: false,
        });
        onVerified?.(data);
        return; // ข้าม popup Google
      }
    } catch (e) {
      // เงียบไว้ก็ได้ (ไม่ critical) หรือจะแจ้งเตือนก็ได้
    }

    // ยังไม่ verified → เรียกปุ่ม GIS จริง
    const realBtn = btnRef.current?.querySelector("div[role=button]");
    if (realBtn) realBtn.click();
    else {
      await Swal.fire({ icon: "error", title: "Google not ready", text: "กำลังโหลด Google… กรุณาลองใหม่อีกครั้ง" });
    }
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* ปุ่มจริงของ GIS (ซ่อน) */}
      <div ref={btnRef} />

      {/* ปุ่ม custom UI เดิม */}
      <button
        type="button"
        onClick={precheckAndTrigger}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          backgroundColor: disabled ? "#8197AC" : "#4285F4",
          color: "#fff",
          fontWeight: 600,
          fontSize: "18px",
          padding: "12px 20px",
          borderRadius: "12px",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          width: "400px",
          transition: "0.2s",
          margin: "0 auto",
        }}
        title={disabled ? "กรอกอีเมลก่อน" : undefined}
      >
        <img
          src="/google_logo.png"
          alt="Google"
          style={{ width: 24, height: 24, background: "white", borderRadius: "50%" }}
        />
        Verify with Google
      </button>
    </div>
  );
}