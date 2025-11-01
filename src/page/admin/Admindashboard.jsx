// src/pages/Admin_dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { BsPeopleFill } from "react-icons/bs";
import { MdRoomPreferences, MdBorderColor } from "react-icons/md";
import "../../css/adminDashboard.css";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { api } from "../../api";
import { useNonZeroSize } from "../../lib/useNonZeroSize"; // ✅ เพิ่มฮุคเช็คขนาด

const KPI = ({ icon, title, value, sub, tone = "blue" }) => (
  <div className={`kpi kpi-${tone} card-premium`}>
    <div className="kpi-icon">
      <span className="kpi-ring" />
      <span className="kpi-glow" />
      {icon}
    </div>
    <div className="kpi-body">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  </div>
);

const MyPie = ({ data = [] }) => {
  const [ref, ready] = useNonZeroSize();
  const clean = (Array.isArray(data) ? data : [])
    .filter(d => Number.isFinite(+d?.value))
    .map(d => ({ id: String(d?.id ?? "Unknown"), label: String(d?.label ?? d?.id ?? "Unknown"), value: +d.value }));

  const total = useMemo(() => clean.reduce((s, d) => s + d.value, 0) || 1, [clean]);

  // รอกล่องมีขนาด + มีข้อมูลก่อน
  if (!ready || clean.length === 0) return <div className="pieBox" ref={ref} />;

  return (
    <div className="pieBox" ref={ref}>
      <ResponsivePie
        data={clean}
        margin={{ top: 20, right: 24, bottom: 40, left: 24 }}
        innerRadius={0.62}
        padAngle={0.7}
        cornerRadius={9}
        activeOuterRadiusOffset={10}
        colors={({ id }) => (id === "Active" ? "#3B82F6" : "#D4E2F4")}
        arcLabel={(d) => `${Math.round((d.value / total) * 100)}%`}
        arcLabelsSkipAngle={8}
        enableArcLinkLabels={false} // กัน layout เพี้ยนตอนเริ่ม
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
        legends={[
          { anchor: "bottom", direction: "row", translateY: 30, itemWidth: 100, itemHeight: 16, symbolSize: 10 }
        ]}
        theme={{
          labels: { text: { fontSize: 12 } },
          legends: { text: { fontSize: 12 } },
          tooltip: { container: { fontSize: 13 } }
        }}
      />
    </div>
  );
};

const MyPieRooms = ({ data = [] }) => {
  const [ref, ready] = useNonZeroSize();
  const palette = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  const clean = (Array.isArray(data) ? data : [])
    .filter(d => Number.isFinite(+d?.value))
    .map(d => ({ id: String(d?.id ?? "Unknown"), label: String(d?.label ?? d?.id ?? "Unknown"), value: +d.value }));

  if (!ready || clean.length === 0) return <div className="pieBox" ref={ref} />;

  return (
    <div className="pieBox" ref={ref}>
      <ResponsivePie
        data={clean}
        margin={{ top: 20, right: 24, bottom: 40, left: 24 }}
        innerRadius={0.58}
        padAngle={0.7}
        cornerRadius={9}
        activeOuterRadiusOffset={12}
        colors={palette}
        arcLabelsSkipAngle={10}
        enableArcLinkLabels={false}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
        legends={[
          { anchor: "bottom", direction: "row", translateY: 30, itemWidth: 80, itemHeight: 16, symbolSize: 10 }
        ]}
      />
    </div>
  );
};

const MyTimeSeriesChart = ({ series = [], mode = "line" }) => {
  const [ref, ready] = useNonZeroSize();
  const palette = ["#2563EB", "#16A34A", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

  // sanitize + ติดสี
  const safeSeries = (Array.isArray(series) ? series : []).map((s, i) => ({
    id: s?.id ?? `Series ${i + 1}`,
    color: palette[i % palette.length],
    data: (s?.data ?? [])
      .filter(p => p?.x != null)                                 // ต้องมี x
      .map(p => ({ x: String(p.x), y: Number.isFinite(+p.y) ? +p.y : 0 })),
  }));

  const hasData = safeSeries.some(s => s.data?.length);
  if (!ready || !hasData) return <div className="lineBox" ref={ref} />;

  // สำหรับ Bar: [{month:'Jan', ...}]
  const barIndex = "month";
  const barKeys = safeSeries.map((s) => s.id);
  const allX = Array.from(new Set(safeSeries.flatMap((s) => s.data.map((d) => d.x))));
  const barData = allX.map((x) => {
    const row = { [barIndex]: x };
    safeSeries.forEach((s) => {
      const f = s.data.find((d) => d.x === x);
      row[s.id] = f ? f.y : 0;
    });
    return row;
  });

  const commonTheme = {
    fontFamily:
      'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai"',
    axis: {
      ticks: { text: { fontSize: 12, fill: "#334155" } },
      legend: { text: { fontSize: 12, fill: "#111827", fontWeight: 600 } },
    },
    grid: { line: { stroke: "#EEF2F7" } },
    legends: { text: { fontSize: 12, fill: "#475569", fontWeight: 600 } },
    tooltip: { container: { fontSize: 12 } },
  };

  return (
    <div className="lineBox" ref={ref} style={{ height: 340 }}>
      {mode === "bar" ? (
        <ResponsiveBar
          data={barData}
          keys={barKeys}
          indexBy={barIndex}
          margin={{ top: 30, right: 110, bottom: 46, left: 56 }}
          padding={0.25}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={(d) => {
            const i = barKeys.indexOf(d.id);
            return palette[i % palette.length];
          }}
          axisBottom={{
            tickPadding: 8,
            tickSize: 0,
            legend: "month",
            legendOffset: 34,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickPadding: 8,
            tickSize: 0,
            legend: "bookings",
            legendOffset: -44,
            legendPosition: "middle",
            format: (v) => Intl.NumberFormat().format(v),
          }}
          labelSkipWidth={16}
          labelSkipHeight={16}
          labelTextColor={{ from: "color", modifiers: [["darker", 2.2]] }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              translateX: 96,
              itemWidth: 90,
              itemHeight: 18,
              itemsSpacing: 6,
              symbolSize: 12,
              symbolShape: "circle",
            },
          ]}
          theme={commonTheme}
          tooltip={({ id, value, color, indexValue }) => (
            <div
              className="nivo-tip premium-tip"
              style={{
                background: "#fff",
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 6px 24px rgba(0,0,0,.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: color,
                    display: "inline-block",
                  }}
                />
                <b>{id}</b>
              </div>
              <div style={{ marginTop: 4 }}>
                {indexValue} : <b>{Intl.NumberFormat().format(value)}</b>
              </div>
            </div>
          )}
        />
      ) : (
        <ResponsiveLine
          data={safeSeries}
          colors={(d) => d.color}
          margin={{ top: 30, right: 110, bottom: 46, left: 56 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          curve="monotoneX"
          enableGridX={false}
          enableGridY={true}
          lineWidth={3}
          enableArea={mode === "area"}
          areaOpacity={0.1}
          enablePoints
          pointSize={8}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "seriesColor" }}
          useMesh
          motionConfig="gentle"
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            legend: "month",
            legendOffset: 34,
            legendPosition: "middle",
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            legend: "bookings",
            legendOffset: -44,
            legendPosition: "middle",
            format: (v) => Intl.NumberFormat().format(v),
          }}
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              translateX: 96,
              itemWidth: 90,
              itemHeight: 18,
              itemsSpacing: 6,
              symbolSize: 12,
              symbolShape: "circle",
              toggleSerie: true,
              effects: [{ on: "hover", style: { itemTextColor: "#111827" } }],
            },
          ]}
          tooltip={({ point }) => (
            <div
              className="nivo-tip premium-tip"
              style={{
                background: "#fff",
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 6px 24px rgba(0,0,0,.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: point.serieColor,
                    display: "inline-block",
                  }}
                />
                <b>{point.serieId}</b>
              </div>
              <div style={{ marginTop: 4 }}>
                {String(point.data.xFormatted)} :{" "}
                <b>{Intl.NumberFormat().format(point.data.yFormatted)}</b>
              </div>
            </div>
          )}
          theme={commonTheme}
        />
      )}
    </div>
  );
};

const RecentTable = ({ rows = [] }) => (
  <div className="card card-premiums">
    <div className="card-title">Recent Bookings</div>
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Booking ID</th><th>Room</th><th>User</th><th>Date</th><th>Time</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const raw = String(r.status || "").toLowerCase();
            const statusClass = raw.includes("pending")
              ? "pending"
              : raw.includes("cancel")
                ? "cancelled"
                : raw.includes("active") || raw.includes("success") || raw.includes("approve")
                  ? "approved"
                  : "pending";
            const label =
              statusClass === "approved" ? "active" :
              statusClass === "cancelled" ? "cancel" :
              "pending";
            return (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.room}</td>
                <td>{r.user}</td>
                <td>{r.date}</td>
                <td>{r.time}</td>
                <td><span className={`pill ${statusClass}`}>{label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const Notice = ({ items = [] }) => (
  <div className="card card-premium">
    <div className="card-title">Notifications</div>
    <ul className="notice">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  </div>
);

export default function Admin_dashboard() {
  const [chartMode, setChartMode] = useState("line");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [kpi, setKpi] = useState({ totalRooms: 0, totalBookingsMonth: 0, activeUsersMonth: 0, pendingToday: 0 });
  const [usersPie, setUsersPie] = useState([]);
  const [roomsPie, setRoomsPie] = useState([]);
  const [recent, setRecent] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [series, setSeries] = useState([]);

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
        const msg = e?.response?.data?.error || e?.message || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="admin-wrap premium-bg">
      {/* ฉากหลังสายรุ้งนิ่ม ๆ */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="page-title">Dashboard</div>

      {err && <div className="error">{err}</div>}
      {loading && (
        <div className="loaderWrap">
          <div className="loaderSpinner" />
          <div className="loaderText">กำลังโหลดข้อมูล…</div>
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI tone="blue" icon={<BsPeopleFill />} title="Active Users" value={kpi.activeUsersMonth}  />
        <KPI tone="amber" icon={<MdRoomPreferences />} title="Total Bookings" value={kpi.totalBookingsMonth}  />
        <KPI tone="rose" icon={<MdBorderColor />} title="Pending Today" value={kpi.pendingToday}  />
        <KPI tone="emerald" icon={<MdRoomPreferences />} title="Total Rooms" value={kpi.totalRooms} />
      </div>

      {/* Charts row */}
      <div className="grid-2">
        <Notice items={notifications} />
        <div className="card card-premium">
          <div className="card-title-row">
            <div className="card-title">Bookings per Month</div>
            <div className="chart-toolbar">
              <button
                className="chart-btn"
                data-active={chartMode === "line"}
                onClick={() => setChartMode("line")}
              >
                เส้น
              </button>
              <button
                className="chart-btn"
                data-active={chartMode === "area"}
                onClick={() => setChartMode("area")}
              >
                เส้นเติมพื้นที่
              </button>
              <button
                className="chart-btn"
                data-active={chartMode === "bar"}
                onClick={() => setChartMode("bar")}
              >
                แท่ง
              </button>
            </div>
          </div>

          <MyTimeSeriesChart series={series} mode={chartMode} />
        </div>
      </div>

      {/* Pie row */}
      <div className="grid-3">
        <div className="card card-premium">
          <div className="card-title">Users</div>
          <MyPie data={usersPie} />
        </div>

        <div className="card card-premium">
          <div className="card-title">Bookings by Room</div>
          <MyPieRooms data={roomsPie} />
        </div>
      </div>

      <RecentTable rows={recent} />
    </section>
  );
}
