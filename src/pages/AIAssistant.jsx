import { useState, useRef, useEffect } from "react";
import {
  aiPriceAnalyst, aiGameRecommender, aiMarketAssistant,
  aiTradeAdvisor, aiNewsSummarizer, aiGetGamePrice, aiChat,
} from "../utils/aiClient";

// ─────────────────────────────────────────────────────────────────────────────
// GameVault AI Assistant — GV-AI
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { id:"recommender", icon:"🎮", label:"Recommend me games",    color:"var(--cyan)" },
  { id:"price",       icon:"💰", label:"Analyze a game price",  color:"var(--green)" },
  { id:"liveprice",   icon:"🔍", label:"Find cheapest price",   color:"#ffcc00" },
  { id:"market",      icon:"📈", label:"Price my account",      color:"var(--purple)" },
  { id:"trade",       icon:"⚖️", label:"Assess a trade",        color:"var(--orange)" },
  { id:"news",        icon:"📰", label:"Gaming news briefing",  color:"#1a9fff" },
];

function TypingDots() {
  return (
    <div style={{ display:"flex", gap:4, alignItems:"center", padding:"8px 4px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:6, height:6, borderRadius:"50%", background:"var(--cyan)",
          animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`,
        }}/>
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isAI = msg.role === "assistant";
  return (
    <div style={{
      display:"flex", gap:10, alignItems:"flex-start",
      flexDirection: isAI ? "row" : "row-reverse",
      marginBottom:14,
      animation:"fadeUp 0.3s ease",
    }}>
      {/* Avatar */}
      <div style={{
        width:32, height:32, borderRadius:"50%", flexShrink:0,
        background: isAI
          ? "linear-gradient(135deg,rgba(0,245,255,0.3),rgba(191,0,255,0.3))"
          : "linear-gradient(135deg,rgba(57,255,20,0.2),rgba(0,245,255,0.1))",
        border:`1px solid ${isAI?"var(--cyan)":"var(--green)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14, fontFamily:"Orbitron", fontWeight:700,
        color: isAI ? "var(--cyan)" : "var(--green)",
        flexShrink:0,
      }}>
        {isAI ? "AI" : "U"}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth:"75%",
        background: isAI ? "rgba(0,245,255,0.05)" : "rgba(57,255,20,0.05)",
        border:`1px solid ${isAI?"rgba(0,245,255,0.2)":"rgba(57,255,20,0.2)"}`,
        padding:"10px 14px",
        fontSize:13, lineHeight:1.7,
        color:"var(--txt)",
        whiteSpace:"pre-wrap",
        wordBreak:"break-word",
      }}>
        {msg.content}
        {msg.tag && (
          <div className="mono" style={{ fontSize:8, color:"var(--muted)", marginTop:6, letterSpacing:1 }}>
            {msg.tag}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistant({ sg = [], eg = [], sLinked, eLinked, sProf, eProf, setNotify }) {
  const [messages,     setMessages]     = useState([{
    role:"assistant",
    content:`Hey! I'm GV-AI, your GameVault assistant powered by Llama 3.3 70B. 🎮\n\nI can help you with game recommendations, price analysis, account valuation, trade advice, and gaming news. What can I do for you?`,
    tag:"GV-AI · Llama 3.3 70B",
  }]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  // Action-specific inputs
  const [gameInput,     setGameInput]     = useState("");
  const [offering,      setOffering]      = useState("");
  const [wanting,       setWanting]       = useState("");
  const [livePriceGame, setLivePriceGame] = useState("");
  const [newsTopic,     setNewsTopic]     = useState("gaming news today");
  const [liveResult,    setLiveResult]    = useState(null);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const allGames  = [...sg, ...eg];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  const addMessage = (role, content, tag = "") => {
    setMessages(p => [...p, { role, content, tag }]);
  };

  const runAction = async (actionId) => {
    setLiveResult(null);
    setLoading(true);
    setActiveAction(null);

    try {
      let result = "";
      let tag = "";

      switch (actionId) {
        case "recommender": {
          addMessage("user", "Recommend me 5 games based on my library");
          const platforms = [sLinked&&"Steam", eLinked&&"Epic"].filter(Boolean).join(" & ") || "Steam/Epic";
          result = await aiGameRecommender({ games: allGames, platforms });
          tag = "Game Recommender · live data";
          break;
        }
        case "price": {
          if (!gameInput.trim()) { setLoading(false); return; }
          addMessage("user", `Is "${gameInput}" worth buying right now?`);
          result = await aiPriceAnalyst({ gameName: gameInput, currentPrice:"?", originalPrice:"?", discount:0, priceHistory:[] });
          tag = "Price Analyst · SteamSpy data";
          setGameInput("");
          break;
        }
        case "liveprice": {
          if (!livePriceGame.trim()) { setLoading(false); return; }
          addMessage("user", `Find the cheapest price for "${livePriceGame}"`);
          const r = await aiGetGamePrice(livePriceGame);
          setLiveResult(r);
          if (r) {
            result = `Here are the prices I found for **${livePriceGame}**:\n\n🟦 Steam: ${r.steam}\n🟩 Epic: ${r.epic}\n🟪 GOG: ${r.gog}\n\n🏆 Cheapest: ${r.cheapest?.price} on ${r.cheapest?.site}${r.onSale ? "\n\n✅ Currently on sale!" : ""}${r.tip ? `\n\n💡 ${r.tip}` : ""}`;
          } else {
            result = `I couldn't fetch live prices for "${livePriceGame}". Try checking Steam directly or IsThereAnyDeal.com for the best current price.`;
          }
          tag = "Live Price Finder";
          setLivePriceGame("");
          break;
        }
        case "market": {
          addMessage("user", "What price should I list my gaming account for?");
          result = await aiMarketAssistant({
            steamGames: sg.length, epicGames: eg.length,
            level: sProf?.level||0, badges: sProf?.badges||0,
            totalHours: allGames.reduce((s,g)=>s+g.playtime,0),
            steamValue: sg.reduce((s,g)=>s+(g.price||0),0),
            epicValue:  eg.reduce((s,g)=>s+(g.price||0),0),
          });
          tag = "Market Assistant";
          break;
        }
        case "trade": {
          if (!offering.trim() || !wanting.trim()) { setLoading(false); return; }
          addMessage("user", `Is this trade fair? I offer "${offering}" for "${wanting}"`);
          result = await aiTradeAdvisor({ offering, wanting });
          tag = "Trade Advisor · SteamSpy data";
          setOffering(""); setWanting("");
          break;
        }
        case "news": {
          addMessage("user", `Give me a gaming news briefing: ${newsTopic}`);
          result = await aiNewsSummarizer(newsTopic);
          tag = "News Briefing";
          break;
        }
        default: break;
      }

      if (result) addMessage("assistant", result, tag);
    } catch (e) {
      addMessage("assistant", `⚠ ${e.message || "Something went wrong — try again"}`, "Error");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    addMessage("user", userMsg);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role:"user", content: userMsg });
      const result = await aiChat(history, allGames);
      addMessage("assistant", result, "GV-AI · Llama 3.3 70B");
    } catch (e) {
      addMessage("assistant", `⚠ ${e.message || "Request failed"}`, "Error");
    }
    setLoading(false);
  };

  return (
    <div className="fadeup" style={{ padding:"16px 20px", maxWidth:860, margin:"0 auto",
      display:"flex", flexDirection:"column", height:"calc(100vh - 80px)" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <div className="orb" style={{ fontSize:16, fontWeight:700, color:"var(--cyan)" }}>🤖 GV-AI</div>
          <div className="mono" style={{ color:"var(--muted)", fontSize:8, letterSpacing:2 }}>
            LLAMA 3.3 70B · STEAMSPY DATA · ALWAYS FREE
          </div>
        </div>
        <button className="btn sm" onClick={() => setMessages([{
          role:"assistant",
          content:"Chat cleared! How can I help you?",
          tag:"GV-AI",
        }])} style={{ fontSize:8, opacity:0.6 }}>
          CLEAR CHAT
        </button>
      </div>

      {/* Quick action buttons */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {QUICK_ACTIONS.map(a => (
          <button key={a.id} onClick={() => setActiveAction(activeAction===a.id ? null : a.id)}
            style={{
              background: activeAction===a.id ? `${a.color}18` : "rgba(255,255,255,0.03)",
              border:`1px solid ${activeAction===a.id ? a.color : "rgba(255,255,255,0.1)"}`,
              color: activeAction===a.id ? a.color : "var(--muted)",
              fontFamily:"Share Tech Mono", fontSize:9, padding:"4px 10px",
              cursor:"pointer", transition:"all 0.2s", letterSpacing:0.5,
            }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Action input panel */}
      {activeAction && (
        <div style={{ marginBottom:10, padding:"12px 14px",
          background:"rgba(0,0,0,0.3)", border:"1px solid rgba(0,245,255,0.2)" }}>
          {(activeAction==="price") && (
            <div style={{ display:"flex", gap:8 }}>
              <input className="inp" placeholder="Game name e.g. Cyberpunk 2077" value={gameInput}
                onChange={e=>setGameInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&runAction("price")}
                style={{ flex:1, fontSize:12 }} autoFocus />
              <button className="btn g sm" onClick={()=>runAction("price")} disabled={loading||!gameInput.trim()}>
                ANALYZE
              </button>
            </div>
          )}
          {activeAction==="liveprice" && (
            <div style={{ display:"flex", gap:8 }}>
              <input className="inp" placeholder="Game name e.g. Elden Ring" value={livePriceGame}
                onChange={e=>setLivePriceGame(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&runAction("liveprice")}
                style={{ flex:1, fontSize:12 }} autoFocus />
              <button className="btn sm" style={{ borderColor:"#ffcc00", color:"#ffcc00" }}
                onClick={()=>runAction("liveprice")} disabled={loading||!livePriceGame.trim()}>
                FIND
              </button>
            </div>
          )}
          {activeAction==="trade" && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <input className="inp" placeholder="You offer..." value={offering}
                onChange={e=>setOffering(e.target.value)} style={{ flex:1, minWidth:140, fontSize:12 }} autoFocus />
              <input className="inp" placeholder="You want..." value={wanting}
                onChange={e=>setWanting(e.target.value)} style={{ flex:1, minWidth:140, fontSize:12 }}
                onKeyDown={e=>e.key==="Enter"&&runAction("trade")} />
              <button className="btn o sm" onClick={()=>runAction("trade")} disabled={loading||!offering||!wanting}>
                ASSESS
              </button>
            </div>
          )}
          {activeAction==="news" && (
            <div style={{ display:"flex", gap:8 }}>
              <input className="inp" placeholder="Topic e.g. Steam sales" value={newsTopic}
                onChange={e=>setNewsTopic(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&runAction("news")}
                style={{ flex:1, fontSize:12 }} />
              <button className="btn sm" style={{ borderColor:"#1a9fff", color:"#1a9fff" }}
                onClick={()=>runAction("news")} disabled={loading}>
                BRIEFING
              </button>
            </div>
          )}
          {(activeAction==="recommender"||activeAction==="market") && (
            <button className="btn sm"
              style={{ borderColor: QUICK_ACTIONS.find(a=>a.id===activeAction)?.color,
                color: QUICK_ACTIONS.find(a=>a.id===activeAction)?.color }}
              onClick={()=>runAction(activeAction)} disabled={loading}>
              {QUICK_ACTIONS.find(a=>a.id===activeAction)?.icon} RUN
            </button>
          )}
        </div>
      )}

      {/* Chat messages */}
      <div style={{ flex:1, overflowY:"auto", paddingRight:4, marginBottom:10 }}>
        {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
        {loading && (
          <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:14 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", flexShrink:0,
              background:"linear-gradient(135deg,rgba(0,245,255,0.3),rgba(191,0,255,0.3))",
              border:"1px solid var(--cyan)", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontFamily:"Orbitron", fontWeight:700, color:"var(--cyan)" }}>AI</div>
            <div style={{ background:"rgba(0,245,255,0.05)", border:"1px solid rgba(0,245,255,0.2)",
              padding:"4px 14px" }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div style={{ display:"flex", gap:8 }}>
        <input
          ref={inputRef}
          className="inp"
          placeholder="Ask GV-AI anything about gaming..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==="Enter" && !e.shiftKey && sendChat()}
          disabled={loading}
          style={{ flex:1, fontSize:13 }}
        />
        <button className="btn g" onClick={sendChat} disabled={loading||!input.trim()}
          style={{ flexShrink:0, minWidth:70 }}>
          {loading ? "⟳" : "SEND"}
        </button>
      </div>
      <div className="mono" style={{ fontSize:8, color:"var(--muted)", textAlign:"center", marginTop:5 }}>
        Press Enter to send · Use quick actions above for specialized analysis
      </div>
    </div>
  );
}
