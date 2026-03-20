import { useState, useEffect } from "react";

// ─── Formatting ───────────────────────────────────────────────────────────────
export const fmt = v => `$${Number(v).toFixed(2)}`;

// ─── Account Valuation ────────────────────────────────────────────────────────
export const calcSteam = (games, level, badges) =>
  games.reduce((s, g) => s + g.price * 0.6, 0)
  + level * 0.12
  + badges * 1.5
  + Math.min(games.reduce((s, g) => s + g.playtime, 0) * 0.003, 30);

export const calcEpic = games =>
  games.reduce((s, g) => s + g.price * 0.5, 0)
  + games.filter(g => g.price === 0).length * 2.5;

// ─── Password Strength ────────────────────────────────────────────────────────
export const pwStr = pw => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const m = [
    { label:"Very Weak",    color:"#ff2244" },
    { label:"Weak",         color:"#ff6600" },
    { label:"Fair",         color:"#ffcc00" },
    { label:"Strong",       color:"#39ff14" },
    { label:"Very Strong",  color:"#00f5ff" },
  ];
  return { score: s, label: m[Math.min(s-1,4)]?.label || "", color: m[Math.min(s-1,4)]?.color || "transparent" };
};

// ─── Genre breakdown from game list ──────────────────────────────────────────
export const getGenreSlices = (games) => {
  const counts = {};
  games.forEach(g => {
    const cats = g.categories || [g.genre || "Other"];
    const primary = cats[0];
    counts[primary] = (counts[primary] || 0) + 1;
  });
  const colors = ["#00f5ff","#bf00ff","#39ff14","#ff6600","#ff2244","#ffcc00","#1a9fff","#ff77aa"];
  return Object.entries(counts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,8)
    .map(([l,v], i) => ({ l, v, color: colors[i] }));
};

// ─── Playtime by month (simulated from playtime data) ─────────────────────────
export const getPlaytimeByMonth = (games) => {
  const total = games.reduce((s,g) => s+g.playtime, 0);
  const base = total / 6;
  const months = ["Oct","Nov","Dec","Jan","Feb","Mar"];
  const variance = [0.85, 0.9, 1.3, 1.0, 0.75, 1.1];
  return months.map((l, i) => ({
    l,
    v: Math.round(base * variance[i])
  }));
};

// ─── Animated counter hook ───────────────────────────────────────────────────
export const useCountUp = (target, duration = 1200) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return val;
};
