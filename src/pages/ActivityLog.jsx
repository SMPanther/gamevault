import { useState } from "react";
import { getActivityLog } from "../utils/storage";

// ─────────────────────────────────────────────────────────────────────────────
// ActivityLog — shows user's full account activity history
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_META = {
  login:           { icon:"🔓", label:"Signed in",           color:"var(--cyan)" },
  logout:          { icon:"🔒", label:"Signed out",          color:"var(--muted)" },
  register:        { icon:"✅", label:"Account created",     color:"var(--green)" },
  listing_created: { icon:"📋", label:"Listed account",      color:"var(--purple)" },
  listing_updated: { icon:"✏️", label:"Updated listing",     color:"var(--cyan)" },
  offer_sent:      { icon:"💬", label:"Sent offer",          color:"#ffcc00" },
  trade_posted:    { icon:"🔄", label:"Posted trade",        color:"var(--purple)" },
  trade_completed: { icon:"✓",  label:"Trade completed",     color:"var(--green)" },
  game_added:      { icon:"🎮", label:"Added game",          color:"var(--cyan)" },
  game_removed:    { icon:"🗑️", label:"Removed game",        color:"var(--orange)" },
  name_changed:    { icon:"✏️", label:"Changed display name",color:"var(--cyan)" },
  password_changed:{ icon:"🔑", label:"Changed password",    color:"var(--orange)" },
  verification:    { icon:"🛡️", label:"Verification update", color:"var(--green)" },
};

export default function ActivityLog({ user }) {
  const log = getActivityLog(user?.username);
  const [filter, setFilter] = useState("all");

  const categories = [
    { id:"all",      label:"ALL" },
    { id:"auth",     label:"AUTH",     actions:["login","logout","register","password_changed"] },
    { id:"market",   label:"MARKET",   actions:["listing_created","listing_updated","offer_sent"] },
    { id:"trades",   label:"TRADES",   actions:["trade_posted","trade_completed"] },
    { id:"library",  label:"LIBRARY",  actions:["game_added","game_removed"] },
    { id:"profile",  label:"PROFILE",  actions:["name_changed","verification"] },
  ];

  const visible = filter === "all" ? log : log.filter(e => {
    const cat = categories.find(c => c.id === filter);
    return cat?.actions?.includes(e.action);
  });

  return (
    <div className="fadeup" style={{ padding:"24px 20px", maxWidth:800, margin:"0 auto" }}>
      <div style={{ marginBottom:18 }}>
        <div className="orb" style={{ fontSize:18, fontWeight:700, color:"var(--cyan)" }}>📋 ACTIVITY LOG</div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:9, letterSpacing:2 }}>
          FULL ACCOUNT HISTORY · {log.length} EVENTS
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)} style={{
            fontFamily:"Share Tech Mono", fontSize:9, padding:"4px 12px", cursor:"pointer",
            background: filter===cat.id ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${filter===cat.id ? "var(--cyan)" : "rgba(255,255,255,0.1)"}`,
            color: filter===cat.id ? "var(--cyan)" : "var(--muted)",
            letterSpacing:1,
          }}>{cat.label}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--muted)", border:"1px solid var(--border)" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
          <div className="mono" style={{ fontSize:10, letterSpacing:2 }}>NO ACTIVITY YET</div>
          <div style={{ fontSize:12, marginTop:6 }}>Your actions will appear here as you use GameVault</div>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          {visible.map((entry, i) => {
            const meta = ACTION_META[entry.action] || { icon:"◈", label:entry.action, color:"var(--muted)" };
            return (
              <div key={entry.id} style={{
                display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px",
                borderBottom: i < visible.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: i % 2 === 0 ? "rgba(0,245,255,0.01)" : "none",
              }}>
                {/* Timeline dot */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, paddingTop:2, flexShrink:0 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%",
                    background:`${meta.color}15`, border:`1px solid ${meta.color}44`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                    {meta.icon}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:4 }}>
                    <div>
                      <span style={{ fontWeight:600, fontSize:13, color:meta.color }}>{meta.label}</span>
                      {entry.detail && (
                        <span style={{ fontSize:12, color:"var(--muted)", marginLeft:8 }}>{entry.detail}</span>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize:9, color:"var(--muted)", flexShrink:0 }}>
                      {entry.date} · {entry.time}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
