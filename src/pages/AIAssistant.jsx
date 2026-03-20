import { useState } from "react";
import {
  aiPriceAnalyst, aiGameRecommender, aiMarketAssistant,
  aiTradeAdvisor, aiNewsSummarizer, aiGetGamePrice,
} from "../utils/aiClient";
import { fmt } from "../utils/helpers";

// ─────────────────────────────────────────────────────────────────────────────
// AI Assistant — GameVault's built-in AI powered by Claude + web search
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
  { id:"recommender", icon:"🎮", label:"Game Recommender",   color:"var(--cyan)",   desc:"Get personalized game suggestions based on your library" },
  { id:"price",       icon:"💰", label:"Price Analyst",      color:"var(--green)",  desc:"Should you buy a game right now? Get a data-backed answer" },
  { id:"liveprice",   icon:"🔍", label:"Live Price Finder",  color:"#ffcc00",       desc:"Find the cheapest price for any game across all platforms" },
  { id:"market",      icon:"📈", label:"Market Assistant",   color:"var(--purple)", desc:"Get a suggested listing price for your account" },
  { id:"trade",       icon:"⚖️", label:"Trade Advisor",      color:"var(--orange)", desc:"Is a trade fair? Get an instant assessment" },
  { id:"news",        icon:"📰", label:"News Briefing",      color:"#1a9fff",       desc:"Get today's top gaming news summarized in seconds" },
];

function ResultBox({ result, loading, error }) {
  if (loading) return (
    <div style={{ padding:20, textAlign:"center" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
        <span className="spinner" style={{ width:16, height:16 }}/>
        <span className="mono" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:2 }}>AI THINKING...</span>
      </div>
      <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>Searching the web for live data...</div>
    </div>
  );
  if (error) return (
    <div style={{ padding:14, background:"rgba(255,102,0,0.08)", border:"1px solid rgba(255,102,0,0.3)" }}>
      <div className="mono" style={{ color:"var(--orange)", fontSize:11 }}>⚠ {error}</div>
      {error.includes("API key") && (
        <div style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
          Add <code style={{ background:"rgba(0,245,255,0.1)", padding:"1px 5px", fontSize:11 }}>REACT_APP_ANTHROPIC_KEY</code> to your .env.local and Vercel environment variables.
        </div>
      )}
    </div>
  );
  if (!result) return null;
  return (
    <div style={{ padding:16, background:"rgba(0,245,255,0.03)", border:"1px solid rgba(0,245,255,0.2)", marginTop:12 }}>
      <div className="mono" style={{ fontSize:8, color:"var(--cyan)", letterSpacing:2, marginBottom:10 }}>◈ AI RESPONSE</div>
      <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap", color:"var(--txt)" }}>{result}</div>
    </div>
  );
}

export default function AIAssistant({ sg = [], eg = [], sLinked, eLinked, sProf, eProf, setNotify }) {
  const [activeFeature, setActiveFeature] = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  // Feature-specific inputs
  const [gameInput,    setGameInput]    = useState("");
  const [offeringInput,setOfferingInput]= useState("");
  const [wantingInput, setWantingInput] = useState("");
  const [newsTopicInput,setNewsTopicInput] = useState("gaming news today");
  const [livePriceGame, setLivePriceGame] = useState("");
  const [liveResult, setLiveResult]     = useState(null);

  const allGames = [...sg, ...eg];

  const run = async (featureId) => {
    setResult(null); setError(null); setLiveResult(null);
    setLoading(true);
    try {
      switch (featureId) {
        case "recommender": {
          const platforms = [sLinked&&"Steam", eLinked&&"Epic"].filter(Boolean).join(", ") || "Steam/Epic";
          const r = await aiGameRecommender({ games: allGames, genres: [], platforms });
          setResult(r); break;
        }
        case "price": {
          if (!gameInput.trim()) { setError("Enter a game name first"); setLoading(false); return; }
          const r = await aiPriceAnalyst({ gameName: gameInput, currentPrice:"?", originalPrice:"?", discount:0, priceHistory:[] });
          setResult(r); break;
        }
        case "liveprice": {
          if (!livePriceGame.trim()) { setError("Enter a game name first"); setLoading(false); return; }
          const r = await aiGetGamePrice(livePriceGame);
          setLiveResult(r);
          if (!r) setError("Could not fetch prices — try again");
          break;
        }
        case "market": {
          const r = await aiMarketAssistant({
            steamGames: sg.length, epicGames: eg.length,
            level: sProf?.level || 0, badges: sProf?.badges || 0,
            totalHours: [...sg,...eg].reduce((s,g)=>s+g.playtime,0),
            steamValue: sLinked ? sg.reduce((s,g)=>s+(g.price||0),0) : 0,
            epicValue:  eLinked ? eg.reduce((s,g)=>s+(g.price||0),0) : 0,
          });
          setResult(r); break;
        }
        case "trade": {
          if (!offeringInput.trim() || !wantingInput.trim()) { setError("Fill both fields"); setLoading(false); return; }
          const r = await aiTradeAdvisor({ offering: offeringInput, wanting: wantingInput });
          setResult(r); break;
        }
        case "news": {
          const r = await aiNewsSummarizer(newsTopicInput || "gaming news today");
          setResult(r); break;
        }
        default: break;
      }
    } catch (e) {
      setError(e.message || "AI request failed");
    }
    setLoading(false);
  };

  const selectFeature = (id) => {
    setActiveFeature(id);
    setResult(null); setError(null); setLiveResult(null);
  };

  return (
    <div className="fadeup" style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div className="orb" style={{ fontSize:20, fontWeight:700, color:"var(--cyan)" }}>
          🤖 AI ASSISTANT
        </div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:9, letterSpacing:2, marginTop:2 }}>
          POWERED BY CLAUDE · LIVE WEB DATA · 6 FEATURES
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:10, marginBottom:20 }}>
        {FEATURES.map(f => (
          <div key={f.id}
            onClick={() => selectFeature(f.id)}
            className="card card-h"
            style={{
              padding:16, cursor:"pointer",
              borderColor: activeFeature===f.id ? f.color : "var(--border)",
              background: activeFeature===f.id ? `${f.color}0d` : "var(--card)",
              transition:"all 0.2s",
            }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <span style={{ fontSize:22 }}>{f.icon}</span>
              <div className="orb" style={{ fontSize:11, color: f.color, letterSpacing:1 }}>{f.label}</div>
            </div>
            <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Active feature panel */}
      {activeFeature && (
        <div className="card" style={{ padding:20, borderColor: FEATURES.find(f=>f.id===activeFeature)?.color }}>
          <div className="mono" style={{ fontSize:9, letterSpacing:2, marginBottom:14,
            color: FEATURES.find(f=>f.id===activeFeature)?.color }}>
            {FEATURES.find(f=>f.id===activeFeature)?.icon} {FEATURES.find(f=>f.id===activeFeature)?.label.toUpperCase()}
          </div>

          {/* Recommender */}
          {activeFeature==="recommender" && (
            <div>
              <div style={{ fontSize:13, color:"var(--muted)", marginBottom:12 }}>
                Based on your {allGames.length} games across {[sLinked&&"Steam",eLinked&&"Epic"].filter(Boolean).join(" & ")||"your library"}.
              </div>
              <button className="btn g" onClick={()=>run("recommender")} disabled={loading}>
                {loading ? "⟳ THINKING..." : "🎮 GET RECOMMENDATIONS"}
              </button>
            </div>
          )}

          {/* Price Analyst */}
          {activeFeature==="price" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1 }}>GAME NAME</div>
              <input className="inp" placeholder="e.g. Cyberpunk 2077" value={gameInput}
                onChange={e=>setGameInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&run("price")} />
              {/* Quick pick from library */}
              {allGames.length > 0 && (
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <span className="mono" style={{ fontSize:8, color:"var(--muted)", alignSelf:"center" }}>FROM LIBRARY:</span>
                  {allGames.slice(0,5).map(g=>(
                    <button key={g.id} onClick={()=>setGameInput(g.name)} style={{
                      background:"rgba(57,255,20,0.07)", border:"1px solid rgba(57,255,20,0.2)",
                      color:"var(--green)", fontFamily:"Share Tech Mono", fontSize:8, padding:"2px 7px", cursor:"pointer" }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
              <button className="btn g" onClick={()=>run("price")} disabled={loading||!gameInput.trim()}>
                {loading ? "⟳ ANALYZING..." : "💰 ANALYZE PRICE"}
              </button>
            </div>
          )}

          {/* Live Price Finder */}
          {activeFeature==="liveprice" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1 }}>GAME NAME</div>
              <input className="inp" placeholder="e.g. Elden Ring" value={livePriceGame}
                onChange={e=>setLivePriceGame(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&run("liveprice")} />
              <button className="btn" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                onClick={()=>run("liveprice")} disabled={loading||!livePriceGame.trim()}>
                {loading ? "⟳ SEARCHING..." : "🔍 FIND BEST PRICE"}
              </button>
              {/* Live price result */}
              {liveResult && (
                <div style={{ marginTop:8, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Steam","steam","#1a9fff"],["Epic","epic","var(--green)"],["GOG","gog","#b026ff"]].map(([label,key,col])=>(
                    <div key={key} style={{ padding:"10px 12px", background:`${col}11`,
                      border:`1px solid ${col}33`, textAlign:"center" }}>
                      <div className="mono" style={{ fontSize:8, color:col, letterSpacing:1, marginBottom:4 }}>{label}</div>
                      <div className="orb" style={{ fontSize:16, color: liveResult[key]==="N/A"?"var(--muted)":col }}>
                        {liveResult[key] || "N/A"}
                      </div>
                    </div>
                  ))}
                  {liveResult.cheapest && (
                    <div style={{ gridColumn:"span 2", padding:"10px 12px",
                      background:"rgba(255,204,0,0.08)", border:"1px solid rgba(255,204,0,0.3)", textAlign:"center" }}>
                      <div className="mono" style={{ fontSize:8, color:"#ffcc00", letterSpacing:1, marginBottom:4 }}>🏆 CHEAPEST</div>
                      <div style={{ fontWeight:700, fontSize:15 }}>
                        {liveResult.cheapest.price} on <span style={{ color:"#ffcc00" }}>{liveResult.cheapest.site}</span>
                      </div>
                      {liveResult.onSale && (
                        <div className="mono" style={{ fontSize:9, color:"var(--green)", marginTop:4 }}>
                          ✓ ON SALE{liveResult.saleEnds ? ` — ends ${liveResult.saleEnds}` : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Market Assistant */}
          {activeFeature==="market" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:12 }}>
                {[
                  ["Steam games", sg.length],
                  ["Epic games",  eg.length],
                  ["Steam level", sProf?.level||0],
                  ["Badges",      sProf?.badges||0],
                  ["Total hours", [...sg,...eg].reduce((s,g)=>s+g.playtime,0)+"h"],
                ].map(([l,v])=>(
                  <div key={l} style={{ textAlign:"center", padding:"8px 10px",
                    background:"rgba(191,0,255,0.06)", border:"1px solid rgba(191,0,255,0.18)" }}>
                    <div className="mono" style={{ fontSize:7, color:"var(--muted)", letterSpacing:1 }}>{l.toUpperCase()}</div>
                    <div className="orb" style={{ fontSize:16, color:"var(--purple)", marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
              <button className="btn p" onClick={()=>run("market")} disabled={loading}>
                {loading ? "⟳ ANALYZING..." : "📈 GET SUGGESTED PRICE"}
              </button>
            </div>
          )}

          {/* Trade Advisor */}
          {activeFeature==="trade" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1, marginBottom:5 }}>YOU'RE OFFERING</div>
                <input className="inp" placeholder="e.g. Cyberpunk 2077" value={offeringInput}
                  onChange={e=>setOfferingInput(e.target.value)} />
              </div>
              <div>
                <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1, marginBottom:5 }}>YOU WANT</div>
                <input className="inp" placeholder="e.g. Elden Ring" value={wantingInput}
                  onChange={e=>setWantingInput(e.target.value)} />
              </div>
              <button className="btn o" onClick={()=>run("trade")} disabled={loading||!offeringInput||!wantingInput}>
                {loading ? "⟳ ASSESSING..." : "⚖️ ASSESS TRADE"}
              </button>
            </div>
          )}

          {/* News Summarizer */}
          {activeFeature==="news" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div className="mono" style={{ fontSize:9, color:"var(--muted)", letterSpacing:1 }}>TOPIC (optional)</div>
              <input className="inp" placeholder="gaming news today" value={newsTopicInput}
                onChange={e=>setNewsTopicInput(e.target.value)} />
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {["gaming news today","Steam sales","new game releases","esports news"].map(t=>(
                  <button key={t} onClick={()=>setNewsTopicInput(t)} style={{
                    background:"rgba(26,159,255,0.08)", border:"1px solid rgba(26,159,255,0.2)",
                    color:"#1a9fff", fontFamily:"Share Tech Mono", fontSize:8, padding:"2px 8px", cursor:"pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
              <button className="btn" style={{ borderColor:"#1a9fff", color:"#1a9fff" }}
                onClick={()=>run("news")} disabled={loading}>
                {loading ? "⟳ READING NEWS..." : "📰 GET BRIEFING"}
              </button>
            </div>
          )}

          <ResultBox result={result} loading={loading} error={error} />
        </div>
      )}

      {/* API key notice if not set */}
      {!process.env.REACT_APP_ANTHROPIC_KEY && (
        <div style={{ marginTop:16, padding:"10px 14px",
          background:"rgba(255,102,0,0.06)", border:"1px solid rgba(255,102,0,0.25)" }}>
          <div className="mono" style={{ fontSize:9, color:"var(--orange)", letterSpacing:1, marginBottom:4 }}>
            ⚠ ANTHROPIC API KEY REQUIRED
          </div>
          <div style={{ fontSize:12, color:"var(--muted)" }}>
            Get a free API key at <span style={{ color:"var(--cyan)" }}>console.anthropic.com</span> and add
            <code style={{ background:"rgba(0,245,255,0.1)", padding:"1px 5px", margin:"0 3px", fontSize:11 }}>REACT_APP_ANTHROPIC_KEY</code>
            to your .env.local and Vercel environment variables.
          </div>
        </div>
      )}
    </div>
  );
}
