import { useState, useRef, useEffect } from "react";
import { EMOJIS, autoDetectCategories } from "../constants/data";
import GenrePicker from "../components/GenrePicker";
import LogoPicker from "../components/LogoPicker";
import GameDetail from "./GameDetail";
import { fmt } from "../utils/helpers";

export default function Library({ sg, eg, setSg, setEg, setNotify, sLinked, eLinked }) {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [sortBy, setSortBy]   = useState("name");
  const [catFilter, setCatFilter] = useState("All");
  const [addModal, setAddModal] = useState(false);
  const [achModal, setAchModal] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [newG, setNewG] = useState({ name:"", platform:"steam", playtime:0, price:0, img:"🎮", genres:[], imgUrl:"" });
  const modalRef = useRef(null);

  // Always scroll modal to top when it opens
  useEffect(() => {
    if (addModal && modalRef.current) modalRef.current.scrollTop = 0;
  }, [addModal]);

  const all = [...sg, ...eg];

  // ── Game Detail view ─────────────────────────────────────────────────────
  if (selectedGame) {
    return (
      <GameDetail
        game={selectedGame}
        onBack={() => setSelectedGame(null)}
        onUpdate={(updated) => {
          if (updated.platform === "steam") setSg(p => p.map(g => g.id===updated.id ? updated : g));
          else setEg(p => p.map(g => g.id===updated.id ? updated : g));
          setSelectedGame(updated);
        }}
        onRemove={(g) => { remove(g); setSelectedGame(null); }}
        setNotify={setNotify}
      />
    );
  }

  // ── Empty state — no accounts linked yet ────────────────────────────────────
  if (!sLinked && !eLinked && all.length === 0) {
    return (
      <div className="fadeup" style={{padding:"80px 20px",textAlign:"center",maxWidth:600,margin:"0 auto"}}>
        <div style={{fontSize:56,marginBottom:16}}>📚</div>
        <div className="orb" style={{fontSize:18,color:"var(--cyan)",marginBottom:8}}>LIBRARY IS EMPTY</div>
        <div style={{color:"var(--muted)",fontSize:14,lineHeight:1.7,marginBottom:24}}>
          Your library shows games from your linked accounts.<br/>
          Go to the <span style={{color:"var(--cyan)"}}>Accounts</span> tab to link your Steam or Epic account.
        </div>
        <div style={{color:"var(--muted)",fontSize:11,fontFamily:"Share Tech Mono",
          border:"1px solid var(--border)",padding:"10px 16px",display:"inline-block"}}>
          GO TO ACCOUNTS → LINK STEAM OR EPIC
        </div>
      </div>
    );
  }

  // Collect all unique categories
  const allCats = ["All", ...new Set(all.flatMap(g => g.categories || []))].slice(0, 12);

  const visible = [...all].filter(g => {
    const pOk = filter === "all" || g.platform === filter;
    const sOk = !search || g.name.toLowerCase().includes(search.toLowerCase())
      || (g.categories||[]).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const cOk = catFilter === "All" || (g.categories||[]).includes(catFilter);
    return pOk && sOk && cOk;
  }).sort((a,b) => {
    if (sortBy === "name")       return a.name.localeCompare(b.name);
    if (sortBy === "playtime")   return b.playtime - a.playtime;
    if (sortBy === "price")      return b.price - a.price;
    if (sortBy === "metacritic") return b.metacritic - a.metacritic;
    return 0;
  });

  const toggleWish = g => {
    const t = arr => arr.map(x => x.id === g.id ? { ...x, wishlist: !x.wishlist } : x);
    if (g.platform === "steam") setSg(t); else setEg(t);
  };

  const remove = g => {
    if (g.platform === "steam") setSg(p => p.filter(x => x.id !== g.id));
    else setEg(p => p.filter(x => x.id !== g.id));
    setNotify({ msg: `"${g.name}" removed`, type:"success" });
  };

  const add = () => {
    if (!newG.name.trim()) { setNotify({ msg:"Enter a game name", type:"error" }); return; }
    const categories = newG.genres.length > 0 ? newG.genres : ["Action"];
    const g = {
      ...newG, id: Date.now(),
      playtime: +newG.playtime, price: +newG.price,
      metacritic: 80, wishlist: false,
      categories,
      achievements: { total: 0, earned: 0 },
      imgUrl: newG.imgUrl || "",
    };
    if (g.platform === "steam") setSg(p => [...p, g]);
    else setEg(p => [...p, g]);
    setAddModal(false);
    setNewG({ name:"", platform:"steam", playtime:0, price:0, img:"🎮", genres:[], imgUrl:"" });
    setNotify({ msg: `"${g.name}" added with ${categories.length} genre(s)`, type:"success" });
  };

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:1100, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>GAME LIBRARY</div>
          <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>
            {all.length} GAMES · {all.reduce((s,g)=>s+g.playtime,0).toLocaleString()}H PLAYED
          </div>
        </div>
        <button className="btn g" onClick={() => setAddModal(true)}>+ ADD GAME</button>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
        <input className="inp" style={{ maxWidth:200, fontSize:13 }} placeholder="🔍 Search name or category..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {["all","steam","epic"].map(f => (
          <button key={f} className="btn sm"
            style={{ borderColor:filter===f?"var(--cyan)":"var(--border)", color:filter===f?"var(--cyan)":"var(--muted)" }}
            onClick={() => setFilter(f)}>
            {f === "all" ? "ALL" : f === "steam" ? "⊞ STEAM" : "◈ EPIC"}
          </button>
        ))}
        <select className="inp" style={{ width:"auto", fontSize:11, background:"#060d1b", paddingRight:8 }}
          value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="playtime">Sort: Playtime</option>
          <option value="price">Sort: Price</option>
          <option value="metacritic">Sort: Score</option>
        </select>
      </div>

      {/* Category filter chips */}
      <div style={{ display:"flex", gap:5, marginBottom:16, flexWrap:"wrap" }}>
        {allCats.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            background: catFilter===c ? "rgba(191,0,255,0.15)" : "rgba(191,0,255,0.04)",
            border:`1px solid ${catFilter===c?"var(--purple)":"rgba(191,0,255,0.2)"}`,
            color: catFilter===c ? "var(--purple)" : "var(--muted)",
            fontFamily:"Share Tech Mono", fontSize:9, padding:"3px 9px", cursor:"pointer",
            letterSpacing:1, borderRadius:2, transition:"all 0.2s",
          }}>{c}</button>
        ))}
      </div>

      {/* Game Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
        {visible.map(g => (
          <div key={g.id} className="card card-h" style={{ padding:14, display:"flex", gap:12, cursor:"pointer" }}
            onClick={() => setSelectedGame(g)}>
            <div style={{ width:56, height:56, background:"rgba(0,245,255,0.05)",
              border:"1px solid var(--border)", flexShrink:0, overflow:"hidden",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {g.imgUrl
                ? <img src={g.imgUrl} alt={g.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                    onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                  />
                : null}
              <span style={{ fontSize:26, display: g.imgUrl ? "none" : "flex", alignItems:"center", justifyContent:"center",
                width:"100%", height:"100%" }}>{g.img || "🎮"}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:4, marginBottom:4 }}>
                <div style={{ fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
                  {g.name}
                </div>
                <span className="star" style={{ color:g.wishlist?"#ffcc00":"var(--muted)", flexShrink:0 }}
                  onClick={e => { e.stopPropagation(); toggleWish(g); }}>★</span>
              </div>

              {/* Platform + auto-categories */}
              <div style={{ display:"flex", gap:4, marginBottom:5, flexWrap:"wrap" }}>
                <span className={`tag ${(g.platform||"steam") === "steam" ? "s" : "e"}`}>{(g.platform||"steam").toUpperCase()}</span>
                {(g.categories||[]).slice(0,3).map(c => <span key={c} className="tag cat">{c}</span>)}
              </div>

              <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--muted)", marginBottom:6 }}>
                <span>⏱{g.playtime}h</span>
                <span>⭐{g.metacritic}</span>
                <span className="mono" style={{ color:g.price===0?"var(--green)":"var(--cyan)" }}>
                  {g.price === 0 ? "FREE" : fmt(g.price)}
                </span>
              </div>

              {/* Achievement bar */}
              {g.achievements?.total > 0 && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:10, color:"var(--muted)" }}>🏅 Achievements</span>
                    <span className="mono" style={{ fontSize:9, color:"#ffcc00" }}>
                      {g.achievements.earned}/{g.achievements.total}
                    </span>
                  </div>
                  <div className="progress">
                    <div className="progress-fill" style={{
                      width: `${(g.achievements.earned/g.achievements.total)*100}%`,
                      background: "linear-gradient(90deg,#ffcc00,#ff6600)",
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:6 }}>
                {g.achievements?.total > 0 && (
                  <button className="btn sm" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                    onClick={e => { e.stopPropagation(); setAchModal(g); }}>🏅</button>
                )}
                <button className="btn o sm" onClick={e => { e.stopPropagation(); remove(g); }}>REMOVE</button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:50, color:"var(--muted)" }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🎮</div>
            <div className="mono">NO GAMES FOUND</div>
          </div>
        )}
      </div>

      {/* Add Game Modal */}
      {addModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setAddModal(false)}>
          <div className="modal" ref={modalRef} style={{ maxHeight:"calc(100vh - 96px)", overflowY:"auto", paddingBottom:8 }}>
            <div className="orb" style={{ color:"var(--green)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              + ADD GAME
            </div>

            {/* Name with live category preview — ALWAYS FIRST */}
            <div style={{ marginBottom:12 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                GAME NAME
              </div>
              <input className="inp" placeholder="e.g. The Witcher 3" value={newG.name}
                onChange={e => setNewG(p => ({ ...p, name: e.target.value }))} />
              {newG.name.trim() && (
                <div style={{ marginTop:6, display:"flex", gap:4, flexWrap:"wrap" }}>
                  <span className="mono" style={{ fontSize:9, color:"var(--cyan)" }}>AUTO-DETECTED: </span>
                  {autoDetectCategories(newG.name).map(c => (
                    <span key={c} className="tag cat">{c}</span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:"grid", gap:12 }}>
              {[
                ["PRICE ($)","number","price","0 for free"],
                ["HOURS PLAYED","number","playtime","0"],
              ].map(([lbl,type,key,ph]) => (
                <div key={key}>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>{lbl}</div>
                  <input className="inp" type={type} placeholder={ph} value={newG[key]}
                    onChange={e => setNewG(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}

              {/* Genre picker */}
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  GENRES <span style={{color:"var(--cyan)"}}>(SELECT MULTIPLE)</span>
                </div>
                <GenrePicker selected={newG.genres} onChange={g=>setNewG(p=>({...p,genres:g}))} />
                {newG.genres.length===0&&(
                  <div className="mono" style={{fontSize:8,color:"var(--orange)",marginTop:4}}>
                    ⚠ No genre selected — will default to "Action"
                  </div>
                )}
              </div>

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>ICON EMOJI</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {EMOJIS.map(em => (
                    <button key={em} onClick={() => setNewG(p => ({ ...p, img: em }))} style={{
                      fontSize:16,
                      background: newG.img === em ? "rgba(0,245,255,0.15)" : "rgba(0,245,255,0.03)",
                      border:`1px solid ${newG.img === em ? "var(--cyan)" : "var(--border)"}`,
                      padding:"4px 6px", cursor:"pointer",
                    }}>{em}</button>
                  ))}
                </div>
              </div>

              {/* Game logo search */}
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>
                  GAME LOGO <span style={{color:"var(--cyan)"}}>(OPTIONAL — SEARCH & PICK)</span>
                </div>
                <LogoPicker
                  gameName={newG.name}
                  imgUrl={newG.imgUrl}
                  onSelect={url => setNewG(p => ({ ...p, imgUrl: url || "" }))}
                />
              </div>

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>PLATFORM</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["steam","epic"].map(pl => (
                    <button key={pl} className={`btn sm ${pl === "epic" ? "g" : ""}`}
                      style={{ flex:1, opacity: newG.platform === pl ? 1 : 0.35 }}
                      onClick={() => setNewG(p => ({ ...p, platform: pl }))}>
                      {pl === "steam" ? "⊞ STEAM" : "◈ EPIC"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn g" style={{ flex:1 }} onClick={add}>⟶ ADD GAME</button>
              <button className="btn o" onClick={() => setAddModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      {achModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setAchModal(null)}>
          <div className="modal">
            <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:20 }}>
              <span style={{ fontSize:36 }}>{achModal.img}</span>
              <div>
                <div className="orb" style={{ color:"#ffcc00", fontSize:13, letterSpacing:2 }}>
                  🏅 ACHIEVEMENTS
                </div>
                <div style={{ fontWeight:600, fontSize:15, marginTop:2 }}>{achModal.name}</div>
              </div>
            </div>
            <div style={{ background:"rgba(255,204,0,0.05)", border:"1px solid rgba(255,204,0,0.2)", padding:16, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ color:"var(--muted)", fontSize:13 }}>Completion</span>
                <span className="orb" style={{ color:"#ffcc00", fontSize:16 }}>
                  {Math.round((achModal.achievements.earned/achModal.achievements.total)*100)}%
                </span>
              </div>
              <div className="progress" style={{ height:8 }}>
                <div className="progress-fill" style={{
                  width:`${(achModal.achievements.earned/achModal.achievements.total)*100}%`,
                  background:"linear-gradient(90deg,#ffcc00,#ff6600)",
                  boxShadow:"0 0 8px #ffcc00",
                }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span className="mono" style={{ fontSize:10, color:"#ffcc00" }}>
                  {achModal.achievements.earned} EARNED
                </span>
                <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>
                  {achModal.achievements.total - achModal.achievements.earned} REMAINING
                </span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[["PLAYTIME",`${achModal.playtime}h`],["SCORE",`${achModal.metacritic}/100`],
                ["PRICE",achModal.price===0?"FREE":fmt(achModal.price)],
                ["PLATFORM",achModal.platform.toUpperCase()]].map(([k,v]) => (
                <div key={k} style={{ background:"rgba(0,245,255,0.04)", border:"1px solid var(--border)", padding:"8px 12px" }}>
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>{k}</div>
                  <div style={{ color:"var(--cyan)", fontWeight:700, marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
            <button className="btn full" onClick={() => setAchModal(null)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}
