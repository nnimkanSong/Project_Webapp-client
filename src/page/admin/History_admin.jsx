import React, { useEffect, useMemo, useState } from "react";
import "../../css/History_admin.css";
import Swal from "sweetalert2";
import { api } from "../../api";
import { useNavigate } from "react-router-dom";

const badgeClass = (s) =>
  s === "pending" ? "badge pending"
  : s === "active" ? "badge active"
  : s === "done"   ? "badge done"
  : "badge cancel";

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d ?? "-";
  }
};

// ทำให้ข้อมูลจาก API แน่นอนขึ้น (รองรับ field เก่า/ใหม่)
function normalizeRow(b) {
  const room =
    b.room ||
    b.roomLabel ||
    b.roomCode ||
    b.roomId?.code ||
    "—";

  return {
    id: b.id || b._id,                           // ฝั่ง API เราส่ง id อยู่แล้ว
    status: b.status || "pending",
    room,
    date: b.date ?? b.createdAt ?? null,
    startTime: b.startTime ?? b.start_time ?? "–",
    endTime:   b.endTime   ?? b.end_time   ?? "–",
    people: b.people ?? 0,
    objective: b.objective ?? "",
    tracking: b.tracking || "",
    user: {
      username: b.user?.username ?? "-",
      email: b.user?.email ?? "-",
      studentNumber: b.user?.studentNumber ?? "N/A",
    },
  };
}

export default function HistoryAdmin() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [admin, setAdmin] = useState({
    username: "",
    email: "",
    photoUrl: "https://placehold.co/80x80?text=Admin",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null); // ป้องกันกดซ้ำระหว่างรอ API

  const page = 1;   // ถ้าทำ pagination ค่อยผูก state
  const limit = 50;

  const fetchAll = async () => {
    setErr("");
    setLoading(true);
    try {
      // 1) โปรไฟล์แอดมิน (ใช้ /api/auth/me จะการันตีมี role)
      const me = await api.get("/api/auth/me");
      const role = me?.data?.user?.role || "user";
      if (!["admin", "superadmin", "staff"].includes(String(role).toLowerCase())) {
        throw new Error("ต้องเป็นผู้ดูแลระบบเท่านั้น");
      }
      setAdmin((s) => ({
        ...s,
        email: me?.data?.user?.email ?? "-",
        username: me?.data?.user?.email?.split("@")[0] ?? "Admin",
      }));

      // 2) ดึงประวัติทั้งหมด (รองรับ pagination)
      const { data } = await api.get("/api/admin/history", {
        params: { page, limit },
      });
      const list = Array.isArray(data?.rows) ? data.rows.map(normalizeRow) : [];
      setRows(list);
    } catch (e) {
      // แยก case 401/403 ให้พากลับหน้า login หรือแจ้งเตือนสิทธิ์
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "โหลดข้อมูลล้มเหลว";

      if (status === 401) {
        Swal.fire("โปรดเข้าสู่ระบบ", "เซสชันหมดอายุหรือยังไม่ได้ล็อกอิน", "info");
        navigate("/login");
        return;
      }
      if (status === 403) {
        Swal.fire("สิทธิ์ไม่พอ", "เฉพาะผู้ดูแลระบบเท่านั้น", "warning");
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmAct = (title, text) =>
    Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((r) => r.isConfirmed);

  const handleApprove = async (r) => {
    if (r.status === "cancel" || r.status === "done") return;
    if (actingId) return; // ป้องกันกดรัว
    const ok = await confirmAct("อนุมัติการจอง?", `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`);
    if (!ok) return;

    try {
      setActingId(r.id);
      await api.patch(`/api/admin/history/${r.id}/approve`);
      await fetchAll();
      Swal.fire("สำเร็จ", "อนุมัติเรียบร้อย", "success");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "อนุมัติไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (r) => {
    if (r.status === "cancel" || r.status === "done") return;
    if (actingId) return;
    const ok = await confirmAct("ยกเลิกการจอง?", `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`);
    if (!ok) return;

    try {
      setActingId(r.id);
      await api.patch(`/api/admin/history/${r.id}/cancel`);
      await fetchAll();
      Swal.fire("สำเร็จ", "ยกเลิกเรียบร้อย", "success");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "ยกเลิกไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="ha-history-container">
      <h2 className="ha-history-title">History (Admin)</h2>

      {/* แถบโปรไฟล์แอดมิน */}
      <div className="ha-profile-row">
        <img src={admin.photoUrl} alt="admin" className="ha-profile-img" />
        <div className="ha-profile-meta">
          <div className="ha-username">{admin.username}</div>
          <div className="ha-email">{admin.email}</div>
          <div className="ha-muted">จัดการจอง</div>
        </div>
      </div>

      {err && <div className="ha-error">{err}</div>}

      {loading ? (
        <div className="ha-loader">กำลังโหลดข้อมูล…</div>
      ) : rows.length === 0 ? (
        <div className="ha-empty">ยังไม่มีคำขอจอง</div>
      ) : (
        <div className="ha-history-list">
          {rows.map((r) => {
            const locked = r.status === "cancel" || r.status === "done";
            const busy = actingId === r.id;

            return (
              <div key={r.id} className="ha-card">
                {/* แถวบน */}
                <div className="ha-row ha-row-top">
                  <div className="ha-col">
                    <div className="ha-label">User</div>
                    <div className="ha-value">
                      {r.user?.username || "-"} ({r.user?.studentNumber || "N/A"})
                    </div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">Email</div>
                    <div className="ha-value">{r.user?.email || "-"}</div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">Room</div>
                    <div className="ha-value">{r.room}</div>
                  </div>
                  <div className="ha-col ha-status-cell">
                    <span className={badgeClass(r.status)}>{r.status}</span>
                  </div>
                </div>

                {/* แถวล่าง */}
                <div className="ha-row ha-row-bottom">
                  <div className="ha-col">
                    <div className="ha-label">Date / Time</div>
                    <div className="ha-value">
                      {fmtDate(r.date)} • {r.startTime} - {r.endTime}
                    </div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">People</div>
                    <div className="ha-value">{r.people}</div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">Objective</div>
                    <div className="ha-value">{r.objective || "-"}</div>
                  </div>

                  <div className="ha-col ha-actions-cell">
                    <div className="ha-actions">
                      <button
                        className={`ha-btn ha-approve ${locked || busy ? "ha-locked" : ""}`}
                        onClick={() => !locked && !busy && handleApprove(r)}
                        disabled={locked || busy}
                        title={locked ? "ยกเลิก/เสร็จสิ้นแล้ว" : "อนุมัติ"}
                      >
                        {(locked || busy) && <span className="lock-icon">🔒</span>} Approve
                      </button>
                      <button
                        className={`ha-btn ha-cancel ${locked || busy ? "ha-locked" : ""}`}
                        onClick={() => !locked && !busy && handleCancel(r)}
                        disabled={locked || busy}
                        title={locked ? "ยกเลิก/เสร็จสิ้นแล้ว" : "ยกเลิก"}
                      >
                        {(locked || busy) && <span className="lock-icon">🔒</span>} Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* แสดง tracking ถ้ามี */}
                {r.tracking ? (
                  <div className="ha-row">
                    <div className="ha-col">
                      <div className="ha-label">Tracking</div>
                      <div className="ha-value">{r.tracking}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
