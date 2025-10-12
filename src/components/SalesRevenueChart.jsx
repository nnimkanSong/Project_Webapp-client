// src/components/SalesRevenueChart.jsx
import "../css/adminDashboard.css";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api"; // axios instance (withCredentials: true)

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * Props:
 * - series?: [{ id: string, data: [{ x: 'Jan', y: number }, ...] }]
 * - months?: ['Jan', ... 'Dec'] (ไม่จำเป็น ถ้าไม่ส่ง จะอ่านจาก API)
 * - title?: string (default: 'Top bookings')
 */
export default function SalesRevenueChart({ series: seriesProp, months: monthsProp, title = "Top bookings" }) {
  const [loading, setLoading] = useState(!seriesProp);
  const [err, setErr] = useState("");
  const [series, setSeries] = useState(seriesProp || []);
  const [months, setMonths] = useState(monthsProp || []);
  const [range, setRange] = useState("1Y"); // '1M' | '3M' | '1Y'

  // โหลดเองถ้าไม่ส่ง props มา
  useEffect(() => {
    if (seriesProp && monthsProp) return; // มีข้อมูลพร้อม ไม่ต้องดึง
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get("/api/admin/monthly-series");
        setSeries(data?.series || []);
        setMonths(data?.months || []);
      } catch (e) {
        console.error("load monthly-series error:", e?.response?.status, e?.response?.data);
        const msg = e?.response?.data?.error || e?.message || "โหลดข้อมูลไม่สำเร็จ";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [seriesProp, monthsProp]);

  // รวมยอดทุกซีรีส์ต่อเดือน -> [nMonths] ตัวเลข
  const totalsPerMonth = useMemo(() => {
    if (!months.length) return [];
    // init 0
    const sum = Array(months.length).fill(0);
    for (const s of series) {
      for (let i = 0; i < months.length; i++) {
        const mLabel = months[i];
        // หา point ของซีรีส์ที่ x เท่ากับเดือนนี้
        const p = s.data?.find?.((d) => d.x === mLabel);
        sum[i] += Number(p?.y || 0);
      }
    }
    return sum;
  }, [series, months]);

  // กรองตามช่วง (1M/3M/1Y)
  const { labels, values } = useMemo(() => {
    const n = months.length;
    if (!n) return { labels: [], values: [] };
    const take =
      range === "1M" ? 1 :
      range === "3M" ? 3 :
      12; // 1Y
    const start = Math.max(0, n - take);
    return {
      labels: months.slice(start),
      values: totalsPerMonth.slice(start),
    };
  }, [months, totalsPerMonth, range]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Bookings",
        data: values,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "#4da6ff";
          const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          g.addColorStop(0, "rgba(77,166,255,0.75)");
          g.addColorStop(1, "rgba(77,166,255,1)");
          return g;
        },
        borderRadius: 12,
        borderSkipped: false,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
      },
    ],
  }), [labels, values]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0;
            return `${v.toLocaleString()} bookings`;
          },
        },
        displayColors: false,
        padding: 10,
        backgroundColor: "rgba(20,20,20,0.9)",
        titleFont: { weight: "bold" },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: "600" } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.06)", drawBorder: false },
        ticks: {
          callback: (v) => {
            if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}k`;
            return v;
          },
        },
      },
    },
    layout: { padding: 8 },
    animation: { duration: 600, easing: "easeOutQuart" },
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "20px auto",
        background: "white",
        borderRadius: 16,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontWeight: 700 }}>{title}</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["1M", "3M", "1Y"].map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              style={{
                border: "none",
                padding: "6px 10px",
                borderRadius: 999,
                background: t === range ? "#111827" : "#F3F4F6",
                color: t === range ? "white" : "#111827",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {err && <div style={{ color: "#ef4444", padding: "8px 0" }}>{err}</div>}
      {loading ? (
        <div className="bar" style={{ height: 300, display: "grid", placeItems: "center" }}>
          กำลังโหลดข้อมูล…
        </div>
      ) : (
        <div className="bar" style={{ height: 300 }}>
          <Bar options={options} data={data} />
        </div>
      )}
    </div>
  );
}
