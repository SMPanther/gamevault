import { useState, useEffect } from "react";
import { fmt } from "../utils/helpers";
import { sbGetTrades, sbUpsertTrade, sbDeleteTrade, sbUpdateTradeProposals, subscribeTrades } from "../utils/supabase";

function useTradeStore() {
  const [ts, setTs] = useState([]);
  useEffect(() => {
    sbGetTrades().then(data => setTs(data || []));
    const channel = subscribeTrades(() => {
      sbGetTrades().then(data => setTs(data || []));
    });
    return () => channel.unsubscribe();
  }, []);
  return [ts, setTs];
}

// ─────────────────────────────────────────────────────────────────────────────
// TradeCenter — offer individual games / items in trade for others
// ─────────────────────────────────────────────────────────────────────────────
export default function TradeCenter({ sg, eg, user, setNotify }) {
  const [trades, setTrades] = useTradeStore();
  const ts = trades;
  const [section, setSection] = useState("browse"); // browse | post | mine
  const [form, setForm] = useState({ offerGame:"", offerNote:"", wantGame:"", wantNote:"", platform:"steam" });
  const [filterPlat,   setFilterPlat]   = useState("all");
  const [searchQuery,  setSearchQuery]  = useState("");
  const [tradeModal, setTradeModal] = useState(null);   // trade to propose swap for
  const [swapForm, setSwapForm] = useState({ game:"", note:"" });
  const [confirmDel, setConfirmDel] = useState(null);

  const allGames = [...sg, ...eg];
  const myTrades = trades.filter(t => t.owner_id === user?.id);
  const browsable = trades
    .filter(t => t.owner_id !== user?.id && t.status === "open")
    .filter(t => filterPlat === "all" || t.platform === filterPlat)
    .filter(t => !searchQuery.trim() ||
      t.offer_game||t.offerGame.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.want_game||t.wantGame.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.seller.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const postTrade = async () => {
    if (!form.offerGame.trim()) { setNotify({ msg:"Enter what you're offering", type:"error" }); return; }
    if (!form.wantGame.trim())  { setNotify({ msg:"Enter what you want in return", type:"error" }); return; }
    const id = `tr${Date.now()}`;
    const newTrade = {
      id, owner_id: user?.id, seller: user?.name || "?",
      offer_game: form.offerGame, offer_note: form.offerNote,
      want_game:  form.wantGame,  want_note:  form.wantNote,
      platform:   form.platform,
      status: "open", proposals: [],
    };
    await sbUpsertTrade(newTrade);
    sbGetTrades().then(data => setTrades(data || []));
    setForm({ offerGame:"", offerNote:"", wantGame:"", wantNote:"", platform:"steam" });
    setNotify({ msg:"Trade posted!", type:"success" });
    setSection("browse");
  };

  const proposeSwap = async () => {
    if (!swapForm.game.trim()) { setNotify({ msg:"Enter what you're offering", type:"error" }); return; }
    const trade = ts.find(t => t.id === tradeModal.id);
    if (!trade) return;
    const alreadyProposed = (trade.proposals||[]).some(pr => pr.byId === user?.id);
    if (alreadyProposed) { setNotify({ msg:"You already proposed on this trade", type:"error" }); return; }
    const updatedProposals = [...(trade.proposals||[]), {
      by: user?.name, byId: user?.id, byEmail: user?.email||"—",
      game: swapForm.game, note: swapForm.note,
      time: new Date().toLocaleTimeString(),
    }];
    await sbUpdateTradeProposals(tradeModal.id, updatedProposals);
    sbGetTrades().then(data => setTrades(data || []));
    setTradeModal(null);
    setSwapForm({ game:"", note:"" });
    setNotify({ msg:"Trade proposal sent!", type:"success" });
  };

  const markComplete = async (id) => {
    await sbUpdateTradeProposals(id, [], "completed");
    sbGetTrades().then(data => setTrades(data || []));
    setNotify({ msg:"Trade marked as completed!", type:"success" });
  };

  return (
    <div className="fadeup" style={{ padding:"28px 20px", maxWidth:1000, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:18 }}>
        <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--purple)" }}>⟳ TRADE CENTER</div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:10, letterSpacing:2 }}>
          SWAP GAMES · NO MONEY NEEDED
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", marginBottom:20 }}>
        {[["browse","🔍 BROWSE TRADES"],["post","+ POST TRADE"],["mine","📋 MY TRADES"]].map(([s,lbl])=>(
          <button key={s} className={`ntab${section===s?" act":""}`}
            style={{ fontSize:10, padding:"0 22px", height:44 }} onClick={()=>setSection(s)}>
            {lbl}
            {s==="mine"&&myTrades.length>0&&(
              <span style={{ marginLeft:6, background:"var(--purple)", color:"#fff",
                borderRadius:"50%", width:16, height:16, display:"inline-flex",
                alignItems:"center", justifyContent:"center", fontSize:9 }}>{myTrades.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ BROWSE ══ */}
      {section==="browse" && (
        <>
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            {["all","steam","epic"].map(f=>(
              <button key={f} className="btn sm"
                style={{ borderColor:filterPlat===f?"var(--purple)":"var(--border)",
                  color:filterPlat===f?"var(--purple)":"var(--muted)" }}
                onClick={()=>setFilterPlat(f)}>
                {f==="all"?"ALL":f==="steam"?"⊞ STEAM":"◈ EPIC"}
              </button>
            ))}
          </div>
          <div style={{ position:"relative", marginBottom:16 }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"var(--muted)", fontSize:13, pointerEvents:"none" }}>🔍</span>
            <input className="inp" placeholder="Search by game name or trader…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft:34, fontSize:13 }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{
                position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:14,
              }}>✕</button>
            )}
          </div>
          {searchQuery && (
            <div className="mono" style={{ fontSize:9, color:"var(--purple)", marginBottom:10, letterSpacing:1 }}>
              {browsable.length} result{browsable.length!==1?"s":""} for "{searchQuery}"
            </div>
          )}

          {browsable.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--muted)", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>⟳</div>
              <div className="orb" style={{ fontSize:14, color:"var(--purple)", marginBottom:8 }}>NO TRADES YET</div>
              <div style={{ fontSize:13 }}>Be the first — post a trade offer above.</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {browsable.map(t => (
                <div key={t.id} className="card card-h" style={{ padding:16, borderColor:"rgba(191,0,255,0.2)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2 }}>TRADER</div>
                      <div style={{ fontWeight:700, fontSize:14 }}>{t.seller}</div>
                    </div>
                    <span className={`tag ${t.platform==="steam"?"s":"e"}`}>{t.platform.toUpperCase()}</span>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:6, alignItems:"center", marginBottom:12 }}>
                    <div style={{ background:"rgba(191,0,255,0.07)", border:"1px solid rgba(191,0,255,0.2)", padding:10, textAlign:"center" }}>
                      <div className="mono" style={{ fontSize:8, color:"var(--purple)", letterSpacing:1, marginBottom:4 }}>OFFERING</div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{t.offer_game||t.offerGame}</div>
                      {t.offer_note||t.offerNote&&<div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>{t.offer_note||t.offerNote}</div>}
                    </div>
                    <div className="orb" style={{ fontSize:20, color:"var(--cyan)", textAlign:"center" }}>⟷</div>
                    <div style={{ background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.2)", padding:10, textAlign:"center" }}>
                      <div className="mono" style={{ fontSize:8, color:"var(--cyan)", letterSpacing:1, marginBottom:4 }}>WANTS</div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{t.want_game||t.wantGame}</div>
                      {t.want_note||t.wantNote&&<div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>{t.want_note||t.wantNote}</div>}
                    </div>
                  </div>

                  {t.proposals.length > 0 && (
                    <div className="mono" style={{ fontSize:9, color:"var(--purple)", marginBottom:8 }}>
                      💬 {t.proposals.length} proposal{t.proposals.length>1?"s":""}
                    </div>
                  )}

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>{t.postedAt}</span>
                    <button className="btn p sm" onClick={()=>{ setTradeModal(t); setSwapForm({game:"",note:""}); }}>
                      PROPOSE SWAP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══ POST ══ */}
      {section==="post" && (
        <div style={{ maxWidth:580 }}>
          <div className="card" style={{ padding:20 }}>
            <div className="mono" style={{ fontSize:9, color:"var(--purple)", letterSpacing:2, marginBottom:16 }}>
              ◈ CREATE TRADE OFFER
            </div>

            <div style={{ display:"grid", gap:12 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  WHAT YOU'RE OFFERING *
                </div>
                <input className="inp" placeholder="e.g. Cyberpunk 2077 (Steam key)" value={form.offerGame}
                  onChange={e=>setForm(p=>({...p,offerGame:e.target.value}))} />
                {allGames.length > 0 && (
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:6 }}>
                    <span className="mono" style={{ fontSize:8, color:"var(--muted)" }}>FROM LIBRARY: </span>
                    {allGames.slice(0,6).map(g=>(
                      <button key={g.id} onClick={()=>setForm(p=>({...p,offerGame:g.name,platform:g.platform||"steam"}))}
                        style={{ background:"rgba(191,0,255,0.08)", border:"1px solid rgba(191,0,255,0.2)",
                          color:"var(--purple)", fontFamily:"Share Tech Mono", fontSize:8, padding:"1px 6px", cursor:"pointer" }}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  OFFER NOTE (optional — edition, condition, etc.)
                </div>
                <input className="inp" placeholder="e.g. Unopened, includes DLC" value={form.offerNote}
                  onChange={e=>setForm(p=>({...p,offerNote:e.target.value}))} />
              </div>

              <div style={{ height:1, background:"var(--border)" }} />

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  WHAT YOU WANT IN RETURN *
                </div>
                <input className="inp" placeholder="e.g. Elden Ring or similar" value={form.wantGame}
                  onChange={e=>setForm(p=>({...p,wantGame:e.target.value}))} />
              </div>

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  WANT NOTE (optional)
                </div>
                <input className="inp" placeholder="e.g. Any edition, PC only" value={form.wantNote}
                  onChange={e=>setForm(p=>({...p,wantNote:e.target.value}))} />
              </div>

              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>PLATFORM</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["steam","epic"].map(pl=>(
                    <button key={pl} className={`btn sm ${pl==="epic"?"g":""}`}
                      style={{ flex:1, opacity:form.platform===pl?1:0.35 }}
                      onClick={()=>setForm(p=>({...p,platform:pl}))}>
                      {pl==="steam"?"⊞ STEAM":"◈ EPIC"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn p" style={{ width:"100%", marginTop:16 }} onClick={postTrade}>
              ⟶ POST TRADE OFFER
            </button>
          </div>
        </div>
      )}

      {/* ══ MY TRADES ══ */}
      {section==="mine" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {myTrades.length === 0 ? (
            <div style={{ textAlign:"center", padding:50, color:"var(--muted)", border:"1px solid var(--border)" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
              <div className="mono">NO TRADE OFFERS POSTED YET</div>
            </div>
          ) : myTrades.map(t => (
            <div key={t.id} className="card" style={{ padding:16,
              borderColor: t.status==="completed"?"rgba(57,255,20,0.3)":t.status==="cancelled"?"rgba(255,102,0,0.2)":"rgba(191,0,255,0.2)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className="orb" style={{ fontSize:13, color:"var(--purple)" }}>
                    {t.offer_game||t.offerGame} ⟷ {t.want_game||t.wantGame}
                  </span>
                  <span className="mono" style={{ fontSize:9, padding:"2px 7px",
                    color: t.status==="completed"?"var(--green)":t.status==="cancelled"?"var(--orange)":"var(--cyan)",
                    border:`1px solid ${t.status==="completed"?"var(--green)":t.status==="cancelled"?"var(--orange)":"var(--cyan)"}` }}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {t.status==="open" && (
                    <button className="btn g sm" onClick={()=>markComplete(t.id)}>✓ MARK DONE</button>
                  )}
                  <button className="btn o sm" onClick={()=>setConfirmDel(t.id)}>DELETE</button>
                </div>
              </div>

              {/* Proposals */}
              {t.proposals.length > 0 ? (
                <div>
                  <div className="mono" style={{ fontSize:9, color:"var(--purple)", letterSpacing:2, marginBottom:8 }}>
                    PROPOSALS RECEIVED ({t.proposals.length})
                  </div>
                  {t.proposals.map((pr,i)=>(
                    <div key={i} style={{ padding:"8px 12px", background:"rgba(191,0,255,0.06)",
                      border:"1px solid rgba(191,0,255,0.18)", marginBottom:6, fontSize:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ color:"var(--purple)", fontWeight:700 }}>{pr.by}</span>
                        <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>{pr.time}</span>
                      </div>
                      <div>Offering: <span style={{ color:"var(--cyan)" }}>{pr.game}</span></div>
                      {pr.note&&<div style={{ color:"var(--muted)", fontStyle:"italic" }}>{pr.note}</div>}
                      <div style={{ marginTop:4, color:"var(--muted)", fontSize:11 }}>✉ {pr.byEmail}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mono" style={{ fontSize:10, color:"var(--muted)" }}>No proposals yet.</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Propose swap modal ─────────────────────────────── */}
      {tradeModal && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setTradeModal(null)}>
          <div className="modal">
            <div className="orb" style={{ color:"var(--purple)", fontSize:12, letterSpacing:3, marginBottom:18 }}>
              ⟷ PROPOSE SWAP
            </div>
            <div style={{ background:"rgba(191,0,255,0.06)", border:"1px solid rgba(191,0,255,0.2)", padding:12, marginBottom:14 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginBottom:4 }}>THEY'RE OFFERING</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{tradeModal.offerGame}</div>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", marginBottom:4 }}>THEY WANT</div>
              <div style={{ fontSize:13, color:"var(--cyan)" }}>{tradeModal.wantGame}</div>
            </div>
            <div style={{ display:"grid", gap:12, marginBottom:16 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>
                  WHAT YOU'RE OFFERING *
                </div>
                <input className="inp" placeholder="Game name / key description" value={swapForm.game}
                  onChange={e=>setSwapForm(p=>({...p,game:e.target.value}))} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:5 }}>NOTE</div>
                <input className="inp" placeholder="Any details about your offer" value={swapForm.note}
                  onChange={e=>setSwapForm(p=>({...p,note:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn p" style={{ flex:1 }} onClick={proposeSwap}>⟶ SEND PROPOSAL</button>
              <button className="btn o" onClick={()=>setTradeModal(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ─────────────────────────── */}
      {confirmDel && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth:340, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑️</div>
            <div className="orb" style={{ color:"var(--orange)", fontSize:12, marginBottom:10 }}>DELETE TRADE?</div>
            <div style={{ color:"var(--muted)", fontSize:13, marginBottom:20 }}>
              Any proposals received will also be removed.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn o" style={{ flex:1 }} onClick={async ()=>{
                await sbDeleteTrade(confirmDel);
                sbGetTrades().then(data => setTrades(data || []));
                setConfirmDel(null);
                setNotify({ msg:"Trade removed", type:"success" });
              }}>YES, DELETE</button>
              <button className="btn" onClick={()=>setConfirmDel(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
