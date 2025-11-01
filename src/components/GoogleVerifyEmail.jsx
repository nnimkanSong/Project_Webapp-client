import React, { useEffect, useRef } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { loadGoogleSDK } from "../lib/loadGoogleSDK";

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

  async function ensureGISReady() {
    if (window.google?.accounts?.id) return true;
    await loadGoogleSDK();
    return !!window.google?.accounts?.id;
  }

  function initGISIfNeeded() {
    if (inited.current) return true;
    if (!CLIENT_ID || !window.google?.accounts?.id) return false;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      ux_mode: "popup",
    });

    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 320,
      });
      btnRef.current.style.display = "none";
    }

    inited.current = true;
    return true;
  }

  async function handleCredentialResponse(response) {
    const email =
      (emailRef.current || document.querySelector('input[name="email"]')?.value || "").trim().toLowerCase();

    if (!response?.credential) {
      await Swal.fire({ icon: "error", title: "Verify failed", text: "ไม่พบ credential จาก Google" });
      return;
    }
    if (!email) {
      await Swal.fire({ icon: "info", title: "กรอกอีเมลก่อน", text: "โปรดกรอกอีเมล @kmitl.ac.th ก่อนกดยืนยัน" });
      return;
    }
    if (!isKMITLEmail(email)) {
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
        { credential: response.credential, expectedEmail: email },
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
          text: "สามารถเข้าสู่ระบบได้เลย",
          timer: 1200,
          showConfirmButton: false,
        });
        onVerified?.(data);
        return;
      }
    } catch {}

    const ok = await ensureGISReady();
    if (!ok || !initGISIfNeeded()) {
      await Swal.fire({ icon: "error", title: "Google not ready", text: "กรุณาลองใหม่อีกครั้ง" });
      return;
    }

    const realBtn = btnRef.current?.querySelector("div[role=button]");
    if (realBtn) realBtn.click();
    else await Swal.fire({ icon: "error", title: "Google not ready", text: "กรุณาลองใหม่อีกครั้ง" });
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div ref={btnRef} />
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
