import { useState } from "react";
import { fmt } from "../utils/helpers";
import { Sparkline } from "../components/Charts";
import { PRICE_HISTORY } from "../constants/data";
import { addReport } from "../constants/ownerData";

export default function AccountDetail({ listing, onBack, onOffer, onBuy, onContact, setNotify, currentUser }) {
  const [reportModal, setReportModal] = useState(false);
  const [rType,  setRType]  = useState("Scam");
  const [rDesc,  setRDesc]  = useState("");
  const [offerModal, setOfferModal] = useState(false);
  const [offerAmt,   setOfferAmt]   = useState("");

  const l = listing;
  const totalVal = (l.steamVal || 0) + (l.epicVal || 0);
  const history  = PRICE_HISTORY[l.id] || [];
  const deal     = totalVal > 0 ? Math.round((1 - l.askPrice / totalVal) * 100) : 0;

  const Stars = ({ n }) => (
    <span style={{ color:"var(--orange)", fontSize:13 }}>
      {"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}
    </span>
  );

  const submitReport = () => {
    if (!rDesc.trim()) { setNotify({ msg:"Describe the issue", type:"error" }); return; }
    addReport({
      type: rType,
      description: rDesc,
      reportedUser: l.seller,
      reportedBy: currentUser?.name || "Anonymous",
      listingId: l.id,
    });
    setReportModal(false); setRDesc("");
    setNotify({ msg:"Report submitted to owner", type:"success" });
  };

  const submitOffer = () => {
    if (!offerAmt || +offerAmt <= 0) { setNotify({ msg:"Enter valid offer amount", type:"error" }); return; }
    onOffer(l, +offerAmt);
    setOfferModal(false); setOfferAmt("");
  };

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:960, margin:"0 auto" }}>

      {/* Back button */}
      <button className="btn sm" style={{ marginBottom:20 }} onClick={onBack}>
        ← BACK TO MARKET
      </button>

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="card" style={{ padding:24, marginBottom:16,
        borderColor: l.verified ? "rgba(57,255,20,0.35)" : "var(--border)" }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>

          {/* Avatar */}
          <div style={{ width:64, height:64, background:"linear-gradient(135deg,rgba(0,245,255,0.15),rgba(191,0,255,0.15))",
            border:"2px solid var(--border)", display:"flex", alignItems:"center",
            justifyContent:"center", fontSize:22, fontFamily:"Orbitron", fontWeight:900,
            flexShrink:0, color:"var(--cyan)" }}>
            {l.seller.slice(0,2).toUpperCase()}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
              <div className="orb" style={{ fontSize:20, fontWeight:700 }}>{l.seller}</div>
              {l.verified && (
                <span style={{ background:"rgba(57,255,20,0.1)", border:"1px solid rgba(57,255,20,0.4)",
                  color:"var(--green)", fontSize:9, fontFamily:"Share Tech Mono",
                  padding:"2px 8px" }}>✓ VERIFIED SELLER</span>
              )}
              {l.isOwn && (
                <span style={{ fontSize:9, color:"var(--orange)", fontFamily:"Share Tech Mono",
                  border:"1px solid var(--orange)", padding:"2px 6px" }}>YOUR LISTING</span>
              )}
            </div>
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
              {l.steam && <span className="tag s">⊞ STEAM</span>}
              {l.epic  && <span className="tag e">◈ EPIC</span>}
            </div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
              <Stars n={l.rating} />
              <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>
                {l.rating}/5.0 · {l.reviews} review{l.reviews !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Price block */}
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div className="orb" style={{ fontSize:28, fontWeight:900, color:"var(--cyan)",
              textShadow:"0 0 14px var(--cyan)" }}>
              {fmt(l.askPrice)}
            </div>
            {deal > 0 && (
              <div style={{ background:"rgba(57,255,20,0.1)", border:"1px solid rgba(57,255,20,0.3)",
                color:"var(--green)", fontSize:10, fontFamily:"Share Tech Mono",
                padding:"2px 8px", marginTop:4, textAlign:"center" }}>
                {deal}% BELOW VALUE
              </div>
            )}
            {deal < 0 && (
              <div style={{ color:"var(--orange)", fontSize:10, fontFamily:"Share Tech Mono", marginTop:4 }}>
                {Math.abs(deal)}% ABOVE VALUE
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        {l.note && (
          <div style={{ marginTop:14, padding:"10px 14px",
            background:"rgba(0,245,255,0.03)", border:"1px solid rgba(0,245,255,0.1)",
            fontSize:13, color:"var(--muted)", fontStyle:"italic",
            borderLeft:"3px solid rgba(0,245,255,0.25)" }}>
            "{l.note}"
          </div>
        )}
      </div>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>

        {/* Account Value Breakdown */}
        <div className="card" style={{ padding:18 }}>
          <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:14 }}>
            ◈ ACCOUNT VALUE BREAKDOWN
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {l.steam && (
              <div style={{ background:"rgba(26,159,255,0.05)", border:"1px solid rgba(26,159,255,0.2)", padding:"10px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2 }}>⊞ STEAM VALUE</div>
                  <div className="orb" style={{ color:"#1a9fff", fontWeight:700 }}>{fmt(l.steamVal)}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["LEVEL",l.level],["BADGES",l.badges],["GAMES",l.games]].map(([k,v])=>(
                    <div key={k} style={{ textAlign:"center", padding:"6px 0",
                      borderTop:"1px solid rgba(26,159,255,0.15)" }}>
                      <div className="orb" style={{ color:"#1a9fff", fontSize:14 }}>{v}</div>
                      <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:2 }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {l.epic && (
              <div style={{ background:"rgba(57,255,20,0.04)", border:"1px solid rgba(57,255,20,0.2)", padding:"10px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2 }}>◈ EPIC VALUE</div>
                  <div className="orb" style={{ color:"var(--green)", fontWeight:700 }}>{fmt(l.epicVal)}</div>
                </div>
              </div>
            )}
            <div style={{ background:"rgba(0,245,255,0.04)", border:"1px solid rgba(0,245,255,0.25)",
              padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
              <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2 }}>TOTAL ESTIMATED VALUE</div>
              <div className="orb" style={{ color:"var(--cyan)", fontWeight:900, fontSize:16 }}>{fmt(totalVal)}</div>
            </div>
            <div style={{ background:"rgba(255,102,0,0.05)", border:"1px solid rgba(255,102,0,0.2)",
              padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div className="mono" style={{ fontSize:9, color:"var(--orange)", letterSpacing:2 }}>ASKING PRICE</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div className="orb" style={{ color:"var(--orange)", fontWeight:900, fontSize:16 }}>{fmt(l.askPrice)}</div>
                {deal > 0 && <span style={{ color:"var(--green)", fontSize:11 }}>↓ {deal}% off</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Seller rating + contact + price history */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Seller rating */}
          <div className="card" style={{ padding:18 }}>
            <div className="orb" style={{ fontSize:10, color:"var(--orange)", letterSpacing:2, marginBottom:12 }}>★ SELLER RATING</div>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
              <div className="orb" style={{ fontSize:36, color:"var(--orange)" }}>{l.rating}</div>
              <div>
                <Stars n={l.rating} />
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginTop:3 }}>
                  Based on {l.reviews} review{l.reviews!==1?"s":""}
                </div>
              </div>
            </div>
            {/* Rating bar breakdown (simulated) */}
            {[5,4,3,2,1].map(star => {
              const pct = star === Math.round(l.rating) ? 60 : star === Math.round(l.rating)-1 ? 25 : star > Math.round(l.rating) ? 0 : 10;
              return (
                <div key={star} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ color:"var(--orange)", fontSize:10, width:10 }}>{star}</span>
                  <div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:"var(--orange)", borderRadius:3 }} />
                  </div>
                  <span className="mono" style={{ fontSize:8, color:"var(--muted)", width:24 }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Contact info */}
          <div className="card" style={{ padding:18 }}>
            <div className="orb" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2, marginBottom:12 }}>
              ✉ CONTACT INFO
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ background:"rgba(0,245,255,0.04)", border:"1px solid var(--border)", padding:"9px 12px" }}>
                <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2, marginBottom:3 }}>EMAIL</div>
                <div style={{ color:"var(--cyan)", fontSize:13 }}>✉ {l.email}</div>
              </div>
              {l.discord && l.discord !== "—" && (
                <div style={{ background:"rgba(191,0,255,0.04)", border:"1px solid rgba(191,0,255,0.2)", padding:"9px 12px" }}>
                  <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2, marginBottom:3 }}>DISCORD</div>
                  <div style={{ color:"var(--purple)", fontSize:13 }}>💬 {l.discord}</div>
                </div>
              )}
            </div>
          </div>

          {/* Price history sparkline */}
          {history.length > 1 && (
            <div className="card" style={{ padding:18 }}>
              <div className="orb" style={{ fontSize:10, color:"#ffcc00", letterSpacing:2, marginBottom:10 }}>
                📈 PRICE HISTORY
              </div>
              <Sparkline data={history} width={260} height={50} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
                  Start: {fmt(history[0].v)}
                </span>
                <span className="mono" style={{ fontSize:9,
                  color: history[history.length-1].v <= history[0].v ? "var(--green)" : "var(--orange)" }}>
                  Now: {fmt(history[history.length-1].v)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Full Game Library ──────────────────────────────────── */}
      <div className="card" style={{ padding:18, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div className="orb" style={{ fontSize:10, color:"var(--purple)", letterSpacing:2 }}>◫ FULL GAME LIBRARY</div>
            <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:2 }}>
              {l.games} GAMES · ESTIMATED LIBRARY VALUE {fmt((l.steamVal||0)+(l.epicVal||0))}
            </div>
          </div>
        </div>

        {/* Simulated game list based on listing data */}
        {(() => {
          // Generate a realistic simulated game list from listing metadata
          const steamGames = l.steam ? [
            { name:"Counter-Strike 2",  platform:"steam", playtime:Math.round(l.level*4.2), price:0,     achievements:{ total:167, earned:Math.round(l.badges*2.3) }, img:"🔫" },
            { name:"Dota 2",            platform:"steam", playtime:Math.round(l.level*3.1), price:0,     achievements:{ total:63,  earned:Math.round(l.badges*0.8) }, img:"🏆" },
            { name:"Cyberpunk 2077",    platform:"steam", playtime:Math.round(l.level*1.8), price:59.99, achievements:{ total:50,  earned:Math.round(l.badges*0.6) }, img:"🌆" },
            { name:"Elden Ring",        platform:"steam", playtime:Math.round(l.level*2.1), price:59.99, achievements:{ total:42,  earned:Math.round(l.badges*0.5) }, img:"⚔️" },
            { name:"Baldur's Gate 3",   platform:"steam", playtime:Math.round(l.level*1.5), price:59.99, achievements:{ total:54,  earned:Math.round(l.badges*0.4) }, img:"🧙" },
            { name:"Hogwarts Legacy",   platform:"steam", playtime:Math.round(l.level*0.9), price:49.99, achievements:{ total:45,  earned:Math.round(l.badges*0.6) }, img:"🦉" },
          ].slice(0, Math.min(l.games, 6)) : [];
          const epicGames = l.epic ? [
            { name:"Fortnite",          platform:"epic",  playtime:Math.round(l.games*5.2), price:0,     achievements:{ total:0, earned:0 }, img:"🎯" },
            { name:"Rocket League",     platform:"epic",  playtime:Math.round(l.games*3.1), price:0,     achievements:{ total:0, earned:0 }, img:"🚀" },
            { name:"Alan Wake 2",       platform:"epic",  playtime:Math.round(l.games*1.2), price:59.99, achievements:{ total:0, earned:0 }, img:"🔦" },
          ].slice(0, Math.min(3, Math.round(l.games/3))) : [];

          const allGames = [...steamGames, ...epicGames];

          return (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:10 }}>
              {allGames.map((g, i) => (
                <div key={i} style={{ background:"rgba(0,245,255,0.02)", border:"1px solid var(--border)",
                  padding:"10px 12px", display:"flex", gap:10, alignItems:"center" }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>{g.img}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {g.name}
                    </div>
                    <div style={{ display:"flex", gap:6, marginTop:3, alignItems:"center" }}>
                      <span className={`tag ${g.platform==="steam"?"s":"e"}`}>{g.platform.toUpperCase()}</span>
                      <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>⏱{g.playtime}h</span>
                      <span className="mono" style={{ fontSize:9, color:g.price===0?"var(--green)":"var(--cyan)" }}>
                        {g.price===0?"FREE":fmt(g.price)}
                      </span>
                    </div>
                    {g.achievements?.total > 0 && (
                      <div style={{ marginTop:5 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                          <span style={{ fontSize:9, color:"var(--muted)" }}>🏅 Achievements</span>
                          <span className="mono" style={{ fontSize:8, color:"#ffcc00" }}>
                            {Math.min(g.achievements.earned, g.achievements.total)}/{g.achievements.total}
                          </span>
                        </div>
                        <div className="progress">
                          <div className="progress-fill" style={{
                            width:`${Math.min((g.achievements.earned/g.achievements.total)*100,100)}%`,
                            background:"linear-gradient(90deg,#ffcc00,#ff6600)",
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Remaining games count */}
              {l.games > allGames.length && (
                <div style={{ background:"rgba(191,0,255,0.04)", border:"1px solid rgba(191,0,255,0.15)",
                  padding:"10px 12px", display:"flex", alignItems:"center", justifyContent:"center",
                  flexDirection:"column", gap:4 }}>
                  <div className="orb" style={{ color:"var(--purple)", fontSize:18 }}>
                    +{l.games - allGames.length}
                  </div>
                  <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>MORE GAMES</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Offers ────────────────────────────────────────────── */}
      {(l.offers?.length > 0) && (
        <div className="card" style={{ padding:18, marginBottom:16 }}>
          <div className="orb" style={{ fontSize:10, color:"var(--purple)", letterSpacing:2, marginBottom:12 }}>
            💬 OFFERS ({l.offers.length})
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {l.offers.map((o, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 14px", background:"rgba(191,0,255,0.05)", border:"1px solid rgba(191,0,255,0.18)" }}>
                <div>
                  <span className="orb" style={{ color:"var(--purple)", fontSize:15 }}>{fmt(o.amount)}</span>
                  <span className="mono" style={{ fontSize:9, color:"var(--muted)", marginLeft:10 }}>
                    by {o.by} · {o.time}
                  </span>
                </div>
                <span className="mono" style={{ fontSize:9,
                  color: o.amount >= l.askPrice ? "var(--green)" : "var(--orange)" }}>
                  {o.amount >= l.askPrice ? "FULL PRICE" : `${Math.round((1-o.amount/l.askPrice)*100)}% BELOW ASK`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ─────────────────────────────────────── */}
      {!l.isOwn && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
          <button className="btn g" style={{ flex:1, minWidth:120 }} onClick={() => onBuy(l)}>
            ⟶ BUY NOW {fmt(l.askPrice)}
          </button>
          <button className="btn p" onClick={() => setOfferModal(true)}>
            💬 MAKE OFFER
          </button>
          <button className="btn" onClick={() => onContact(l)}>
            ✉ CONTACT
          </button>
          <button className="btn o sm" onClick={() => setReportModal(true)}>
            🚨 REPORT
          </button>
        </div>
      )}

      {/* Safety notice */}
      <div style={{ background:"rgba(255,102,0,0.05)", border:"1px solid rgba(255,102,0,0.2)",
        padding:"10px 14px", fontSize:11, display:"flex", gap:8 }}>
        <span style={{ color:"var(--orange)", flexShrink:0 }}>⚠</span>
        <span style={{ color:"var(--muted)" }}>
          Never pay via gift cards. Use PayPal G&S or a trusted escrow service.
          Always verify account access before sending full payment. GameVault is not responsible for transactions.
        </span>
      </div>

      {/* ── Offer Modal ──────────────────────────────────────── */}
      {offerModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setOfferModal(false)}>
          <div className="modal">
            <div className="orb" style={{ color:"var(--purple)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              💬 MAKE AN OFFER
            </div>
            <div style={{ marginBottom:14, fontSize:13, color:"var(--muted)" }}>
              Offering to <span style={{ color:"var(--cyan)" }}>{l.seller}</span>.
              Listed at <span style={{ color:"var(--cyan)" }}>{fmt(l.askPrice)}</span>.
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>YOUR OFFER ($)</div>
              <input className="inp" type="number" placeholder={`Up to ${l.askPrice}`}
                value={offerAmt} onChange={e=>setOfferAmt(e.target.value)} />
              {offerAmt && +offerAmt < l.askPrice && (
                <div className="mono" style={{ fontSize:10, color:"#ffcc00", marginTop:4 }}>
                  {Math.round((1-+offerAmt/l.askPrice)*100)}% below asking price
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn p" style={{ flex:1 }} onClick={submitOffer}>⟶ SEND OFFER</button>
              <button className="btn o" onClick={()=>setOfferModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ─────────────────────────────────────── */}
      {reportModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setReportModal(false)}>
          <div className="modal" style={{ borderColor:"var(--orange)" }}>
            <div className="orb" style={{ color:"var(--orange)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              🚨 REPORT SELLER
            </div>
            <div style={{ marginBottom:14, fontSize:13, color:"var(--muted)" }}>
              Reporting <span style={{ color:"var(--cyan)" }}>{l.seller}</span>. Your report goes to the site owner.
            </div>
            <div style={{ marginBottom:14 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>REPORT TYPE</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["Scam","Fake Listing","Wrong Info","Harassment","Other"].map(t => (
                  <button key={t} onClick={()=>setRType(t)} style={{
                    fontFamily:"Share Tech Mono", fontSize:9, padding:"4px 10px", cursor:"pointer",
                    background: rType===t?"rgba(255,102,0,0.2)":"rgba(255,102,0,0.04)",
                    border:`1px solid ${rType===t?"var(--orange)":"rgba(255,102,0,0.2)"}`,
                    color: rType===t?"var(--orange)":"var(--muted)",
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>DESCRIPTION *</div>
              <textarea className="inp" rows={3} placeholder="Describe the issue in detail..."
                value={rDesc} onChange={e=>setRDesc(e.target.value)}
                style={{ resize:"vertical", fontFamily:"Rajdhani", lineHeight:1.5 }} />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn o" style={{ flex:1 }} onClick={submitReport}>⟶ SUBMIT REPORT</button>
              <button className="btn" onClick={()=>setReportModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
