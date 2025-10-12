// src/pages/Admin_dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import SalesRevenueChart from "../../components/SalesRevenueChart";
import { BsPeopleFill } from "react-icons/bs";
import { MdRoomPreferences, MdBorderColor } from "react-icons/md";
import "../../css/adminDashboard.css";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { api } from "../../api"; // axios withCredentials: true

const KPI = ({ icon, title, value, sub }) => (
  <div className="kpi">
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-body">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  </div>
);

const MyPie = ({ data = [] }) => {
  const total = useMemo(() => data.reduce((s, d) => s + (d?.value || 0), 0) || 1, [data]);
  return (
    <div className="pieBox">
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 24, bottom: 40, left: 24 }}
        innerRadius={0.6}
        padAngle={0.6}
        cornerRadius={7}
        activeOuterRadiusOffset={8}
        colors={({ id }) => (id === "Active" ? "#4296FD" : "#D4E2F4")}
        arcLabel={(d) => `${Math.round(((d.value || 0) / total) * 100)}%`}
        arcLabelsSkipAngle={8}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
        legends={[{ anchor: "bottom", direction: "row", translateY: 30, itemWidth: 100, itemHeight: 16, symbolSize: 10 }]}
        theme={{ labels: { text: { fontSize: 12 } }, legends: { text: { fontSize: 12 } }, tooltip: { container: { fontSize: 13 } } }}
      />
    </div>
  );
};

const MyPieRooms = ({ data = [] }) => {
  const palette = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
  return (
    <div className="pieBox">
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 24, bottom: 40, left: 24 }}
        innerRadius={0.55}
        padAngle={0.6}
        cornerRadius={7}
        activeOuterRadiusOffset={10}
        colors={palette}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
        legends={[{ anchor: "bottom", direction: "row", translateY: 30, itemWidth: 80, itemHeight: 16, symbolSize: 10 }]}
      />
    </div>
  );
};

// ----- แทนที่ MyLine เดิมทั้งบล็อกด้วยเวอร์ชันนี้ -----
const MyLine = ({ series = [] }) => {
  // บังคับให้ y เป็นตัวเลขเสมอ ป้องกัน null/undefined
  const safeSeries = (Array.isArray(series) ? series : []).map(s => ({
    id: s?.id ?? "Unknown",
    data: (s?.data ?? []).map(p => ({
      x: p?.x ?? "",
      y: Number.isFinite(p?.y) ? p.y : 0,
    })),
  }));

  // ถ้าไม่มีข้อมูล ให้แสดงข้อความแทนกราฟ
  if (!safeSeries.length || !safeSeries.some(s => s.data.length)) {
    return (
      <div style={{height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b"}}>
        No data
      </div>
    );
  }

  return (
    <div style={{ height: 320 }}>
      <ResponsiveLine
        data={safeSeries}
        margin={{ top: 30, right: 90, bottom: 40, left: 50 }}
        xScale={{ type: "point" }} // ใช้ label เดือนจาก API (Jan..Dec) ตามที่ BE ส่งมา
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
        axisBottom={{ tickSize: 0, tickPadding: 8, legend: "month", legendOffset: 30 }}
        axisLeft={{ tickSize: 0, tickPadding: 8, legend: "bookings", legendOffset: -40 }}
        enablePoints
        pointSize={8}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "seriesColor" }}
        useMesh
        legends={[{
          anchor: "bottom-right",
          direction: "column",
          translateX: 80,
          itemWidth: 80,
          itemHeight: 18,
          symbolSize: 10,
          symbolShape: "circle"
        }]}
        tooltip={({ point }) => (
          <div style={{ background: 'white', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12 }}>
            <div><b>{point.serieId}</b></div>
            <div>{point.data.xFormatted}: {point.data.yFormatted}</div>
          </div>
        )}
        theme={{
          axis: { ticks: { text: { fontSize: 12 } }, legend: { text: { fontSize: 12 } } },
          legends: { text: { fontSize: 12 } },
          tooltip: { container: { fontSize: 12 } },
        }}
      />
    </div>
  );
};


const RecentTable = ({ rows = [] }) => (
  <div className="card">
    <div className="card-title">Recent Bookings</div>
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Booking ID</th><th>Room</th><th>User</th><th>Date</th><th>Time</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.room}</td>
              <td>{r.user}</td>
              <td>{r.date}</td>
              <td>{r.time}</td>
              <td><span className={`pill ${r.status}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Notice = ({ items = [] }) => (
  <div className="card">
    <div className="card-title">Notifications</div>
    <ul className="notice">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  </div>
);

export default function Admin_dashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [kpi, setKpi] = useState({ totalRooms: 0, totalBookingsMonth: 0, activeUsersMonth: 0, pendingToday: 0 });
  const [usersPie, setUsersPie] = useState([]);
  const [roomsPie, setRoomsPie] = useState([]);
  const [recent, setRecent] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [series, setSeries] = useState([]); // line series

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [m, s] = await Promise.all([
          api.get("/api/admin/metrics"),
          api.get("/api/admin/monthly-series"),
        ]);
        setKpi(m.data?.kpi || {});
        setUsersPie(m.data?.usersPie || []);
        setRoomsPie(m.data?.roomsPie || []);
        setRecent(m.data?.recent || []);
        setNotifications(m.data?.notifications || []);
        setSeries(s.data?.series || []);
      } catch (e) {
        console.error("Admin dashboard load error:", e?.response?.status, e?.response?.data);
        const msg =
          e?.response?.data?.error ||
          e?.message ||
          "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="admin-wrap">
      <div className="page-title">Dashboard</div>

      {err && <div className="error">{err}</div>}
      {loading && <div className="loader">กำลังโหลดข้อมูล…</div>}

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI icon={<BsPeopleFill />} title="Active Users" value={kpi.activeUsersMonth} sub="this month" />
        <KPI icon={<MdRoomPreferences />} title="Total Bookings" value={kpi.totalBookingsMonth} sub="this month" />
        <KPI icon={<MdBorderColor />} title="Pending Today" value={kpi.pendingToday} sub="awaiting approval" />
        <KPI icon={<MdRoomPreferences />} title="Total Rooms" value={kpi.totalRooms} />
      </div>

      {/* Charts row */}
      <div className="grid-2">
        <Notice items={notifications} />
        <div className="card">
          <div className="card-title">Bookings per Month</div>
          <MyLine series={series} />
        </div>

        {/* <div className="card">
          <div className="card-title">Revenue / Volume (sample)</div>
          <div className="bar" style={{ height: 300 }}>
            <SalesRevenueChart />
          </div>
        </div> */}
      </div>

      {/* Pie + Recent */}
      <div className="grid-3">
        <div className="card">
          <div className="card-title">Users</div>
          <MyPie data={usersPie} />
        </div>

        <div className="card">
          <div className="card-title">Bookings by Room</div>
          <MyPieRooms data={roomsPie} />
        </div>

      </div>

      <RecentTable rows={recent} />
    </section>
  );
}
