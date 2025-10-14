// src/lib/consent.js
import Cookies from "js-cookie";

export const CONSENT_COOKIE = "site_cookie_consent";

/** อ่านสถานะความยินยอม: "true" | "false" | undefined */
export function getConsent() {
  return Cookies.get(CONSENT_COOKIE);
}

/** ผู้ใช้อนุญาตคุกกี้หรือไม่ */
export function isCookieAllowed() {
  return getConsent() === "true";
}

/** เซ็ตค่า consent (true/false) พร้อมอายุ */
export function setConsent(value) {
  Cookies.set(CONSENT_COOKIE, value ? "true" : "false", { expires: 150 });
}

/** ล้างคุกกี้ทุกตัว (ยกเว้น consent เอง) */
export function clearAllCookiesExceptConsent() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0].trim();
    if (name && name !== CONSENT_COOKIE) {
      document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
    }
  });
}
