import { useState, useEffect } from "react";
import GlobalStyle from "./constants/styles";
import { BG } from "./constants/data";
import { LoadingScreen, Notif, Nav } from "./components/UI";
import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Library        from "./pages/Library";
import Wishlist       from "./pages/Wishlist";
import Accounts       from "./pages/Accounts";
import Market         from "./pages/Market";
import TradeCenter    from "./pages/TradeCenter";
import OwnerDashboard from "./pages/OwnerDashboard";
import Onboarding     from "./pages/Onboarding";
import PriceTracker   from "./pages/PriceTracker";
import ActivityLog    from "./pages/ActivityLog";
import { USER_DB }    from "./constants/auth";
import { logActivity } from "./utils/storage";
import {
  supabase,
  sbGetProfile, sbSaveGameState, sbLoadGameState, sbUpdateProfile,
} from "./utils/supabase";

// ── Per-tab local video files ─────────────────────────────────────────────────
const TAB_VIDEOS = {
  dashboard: "/videos/bg-dashboard.mp4",
  library:   "/videos/bg-library.mp4",
  wishlist:  "/videos/bg-wishlist.mp4",
  accounts:  "/videos/bg-accounts.mp4",
  market:    "/videos/bg-market.mp4",
  trades:    "/videos/bg-trades.mp4",
  prices:    "/videos/bg-prices.mp4",
  activity:  "/videos/bg-dashboard.mp4",
  login:     "/videos/bg-login.mp4",
};

function VideoBg({ videoId, enabled }) {
  if (!enabled || !videoId) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
      <video key={videoId} src={videoId} autoPlay muted loop playsInline style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        width:"177.78vh", height:"56.25vw",
        minWidth:"100%", minHeight:"100%",
        objectFit:"cover", opacity:0.13,
        filter:"brightness(0.55) saturate(1.5)",
        transition:"opacity 1.2s ease",
      }} />
    </div>
  );
}

const TAB_ORDER = ["dashboard","library","wishlist","accounts","market","trades","prices","activity"];

const freshUserState = () => ({
  tab:        "dashboard",
  sLinked:    false,
  eLinked:    false,
  sg:         [],
  eg:         [],
  sProf:      { username:"", level:0, badges:0, totalHours:0 },
  eProf:      { username:"", totalHours:0 },
  wishExtras: [],
  showOnboarding: false,
});

// Debounced save to Supabase — waits 2s after last change before saving
let _saveTimer = null;
function debouncedSave(userId, state) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => sbSaveGameState(userId, state), 2000);
}

export default function App() {
  const [loaded,    setLoaded]    = useState(false);
  const [user,      setUser]      = useState(null);   // Supabase user object
  const [profile,   setProfile]   = useState(null);   // profiles table row
  const [theme,     setTheme]     = useState("dark");
  const [notify,    setNotify]    = useState(null);
  const [ownerTick, setOwnerTick] = useState(0);
  const [uState,    setUState]    = useState(freshUserState());
  const [animKey,   setAnimKey]   = useState(0);
  const [animDir,   setAnimDir]   = useState("right");
  const [videoBg,   setVideoBg]   = useState(true);

  const { tab, sLinked, eLinked, sg, eg, sProf, eProf, wishExtras, showOnboarding } = uState;
  const isOwner = profile?.role === "owner";

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    // Check for existing Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      setLoaded(true);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setUState(freshUserState());
        setNotify(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(sbUser) {
    const prof = await sbGetProfile(sbUser.id);
    if (!prof) return; // profile not created yet

    setUser(sbUser);
    setProfile(prof);

    // Also sync into legacy USER_DB so existing pages work without refactoring
    USER_DB[prof.username] = {
      username:        prof.username,
      name:            prof.name,
      avatar:          prof.avatar || prof.name?.slice(0,2).toUpperCase(),
      email:           sbUser.email,
      role:            prof.role || "user",
      steamVerified:   prof.steam_verified,
      hasSeenOnboarding: prof.has_seen_onboarding,
      verification:    prof.verification || null,
      banned:          false,
    };

    const fresh = freshUserState();
    if (!prof.has_seen_onboarding) fresh.showOnboarding = true;

    // Load game state from Supabase
    const saved = await sbLoadGameState(sbUser.id);
    if (saved) {
      fresh.sg         = saved.sg         || [];
      fresh.eg         = saved.eg         || [];
      fresh.sLinked    = saved.sLinked    || false;
      fresh.eLinked    = saved.eLinked    || false;
      fresh.sProf      = saved.sProf      || fresh.sProf;
      fresh.eProf      = saved.eProf      || fresh.eProf;
      fresh.wishExtras = saved.wishExtras || [];
    }

    setUState(fresh);
  }

  // ── State updater — saves to Supabase on every change ─────────────────────
  const set = (key) => (v) =>
    setUState(s => {
      const next = { ...s, [key]: typeof v === "function" ? v(s[key]) : v };
      if (user?.id) debouncedSave(user.id, next);
      return next;
    });

  const setTab = (newTab) => {
    const oldIdx = TAB_ORDER.indexOf(uState.tab);
    const newIdx = TAB_ORDER.indexOf(newTab);
    setAnimDir(newIdx >= oldIdx ? "left" : "right");
    setAnimKey(k => k + 1);
    setUState(s => ({ ...s, tab: newTab }));
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.body.classList.toggle("light", next === "light");
  };

  // ── Login — called by Login.jsx after Supabase auth ───────────────────────
  const handleLogin = (sbUser, prof) => {
    setUser(sbUser);
    setProfile(prof);
    logActivity(prof.username, "login", `Signed in`);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (user?.id) {
      await sbSaveGameState(user.id, {
        sg, eg, sLinked, eLinked, sProf, eProf, wishExtras,
      });
      logActivity(profile?.username, "logout", "Signed out");
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setUState(freshUserState());
    setNotify(null);
  };

  // ── User update (display name, avatar) ────────────────────────────────────
  const handleUserUpdate = async (updates) => {
    if (user?.id) {
      await sbUpdateProfile(user.id, updates);
      setProfile(p => ({ ...p, ...updates }));
    }
  };

  const bg = user ? (BG[tab] || BG.dashboard) : BG.login;

  // Build a merged user object for existing pages that expect the old format
  const mergedUser = user && profile ? {
    id:           user.id,
    username:     profile.username,
    name:         profile.name,
    avatar:       profile.avatar || profile.name?.slice(0,2).toUpperCase(),
    email:        user.email,
    role:         profile.role || "user",
    steamVerified:profile.steam_verified,
    createdAt:    profile.created_at?.split("T")[0],
  } : null;

  if (!loaded) return (
    <>
      <GlobalStyle />
      <LoadingScreen onDone={() => {}} />
    </>
  );

  return (
    <>
      <GlobalStyle />
      <div className="scan-wrap"><div className="scan" /></div>
      <VideoBg videoId={user ? TAB_VIDEOS[tab] : TAB_VIDEOS.login} enabled={videoBg} />
      <div className="hero-bg" style={{ backgroundImage:`url(${bg})`, opacity:0.3 }} />
      <div className="hero-ov" />
      <div className="grid-bg" />

      <div className="app">
        {notify && <Notif msg={notify.msg} type={notify.type} onClose={() => setNotify(null)} />}

        {!user && <Login onLogin={handleLogin} />}

        {user && isOwner && (
          <OwnerDashboard
            owner={mergedUser} onLogout={handleLogout}
            setGlobalNotify={setNotify}
            onDataChange={() => setOwnerTick(t => t + 1)}
          />
        )}

        {user && !isOwner && mergedUser && (
          <>
            {showOnboarding && (
              <Onboarding
                onDone={async () => {
                  await sbUpdateProfile(user.id, { has_seen_onboarding: true });
                  setProfile(p => ({ ...p, has_seen_onboarding: true }));
                  setUState(s => ({ ...s, showOnboarding: false }));
                }}
                setActive={setTab}
              />
            )}
            <Nav
              user={mergedUser} active={tab} setActive={setTab}
              theme={theme} toggleTheme={toggleTheme}
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
              videoBg={videoBg} toggleVideoBg={() => setVideoBg(v => !v)}
            />
            <div key={animKey} className={animDir === "left" ? "page-enter-left" : "page-enter-right"}>
              {tab === "dashboard" && (
                <Dashboard sg={sg} eg={eg} sLinked={sLinked} eLinked={eLinked}
                  sProf={sProf} eProf={eProf} wishExtras={wishExtras}
                  setActive={setTab} ownerTick={ownerTick} />
              )}
              {tab === "library" && (
                <Library sg={sg} eg={eg} setSg={set("sg")} setEg={set("eg")}
                  sLinked={sLinked} eLinked={eLinked} setNotify={setNotify} />
              )}
              {tab === "wishlist" && (
                <Wishlist sg={sg} eg={eg} setSg={set("sg")} setEg={set("eg")}
                  extras={wishExtras} setExtras={set("wishExtras")} setNotify={setNotify} />
              )}
              {tab === "accounts" && (
                <Accounts sg={sg} eg={eg} setSg={set("sg")} setEg={set("eg")}
                  sLinked={sLinked} eLinked={eLinked}
                  setSLinked={set("sLinked")} setELinked={set("eLinked")}
                  sProf={sProf} setSProf={set("sProf")}
                  eProf={eProf} setEProf={set("eProf")}
                  setNotify={setNotify} user={mergedUser} />
              )}
              {tab === "market" && (
                <Market sg={sg} eg={eg} sLinked={sLinked} eLinked={eLinked}
                  sProf={sProf} eProf={eProf} setNotify={setNotify} user={mergedUser} />
              )}
              {tab === "trades" && (
                <TradeCenter sg={sg} eg={eg} user={mergedUser} setNotify={setNotify} />
              )}
              {tab === "prices" && (
                <PriceTracker sg={sg} />
              )}
              {tab === "activity" && (
                <ActivityLog user={mergedUser} />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
