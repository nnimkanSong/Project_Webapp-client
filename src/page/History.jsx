// src/pages/History.jsx
import React, { useEffect, useState, useMemo } from "react";
import "../css/History.css";
import Swal from "sweetalert2";
import { api } from "../his_api"; // ถ้าใช้ axios instance

export default function History() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [user, setUser] = useState({
    username: "",
    photoUrl: "https://placehold.co/200x200?text=Profile",
  });
  const [bookings, setBookings] = useState([]);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        setErr("");
        if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;

        // ✅ สมมติ backend ส่งกลับ { user: {...}, bookings: [...] }
        const { data } = await api.get("/api/bookings/me");
        setUser({
          username: data?.user?.username ?? "Unknown",
          photoUrl:
            data?.user?.photoUrl ??
            "https://placehold.co/200x200?text=Profile",
        });
        setBookings(data?.bookings ?? []);
      } catch (e) {
        console.error(e);
        setErr(
          e?.response?.data?.message ||
            "ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const handleCancel = async (id) => {
    const ask = await Swal.fire({
      title: "ยกเลิกหรือไม่?",
      text: "คุณแน่ใจหรือว่าต้องการยกเลิกการจองนี้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#D9D9D9",
      confirmButtonText: "ใช่",
      cancelButtonText: "ไม่",
    });
    if (!ask.isConfirmed) return;

    try {
      await api.patch(`/api/bookings/${id}/cancel`);
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: "cancel" } : b))
      );
      Swal.fire("ยกเลิกแล้ว!", "การจองถูกยกเลิกเรียบร้อย", "success");
    } catch (e) {
      console.error(e);
      Swal.fire(
        "เกิดข้อผิดพลาด",
        e?.response?.data?.message || "ยกเลิกไม่สำเร็จ",
        "error"
      );
    }
  };

  return (
    <div className="card-wrapper">
      <div className="history-card">
        <h2 className="history-title">History</h2>

        {err && <div className="error">{err}</div>}
        {loading && <div className="loader">กำลังโหลดข้อมูล…</div>}

        {!loading && (
          <>
            {/* Header user */}
            <div className="profile-row">
              <img src={user.photoUrl} alt="profile" className="profile-img" />
              <div className="user-meta">
                <div className="username">{user.username}</div>
                <div className="muted">ประวัติการจองของฉัน</div>
              </div>
            </div>

            {/* รายการจอง */}
            {bookings.length === 0 ? (
              <div className="empty">ยังไม่มีประวัติการจอง</div>
            ) : (
              <div className="history-list">
                {bookings.map((bk) => (
                  <div key={bk._id} className="booking-item">
                    <div className="booking-top">
                      <div>
                        <strong>Room:</strong> {bk.room}
                      </div>
                      <span
                        className={`badge ${
                          bk.status === "pending"
                            ? "pending"
                            : bk.status === "active"
                            ? "active"
                            : bk.status === "done"
                            ? "done"
                            : "cancel"
                        }`}
                      >
                        {bk.status}
                      </span>
                    </div>

                    <div className="history-info">
                      <p>
                        <strong>Tracking:</strong>{" "}
                        {bk.tracking || "กำลังดำเนินการ..."}
                      </p>
                      <p>
                        <strong>Date:</strong> {bk.date}{" "}
                        {/* รูปแบบเก็บ date เป็น string หรือ ISO ก็ปรับได้ */}
                      </p>
                      <p>
                        <strong>Time:</strong> {bk.startTime} - {bk.endTime}
                      </p>
                      {bk.objective && (
                        <p>
                          <strong>Objective:</strong> {bk.objective}
                        </p>
                      )}
                    </div>

                    <div className="btn-row">
                      <button className="btn btn-edit" disabled>
                        Edit
                      </button>
                      <button
                        className="btn btn-cancel"
                        onClick={() => handleCancel(bk._id)}
                        disabled={bk.status === "cancel" || bk.status === "done"}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
