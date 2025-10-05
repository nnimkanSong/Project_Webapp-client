import React, { useState } from "react";
import Swal from "sweetalert2";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: data.message || "ถ้ามีบัญชี เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว",
        confirmButtonText: "ตกลง",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
        confirmButtonText: "ลองอีกครั้ง",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h2>ลืมรหัสผ่าน</h2>
      <form onSubmit={submit}>
        <input
          type="email"
          placeholder="อีเมลที่ใช้สมัคร"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !email}>
          {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
        </button>
      </form>
    </div>
  );
}

export default Forgot;
