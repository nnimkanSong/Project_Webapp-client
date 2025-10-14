// src/pages/admin/AdminCalendar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import { parse, format, startOfWeek, getDay } from "date-fns";
import { th } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../css/admin-calendar.css";
import Swal from "sweetalert2";
import { api } from "../api";

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

/* ✅ current period helpers */
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isSameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const isSameWeek = (a, b) => {
  const sa = startOfWeek(a, { weekStartsOn: 0 });
  const sb = startOfWeek(b, { weekStartsOn: 0 });
  return isSameDay(sa, sb);
};

/* ✅ ให้สี event ตามสถานะ (มี done สีม่วง) */
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

/* ✅ คำนวณ “สถานะที่ใช้แสดงผลจริง”:
   - ถ้า cancel ⇒ cancel
   - ถ้าเลยเวลาจบ ⇒ done
   - อื่น ๆ ใช้สถานะเดิม (pending/active/ฯลฯ) */
const effectiveStatus = (booking, now = new Date()) => {
  if (isCanceled(booking.status)) return "cancel";
  const end = combine(booking.date, booking.endTime ?? booking.end_time);
  if (now > end) return "done";
  return booking.status || "pending";
};

export default function AdminCalendar() {
  const [rows, setRows] = useState([]);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.DAY);
  const [tick, setTick] = useState(0); // ⏱️ ไว้กระตุ้น re-render ทุก ๆ 60 วิ

  // โหลดข้อมูล
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
      }
    })();
    return () => (mounted = false);
  }, []);

  // ⏱️ อัปเดตทุก 60 วินาที เพื่อให้รายการที่หมดเวลาเปลี่ยนเป็น “เสร็จสิ้น” อัตโนมัติ
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const visibleRows = useMemo(
    () => rows.filter((b) => !isCanceled(b.status)),
    [rows]
  );

  const events = useMemo(() => {
    const now = new Date(); // ใช้ร่วมกับ tick เพื่อคำนวณสถานะสด ๆ
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
        status: effectiveStatus(b, now), // ✅ ใช้สถานะที่คำนวณแล้ว (รวมกรณี “เลยเวลา”)
        raw: b,
      };
    });
  }, [visibleRows, tick]); // ✅ tick ทำให้คำนวณใหม่ทุก 60 วิ

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
      window.dispatchEvent(new Event("rb:refresh-pending"));
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

    // แทนที่บล็อค onSelectEvent เดิมเฉพาะส่วน row() และ html
    const row = (k, v) => `
  <div style="display:grid;grid-template-columns:120px 1fr;gap:8px;">
    <div style="font-weight:700;color:#111827;">${k}</div>
    <div style="color:#111827;">${v ?? "-"}</div>
  </div>
`;

    const html = `
  <div style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:50px;line-height:1.7;text-align:start;">
    <div>
      ${row("ห้องที่จอง :", b.room)}
      ${row("วันที่จอง :", new Date(b.date).toLocaleDateString("th-TH"))}
      ${row(
        "เวลาที่จอง :",
        "${(b.startTime ?? b.start_time) + " - " + (b.endTime ?? b.end_time)}"
      )}
      ${row("ชื่อผู้จอง :", b.user?.username || b.student_name)}
      ${row("อีเมลผู้จอง :", b.user?.email || b.student_email)}
    </div>
    <div>
      ${row("จำนวนคน :", b.people)}
      ${row("สถานะ :", effectiveStatus(b))}
      ${row("วัตถุประสงค์ :", b.objective)}
      ${b.tracking ? row("บันทึกติดตาม :", b.tracking) : ""}
    </div>  
  </div>
`;

    const eff = effectiveStatus(b);

    /* ✅ แยกสิทธิ์ของปุ่ม:
       - อนุมัติ: ได้เฉพาะเมื่อยังเป็น pending เท่านั้น
       - ยกเลิก: ทำได้ถ้ายังไม่ cancel/done */
    const canApprove = eff === "pending";
    const canCancel = !(eff === "cancel" || eff === "done");

    const result = await Swal.fire({
      title: "รายละเอียดการจอง",
      html,
      icon: "info",
      width: 680,
      showCloseButton: true,
      showDenyButton: canApprove, // ✅ ซ่อนปุ่มอนุมัติเมื่อ active/done/cancel
      showCancelButton: canCancel,
      denyButtonText: "อนุมัติ",
      cancelButtonText: "ยกเลิกคำขอ",
      confirmButtonText: "ปิด",
      denyButtonColor: "#08CB00",
      cancelButtonColor: "#E62727",
      focusConfirm: !(canApprove || canCancel),
      didOpen: () => {
        const actions = Swal.getActions();
        const denyBtn = Swal.getDenyButton();
        const cancelBtn = Swal.getCancelButton();
        // ถ้ามีทั้งสองปุ่ม ให้สลับตำแหน่งให้ "อนุมัติ" อยู่ก่อน "ยกเลิก"
        if (actions && denyBtn && cancelBtn)
          actions.insertBefore(denyBtn, cancelBtn);
      },
    });

    // ✅ กันอนุมัติซ้ำด้วย logic อีกชั้น
    if (result.isDenied && canApprove) {
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

    if (result.dismiss === Swal.DismissReason.cancel && canCancel) {
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

  /* ✅ ปุ่มก่อนหน้า/ถัดไป เลื่อนตามมุมมองปัจจุบัน */
  const go = (delta) =>
    setDate((d) => {
      const nd = new Date(d);
      if (view === Views.WEEK) {
        nd.setDate(nd.getDate() + delta * 7);
        return nd;
      }
      if (view === Views.MONTH) {
        nd.setMonth(nd.getMonth() + delta);
        return nd;
      }
      nd.setDate(nd.getDate() + delta); // DAY/AGENDA
      return nd;
    });

  /* ✅ ป้ายบนปุ่มกระโดด */
  const jumpLabel = useMemo(() => {
    if (view === Views.MONTH) return "เดือนนี้";
    if (view === Views.WEEK) return "สัปดาห์นี้";
    return "วันนี้";
  }, [view]);

  const jumpToCurrentPeriod = () => {
    const now = new Date();
    if (view === Views.MONTH)
      setDate(new Date(now.getFullYear(), now.getMonth(), 1));
    else if (view === Views.WEEK)
      setDate(startOfWeek(now, { weekStartsOn: 0 }));
    else setDate(now);
  };

  /* ✅ แสดงหัววันที่ */
  const fmtHeader = useMemo(() => {
    const now = new Date();

    if (view === Views.MONTH) {
      if (isSameMonth(date, now)) return "เดือนนี้";
      return new Intl.DateTimeFormat("th-TH", {
        month: "long",
        year: "numeric",
      }).format(date);
    }

    if (view === Views.WEEK) {
      if (isSameWeek(date, now)) return "สัปดาห์นี้";
      const start = startOfWeek(date, { weekStartsOn: 0 });
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = (d) =>
        new Intl.DateTimeFormat("th-TH", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(d);
      return `${fmt(start)} – ${fmt(end)}`;
    }

    if (isSameDay(date, now)) return "วันนี้";
    return new Intl.DateTimeFormat("th-TH", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }, [date, view]);

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
            <i className="ab-dot ab-dot--p" /> รอพิจารณา
          </span>
          <span>
            <i className="ab-dot ab-dot--a" /> อนุมัติแล้ว
          </span>
          <span>
            <i className="ab-dot ab-dot--d" /> เสร็จสิ้น
          </span>
        </div>
      </div>

      <div className="ab-cal__controls">
        <div className="ab-cal__btns">
          <button className="ab-btn" onClick={() => go(-1)}>
            ก่อนหน้า
          </button>
          <button className="ab-btn ab-btn--pri" onClick={jumpToCurrentPeriod}>
            {jumpLabel}
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
        step={30}
        timeslots={2}
        defaultView={Views.DAY}
        min={minTime}
        max={maxTime}
        resources={view === Views.DAY ? ROOM_OPTIONS : undefined}
        resourceIdAccessor={view === Views.DAY ? "resourceId" : undefined}
        resourceTitleAccessor={view === Views.DAY ? "resourceTitle" : undefined}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEvent}
        style={{ height: "calc(100vh - 260px)" }}
        views={[Views.DAY, Views.WEEK, Views.MONTH, Views.AGENDA]}
        components={{ toolbar: () => null }}
      />
    </div>
  );
}
//
