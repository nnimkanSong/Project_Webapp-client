import React, { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // บางกรณี server อาจไม่ส่ง JSON กลับ ให้กัน error ไว้
      const data = await res.json().catch(() => ({}));
      // ตอบแบบ generic เสมอ (กัน user enumeration)
      setMsg(data.message || "ถ้ามีบัญชี เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว");
    } catch (err) {
      setMsg("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
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
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}

export default Forgot;
