import React, { useEffect, useMemo, useState } from "react";
import "../../css/History_admin.css";
import Swal from "sweetalert2";
import { api } from "../../his_api";

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
    return d;
  }
};

export default function HistoryAdmin() {
  const [rows, setRows] = useState([]);
  const [admin, setAdmin] = useState({
    username: "",
    email: "",
    photoUrl: "https://placehold.co/80x80?text=Admin",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;

        // ✅ 1) โหลดโปรไฟล์แอดมิน
        // ถ้าระบบคุณใช้ endpoint อื่น ให้แก้เป็นของคุณ เช่น "/api/profile"
        const me = await api.get("/api/profile/me");
        setAdmin({
          username: me?.data?.username ?? "Admin",
          email: me?.data?.email ?? "-",
          photoUrl: me?.data?.photoUrl ?? "https://placehold.co/80x80?text=Admin",
        });

        // ✅ 2) โหลดรายการจองทั้งหมด
        const { data } = await api.get("/api/admin/history");
        // ถ้า backend ส่ง { bookings: [...] } ให้ใช้ data.bookings แทน
        setRows(Array.isArray(data) ? data : (data?.bookings || []));
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "โหลดข้อมูลล้มเหลว";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const confirmAct = (title, text) =>
    Swal.fire({
      title, text, icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((r) => r.isConfirmed);

  const handleApprove = async (r) => {
    if (r.status === "cancel" || r.status === "done") return;
    const ok = await confirmAct(
      "อนุมัติการจอง?",
      `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`
    );
    if (!ok) return;

    try {
      await api.patch(`/api/admin/history/${r._id}/approve`);
      setRows((prev) =>
        prev.map((x) =>
          x._id === r._id
            ? { ...x, status: "active", tracking: x.tracking || "อนุมัติแล้ว" }
            : x
        )
      );
      Swal.fire("สำเร็จ", "อนุมัติเรียบร้อย", "success");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "อนุมัติไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    }
  };

  const handleCancel = async (r) => {
    if (r.status === "cancel" || r.status === "done") return;
    const ok = await confirmAct(
      "ยกเลิกการจอง?",
      `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`
    );
    if (!ok) return;

    try {
      await api.patch(`/api/admin/history/${r._id}/cancel`);
      setRows((prev) =>
        prev.map((x) =>
          x._id === r._id
            ? { ...x, status: "cancel", tracking: x.tracking || "ถูกยกเลิกโดยผู้ดูแล" }
            : x
        )
      );
      Swal.fire("สำเร็จ", "ยกเลิกเรียบร้อย", "success");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "ยกเลิกไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    }
  };

  return (
    <div className="ha-history-container">
      <h2 className="ha-history-title">History (Admin)</h2>

      {/* ✅ แถบโปรไฟล์แอดมิน */}
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
            return (
              <div key={r._id} className="ha-card">
                {/* แถวบน: User / Email / Room / Status */}
                <div className="ha-row ha-row-top">
                  <div className="ha-col">
                    <div className="ha-label">User</div>
                    <div className="ha-value">
                      {r.student_name || "-"} ({r.student_number || "N/A"})
                    </div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">Email</div>
                    <div className="ha-value">{r.student_email || "-"}</div>
                  </div>
                  <div className="ha-col">
                    <div className="ha-label">Room</div>
                    <div className="ha-value">{r.room}</div>
                  </div>
                  <div className="ha-col ha-status-cell">
                    <span className={badgeClass(r.status)}>{r.status}</span>
                  </div>
                </div>

                {/* แถวล่าง: Date/Time / People / Objective / Actions + Tracking */}
                <div className="ha-row ha-row-bottom">
                  <div className="ha-col">
                    <div className="ha-label">Date / Time</div>
                    <div className="ha-value">
                      {fmtDate(r.date)} • {(r.startTime ?? r.start_time) || "-"} - {(r.endTime ?? r.end_time) || "-"}
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
                        className={`ha-btn ha-approve ${locked ? "ha-locked" : ""}`}
                        onClick={() => !locked && handleApprove(r)}
                        disabled={locked}
                        title={locked ? "คำขอถูกยกเลิก/เสร็จสิ้นแล้ว" : "อนุมัติการจอง"}
                      >
                        {locked && <span className="lock-icon">🔒</span>} Approve
                      </button>
                      <button
                        className={`ha-btn ha-cancel ${locked ? "ha-locked" : ""}`}
                        onClick={() => !locked && handleCancel(r)}
                        disabled={locked}
                        title={locked ? "คำขอถูกยกเลิก/เสร็จสิ้นแล้ว" : "ยกเลิกการจอง"}
                      >
                        {locked && <span className="lock-icon">🔒</span>} Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
