// src/pages/admin/AdminCalendar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { parse, format, startOfWeek, getDay } from "date-fns";
import { th } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../css/admin-calendar.css";
import Swal from "sweetalert2";
import { api } from "../api"; // ถ้ายังไม่มี ให้เปลี่ยนเป็น fetch() หรือคอมเมนต์ไว้ก่อนก็ได้

/* ---------- date-fns localizer (TH) ---------- */
const locales = { th };
const localizer = dateFnsLocalizer({
  format: (date, fmt) => format(date, fmt, { locale: th }),
  parse: (str, fmt) => parse(str, fmt, new Date(), { locale: th }),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

/* ---------- ห้อง (resources) ---------- */
const ROOM_OPTIONS = [
  { resourceId: "E107", resourceTitle: "E107" },
  { resourceId: "E111", resourceTitle: "E111" },
  { resourceId: "E113", resourceTitle: "E113" },
  { resourceId: "B317", resourceTitle: "B317" },
];

/* helpers */
const isCanceled = (s) => String(s || "").toLowerCase() === "cancel";

function combine(dateOnly, hhmm) {
  const d = new Date(dateOnly);
  const [hh = "0", mm = "0"] = String(hhmm || "00:00").split(":");
  d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
  return d;
}

// สีเรียบ ใช้งานในองค์กร
function eventStyleGetter(event) {
  const colorMap = {
    pending: "#D9E2EC", // ฟ้าเทาอ่อน
    active: "#C7E3D4", // เขียวอ่อน
    done: "#E6E1F9", // ม่วงอ่อน
    cancel: "#F6D8D8", // แดงอ่อน
  };
  const textMap = {
    pending: "#102A43",
    active: "#0E3D2C",
    done: "#2F1E69",
    cancel: "#6B1020",
  };
  const bg = colorMap[event.status] || "#E5E7EB";
  const fg = textMap[event.status] || "#111827";
  return {
    style: {
      backgroundColor: bg,
      border: "1px solid rgba(17,24,39,.10)",
      color: fg,
      borderRadius: 8,
      padding: "4px 8px",
      fontWeight: 600,
    },
  };
}

export default function AdminCalendar() {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.DAY); // ✅ ใช้ Day/Week/Agenda ได้

  // โหลดข้อมูล (คุณมี api ของจริงอยู่แล้ว)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/api/admin/history", {
          withCredentials: true,
        });
        const list = data?.rows || data?.bookings || [];
        if (mounted) setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Load admin history failed:", e?.response?.data || e);
        // ถ้าอยากลองแสดง dummy data:
        /*
        setRows([
          {
            id: "demo1",
            date: new Date(),
            startTime: "09:00",
            endTime: "11:00",
            room: "E111",
            status: "active",
            people: 3,
            user: { username: "Demo User", email: "demo@example.com" },
            objective: "ทดสอบระบบ",
          },
        ]);
        */
      }
    })();
    return () => (mounted = false);
  }, []);

  const visibleRows = useMemo(
    () => rows.filter((b) => !isCanceled(b.status)),
    [rows]
  );

  const events = useMemo(() => {
    return visibleRows.map((b) => {
      const start = combine(b.date, b.startTime ?? b.start_time);
      const end = combine(b.date, b.endTime ?? b.end_time);
      return {
        id: b._id || b.id,
        title: `${b.user?.username || b.student_name || "ผู้ใช้"} • ${
          b.people || 1
        } คน`,
        start,
        end,
        resourceId: b.room,
        status: b.status || "pending",
        raw: b,
      };
    });
  }, [visibleRows]);

  const minTime = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxTime = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  // Action อนุมัติ/ยกเลิก
  async function actAndToast(kind, id) {
    const endpoint = `/api/admin/history/${id}/${kind}`; // approve | cancel
    const okTitle = kind === "approve" ? "อนุมัติสำเร็จ" : "ยกเลิกสำเร็จ";
    const okText =
      kind === "approve" ? "คำขอถูกอนุมัติแล้ว" : "คำขอถูกยกเลิกแล้ว";
    try {
      const { data } = await api.patch(endpoint, null, {
        withCredentials: true,
      });
      await Swal.fire({
        icon: "success",
        title: okTitle,
        text: okText,
        timer: 1200,
        showConfirmButton: false,
      });
      return data?.booking || null;
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "ดำเนินการไม่สำเร็จ";
      await Swal.fire({ icon: "error", title: "ผิดพลาด", text: msg });
      return null;
    }
  }

  const onSelectEvent = async (ev) => {
    const b = ev.raw;
    if (!b) return;

    const row = (k, v) => `
      <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;">
        <div style="font-weight:700;color:#111827;">${k}</div>
        <div style="color:#111827;">${v ?? "-"}</div>
      </div>
    `;
    const html = `
      <div style=";display:flex;flex-direction:row;align-items:center;justify-content:center;gap:50px;line-height:1.7;text-align:start;">
        <div>
          ${row("ห้องที่จอง :", b.room)}
          ${row("วันที่จอง :", new Date(b.date).toLocaleDateString("th-TH"))}
          ${row(
            "เวลาที่จอง :",
            `${b.startTime ?? b.start_time} - ${b.endTime ?? b.end_time}`
          )}
          ${row("ชื่อผู้จอง :", b.user?.username || b.student_name)}
          ${row("อีเมลผู้จอง :", b.user?.email || b.student_email)}
        </div>
        <div>
          ${row("จำนวนคน :", b.people)}
          ${row("สถานะ :", b.status)}
          ${row("วัตถุประสงค์ :", b.objective)}
          ${b.tracking ? row("บันทึกติดตาม :", b.tracking) : ""}
        </div>  
      </div>
    `;

    const showAction = !(b.status === "done" || isCanceled(b.status));

    const result = await Swal.fire({
      title: "รายละเอียดการจอง",
      html,
      icon: "info",
      width: 680,
      showCloseButton: true,
      showDenyButton: showAction,
      showCancelButton: showAction,
      denyButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิกคำขอ",
      confirmButtonText: "ปิด",
      denyButtonColor: "#08CB00",
      cancelButtonColor: "#E62727",
      focusConfirm: !showAction,
      didOpen: () => {
        const actions = Swal.getActions();
        const denyBtn = Swal.getDenyButton();
        const cancelBtn = Swal.getCancelButton();
        if (actions && denyBtn && cancelBtn)
          actions.insertBefore(denyBtn, cancelBtn);
      },
    });

    if (result.isDenied) {
      const updated = await actAndToast("approve", b.id || b._id);
      if (updated) {
        setRows((prev) =>
          prev.map((x) =>
            String(x.id || x._id) === String(updated.id || updated._id)
              ? {
                  ...x,
                  status: "active",
                  tracking: updated.tracking || "อนุมัติแล้ว",
                }
              : x
          )
        );
      }
    }

    if (result.dismiss === Swal.DismissReason.cancel) {
      const updated = await actAndToast("cancel", b.id || b._id);
      if (updated) {
        setRows((prev) =>
          prev.filter(
            (x) => String(x.id || x._id) !== String(updated.id || updated._id)
          )
        );
      }
    }
  };

  const go = (delta) =>
    setDate(
      (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta)
    );

  const fmtHeader = useMemo(
    () =>
      new Intl.DateTimeFormat("th-TH", {
        weekday: "long",
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date),
    [date]
  );

  return (
    <div className="ab-cal">
      {/* หัว + คอนโทรล */}
      <div className="ab-cal__bar">
        <div className="ab-cal__title">
          <div className="ab-cal__title-top">ตารางการใช้ห้อง (ผู้ดูแล)</div>
          <div className="ab-cal__subtitle">ระบบจองห้อง — มุมมองผู้ดูแล</div>
        </div>

        <div className="ab-cal__legend">
          <span>
            <i className="ab-dot ab-dot--p" />
            รอพิจารณา
          </span>
          <span>
            <i className="ab-dot ab-dot--a" />
            อนุมัติแล้ว
          </span>
          <span>
            <i className="ab-dot ab-dot--d" />
            เสร็จสิ้น
          </span>
        </div>
      </div>

      <div className="ab-cal__controls">
        <div className="ab-cal__btns">
          <button className="ab-btn" onClick={() => go(-1)}>
            ก่อนหน้า
          </button>
          <button
            className="ab-btn ab-btn--pri"
            onClick={() => setDate(new Date())}
          >
            วันนี้
          </button>
          <button className="ab-btn" onClick={() => go(1)}>
            ถัดไป
          </button>
        </div>

        <div className="ab-cal__date">{fmtHeader}</div>

        <div className="ab-cal__seg">
          <button
            className={view === Views.DAY ? "active" : ""}
            onClick={() => setView(Views.DAY)}
          >
            Day
          </button>
          <button
            className={view === Views.WEEK ? "active" : ""}
            onClick={() => setView(Views.WEEK)}
          >
            Week
          </button>
          <button
            className={view === Views.MONTH ? "active" : ""}
            onClick={() => setView(Views.MONTH)}
          >
            Month
          </button>
          <button
            className={view === Views.AGENDA ? "active" : ""}
            onClick={() => setView(Views.AGENDA)}
          >
            Agenda
          </button>
        </div>
      </div>

      <Calendar
        date={date}
        onNavigate={setDate}
        view={view}
        onView={setView}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        /* 30 นาที/ช่อง ใน Day/Week (ไม่มีผลกับ Month/Agenda) */
        step={30}
        timeslots={2}
        defaultView={Views.DAY}
        min={minTime}
        max={maxTime}
        /* ใช้ resources เฉพาะ Day เพื่อไม่ให้ Week/Month แสดงเป็น resource columns */
        resources={view === Views.DAY ? ROOM_OPTIONS : undefined}
        resourceIdAccessor={view === Views.DAY ? "resourceId" : undefined}
        resourceTitleAccessor={view === Views.DAY ? "resourceTitle" : undefined}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
        style={{ height: "calc(100vh - 260px)" }}
        /* เปิด 4 มุมมอง */
        views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
        components={{ toolbar: () => null }}
      />
    </div>
  );
}
