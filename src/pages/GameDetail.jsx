import { useState } from "react";
import { fmt } from "../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// GameDetail — full page view for a single game in the library
// ─────────────────────────────────────────────────────────────────────────────
export default function GameDetail({ game, onBack, onUpdate, onRemove, setNotify }) {
  const g = game;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:     g.name,
    playtime: g.playtime,
    price:    g.price,
    note:     g.note || "",
    rating:   g.rating || 0,
    status:   g.status || "unplayed", // unplayed | playing | completed | dropped
  });
  const [tab, setTab] = useState("overview"); // overview | achievements | stats

  const save = () => {
    onUpdate({ ...g, ...form, playtime:+form.playtime, price:+form.price, rating:+form.rating });
    setEditing(false);
    setNotify({ msg: `"${form.name}" updated`, type:"success" });
  };

  const statusColors = { unplayed:"var(--muted)", playing:"var(--cyan)", completed:"var(--green)", dropped:"var(--orange)" };
  const statusIcons  = { unplayed:"○", playing:"▶", completed:"✓", dropped:"✕" };

  const achPct = g.achievements?.total > 0
    ? Math.round((g.achievements.earned / g.achievements.total) * 100)
    : 0;

  // Fake monthly playtime bars from total (since we don't have real history)
  const barData = Array.from({length:6}, (_,i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun"][i],
    hours: Math.max(0, Math.round(g.playtime * (0.05 + Math.random()*0.25))),
  }));
  const maxH = Math.max(...barData.map(b=>b.hours), 1);

  return (
    <div className="fadeup" style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>

      {/* ── Back + header ─────────────────────────────────────── */}
      <button className="btn sm" style={{ marginBottom:18 }} onClick={onBack}>← BACK TO LIBRARY</button>

      <div style={{ display:"flex", gap:20, alignItems:"flex-start", marginBottom:24, flexWrap:"wrap" }}>
        {/* Cover art / emoji */}
        <div style={{
          width:120, height:120, flexShrink:0, overflow:"hidden",
          border:"1px solid var(--border)", background:"rgba(0,245,255,0.04)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {g.imgUrl
            ? <img src={g.imgUrl} alt={g.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
                onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
            : null}
          <span style={{ fontSize:48, display: g.imgUrl?"none":"flex", alignItems:"center", justifyContent:"center",
            width:"100%", height:"100%" }}>{g.img || "🎮"}</span>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:200 }}>
          {editing ? (
            <input className="inp" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
              style={{ fontSize:22, fontFamily:"Orbitron", fontWeight:700, marginBottom:10 }} />
          ) : (
            <div className="orb" style={{ fontSize:22, fontWeight:700, marginBottom:8, lineHeight:1.2 }}>{g.name}</div>
          )}

          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            <span className={`tag ${g.platform==="steam"?"s":"e"}`}>{(g.platform||"steam").toUpperCase()}</span>
            {(g.categories||[]).map(c => <span key={c} className="tag cat">{c}</span>)}
            {/* Status badge */}
            {editing ? (
              <select className="inp" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}
                style={{ width:"auto", fontSize:11, padding:"2px 8px", height:24 }}>
                {["unplayed","playing","completed","dropped"].map(s=>(
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            ) : (
              <span className="mono" style={{ fontSize:9, padding:"2px 8px", border:"1px solid",
                borderColor: statusColors[g.status||"unplayed"],
                color: statusColors[g.status||"unplayed"], background:"rgba(0,0,0,0.3)" }}>
                {statusIcons[g.status||"unplayed"]} {(g.status||"UNPLAYED").toUpperCase()}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:12 }}>
            {[
              ["⏱", editing ? null : `${g.playtime}h`, "PLAYTIME"],
              ["⭐", g.metacritic, "SCORE"],
              ["💰", g.price===0?"FREE":fmt(g.price), "VALUE"],
            ].map(([ic, val, lbl]) => (
              <div key={lbl} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18 }}>{ic}</div>
                {lbl==="PLAYTIME" && editing ? (
                  <input className="inp" type="number" value={form.playtime}
                    onChange={e=>setForm(p=>({...p,playtime:e.target.value}))}
                    style={{ width:70, fontSize:13, padding:"2px 6px", textAlign:"center" }} />
                ) : (
                  <div className="orb" style={{ fontSize:15, color:"var(--cyan)", fontWeight:700 }}>{val}</div>
                )}
                <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>{lbl}</div>
              </div>
            ))}
            {/* Personal rating */}
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:18 }}>🏅</div>
              {editing ? (
                <div style={{ display:"flex", gap:2, marginBottom:2 }}>
                  {[1,2,3,4,5].map(n=>(
                    <span key={n} onClick={()=>setForm(p=>({...p,rating:n}))}
                      style={{ fontSize:18, cursor:"pointer", color:n<=form.rating?"#ffcc00":"var(--muted)" }}>★</span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize:14 }}>
                  {"★".repeat(g.rating||0)}{"☆".repeat(5-(g.rating||0))}
                </div>
              )}
              <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>MY RATING</div>
            </div>
          </div>

          {/* Note */}
          {editing ? (
            <textarea className="inp" rows={2} placeholder="Add a note about this game..."
              value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))}
              style={{ resize:"none", fontSize:13, lineHeight:1.5 }} />
          ) : g.note ? (
            <div style={{ borderLeft:"2px solid rgba(0,245,255,0.25)", paddingLeft:10,
              color:"var(--muted)", fontStyle:"italic", fontSize:13 }}>{g.note}</div>
          ) : null}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            {editing ? (
              <>
                <button className="btn g sm" onClick={save}>⟶ SAVE</button>
                <button className="btn sm" onClick={()=>setEditing(false)}>CANCEL</button>
              </>
            ) : (
              <>
                <button className="btn sm" onClick={()=>setEditing(true)}>✏ EDIT</button>
                <button className="btn o sm" onClick={()=>{ onRemove(g); onBack(); }}>🗑 REMOVE</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sub-tabs ──────────────────────────────────────────── */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:18 }}>
        {[["overview","◈ OVERVIEW"],["achievements","🏅 ACHIEVEMENTS"],["stats","📊 STATS"]].map(([id,lbl])=>(
          <button key={id} className={`ntab${tab===id?" act":""}`} style={{ fontSize:10, padding:"0 20px", height:40 }}
            onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── OVERVIEW tab ─────────────────────────────────────── */}
      {tab==="overview" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="g2">
          <div className="card" style={{ padding:16 }}>
            <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2, marginBottom:12 }}>◈ GAME INFO</div>
            {[
              ["Platform",    (g.platform||"steam").toUpperCase()],
              ["Price",       g.price===0?"FREE":fmt(g.price)],
              ["Hours",       `${g.playtime}h played`],
              ["Meta score",  g.metacritic || "N/A"],
              ["Status",      (g.status||"UNPLAYED").toUpperCase()],
              ["Categories",  (g.categories||[]).join(", ")||"None"],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                borderBottom:"1px solid rgba(255,255,255,0.04)", padding:"7px 0", fontSize:13 }}>
                <span style={{ color:"var(--muted)" }}>{k}</span>
                <span style={{ color:"var(--cyan)", fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Achievement summary */}
          <div className="card" style={{ padding:16 }}>
            <div className="mono" style={{ fontSize:9, color:"#ffcc00", letterSpacing:2, marginBottom:12 }}>🏅 ACHIEVEMENT PROGRESS</div>
            {g.achievements?.total > 0 ? (
              <>
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div className="orb" style={{ fontSize:40, fontWeight:900, color:"#ffcc00",
                    textShadow:"0 0 20px #ffcc0088" }}>{achPct}%</div>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
                    {g.achievements.earned} / {g.achievements.total} UNLOCKED
                  </div>
                </div>
                <div className="progress" style={{ marginBottom:12 }}>
                  <div className="progress-fill" style={{
                    width:`${achPct}%`,
                    background:`linear-gradient(90deg,#ffcc00,${achPct===100?"var(--green)":"#ff9900"})`,
                  }} />
                </div>
                {achPct===100 && (
                  <div className="mono" style={{ textAlign:"center", color:"var(--green)", fontSize:10, letterSpacing:2 }}>
                    ✓ PLATINUM COMPLETE
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:"center", color:"var(--muted)", padding:"20px 0", fontSize:13 }}>
                No achievement data
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS tab ─────────────────────────────────── */}
      {tab==="achievements" && (
        <div className="card" style={{ padding:16 }}>
          <div className="mono" style={{ fontSize:9, color:"#ffcc00", letterSpacing:2, marginBottom:14 }}>
            🏅 ACHIEVEMENTS — {g.achievements?.earned||0}/{g.achievements?.total||0}
          </div>
          {!g.achievements?.total ? (
            <div style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No achievement data for this game.</div>
          ) : (
            <>
              <div className="progress" style={{ marginBottom:14 }}>
                <div className="progress-fill" style={{ width:`${achPct}%`,
                  background:"linear-gradient(90deg,#ffcc00,#ff9900)" }} />
              </div>
              {/* Generate achievement rows */}
              {Array.from({length: Math.min(g.achievements.total, 20)}, (_,i) => {
                const earned = i < g.achievements.earned;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0",
                    borderBottom:"1px solid rgba(255,255,255,0.04)",
                    opacity: earned ? 1 : 0.35 }}>
                    <div style={{ width:32, height:32, background: earned?"rgba(255,204,0,0.15)":"rgba(255,255,255,0.05)",
                      border:`1px solid ${earned?"#ffcc0055":"rgba(255,255,255,0.1)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:16 }}>{earned?"🏅":"🔒"}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color: earned?"var(--txt)":"var(--muted)" }}>
                        Achievement {i+1}
                      </div>
                      <div className="mono" style={{ fontSize:9, color: earned?"#ffcc00":"var(--muted)" }}>
                        {earned ? "UNLOCKED" : "LOCKED"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── STATS tab ─────────────────────────────────────────── */}
      {tab==="stats" && (
        <div style={{ display:"grid", gap:14 }}>
          <div className="card" style={{ padding:16 }}>
            <div className="mono" style={{ fontSize:9, color:"var(--purple)", letterSpacing:2, marginBottom:14 }}>
              📊 ESTIMATED MONTHLY PLAYTIME
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:100 }}>
              {barData.map(b => (
                <div key={b.month} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div className="mono" style={{ fontSize:8, color:"var(--cyan)" }}>{b.hours}h</div>
                  <div style={{ width:"100%", background:"rgba(191,0,255,0.7)", borderRadius:"2px 2px 0 0",
                    height: `${(b.hours/maxH)*70}px`, minHeight:2 }} />
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)" }}>{b.month}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding:16 }}>
            <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2, marginBottom:14 }}>
              ◈ VALUE ANALYSIS
            </div>
            {[
              ["Purchase price",  g.price===0?"FREE":fmt(g.price)],
              ["Hours played",    `${g.playtime}h`],
              ["Cost per hour",   g.playtime>0&&g.price>0 ? fmt(g.price/g.playtime)+"/hr" : "—"],
              ["Value rating",    g.playtime>10&&g.price>0 ? (g.price/g.playtime<2?"💚 Excellent":"💛 Good") : "—"],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                borderBottom:"1px solid rgba(255,255,255,0.04)", padding:"8px 0", fontSize:13 }}>
                <span style={{ color:"var(--muted)" }}>{k}</span>
                <span style={{ color:"var(--cyan)", fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
