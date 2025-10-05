import React, { useEffect, useState, useMemo } from "react";
import "../css/History.css";
import Swal from "sweetalert2";
import { api } from "../his_api"; // หรือ "../api" ถ้าคุณตั้งไว้ชื่อนี้

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
        const { data } = await api.get("/api/bookings/me");
        setUser({
          username: data?.user?.username ?? "Unknown",
          photoUrl: data?.user?.photoUrl ?? "https://placehold.co/200x200?text=Profile",
        });
        setBookings(data?.bookings ?? []);
      } catch (e) {
        console.error("Fetch /me error:", e?.response?.status, e?.response?.data);
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "ไม่สามารถโหลดประวัติการจองได้ กรุณาลองใหม่อีกครั้ง";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const fmtDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return d;
    }
  };

  const statusChipStyle = (s) => {
    const map = {
      pending: "background:#fff3cd;color:#856404;border:1px solid #f2d16b;",
      active:  "background:#e1f5fe;color:#01579b;border:1px solid #9ad3f0;",
      done:    "background:#e8f5e9;color:#2e7d32;border:1px solid #b7dfb8;",
      cancel:  "background:#ffebee;color:#b71c1c;border:1px solid #f5b4b9;",
    };
    return map[s] || "background:#eee;color:#333;border:1px solid #ddd;";
  };

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
      console.error("Cancel failed:", e?.response?.status, e?.response?.data);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "ยกเลิกไม่สำเร็จ";
      Swal.fire("เกิดข้อผิดพลาด", msg, "error");
    }
  };

  const handleEdit = async (bk) => {
    if (bk.status === "cancel" || bk.status === "done") return;


    const { value: formValues } = await Swal.fire({
      title: "แก้ไขการจอง",
      html,
      width: 640,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      preConfirm: () => {
        const people = Number(document.getElementById("swal-people").value);
        const objective = document.getElementById("swal-objective").value.trim();
        if (!people || people < 1) {
          Swal.showValidationMessage("กรุณากรอกจำนวนคนให้ถูกต้อง (>= 1)");
          return false;
        }
        if (!objective) {
          Swal.showValidationMessage("กรุณากรอกวัตถุประสงค์");
          return false;
        }
        return { people, objective };
      },
    });

    if (!formValues) return;

    try {
      await api.patch(`/api/bookings/${bk._id}`, formValues);
      setBookings((prev) =>
        prev.map((x) => (x._id === bk._id ? { ...x, ...formValues } : x))
      );
      Swal.fire("สำเร็จ", "บันทึกการแก้ไขแล้ว", "success");
    } catch (e) {
      console.error("Edit failed:", e?.response?.status, e?.response?.data);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "บันทึกไม่สำเร็จ";
      Swal.fire("ผิดพลาด", msg, "error");
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
            <div className="profile-row">
              <img src={user.photoUrl} alt="profile" className="profile-img" />
              <div className="user-meta">
                <div className="username">{user.username}</div>
                <div className="muted">ประวัติการจองของฉัน</div>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="empty">ยังไม่มีประวัติการจอง</div>
            ) : (
              <div className="history-list">
                {bookings.map((bk) => {
                  const locked = bk.status === "cancel" || bk.status === "done";
                  return (
                    <div key={bk._id} className="booking-item">
                      <div className="booking-top">
                        <div><strong>Room:</strong> {bk.room}</div>
                        <span className={`badge ${bk.status}`}>{bk.status}</span>
                      </div>

                      <div className="history-info">
                        <p><strong>Tracking:</strong> {bk.tracking || "กำลังดำเนินการ..."}</p>
                        <p><strong>Date:</strong> {fmtDate(bk.date)}</p>
                        <p><strong>Time:</strong> {bk.startTime} - {bk.endTime}</p>
                        {bk.objective && <p><strong>Objective:</strong> {bk.objective}</p>}
                      </div>

                      <div className="btn-row">
                        <button
                          className={`btn btn-edit ${locked ? "btn-locked" : ""}`}
                          onClick={() => !locked && handleEdit(bk)}
                          disabled={locked}
                          title={locked ? "ถูกยกเลิก/เสร็จสิ้นแล้ว แก้ไขไม่ได้" : "แก้ไขการจอง"}
                        >
                          {locked && <span className="lock-icon" aria-hidden>🔒</span>}
                          <span>Edit</span>
                        </button>

                        <button
                          className={`btn btn-cancel ${locked ? "btn-locked" : ""}`}
                          onClick={() => !locked && handleCancel(bk._id)}
                          disabled={locked}
                          title={locked ? "ถูกยกเลิก/เสร็จสิ้นแล้ว ยกเลิกไม่ได้" : "ยกเลิกการจอง"}
                        >
                          {locked && <span className="lock-icon" aria-hidden>🔒</span>}
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
