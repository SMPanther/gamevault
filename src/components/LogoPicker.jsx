import { useState, useRef } from "react";
import { searchGameLogos } from "../utils/logoSearch";

// ─────────────────────────────────────────────────────────────────────────────
// LogoPicker
// When a game name is entered (and has 3+ chars), shows a "🔍 Search Logo"
// button. Clicking it fetches 2–3 options from RAWG/Steam. User picks one.
// The selected image URL is stored as imgUrl on the game object.
//
// Props:
//   gameName:  string — used as search query
//   imgUrl:    string | null — currently selected image URL
//   onSelect:  (url: string | null) => void
// ─────────────────────────────────────────────────────────────────────────────
export default function LogoPicker({ gameName, imgUrl, onSelect }) {
  const [results,   setResults]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [error,     setError]     = useState("");
  const lastQuery = useRef("");

  const doSearch = async () => {
    if (!gameName || gameName.trim().length < 2) return;
    if (gameName.trim() === lastQuery.current && results.length > 0) return; // don't re-search same query
    lastQuery.current = gameName.trim();
    setLoading(true); setError(""); setResults([]);
    try {
      const found = await searchGameLogos(gameName, 3);
      setResults(found);
      if (found.length === 0) setError("No images found — try a different game name");
    } catch {
      setError("Search failed — check your internet connection");
    }
    setLoading(false);
    setSearched(true);
  };

  const canSearch = gameName && gameName.trim().length >= 2;

  return (
    <div>
      {/* Current selection preview */}
      {imgUrl && (
        <div style={{ position:"relative", marginBottom:8, display:"inline-block" }}>
          <img src={imgUrl} alt="game logo"
            onError={e => e.target.style.opacity="0.3"}
            style={{ width:200, height:80, objectFit:"cover",
              border:"1px solid rgba(0,245,255,0.35)", display:"block" }} />
          <button
            type="button"
            onClick={() => { onSelect(null); setResults([]); setSearched(false); }}
            style={{ position:"absolute", top:4, right:4, background:"rgba(255,68,68,0.8)",
              border:"none", color:"#fff", fontSize:10, cursor:"pointer", padding:"2px 7px" }}>
            ✕ REMOVE
          </button>
        </div>
      )}

      {/* Search button */}
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
        <button
          type="button"
          onClick={doSearch}
          disabled={!canSearch || loading}
          style={{
            fontFamily:"Share Tech Mono", fontSize:9, letterSpacing:1,
            padding:"6px 14px", cursor: canSearch&&!loading ? "pointer" : "not-allowed",
            background:"rgba(0,245,255,0.06)", border:"1px solid rgba(0,245,255,0.3)",
            color: canSearch ? "var(--cyan)" : "var(--muted)",
            display:"flex", alignItems:"center", gap:6,
          }}
        >
          {loading
            ? <><span style={{ display:"inline-block", width:10, height:10, border:"1px solid var(--cyan)",
                borderTopColor:"transparent", borderRadius:"50%",
                animation:"spin 0.8s linear infinite" }} /> SEARCHING...</>
            : "🔍 SEARCH GAME LOGO"}
        </button>
        {!canSearch && (
          <span className="mono" style={{ fontSize:9, color:"var(--muted)" }}>
            (enter game name first)
          </span>
        )}
        {searched && results.length > 0 && (
          <span className="mono" style={{ fontSize:9, color:"var(--green)" }}>
            ✓ {results.length} found
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mono" style={{ fontSize:9, color:"var(--orange)", marginBottom:8 }}>
          ⚠ {error}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>
            SELECT A LOGO
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => { onSelect(r.url); setResults([]); }}
                style={{
                  cursor:"pointer", position:"relative",
                  border:`2px solid ${imgUrl===r.url ? "var(--cyan)" : "rgba(255,255,255,0.1)"}`,
                  transition:"border-color 0.2s",
                }}
              >
                <img
                  src={r.url} alt={r.name}
                  onError={e => { e.target.parentElement.style.display="none"; }}
                  style={{ width:140, height:56, objectFit:"cover", display:"block" }}
                />
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background:"rgba(0,0,0,0.7)", padding:"2px 5px",
                  fontSize:9, fontFamily:"Share Tech Mono", color:"var(--muted)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>
                  {r.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
