import React, { useMemo } from "react";
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

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const sales = [20000,15000,25000,30000,35000,45000,20000,28000,32000,10000,30000,33000];

export default function SalesRevenueChart() {
  // สร้าง gradient ให้แท่งดูมีมิติ
  const data = useMemo(() => {
    return {
      labels: months,
      datasets: [
        {
          label: "Sales Revenue",
          data: sales,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "#4da6ff";
            const g = c.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            g.addColorStop(0, "rgba(77,166,255,0.75)");
            g.addColorStop(1, "rgba(77,166,255,1)");
            return g;
          },
          borderRadius: 12,        // <- ขอบโค้ง
          borderSkipped: false,    // <- โค้งด้านบน/ล่างครบ
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y ?? 0;
            return `$${v.toLocaleString()}`;
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
            if (v >= 1000) return `${v / 1000}k`;
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
        <h3 style={{ margin: 0, fontWeight: 700 }}>Sales Revenue</h3>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {/* แค่โชว์ UI ตัวอย่าง ถ้าจะทำ filter จริงค่อยเชื่อม state */}
          {["1D", "1M", "3M", "1Y"].map((t) => (
            <button
              key={t}
              style={{
                border: "none",
                padding: "6px 10px",
                borderRadius: 999,
                background: t === "1Y" ? "#111827" : "#F3F4F6",
                color: t === "1Y" ? "white" : "#111827",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 360 }}>
        <Bar options={options} data={data} />
      </div>
    </div>
  );
}
