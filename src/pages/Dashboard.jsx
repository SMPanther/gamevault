import { useState } from "react";
import { BarChart, PieChart, AnimCounter, Sparkline } from "../components/Charts";
import { fmt, calcSteam, calcEpic, getGenreSlices, getPlaytimeByMonth } from "../utils/helpers";
import { VAL_METHODS } from "../constants/data";
import { NEWS_DB, FREE_GAMES_DB } from "../constants/ownerData";
import PlaytimeHeatmap from "../components/PlaytimeHeatmap";

export default function Dashboard({ sg, eg, sLinked, eLinked, sProf, eProf, wishExtras, setActive, ownerTick }) {
  const [newsFilter, setNewsFilter] = useState("All");
  const sv  = sLinked ? calcSteam(sg, sProf.level, sProf.badges) : 0;
  const ev  = eLinked ? calcEpic(eg)  : 0;
  const all = [...sg, ...eg];
  const totalH = all.reduce((s, g) => s + g.playtime, 0);

  // ── Charts data ──────────────────────────────────────────────
  const genreSlices    = getGenreSlices(all);
  const playtimeMonths = getPlaytimeByMonth(all);   // uses real playtime now
  const top6           = [...all].sort((a,b) => b.playtime - a.playtime).slice(0,6)
    .map(g => ({ l: g.name.slice(0,7), v: g.playtime }));

  // ── Stats ────────────────────────────────────────────────────
  const stats = [
    { label:"TOTAL VALUE", value:sv+ev,       prefix:"$",  suffix:"",  color:"var(--cyan)",   icon:"◈", fmt:true },
    { label:"STEAM VALUE", value:sv,           prefix:"$",  suffix:"",  color:"#1a9fff",       icon:"⊞", fmt:true },
    { label:"EPIC VALUE",  value:ev,           prefix:"$",  suffix:"",  color:"var(--green)",  icon:"◈", fmt:true },
    { label:"GAMES",       value:all.length,   prefix:"",   suffix:"",  color:"var(--purple)", icon:"◫", fmt:false },
    { label:"HOURS",       value:totalH,       prefix:"",   suffix:"h", color:"var(--orange)", icon:"⏱", fmt:false },
    { label:"WISHLIST",    value:all.filter(g=>g.wishlist).length+(wishExtras?.length||0),
                                               prefix:"",   suffix:"",  color:"#ffcc00",       icon:"★", fmt:false },
  ];

  const newsTags = ["All","Release","Sale","Free","News","Esports","Update"];
  const visibleNews = NEWS_DB.filter(n => newsFilter === "All" || n.tag === newsFilter);

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>VAULT DASHBOARD</div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>REAL-TIME ACCOUNT OVERVIEW</div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="g3" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:22 }}>
        {stats.map(s => (
          <div key={s.label} className="stat card">
            <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
            <div className="orb" style={{ fontSize:20, fontWeight:700, color:s.color, textShadow:`0 0 10px ${s.color}` }}>
              <AnimCounter
                value={s.fmt ? Number(s.value.toFixed(2)) : s.value}
                prefix={s.prefix}
                suffix={s.suffix}
              />
            </div>
            <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:18 }}>
          <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:3 }}>
            TOP GAMES BY HOURS
          </div>
          <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:6 }}>
            {all.length > 0 ? `${all.length} GAMES · ${totalH.toLocaleString()} TOTAL HOURS` : "NO GAMES YET"}
          </div>
          {top6.length > 0
            ? <BarChart data={top6} color="#00f5ff" />
            : <div className="mono" style={{ color:"var(--muted)", fontSize:11, padding:"20px 0" }}>
                Link accounts to see playtime data
              </div>
          }
        </div>

        <div className="card" style={{ padding:18 }}>
          <div className="orb" style={{ fontSize:10, color:"var(--purple)", letterSpacing:2, marginBottom:3 }}>
            GENRE BREAKDOWN
          </div>
          <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:10 }}>
            AUTO-DETECTED CATEGORIES
          </div>
          {genreSlices.length > 0
            ? <PieChart slices={genreSlices} />
            : <div className="mono" style={{ color:"var(--muted)", fontSize:11, padding:"20px 0" }}>
                Add games to see genre breakdown
              </div>
          }
        </div>
      </div>

      {/* ── Monthly Playtime (real data) ───────────────────────── */}
      <div className="card" style={{ padding:18, marginBottom:16 }}>
        <div className="orb" style={{ fontSize:10, color:"var(--orange)", letterSpacing:2, marginBottom:3 }}>
          MONTHLY PLAYTIME ESTIMATE
        </div>
        <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:6 }}>
          BASED ON YOUR LIBRARY · HOURS / MONTH
        </div>
        {totalH > 0
          ? <BarChart data={playtimeMonths} color="#ff6600" />
          : <div className="mono" style={{ color:"var(--muted)", fontSize:11, padding:"20px 0" }}>
              Link your accounts to see playtime trends
            </div>
        }
      </div>

      {/* ── Epic Free Games Tracker ────────────────────────────── */}
      <div className="card" style={{ padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div>
            <div className="orb" style={{ fontSize:10, color:"var(--green)", letterSpacing:2 }}>◈ EPIC FREE GAMES</div>
            <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:2 }}>CLAIM BEFORE THEY EXPIRE</div>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 6px var(--green)", marginTop:2 }}/>
            <span className="mono" style={{ fontSize:9, color:"var(--green)" }}>LIVE</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {FREE_GAMES_DB.map(g => (
            <div key={g.id} className="card-h" style={{
              background:"rgba(57,255,20,0.04)", border:"1px solid rgba(57,255,20,0.18)",
              padding:12, display:"flex", gap:10, alignItems:"center",
            }}>
              <span style={{ fontSize:24 }}>{g.img}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {g.name}
                </div>
                <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                  {g.categories.slice(0,2).map(c => <span key={c} className="tag cat">{c}</span>)}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:5 }}>
                  <span style={{ color:"var(--green)", fontWeight:700, fontSize:12 }}>FREE</span>
                  <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>until {g.endDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Game News Feed ─────────────────────────────────────── */}
      <div className="card" style={{ padding:18, marginBottom:16 }}>
        <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:10 }}>
          📰 GAME NEWS FEED
        </div>
        {/* News filter tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {newsTags.map(t => (
            <button key={t} className="btn sm" style={{
              borderColor: newsFilter === t ? "var(--cyan)" : "var(--border)",
              color: newsFilter === t ? "var(--cyan)" : "var(--muted)",
              padding:"4px 10px",
            }} onClick={() => setNewsFilter(t)}>{t}</button>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {visibleNews.map(n => {
            const tagColors = {Release:"#bf00ff",Sale:"#39ff14",Free:"#39ff14",News:"#00f5ff",Esports:"#ff6600",Update:"#ffcc00",Event:"#ff77aa"};
            const tc = tagColors[n.tag] || "#00f5ff";
            return (
              <div key={n.id} className="card-h" style={{
                background:"rgba(0,245,255,0.02)", border:"1px solid var(--border)",
                overflow:"hidden", cursor:"pointer",
              }}>
                {/* Image above headline — real image or emoji template */}
                {n.imgUrl ? (
                  <img src={n.imgUrl} alt="" onError={e=>e.target.style.display='none'}
                    style={{width:"100%",height:120,objectFit:"cover",display:"block"}} />
                ) : (
                  <div style={{
                    width:"100%",height:72,
                    background:`linear-gradient(135deg,${tc}18,${tc}06)`,
                    borderBottom:`1px solid ${tc}22`,
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"0 18px",
                  }}>
                    <span style={{fontSize:36}}>{n.img}</span>
                    <span className="news-tag" style={{
                      background:`${tc}18`,color:tc,border:`1px solid ${tc}44`,fontSize:10,
                    }}>{n.tag}</span>
                  </div>
                )}
                <div style={{padding:"10px 14px"}}>
                  {/* Title */}
                  <div style={{fontSize:13,fontWeight:600,marginBottom:4,lineHeight:1.4}}>
                    {n.title}
                  </div>
                  {/* Description */}
                  {n.description && (
                    <div style={{fontSize:11,color:"var(--muted)",marginBottom:6,lineHeight:1.5,
                      overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                      {n.description}
                    </div>
                  )}
                  {/* Footer */}
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    {n.sourceUrl ? (
                      <a href={n.sourceUrl} target="_blank" rel="noreferrer"
                        onClick={e=>e.stopPropagation()}
                        style={{fontFamily:"Share Tech Mono",fontSize:9,color:"var(--cyan)",
                          textDecoration:"none"}}>
                        {n.source} →
                      </a>
                    ) : (
                      <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>{n.source}</span>
                    )}
                    <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>· {n.time}</span>
                    {n.pinned && <span className="mono" style={{fontSize:8,color:"var(--purple)"}}>📌 PINNED</span>}
                    {n.imgUrl && (
                      <span className="news-tag" style={{
                        background:`${tc}18`,color:tc,border:`1px solid ${tc}44`,marginLeft:"auto",
                      }}>{n.tag}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Valuation Method ───────────────────────────────────── */}
      <div className="card" style={{ padding:18, marginBottom:18 }}>
        <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:12 }}>
          ◈ HOW WE VALUE YOUR ACCOUNTS
        </div>
        <div className="g2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))", gap:10 }}>
          {VAL_METHODS.map((m, i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{
                minWidth:18, height:18, border:"1px solid var(--cyan)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:9, fontFamily:"Orbitron", color:"var(--cyan)", flexShrink:0,
              }}>{i+1}</div>
              <div>
                <div className="mono" style={{ fontSize:10, color:"var(--txt)", marginBottom:1 }}>{m.k}</div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>{m.v}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:"8px 12px", background:"rgba(57,255,20,0.04)",
          border:"1px solid rgba(57,255,20,0.15)", fontSize:11 }}>
          <span className="mono" style={{ color:"var(--green)" }}>DATA SOURCES: </span>
          <span style={{ color:"var(--muted)" }}>PlayerAuctions.com · G2G.com · Steam Community Market · Epic Games Store</span>
        </div>
      </div>

      {/* ── Quick Links ────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <button className="btn" onClick={() => setActive("library")}>⟶ LIBRARY</button>
        <button className="btn g" onClick={() => setActive("market")}>⟶ MARKETPLACE</button>
        <button className="btn p" onClick={() => setActive("wishlist")}>⟶ WISHLIST</button>
        <button className="btn" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
          onClick={() => setActive("accounts")}>⟶ LINK ACCOUNTS</button>
      </div>
      {/* ── Playtime Heatmap ─────────────────────────────────── */}
      <div style={{ marginBottom:22 }}>
        <PlaytimeHeatmap games={all} />
      </div>
    </div>
  );
}
