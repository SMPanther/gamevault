const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --cyan:#00f5ff;--purple:#bf00ff;--green:#39ff14;--orange:#ff6600;--red:#ff2244;
      --bg:#050810;--card:rgba(8,14,30,0.90);--border:rgba(0,245,255,0.15);
      --txt:#e8f4ff;--muted:#6b8caa;
      /* light theme overrides toggled via .light class on body */
    }
    body.light{
      --cyan:#0077cc;--purple:#7700cc;--green:#1a8f00;--orange:#cc4400;
      --bg:#eef2f9;--card:rgba(255,255,255,0.96);--border:rgba(0,100,200,0.2);
      --txt:#0a1628;--muted:#4a6080;
    }
    /* Light mode specific overrides */
    body.light .card{background:#ffffff;border-color:rgba(0,100,200,0.18);box-shadow:0 2px 12px rgba(0,0,0,0.07)}
    body.light .stat{background:rgba(0,120,255,0.05);border-color:rgba(0,100,200,0.15)}
    body.light .btn{border-color:#0077cc;color:#0077cc}
    body.light .btn:hover{background:rgba(0,119,204,0.1)}
    body.light .btn.g{border-color:#1a8f00;color:#1a8f00}
    body.light .btn.p{border-color:#7700cc;color:#7700cc}
    body.light .btn.o{border-color:#cc4400;color:#cc4400}
    body.light .inp{background:#f8faff;border-color:rgba(0,100,200,0.25);color:#0a1628}
    body.light .inp:focus{border-color:#0077cc;box-shadow:0 0 0 3px rgba(0,119,204,0.12)}
    body.light .ntab{color:#4a6080}
    body.light .ntab:hover{color:#0a1628}
    body.light .ntab.act{color:#0077cc;border-bottom-color:#0077cc;text-shadow:none}
    body.light .tag.s{background:rgba(0,100,200,0.1);color:#0055aa;border-color:rgba(0,100,200,0.3)}
    body.light .tag.e{background:rgba(0,140,0,0.08);color:#1a7000;border-color:rgba(0,140,0,0.25)}
    body.light .tag.cat{background:rgba(119,0,204,0.07);color:#6600bb;border-color:rgba(119,0,204,0.2)}
    body.light .modal{background:#ffffff;border-color:#0077cc}
    body.light .modal-bg{background:rgba(10,22,40,0.5)}
    body.light .notif{background:#ffffff;border-color:#1a8f00}
    body.light .notif.err{border-color:#cc4400}
    body.light ::-webkit-scrollbar-track{background:#e0e8f5}
    body.light ::-webkit-scrollbar-thumb{background:#0077cc}
    body.light .loading-screen{background:#eef2f9}
    body.light .orb{color:var(--txt)}
    body.light .glow-c{color:#0077cc;text-shadow:none}
    body.light .sec-badge{color:#1a8f00;border-color:rgba(0,140,0,0.3)}
    html,body,#root{height:100%;width:100%}
    body{font-family:'Rajdhani',sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden;transition:background 0.4s,color 0.4s}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#090e1a}
    ::-webkit-scrollbar-thumb{background:var(--cyan);border-radius:3px}
    /* modal inner scrollbar — thin and subtle so it doesn't look like a border */
    .modal::-webkit-scrollbar{width:3px}
    .modal::-webkit-scrollbar-track{background:transparent}
    .modal::-webkit-scrollbar-thumb{background:rgba(0,245,255,0.25);border-radius:3px}
    .orb{font-family:'Orbitron',monospace}.mono{font-family:'Share Tech Mono',monospace}
    .glow-c{text-shadow:0 0 8px var(--cyan),0 0 20px var(--cyan)}

    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    .scan-wrap{pointer-events:none;position:fixed;inset:0;overflow:hidden;z-index:9999}
    .scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(0,245,255,0.07),transparent);animation:scanline 7s linear infinite}

    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .fadeup{animation:fadeUp 0.4s ease forwards}

    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .fadein{animation:fadeIn 0.35s ease forwards}

    /* ── Page slide transitions ──────────────────────────────── */
    @keyframes enterLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
    @keyframes enterRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
    .page-enter-left{animation:enterLeft 0.28s cubic-bezier(0.22,1,0.36,1) forwards}
    .page-enter-right{animation:enterRight 0.28s cubic-bezier(0.22,1,0.36,1) forwards}

    @keyframes pulse{0%,100%{border-color:rgba(0,245,255,0.15)}50%{border-color:rgba(0,245,255,0.38)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
    @keyframes popIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
    @keyframes fadeOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.95)}}

    .spinner{width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block}

    /* ── Buttons ─────────────────────────────────────────────── */
    .btn{background:transparent;border:1px solid var(--cyan);color:var(--cyan);
      font-family:'Orbitron',monospace;font-size:10px;letter-spacing:2px;padding:10px 20px;
      cursor:pointer;transition:all 0.2s;text-transform:uppercase;
      clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))}
    .btn:hover{background:rgba(0,245,255,0.1);box-shadow:0 0 18px rgba(0,245,255,0.25)}
    .btn.g{border-color:var(--green);color:var(--green)}.btn.g:hover{background:rgba(57,255,20,0.1)}
    .btn.p{border-color:var(--purple);color:var(--purple)}.btn.p:hover{background:rgba(191,0,255,0.1)}
    .btn.o{border-color:var(--orange);color:var(--orange)}.btn.o:hover{background:rgba(255,102,0,0.1)}
    .btn.sm{padding:6px 12px;font-size:9px}
    .btn.full{width:100%}
    .btn:disabled{opacity:0.35;cursor:not-allowed}

    /* ── Inputs ──────────────────────────────────────────────── */
    .inp{background:rgba(0,245,255,0.03);border:1px solid rgba(0,245,255,0.18);color:var(--txt);
      font-family:'Rajdhani',sans-serif;font-size:15px;padding:10px 14px;width:100%;outline:none;
      transition:border-color 0.2s,box-shadow 0.2s}
    .inp:focus{border-color:var(--cyan);box-shadow:0 0 10px rgba(0,245,255,0.12)}
    .inp::placeholder{color:var(--muted)}

    /* ── Cards ───────────────────────────────────────────────── */
    .card{background:var(--card);border:1px solid var(--border);backdrop-filter:blur(16px);animation:pulse 4s ease infinite}
    .card-h{transition:transform 0.2s,box-shadow 0.2s}.card-h:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,245,255,0.09)}

    /* ── Tags ────────────────────────────────────────────────── */
    .tag{font-family:'Share Tech Mono',monospace;font-size:9px;padding:2px 7px;letter-spacing:1px;border-radius:2px}
    .tag.s{background:rgba(26,159,255,0.12);color:#1a9fff;border:1px solid rgba(26,159,255,0.28)}
    .tag.e{background:rgba(57,255,20,0.08);color:var(--green);border:1px solid rgba(57,255,20,0.28)}
    .tag.cat{background:rgba(191,0,255,0.08);color:var(--purple);border:1px solid rgba(191,0,255,0.2);font-size:8px;padding:1px 5px}

    /* ── Nav tabs ────────────────────────────────────────────── */
    .ntab{background:transparent;border:none;color:var(--muted);font-family:'Orbitron',monospace;
      font-size:9px;letter-spacing:2px;cursor:pointer;border-bottom:2px solid transparent;
      transition:all 0.2s;text-transform:uppercase;white-space:nowrap;height:64px;padding:0 6px}
    .ntab:hover{color:var(--txt)}.ntab.act{color:var(--cyan);border-bottom-color:var(--cyan);text-shadow:0 0 8px var(--cyan)}

    /* ── Modals ──────────────────────────────────────────────── */
    .modal-bg{
      position:fixed;inset:0;
      background:rgba(2,6,18,0.65);
      backdrop-filter:blur(8px);
      -webkit-backdrop-filter:blur(8px);
      z-index:1000;
      display:flex;align-items:center;justify-content:center;
      padding:80px 20px 20px;
      overflow-y:auto;
    }
    .modal{
      background:rgba(6,13,27,0.97);
      border:1px solid rgba(0,245,255,0.4);
      box-shadow:0 0 0 1px rgba(0,245,255,0.08),
                 0 24px 80px rgba(0,0,0,0.7),
                 0 0 60px rgba(0,245,255,0.1);
      padding:32px;
      width:min(500px,calc(100vw - 40px));
      max-height:calc(100vh - 110px);
      overflow-y:auto;
      animation:popIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
      position:relative;
      flex-shrink:0;
      margin:auto;
    }

    /* ── Backgrounds ─────────────────────────────────────────── */
    .hero-bg{position:fixed;inset:0;z-index:0;background-size:cover;background-position:center;
      filter:brightness(0.22) saturate(1.4);transition:background-image 1s ease}
    body.light .hero-bg{filter:brightness(0.08) saturate(0.2) blur(3px)}
    body.light .hero-ov{opacity:0.3}
    body.light .grid-bg{opacity:0.4}
    .hero-ov{position:fixed;inset:0;z-index:1;
      background:radial-gradient(ellipse at 15% 50%,rgba(0,245,255,0.05) 0%,transparent 55%),
                 radial-gradient(ellipse at 85% 50%,rgba(191,0,255,0.05) 0%,transparent 55%),
                 linear-gradient(180deg,rgba(5,8,16,0.4) 0%,rgba(5,8,16,0.75) 100%)}
    .grid-bg{position:fixed;inset:0;z-index:1;pointer-events:none;
      background-image:linear-gradient(rgba(0,245,255,0.02) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(0,245,255,0.02) 1px,transparent 1px);
      background-size:55px 55px}
    .app{position:relative;z-index:2;min-height:100vh}

    /* ── Stats ───────────────────────────────────────────────── */
    .stat{text-align:center;padding:16px;border:1px solid var(--border);background:rgba(0,245,255,0.02);position:relative;overflow:hidden}
    .stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent)}

    /* ── Charts ──────────────────────────────────────────────── */
    .bar-wrap{display:flex;align-items:flex-end;gap:5px;padding:0}
    .bar{flex:1;min-width:14px;border-radius:2px 2px 0 0;position:relative;cursor:pointer;transition:opacity 0.2s}
    .bar:hover{opacity:0.8}
    .bar::after{content:attr(data-val);position:absolute;top:-20px;left:50%;transform:translateX(-50%);
      font-size:9px;font-family:'Share Tech Mono',monospace;color:var(--cyan);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.2s}
    .bar:hover::after{opacity:1}
    .pie{width:110px;height:110px;border-radius:50%}

    /* ── Mobile Nav ──────────────────────────────────────────── */
    .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;
      background:rgba(5,8,16,0.97);border-top:1px solid var(--border);backdrop-filter:blur(20px);
      padding:6px 0 max(10px,env(safe-area-inset-bottom));overflow-x:auto}
    .mob-nav button{min-width:52px}

    /* ── Notifications ───────────────────────────────────────── */
    .notif{position:fixed;top:20px;right:16px;z-index:2000;background:#060d1b;
      border:1px solid var(--green);box-shadow:0 0 18px rgba(57,255,20,0.18);
      padding:12px 18px;font-size:13px;animation:slideIn 0.3s ease;max-width:300px}
    .notif.err{border-color:var(--orange);box-shadow:0 0 18px rgba(255,102,0,0.18)}

    /* ── Misc ────────────────────────────────────────────────── */
    .sec-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-family:'Share Tech Mono',monospace;
      color:var(--green);border:1px solid rgba(57,255,20,0.25);padding:3px 8px;background:rgba(57,255,20,0.04)}
    .star{cursor:pointer;transition:color 0.2s,transform 0.15s;display:inline-block}.star:hover{transform:scale(1.3)}
    .rating{color:var(--orange);font-size:12px}
    .news-tag{font-size:8px;font-family:'Share Tech Mono',monospace;padding:2px 7px;border-radius:2px;letter-spacing:1px}
    .progress{height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden}
    .progress-fill{height:100%;border-radius:3px;transition:width 1s ease}

    /* ── Theme toggle ────────────────────────────────────────── */
    .theme-btn{background:none;border:1px solid var(--border);color:var(--muted);
      padding:5px 10px;cursor:pointer;font-size:14px;transition:all 0.2s;border-radius:2px}
    .theme-btn:hover{border-color:var(--cyan);color:var(--cyan)}

    /* ── Loading screen ──────────────────────────────────────── */
    .loading-screen{position:fixed;inset:0;z-index:5000;background:#050810;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px}
    @keyframes loadBar{from{width:0}to{width:100%}}
    .load-bar-fill{height:100%;background:linear-gradient(90deg,var(--cyan),var(--purple));
      animation:loadBar 2s ease forwards}

    /* ── Responsive ──────────────────────────────────────────── */
    @media(max-width:768px){
      .mob-nav{display:flex;justify-content:space-around;align-items:center}
      .desk-nav{display:none!important}
      .app{padding-bottom:80px}
      .g2{grid-template-columns:1fr!important}
      .modal{padding:18px}
      .hide-mob{display:none!important}
      /* Tighten page padding on mobile */
      .fadeup,.page-enter-left,.page-enter-right{padding-left:12px!important;padding-right:12px!important}
      /* Stack stat cards on mobile */
      .stat{padding:10px}
      /* Make inputs easier to tap */
      .inp{font-size:16px!important;padding:12px 14px!important}
      .btn{padding:11px 16px!important}
      /* Cards closer together */
      .card{padding:12px!important}
    }
    @media(max-width:480px){
      .g3{grid-template-columns:1fr 1fr!important}
      .g4{grid-template-columns:1fr 1fr!important}
      /* Single column on very small screens */
      .g2{grid-template-columns:1fr!important}
      .modal{padding:14px;width:calc(100vw - 16px)!important}
      .modal-bg{padding:60px 8px 16px!important}
    }
    /* Touch-friendly tap targets */
    @media(hover:none){
      .ntab{min-height:44px}
      .btn{min-height:40px}
      .bar:hover{opacity:1}
      .card-h:hover{transform:none}
    }
  `}</style>
);

export default GlobalStyle;
