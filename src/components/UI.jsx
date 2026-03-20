import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getVerificationStatus, USER_DB } from "../constants/auth";
import { pushNotif, markAllRead, clearAll, subscribeNotifs, getNotifs } from "../utils/notifStore";

// ─── Notification Toast ───────────────────────────────────────────────────────
export function Notif({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, []);
  useEffect(() => { pushNotif({ msg, type }); }, []);
  return (
    <div className={`notif${type === "error" ? " err" : ""}`}>
      <span style={{ color: type === "error" ? "var(--orange)" : "var(--green)", marginRight: 8 }}>
        {type === "error" ? "⚠" : "✔"}
      </span>
      {msg}
    </div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING VAULT...");
  const steps = [
    { at: 20,  text: "LOADING GAME DATABASE..." },
    { at: 45,  text: "CONNECTING TO PLATFORMS..." },
    { at: 70,  text: "FETCHING MARKET DATA..." },
    { at: 90,  text: "CALIBRATING VALUATION ENGINE..." },
    { at: 100, text: "VAULT READY" },
  ];
  useEffect(() => {
    let p = 0;
    const timer = setInterval(() => {
      p += 1.5;
      setProgress(Math.min(p, 100));
      const step = steps.find(s => Math.floor(p) === s.at);
      if (step) setStatusText(step.text);
      if (p >= 100) { clearInterval(timer); setTimeout(onDone, 400); }
    }, 28);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="loading-screen">
      <img src="/gamevault-logo.png" alt="GameVault" style={{
        width:220, height:"auto", objectFit:"contain", marginBottom:4,
        filter:"drop-shadow(0 0 16px rgba(0,245,255,0.6)) drop-shadow(0 0 32px rgba(191,0,255,0.3))",
        animation:"popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        imageRendering:"crisp-edges",
      }} />
      <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:3, marginTop:4 }}>
        ACCOUNT MANAGER v4.0
      </div>
      <div style={{ width:280, marginTop:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2 }}>{statusText}</div>
          <div className="mono" style={{ fontSize:9, color:"var(--cyan)" }}>{Math.floor(progress)}%</div>
        </div>
        <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,var(--cyan),var(--purple))",
            transition:"width 0.1s linear", boxShadow:"0 0 8px var(--cyan)" }} />
        </div>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:24 }}>
        {["⊞ STEAM","◈ EPIC"].map((lbl,i) => (
          <div key={i} style={{ fontFamily:"Orbitron", fontWeight:900, fontSize:10, letterSpacing:2,
            color:i===0?"#1a9fff":"var(--green)",
            border:`1px solid ${i===0?"#1a9fff33":"#39ff1433"}`, padding:"5px 10px",
            opacity:progress>(i===0?45:60)?1:0.2, transition:"opacity 0.5s" }}>{lbl}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Notification Bell + Center ───────────────────────────────────────────────
function NotifCenter() {
  const [notifs, setNotifs] = useState(getNotifs());
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  useEffect(() => { return subscribeNotifs(setNotifs); }, []);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const unread = notifs.filter(n => !n.read).length;
  const handleOpen = () => { setOpen(o => !o); if (!open) setTimeout(markAllRead, 600); };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={handleOpen} title="Notifications" style={{
        background: open?"rgba(0,245,255,0.08)":"none",
        border:`1px solid ${open?"var(--cyan)":"rgba(0,245,255,0.2)"}`,
        cursor:"pointer", padding:"5px 10px", position:"relative", transition:"all 0.2s", fontSize:16,
      }}>
        🔔
        {unread > 0 && (
          <span style={{ position:"absolute", top:-5, right:-5, background:"var(--orange)", color:"#000",
            fontFamily:"Orbitron", fontSize:8, fontWeight:700, borderRadius:"50%",
            width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div style={{
          position:"fixed", top:70, right:14,
          background:"rgba(6,13,27,0.97)",
          border:"1px solid rgba(0,245,255,0.3)",
          boxShadow:"0 0 0 1px rgba(0,245,255,0.07), 0 20px 60px rgba(0,0,0,0.75), 0 0 40px rgba(0,245,255,0.08)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          width:340, maxHeight:"min(460px, calc(100vh - 80px))",
          overflowY:"auto", zIndex:9999,
          animation:"popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          borderRadius:2,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 14px", borderBottom:"1px solid var(--border)",
            position:"sticky", top:0, background:"rgba(6,13,27,0.98)", backdropFilter:"blur(10px)" }}>
            <div className="mono" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2 }}>🔔 NOTIFICATIONS</div>
            {notifs.length > 0 && (
              <button onClick={clearAll} style={{ background:"none", border:"none", cursor:"pointer",
                color:"var(--muted)", fontFamily:"Share Tech Mono", fontSize:9 }}>CLEAR ALL</button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding:"30px 16px", textAlign:"center", color:"var(--muted)", fontSize:13 }}>
              No notifications yet
            </div>
          ) : notifs.map(n => (
            <div key={n.id} style={{ padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)",
              background:n.read?"none":"rgba(0,245,255,0.03)", display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{n.type==="error"?"⚠️":"✅"}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, lineHeight:1.4,
                  color:n.type==="error"?"var(--orange)":"var(--txt)" }}>{n.msg}</div>
                <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:3 }}>
                  {n.date} · {n.time}
                </div>
              </div>
              {!n.read && <div style={{ width:6, height:6, borderRadius:"50%",
                background:"var(--cyan)", flexShrink:0, marginTop:4 }} />}
            </div>
          ))}
        </div>
      , document.body)}
    </div>
  );
}

// ─── Profile dropdown menu ────────────────────────────────────────────────────
function ProfileMenu({ user, onLogout, setActive, onUserUpdate }) {
  const [open,        setOpen]        = useState(false);
  const [editName,    setEditName]    = useState(false);
  const [nameInput,   setNameInput]   = useState(user.name);
  const [showAvatar,  setShowAvatar]  = useState(false);
  const [showPw,      setShowPw]      = useState(false);
  const [pwForm,      setPwForm]      = useState({ current:"", next:"", confirm:"" });
  const [pwErr,       setPwErr]       = useState("");
  const [pwOk,        setPwOk]        = useState(false);
  const ref      = useRef(null);
  const panelRef = useRef(null);  // ref for the portalled dropdown panel

  const AVATARS = ["🎮","👾","🤖","👻","🦊","🐉","🦁","🐺","🌌","⚔️","🛸","🧬","🔥","💀","🎯","🕹️","🏆","⚡","🌀","🎲"];

  const pickAvatar = (emoji) => {
    const u = USER_DB[user.username?.toLowerCase()];
    if (u) { u.avatar = emoji; u.avatarEmoji = emoji; }
    onUserUpdate && onUserUpdate({ ...user, avatar: emoji, avatarEmoji: emoji });
    setShowAvatar(false);
    pushNotif({ msg:"Avatar updated!", type:"success" });
  };

  const changePassword = () => {
    setPwErr(""); setPwOk(false);
    if (!pwForm.current) { setPwErr("Enter your current password"); return; }
    if (pwForm.next.length < 6) { setPwErr("New password must be 6+ characters"); return; }
    if (pwForm.next !== pwForm.confirm) { setPwErr("Passwords don't match"); return; }
    const u = USER_DB[user.username?.toLowerCase()];
    if (!u || u.password !== pwForm.current) { setPwErr("Current password is incorrect"); return; }
    u.password = pwForm.next;
    setPwOk(true);
    setPwForm({ current:"", next:"", confirm:"" });
    pushNotif({ msg:"Password changed successfully!", type:"success" });
    setTimeout(() => { setShowPw(false); setPwOk(false); }, 1500);
  };

  useEffect(() => {
    const h = (e) => {
      // Close only if click is outside BOTH the trigger button AND the portal panel
      const outsideTrigger = ref.current && !ref.current.contains(e.target);
      const outsidePanel   = panelRef.current && !panelRef.current.contains(e.target);
      if (outsideTrigger && outsidePanel) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const u = USER_DB[user.username?.toLowerCase()];
    if (u) { u.name = trimmed; u.avatar = trimmed.slice(0,2).toUpperCase(); }
    onUserUpdate && onUserUpdate({ ...user, name:trimmed, avatar:trimmed.slice(0,2).toUpperCase() });
    setEditName(false);
    pushNotif({ msg:"Display name updated!", type:"success" });
  };

  const vStatus = getVerificationStatus(user.username);
  const vColor  = !vStatus?"var(--muted)":vStatus.status==="approved"?"var(--green)":vStatus.status==="pending"?"var(--cyan)":"#ff6666";
  const vLabel  = !vStatus?"Not verified":vStatus.status==="approved"?"✓ Verified":vStatus.status==="pending"?"⟳ Pending review":"✕ Rejected";

  return (
    <div ref={ref} style={{ position:"relative" }}>
      {/* Trigger */}
      <button onClick={() => setOpen(o => !o)} style={{
        background:open?"rgba(0,245,255,0.1)":"none",
        border:`1px solid ${open?"var(--cyan)":"rgba(0,245,255,0.25)"}`,
        cursor:"pointer", display:"flex", alignItems:"center", gap:8,
        padding:"4px 10px 4px 6px", transition:"all 0.2s",
      }}>
        <div style={{ width:26, height:26, flexShrink:0,
          background:"linear-gradient(135deg,#00f5ff33,#bf00ff33)",
          border:"1px solid #00f5ff55", display:"flex", alignItems:"center", justifyContent:"center",
          fontSize: user.avatarEmoji ? 16 : 10,
          fontFamily:"Orbitron", fontWeight:700, color:"var(--cyan)" }}>{user.avatarEmoji || user.avatar}</div>
        <span className="mono" style={{ fontSize:10, color:"var(--cyan)", whiteSpace:"nowrap" }}>{user.name}</span>
        <span style={{ fontSize:9, color:"var(--muted)" }}>{open?"▲":"▼"}</span>
      </button>

      {/* Dropdown */}
      {open && createPortal(
        <div ref={panelRef} style={{
          position:"fixed", top:70, right:14,
          background:"rgba(6,13,27,0.97)",
          border:"1px solid rgba(0,245,255,0.4)",
          boxShadow:"0 0 0 1px rgba(0,245,255,0.07), 0 20px 60px rgba(0,0,0,0.8), 0 0 50px rgba(0,245,255,0.1)",
          backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          width:290, zIndex:9999,
          animation:"popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          borderRadius:2,
        }}>

          {/* User info + name editor */}
          <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div
            onClick={() => { setShowAvatar(v => !v); setShowPw(false); }}
            title="Change avatar"
            style={{ width:38, height:38, flexShrink:0,
              background:"linear-gradient(135deg,#00f5ff22,#bf00ff22)", border:"1px solid var(--cyan)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize: user.avatarEmoji ? 22 : 14,
              fontFamily:"Orbitron", fontWeight:700, color:"var(--cyan)",
              cursor:"pointer", transition:"all 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--purple)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--cyan)"}
          >{user.avatarEmoji || user.avatar}</div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1 }}>@{user.username}</div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>{user.email}</div>
              </div>
            </div>
            {/* Editable name */}
            <div style={{ background:"rgba(0,245,255,0.04)", border:"1px solid rgba(0,245,255,0.15)", padding:"8px 10px" }}>
              <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:1, marginBottom:5 }}>DISPLAY NAME</div>
              {editName ? (
                <div style={{ display:"flex", gap:6 }}>
                  <input className="inp" value={nameInput} autoFocus
                    onChange={e=>setNameInput(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter") saveName(); if(e.key==="Escape"){ setEditName(false); setNameInput(user.name); } }}
                    style={{ fontSize:13, padding:"4px 8px", flex:1 }} />
                  <button className="btn g sm" onClick={saveName} style={{ padding:"4px 10px", fontSize:9 }}>✓</button>
                  <button className="btn o sm" onClick={()=>{ setEditName(false); setNameInput(user.name); }}
                    style={{ padding:"4px 8px", fontSize:9 }}>✕</button>
                </div>
              ) : (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:700 }}>{user.name}</span>
                  <button onClick={()=>setEditName(true)} style={{ background:"none", border:"none", cursor:"pointer",
                    color:"var(--cyan)", fontFamily:"Share Tech Mono", fontSize:9, letterSpacing:1 }}>✏ EDIT</button>
                </div>
              )}
            </div>

          {/* Avatar picker panel */}
          {showAvatar && (
            <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)",
              background:"rgba(191,0,255,0.04)" }}>
              <div className="mono" style={{ fontSize:8, color:"var(--purple)", letterSpacing:1, marginBottom:8 }}>
                CHOOSE AVATAR
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {["🎮","👾","🤖","👻","🦊","🐉","🦁","🐺","🌌","⚔️","🛸","🧬","🔥","💀","🎯","🕹️","🏆","⚡","🌀","🎲"].map(em => (
                  <button key={em} onClick={() => pickAvatar(em)} style={{
                    fontSize:20, background: (user.avatarEmoji||user.avatar)===em ? "rgba(191,0,255,0.2)" : "rgba(255,255,255,0.04)",
                    border:`1px solid ${(user.avatarEmoji||user.avatar)===em ? "var(--purple)" : "rgba(255,255,255,0.1)"}`,
                    width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.15s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(191,0,255,0.15)"}
                    onMouseLeave={e=>e.currentTarget.style.background=(user.avatarEmoji||user.avatar)===em?"rgba(191,0,255,0.2)":"rgba(255,255,255,0.04)"}
                  >{em}</button>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Verification */}
          <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)",
            display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>🛡️</span>
            <div>
              <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:1 }}>VERIFICATION</div>
              <div style={{ fontSize:12, color:vColor, fontWeight:600 }}>{vLabel}</div>
              {vStatus?.status==="rejected" && (
                <div style={{ fontSize:10, color:"var(--orange)", marginTop:1 }}>{vStatus.reason}</div>
              )}
            </div>
          </div>

          {/* Change password toggle */}
          <button onClick={() => { setShowPw(v=>!v); setShowAvatar(false); }} style={{
            width:"100%", textAlign:"left", background: showPw?"rgba(0,245,255,0.05)":"none",
            padding:"9px 16px", border:"none", borderBottom:"1px solid rgba(255,255,255,0.04)",
            cursor:"pointer", display:"flex", alignItems:"center", gap:10,
            color:"var(--cyan)", fontFamily:"Rajdhani", fontSize:13,
          }}>
            <span style={{ width:18 }}>🔑</span>Change Password
            <span style={{ marginLeft:"auto", fontSize:9, color:"var(--muted)" }}>{showPw?"▲":"▼"}</span>
          </button>
          {showPw && (
            <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)",
              background:"rgba(0,245,255,0.03)" }}>
              {["current","next","confirm"].map(field => (
                <input key={field} className="inp" type="password"
                  placeholder={field==="current"?"Current password":field==="next"?"New password":"Confirm new password"}
                  value={pwForm[field]}
                  onChange={e => { setPwErr(""); setPwOk(false); setPwForm(p=>({...p,[field]:e.target.value})); }}
                  style={{ fontSize:12, padding:"6px 10px", marginBottom:6 }} />
              ))}
              {pwErr && <div style={{ color:"var(--orange)", fontSize:11, marginBottom:6 }}>⚠ {pwErr}</div>}
              {pwOk  && <div style={{ color:"var(--green)",  fontSize:11, marginBottom:6 }}>✓ Password changed!</div>}
              <button className="btn sm" style={{ width:"100%" }} onClick={changePassword}>
                ⟶ UPDATE PASSWORD
              </button>
            </div>
          )}

          {/* Nav links */}
          {[
            { icon:"◈", label:"Accounts",     id:"accounts" },
            { icon:"⟳", label:"Market",       id:"market"   },
            { icon:"🔄", label:"Trade Center", id:"trades"   },
            { icon:"💰", label:"Price Tracker",  id:"prices"   },
            { icon:"📋", label:"Activity Log",   id:"activity" },
          ].map(item=>(
            <button key={item.id} onClick={()=>{ setActive(item.id); setOpen(false); }} style={{
              width:"100%", textAlign:"left", background:"none", padding:"9px 16px",
              border:"none", borderBottom:"1px solid rgba(255,255,255,0.04)",
              cursor:"pointer", display:"flex", alignItems:"center", gap:10,
              color:"var(--txt)", fontFamily:"Rajdhani", fontSize:13,
            }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,245,255,0.05)"}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span style={{ width:18 }}>{item.icon}</span>{item.label}
              <span style={{ marginLeft:"auto", fontSize:9, color:"var(--muted)" }}>→</span>
            </button>
          ))}

          {/* Logout */}
          <button onClick={() => { setOpen(false); setTimeout(onLogout, 80); }} style={{ width:"100%", textAlign:"left", background:"none",
            padding:"10px 16px", border:"none", cursor:"pointer",
            display:"flex", alignItems:"center", gap:10, color:"var(--orange)", fontFamily:"Rajdhani", fontSize:13 }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,102,0,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>
            <span style={{ width:18 }}>⏻</span> LOG OUT
          </button>
        </div>
      , document.body)}
    </div>
  );
}

// ─── Top Navigation ───────────────────────────────────────────────────────────
export function Nav({ user, active, setActive, onLogout, theme, toggleTheme, onUserUpdate, videoBg, toggleVideoBg }) {
  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:"⬡" },
    { id:"library",   label:"Library",   icon:"◫" },
    { id:"wishlist",  label:"Wishlist",  icon:"★" },
    { id:"accounts",  label:"Accounts",  icon:"◈" },
    { id:"market",    label:"Market",    icon:"⟳" },
    { id:"trades",    label:"Trades",    icon:"🔄" },
    { id:"prices",    label:"Prices",    icon:"💰" },
  ];
  return (
    <>
      <div className="desk-nav" style={{ background:"rgba(5,8,16,0.95)", borderBottom:"1px solid var(--border)",
        backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:100,
        display:"flex", alignItems:"center", padding:"0 20px", gap:4, overflowX:"auto", height:64 }}>
        <div style={{ marginRight:20, flexShrink:0, display:"flex", alignItems:"center" }}>
          <img src="/gamevault-logo.png" alt="GameVault" style={{
            height:56, width:"auto", maxWidth:260,
            objectFit:"contain", objectPosition:"left center",
            filter:"drop-shadow(0 0 10px rgba(0,245,255,0.6))",
          }} />
        </div>
        <div style={{ display:"flex", flex:1 }}>
          {tabs.map(t => (
            <button key={t.id} className={`ntab${active===t.id?" act":""}`} onClick={()=>setActive(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme==="dark"?"☀️":"🌙"}
          </button>
          <button className="theme-btn" onClick={toggleVideoBg}
            title={videoBg ? "Disable video background" : "Enable video background"}
            style={{ fontSize:12, opacity: videoBg ? 1 : 0.45 }}>
            🎬
          </button>
          <NotifCenter />
          <ProfileMenu user={user} onLogout={onLogout} setActive={setActive} onUserUpdate={onUserUpdate} />
        </div>
      </div>
      <div className="mob-nav">
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setActive(t.id)} style={{
            background:"none", border:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"0 8px",
            color:active===t.id?"var(--cyan)":"var(--muted)",
            textShadow:active===t.id?"0 0 8px var(--cyan)":"none" }}>
            <span style={{ fontSize:18 }}>{t.icon}</span>
            <span style={{ fontSize:7, fontFamily:"Orbitron", letterSpacing:1 }}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </>
  );
}
