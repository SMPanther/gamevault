import { useState } from "react";
import { fmt } from "../utils/helpers";
import { lsGet, lsSet } from "../utils/storage";

// ─────────────────────────────────────────────────────────────────────────────
// Price Tracker — track Steam game prices over time
// Uses Steam Store API to get current price, stores history in localStorage
// ─────────────────────────────────────────────────────────────────────────────

const PROXY = "https://corsproxy.io/?";

async function fetchSteamPrice(appId) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview&cc=us`;
  const res  = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Failed");
  const data = await res.json();
  const info = data?.[String(appId)]?.data?.price_overview;
  if (!info) return null;
  return {
    current:   info.final / 100,
    original:  info.initial / 100,
    discount:  info.discount_percent,
    formatted: info.final_formatted,
  };
}

async function searchSteamGame(query) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=en&cc=US`;
  const res  = await fetch(PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.items || []).slice(0, 5).map(g => ({
    appid: g.id,
    name:  g.name,
    img:   `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.id}/header.jpg`,
  }));
}

function sparkPoints(history) {
  if (history.length < 2) return null;
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 120, H = 36;
  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((h.price - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  return { pts, min, max, current: prices[prices.length - 1] };
}

export default function PriceTracker({ sg = [] }) {
  const [tracked,    setTracked]    = useState(() => lsGet("price_tracked", []));
  const [search,     setSearch]     = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [expanded,   setExpanded]   = useState(null);

  const saveTracked = (list) => { setTracked(list); lsSet("price_tracked", list); };

  // Auto-add linked Steam games with appids
  const libraryGames = sg.filter(g => g.appid).slice(0, 3);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true); setResults([]);
    try { setResults(await searchSteamGame(search)); }
    catch { setResults([]); }
    setSearching(false);
  };

  const addGame = async (game) => {
    if (tracked.find(t => t.appid === game.appid)) return;
    setRefreshing(game.appid);
    try {
      const price = await fetchSteamPrice(game.appid);
      const entry = {
        appid:   game.appid,
        name:    game.name,
        img:     game.img,
        history: price ? [{ price: price.current, date: new Date().toLocaleDateString(), discount: price.discount }] : [],
        current: price,
        addedAt: Date.now(),
      };
      saveTracked([...tracked, entry]);
    } catch {}
    setRefreshing(null);
    setResults([]);
    setSearch("");
  };

  const removeGame = (appid) => saveTracked(tracked.filter(t => t.appid !== appid));

  const refreshPrice = async (appid) => {
    setRefreshing(appid);
    try {
      const price = await fetchSteamPrice(appid);
      if (!price) return;
      saveTracked(tracked.map(t => {
        if (t.appid !== appid) return t;
        const lastPrice = t.history[t.history.length - 1]?.price;
        const newHistory = lastPrice !== price.current
          ? [...t.history, { price: price.current, date: new Date().toLocaleDateString(), discount: price.discount }]
          : t.history;
        return { ...t, current: price, history: newHistory.slice(-30) };
      }));
    } catch {}
    setRefreshing(null);
  };

  return (
    <div className="fadeup" style={{ padding:"24px 20px", maxWidth:900, margin:"0 auto" }}>
      <div style={{ marginBottom:18 }}>
        <div className="orb" style={{ fontSize:18, fontWeight:700, color:"var(--cyan)" }}>💰 PRICE TRACKER</div>
        <div className="mono" style={{ color:"var(--muted)", fontSize:9, letterSpacing:2 }}>MONITOR STEAM GAME PRICES · GET ALERTS ON DROPS</div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding:16, marginBottom:16 }}>
        <div className="mono" style={{ fontSize:9, color:"var(--cyan)", letterSpacing:2, marginBottom:10 }}>+ ADD GAME TO TRACK</div>
        <div style={{ display:"flex", gap:8 }}>
          <input className="inp" placeholder="Search Steam game name..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
            style={{ flex:1, fontSize:13 }} />
          <button className="btn sm" onClick={doSearch} disabled={searching} style={{ flexShrink:0 }}>
            {searching ? <span className="spinner" style={{ width:12, height:12 }}/> : "SEARCH"}
          </button>
        </div>
        {results.length > 0 && (
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
            {results.map(g => (
              <div key={g.appid} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px",
                background:"rgba(0,245,255,0.03)", border:"1px solid var(--border)", cursor:"pointer" }}
                onClick={() => addGame(g)}>
                <img src={g.img} alt={g.name} style={{ width:48, height:28, objectFit:"cover", borderRadius:1 }}
                  onError={e=>e.target.style.display="none"} />
                <span style={{ fontSize:13, flex:1 }}>{g.name}</span>
                {refreshing === g.appid
                  ? <span className="spinner" style={{ width:10, height:10 }}/>
                  : <span className="mono" style={{ fontSize:9, color:"var(--cyan)" }}>+ TRACK</span>}
              </div>
            ))}
          </div>
        )}

        {/* Quick-add from library */}
        {libraryGames.length > 0 && (
          <div style={{ marginTop:10 }}>
            <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:1, marginBottom:6 }}>FROM YOUR LIBRARY:</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {libraryGames.filter(g => !tracked.find(t => t.appid === g.appid)).map(g => (
                <button key={g.appid} onClick={() => addGame({ appid:g.appid, name:g.name, img:g.imgUrl })}
                  style={{ background:"rgba(0,245,255,0.06)", border:"1px solid rgba(0,245,255,0.2)",
                    color:"var(--cyan)", fontFamily:"Share Tech Mono", fontSize:9, padding:"3px 9px", cursor:"pointer" }}>
                  + {g.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tracked games */}
      {tracked.length === 0 ? (
        <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--muted)", border:"1px solid var(--border)" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>💰</div>
          <div className="mono" style={{ fontSize:10, letterSpacing:2 }}>NO GAMES TRACKED YET</div>
          <div style={{ fontSize:12, marginTop:6 }}>Search for a game above to start tracking its price</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {tracked.map(t => {
            const spark = sparkPoints(t.history);
            const lowestEver = t.history.length ? Math.min(...t.history.map(h => h.price)) : null;
            const isAllTimeLow = t.current && lowestEver !== null && t.current.current <= lowestEver;
            const priceChange = t.history.length >= 2
              ? t.history[t.history.length-1].price - t.history[0].price
              : 0;

            return (
              <div key={t.appid} className="card" style={{
                padding:16,
                borderColor: t.current?.discount > 0 ? "rgba(57,255,20,0.3)" : "var(--border)" }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  {t.img && (
                    <img src={t.img} alt={t.name}
                      style={{ width:80, height:46, objectFit:"cover", borderRadius:1, flexShrink:0 }}
                      onError={e=>e.target.style.display="none"} />
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{t.name}</div>
                        <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                          {t.current ? (
                            <>
                              <span className="orb" style={{ fontSize:18, color:"var(--cyan)" }}>{fmt(t.current.current)}</span>
                              {t.current.discount > 0 && (
                                <>
                                  <span style={{ textDecoration:"line-through", color:"var(--muted)", fontSize:12 }}>{fmt(t.current.original)}</span>
                                  <span style={{ background:"rgba(57,255,20,0.15)", border:"1px solid rgba(57,255,20,0.4)",
                                    color:"var(--green)", fontFamily:"Share Tech Mono", fontSize:10, padding:"1px 6px" }}>
                                    -{t.current.discount}%
                                  </span>
                                </>
                              )}
                              {isAllTimeLow && (
                                <span style={{ background:"rgba(255,204,0,0.12)", border:"1px solid rgba(255,204,0,0.4)",
                                  color:"#ffcc00", fontFamily:"Share Tech Mono", fontSize:9, padding:"1px 6px" }}>
                                  🏆 ALL-TIME LOW
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="mono" style={{ color:"var(--muted)", fontSize:11 }}>Price unavailable</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        {spark && (
                          <svg width="120" height="36" viewBox="0 0 120 36">
                            <polyline points={spark.pts} fill="none" stroke="var(--cyan)" strokeWidth="1.5" opacity="0.7"/>
                          </svg>
                        )}
                        <button className="btn sm" onClick={() => refreshPrice(t.appid)} disabled={refreshing===t.appid}
                          style={{ fontSize:8, padding:"4px 8px" }}>
                          {refreshing===t.appid ? <span className="spinner" style={{ width:10, height:10 }}/> : "↻ REFRESH"}
                        </button>
                        <button className="btn o sm" onClick={() => removeGame(t.appid)}
                          style={{ fontSize:8, padding:"4px 8px" }}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price history */}
                {t.history.length > 1 && (
                  <div style={{ marginTop:10, borderTop:"1px solid var(--border)", paddingTop:10 }}>
                    <button onClick={() => setExpanded(expanded===t.appid ? null : t.appid)}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)",
                        fontFamily:"Share Tech Mono", fontSize:9, letterSpacing:1 }}>
                      {expanded===t.appid ? "▲ HIDE" : "▼ SHOW"} PRICE HISTORY ({t.history.length} points)
                    </button>
                    {expanded===t.appid && (
                      <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
                        {[...t.history].reverse().map((h, i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between",
                            padding:"4px 8px", background:i===0?"rgba(0,245,255,0.05)":"rgba(255,255,255,0.02)",
                            border:"1px solid rgba(255,255,255,0.04)", fontSize:12 }}>
                            <span className="mono" style={{ color:"var(--muted)", fontSize:10 }}>{h.date}</span>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              {h.discount > 0 && (
                                <span style={{ color:"var(--green)", fontFamily:"Share Tech Mono", fontSize:9 }}>-{h.discount}%</span>
                              )}
                              <span style={{ fontWeight:600, color: i===0?"var(--cyan)":"var(--txt)" }}>{fmt(h.price)}</span>
                            </div>
                          </div>
                        ))}
                        <div style={{ display:"flex", gap:16, marginTop:6 }}>
                          {[["Lowest ever", fmt(lowestEver)],["Change", (priceChange>=0?"+":"")+fmt(Math.abs(priceChange))],["Points tracked", t.history.length]].map(([l,v])=>(
                            <div key={l}>
                              <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:1 }}>{l.toUpperCase()}</div>
                              <div style={{ fontSize:13, color:"var(--cyan)", fontWeight:600 }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
