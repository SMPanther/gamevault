import { useState } from "react";
import { WISH_SUGG, EMOJIS, autoDetectCategories } from "../constants/data";
import { fmt } from "../utils/helpers";

export default function Wishlist({ sg, eg, setSg, setEg, extras, setExtras, setNotify }) {
  const [addModal, setAddModal] = useState(false);
  const [newW, setNewW] = useState({ name:"", platform:"steam", price:0, img:"🎮" });

  const libWish = [...sg,...eg].filter(g => g.wishlist);
  const allW    = [...libWish, ...extras].filter(g => g && g.name);

  const removeLib = g => {
    const t = arr => arr.map(x => x.id === g.id ? { ...x, wishlist:false } : x);
    if (g.platform === "steam") setSg(t); else setEg(t);
    setNotify({ msg:"Removed from wishlist", type:"success" });
  };

  const addNew = () => {
    if (!newW.name.trim()) return;
    const categories = autoDetectCategories(newW.name);
    setExtras(p => [...p, { ...newW, id:`wx${Date.now()}`, price:+newW.price, metacritic:80, categories }]);
    setAddModal(false);
    setNewW({ name:"", platform:"steam", price:0, img:"🎮" });
    setNotify({ msg:`"${newW.name}" added! Categories: ${categories.join(", ")}`, type:"success" });
  };

  const addSugg = s => {
    if (extras.find(x=>x.id===s.id) || libWish.find(x=>x.name===s.name)) {
      setNotify({ msg:"Already in wishlist", type:"error" }); return;
    }
    setExtras(p => [...p, { ...s, platform: s.platform||"steam", categories: s.categories||s.genres||[] }]);
    setNotify({ msg:`"${s.name}" added!`, type:"success" });
  };

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="orb" style={{ fontSize:20, fontWeight:700, color:"#ffcc00", textShadow:"0 0 10px #ffcc00" }}>
            ★ WISHLIST
          </div>
          <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>
            {allW.length} GAMES · TOTAL {fmt(allW.reduce((s,g)=>s+g.price,0))}
          </div>
        </div>
        <button className="btn" style={{ borderColor:"#ffcc00", color:"#ffcc00" }} onClick={() => setAddModal(true)}>
          + ADD TO WISHLIST
        </button>
      </div>

      {allW.length === 0 ? (
        <div style={{ textAlign:"center", padding:50, color:"var(--muted)" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>★</div>
          <div className="mono" style={{ marginBottom:8 }}>WISHLIST IS EMPTY</div>
          <div style={{ fontSize:13 }}>Star games in your library or add new ones below</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:22 }}>
          {allW.map(g => (
            <div key={g.id} className="card card-h" style={{
              padding:14, borderColor:"rgba(255,204,0,0.2)", display:"flex", gap:12, alignItems:"flex-start",
            }}>
              <div style={{ fontSize:26, width:42, height:42, background:"rgba(255,204,0,0.06)",
                border:"1px solid rgba(255,204,0,0.2)", display:"flex", alignItems:"center",
                justifyContent:"center", flexShrink:0 }}>{g.img}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {g.name}
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:5, flexWrap:"wrap" }}>
                  <span className={`tag ${String(g.platform||"steam")==="steam"?"s":"e"}`}>{String(g.platform||"steam").toUpperCase()}</span>
                  {(g.categories||[]).slice(0,2).map(c => <span key={c} className="tag cat">{c}</span>)}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span className="orb" style={{ fontSize:14, color:"#ffcc00" }}>{fmt(g.price)}</span>
                  <button className="btn o sm" onClick={() => {
                    if (libWish.find(x=>x.id===g.id)) removeLib(g);
                    else setExtras(p=>p.filter(x=>x.id!==g.id));
                  }}>REMOVE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      <div className="card" style={{ padding:18 }}>
        <div className="orb" style={{ fontSize:10, color:"var(--purple)", letterSpacing:2, marginBottom:12 }}>
          ◈ RECOMMENDED FOR YOU
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:10 }}>
          {WISH_SUGG.map(s => (
            <div key={s.id} className="card-h" style={{
              background:"rgba(191,0,255,0.04)", border:"1px solid rgba(191,0,255,0.15)",
              padding:12, display:"flex", gap:10, alignItems:"center",
            }}>
              <span style={{ fontSize:22 }}>{s.img}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {s.name}
                </div>
                <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                  {(s.categories||[]).slice(0,2).map(c=><span key={c} className="tag cat">{c}</span>)}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:5 }}>
                  <span style={{ color:"var(--purple)", fontWeight:700, fontSize:13 }}>{fmt(s.price)}</span>
                  <button className="btn p sm" onClick={() => addSugg(s)}>+ WANT</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {addModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setAddModal(false)}>
          <div className="modal">
            <div className="orb" style={{ color:"#ffcc00", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              ★ ADD TO WISHLIST
            </div>
            <div style={{ display:"grid", gap:12 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>GAME NAME</div>
                <input className="inp" placeholder="e.g. Starfield" value={newW.name}
                  onChange={e=>setNewW(p=>({...p,name:e.target.value}))} />
                {newW.name.trim() && (
                  <div style={{ marginTop:5, display:"flex", gap:4, flexWrap:"wrap" }}>
                    <span className="mono" style={{ fontSize:9, color:"var(--cyan)" }}>AUTO: </span>
                    {autoDetectCategories(newW.name).map(c=><span key={c} className="tag cat">{c}</span>)}
                  </div>
                )}
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>PRICE ($)</div>
                <input className="inp" type="number" placeholder="59.99" value={newW.price}
                  onChange={e=>setNewW(p=>({...p,price:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>ICON</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {EMOJIS.map(em=>(
                    <button key={em} onClick={()=>setNewW(p=>({...p,img:em}))} style={{
                      fontSize:15, background:newW.img===em?"rgba(255,204,0,0.12)":"rgba(0,245,255,0.03)",
                      border:`1px solid ${newW.img===em?"#ffcc00":"var(--border)"}`, padding:"3px 6px", cursor:"pointer",
                    }}>{em}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>PLATFORM</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["steam","epic"].map(pl=>(
                    <button key={pl} className={`btn sm ${pl==="epic"?"g":""}`}
                      style={{ flex:1, opacity:newW.platform===pl?1:0.35 }}
                      onClick={()=>setNewW(p=>({...p,platform:pl}))}>
                      {pl==="steam"?"⊞ STEAM":"◈ EPIC"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn full" style={{ borderColor:"#ffcc00", color:"#ffcc00" }} onClick={addNew}>⟶ ADD</button>
              <button className="btn o" onClick={()=>setAddModal(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
