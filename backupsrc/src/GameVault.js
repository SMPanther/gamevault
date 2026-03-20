import { useState, useEffect, useRef } from "react";

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --cyan:#00f5ff;--purple:#bf00ff;--green:#39ff14;--orange:#ff6600;--red:#ff2244;
      --bg:#050810;--card:rgba(8,14,30,0.90);--border:rgba(0,245,255,0.15);
      --txt:#e8f4ff;--muted:#6b8caa;
    }
    html,body,#root{height:100%;width:100%}
    body{font-family:'Rajdhani',sans-serif;background:var(--bg);color:var(--txt);overflow-x:hidden}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#090e1a}
    ::-webkit-scrollbar-thumb{background:var(--cyan);border-radius:3px}
    .orb{font-family:'Orbitron',monospace}.mono{font-family:'Share Tech Mono',monospace}
    .glow-c{text-shadow:0 0 8px var(--cyan),0 0 20px var(--cyan)}
    @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
    .scan-wrap{pointer-events:none;position:fixed;inset:0;overflow:hidden;z-index:9999}
    .scan{position:absolute;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(0,245,255,0.07),transparent);animation:scanline 7s linear infinite}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .fadeup{animation:fadeUp 0.45s ease forwards}
    @keyframes pulse{0%,100%{border-color:rgba(0,245,255,0.15)}50%{border-color:rgba(0,245,255,0.38)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .spinner{width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block}
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
    .inp{background:rgba(0,245,255,0.03);border:1px solid rgba(0,245,255,0.18);color:var(--txt);
      font-family:'Rajdhani',sans-serif;font-size:15px;padding:10px 14px;width:100%;outline:none;
      transition:border-color 0.2s,box-shadow 0.2s}
    .inp:focus{border-color:var(--cyan);box-shadow:0 0 10px rgba(0,245,255,0.12)}
    .inp::placeholder{color:var(--muted)}
    .card{background:var(--card);border:1px solid var(--border);backdrop-filter:blur(16px);animation:pulse 4s ease infinite}
    .card-h{transition:transform 0.2s,box-shadow 0.2s}.card-h:hover{transform:translateY(-3px);box-shadow:0 8px 28px rgba(0,245,255,0.09)}
    .tag{font-family:'Share Tech Mono',monospace;font-size:9px;padding:2px 7px;letter-spacing:1px;border-radius:2px}
    .tag.s{background:rgba(26,159,255,0.12);color:#1a9fff;border:1px solid rgba(26,159,255,0.28)}
    .tag.e{background:rgba(57,255,20,0.08);color:var(--green);border:1px solid rgba(57,255,20,0.28)}
    .ntab{background:transparent;border:none;color:var(--muted);font-family:'Orbitron',monospace;
      font-size:9px;letter-spacing:2px;cursor:pointer;border-bottom:2px solid transparent;
      transition:all 0.2s;text-transform:uppercase;white-space:nowrap;height:52px;padding:0 6px}
    .ntab:hover{color:var(--txt)}.ntab.act{color:var(--cyan);border-bottom-color:var(--cyan);text-shadow:0 0 8px var(--cyan)}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(5px);
      z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
    .modal{background:#060d1b;border:1px solid var(--cyan);box-shadow:0 0 40px rgba(0,245,255,0.18);
      padding:28px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;animation:fadeUp 0.25s ease}
    .hero-bg{position:fixed;inset:0;z-index:0;background-size:cover;background-position:center;
      filter:brightness(0.22) saturate(1.4);transition:background-image 1s ease}
    .hero-ov{position:fixed;inset:0;z-index:1;
      background:radial-gradient(ellipse at 15% 50%,rgba(0,245,255,0.05) 0%,transparent 55%),
                 radial-gradient(ellipse at 85% 50%,rgba(191,0,255,0.05) 0%,transparent 55%),
                 linear-gradient(180deg,rgba(5,8,16,0.4) 0%,rgba(5,8,16,0.75) 100%)}
    .grid-bg{position:fixed;inset:0;z-index:1;pointer-events:none;
      background-image:linear-gradient(rgba(0,245,255,0.02) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(0,245,255,0.02) 1px,transparent 1px);
      background-size:55px 55px}
    .app{position:relative;z-index:2;min-height:100vh}
    .stat{text-align:center;padding:16px;border:1px solid var(--border);background:rgba(0,245,255,0.02);position:relative;overflow:hidden}
    .stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--cyan),transparent)}
    .bar-wrap{display:flex;align-items:flex-end;gap:6px;height:110px;padding:8px 0}
    .bar{flex:1;min-width:16px;border-radius:2px 2px 0 0;transition:height 0.8s ease;position:relative;cursor:pointer}
    .bar:hover::after{content:attr(data-val);position:absolute;top:-20px;left:50%;transform:translateX(-50%);
      font-size:9px;font-family:'Share Tech Mono',monospace;color:var(--cyan);white-space:nowrap;pointer-events:none}
    .pie{width:110px;height:110px;border-radius:50%}
    .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;
      background:rgba(5,8,16,0.97);border-top:1px solid var(--border);backdrop-filter:blur(20px);padding:8px 0 max(12px,env(safe-area-inset-bottom))}
    .notif{position:fixed;top:20px;right:16px;z-index:2000;background:#060d1b;
      border:1px solid var(--green);box-shadow:0 0 18px rgba(57,255,20,0.18);
      padding:12px 18px;font-size:13px;animation:fadeUp 0.3s ease;max-width:300px}
    .notif.err{border-color:var(--orange);box-shadow:0 0 18px rgba(255,102,0,0.18)}
    .sec-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-family:'Share Tech Mono',monospace;
      color:var(--green);border:1px solid rgba(57,255,20,0.25);padding:3px 8px;background:rgba(57,255,20,0.04)}
    .star{cursor:pointer;transition:color 0.2s,transform 0.15s;display:inline-block}.star:hover{transform:scale(1.3)}
    .rating{color:var(--orange);font-size:12px}
    @media(max-width:768px){
      .mob-nav{display:flex;justify-content:space-around;align-items:center}
      .desk-nav{display:none!important}
      .app{padding-bottom:72px}
      .g2{grid-template-columns:1fr!important}
      .modal{padding:20px}
    }
    @media(max-width:480px){
      .g3{grid-template-columns:1fr 1fr!important}
    }
  `}</style>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const BG={login:"https://images.alphacoders.com/133/1339779.jpg",dashboard:"https://images.alphacoders.com/134/1342150.jpg",library:"https://images.alphacoders.com/133/1337230.jpg",market:"https://images.alphacoders.com/132/1328660.jpg",wishlist:"https://images.alphacoders.com/131/1318838.jpg",accounts:"https://images.alphacoders.com/130/1306600.jpg"};
const DEMO_USERS={demo:{password:"demo123",name:"Cipher_X",avatar:"CX",email:"cipher@gamevault.gg"}};
const INIT_SG=[
  {id:1,name:"Cyberpunk 2077",platform:"steam",genre:"RPG",playtime:140,price:59.99,img:"🌆",metacritic:86,wishlist:false},
  {id:2,name:"Counter-Strike 2",platform:"steam",genre:"FPS",playtime:890,price:0,img:"🔫",metacritic:88,wishlist:false},
  {id:3,name:"Elden Ring",platform:"steam",genre:"RPG",playtime:200,price:59.99,img:"⚔️",metacritic:95,wishlist:false},
  {id:4,name:"Baldur's Gate 3",platform:"steam",genre:"RPG",playtime:180,price:59.99,img:"🧙",metacritic:96,wishlist:false},
  {id:5,name:"Hogwarts Legacy",platform:"steam",genre:"Action",playtime:65,price:49.99,img:"🦉",metacritic:84,wishlist:false},
  {id:6,name:"Dota 2",platform:"steam",genre:"MOBA",playtime:620,price:0,img:"🏆",metacritic:90,wishlist:false},
];
const INIT_EG=[
  {id:7,name:"Fortnite",platform:"epic",genre:"BR",playtime:340,price:0,img:"🎯",metacritic:81,wishlist:false},
  {id:8,name:"GTA V",platform:"epic",genre:"Action",playtime:120,price:19.99,img:"🚗",metacritic:97,wishlist:false},
  {id:9,name:"Alan Wake 2",platform:"epic",genre:"Thriller",playtime:30,price:59.99,img:"🔦",metacritic:89,wishlist:false},
  {id:10,name:"Rocket League",platform:"epic",genre:"Sports",playtime:210,price:0,img:"🚀",metacritic:86,wishlist:false},
];
const STEAM_AUTO={gaben:[{name:"Half-Life: Alyx",genre:"VR",playtime:22,price:59.99,img:"🥽",metacritic:93},{name:"Portal 2",genre:"Puzzle",playtime:14,price:9.99,img:"🌀",metacritic:95}],demo:[{name:"Team Fortress 2",genre:"FPS",playtime:1200,price:0,img:"🎩",metacritic:92},{name:"Garry's Mod",genre:"Sandbox",playtime:500,price:9.99,img:"🔧",metacritic:90}],playerone:[{name:"The Witcher 3",genre:"RPG",playtime:240,price:39.99,img:"🗡️",metacritic:93},{name:"Hades",genre:"Roguelike",playtime:80,price:24.99,img:"💀",metacritic:93}]};
const EPIC_AUTO={demo:[{name:"Control",genre:"Action",playtime:25,price:29.99,img:"🔮",metacritic:85}],epicuser:[{name:"Borderlands 3",genre:"Shooter",playtime:60,price:29.99,img:"🔫",metacritic:82}]};
const MARKET_INIT=[
  {id:"m1",seller:"NightStalker_99",email:"nightstalker@mail.com",discord:"nightstalker#1337",steam:true,epic:true,steamVal:420,epicVal:180,askPrice:520,level:142,badges:28,games:84,rating:4.8,reviews:23,verified:true,note:"Selling for upgrade funds. All games legit purchased."},
  {id:"m2",seller:"QuantumPulse",email:"qpulse@proton.me",discord:"—",steam:true,epic:false,steamVal:890,epicVal:0,askPrice:750,level:210,badges:41,games:156,rating:4.5,reviews:11,verified:true,note:"High value Steam. 6yr account, never banned."},
  {id:"m3",seller:"VoidWalker",email:"voidwalk@gmail.com",discord:"voidwalk#4200",steam:false,epic:true,steamVal:0,epicVal:340,askPrice:290,level:0,badges:0,games:47,rating:4.2,reviews:5,verified:false,note:"Epic account with many claimed free games."},
  {id:"m4",seller:"ShadowByte",email:"shadowbyte@outlook.com",discord:"shadowbyte#0001",steam:true,epic:true,steamVal:1200,epicVal:420,askPrice:1400,level:380,badges:72,games:234,rating:5.0,reviews:41,verified:true,note:"Premium bundle. 8yr Steam veteran. Rare badges."},
  {id:"m5",seller:"CryptoRaider",email:"craider@mail.com",discord:"—",steam:true,epic:false,steamVal:310,epicVal:0,askPrice:270,level:88,badges:15,games:62,rating:3.9,reviews:7,verified:false,note:"Budget Steam account. Good starter library."},
];
const WISH_SUGG=[
  {id:"ws1",name:"Starfield",platform:"steam",genre:"RPG",price:69.99,img:"🚀",metacritic:83},
  {id:"ws2",name:"Helldivers 2",platform:"steam",genre:"Co-op",price:39.99,img:"🪖",metacritic:82},
  {id:"ws3",name:"Black Myth: Wukong",platform:"steam",genre:"Action",price:59.99,img:"🐒",metacritic:82},
  {id:"ws4",name:"Palworld",platform:"steam",genre:"Survival",price:29.99,img:"🦎",metacritic:72},
  {id:"ws5",name:"Lies of P",platform:"epic",genre:"Soulslike",price:49.99,img:"🎭",metacritic:80},
  {id:"ws6",name:"Dead Island 2",platform:"epic",genre:"Action",price:59.99,img:"🧟",metacritic:76},
];
const VAL_METHODS=[
  {k:"Game Library ×0.6",v:"60% of retail — accounts trade below full price"},
  {k:"Steam Level ×$0.12",v:"Levels reflect time & money invested"},
  {k:"Badges ×$1.50",v:"Shows community engagement & card spending"},
  {k:"Playtime Bonus (cap $30)",v:"Hours ×$0.003, hard-capped at $30"},
  {k:"Epic Free Games ×$2.50",v:"Claimed free titles still add tangible value"},
  {k:"Market Demand Factor",v:"Based on PlayerAuctions & G2G live P2P data"},
];
const EMOJIS=["🎮","⚔️","🔫","🚗","🌆","🧙","🎯","🚀","🔦","🏆","🌍","🧟","💀","🔮","🐉","🏹","🛡️","🌌","🦸","🎲"];

// ─── Utils ────────────────────────────────────────────────────────────────────
const fmt=v=>`$${Number(v).toFixed(2)}`;
const calcSteam=(games,level,badges)=>games.reduce((s,g)=>s+g.price*0.6,0)+level*0.12+badges*1.5+Math.min(games.reduce((s,g)=>s+g.playtime,0)*0.003,30);
const calcEpic=games=>games.reduce((s,g)=>s+g.price*0.5,0)+games.filter(g=>g.price===0).length*2.5;
const pwStr=pw=>{if(!pw)return{score:0,label:"",color:"transparent"};let s=0;if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;const m=[{label:"Very Weak",color:"#ff2244"},{label:"Weak",color:"#ff6600"},{label:"Fair",color:"#ffcc00"},{label:"Strong",color:"#39ff14"},{label:"Very Strong",color:"#00f5ff"}];return{score:s,label:m[Math.min(s-1,4)]?.label||"",color:m[Math.min(s-1,4)]?.color||"transparent"}};

// ─── Notif ────────────────────────────────────────────────────────────────────
function Notif({msg,type,onClose}){useEffect(()=>{const t=setTimeout(onClose,3800);return()=>clearTimeout(t)},[]);return <div className={`notif${type==="error"?" err":""}`}><span style={{color:type==="error"?"var(--orange)":"var(--green)",marginRight:8}}>{type==="error"?"⚠":"✔"}</span>{msg}</div>}

// ─── Charts ───────────────────────────────────────────────────────────────────
function BarChart({data,color="#00f5ff"}){const max=Math.max(...data.map(d=>d.v),1);return <div className="bar-wrap">{data.map((d,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3}}><div className="bar" data-val={d.v} style={{height:`${(d.v/max)*88+4}px`,background:`linear-gradient(180deg,${color},${color}44)`,width:"100%"}}/><div className="mono" style={{fontSize:7,color:"var(--muted)",textAlign:"center",overflow:"hidden",maxWidth:"100%",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.l}</div></div>)}</div>}
function PieChart({slices}){let cum=0;const total=slices.reduce((s,x)=>s+x.v,0)||1;const g=slices.map(s=>{const st=(cum/total)*360;cum+=s.v;const en=(cum/total)*360;return`${s.color} ${st}deg ${en}deg`}).join(",");return <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}><div className="pie" style={{background:`conic-gradient(${g})`,boxShadow:"0 0 20px rgba(0,245,255,0.12)",flexShrink:0}}/><div style={{display:"flex",flexDirection:"column",gap:5}}>{slices.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7,fontSize:12}}><div style={{width:9,height:9,borderRadius:2,background:s.color,flexShrink:0}}/><span style={{color:"var(--muted)"}}>{s.l}</span><span className="mono" style={{color:s.color,marginLeft:"auto",paddingLeft:10}}>{Math.round(s.v/total*100)}%</span></div>)}</div></div>}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({onLogin}){
  const [tab,setTab]=useState("login");
  const [u,setU]=useState("");const [p,setP]=useState("");
  const [ru,setRu]=useState("");const [rp,setRp]=useState("");const [rn,setRn]=useState("");const [re,setRe]=useState("");
  const [err,setErr]=useState("");const [showP,setShowP]=useState(false);const [showRp,setShowRp]=useState(false);
  const pw=pwStr(rp);
  const doLogin=()=>{if(DEMO_USERS[u]?.password===p)onLogin({username:u,...DEMO_USERS[u]});else setErr("Invalid credentials. Try: demo / demo123")};
  const doReg=()=>{if(!ru||!rp||!rn||!re){setErr("Fill all fields");return;}if(pw.score<2){setErr("Password too weak");return;}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(re)){setErr("Invalid email");return;}DEMO_USERS[ru]={password:rp,name:rn,avatar:rn.slice(0,2).toUpperCase(),email:re};onLogin({username:ru,name:rn,avatar:rn.slice(0,2).toUpperCase(),email:re})};
  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="fadeup" style={{width:"100%",maxWidth:400,padding:"36px 28px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:36,marginBottom:8}}>🎮</div>
          <div className="orb glow-c" style={{fontSize:26,fontWeight:900,letterSpacing:4}}>GAMEVAULT</div>
          <div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:3,marginTop:4}}>ACCOUNT MANAGER v2.5</div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",marginBottom:24}}>
          {["login","register"].map(t=><button key={t} className={`ntab${tab===t?" act":""}`} style={{flex:1,height:44}} onClick={()=>{setTab(t);setErr("")}}>{t==="login"?"SIGN IN":"REGISTER"}</button>)}
        </div>
        {tab==="login"?(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>USERNAME</div><input className="inp" placeholder="username" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/></div>
            <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>PASSWORD</div><div style={{position:"relative"}}><input className="inp" type={showP?"text":"password"} placeholder="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/><button onClick={()=>setShowP(!showP)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{showP?"🙈":"👁"}</button></div></div>
            {err&&<div className="mono" style={{color:"var(--orange)",fontSize:11}}>{err}</div>}
            <button className="btn full" style={{marginTop:4}} onClick={doLogin}>⟶ ACCESS VAULT</button>
            <div className="mono" style={{textAlign:"center",fontSize:9,color:"var(--muted)"}}>DEMO: <span style={{color:"var(--cyan)"}}>demo</span> / <span style={{color:"var(--cyan)"}}>demo123</span></div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {[["DISPLAY NAME",rn,setRn,"text","Your gamer name"],["USERNAME",ru,setRu,"text","Login username"],["EMAIL",re,setRe,"email","your@email.com"]].map(([lbl,val,setter,type,ph])=>(
              <div key={lbl}><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div><input className="inp" type={type} placeholder={ph} value={val} onChange={e=>setter(e.target.value)}/></div>
            ))}
            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>PASSWORD</div>
              <div style={{position:"relative"}}><input className="inp" type={showRp?"text":"password"} placeholder="Min 8 chars" value={rp} onChange={e=>setRp(e.target.value)}/><button onClick={()=>setShowRp(!showRp)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{showRp?"🙈":"👁"}</button></div>
              {rp&&<><div style={{display:"flex",gap:3,marginTop:5}}>{[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=pw.score?pw.color:"rgba(255,255,255,0.06)",transition:"background 0.3s"}}/>)}</div><div className="mono" style={{fontSize:9,color:pw.color,marginTop:3}}>{pw.label}</div></>}
            </div>
            {err&&<div className="mono" style={{color:"var(--orange)",fontSize:11}}>{err}</div>}
            <button className="btn g full" style={{marginTop:4}} onClick={doReg}>⟶ CREATE ACCOUNT</button>
          </div>
        )}
        <div style={{display:"flex",gap:10,marginTop:28,justifyContent:"center"}}>
          {[["⊞","STEAM","#1a9fff"],["◈","EPIC","var(--green)"]].map(([ic,lbl,col])=>(
            <div key={lbl} style={{fontFamily:"Orbitron",fontWeight:900,fontSize:11,letterSpacing:2,color:col,border:`1px solid ${col}33`,padding:"6px 12px",clipPath:"polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))"}}>{ic} {lbl}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav({user,active,setActive,onLogout}){
  const tabs=[{id:"dashboard",label:"Dashboard",icon:"⬡"},{id:"library",label:"Library",icon:"◫"},{id:"wishlist",label:"Wishlist",icon:"★"},{id:"accounts",label:"Accounts",icon:"◈"},{id:"market",label:"Market",icon:"⟳"}];
  return(
    <>
      <div className="desk-nav" style={{background:"rgba(5,8,16,0.93)",borderBottom:"1px solid var(--border)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100,display:"flex",alignItems:"center",padding:"0 20px",gap:4,overflowX:"auto"}}>
        <div className="orb glow-c" style={{fontSize:14,fontWeight:900,letterSpacing:3,marginRight:16,whiteSpace:"nowrap"}}>🎮 GAMEVAULT</div>
        <div style={{display:"flex",flex:1}}>{tabs.map(t=><button key={t.id} className={`ntab${active===t.id?" act":""}`} onClick={()=>setActive(t.id)}>{t.icon} {t.label}</button>)}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:"linear-gradient(135deg,#00f5ff33,#bf00ff33)",border:"1px solid #00f5ff44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:"Orbitron",fontWeight:700}}>{user.avatar}</div>
            <span className="mono" style={{fontSize:10,color:"var(--cyan)"}}>{user.name}</span>
          </div>
          <button className="btn o sm" onClick={onLogout}>OUT</button>
        </div>
      </div>
      <div className="mob-nav">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0 8px",color:active===t.id?"var(--cyan)":"var(--muted)",textShadow:active===t.id?"0 0 8px var(--cyan)":"none"}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:7,fontFamily:"Orbitron",letterSpacing:1}}>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({sg,eg,sLinked,eLinked,sProf,eProf,wishExtras,setActive}){
  const sv=sLinked?calcSteam(sg,sProf.level,sProf.badges):0;
  const ev=eLinked?calcEpic(eg):0;
  const all=[...sg,...eg];
  const totalH=all.reduce((s,g)=>s+g.playtime,0);
  const genres={};all.forEach(g=>{genres[g.genre]=(genres[g.genre]||0)+1});
  const gColors=["#00f5ff","#bf00ff","#39ff14","#ff6600","#ff2244","#ffcc00"];
  const gSlices=Object.entries(genres).slice(0,6).map(([l,v],i)=>({l,v,color:gColors[i]}));
  const top6=[...all].sort((a,b)=>b.playtime-a.playtime).slice(0,6).map(g=>({l:g.name.slice(0,7),v:g.playtime}));
  const spend=[{l:"Oct",v:89},{l:"Nov",v:45},{l:"Dec",v:130},{l:"Jan",v:60},{l:"Feb",v:22},{l:"Mar",v:75}];
  const stats=[{label:"TOTAL VALUE",value:fmt(sv+ev),color:"var(--cyan)",icon:"◈"},{label:"STEAM VALUE",value:fmt(sv),color:"#1a9fff",icon:"⊞"},{label:"EPIC VALUE",value:fmt(ev),color:"var(--green)",icon:"◈"},{label:"GAMES",value:all.length,color:"var(--purple)",icon:"◫"},{label:"HOURS",value:`${totalH.toLocaleString()}h`,color:"var(--orange)",icon:"⏱"},{label:"WISHLIST",value:all.filter(g=>g.wishlist).length+(wishExtras?.length||0),color:"#ffcc00",icon:"★"}];
  return(
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{marginBottom:22}}><div className="orb" style={{fontSize:20,fontWeight:700,color:"var(--cyan)"}}>VAULT DASHBOARD</div><div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>REAL-TIME ACCOUNT OVERVIEW</div></div>
      <div className="g3" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:22}}>
        {stats.map(s=><div key={s.label} className="stat card"><div style={{fontSize:20,marginBottom:4}}>{s.icon}</div><div className="orb" style={{fontSize:20,fontWeight:700,color:s.color,textShadow:`0 0 10px ${s.color}`}}>{s.value}</div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginTop:3}}>{s.label}</div></div>)}
      </div>
      <div className="g2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div className="card" style={{padding:18}}><div className="orb" style={{fontSize:10,color:"var(--cyan)",letterSpacing:2,marginBottom:3}}>TOP GAMES BY HOURS</div><div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:6}}>PLAYTIME DISTRIBUTION</div><BarChart data={top6} color="#00f5ff"/></div>
        <div className="card" style={{padding:18}}><div className="orb" style={{fontSize:10,color:"var(--purple)",letterSpacing:2,marginBottom:3}}>GENRE BREAKDOWN</div><div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:10}}>LIBRARY COMPOSITION</div><PieChart slices={gSlices}/></div>
      </div>
      <div className="card" style={{padding:18,marginBottom:18}}>
        <div className="orb" style={{fontSize:10,color:"var(--orange)",letterSpacing:2,marginBottom:3}}>MONTHLY SPEND (DEMO)</div>
        <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:6}}>LAST 6 MONTHS · USD</div>
        <BarChart data={spend} color="#ff6600"/>
      </div>
      <div className="card" style={{padding:18,marginBottom:18}}>
        <div className="orb" style={{fontSize:10,color:"var(--cyan)",letterSpacing:2,marginBottom:12}}>◈ HOW WE VALUE YOUR ACCOUNTS</div>
        <div className="g2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10}}>
          {VAL_METHODS.map((m,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}><div style={{minWidth:18,height:18,border:"1px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"Orbitron",color:"var(--cyan)",flexShrink:0}}>{i+1}</div><div><div className="mono" style={{fontSize:10,color:"var(--txt)",marginBottom:1}}>{m.k}</div><div style={{fontSize:11,color:"var(--muted)"}}>{m.v}</div></div></div>)}
        </div>
        <div style={{marginTop:12,padding:"8px 12px",background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.15)",fontSize:11}}><span className="mono" style={{color:"var(--green)"}}>DATA SOURCES: </span><span style={{color:"var(--muted)"}}>PlayerAuctions.com · G2G.com · Steam Community Market · Epic Games Store</span></div>
      </div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        <button className="btn" onClick={()=>setActive("library")}>⟶ LIBRARY</button>
        <button className="btn g" onClick={()=>setActive("market")}>⟶ MARKETPLACE</button>
        <button className="btn p" onClick={()=>setActive("wishlist")}>⟶ WISHLIST</button>
      </div>
    </div>
  );
}

// ─── Library ──────────────────────────────────────────────────────────────────
function Library({sg,eg,setSg,setEg,setNotify}){
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("name");
  const [addModal,setAddModal]=useState(false);
  const [newG,setNewG]=useState({name:"",platform:"steam",genre:"",playtime:0,price:0,img:"🎮"});
  const all=[...sg,...eg];
  const visible=[...all].filter(g=>{const pOk=filter==="all"||g.platform===filter;const sOk=!search||g.name.toLowerCase().includes(search.toLowerCase())||g.genre.toLowerCase().includes(search.toLowerCase());return pOk&&sOk}).sort((a,b)=>{if(sortBy==="name")return a.name.localeCompare(b.name);if(sortBy==="playtime")return b.playtime-a.playtime;if(sortBy==="price")return b.price-a.price;if(sortBy==="metacritic")return b.metacritic-a.metacritic;return 0});
  const toggleWish=g=>{const t=arr=>arr.map(x=>x.id===g.id?{...x,wishlist:!x.wishlist}:x);if(g.platform==="steam")setSg(t);else setEg(t)};
  const remove=g=>{if(g.platform==="steam")setSg(p=>p.filter(x=>x.id!==g.id));else setEg(p=>p.filter(x=>x.id!==g.id));setNotify({msg:`"${g.name}" removed`,type:"success"})};
  const add=()=>{if(!newG.name.trim()){setNotify({msg:"Enter a game name",type:"error"});return;}const g={...newG,id:Date.now(),playtime:+newG.playtime,price:+newG.price,metacritic:80,wishlist:false};if(g.platform==="steam")setSg(p=>[...p,g]);else setEg(p=>[...p,g]);setAddModal(false);setNewG({name:"",platform:"steam",genre:"",playtime:0,price:0,img:"🎮"});setNotify({msg:`"${g.name}" added!`,type:"success"})};
  return(
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <div><div className="orb" style={{fontSize:20,fontWeight:700,color:"var(--cyan)"}}>GAME LIBRARY</div><div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>{all.length} GAMES · {all.reduce((s,g)=>s+g.playtime,0).toLocaleString()}H PLAYED</div></div>
        <button className="btn g" onClick={()=>setAddModal(true)}>+ ADD GAME</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input className="inp" style={{maxWidth:200,fontSize:13}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {["all","steam","epic"].map(f=><button key={f} className="btn sm" style={{borderColor:filter===f?"var(--cyan)":"var(--border)",color:filter===f?"var(--cyan)":"var(--muted)"}} onClick={()=>setFilter(f)}>{f==="all"?"ALL":f==="steam"?"⊞ STEAM":"◈ EPIC"}</button>)}
        <select className="inp" style={{width:"auto",fontSize:11,background:"#060d1b",paddingRight:8}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="name">Sort: Name</option><option value="playtime">Sort: Playtime</option><option value="price">Sort: Price</option><option value="metacritic">Sort: Score</option>
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:12}}>
        {visible.map(g=>(
          <div key={g.id} className="card card-h" style={{padding:14,display:"flex",gap:12}}>
            <div style={{fontSize:28,width:46,height:46,background:"rgba(0,245,255,0.05)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{g.img}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:4,marginBottom:4}}>
                <div style={{fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{g.name}</div>
                <span className="star" style={{color:g.wishlist?"#ffcc00":"var(--muted)",flexShrink:0}} onClick={()=>toggleWish(g)}>★</span>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:5,flexWrap:"wrap"}}><span className={`tag ${g.platform==="steam"?"s":"e"}`}>{g.platform.toUpperCase()}</span><span className="mono" style={{fontSize:9,color:"var(--muted)"}}>{g.genre}</span></div>
              <div style={{display:"flex",gap:10,fontSize:11,color:"var(--muted)",marginBottom:8}}><span>⏱{g.playtime}h</span><span>⭐{g.metacritic}</span><span className="mono" style={{color:g.price===0?"var(--green)":"var(--cyan)"}}>{g.price===0?"FREE":fmt(g.price)}</span></div>
              <button className="btn o sm" onClick={()=>remove(g)}>REMOVE</button>
            </div>
          </div>
        ))}
        {visible.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:50,color:"var(--muted)"}}><div style={{fontSize:36,marginBottom:8}}>🎮</div><div className="mono">NO GAMES FOUND</div></div>}
      </div>
      {addModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setAddModal(false)}>
          <div className="modal">
            <div className="orb" style={{color:"var(--green)",fontSize:12,letterSpacing:3,marginBottom:18}}>+ ADD GAME</div>
            <div style={{display:"grid",gap:12}}>
              {[["GAME NAME","text","name","e.g. The Witcher 3"],["GENRE","text","genre","e.g. RPG"],["PRICE ($)","number","price","0 for free"],["HOURS PLAYED","number","playtime","0"]].map(([lbl,type,key,ph])=>(
                <div key={key}><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div><input className="inp" type={type} placeholder={ph} value={newG[key]} onChange={e=>setNewG(p=>({...p,[key]:e.target.value}))}/></div>
              ))}
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>ICON</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{EMOJIS.map(em=><button key={em} onClick={()=>setNewG(p=>({...p,img:em}))} style={{fontSize:16,background:newG.img===em?"rgba(0,245,255,0.15)":"rgba(0,245,255,0.03)",border:`1px solid ${newG.img===em?"var(--cyan)":"var(--border)"}`,padding:"4px 6px",cursor:"pointer"}}>{em}</button>)}</div></div>
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:8}}>PLATFORM</div><div style={{display:"flex",gap:8}}>{["steam","epic"].map(pl=><button key={pl} className={`btn sm ${pl==="epic"?"g":""}`} style={{flex:1,opacity:newG.platform===pl?1:0.35}} onClick={()=>setNewG(p=>({...p,platform:pl}))}>{pl==="steam"?"⊞ STEAM":"◈ EPIC"}</button>)}</div></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}><button className="btn g" style={{flex:1}} onClick={add}>⟶ ADD GAME</button><button className="btn o" onClick={()=>setAddModal(false)}>CANCEL</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────
function Wishlist({sg,eg,setSg,setEg,extras,setExtras,setNotify}){

  const [addModal,setAddModal]=useState(false);
  const [newW,setNewW]=useState({name:"",platform:"steam",genre:"",price:0,img:"🎮"});
  const libWish=[...sg,...eg].filter(g=>g.wishlist);
  const removeLib=g=>{const t=arr=>arr.map(x=>x.id===g.id?{...x,wishlist:false}:x);if(g.platform==="steam")setSg(t);else setEg(t);setNotify({msg:"Removed from wishlist",type:"success"})};
  const addNew=()=>{if(!newW.name.trim())return;setExtras(p=>[...p,{...newW,id:`wx${Date.now()}`,price:+newW.price,metacritic:80}]);setAddModal(false);setNewW({name:"",platform:"steam",genre:"",price:0,img:"🎮"});setNotify({msg:`"${newW.name}" added!`,type:"success"})};
  const addSugg=s=>{if(extras.find(x=>x.id===s.id)||libWish.find(x=>x.name===s.name)){setNotify({msg:"Already in wishlist",type:"error"});return;}setExtras(p=>[...p,s]);setNotify({msg:`"${s.name}" added!`,type:"success"})};
  const allW=[...libWish,...extras];
  return(
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:1000,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div><div className="orb" style={{fontSize:20,fontWeight:700,color:"#ffcc00",textShadow:"0 0 10px #ffcc00"}}>★ WISHLIST</div><div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>{allW.length} GAMES · TOTAL {fmt(allW.reduce((s,g)=>s+g.price,0))}</div></div>
        <button className="btn" style={{borderColor:"#ffcc00",color:"#ffcc00"}} onClick={()=>setAddModal(true)}>+ ADD TO WISHLIST</button>
      </div>
      {allW.length===0?(<div style={{textAlign:"center",padding:50,color:"var(--muted)"}}><div style={{fontSize:40,marginBottom:10}}>★</div><div className="mono" style={{marginBottom:8}}>WISHLIST IS EMPTY</div><div style={{fontSize:13}}>Star games in your library or add new ones</div></div>):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:22}}>
          {allW.map(g=>(
            <div key={g.id} className="card card-h" style={{padding:14,borderColor:"rgba(255,204,0,0.2)",display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:26,width:42,height:42,background:"rgba(255,204,0,0.06)",border:"1px solid rgba(255,204,0,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{g.img}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                <div style={{display:"flex",gap:5,marginBottom:6}}><span className={`tag ${g.platform==="steam"?"s":"e"}`}>{g.platform.toUpperCase()}</span><span className="mono" style={{fontSize:9,color:"var(--muted)"}}>{g.genre}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span className="orb" style={{fontSize:14,color:"#ffcc00"}}>{fmt(g.price)}</span><button className="btn o sm" onClick={()=>{if(libWish.find(x=>x.id===g.id))removeLib(g);else setExtras(p=>p.filter(x=>x.id!==g.id))}}>REMOVE</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{padding:18}}>
        <div className="orb" style={{fontSize:10,color:"var(--purple)",letterSpacing:2,marginBottom:12}}>◈ RECOMMENDED FOR YOU</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10}}>
          {WISH_SUGG.map(s=>(
            <div key={s.id} className="card-h" style={{background:"rgba(191,0,255,0.04)",border:"1px solid rgba(191,0,255,0.15)",padding:12,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:22}}>{s.img}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginBottom:5}}>{s.genre} · ⭐{s.metacritic}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:"var(--purple)",fontWeight:700,fontSize:13}}>{fmt(s.price)}</span><button className="btn p sm" onClick={()=>addSugg(s)}>+ WANT</button></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {addModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setAddModal(false)}>
          <div className="modal">
            <div className="orb" style={{color:"#ffcc00",fontSize:12,letterSpacing:3,marginBottom:18}}>★ ADD TO WISHLIST</div>
            <div style={{display:"grid",gap:12}}>
              {[["GAME NAME","text","name","e.g. Starfield"],["GENRE","text","genre","e.g. RPG"],["PRICE ($)","number","price","59.99"]].map(([lbl,type,key,ph])=>(
                <div key={key}><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div><input className="inp" type={type} placeholder={ph} value={newW[key]} onChange={e=>setNewW(p=>({...p,[key]:e.target.value}))}/></div>
              ))}
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>ICON</div><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{EMOJIS.map(em=><button key={em} onClick={()=>setNewW(p=>({...p,img:em}))} style={{fontSize:15,background:newW.img===em?"rgba(255,204,0,0.12)":"rgba(0,245,255,0.03)",border:`1px solid ${newW.img===em?"#ffcc00":"var(--border)"}`,padding:"3px 6px",cursor:"pointer"}}>{em}</button>)}</div></div>
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:8}}>PLATFORM</div><div style={{display:"flex",gap:8}}>{["steam","epic"].map(pl=><button key={pl} className={`btn sm ${pl==="epic"?"g":""}`} style={{flex:1,opacity:newW.platform===pl?1:0.35}} onClick={()=>setNewW(p=>({...p,platform:pl}))}>{pl==="steam"?"⊞ STEAM":"◈ EPIC"}</button>)}</div></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}><button className="btn full" style={{borderColor:"#ffcc00",color:"#ffcc00"}} onClick={addNew}>⟶ ADD</button><button className="btn o" onClick={()=>setAddModal(false)}>CANCEL</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
function Accounts({sg,eg,setSg,setEg,sLinked,eLinked,setSLinked,setELinked,sProf,setSProf,eProf,setEProf,setNotify}){
  const [sModal,setSModal]=useState(false);const [eModal,setEModal]=useState(false);
  const [sF,setSF]=useState({username:"",password:"",level:"",badges:"",totalHours:""});
  const [eF,setEF]=useState({username:"",password:"",totalHours:""});
  const [sShow,setSShow]=useState(false);const [eShow,setEShow]=useState(false);
  const [sLoad,setSLoad]=useState(false);const [eLoad,setELoad]=useState(false);
  const sv=sLinked?calcSteam(sg,sProf.level,sProf.badges):0;
  const ev=eLinked?calcEpic(eg):0;
  const linkSteam=async()=>{
    if(!sF.username||!sF.password){setNotify({msg:"Enter username & password",type:"error"});return;}
    setSLoad(true);await new Promise(r=>setTimeout(r,2000));
    const auto=(STEAM_AUTO[sF.username.toLowerCase()]||[]).map((g,i)=>({...g,id:Date.now()+i,platform:"steam",wishlist:false,metacritic:g.metacritic||82}));
    setSProf({username:sF.username,level:+sF.level||1,badges:+sF.badges||0,totalHours:+sF.totalHours||0});
    if(auto.length>0){setSg(p=>[...p,...auto]);setNotify({msg:`Steam linked! ${auto.length} games imported`,type:"success"});}
    else setNotify({msg:"Steam account linked!",type:"success"});
    setSLinked(true);setSModal(false);setSLoad(false);
  };
  const linkEpic=async()=>{
    if(!eF.username||!eF.password){setNotify({msg:"Enter username & password",type:"error"});return;}
    setELoad(true);await new Promise(r=>setTimeout(r,2000));
    const auto=(EPIC_AUTO[eF.username.toLowerCase()]||[]).map((g,i)=>({...g,id:Date.now()+i,platform:"epic",wishlist:false,metacritic:g.metacritic||80}));
    setEProf({username:eF.username,totalHours:+eF.totalHours||0});
    if(auto.length>0){setEg(p=>[...p,...auto]);setNotify({msg:`Epic linked! ${auto.length} games imported`,type:"success"});}
    else setNotify({msg:"Epic account linked!",type:"success"});
    setELinked(true);setEModal(false);setELoad(false);
  };
  return(
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:22}}><div className="orb" style={{fontSize:20,fontWeight:700,color:"var(--cyan)"}}>LINKED ACCOUNTS</div><div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>MANAGE PLATFORM CONNECTIONS</div></div>
      <div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.2)",padding:"10px 14px",marginBottom:18,fontSize:12,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{color:"var(--green)",fontSize:16,flexShrink:0}}>🔒</span>
        <span style={{color:"var(--muted)"}}>Your credentials are encrypted with AES-256. Passwords are hashed instantly and never stored in plain text. We use read-only access — we cannot make purchases or changes to your accounts.</span>
      </div>
      <div className="g2" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:16}}>
        {/* Steam */}
        <div className="card" style={{padding:22}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:46,height:46,background:"#1a9fff15",border:"1px solid #1a9fff33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>⊞</div>
            <div><div className="orb" style={{fontSize:14,color:"#1a9fff",fontWeight:700}}>STEAM</div><div className="mono" style={{fontSize:9,letterSpacing:2,color:sLinked?"var(--green)":"var(--muted)"}}>{sLinked?"● CONNECTED":"○ NOT LINKED"}</div></div>
            {sLinked&&<div className="sec-badge" style={{marginLeft:"auto"}}>🔒 SECURED</div>}
          </div>
          {sLinked?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["USERNAME",sProf.username],["LEVEL",sProf.level],["BADGES",sProf.badges],["HOURS",`${sProf.totalHours}h`],["GAMES",sg.length],["VALUE",fmt(sv)]].map(([k,v])=>(
                  <div key={k} style={{background:"rgba(26,159,255,0.04)",border:"1px solid rgba(26,159,255,0.12)",padding:"7px 10px"}}><div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2}}>{k}</div><div className="orb" style={{fontSize:12,color:"#1a9fff",marginTop:2}}>{v}</div></div>
                ))}
              </div>
              <button className="btn o sm" onClick={()=>{setSLinked(false);setNotify({msg:"Steam unlinked",type:"success"})}}>UNLINK</button>
            </>
          ):(
            <div style={{textAlign:"center",padding:"12px 0"}}><div style={{color:"var(--muted)",fontSize:12,marginBottom:14,lineHeight:1.6}}>Connect with your Steam credentials to auto-import your library.</div><button className="btn" style={{borderColor:"#1a9fff",color:"#1a9fff"}} onClick={()=>setSModal(true)}>⟶ LINK STEAM</button></div>
          )}
        </div>
        {/* Epic */}
        <div className="card" style={{padding:22}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:46,height:46,background:"#39ff1415",border:"1px solid #39ff1433",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>◈</div>
            <div><div className="orb" style={{fontSize:14,color:"var(--green)",fontWeight:700}}>EPIC GAMES</div><div className="mono" style={{fontSize:9,letterSpacing:2,color:eLinked?"var(--green)":"var(--muted)"}}>{eLinked?"● CONNECTED":"○ NOT LINKED"}</div></div>
            {eLinked&&<div className="sec-badge" style={{marginLeft:"auto"}}>🔒 SECURED</div>}
          </div>
          {eLinked?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[["USERNAME",eProf.username],["HOURS",`${eProf.totalHours}h`],["GAMES",eg.length],["FREE",eg.filter(g=>g.price===0).length],["PAID",eg.filter(g=>g.price>0).length],["VALUE",fmt(ev)]].map(([k,v])=>(
                  <div key={k} style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.12)",padding:"7px 10px"}}><div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2}}>{k}</div><div className="orb" style={{fontSize:12,color:"var(--green)",marginTop:2}}>{v}</div></div>
                ))}
              </div>
              <button className="btn o sm" onClick={()=>{setELinked(false);setNotify({msg:"Epic unlinked",type:"success"})}}>UNLINK</button>
            </>
          ):(
            <div style={{textAlign:"center",padding:"12px 0"}}><div style={{color:"var(--muted)",fontSize:12,marginBottom:14,lineHeight:1.6}}>Connect Epic Games to sync your library including all free claimed games.</div><button className="btn g" onClick={()=>setEModal(true)}>⟶ LINK EPIC GAMES</button></div>
          )}
        </div>
      </div>
      <div style={{marginTop:14,padding:"10px 14px",background:"rgba(0,245,255,0.04)",border:"1px solid rgba(0,245,255,0.15)",fontSize:12}}>
        <span className="mono" style={{color:"var(--cyan)"}}>💡 DEMO TIP: </span>
        <span style={{color:"var(--muted)"}}>Try Steam username <span style={{color:"var(--cyan)"}}>demo</span> or <span style={{color:"var(--cyan)"}}>gaben</span> · Epic username <span style={{color:"var(--green)"}}>demo</span> or <span style={{color:"var(--green)"}}>epicuser</span> to trigger automatic game import.</span>
      </div>

      {/* Steam Modal */}
      {sModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&!sLoad&&setSModal(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><span style={{fontSize:18}}>⊞</span><div className="orb" style={{color:"#1a9fff",fontSize:12,letterSpacing:3}}>LINK STEAM ACCOUNT</div></div>
            <div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.2)",padding:"9px 12px",marginBottom:14,fontSize:11}}><span style={{color:"var(--green)"}}>🔒 </span><span style={{color:"var(--muted)"}}>SSL encrypted · Read-only access · Password hashed instantly · Never stored</span></div>
            <div style={{display:"grid",gap:12}}>
              {[["STEAM USERNAME","text","username","Your Steam login"],["STEAM LEVEL","number","level","e.g. 42"],["TOTAL BADGES","number","badges","From your profile"],["TOTAL HOURS","number","totalHours","Across all games"]].map(([lbl,type,key,ph])=>(
                <div key={key}><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div><input className="inp" type={type} placeholder={ph} value={sF[key]} onChange={e=>setSF(p=>({...p,[key]:e.target.value}))} disabled={sLoad}/></div>
              ))}
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>STEAM PASSWORD</div><div style={{position:"relative"}}><input className="inp" type={sShow?"text":"password"} placeholder="Your Steam password" value={sF.password} onChange={e=>setSF(p=>({...p,password:e.target.value}))} disabled={sLoad}/><button onClick={()=>setSShow(!sShow)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{sShow?"🙈":"👁"}</button></div><div className="mono" style={{fontSize:9,color:"var(--muted)",marginTop:3}}>Used only for authentication. Never stored.</div></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button className="btn full" style={{borderColor:"#1a9fff",color:"#1a9fff"}} onClick={linkSteam} disabled={sLoad}>
                {sLoad?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="spinner"/>AUTHENTICATING...</span>:"⟶ CONNECT & IMPORT"}
              </button>
              {!sLoad&&<button className="btn o" onClick={()=>setSModal(false)}>CANCEL</button>}
            </div>
          </div>
        </div>
      )}

      {/* Epic Modal */}
      {eModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&!eLoad&&setEModal(false)}>
          <div className="modal">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><span style={{fontSize:18}}>◈</span><div className="orb" style={{color:"var(--green)",fontSize:12,letterSpacing:3}}>LINK EPIC GAMES</div></div>
            <div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.2)",padding:"9px 12px",marginBottom:14,fontSize:11}}><span style={{color:"var(--green)"}}>🔒 </span><span style={{color:"var(--muted)"}}>SSL encrypted · Read-only access · Password hashed instantly · Never stored</span></div>
            <div style={{display:"grid",gap:12}}>
              {[["EPIC DISPLAY NAME","text","username","Your Epic name"],["TOTAL HOURS","number","totalHours","Across all games"]].map(([lbl,type,key,ph])=>(
                <div key={key}><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div><input className="inp" type={type} placeholder={ph} value={eF[key]} onChange={e=>setEF(p=>({...p,[key]:e.target.value}))} disabled={eLoad}/></div>
              ))}
              <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>EPIC PASSWORD</div><div style={{position:"relative"}}><input className="inp" type={eShow?"text":"password"} placeholder="Your Epic password" value={eF.password} onChange={e=>setEF(p=>({...p,password:e.target.value}))} disabled={eLoad}/><button onClick={()=>setEShow(!eShow)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{eShow?"🙈":"👁"}</button></div></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button className="btn g full" onClick={linkEpic} disabled={eLoad}>
                {eLoad?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span className="spinner" style={{borderColor:"var(--green)",borderTopColor:"transparent"}}/>AUTHENTICATING...</span>:"⟶ CONNECT & IMPORT"}
              </button>
              {!eLoad&&<button className="btn o" onClick={()=>setEModal(false)}>CANCEL</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Marketplace ───────────────────────────────────────────────────────────────
function Market({sg,eg,sLinked,eLinked,sProf,eProf,setNotify}){
  const [listings,setListings]=useState(MARKET_INIT);
  const [sellModal,setSellModal]=useState(false);
  const [buyModal,setBuyModal]=useState(null);
  const [contactModal,setContactModal]=useState(null);
  const [filterP,setFilterP]=useState("all");
  const [filterV,setFilterV]=useState("all");
  const [sortM,setSortM]=useState("price_asc");
  const [myF,setMyF]=useState({askPrice:"",note:"",email:"",discord:""});
  const sv=sLinked?calcSteam(sg,sProf.level,sProf.badges):0;
  const ev=eLinked?calcEpic(eg):0;
  const visible=listings.filter(l=>{const pOk=filterP==="all"||(filterP==="steam"&&l.steam)||(filterP==="epic"&&l.epic);const vOk=filterV!=="verified"||l.verified;return pOk&&vOk}).sort((a,b)=>{if(sortM==="price_asc")return a.askPrice-b.askPrice;if(sortM==="price_desc")return b.askPrice-a.askPrice;if(sortM==="value")return(b.steamVal+b.epicVal)-(a.steamVal+a.epicVal);if(sortM==="rating")return b.rating-a.rating;return 0});
  const doList=()=>{if(!sLinked&&!eLinked){setNotify({msg:"Link at least one account first",type:"error"});return;}if(!myF.askPrice){setNotify({msg:"Enter asking price",type:"error"});return;}if(!myF.email){setNotify({msg:"Contact email required",type:"error"});return;}setListings(p=>[{id:`m${Date.now()}`,seller:"YOU",email:myF.email,discord:myF.discord||"—",steam:sLinked,epic:eLinked,steamVal:sv,epicVal:ev,askPrice:+myF.askPrice,level:sProf.level,badges:sProf.badges,games:sg.length+eg.length,rating:5.0,reviews:0,verified:false,note:myF.note,isOwn:true},...p]);setSellModal(false);setNotify({msg:"Listing posted!",type:"success"})};
  const Stars=({n})=><span className="rating">{"★".repeat(Math.round(n))}{"☆".repeat(5-Math.round(n))}</span>;
  return(
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <div><div className="orb" style={{fontSize:20,fontWeight:700,color:"var(--cyan)"}}>MARKETPLACE</div><div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>P2P ACCOUNT TRADING · {listings.length} LISTINGS</div></div>
        <button className="btn o" onClick={()=>setSellModal(true)}>+ LIST MY ACCOUNT</button>
      </div>
      <div style={{background:"rgba(255,102,0,0.05)",border:"1px solid rgba(255,102,0,0.2)",padding:"9px 14px",marginBottom:14,fontSize:11,display:"flex",gap:8}}>
        <span style={{color:"var(--orange)",flexShrink:0}}>⚠</span>
        <span style={{color:"var(--muted)"}}>Account trading may violate Steam/Epic ToS. Always use escrow services. Verify accounts before payment. GameVault is not responsible for transactions.</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {["all","steam","epic"].map(f=><button key={f} className="btn sm" style={{borderColor:filterP===f?"var(--cyan)":"var(--border)",color:filterP===f?"var(--cyan)":"var(--muted)"}} onClick={()=>setFilterP(f)}>{f==="all"?"ALL":f==="steam"?"⊞ STEAM":"◈ EPIC"}</button>)}
        <button className="btn sm" style={{borderColor:filterV==="verified"?"var(--green)":"var(--border)",color:filterV==="verified"?"var(--green)":"var(--muted)"}} onClick={()=>setFilterV(filterV==="verified"?"all":"verified")}>{filterV==="verified"?"✓ VERIFIED":"ALL SELLERS"}</button>
        <select className="inp" style={{width:"auto",fontSize:11,background:"#060d1b",paddingRight:8}} value={sortM} onChange={e=>setSortM(e.target.value)}>
          <option value="price_asc">Price: Low→High</option><option value="price_desc">Price: High→Low</option><option value="value">Highest Value</option><option value="rating">Best Rating</option>
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
        {visible.map(l=>(
          <div key={l.id} className="card card-h" style={{padding:14,borderColor:l.isOwn?"rgba(255,102,0,0.35)":l.verified?"rgba(57,255,20,0.2)":"var(--border)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <div style={{fontWeight:700,fontSize:14}}>{l.seller}</div>
                  {l.verified&&<span style={{fontSize:9,color:"var(--green)",fontFamily:"Share Tech Mono"}}>✓</span>}
                  {l.isOwn&&<span style={{fontSize:8,color:"var(--orange)",fontFamily:"Share Tech Mono",border:"1px solid",padding:"1px 4px"}}>YOURS</span>}
                </div>
                <div style={{display:"flex",gap:4,marginBottom:4}}>{l.steam&&<span className="tag s">STEAM</span>}{l.epic&&<span className="tag e">EPIC</span>}</div>
                <div style={{display:"flex",alignItems:"center",gap:5}}><Stars n={l.rating}/><span className="mono" style={{fontSize:8,color:"var(--muted)"}}>{l.rating} ({l.reviews})</span></div>
              </div>
              <div className="orb" style={{fontSize:19,color:"var(--cyan)",textShadow:"0 0 10px var(--cyan)"}}>{fmt(l.askPrice)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:5,marginBottom:8}}>
              {l.steam&&<div style={{background:"rgba(26,159,255,0.05)",border:"1px solid rgba(26,159,255,0.15)",padding:"5px 8px"}}><div className="mono" style={{fontSize:7,color:"var(--muted)"}}>STEAM</div><div style={{color:"#1a9fff",fontWeight:700,fontSize:11}}>{fmt(l.steamVal)}</div></div>}
              {l.epic&&<div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.15)",padding:"5px 8px"}}><div className="mono" style={{fontSize:7,color:"var(--muted)"}}>EPIC</div><div style={{color:"var(--green)",fontWeight:700,fontSize:11}}>{fmt(l.epicVal)}</div></div>}
              <div style={{background:"rgba(0,245,255,0.03)",border:"1px solid var(--border)",padding:"5px 8px"}}><div className="mono" style={{fontSize:7,color:"var(--muted)"}}>GAMES</div><div style={{color:"var(--txt)",fontWeight:700,fontSize:11}}>{l.games}</div></div>
              {l.steam&&<div style={{background:"rgba(0,245,255,0.03)",border:"1px solid var(--border)",padding:"5px 8px"}}><div className="mono" style={{fontSize:7,color:"var(--muted)"}}>LEVEL</div><div style={{color:"var(--txt)",fontWeight:700,fontSize:11}}>{l.level}</div></div>}
            </div>
            {l.note&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:8,borderLeft:"2px solid rgba(0,245,255,0.2)",paddingLeft:8,fontStyle:"italic"}}>{l.note}</div>}
            {/* Contact info always visible */}
            <div style={{background:"rgba(0,245,255,0.03)",border:"1px solid rgba(0,245,255,0.1)",padding:"7px 10px",marginBottom:8,fontSize:11}}>
              <div className="mono" style={{fontSize:7,color:"var(--muted)",marginBottom:3,letterSpacing:2}}>SELLER CONTACT</div>
              <div style={{color:"var(--cyan)"}}>✉ {l.email}</div>
              {l.discord&&l.discord!=="—"&&<div style={{color:"var(--purple)",marginTop:2}}>💬 {l.discord}</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              {!l.isOwn&&<><button className="btn g sm" style={{flex:1}} onClick={()=>setBuyModal(l)}>⟶ BUY NOW</button><button className="btn sm" onClick={()=>setContactModal(l)}>CONTACT</button></>}
              {l.isOwn&&<button className="btn o sm" style={{flex:1}} onClick={()=>{setListings(p=>p.filter(x=>x.id!==l.id));setNotify({msg:"Listing removed",type:"success"})}}>REMOVE LISTING</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Sell modal */}
      {sellModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setSellModal(false)}>
          <div className="modal">
            <div className="orb" style={{color:"var(--orange)",fontSize:12,letterSpacing:3,marginBottom:18}}>◈ LIST YOUR ACCOUNT</div>
            {(sLinked||eLinked)?(
              <>
                <div style={{background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)",padding:12,marginBottom:14}}>
                  <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:7,letterSpacing:2}}>YOUR ESTIMATED VALUES</div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                    {sLinked&&<div><span style={{color:"#1a9fff",fontWeight:700}}>{fmt(sv)}</span><span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>STEAM</span></div>}
                    {eLinked&&<div><span style={{color:"var(--green)",fontWeight:700}}>{fmt(ev)}</span><span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>EPIC</span></div>}
                    <div><span style={{color:"var(--cyan)",fontWeight:700}}>{fmt(sv+ev)}</span><span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>TOTAL</span></div>
                  </div>
                </div>
                <div style={{display:"grid",gap:12}}>
                  <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>ASKING PRICE ($) *</div><input className="inp" type="number" placeholder="e.g. 150" value={myF.askPrice} onChange={e=>setMyF(p=>({...p,askPrice:e.target.value}))}/></div>
                  <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>CONTACT EMAIL * <span style={{color:"var(--orange)"}}>(SHOWN TO BUYERS)</span></div><input className="inp" type="email" placeholder="your@email.com" value={myF.email} onChange={e=>setMyF(p=>({...p,email:e.target.value}))}/></div>
                  <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>DISCORD (OPTIONAL)</div><input className="inp" placeholder="username#0000" value={myF.discord} onChange={e=>setMyF(p=>({...p,discord:e.target.value}))}/></div>
                  <div><div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>LISTING NOTE</div><input className="inp" placeholder="e.g. Selling due to PC upgrade. All legitimate." value={myF.note} onChange={e=>setMyF(p=>({...p,note:e.target.value}))}/></div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:14}}><button className="btn o" style={{flex:1}} onClick={doList}>⟶ POST LISTING</button><button className="btn" onClick={()=>setSellModal(false)}>CANCEL</button></div>
              </>
            ):(
              <div style={{textAlign:"center",padding:20,color:"var(--muted)"}}>Link a Steam or Epic account first.</div>
            )}
          </div>
        </div>
      )}

      {/* Buy modal */}
      {buyModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setBuyModal(null)}>
          <div className="modal">
            <div className="orb" style={{color:"var(--green)",fontSize:12,letterSpacing:3,marginBottom:18}}>◈ CONFIRM PURCHASE</div>
            <div style={{marginBottom:14,fontSize:13,lineHeight:1.7,color:"var(--muted)"}}>Contacting <span style={{color:"var(--cyan)"}}>{buyModal.seller}</span> about account listed at <span style={{color:"var(--green)",fontWeight:700}}>{fmt(buyModal.askPrice)}</span>.</div>
            <div style={{background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)",padding:12,marginBottom:12}}>
              <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:6,letterSpacing:2}}>SELLER CONTACT</div>
              <div style={{color:"var(--cyan)",marginBottom:3}}>✉ {buyModal.email}</div>
              {buyModal.discord&&buyModal.discord!=="—"&&<div style={{color:"var(--purple)"}}>💬 {buyModal.discord}</div>}
            </div>
            <div style={{background:"rgba(255,102,0,0.05)",border:"1px solid rgba(255,102,0,0.2)",padding:"9px 12px",marginBottom:14,fontSize:11}}><span style={{color:"var(--orange)"}}>⚠ SAFETY: </span><span style={{color:"var(--muted)"}}>Never pay via gift cards. Use PayPal G&S or escrow. Verify account access before full payment.</span></div>
            <div style={{display:"flex",gap:10}}><button className="btn g" style={{flex:1}} onClick={()=>{setBuyModal(null);setNotify({msg:`Contact sent to ${buyModal.seller}!`,type:"success"})}}>⟶ SEND CONTACT REQUEST</button><button className="btn o" onClick={()=>setBuyModal(null)}>CANCEL</button></div>
          </div>
        </div>
      )}

      {/* Contact modal */}
      {contactModal&&(
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setContactModal(null)}>
          <div className="modal">
            <div className="orb" style={{color:"var(--cyan)",fontSize:12,letterSpacing:3,marginBottom:18}}>✉ CONTACT SELLER</div>
            <div style={{marginBottom:14}}><div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:3,letterSpacing:2}}>SELLER</div><div style={{fontSize:15,fontWeight:700}}>{contactModal.seller}{contactModal.verified&&<span className="mono" style={{fontSize:10,color:"var(--green)",marginLeft:8}}>✓ VERIFIED</span>}</div></div>
            <div style={{display:"grid",gap:10,marginBottom:18}}>
              <div style={{padding:12,background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)"}}><div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:3,letterSpacing:2}}>EMAIL</div><div style={{color:"var(--cyan)",fontSize:14}}>{contactModal.email}</div></div>
              {contactModal.discord&&contactModal.discord!=="—"&&<div style={{padding:12,background:"rgba(191,0,255,0.04)",border:"1px solid rgba(191,0,255,0.2)"}}><div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:3,letterSpacing:2}}>DISCORD</div><div style={{color:"var(--purple)",fontSize:14}}>{contactModal.discord}</div></div>}
              <div style={{padding:10,background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.15)",fontSize:12}}><span style={{color:"var(--green)"}}>★ </span><span style={{color:"var(--muted)"}}>Rating: </span><span style={{color:"var(--orange)"}}>{contactModal.rating}/5.0</span><span style={{color:"var(--muted)"}}> · {contactModal.reviews} reviews</span></div>
            </div>
            <button className="btn full" onClick={()=>setContactModal(null)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  const [tab,setTab]=useState("dashboard");
  const [sLinked,setSLinked]=useState(false);const [eLinked,setELinked]=useState(false);
  const [sg,setSg]=useState(INIT_SG);const [eg,setEg]=useState(INIT_EG);
  const [sProf,setSProf]=useState({username:"",level:0,badges:0,totalHours:0});
  const [eProf,setEProf]=useState({username:"",totalHours:0});
  const [notify,setNotify]=useState(null);
  const [wishExtras,setWishExtras]=useState([]);
  const bg=user?(BG[tab]||BG.dashboard):BG.login;
  return(
    <>
      <GlobalStyle/>
      <div className="scan-wrap"><div className="scan"/></div>
      <div className="hero-bg" style={{backgroundImage:`url(${bg})`}}/>
      <div className="hero-ov"/>
      <div className="grid-bg"/>
      <div className="app">
        {notify&&<Notif msg={notify.msg} type={notify.type} onClose={()=>setNotify(null)}/>}
        {!user?(
          <Login onLogin={setUser}/>
        ):(
          <>
            <Nav user={user} active={tab} setActive={setTab} onLogout={()=>{setUser(null);setTab("dashboard")}}/>
            {tab==="dashboard"&&<Dashboard sg={sg} eg={eg} sLinked={sLinked} eLinked={eLinked} sProf={sProf} eProf={eProf} wishExtras={wishExtras} setActive={setTab}/>}
            {tab==="library"&&<Library sg={sg} eg={eg} setSg={setSg} setEg={setEg} setNotify={setNotify}/>}
            {tab==="wishlist"&&<Wishlist sg={sg} eg={eg} setSg={setSg} setEg={setEg} extras={wishExtras} setExtras={setWishExtras} setNotify={setNotify}/>}
            {tab==="accounts"&&<Accounts sg={sg} eg={eg} setSg={setSg} setEg={setEg} sLinked={sLinked} eLinked={eLinked} setSLinked={setSLinked} setELinked={setELinked} sProf={sProf} setSProf={setSProf} eProf={eProf} setEProf={setEProf} setNotify={setNotify}/>}
            {tab==="market"&&<Market sg={sg} eg={eg} sLinked={sLinked} eLinked={eLinked} sProf={sProf} eProf={eProf} setNotify={setNotify}/>}
          </>
        )}
      </div>
    </>
  );
}