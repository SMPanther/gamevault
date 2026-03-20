import { useState, useRef } from "react";
import { pwStr } from "../utils/helpers";
import { sbRegister, sbLogin, sbGetProfile, sbCheckUsername, supabase } from "../utils/supabase";
import { resetPassword } from "../constants/auth";

// ─────────────────────────────────────────────────────────────────────────────
// EmailJS OTP Verification
//
// Setup (free, 200 emails/month):
// 1. Go to https://www.emailjs.com → Sign up free
// 2. Email Services → Add Service → Gmail (connect your Gmail)
// 3. Email Templates → Create Template:
//    Subject: "GameVault — Your verification code"
//    Body:    "Your GameVault code is: {{otp}}"
//    (make sure the template variable is named exactly "otp")
// 4. Account → API Keys → copy your Public Key
// 5. Fill in the 3 constants below
// ─────────────────────────────────────────────────────────────────────────────

const EMAILJS_SERVICE_ID  = "service_yxj2ub3";   // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_kq3m1um";  // e.g. "template_xyz789"
const EMAILJS_PUBLIC_KEY  = "DAuu8upt2rk8eoj4B";   // e.g. "abcDEFghiJKL"

// Generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via EmailJS
async function sendOTP(toEmail, otp) {
  // Load EmailJS SDK lazily
  if (!window.emailjs) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load EmailJS"));
      document.head.appendChild(s);
    });
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email:    toEmail,
    otp:         otp,
    from_name:   "GameVault",
    reply_to:    toEmail,
  }, { publicKey: EMAILJS_PUBLIC_KEY });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [tab,  setTab]  = useState("login");
  const [step, setStep] = useState(1); // register steps: 1=form, 2=otp, 3=success

  // Login fields
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [showP, setShowP] = useState(false);

  // Register fields
  const [rName,  setRName]  = useState("");
  const [rUser,  setRUser]  = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPw,    setRPw]    = useState("");
  const [rCode,  setRCode]  = useState("");
  const [showRp, setShowRp] = useState(false);

  // OTP state
  const [otpSending,  setOtpSending]  = useState(false);
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpValue,    setOtpValue]    = useState(""); // what user types
  const [otpSecret,   setOtpSecret]   = useState(""); // what we generated
  const [otpExpiry,   setOtpExpiry]   = useState(null); // timestamp
  const [otpErr,      setOtpErr]      = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0); // seconds until resend allowed
  const cooldownRef = useRef(null);

  // Email format state
  const [emailStatus, setEmailStatus] = useState(null); // null | "ok" | "taken"

  // Forgot password
  const [fUser,setFUser]=useState(""); const [fCode,setFCode]=useState(""); const [fNewPw,setFNewPw]=useState("");
  const [showFPw,setShowFPw]=useState(false); const [resetDone,setResetDone]=useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr]         = useState("");
  const [regLoad, setRegLoad] = useState(false);
  const pw = pwStr(rPw);

  const switchTab = t => {
    setTab(t); setErr(""); setStep(1); setResetDone(false);
    setEmailStatus(null); setOtpSent(false); setOtpValue(""); setOtpErr("");
    setOtpAttempts(0); setOtpCooldown(0); clearInterval(cooldownRef.current);
  };

  // Email format check on change
  const onEmailChange = (val) => {
    setREmail(val);
    setOtpSent(false); setOtpValue(""); setOtpErr("");
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
    if (!valid) { setEmailStatus(null); return; }
    if (emailTaken(val)) { setEmailStatus("taken"); return; }
    setEmailStatus("ok");
  };

  // Start cooldown timer for resend
  const startCooldown = (seconds) => {
    setOtpCooldown(seconds);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown(v => {
        if (v <= 1) { clearInterval(cooldownRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  // Send/resend OTP
  const doSendOTP = async () => {
    setErr(""); setOtpErr("");
    if (!rEmail || emailStatus !== "ok") { setErr("Enter a valid email first"); return; }

    setOtpSending(true);
    try {
      const otp = generateOTP();
      await sendOTP(rEmail, otp);
      setOtpSecret(otp);
      setOtpExpiry(Date.now() + 10 * 60 * 1000); // 10 min expiry
      setOtpSent(true);
      setOtpValue("");
      setOtpAttempts(0);
      setOtpErr("");
      setStep(2);
      startCooldown(60); // 60s before resend
    } catch (e) {
      console.error("EmailJS error:", e);
      setErr("Failed to send email: " + (e?.text || e?.message || JSON.stringify(e)));
    }
    setOtpSending(false);
  };

  // Verify OTP and complete registration
  const doVerifyOTP = async () => {
    setOtpErr("");
    if (!otpValue.trim()) { setOtpErr("Enter the 6-digit code"); return; }
    if (Date.now() > otpExpiry) { setOtpErr("Code expired — request a new one"); return; }
    if (otpAttempts >= 5) { setOtpErr("Too many attempts — request a new code"); return; }

    if (otpValue.trim() !== otpSecret) {
      setOtpAttempts(a => a + 1);
      setOtpErr(`Incorrect code — ${4 - otpAttempts} attempts left`);
      return;
    }

    // OTP correct — validate rest of form then register via Supabase
    setErr("");
    if (!rName||!rUser||!rPw||!rCode) { setErr("Go back and fill all fields"); return; }
    if (pw.score < 2)                  { setErr("Password too weak"); return; }
    if (rCode.trim().length < 6)       { setErr("Recovery code too short"); return; }

    setRegLoad(true);
    // Check username not taken in Supabase
    const taken = await sbCheckUsername(rUser);
    if (taken) { setErr("Username already taken"); setRegLoad(false); return; }

    const result = await sbRegister({
      email: rEmail, password: rPw,
      username: rUser, name: rName,
      recoveryCode: rCode.toUpperCase(),
    });
    setRegLoad(false);
    if (!result.ok) { setErr(result.error); return; }
    setStep(3);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const doLogin = async () => {
    setErr("");
    if (!u.trim() || !p.trim()) { setErr("Enter email and password"); return; }
    const email = u.includes("@") ? u.trim() : u.trim(); // allow email login
    const result = await sbLogin({ email, password: p });
    if (!result.ok) { setErr(result.error || "Invalid credentials"); return; }
    const prof = await sbGetProfile(result.user.id);
    if (!prof) { setErr("Profile not found — contact support"); return; }
    if (prof.banned) { setErr("Account banned"); return; }
    onLogin(result.user, prof);
  };

  // ── Forgot ────────────────────────────────────────────────────────────────
  const checkUsername = () => {
    setErr("");
    if (!fUser.trim()) { setErr("Enter your username"); return; }
    const result = resetPassword(fUser, "__CHECK_ONLY__", "__CHECK_ONLY__");
    if (result.error === "Username not found") { setErr("Username not found"); return; }
    setStep(2);
  };
  const doReset = () => {
    setErr("");
    if (!fCode||!fNewPw) { setErr("Fill all fields"); return; }
    if (pwStr(fNewPw).score < 2) { setErr("New password too weak"); return; }
    const result = resetPassword(fUser, fCode, fNewPw);
    if (!result.ok) { setErr(result.error); return; }
    setResetDone(true);
  };

  // ── OTP input — auto-advance digits ───────────────────────────────────────
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];
  const otpDigits = otpValue.padEnd(6," ").split("").slice(0,6);

  const onOtpKey = (i, e) => {
    const val = e.target.value.replace(/\D/g,"");
    const digits = otpValue.split("");
    digits[i] = val.slice(-1) || "";
    const newOtp = digits.join("").slice(0,6);
    setOtpValue(newOtp);
    setOtpErr("");
    if (val && i < 5) otpRefs[i+1].current?.focus();
    if (e.key === "Backspace" && !otpValue[i] && i > 0) otpRefs[i-1].current?.focus();
  };

  // Handle paste on OTP
  const onOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (pasted) { setOtpValue(pasted); setOtpErr(""); otpRefs[Math.min(pasted.length,5)].current?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div className="fadeup" style={{width:"100%",maxWidth:430,padding:"36px 28px"}}>

        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src="/gamevault-logo.png" alt="GameVault" style={{
            width:200, height:"auto", objectFit:"contain",
            filter:"drop-shadow(0 0 14px rgba(0,245,255,0.55)) drop-shadow(0 0 28px rgba(191,0,255,0.25))",
            marginBottom:8,
          }} />
          <div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:3,marginTop:4}}>ACCOUNT MANAGER v4.0</div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid var(--border)",marginBottom:24}}>
          {[["login","SIGN IN"],["register","REGISTER"],["forgot","FORGOT"]].map(([t,lbl])=>(
            <button key={t} className={`ntab${tab===t?" act":""}`}
              style={{flex:1,height:40,fontSize:8}} onClick={()=>switchTab(t)}>{lbl}</button>
          ))}
        </div>

        {/* ── LOGIN ───────────────────────────────────── */}
        {tab==="login" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>USERNAME</div>
              <input className="inp" placeholder="email address" value={u}
                onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
            </div>
            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>PASSWORD</div>
              <div style={{position:"relative"}}>
                <input className="inp" type={showP?"text":"password"} placeholder="password" value={p}
                  onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
                <button onClick={()=>setShowP(!showP)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{showP?"🙈":"👁"}</button>
              </div>
            </div>
            {err&&<div className="mono" style={{color:"var(--orange)",fontSize:11}}>⚠ {err}</div>}
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12}}>
              <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)}
                style={{width:14,height:14,accentColor:"var(--cyan)",cursor:"pointer"}}/>
              <span style={{color:"var(--muted)",fontFamily:"Share Tech Mono",fontSize:10,letterSpacing:1}}>
                REMEMBER ME <span style={{fontSize:9,opacity:0.6}}>(7 days)</span>
              </span>
            </label>
            <button className="btn full" onClick={doLogin}>⟶ ACCESS VAULT</button>
            <div className="mono" style={{textAlign:"center",fontSize:9,color:"var(--muted)"}}>
              DEMO: <span style={{color:"var(--cyan)"}}>demo</span> / <span style={{color:"var(--cyan)"}}>demo123</span>
            </div>
          </div>
        )}

        {/* ── REGISTER STEP 1 — Fill form ─────────────── */}
        {tab==="register" && step===1 && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* Step indicator */}
            <div style={{display:"flex",gap:6,marginBottom:4}}>
              {["DETAILS","VERIFY EMAIL","DONE"].map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:"center"}}>
                  <div style={{height:2,background:i===0?"var(--cyan)":"rgba(255,255,255,0.1)",marginBottom:4,borderRadius:1}}/>
                  <div className="mono" style={{fontSize:7,color:i===0?"var(--cyan)":"var(--muted)",letterSpacing:1}}>{s}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>DISPLAY NAME</div>
              <input className="inp" placeholder="Your gamer name" value={rName} onChange={e=>setRName(e.target.value)}/>
            </div>

            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>EMAIL</div>
              <input className="inp" type="email" placeholder="your@email.com"
                value={rEmail} onChange={e=>onEmailChange(e.target.value)}
                style={{borderColor:
                  emailStatus==="ok"?"rgba(57,255,20,0.5)":
                  emailStatus==="taken"?"rgba(255,102,0,0.5)":
                  "var(--border)"
                }}/>
              {emailStatus==="taken" && <div className="mono" style={{fontSize:9,color:"var(--orange)",marginTop:4}}>✗ Email already registered</div>}
              {emailStatus==="ok"    && <div className="mono" style={{fontSize:9,color:"var(--green)",marginTop:4}}>✓ Email format valid — will verify by OTP</div>}
            </div>

            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>USERNAME</div>
              <input className="inp" placeholder="Choose a unique username" value={rUser} onChange={e=>setRUser(e.target.value)}/>
              {rUser.trim().length>2&&(
                <div className="mono" style={{fontSize:9,marginTop:4,color:"var(--green)"}}>✓ Username looks good</div>
              )}
            </div>

            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>PASSWORD</div>
              <div style={{position:"relative"}}>
                <input className="inp" type={showRp?"text":"password"} placeholder="Min 8 chars"
                  value={rPw} onChange={e=>setRPw(e.target.value)}/>
                <button onClick={()=>setShowRp(!showRp)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{showRp?"🙈":"👁"}</button>
              </div>
              {rPw&&(
                <>
                  <div style={{display:"flex",gap:3,marginTop:5}}>
                    {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,
                      background:i<=pw.score?pw.color:"rgba(255,255,255,0.06)",transition:"background 0.3s"}}/>)}
                  </div>
                  <div className="mono" style={{fontSize:9,color:pw.color,marginTop:3}}>{pw.label}</div>
                </>
              )}
            </div>

            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>
                RECOVERY CODE <span style={{color:"var(--orange)"}}>(SAVE THIS)</span>
              </div>
              <input className="inp" placeholder="e.g. MYGAME-2025-XYZ" value={rCode}
                onChange={e=>setRCode(e.target.value.toUpperCase())} style={{letterSpacing:2}}/>
            </div>

            {err&&<div style={{background:"rgba(255,102,0,0.08)",border:"1px solid rgba(255,102,0,0.25)",padding:"8px 12px"}}>
              <div className="mono" style={{color:"var(--orange)",fontSize:11}}>⚠ {err}</div>
            </div>}

            <button className="btn g full" onClick={doSendOTP}
              disabled={otpSending||emailStatus!=="ok"||!rName||!rUser||!rPw||!rCode||pw.score<2}>
              {otpSending
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span className="spinner" style={{borderColor:"var(--green)",borderTopColor:"transparent"}}/>
                    SENDING CODE...
                  </span>
                : "⟶ SEND VERIFICATION CODE"}
            </button>
            <div className="mono" style={{fontSize:8,color:"var(--muted)",textAlign:"center"}}>
              A 6-digit code will be sent to your email
            </div>
          </div>
        )}

        {/* ── REGISTER STEP 2 — OTP verify ────────────── */}
        {tab==="register" && step===2 && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Step indicator */}
            <div style={{display:"flex",gap:6,marginBottom:4}}>
              {["DETAILS","VERIFY EMAIL","DONE"].map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:"center"}}>
                  <div style={{height:2,background:i<=1?"var(--cyan)":"rgba(255,255,255,0.1)",marginBottom:4,borderRadius:1}}/>
                  <div className="mono" style={{fontSize:7,color:i<=1?"var(--cyan)":"var(--muted)",letterSpacing:1}}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>📧</div>
              <div className="orb" style={{fontSize:13,color:"var(--cyan)",letterSpacing:2,marginBottom:6}}>CHECK YOUR EMAIL</div>
              <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>
                We sent a 6-digit code to<br/>
                <span style={{color:"var(--cyan)",fontFamily:"Share Tech Mono"}}>{rEmail}</span>
              </div>
            </div>

            {/* 6-digit OTP boxes */}
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[0,1,2,3,4,5].map(i=>(
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpDigits[i].trim()}
                  onChange={e=>onOtpKey(i,e)}
                  onKeyDown={e=>{ if(e.key==="Backspace"&&!otpDigits[i].trim()&&i>0) otpRefs[i-1].current?.focus(); }}
                  onPaste={onOtpPaste}
                  style={{
                    width:44, height:52, textAlign:"center",
                    fontFamily:"Orbitron,monospace", fontWeight:700, fontSize:20,
                    background:"rgba(0,245,255,0.04)",
                    border:`1px solid ${otpDigits[i].trim()?"var(--cyan)":"rgba(0,245,255,0.2)"}`,
                    color:"var(--cyan)", outline:"none",
                    transition:"border-color 0.15s",
                  }}
                />
              ))}
            </div>

            {otpErr&&<div className="mono" style={{color:"var(--orange)",fontSize:11,textAlign:"center"}}>⚠ {otpErr}</div>}
            {err   &&<div className="mono" style={{color:"var(--orange)",fontSize:11,textAlign:"center"}}>⚠ {err}</div>}

            {/* Expiry indicator */}
            <div className="mono" style={{fontSize:9,color:"var(--muted)",textAlign:"center"}}>
              Code expires in 10 minutes
            </div>

            <button className="btn g full" onClick={doVerifyOTP} disabled={regLoad||otpValue.length<6}>
              {regLoad
                ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span className="spinner" style={{borderColor:"var(--green)",borderTopColor:"transparent"}}/>
                    CREATING ACCOUNT...
                  </span>
                : "⟶ VERIFY & CREATE ACCOUNT"}
            </button>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={()=>setStep(1)} style={{background:"none",border:"none",cursor:"pointer",
                color:"var(--muted)",fontFamily:"Share Tech Mono",fontSize:9,letterSpacing:1}}>
                ← CHANGE EMAIL
              </button>
              <button onClick={doSendOTP} disabled={otpCooldown>0||otpSending}
                style={{background:"none",border:"none",cursor:otpCooldown>0?"not-allowed":"pointer",
                  color:otpCooldown>0?"var(--muted)":"var(--cyan)",
                  fontFamily:"Share Tech Mono",fontSize:9,letterSpacing:1}}>
                {otpCooldown>0 ? `RESEND IN ${otpCooldown}s` : "RESEND CODE"}
              </button>
            </div>
          </div>
        )}

        {/* ── REGISTER STEP 3 — Success ───────────────── */}
        {tab==="register" && step===3 && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Step indicator */}
            <div style={{display:"flex",gap:6,marginBottom:4}}>
              {["DETAILS","VERIFY EMAIL","DONE"].map((s,i)=>(
                <div key={s} style={{flex:1,textAlign:"center"}}>
                  <div style={{height:2,background:"var(--green)",marginBottom:4,borderRadius:1}}/>
                  <div className="mono" style={{fontSize:7,color:"var(--green)",letterSpacing:1}}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>✅</div>
              <div className="orb" style={{color:"var(--green)",fontSize:14,letterSpacing:2}}>ACCOUNT CREATED!</div>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:8}}>Email verified successfully</div>
            </div>

            <div style={{background:"rgba(255,102,0,0.08)",border:"2px solid rgba(255,102,0,0.5)",padding:16}}>
              <div className="mono" style={{fontSize:9,color:"var(--orange)",letterSpacing:2,marginBottom:10}}>
                ⚠ SAVE YOUR RECOVERY CODE — CANNOT RECOVER LATER
              </div>
              <div style={{textAlign:"center",letterSpacing:4,fontSize:18,fontFamily:"Share Tech Mono",
                color:"#ffcc00",padding:"14px 0",background:"rgba(255,204,0,0.05)",border:"1px solid rgba(255,204,0,0.25)"}}>
                {rCode}
              </div>
            </div>

            <button className="btn g full" onClick={async ()=>{
              const result = await sbLogin({ email:rEmail, password:rPw });
              if (result.ok) {
                const prof = await sbGetProfile(result.user.id);
                if (prof) onLogin(result.user, prof);
              }
            }}>
              ⟶ I'VE SAVED IT — ENTER VAULT
            </button>
          </div>
        )}

        {/* ── FORGOT PASSWORD ──────────────────────────── */}
        {tab==="forgot" && !resetDone && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"rgba(0,245,255,0.04)",border:"1px solid rgba(0,245,255,0.15)",padding:"10px 14px",fontSize:11,color:"var(--muted)"}}>
              Enter your username and recovery code to reset your password.
            </div>
            <div>
              <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>USERNAME</div>
              <input className="inp" placeholder="Your username" value={fUser}
                onChange={e=>setFUser(e.target.value)} disabled={step===2}/>
            </div>
            {step===1&&(
              <>
                {err&&<div className="mono" style={{color:"var(--orange)",fontSize:11}}>⚠ {err}</div>}
                <button className="btn full" onClick={checkUsername}>⟶ CONTINUE</button>
              </>
            )}
            {step===2&&(
              <>
                <div>
                  <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>RECOVERY CODE</div>
                  <input className="inp" placeholder="Your recovery code" value={fCode}
                    onChange={e=>setFCode(e.target.value.toUpperCase())} style={{letterSpacing:2}}/>
                </div>
                <div>
                  <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>NEW PASSWORD</div>
                  <div style={{position:"relative"}}>
                    <input className="inp" type={showFPw?"text":"password"} placeholder="New password"
                      value={fNewPw} onChange={e=>setFNewPw(e.target.value)}/>
                    <button onClick={()=>setShowFPw(!showFPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--muted)",cursor:"pointer"}}>{showFPw?"🙈":"👁"}</button>
                  </div>
                  {fNewPw&&(()=>{const s=pwStr(fNewPw);return(
                    <div style={{display:"flex",gap:3,marginTop:5}}>
                      {[1,2,3,4,5].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=s.score?s.color:"rgba(255,255,255,0.06)",transition:"background 0.3s"}}/>)}
                    </div>
                  );})()}
                </div>
                {err&&<div className="mono" style={{color:"var(--orange)",fontSize:11}}>⚠ {err}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button className="btn" style={{flex:1}} onClick={doReset}>⟶ RESET PASSWORD</button>
                  <button className="btn o" onClick={()=>setStep(1)}>BACK</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RESET SUCCESS ────────────────────────────── */}
        {tab==="forgot" && resetDone && (
          <div style={{display:"flex",flexDirection:"column",gap:16,textAlign:"center"}}>
            <div style={{fontSize:40}}>🔓</div>
            <div className="orb" style={{color:"var(--green)",fontSize:13,letterSpacing:2}}>PASSWORD RESET!</div>
            <div style={{color:"var(--muted)",fontSize:13}}>Your password has been updated. You can now sign in.</div>
            <button className="btn g full" onClick={()=>switchTab("login")}>⟶ GO TO LOGIN</button>
          </div>
        )}
      </div>
    </div>
  );
}
