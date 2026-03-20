import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding — shown once after first login for new users
// Steps: Welcome → Link Steam → Link Epic → Explore
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: "welcome",
    icon: "🎮",
    title: "WELCOME TO GAMEVAULT",
    subtitle: "Your ultimate gaming account manager",
    body: "GameVault tracks your Steam & Epic library, lets you buy/sell accounts on the marketplace, trade games with other players, and gives you deep insights into your gaming life.",
    cta: "GET STARTED",
    skip: true,
  },
  {
    id: "steam",
    icon: "⊞",
    iconColor: "#1a9fff",
    title: "LINK YOUR STEAM ACCOUNT",
    subtitle: "Import your entire library automatically",
    body: "Head to the Accounts tab and enter your Steam API key + Steam64 ID. We'll pull your full game library, playtime, level, badges, and achievements in seconds.",
    cta: "CONTINUE →",
    skipLabel: "LINK LATER",
    tip: "💡 You can always link from the Accounts tab at any time",
    skip: true,
  },
  {
    id: "epic",
    icon: "◈",
    iconColor: "var(--green)",
    title: "ADD YOUR EPIC GAMES",
    subtitle: "Track your free Epic game collection",
    body: "Epic doesn't have a public API, so you can manually add your Epic games in the Accounts tab. Highlight all the free games you claimed — they count toward your account value!",
    cta: "GOT IT",
    tip: "💡 Free Epic games add $2.50 each to your valuation",
    skip: false,
  },
  {
    id: "market",
    icon: "⟳",
    iconColor: "var(--purple)",
    title: "MARKETPLACE & TRADES",
    subtitle: "Buy, sell and swap with other players",
    body: "Once you've linked accounts, list them on the Marketplace for sale or use the Trade Center to swap games directly with other GameVault users — no money needed.",
    cta: "SOUNDS GOOD",
    skip: false,
  },
  {
    id: "done",
    icon: "🏆",
    iconColor: "#ffcc00",
    title: "YOU'RE ALL SET!",
    subtitle: "Your vault is ready",
    body: "Start by linking your Steam account for the full experience. Your dashboard will come alive with charts, heatmaps, and real-time valuations.",
    cta: "ENTER THE VAULT",
    skip: false,
    final: true,
  },
];

export default function Onboarding({ onDone, setActive }) {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const advance = (goTo) => {
    setLeaving(true);
    setTimeout(() => {
      setLeaving(false);
      if (goTo === "done" || step >= STEPS.length - 1) {
        onDone();
      } else {
        setStep(s => s + 1);
      }
    }, 200);
  };

  const handleCta = () => {
    if (current.id === "done") { onDone(); return; }
    advance(); // all other steps just advance
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:8000,
      background:"rgba(2,5,14,0.96)",
      backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20,
    }}>
      {/* Animated background orbs */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"20%", left:"15%", width:300, height:300,
          borderRadius:"50%", background:"rgba(0,245,255,0.04)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"20%", right:"15%", width:250, height:250,
          borderRadius:"50%", background:"rgba(191,0,255,0.05)", filter:"blur(60px)" }} />
      </div>

      <div style={{
        position:"relative", width:"100%", maxWidth:520,
        background:"rgba(6,13,27,0.97)",
        border:"1px solid rgba(0,245,255,0.3)",
        boxShadow:"0 0 0 1px rgba(0,245,255,0.07), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(0,245,255,0.08)",
        padding:"40px 36px",
        animation: leaving ? "fadeOut 0.2s ease forwards" : "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}>

        {/* Progress bar */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:"rgba(255,255,255,0.06)" }}>
          <div style={{ height:"100%", width:`${progress}%`,
            background:"linear-gradient(90deg,var(--cyan),var(--purple))",
            transition:"width 0.4s ease", boxShadow:"0 0 8px var(--cyan)" }} />
        </div>

        {/* Step dots */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:32 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{
              width: i === step ? 20 : 6, height:6, borderRadius:3,
              background: i <= step ? "var(--cyan)" : "rgba(255,255,255,0.1)",
              transition:"all 0.3s ease",
              boxShadow: i === step ? "0 0 8px var(--cyan)" : "none",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{
            fontSize:56, lineHeight:1,
            filter:`drop-shadow(0 0 20px ${current.iconColor || "var(--cyan)"})`,
            animation:"popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>{current.icon}</div>
        </div>

        {/* Text */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div className="orb" style={{
            fontSize:20, fontWeight:900, letterSpacing:2,
            color: current.iconColor || "var(--cyan)",
            textShadow:`0 0 20px ${current.iconColor || "var(--cyan)"}`,
            marginBottom:8,
          }}>{current.title}</div>
          <div className="mono" style={{ fontSize:10, color:"var(--muted)", letterSpacing:3, marginBottom:16 }}>
            {current.subtitle}
          </div>
          <div style={{ fontSize:14, color:"rgba(232,244,255,0.8)", lineHeight:1.7, maxWidth:380, margin:"0 auto" }}>
            {current.body}
          </div>
          {current.tip && (
            <div style={{ marginTop:14, padding:"8px 14px", background:"rgba(0,245,255,0.05)",
              border:"1px solid rgba(0,245,255,0.15)", fontSize:12, color:"var(--cyan)" }}>
              {current.tip}
            </div>
          )}
        </div>

        {/* CTA button */}
        <button className={`btn full ${current.final ? "g" : ""}`}
          style={{
            fontSize:12, letterSpacing:3, padding:"14px 20px",
            borderColor: current.iconColor || "var(--cyan)",
            color: current.iconColor || "var(--cyan)",
            boxShadow:`0 0 20px ${current.iconColor || "var(--cyan)"}33`,
          }}
          onClick={handleCta}>
          {current.cta} →
        </button>

        {/* Skip / Back / Counter row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16 }}>
          {step > 0
            ? <button onClick={() => setStep(s => s-1)} style={{
                background:"none", border:"none", cursor:"pointer",
                color:"var(--muted)", fontFamily:"Share Tech Mono", fontSize:10, letterSpacing:1,
              }}>← BACK</button>
            : <span />
          }
          <div className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
            {step + 1} / {STEPS.length}
          </div>
          {current.skip
            ? <button onClick={onDone} style={{
                background:"none", border:"none", cursor:"pointer",
                color:"var(--muted)", fontFamily:"Share Tech Mono", fontSize:10, letterSpacing:1,
                textDecoration:"underline",
              }}>{current.skipLabel || "SKIP INTRO"}</button>
            : <span />
          }
        </div>
      </div>
    </div>
  );
}
