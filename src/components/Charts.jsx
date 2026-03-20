import { useEffect, useRef, useState } from "react";

// ─── Animated Bar Chart ───────────────────────────────────────────────────────
// Fix: bars use explicit pixel heights calculated from data, NOT flex
export function BarChart({ data, color = "#00f5ff" }) {
  const [mounted, setMounted] = useState(false);
  const CHART_H = 100; // total chart area height in px

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const max = Math.max(...data.map(d => d.v), 1);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-end",   // all columns sit on same baseline
      gap: 5,
      height: CHART_H + 28,     // chart + label row
      padding: "0 4px",
    }}>
      {data.map((d, i) => {
        // Each bar's height = proportion of max, minimum 3px so zero-values are visible
        const barH = mounted ? Math.max(Math.round((d.v / max) * CHART_H), 3) : 3;
        return (
          <div key={i} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
            justifyContent: "flex-end", // push bar + label to bottom
            gap: 4,
          }}>
            {/* Value label above bar */}
            <div className="mono" style={{
              fontSize: 7,
              color: color,
              opacity: mounted ? 1 : 0,
              transition: `opacity ${0.3 + i * 0.05}s ease`,
              whiteSpace: "nowrap",
            }}>
              {d.v}{d.unit || ""}
            </div>
            {/* The bar itself */}
            <div style={{
              width: "100%",
              height: barH,
              background: `linear-gradient(180deg, ${color}, ${color}55)`,
              boxShadow: `0 0 8px ${color}66`,
              borderRadius: "2px 2px 0 0",
              transition: `height ${0.45 + i * 0.07}s cubic-bezier(0.34, 1.56, 0.64, 1)`,
            }} />
            {/* Label below */}
            <div className="mono" style={{
              fontSize: 7,
              color: "var(--muted)",
              textAlign: "center",
              overflow: "hidden",
              maxWidth: "100%",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {d.l}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pie / Donut Chart ────────────────────────────────────────────────────────
export function PieChart({ slices }) {
  let cum = 0;
  const total = slices.reduce((s, x) => s + x.v, 0) || 1;
  const gradient = slices.map(s => {
    const st = (cum / total) * 360;
    cum += s.v;
    const en = (cum / total) * 360;
    return `${s.color} ${st}deg ${en}deg`;
  }).join(",");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
      <div style={{
        width:110, height:110, borderRadius:"50%",
        background: `conic-gradient(${gradient})`,
        boxShadow: "0 0 20px rgba(0,245,255,0.12)",
        flexShrink: 0,
      }} />
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:s.color, flexShrink:0 }} />
            <span style={{ color:"var(--muted)" }}>{s.l}</span>
            <span className="mono" style={{ color:s.color, marginLeft:"auto", paddingLeft:10 }}>
              {Math.round(s.v / total * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
export function AnimCounter({ value, prefix = "", suffix = "", duration = 1200 }) {
  const el = useRef(null);
  useEffect(() => {
    if (!el.current) return;
    const target = parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
    let start = 0;
    const steps = Math.ceil(duration / 16);
    const step = target / steps;
    let frame = 0;
    const timer = setInterval(() => {
      frame++;
      start = Math.min(start + step, target);
      if (el.current) {
        const display = Number.isInteger(target)
          ? Math.floor(start).toLocaleString()
          : start.toFixed(2);
        el.current.textContent = prefix + display + suffix;
      }
      if (frame >= steps) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span ref={el}>{prefix}{value}{suffix}</span>;
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
export function Sparkline({ data, width = 120, height = 36 }) {
  if (!data || data.length < 2) return null;
  const vals  = data.map(d => d.v);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;
  const pts   = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const trend  = vals[vals.length - 1] <= vals[0]; // price dropped = good deal
  const tColor = trend ? "#39ff14" : "#ff6600";
  return (
    <svg width={width} height={height} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={tColor} strokeWidth="1.5"
        style={{ filter:`drop-shadow(0 0 3px ${tColor})` }} />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 6) - 3;
        return <circle key={i} cx={x} cy={y} r="2" fill={tColor} />;
      })}
    </svg>
  );
}
