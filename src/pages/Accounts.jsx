import { useState } from "react";
import { EMOJIS } from "../constants/data";
import GenrePicker from "../components/GenrePicker";
import LogoPicker from "../components/LogoPicker";
import { submitVerification, getVerificationStatus } from "../constants/auth";
import { fmt, calcSteam, calcEpic } from "../utils/helpers";
import { fetchFullSteamProfile } from "../utils/steamAPI";

// ─── Epic manual game entry form ─────────────────────────────────────────────
const EMPTY_EPIC_GAME = { name:"", playtime:"", price:"", img:"🎮", free:false, genres:[], imgUrl:"" };

export default function Accounts({ sg, eg, setSg, setEg, sLinked, eLinked, setSLinked, setELinked,
  sProf, setSProf, eProf, setEProf, setNotify, user }) {

  // Steam states
  const [sModal,    setSModal]    = useState(false);
  const [sMode,     setSMode]     = useState("api");   // "api" | "manual"
  const [sApiKey,   setSApiKey]   = useState("");
  const [sSteamId,  setSSteamId]  = useState("");
  const [sLoad,     setSLoad]     = useState(false);
  const [sProgress, setSProgress] = useState({ msg:"", pct:0 });
  const [sError,    setSError]    = useState("");
  // manual steam fields
  const [smF, setSmF] = useState({ username:"", level:"", badges:"", totalHours:"" });
  const [smGames, setSmGames] = useState([]);
  const [smNewG,  setSmNewG]  = useState({ name:"", playtime:"", price:"", img:"🎮", total:"", earned:"", genres:[], imgUrl:"" });

  // Epic states
  const [eModal,  setEModal]  = useState(false);
  const [eLoad,   setELoad]   = useState(false);
  const [eF,      setEF]      = useState({ username:"", totalHours:"" });
  const [eGames,  setEGames]  = useState([]);
  const [eNewG,   setENewG]   = useState({ ...EMPTY_EPIC_GAME });

  const sv = sLinked ? calcSteam(sg, sProf.level, sProf.badges) : 0;
  const ev = eLinked ? calcEpic(eg)  : 0;
  const vStatus = user ? getVerificationStatus(user.username) : null;

  // ── Steam API link ──────────────────────────────────────────────────────────
  const linkSteamApi = async () => {
    setSError("");
    if (!sApiKey.trim()) { setSError("Enter your Steam API Key"); return; }
    if (!sSteamId.trim()) { setSError("Enter your Steam64 ID or username"); return; }
    setSLoad(true);
    try {
      const profile = await fetchFullSteamProfile(
        sApiKey.trim(),
        sSteamId.trim(),
        (msg, pct) => setSProgress({ msg, pct })
      );
      // Set profile
      setSProf({
        username:   profile.username,
        level:      profile.level,
        badges:     profile.badges,
        totalHours: profile.totalHours,
        avatar:     profile.avatar,
        profileUrl: profile.profileUrl,
        steamId:    profile.steamId,
        source:     "api",
      });
      // Add games (avoid duplicates)
      const existing = new Set(sg.map(g => g.name.toLowerCase()));
      const newGames = profile.games.filter(g => !existing.has(g.name.toLowerCase()));
      if (newGames.length > 0) setSg(p => [...p, ...newGames]);
      setSLinked(true);
      setSModal(false);
      setNotify({ msg:`✔ Steam linked! ${profile.games.length} games imported from real account`, type:"success" });
    } catch (err) {
      setSError(err.message || "Failed to connect to Steam API");
    } finally {
      setSLoad(false);
      setSProgress({ msg:"", pct:0 });
    }
  };

  // ── Steam manual link ───────────────────────────────────────────────────────
  const addManualSteamGame = () => {
    if (!smNewG.name.trim()) return;
    const g = {
      ...smNewG,
      id:           Date.now(),
      platform:     "steam",
      playtime:     +smNewG.playtime || 0,
      price:        +smNewG.price    || 0,
      metacritic:   0,
      wishlist:     false,
      categories:   smNewG.genres.length>0 ? smNewG.genres : ["Action"],
      achievements: { total:+smNewG.total||0, earned:+smNewG.earned||0 },
    };
    setSmGames(p => [...p, g]);
    setSmNewG({ name:"", playtime:"", price:"", img:"🎮", total:"", earned:"", genres:[], imgUrl:"" });
  };

  const linkSteamManual = () => {
    if (!smF.username.trim()) { setNotify({ msg:"Enter your Steam username", type:"error" }); return; }
    setSProf({
      username:   smF.username,
      level:      +smF.level   || 0,
      badges:     +smF.badges  || 0,
      totalHours: +smF.totalHours || smGames.reduce((s,g)=>s+g.playtime,0),
      source:     "manual",
    });
    if (smGames.length > 0) {
      const existing = new Set(sg.map(g => g.name.toLowerCase()));
      const newG = smGames.filter(g => !existing.has(g.name.toLowerCase()));
      setSg(p => [...p, ...newG]);
    }
    setSLinked(true);
    setSModal(false);
    setNotify({ msg:`Steam linked manually! ${smGames.length} games added`, type:"success" });
  };

  // ── Screenshot verification — 2 required slots ───────────────────────────────
  const [ssLibrary,   setSsLibrary]   = useState(null);   // {name, dataUrl}
  const [ssProfile,   setSsProfile]   = useState(null);   // {name, dataUrl}
  const [verifyLoad,  setVerifyLoad]  = useState(false);

  const readFile = (file, setter) => {
    const reader = new FileReader();
    reader.onload = ev => setter({ name:file.name, dataUrl:ev.target.result });
    reader.readAsDataURL(file);
  };

  // ── Epic manual link ────────────────────────────────────────────────────────
  const addEpicGame = () => {
    if (!eNewG.name.trim()) return;
    const g = {
      ...eNewG,
      id:           Date.now(),
      platform:     "epic",
      playtime:     +eNewG.playtime || 0,
      price:        eNewG.free ? 0 : (+eNewG.price || 0),
      metacritic:   0,
      wishlist:     false,
      categories:   eNewG.genres.length>0 ? eNewG.genres : ["Action"],
      achievements: { total:0, earned:0 },
    };
    setEGames(p => [...p, g]);
    setENewG({ ...EMPTY_EPIC_GAME });
  };

  const linkEpic = () => {
    if (!eF.username.trim()) { setNotify({ msg:"Enter your Epic display name", type:"error" }); return; }
    setELoad(true);
    setTimeout(() => {
      setEProf({
        username:   eF.username,
        totalHours: +eF.totalHours || eGames.reduce((s,g)=>s+g.playtime,0),
        source:     "manual",
      });
      if (eGames.length > 0) {
        const existing = new Set(eg.map(g => g.name.toLowerCase()));
        const newG = eGames.filter(g => !existing.has(g.name.toLowerCase()));
        setEg(p => [...p, ...newG]);
      }
      setELinked(true);
      setEModal(false);
      setELoad(false);
      setNotify({ msg:`Epic linked! ${eGames.length} games added`, type:"success" });
    }, 800);
  };

  // ── Shared field row component ─────────────────────────────────────────────
  const Field = ({ label, type="text", value, onChange, placeholder, disabled }) => (
    <div>
      <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>{label}</div>
      <input className="inp" type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} disabled={disabled} />
    </div>
  );

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:960, margin:"0 auto" }}>
      <div style={{ marginBottom:22 }}>
        <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>LINKED ACCOUNTS</div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>MANAGE PLATFORM CONNECTIONS</div>
      </div>

      <div className="g2" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))", gap:16 }}>

        {/* ── Steam Card ───────────────────────────────────── */}
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:46, height:46, background:"#1a9fff15", border:"1px solid #1a9fff33",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⊞</div>
            <div style={{ flex:1 }}>
              <div className="orb" style={{ fontSize:14, color:"#1a9fff", fontWeight:700 }}>STEAM</div>
              <div className="mono" style={{ fontSize:9, letterSpacing:2, color:sLinked?"var(--green)":"var(--muted)" }}>
                {sLinked ? "● CONNECTED" : "○ NOT LINKED"}
                {sLinked && sProf.source === "api" &&
                  <span style={{ color:"var(--cyan)", marginLeft:6 }}>· REAL API</span>}
                {sLinked && sProf.source === "manual" &&
                  <span style={{ color:"#ffcc00", marginLeft:6 }}>· MANUAL</span>}
              </div>
            </div>
            {sLinked && <div className="sec-badge">🔒 SECURED</div>}
          </div>

          {sLinked ? (
            <>
              {/* Profile avatar if from API */}
              {sProf.avatar && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12,
                  background:"rgba(26,159,255,0.06)", border:"1px solid rgba(26,159,255,0.15)", padding:"8px 10px" }}>
                  <img src={sProf.avatar} alt="" style={{ width:36, height:36, borderRadius:2 }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{sProf.username}</div>
                    {sProf.profileUrl && (
                      <a href={sProf.profileUrl} target="_blank" rel="noreferrer"
                        style={{ fontSize:9, color:"#1a9fff", fontFamily:"Share Tech Mono" }}>
                        VIEW PROFILE →
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[["USERNAME",sProf.username],["LEVEL",sProf.level],["BADGES",sProf.badges],
                  ["HOURS",`${sProf.totalHours}h`],["GAMES",sg.length],["VALUE",fmt(sv)]].map(([k,v]) => (
                  <div key={k} style={{ background:"rgba(26,159,255,0.04)", border:"1px solid rgba(26,159,255,0.12)", padding:"7px 10px" }}>
                    <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>{k}</div>
                    <div className="orb" style={{ fontSize:12, color:"#1a9fff", marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button className="btn o sm" onClick={() => {
                setSLinked(false);
                setSProf({ username:"", level:0, badges:0, totalHours:0 });
                setNotify({ msg:"Steam unlinked", type:"success" });
              }}>UNLINK</button>

              {/* Verification status banner */}
              {sProf.source === "manual" && (
                <div style={{ marginTop:10 }}>
                  {!vStatus && (
                    <div style={{ background:"rgba(255,204,0,0.05)", border:"1px solid rgba(255,204,0,0.25)",
                      padding:"8px 12px", fontSize:11 }}>
                      <div style={{ color:"#ffcc00", marginBottom:2 }}>🛡️ Not verified</div>
                      <div style={{ color:"var(--muted)" }}>
                        Submit screenshots for verification to get the ✓ badge on your marketplace listings.
                      </div>
                    </div>
                  )}
                  {vStatus?.status === "pending" && (
                    <div style={{ background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.25)",
                      padding:"8px 12px", fontSize:11 }}>
                      <div style={{ color:"var(--cyan)", marginBottom:2 }}>⟳ Verification pending</div>
                      <div style={{ color:"var(--muted)" }}>Owner is reviewing your screenshots. Check back soon.</div>
                    </div>
                  )}
                  {vStatus?.status === "approved" && (
                    <div style={{ background:"rgba(57,255,20,0.06)", border:"1px solid rgba(57,255,20,0.3)",
                      padding:"8px 12px", fontSize:11 }}>
                      <div style={{ color:"var(--green)" }}>✓ Verified — your listings will show the ✓ badge</div>
                    </div>
                  )}
                  {vStatus?.status === "rejected" && (
                    <div style={{ background:"rgba(255,68,68,0.07)", border:"1px solid rgba(255,68,68,0.3)",
                      padding:"8px 12px", fontSize:11 }}>
                      <div style={{ color:"#ff6666", marginBottom:3 }}>✕ Verification rejected</div>
                      <div style={{ color:"var(--muted)", marginBottom:6 }}>
                        Reason: {vStatus.reason}
                      </div>
                      <div style={{ color:"var(--orange)", fontSize:10 }}>
                        ⚠ Your Steam account has been unlinked. Please re-link and submit new screenshots.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <div style={{ color:"var(--muted)", fontSize:12, marginBottom:14, lineHeight:1.6 }}>
                Connect Steam via real API or enter your data manually.
              </div>
              <button className="btn" style={{ borderColor:"#1a9fff", color:"#1a9fff" }}
                onClick={() => { setSMode("api"); setSError(""); setSModal(true); }}>
                ⟶ LINK STEAM
              </button>
            </div>
          )}
        </div>

        {/* ── Epic Card ────────────────────────────────────── */}
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:46, height:46, background:"#39ff1415", border:"1px solid #39ff1433",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>◈</div>
            <div style={{ flex:1 }}>
              <div className="orb" style={{ fontSize:14, color:"var(--green)", fontWeight:700 }}>EPIC GAMES</div>
              <div className="mono" style={{ fontSize:9, letterSpacing:2, color:eLinked?"var(--green)":"var(--muted)" }}>
                {eLinked ? "● CONNECTED · MANUAL" : "○ NOT LINKED"}
              </div>
            </div>
            {eLinked && <div className="sec-badge">🔒 SECURED</div>}
          </div>

          {eLinked ? (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                {[["USERNAME",eProf.username],["HOURS",`${eProf.totalHours}h`],
                  ["GAMES",eg.length],["FREE",eg.filter(g=>g.price===0).length],
                  ["PAID",eg.filter(g=>g.price>0).length],["VALUE",fmt(ev)]].map(([k,v]) => (
                  <div key={k} style={{ background:"rgba(57,255,20,0.04)", border:"1px solid rgba(57,255,20,0.12)", padding:"7px 10px" }}>
                    <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>{k}</div>
                    <div className="orb" style={{ fontSize:12, color:"var(--green)", marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button className="btn o sm" onClick={() => {
                setELinked(false);
                setEProf({ username:"", totalHours:0 });
                setNotify({ msg:"Epic unlinked", type:"success" });
              }}>UNLINK</button>
            </>
          ) : (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <div style={{ color:"var(--muted)", fontSize:12, marginBottom:6, lineHeight:1.6 }}>
                Epic has no public API. Enter your games manually below.
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginBottom:14 }}>
                No password needed — just your display name and game list.
              </div>
              <button className="btn g" onClick={() => { setEGames([]); setEModal(true); }}>
                ⟶ ADD EPIC DATA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Steam Modal ────────────────────────────────────────── */}
      {sModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&!sLoad&&setSModal(false)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="orb" style={{ color:"#1a9fff", fontSize:12, letterSpacing:3, marginBottom:16 }}>
              ⊞ LINK STEAM ACCOUNT
            </div>

            {/* Mode toggle */}
            <div style={{ display:"flex", gap:8, marginBottom:18 }}>
              {[["api","🌐 REAL API (recommended)"],["manual","✏ MANUAL ENTRY"]].map(([m,lbl])=>(
                <button key={m} onClick={()=>{ setSMode(m); setSError(""); }}
                  style={{ flex:1, fontFamily:"Orbitron", fontSize:9, letterSpacing:1,
                    padding:"8px 10px", cursor:"pointer",
                    background: sMode===m ? "rgba(26,159,255,0.15)" : "rgba(26,159,255,0.03)",
                    border:`1px solid ${sMode===m?"#1a9fff":"rgba(26,159,255,0.2)"}`,
                    color: sMode===m?"#1a9fff":"var(--muted)" }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* ── API mode ───────────────────────── */}
            {sMode === "api" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {/* How-to guide */}
                <div style={{ background:"rgba(26,159,255,0.05)", border:"1px solid rgba(26,159,255,0.2)",
                  padding:"10px 14px", fontSize:11 }}>
                  <div className="mono" style={{ color:"#1a9fff", fontSize:9, letterSpacing:2, marginBottom:6 }}>
                    HOW TO GET YOUR STEAM API KEY
                  </div>
                  <div style={{ color:"var(--muted)", lineHeight:1.7 }}>
                    1. Go to <span style={{ color:"#1a9fff" }}>steamcommunity.com/dev/apikey</span><br/>
                    2. Log in → enter any domain (e.g. <span style={{ color:"var(--cyan)" }}>localhost</span>)<br/>
                    3. Copy the key and paste below
                  </div>
                  <div className="mono" style={{ color:"#ffcc00", fontSize:9, marginTop:8, letterSpacing:2 }}>
                    HOW TO FIND YOUR STEAM64 ID
                  </div>
                  <div style={{ color:"var(--muted)", lineHeight:1.7, marginTop:4 }}>
                    • Open your Steam profile URL — the number in the URL is your ID<br/>
                    • Or just enter your Steam username and we'll resolve it automatically<br/>
                    • Or use <span style={{ color:"#1a9fff" }}>steamid.io</span> to look it up
                  </div>
                  <div className="mono" style={{ color:"var(--orange)", fontSize:9, marginTop:8, letterSpacing:2 }}>
                    ⚠ IMPORTANT: Your Steam profile must be set to PUBLIC
                  </div>
                  <div style={{ color:"var(--muted)", fontSize:11, marginTop:2 }}>
                    Steam → Edit Profile → Privacy Settings → Game Details → Public
                  </div>
                </div>

                <Field label="STEAM API KEY *" value={sApiKey} onChange={setSApiKey}
                  placeholder="e.g. A1B2C3D4E5F6G7H8I9J0..." disabled={sLoad} />
                <Field label="STEAM64 ID OR USERNAME *" value={sSteamId} onChange={setSSteamId}
                  placeholder="e.g. 76561198XXXXXXXXX or gaben" disabled={sLoad} />

                {/* Progress bar */}
                {sLoad && (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div className="mono" style={{ fontSize:9, color:"#1a9fff" }}>{sProgress.msg}</div>
                      <div className="mono" style={{ fontSize:9, color:"#1a9fff" }}>{sProgress.pct}%</div>
                    </div>
                    <div style={{ height:3, background:"rgba(255,255,255,0.07)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${sProgress.pct}%`,
                        background:"linear-gradient(90deg,#1a9fff,var(--cyan))",
                        transition:"width 0.4s ease", boxShadow:"0 0 6px #1a9fff" }} />
                    </div>
                  </div>
                )}

                {sError && (
                  <div style={{ background:"rgba(255,102,0,0.08)", border:"1px solid rgba(255,102,0,0.3)",
                    padding:"10px 14px", fontSize:12, color:"var(--orange)", lineHeight:1.6 }}>
                    ⚠ {sError}
                  </div>
                )}

                <div style={{ display:"flex", gap:10, marginTop:4 }}>
                  <button className="btn full" style={{ borderColor:"#1a9fff", color:"#1a9fff" }}
                    onClick={linkSteamApi} disabled={sLoad}>
                    {sLoad
                      ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                          <span className="spinner" style={{ borderColor:"#1a9fff", borderTopColor:"transparent" }}/>
                          FETCHING FROM STEAM...
                        </span>
                      : "⟶ FETCH FROM STEAM API"}
                  </button>
                  {!sLoad && <button className="btn o" onClick={()=>setSModal(false)}>CANCEL</button>}
                </div>

                <button className="btn sm" style={{ borderColor:"var(--muted)", color:"var(--muted)" }}
                  onClick={()=>setSMode("manual")}>
                  Don't have API key? Enter data manually →
                </button>
              </div>
            )}

            {/* ── Manual mode ────────────────────── */}
            {sMode === "manual" && (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ background:"rgba(255,204,0,0.05)", border:"1px solid rgba(255,204,0,0.2)",
                  padding:"9px 14px", fontSize:11, color:"var(--muted)" }}>
                  ✏ Enter your Steam profile details manually. Find these on your Steam profile page.
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["USERNAME","text","username","Your Steam name"],
                    ["LEVEL","number","level","e.g. 42"],
                    ["TOTAL BADGES","number","badges","From your profile"],
                    ["TOTAL HOURS","number","totalHours","Across all games"]].map(([lbl,type,key,ph])=>(
                    <div key={key}>
                      <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>{lbl}</div>
                      <input className="inp" type={type} placeholder={ph} value={smF[key]}
                        onChange={e=>setSmF(p=>({...p,[key]:e.target.value}))} />
                    </div>
                  ))}
                </div>

                {/* Game entry */}
                <div style={{ border:`1px solid ${sProf.source==="api"?"var(--red, #ff2244)":"var(--border)"}`, padding:12,
                  position:"relative", opacity: sProf.source==="api" ? 0.4 : 1 }}>
                  {sProf.source==="api" && (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                      justifyContent:"center", zIndex:2, flexDirection:"column", gap:4,
                      background:"rgba(255,34,68,0.08)" }}>
                      <div style={{ color:"var(--red,#ff2244)", fontFamily:"Share Tech Mono", fontSize:11,
                        textDecoration:"line-through", letterSpacing:2 }}>MANUAL ENTRY DISABLED</div>
                      <div style={{ color:"var(--muted)", fontSize:10 }}>API data already imported</div>
                    </div>
                  )}
                  <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2, marginBottom:10 }}>
                    ADD YOUR GAMES
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8, marginBottom:8 }}>
                    <div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>GAME NAME</div>
                      <input className="inp" style={{ fontSize:12 }} placeholder="e.g. Elden Ring"
                        value={smNewG.name} onChange={e=>setSmNewG(p=>({...p,name:e.target.value}))} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>HOURS</div>
                      <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                        value={smNewG.playtime} onChange={e=>setSmNewG(p=>({...p,playtime:e.target.value}))} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>PRICE $</div>
                      <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                        value={smNewG.price} onChange={e=>setSmNewG(p=>({...p,price:e.target.value}))} />
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>ACHIEVEMENTS TOTAL</div>
                      <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                        value={smNewG.total} onChange={e=>setSmNewG(p=>({...p,total:e.target.value}))} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>ACHIEVEMENTS EARNED</div>
                      <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                        value={smNewG.earned} onChange={e=>setSmNewG(p=>({...p,earned:e.target.value}))} />
                    </div>
                  </div>
                  {/* Genre picker */}
                  <div style={{marginBottom:8}}>
                    <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:4,letterSpacing:1}}>
                      GENRES <span style={{color:"var(--cyan)"}}>(SELECT MULTIPLE)</span>
                    </div>
                    <GenrePicker selected={smNewG.genres} onChange={g=>setSmNewG(p=>({...p,genres:g}))} color="var(--cyan)" />
                  </div>
                  {/* Icon picker */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                    {EMOJIS.slice(0,16).map(em=>(
                      <button key={em} onClick={()=>setSmNewG(p=>({...p,img:em}))} style={{
                        fontSize:14, background:smNewG.img===em?"rgba(0,245,255,0.15)":"rgba(0,245,255,0.03)",
                        border:`1px solid ${smNewG.img===em?"var(--cyan)":"var(--border)"}`,
                        padding:"3px 5px", cursor:"pointer" }}>{em}</button>
                    ))}
                  </div>
                  {/* Logo search for steam manual */}
                  <div style={{marginBottom:8}}>
                    <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:1,marginBottom:4}}>
                      GAME LOGO <span style={{color:"var(--cyan)"}}>(OPTIONAL)</span>
                    </div>
                    <LogoPicker gameName={smNewG.name} imgUrl={smNewG.imgUrl}
                      onSelect={url=>setSmNewG(p=>({...p,imgUrl:url||""}))} />
                  </div>
                  <button className="btn g sm" onClick={addManualSteamGame} disabled={!smNewG.name.trim()}>
                    + ADD GAME
                  </button>
                </div>

                {/* Added games list */}
                {smGames.length > 0 && (
                  <div style={{ maxHeight:160, overflowY:"auto", display:"flex", flexDirection:"column", gap:5 }}>
                    {smGames.map((g,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"center",
                        background:"rgba(0,245,255,0.03)", border:"1px solid var(--border)", padding:"6px 10px" }}>
                        <span>{g.img}</span>
                        <span style={{ flex:1, fontSize:12 }}>{g.name}</span>
                        <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{g.playtime}h</span>
                        <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
                          {g.achievements.total>0?`🏅${g.achievements.earned}/${g.achievements.total}`:""}
                        </span>
                        <button onClick={()=>setSmGames(p=>p.filter((_,j)=>j!==i))}
                          style={{ background:"none", border:"none", color:"var(--orange)", cursor:"pointer", fontSize:12 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Screenshot verification — 2 required */}
                <div style={{ border:"1px solid rgba(255,204,0,0.35)", padding:12, marginTop:4 }}>
                  <div className="mono" style={{ fontSize:9, color:"#ffcc00", letterSpacing:2, marginBottom:6 }}>
                    📸 VERIFICATION SCREENSHOTS (REQUIRED FOR ✓ BADGE)
                  </div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:10, lineHeight:1.6 }}>
                    Upload <strong style={{color:"#ffcc00"}}>two screenshots</strong> — the owner reviews both
                    before awarding your <span style={{color:"var(--green)"}}>✓ Verified</span> badge.
                    <br/><span style={{color:"var(--orange)",fontSize:10}}>
                      ⚠ Badge is awarded only after owner approval. Rejection will unlink your account.
                    </span>
                  </div>

                  {/* Slot 1 — Library */}
                  <div style={{marginBottom:10}}>
                    <div className="mono" style={{fontSize:8,color:"var(--cyan)",letterSpacing:2,marginBottom:5}}>
                      📚 SCREENSHOT 1: YOUR STEAM LIBRARY (required)
                    </div>
                    <div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>
                      Open Steam → Library tab → take a screenshot showing your game list.
                    </div>
                    {ssLibrary ? (
                      <div style={{position:"relative",display:"inline-block"}}>
                        <img src={ssLibrary.dataUrl} alt="library"
                          style={{width:"100%",maxWidth:280,height:100,objectFit:"cover",
                            border:"1px solid rgba(57,255,20,0.4)",display:"block"}} />
                        <div style={{position:"absolute",top:4,right:4,display:"flex",gap:4}}>
                          <span className="mono" style={{background:"rgba(57,255,20,0.15)",
                            border:"1px solid var(--green)",color:"var(--green)",
                            fontSize:8,padding:"2px 6px"}}>✓ UPLOADED</span>
                          <button onClick={()=>setSsLibrary(null)} style={{background:"rgba(255,34,68,0.7)",
                            border:"none",color:"#fff",fontSize:9,cursor:"pointer",padding:"2px 5px"}}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <label style={{cursor:"pointer"}}>
                        <div style={{border:"2px dashed rgba(57,255,20,0.25)",padding:"14px 20px",
                          textAlign:"center",color:"var(--muted)",fontSize:11}}>
                          📂 Click to upload library screenshot
                        </div>
                        <input type="file" accept="image/*" style={{display:"none"}}
                          onChange={e=>e.target.files[0]&&readFile(e.target.files[0],setSsLibrary)} />
                      </label>
                    )}
                  </div>

                  {/* Slot 2 — Profile/Account info */}
                  <div style={{marginBottom:10}}>
                    <div className="mono" style={{fontSize:8,color:"var(--cyan)",letterSpacing:2,marginBottom:5}}>
                      👤 SCREENSHOT 2: YOUR STEAM PROFILE / ACCOUNT INFO (required)
                    </div>
                    <div style={{fontSize:10,color:"var(--muted)",marginBottom:6}}>
                      Open your Steam profile page showing your username, level, and badges.
                    </div>
                    {ssProfile ? (
                      <div style={{position:"relative",display:"inline-block"}}>
                        <img src={ssProfile.dataUrl} alt="profile"
                          style={{width:"100%",maxWidth:280,height:100,objectFit:"cover",
                            border:"1px solid rgba(57,255,20,0.4)",display:"block"}} />
                        <div style={{position:"absolute",top:4,right:4,display:"flex",gap:4}}>
                          <span className="mono" style={{background:"rgba(57,255,20,0.15)",
                            border:"1px solid var(--green)",color:"var(--green)",
                            fontSize:8,padding:"2px 6px"}}>✓ UPLOADED</span>
                          <button onClick={()=>setSsProfile(null)} style={{background:"rgba(255,34,68,0.7)",
                            border:"none",color:"#fff",fontSize:9,cursor:"pointer",padding:"2px 5px"}}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <label style={{cursor:"pointer"}}>
                        <div style={{border:"2px dashed rgba(57,255,20,0.25)",padding:"14px 20px",
                          textAlign:"center",color:"var(--muted)",fontSize:11}}>
                          📂 Click to upload profile screenshot
                        </div>
                        <input type="file" accept="image/*" style={{display:"none"}}
                          onChange={e=>e.target.files[0]&&readFile(e.target.files[0],setSsProfile)} />
                      </label>
                    )}
                  </div>

                  {/* Submit button */}
                  {(ssLibrary||ssProfile) && (
                    <button
                      className="btn sm"
                      style={{borderColor:"#ffcc00",color:"#ffcc00",marginTop:4}}
                      disabled={!ssLibrary||!ssProfile||verifyLoad}
                      onClick={()=>{
                        if(!ssLibrary||!ssProfile){return;}
                        setVerifyLoad(true);
                        setTimeout(()=>{
                          submitVerification({
                            username: user?.username || smF.username || "unknown",
                            steamScreenshot:  ssProfile.dataUrl,
                            libraryScreenshot: ssLibrary.dataUrl,
                          });
                          setVerifyLoad(false);
                          setNotify({msg:"✓ Verification request submitted — owner will review your screenshots",type:"success"});
                        },600);
                      }}
                    >
                      {!ssLibrary||!ssProfile
                        ? `⚠ Upload both screenshots first (${[ssLibrary,ssProfile].filter(Boolean).length}/2)`
                        : verifyLoad ? "SUBMITTING..." : "⟶ SUBMIT FOR VERIFICATION"}
                    </button>
                  )}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn full" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                    onClick={linkSteamManual}>
                    ⟶ SAVE STEAM DATA
                  </button>
                  <button className="btn o" onClick={()=>setSModal(false)}>CANCEL</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Epic Modal ─────────────────────────────────────────── */}
      {eModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&!eLoad&&setEModal(false)}>
          <div className="modal" style={{ maxWidth:560 }}>
            <div className="orb" style={{ color:"var(--green)", fontSize:12, letterSpacing:3, marginBottom:14 }}>
              ◈ ADD EPIC GAMES DATA
            </div>
            <div style={{ background:"rgba(57,255,20,0.04)", border:"1px solid rgba(57,255,20,0.18)",
              padding:"9px 14px", marginBottom:14, fontSize:11, color:"var(--muted)" }}>
              Epic Games has no public API. Enter your library manually — find your games in the Epic launcher.
              No password needed.
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>EPIC DISPLAY NAME *</div>
                <input className="inp" placeholder="Your Epic name" value={eF.username}
                  onChange={e=>setEF(p=>({...p,username:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>TOTAL HOURS (optional)</div>
                <input className="inp" type="number" placeholder="0" value={eF.totalHours}
                  onChange={e=>setEF(p=>({...p,totalHours:e.target.value}))} />
              </div>
            </div>

            {/* Add games */}
            <div style={{ border:"1px solid var(--border)", padding:12, marginBottom:12 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--green)", letterSpacing:2, marginBottom:10 }}>
                ADD YOUR EPIC GAMES
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>GAME NAME</div>
                  <input className="inp" style={{ fontSize:12 }} placeholder="e.g. Fortnite"
                    value={eNewG.name} onChange={e=>setENewG(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>HOURS</div>
                  <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                    value={eNewG.playtime} onChange={e=>setENewG(p=>({...p,playtime:e.target.value}))} />
                </div>
                <div>
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginBottom:4 }}>PRICE $</div>
                  <input className="inp" type="number" style={{ fontSize:12 }} placeholder="0"
                    value={eNewG.price} onChange={e=>setENewG(p=>({...p,price:e.target.value}))} disabled={eNewG.free} />
                </div>
              </div>
              {/* Free game toggle */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <button onClick={()=>setENewG(p=>({...p,free:!p.free}))} style={{
                  background: eNewG.free?"rgba(57,255,20,0.15)":"rgba(57,255,20,0.03)",
                  border:`1px solid ${eNewG.free?"var(--green)":"rgba(57,255,20,0.2)"}`,
                  color: eNewG.free?"var(--green)":"var(--muted)",
                  fontFamily:"Share Tech Mono", fontSize:9, padding:"4px 10px", cursor:"pointer" }}>
                  {eNewG.free ? "✓ FREE GAME" : "○ FREE GAME"}
                </button>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Toggle if this was a free Epic claim</span>
              </div>
              {/* Genre picker */}
              <div style={{marginBottom:8}}>
                <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:4,letterSpacing:1}}>
                  GENRES <span style={{color:"var(--green)"}}>(SELECT MULTIPLE)</span>
                </div>
                <GenrePicker selected={eNewG.genres} onChange={g=>setENewG(p=>({...p,genres:g}))} color="var(--green)" />
              </div>
              {/* Icon picker */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:8 }}>
                {EMOJIS.slice(0,16).map(em=>(
                  <button key={em} onClick={()=>setENewG(p=>({...p,img:em}))} style={{
                    fontSize:14, background:eNewG.img===em?"rgba(57,255,20,0.15)":"rgba(57,255,20,0.03)",
                    border:`1px solid ${eNewG.img===em?"var(--green)":"rgba(57,255,20,0.2)"}`,
                    padding:"3px 5px", cursor:"pointer" }}>{em}</button>
                ))}
              </div>
              {/* Logo search for epic manual */}
              <div style={{marginBottom:8}}>
                <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:1,marginBottom:4}}>
                  GAME LOGO <span style={{color:"var(--green)"}}>(OPTIONAL)</span>
                </div>
                <LogoPicker gameName={eNewG.name} imgUrl={eNewG.imgUrl}
                  onSelect={url=>setENewG(p=>({...p,imgUrl:url||""}))} color="var(--green)" />
              </div>
              <button className="btn g sm" onClick={addEpicGame} disabled={!eNewG.name.trim()}>
                + ADD GAME
              </button>
            </div>

            {/* Added games */}
            {eGames.length > 0 && (
              <div style={{ maxHeight:150, overflowY:"auto", display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
                {eGames.map((g,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, alignItems:"center",
                    background:"rgba(57,255,20,0.03)", border:"1px solid rgba(57,255,20,0.15)", padding:"6px 10px" }}>
                    <span>{g.img}</span>
                    <span style={{ flex:1, fontSize:12 }}>{g.name}</span>
                    <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{g.playtime}h</span>
                    <span className="mono" style={{ fontSize:9, color:g.price===0?"var(--green)":"var(--cyan)" }}>
                      {g.price===0?"FREE":"$"+g.price}
                    </span>
                    <button onClick={()=>setEGames(p=>p.filter((_,j)=>j!==i))}
                      style={{ background:"none", border:"none", color:"var(--orange)", cursor:"pointer", fontSize:12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:10 }}>
              <button className="btn g full" onClick={linkEpic} disabled={eLoad}>
                {eLoad
                  ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <span className="spinner" style={{ borderColor:"var(--green)", borderTopColor:"transparent" }}/>SAVING...
                    </span>
                  : `⟶ SAVE EPIC DATA (${eGames.length} games)`}
              </button>
              {!eLoad && <button className="btn o" onClick={()=>setEModal(false)}>CANCEL</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
