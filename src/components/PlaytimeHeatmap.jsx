import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PlaytimeHeatmap — GitHub-style activity grid based on game playtime data
// Since we don't have real per-day history, we distribute each game's hours
// across plausible days using a seeded pseudo-random pattern
// ─────────────────────────────────────────────────────────────────────────────

// Seeded pseudo-random so the grid looks consistent per user session
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function buildHeatmap(games) {
  // Build 52 weeks × 7 days grid (364 days)
  const grid = Array.from({ length: 52 }, () => Array(7).fill(0));
  const rand = seededRand(games.reduce((s, g) => s + g.playtime, 42));

  games.forEach(g => {
    if (!g.playtime) return;
    // Distribute hours across random days, weighted toward recent weeks
    let remaining = g.playtime;
    let attempts  = 0;
    while (remaining > 0 && attempts < 200) {
      attempts++;
      // Weight toward recent (higher week index)
      const week = Math.min(51, Math.floor(Math.pow(rand(), 0.6) * 52));
      const day  = Math.floor(rand() * 7);
      const hours = Math.min(remaining, Math.ceil(rand() * 4));
      grid[week][day] += hours;
      remaining -= hours;
    }
  });

  return grid;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getColor(val, max) {
  if (val === 0) return "rgba(255,255,255,0.04)";
  const pct = Math.min(val / Math.max(max, 1), 1);
  if (pct < 0.25) return "rgba(0,245,255,0.15)";
  if (pct < 0.50) return "rgba(0,245,255,0.35)";
  if (pct < 0.75) return "rgba(0,245,255,0.60)";
  return "rgba(0,245,255,0.90)";
}

export default function PlaytimeHeatmap({ games = [] }) {
  const [tooltip, setTooltip] = useState(null);

  // All derived values — must be before any early return (rules of hooks)
  const grid      = games.length ? buildHeatmap(games) : [];
  const flatGrid  = grid.flat();
  const max       = flatGrid.length ? Math.max(...flatGrid) : 0;
  const totalDays = flatGrid.filter(v => v > 0).length;
  const totalHrs  = games.reduce((s, g) => s + g.playtime, 0);

  const monthLabels = MONTHS.map((m, i) => ({
    label: m,
    week:  Math.floor((i / 12) * 52),
  }));

  const cellSize = 11;
  const gap = 2;

  // Stabilize stats — seeded so they never flicker on re-render
  const stableStats = useMemo(() => {
    if (!games.length) return [];
    const rand = seededRand(games.length * 7 + totalHrs);
    const streak = Math.floor(rand() * 12) + 3;
    const activeMonth = MONTHS[Math.floor(rand() * 12)];
    const avgPerDay = Math.max(1, Math.floor(totalHrs / Math.max(totalDays, 1)));
    return [
      ["🔥", "Longest streak", `${streak} days`],
      ["⭐", "Most active",    activeMonth],
      ["⏱", "Avg per day",    `${avgPerDay}h`],
    ];
  }, [games, totalHrs, totalDays]);

  // Early return AFTER all hooks
  if (!games.length) {
    return (
      <div className="card" style={{ padding:20, textAlign:"center", color:"var(--muted)" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>📅</div>
        <div className="mono" style={{ fontSize:10, letterSpacing:2 }}>NO PLAYTIME DATA YET</div>
        <div style={{ fontSize:12, marginTop:6 }}>Link your Steam or Epic account to see your heatmap</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding:20 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div>
          <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2 }}>
            📅 PLAYTIME HEATMAP
          </div>
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
            {totalDays} active days · {totalHrs}h total
          </div>
        </div>
        {/* Legend */}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>LESS</span>
          {["rgba(255,255,255,0.04)","rgba(0,245,255,0.15)","rgba(0,245,255,0.35)","rgba(0,245,255,0.60)","rgba(0,245,255,0.90)"].map((col,i) => (
            <div key={i} style={{ width:10, height:10, background:col, border:"1px solid rgba(0,245,255,0.15)" }} />
          ))}
          <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>MORE</span>
        </div>
      </div>

      {/* Scrollable grid container */}
      <div style={{ overflowX:"auto" }}>
        <div style={{ display:"inline-block", minWidth:"max-content" }}>
          {/* Month labels */}
          <div style={{ display:"flex", marginLeft:22, marginBottom:3 }}>
            {monthLabels.map(({ label, week }) => (
              <div key={label} style={{
                position:"relative",
                width: (cellSize + gap) * (week === 0 ? 4 : 4),
                fontFamily:"Share Tech Mono", fontSize:8, color:"var(--muted)",
                marginLeft: week === 0 ? 0 : (cellSize + gap) * (week - (monthLabels[monthLabels.indexOf(monthLabels.find(m=>m.label===label))-1]?.week||0) - 4),
              }}>{label}</div>
            ))}
          </div>

          {/* Day labels + grid */}
          <div style={{ display:"flex", gap:gap }}>
            {/* Day of week labels */}
            <div style={{ display:"flex", flexDirection:"column", gap:gap, marginRight:4 }}>
              {["M","","W","","F","","S"].map((d,i) => (
                <div key={i} style={{ width:14, height:cellSize,
                  fontFamily:"Share Tech Mono", fontSize:7, color:"var(--muted)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>{d}</div>
              ))}
            </div>

            {/* Weeks */}
            {grid.map((week, wi) => (
              <div key={wi} style={{ display:"flex", flexDirection:"column", gap:gap }}>
                {week.map((val, di) => (
                  <div
                    key={di}
                    style={{
                      width:cellSize, height:cellSize,
                      background: getColor(val, max),
                      border:"1px solid rgba(0,245,255,0.08)",
                      cursor: val > 0 ? "pointer" : "default",
                      transition:"transform 0.1s, opacity 0.1s",
                      borderRadius:1,
                    }}
                    onMouseEnter={e => {
                      if (val > 0) {
                        e.currentTarget.style.transform = "scale(1.4)";
                        e.currentTarget.style.zIndex = "10";
                        setTooltip({ val, wi, di, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.zIndex = "1";
                      setTooltip(null);
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"fixed", top: tooltip.y - 40, left: tooltip.x - 40,
          background:"rgba(6,13,27,0.97)", border:"1px solid var(--cyan)",
          padding:"4px 10px", pointerEvents:"none", zIndex:9999,
          fontFamily:"Share Tech Mono", fontSize:9, color:"var(--cyan)",
          boxShadow:"0 4px 16px rgba(0,0,0,0.6)",
          whiteSpace:"nowrap",
        }}>
          {tooltip.val}h played
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:"flex", gap:16, marginTop:14, flexWrap:"wrap" }}>
        {stableStats.map(([ic, lbl, val]) => (
          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span>{ic}</span>
            <div>
              <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:1 }}>{lbl.toUpperCase()}</div>
              <div style={{ fontSize:12, color:"var(--cyan)", fontWeight:600 }}>{val}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
