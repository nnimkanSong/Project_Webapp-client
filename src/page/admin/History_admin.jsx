import React, { useEffect, useState } from "react";
import "../../css/History_admin.css";
import Swal from "sweetalert2";
import { api } from "../../api";

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

/* ---------- tracking format: แสดงวันที่+เวลา ถ้า parse ได้ ---------- */
const fmtDateTime = (v) => {
  try {
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return v ?? "-";
    return dt.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch { return v ?? "-"; }
};

const ensureHttps = (u) => {
  if (!u || typeof u !== "string") return u;
  try {
    const url = new URL(u);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.toString();
  } catch { return u; }
};

const pickPhoto = (u) => {
  if (!u) return null;
  return (
    u.photoUrl ||
    u.avatar ||
    u.image ||
    u.profileImg ||
    u.photo ||
    u?.profile?.photoUrl ||
    u?.profile?.image ||
    u?.profile?.photo?.url ||
    u?.cloudinary?.secure_url ||
    u?.cloudinary?.url ||
    u?.photos?.[0]?.url ||
    null
  );
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

  const mapRows = (arr) =>
    (Array.isArray(arr) ? arr : []).map((r) => ({
      ...r,
      id: r.id || r._id || r.bookingId || r.booking_id, // กันพลาดเรื่องคีย์
    }));

  const refresh = async () => {
    const { data } = await api.get("/api/admin/history");
    setRows(mapRows(data?.rows));
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1) โปรไฟล์ผู้ดูแล
        const me = await api.get("/api/profile/me");
        const u = me?.data?.user || me?.data?.profile || me?.data || {};
        const photo = ensureHttps(pickPhoto(u)) || "https://placehold.co/80x80?text=Admin";
        setAdmin({
          username: u.username ?? (u.email ? u.email.split("@")[0] : "Admin"),
          email: u.email ?? "-",
          photoUrl: photo,
        });

        // 2) ดึงรายการทั้งหมด
        await refresh();
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "โหลดข้อมูลล้มเหลว";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirmAct = (title, text) =>
    Swal.fire({
      title, text, icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    }).then((r) => r.isConfirmed);

  const handleApprove = async (r) => {
    // ปล่อยให้ cancel/done/active ถูกบล็อกในปุ่มแล้ว ไม่ต้องเช็กที่นี่ก็ได้
    const ok = await confirmAct("อนุมัติการจอง?", `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`);
    if (!ok) return;
    try {
      await api.patch(`/api/admin/history/${r.id}/approve`);
      await refresh();
      Swal.fire("สำเร็จ", "อนุมัติเรียบร้อย", "success");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "อนุมัติไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    }
  };

  const handleCancel = async (r) => {
    const ok = await confirmAct("ยกเลิกการจอง?", `ห้อง ${r.room} • ${fmtDate(r.date)} • ${r.startTime}-${r.endTime}`);
    if (!ok) return;
    try {
      await api.patch(`/api/admin/history/${r.id}/cancel`);
      await refresh();
      Swal.fire("สำเร็จ", "ยกเลิกเรียบร้อย", "success");
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "ยกเลิกไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
    }
  };

  const adminFallback = "https://placehold.co/80x80?text=Admin";

  return (
    <div className="ha-history-container">
      <h2 className="ha-history-title">History (Admin)</h2>

      {/* โปรไฟล์แอดมิน */}
      <div className="ha-profile-row">
        <div className="ha-profile-avatar">
          <img
            src={admin.photoUrl || adminFallback}
            alt="admin"
            className="ha-profile-img"
            onError={(e) => { e.currentTarget.src = adminFallback; }}
            referrerPolicy="no-referrer"
          />
        </div>
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
            // ล็อกทั้งสองปุ่มเมื่อ cancel/done
            const isLockedAll = r.status === "cancel" || r.status === "done";
            // ล็อกปุ่ม Approve เพิ่มเติมเมื่อเป็น active
            const isApproveLocked = isLockedAll || r.status === "active";

            return (
              <div key={r.id} className="ha-card">
                {/* แถวบน */}
                <div className="ha-row ha-row-top ha-grid-4">
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
                <div className="ha-row ha-row-bottom ha-grid-4">
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
                      {/* Approve: ล็อกเมื่อ cancel/done/active */}
                      <button
                        className={`ha-btn ha-approve ${isApproveLocked ? "ha-locked" : ""}`}
                        onClick={() => !isApproveLocked && handleApprove(r)}
                        disabled={isApproveLocked}
                        title={
                          isApproveLocked
                            ? (r.status === "active"
                                ? "สถานะ ACTIVE — ไม่ต้องอนุมัติซ้ำ"
                                : "ยกเลิก/เสร็จสิ้นแล้ว")
                            : "อนุมัติ"
                        }
                      >
                        {isApproveLocked && <span className="lock-icon">🔒</span>} Approve
                      </button>

                      {/* Cancel: ล็อกเฉพาะเมื่อ cancel/done */}
                      <button
                        className={`ha-btn ha-cancel ${isLockedAll ? "ha-locked" : ""}`}
                        onClick={() => !isLockedAll && handleCancel(r)}
                        disabled={isLockedAll}
                        title={isLockedAll ? "ยกเลิก/เสร็จสิ้นแล้ว" : "ยกเลิก"}
                      >
                        {isLockedAll && <span className="lock-icon">🔒</span>} Cancel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tracking */}
                {r.tracking ? (
                  <div className="ha-row ha-row-tracking">
                    <div className="ha-col">
                      <div className="ha-label">Tracking</div>
                      <div className="ha-value">
                        {fmtDateTime(r.tracking)}
                      </div>
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
