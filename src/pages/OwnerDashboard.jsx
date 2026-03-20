import { useState, useEffect } from "react";
import { NEWS_DB, FREE_GAMES_DB, REPORTS_DB,
  addNews, deleteNews, updateNews, pinNews,
  addFreeGame, deleteFreeGame, updateFreeGame,
  resolveReport, dismissReport, VISIT_LOG, recordVisit } from "../constants/ownerData";
import { getAllUsers, toggleBan, adminResetPassword, VERIFICATION_QUEUE, approveVerification, rejectVerification } from "../constants/auth";
import { BarChart } from "../components/Charts";
import LogoPicker from "../components/LogoPicker";

const NEWS_TAGS = ["Release","Sale","Free","News","Esports","Update","Event"];
const NEWS_EMOJIS = ["🎮","💸","🎁","⚔️","🏆","🧙","🚀","🔥","📢","🌟","🛡️","🔬"];
const GAME_EMOJIS  = ["🎮","⚔️","🔫","🚗","🌆","🧙","🎯","🚀","🔦","🏆","🧟","💀","🔮","🐉","📦","👻","🔬","🗡️"];

export default function OwnerDashboard({ owner, onLogout, setGlobalNotify, onDataChange }) {
  const [tab, setTab] = useState("analytics");
  const [, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  useEffect(() => { recordVisit(); }, []); // log each owner dashboard session

  // News state
  const [newsModal,   setNewsModal]   = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [nForm, setNForm] = useState({ title:"", source:"", sourceUrl:"", description:"", tag:"News", img:"🎮", imgUrl:"" });

  // Free games state
  const [fgModal,   setFgModal]   = useState(false);
  const [editingFg, setEditingFg] = useState(null);
  const [fgForm, setFgForm] = useState({ name:"", img:"🎮", endDate:"", originalPrice:"", metacritic:"", categories:"", imgUrl:"" });

  // Users state
  const [resetModal,   setResetModal]   = useState(null);
  const [newAdminPw,   setNewAdminPw]   = useState("");
  const [userSearch,   setUserSearch]   = useState("");

  // Verification state
  const [verifyModal,  setVerifyModal]  = useState(null);   // entry being reviewed
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const PREDEFINED_REASONS = [
    "Screenshot is unclear or too blurry",
    "Screenshot does not show the required information",
    "Screenshot appears to be edited or fake",
    "Wrong screenshot uploaded (not Steam library/profile)",
    "Username in screenshot does not match your account",
    "Both screenshots must be from the same account",
  ];

  const tabs = [
    { id:"analytics", label:"Analytics",   icon:"📊" },
    { id:"news",      label:"News",        icon:"📰" },
    { id:"freegames", label:"Free Games",  icon:"🎁" },
    { id:"users",     label:"Users",       icon:"👥" },
    { id:"reports",   label:"Reports",     icon:"🚨" },
    { id:"verify",    label:"Verification",icon:"🛡️" },
  ];

  // ── News handlers ──────────────────────────────────────────────
  const openAddNews  = () => { setEditingNews(null); setNForm({title:"",source:"",tag:"News",img:"🎮"}); setNewsModal(true); };
  const openEditNews = n  => { setEditingNews(n);    setNForm({title:n.title,source:n.source,sourceUrl:n.sourceUrl||'',description:n.description||'',tag:n.tag,img:n.img,imgUrl:n.imgUrl||''}); setNewsModal(true); };
  const saveNews = () => {
    if (!nForm.title.trim() || !nForm.source.trim()) { setGlobalNotify({msg:"Fill title & source",type:"error"}); return; }
    if (editingNews) updateNews({ ...editingNews, ...nForm });
    else addNews(nForm);
    setNewsModal(false); refresh();
    setGlobalNotify({ msg: editingNews ? "News updated!" : "News posted!", type:"success" }); if(onDataChange) onDataChange();
  };

  // ── Free games handlers ────────────────────────────────────────
  const openAddFg  = () => { setEditingFg(null); setFgForm({name:"",img:"🎮",endDate:"",originalPrice:"",metacritic:"",categories:""}); setFgModal(true); };
  const openEditFg = g  => { setEditingFg(g); setFgForm({name:g.name,img:g.img,endDate:g.endDate,originalPrice:g.originalPrice,metacritic:g.metacritic,categories:(g.categories||[]).join(", "),imgUrl:g.imgUrl||''}); setFgModal(true); };
  const saveFg = () => {
    if (!fgForm.name.trim() || !fgForm.endDate.trim()) { setGlobalNotify({msg:"Fill name & end date",type:"error"}); return; }
    const item = { ...fgForm, originalPrice:+fgForm.originalPrice||0, metacritic:+fgForm.metacritic||80,
      categories: fgForm.categories.split(",").map(s=>s.trim()).filter(Boolean),
      imgUrl: fgForm.imgUrl||"" };
    if (editingFg) updateFreeGame({ ...editingFg, ...item });
    else addFreeGame(item);
    setFgModal(false); refresh();
    setGlobalNotify({ msg: editingFg ? "Game updated!" : "Free game added!", type:"success" }); if(onDataChange) onDataChange();
  };

  const users = getAllUsers().filter(u =>
    !userSearch || u.username.includes(userSearch.toLowerCase()) || u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ minHeight:"100vh" }}>
      {/* Owner nav */}
      <div style={{ background:"rgba(5,8,16,0.96)", borderBottom:"1px solid rgba(191,0,255,0.3)",
        backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", padding:"0 20px", gap:4, overflowX:"auto" }}>
        <div className="orb" style={{ fontSize:14, fontWeight:900, letterSpacing:3, marginRight:16, whiteSpace:"nowrap",
          color:"var(--purple)", textShadow:"0 0 8px var(--purple)" }}>
          ⚙ OWNER PANEL
        </div>
        <div style={{ display:"flex", flex:1 }}>
          {tabs.map(t => (
            <button key={t.id} className={`ntab${tab===t.id?" act":""}`}
              style={{ color: tab===t.id ? "var(--purple)" : undefined,
                borderBottomColor: tab===t.id ? "var(--purple)" : undefined,
                textShadow: tab===t.id ? "0 0 8px var(--purple)" : undefined }}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ background:"rgba(191,0,255,0.1)", border:"1px solid rgba(191,0,255,0.3)",
            padding:"3px 10px", fontFamily:"Orbitron", fontSize:10, color:"var(--purple)" }}>
            ⚙ {owner.name}
          </div>
          <button className="btn o sm" onClick={onLogout}>LOGOUT</button>
        </div>
      </div>

      <div className="fadeup" style={{ padding:"28px 20px", maxWidth:1100, margin:"0 auto" }}>

        {/* ── ANALYTICS ─────────────────────────────────────── */}
        {tab==="analytics" && (() => {
          const users       = getAllUsers();
          const verifyPending = VERIFICATION_QUEUE.filter(v=>v.status==="pending").length;
          const visitData   = VISIT_LOG.length > 0 ? VISIT_LOG : [];
          const hasVisits   = visitData.length > 0;

          return (
          <div>
            <div style={{ marginBottom:22 }}>
              <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--purple)" }}>SITE ANALYTICS</div>
              <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>LIVE PLATFORM OVERVIEW — DATA UPDATES AS USERS INTERACT</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:22 }}>
              {[
                { label:"REGISTERED USERS",  value:users.length,                                          color:"var(--cyan)",   icon:"👥" },
                { label:"OPEN REPORTS",       value:REPORTS_DB.filter(r=>r.status==="open").length,        color:"var(--orange)", icon:"🚨" },
                { label:"NEWS POSTS",         value:NEWS_DB.length,                                         color:"var(--purple)", icon:"📰" },
                { label:"FREE GAMES",         value:FREE_GAMES_DB.length,                                   color:"#ffcc00",       icon:"🎁" },
                { label:"PENDING VERIFY",     value:verifyPending,                                          color:"var(--green)",  icon:"🛡️" },
                { label:"TOTAL REPORTS",      value:REPORTS_DB.length,                                      color:"var(--muted)",  icon:"📋" },
              ].map(s => (
                <div key={s.label} className="stat card">
                  <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
                  <div className="orb" style={{ fontSize:22, fontWeight:700, color:s.color, textShadow:`0 0 10px ${s.color}` }}>
                    {s.value}
                  </div>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Visits chart — only if real data exists */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }} className="g2">
              <div className="card" style={{ padding:18 }}>
                <div className="orb" style={{ fontSize:10, color:"var(--purple)", letterSpacing:2, marginBottom:6 }}>OWNER LOGIN SESSIONS</div>
                {hasVisits ? (
                  <BarChart data={visitData} color="#bf00ff" />
                ) : (
                  <div style={{ padding:"28px 0", textAlign:"center", color:"var(--muted)" }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                    <div className="mono" style={{ fontSize:10 }}>NO SESSION DATA YET</div>
                    <div style={{ fontSize:11, marginTop:4 }}>Data appears here as the owner logs in over time.</div>
                  </div>
                )}
              </div>

              {/* Registered users list */}
              <div className="card" style={{ padding:18 }}>
                <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:12 }}>
                  REGISTERED USERS ({users.length})
                </div>
                {users.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"20px 0", color:"var(--muted)", fontSize:12 }}>
                    No users registered yet.
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {users.map((u,i) => (
                      <div key={u.username} style={{ display:"flex", alignItems:"center", gap:10,
                        padding:"6px 10px", background:"rgba(0,245,255,0.03)", border:"1px solid var(--border)" }}>
                        <div style={{ width:28, height:28, background:"linear-gradient(135deg,#00f5ff22,#bf00ff22)",
                          border:"1px solid var(--border)", display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:9, fontFamily:"Orbitron", fontWeight:700, flexShrink:0 }}>
                          {u.avatar}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:13 }}>{u.name}</div>
                          <div className="mono" style={{ fontSize:8, color:"var(--muted)" }}>
                            @{u.username} · {u.email}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          {u.steamVerified && <span className="mono" style={{ fontSize:8, color:"var(--green)", border:"1px solid var(--green)", padding:"1px 4px" }}>✓ VFD</span>}
                          {u.banned && <span className="mono" style={{ fontSize:8, color:"#ff4444", border:"1px solid #ff4444", padding:"1px 4px" }}>BANNED</span>}
                          <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>{u.createdAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Verification queue summary */}
            {VERIFICATION_QUEUE.length > 0 && (
              <div className="card" style={{ padding:14, borderColor:"rgba(0,245,255,0.2)" }}>
                <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:10 }}>
                  🛡️ VERIFICATION QUEUE SUMMARY
                </div>
                <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                  {[
                    ["PENDING",  VERIFICATION_QUEUE.filter(v=>v.status==="pending").length,  "var(--orange)"],
                    ["APPROVED", VERIFICATION_QUEUE.filter(v=>v.status==="approved").length, "var(--green)"],
                    ["REJECTED", VERIFICATION_QUEUE.filter(v=>v.status==="rejected").length, "#ff6666"],
                  ].map(([lbl,val,col])=>(
                    <div key={lbl} style={{ textAlign:"center" }}>
                      <div className="orb" style={{ fontSize:20, color:col }}>{val}</div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)" }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── NEWS MANAGEMENT ───────────────────────────────── */}
        {tab==="news" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div>
                <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--purple)" }}>NEWS MANAGEMENT</div>
                <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>{NEWS_DB.length} ARTICLES</div>
              </div>
              <button className="btn p" onClick={openAddNews}>+ POST NEWS</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {NEWS_DB.map(n => (
                <div key={n.id} className="card" style={{ padding:"12px 16px", display:"flex", gap:12, alignItems:"center",
                  borderColor: n.pinned ? "rgba(191,0,255,0.4)" : "var(--border)" }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{n.img}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                      {n.pinned && <span className="mono" style={{ fontSize:8, color:"var(--purple)", border:"1px solid var(--purple)",
                        padding:"1px 5px" }}>📌 PINNED</span>}
                      <span style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {n.title}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{n.source} · {n.time} · {n.tag}</div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button className="btn sm" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                      onClick={() => { pinNews(n.id); refresh(); }}>
                      {n.pinned ? "UNPIN" : "PIN"}
                    </button>
                    <button className="btn sm" onClick={() => openEditNews(n)}>EDIT</button>
                    <button className="btn o sm" onClick={() => { deleteNews(n.id); refresh(); setGlobalNotify({msg:"News deleted",type:"success"}); }}>
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FREE GAMES MANAGEMENT ─────────────────────────── */}
        {tab==="freegames" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div>
                <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--green)" }}>FREE GAMES TRACKER</div>
                <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>{FREE_GAMES_DB.length} ACTIVE FREE GAMES</div>
              </div>
              <button className="btn g" onClick={openAddFg}>+ ADD FREE GAME</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {FREE_GAMES_DB.map(g => (
                <div key={g.id} className="card" style={{ padding:14, borderColor:"rgba(57,255,20,0.2)" }}>
                  {g.imgUrl && (
                    <img src={g.imgUrl} alt={g.name} onError={e=>e.target.style.display='none'}
                      style={{width:"100%",height:70,objectFit:"cover",marginBottom:8,border:"1px solid rgba(57,255,20,0.2)"}} />
                  )}
                  <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:28 }}>{g.img}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{g.name}</div>
                      <div style={{ display:"flex", gap:5, marginTop:3, flexWrap:"wrap" }}>
                        {(g.categories||[]).slice(0,3).map(c=><span key={c} className="tag cat">{c}</span>)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, fontSize:11, color:"var(--muted)", marginBottom:10, flexWrap:"wrap" }}>
                    <span style={{ color:"var(--green)", fontWeight:700 }}>FREE</span>
                    <span>was ${g.originalPrice}</span>
                    <span>⭐{g.metacritic}</span>
                    <span className="mono" style={{ color:"var(--orange)" }}>until {g.endDate}</span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn sm" style={{ flex:1 }} onClick={() => openEditFg(g)}>EDIT</button>
                    <button className="btn o sm" onClick={() => { deleteFreeGame(g.id); refresh(); setGlobalNotify({msg:"Game removed",type:"success"}); }}>
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS MANAGEMENT ──────────────────────────────── */}
        {tab==="users" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>USER MANAGEMENT</div>
              <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>{getAllUsers().length} REGISTERED USERS</div>
            </div>
            <input className="inp" style={{ maxWidth:260, marginBottom:16, fontSize:13 }}
              placeholder="🔍 Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} />
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {users.map(u => (
                <div key={u.username} className="card" style={{ padding:"12px 16px", display:"flex", gap:12, alignItems:"center",
                  flexWrap:"wrap", borderColor: u.banned ? "rgba(255,34,68,0.35)" : "var(--border)" }}>
                  <div style={{ width:36, height:36, background:"linear-gradient(135deg,#00f5ff22,#bf00ff22)",
                    border:"1px solid var(--border)", display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:11, fontFamily:"Orbitron", fontWeight:700, flexShrink:0 }}>
                    {u.avatar}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:700, fontSize:14 }}>{u.name}</span>
                      <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>@{u.username}</span>
                      {u.banned && <span className="mono" style={{ fontSize:8, color:"var(--red)",
                        border:"1px solid var(--red)", padding:"1px 5px" }}>BANNED</span>}
                    </div>
                    <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginTop:2 }}>
                      {u.email} · Joined {u.createdAt}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button className="btn sm" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                      onClick={() => { setResetModal(u); setNewAdminPw(""); }}>
                      RESET PW
                    </button>
                    <button className={`btn sm ${u.banned?"g":"o"}`}
                      onClick={() => { toggleBan(u.username); refresh(); setGlobalNotify({msg:u.banned?"User unbanned":"User banned",type:"success"}); }}>
                      {u.banned ? "UNBAN" : "BAN"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTS ───────────────────────────────────────── */}
        {tab==="reports" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--orange)" }}>REPORTS</div>
              <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>
                {REPORTS_DB.filter(r=>r.status==="open").length} OPEN · {REPORTS_DB.length} TOTAL
              </div>
            </div>
            {REPORTS_DB.length === 0 ? (
              <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>✅</div>
                <div className="mono">NO REPORTS YET</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {REPORTS_DB.map(r => {
                  const statusColor = { open:"var(--orange)", resolved:"var(--green)", dismissed:"var(--muted)" }[r.status];
                  return (
                    <div key={r.id} className="card" style={{ padding:"14px 16px",
                      borderColor: r.status==="open" ? "rgba(255,102,0,0.3)" : "var(--border)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                            <span className="mono" style={{ fontSize:9, color:statusColor, border:`1px solid ${statusColor}`,
                              padding:"1px 6px", textTransform:"uppercase" }}>{r.status}</span>
                            <span style={{ fontWeight:600, fontSize:13 }}>{r.type}</span>
                          </div>
                          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:5 }}>{r.description}</div>
                          <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
                            By: {r.reportedBy} · Against: {r.reportedUser} · {new Date(r.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {r.status==="open" && (
                          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                            <button className="btn g sm" onClick={() => { resolveReport(r.id); refresh(); setGlobalNotify({msg:"Report resolved",type:"success"}); }}>
                              RESOLVE
                            </button>
                            <button className="btn sm" onClick={() => { dismissReport(r.id); refresh(); setGlobalNotify({msg:"Report dismissed",type:"success"}); }}>
                              DISMISS
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── VERIFICATION REVIEW ──────────────────────────── */}
      {tab==="verify" && (
        <div>
          <div style={{ marginBottom:20 }}>
            <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>🛡️ VERIFICATION QUEUE</div>
            <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>
              {VERIFICATION_QUEUE.filter(v=>v.status==="pending").length} PENDING ·{" "}
              {VERIFICATION_QUEUE.length} TOTAL
            </div>
          </div>

          {VERIFICATION_QUEUE.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:"var(--muted)" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🛡️</div>
              <div className="mono">NO VERIFICATION REQUESTS YET</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {VERIFICATION_QUEUE.map(v => {
                const statusColor = {pending:"var(--orange)",approved:"var(--green)",rejected:"var(--red,#ff4444)"}[v.status];
                return (
                  <div key={v.id} className="card" style={{ padding:18,
                    borderColor: v.status==="pending"?"rgba(255,204,0,0.35)":v.status==="approved"?"rgba(57,255,20,0.3)":"rgba(255,68,68,0.3)" }}>
                    {/* Header */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:10 }}>
                      <div>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontWeight:700, fontSize:16 }}>{v.name}</span>
                          <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>@{v.username}</span>
                          <span className="mono" style={{ fontSize:8, padding:"1px 6px",
                            border:`1px solid ${statusColor}`, color:statusColor }}>
                            {v.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
                          {v.email} · Submitted {new Date(v.submittedAt).toLocaleString()}
                        </div>
                        {v.status==="rejected" && v.rejectionReason && (
                          <div style={{ marginTop:6, fontSize:11, color:"#ff6666",
                            background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.25)",
                            padding:"5px 10px" }}>
                            Rejection reason: {v.rejectionReason}
                          </div>
                        )}
                      </div>
                      {v.status==="pending" && (
                        <div style={{ display:"flex", gap:8 }}>
                          <button className="btn g sm" onClick={()=>{
                            approveVerification(v.username); refresh();
                            setGlobalNotify({msg:`✓ ${v.name} verified — badge granted!`,type:"success"});
                          }}>✓ APPROVE</button>
                          <button className="btn o sm" onClick={()=>{
                            setVerifyModal(v); setRejectReason(""); setCustomReason("");
                          }}>✕ REJECT</button>
                        </div>
                      )}
                    </div>

                    {/* Screenshots side by side */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div>
                        <div className="mono" style={{ fontSize:8, color:"var(--cyan)", letterSpacing:2, marginBottom:6 }}>
                          📚 LIBRARY SCREENSHOT
                        </div>
                        {v.libraryScreenshot ? (
                          <img src={v.libraryScreenshot} alt="library"
                            style={{ width:"100%", height:160, objectFit:"cover",
                              border:"1px solid rgba(0,245,255,0.25)", cursor:"pointer" }}
                            onClick={()=>window.open(v.libraryScreenshot,"_blank")}
                          />
                        ) : (
                          <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center",
                            border:"1px solid var(--border)", color:"var(--muted)", fontSize:12 }}>
                            No screenshot
                          </div>
                        )}
                        <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:3 }}>
                          Click to open full size
                        </div>
                      </div>
                      <div>
                        <div className="mono" style={{ fontSize:8, color:"var(--cyan)", letterSpacing:2, marginBottom:6 }}>
                          👤 PROFILE / ACCOUNT INFO
                        </div>
                        {v.steamScreenshot ? (
                          <img src={v.steamScreenshot} alt="profile"
                            style={{ width:"100%", height:160, objectFit:"cover",
                              border:"1px solid rgba(0,245,255,0.25)", cursor:"pointer" }}
                            onClick={()=>window.open(v.steamScreenshot,"_blank")}
                          />
                        ) : (
                          <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center",
                            border:"1px solid var(--border)", color:"var(--muted)", fontSize:12 }}>
                            No screenshot
                          </div>
                        )}
                        <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:3 }}>
                          Click to open full size
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Reject Modal ─────────────────────────────────────── */}
      {verifyModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setVerifyModal(null)}>
          <div className="modal" style={{ borderColor:"rgba(255,68,68,0.4)", maxWidth:480 }}>
            <div className="orb" style={{ color:"#ff6666", fontSize:12, letterSpacing:3, marginBottom:16 }}>
              ✕ REJECT VERIFICATION
            </div>
            <div style={{ marginBottom:14 }}>
              <span style={{ color:"var(--muted)", fontSize:13 }}>Rejecting verification for: </span>
              <span style={{ fontWeight:700 }}>{verifyModal.name}</span>
              <span style={{ color:"var(--muted)", fontSize:11, display:"block", marginTop:2 }}>
                This will unlink their Steam account and notify them of the rejection reason.
              </span>
            </div>

            {/* Predefined reasons */}
            <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>
              SELECT A REASON
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
              {PREDEFINED_REASONS.map((r,i) => (
                <button key={i} onClick={()=>setRejectReason(r)} style={{
                  textAlign:"left", padding:"7px 12px", cursor:"pointer", fontSize:12,
                  background: rejectReason===r ? "rgba(255,68,68,0.15)" : "rgba(255,68,68,0.04)",
                  border:`1px solid ${rejectReason===r ? "#ff6666" : "rgba(255,68,68,0.2)"}`,
                  color: rejectReason===r ? "#ff9999" : "var(--muted)",
                  transition:"all 0.15s",
                }}>
                  {rejectReason===r ? "● " : "○ "}{r}
                </button>
              ))}
            </div>

            {/* Custom reason */}
            <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>
              OR WRITE A CUSTOM REASON
            </div>
            <textarea className="inp" rows={2} placeholder="e.g. The account shown doesn't match the username provided..."
              value={customReason} onChange={e=>setCustomReason(e.target.value)}
              style={{ resize:"none", fontFamily:"Rajdhani", lineHeight:1.5, marginBottom:14 }} />

            <div style={{ display:"flex", gap:10 }}>
              <button className="btn o sm" style={{ flex:1, borderColor:"#ff6666", color:"#ff6666" }}
                disabled={!rejectReason && !customReason.trim()}
                onClick={()=>{
                  const reason = customReason.trim() || rejectReason;
                  rejectVerification(verifyModal.username, reason);
                  setVerifyModal(null); refresh();
                  setGlobalNotify({msg:`Verification rejected — ${verifyModal.name} notified`,type:"success"});
                }}>
                ✕ CONFIRM REJECTION
              </button>
              <button className="btn sm" onClick={()=>setVerifyModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── News Modal ─────────────────────────────────────── */}}
      {newsModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setNewsModal(false)}>
          <div className="modal" style={{ borderColor:"var(--purple)", maxHeight:"calc(100vh - 96px)", overflowY:"auto" }}>
            <div className="orb" style={{ color:"var(--purple)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              {editingNews ? "✏ EDIT NEWS" : "+ POST NEWS"}
            </div>
            <div style={{ display:"grid", gap:12 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>HEADLINE *</div>
                <input className="inp" placeholder="e.g. GTA VI Release Date Confirmed" value={nForm.title}
                  onChange={e=>setNForm(p=>({...p,title:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>SOURCE *</div>
                <input className="inp" placeholder="e.g. IGN, Steam, Kotaku" value={nForm.source}
                  onChange={e=>setNForm(p=>({...p,source:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>SOURCE URL (optional — makes source clickable)</div>
                <input className="inp" placeholder="e.g. https://ign.com/article/..." value={nForm.sourceUrl}
                  onChange={e=>setNForm(p=>({...p,sourceUrl:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>DESCRIPTION</div>
                <textarea className="inp" rows={2} placeholder="Brief summary of the news..."
                  value={nForm.description} onChange={e=>setNForm(p=>({...p,description:e.target.value}))}
                  style={{resize:"none",fontFamily:"Rajdhani",lineHeight:1.5}} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  NEWS IMAGE <span style={{color:"var(--purple)"}}>(SEARCH GAME NAME FOR OPTIONS)</span>
                </div>
                <LogoPicker gameName={nForm.title} imgUrl={nForm.imgUrl}
                  onSelect={url=>setNForm(p=>({...p,imgUrl:url||""}))} color="var(--purple)" />
                <div className="mono" style={{fontSize:8,color:"var(--muted)",marginTop:4}}>
                  Or paste a URL directly:
                </div>
                <input className="inp" style={{marginTop:4}} placeholder="https://example.com/image.jpg"
                  value={nForm.imgUrl} onChange={e=>setNForm(p=>({...p,imgUrl:e.target.value}))} />
                {nForm.imgUrl && (
                  <img src={nForm.imgUrl} alt="" onError={e=>e.target.style.display="none"}
                    style={{width:"100%",height:80,objectFit:"cover",marginTop:6,border:"1px solid rgba(191,0,255,0.3)"}} />
                )}
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>TAG</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {NEWS_TAGS.map(t=>(
                    <button key={t} onClick={()=>setNForm(p=>({...p,tag:t}))} style={{
                      fontFamily:"Share Tech Mono", fontSize:9, padding:"3px 10px", cursor:"pointer",
                      background:nForm.tag===t?"rgba(191,0,255,0.2)":"rgba(191,0,255,0.04)",
                      border:`1px solid ${nForm.tag===t?"var(--purple)":"rgba(191,0,255,0.2)"}`,
                      color:nForm.tag===t?"var(--purple)":"var(--muted)"}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>ICON</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {NEWS_EMOJIS.map(em=>(
                    <button key={em} onClick={()=>setNForm(p=>({...p,img:em}))} style={{
                      fontSize:16,background:nForm.img===em?"rgba(191,0,255,0.2)":"rgba(0,245,255,0.03)",
                      border:`1px solid ${nForm.img===em?"var(--purple)":"var(--border)"}`,
                      padding:"4px 6px",cursor:"pointer"}}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn p" style={{ flex:1 }} onClick={saveNews}>
                {editingNews ? "⟶ SAVE CHANGES" : "⟶ POST"}
              </button>
              <button className="btn o" onClick={()=>setNewsModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Free Game Modal ────────────────────────────────── */}
      {fgModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setFgModal(false)}>
          <div className="modal" style={{ borderColor:"var(--green)" }}>
            <div className="orb" style={{ color:"var(--green)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              {editingFg ? "✏ EDIT FREE GAME" : "+ ADD FREE GAME"}
            </div>
            <div style={{ display:"grid", gap:12 }}>
              {[["GAME NAME *","text","name","e.g. Death Stranding"],
                ["EXPIRY DATE *","text","endDate","e.g. Mar 21"],
                ["ORIGINAL PRICE ($)","number","originalPrice","29.99"],
                ["METACRITIC SCORE","number","metacritic","82"],
                ["CATEGORIES (comma separated)","text","categories","Action, Open World, Sci-Fi"]].map(([lbl,type,key,ph])=>(
                <div key={key}>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>{lbl}</div>
                  <input className="inp" type={type} placeholder={ph} value={fgForm[key]}
                    onChange={e=>setFgForm(p=>({...p,[key]:e.target.value}))} />
                </div>
              ))}
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>ICON</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {GAME_EMOJIS.map(em=>(
                    <button key={em} onClick={()=>setFgForm(p=>({...p,img:em}))} style={{
                      fontSize:16,background:fgForm.img===em?"rgba(57,255,20,0.18)":"rgba(0,245,255,0.03)",
                      border:`1px solid ${fgForm.img===em?"var(--green)":"var(--border)"}`,
                      padding:"4px 6px",cursor:"pointer"}}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn g" style={{ flex:1 }} onClick={saveFg}>
                {editingFg ? "⟶ SAVE CHANGES" : "⟶ ADD GAME"}
              </button>
              <button className="btn o" onClick={()=>setFgModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Reset PW Modal ───────────────────────────── */}
      {resetModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setResetModal(null)}>
          <div className="modal" style={{ borderColor:"#ffcc00" }}>
            <div className="orb" style={{ color:"#ffcc00", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              🔑 RESET USER PASSWORD
            </div>
            <div style={{ marginBottom:14, fontSize:13, color:"var(--muted)" }}>
              Resetting password for <span style={{ color:"var(--cyan)" }}>{resetModal.name}</span>
              {" "}(@{resetModal.username})
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>NEW PASSWORD</div>
              <input className="inp" type="text" placeholder="Enter new password for user"
                value={newAdminPw} onChange={e=>setNewAdminPw(e.target.value)} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn full" style={{ borderColor:"#ffcc00", color:"#ffcc00" }} onClick={() => {
                if (!newAdminPw.trim()) return;
                adminResetPassword(resetModal.username, newAdminPw);
                setResetModal(null);
                setGlobalNotify({ msg:`Password reset for ${resetModal.username}`, type:"success" });
              }}>⟶ RESET PASSWORD</button>
              <button className="btn o" onClick={()=>setResetModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
