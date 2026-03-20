import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ALL_GENRES } from "../constants/data";

export default function GenrePicker({ selected = [], onChange, color = "var(--cyan)" }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top:0, left:0, width:0 });
  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  // Recalculate dropdown position whenever it opens
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const dropH = Math.min(260, window.innerHeight * 0.45);
    setPos({
      top:   spaceBelow > dropH ? r.bottom + 4 : r.top - dropH - 4,
      left:  Math.max(8, Math.min(r.left, window.innerWidth - 340)),
      width: Math.max(r.width, 320),
    });
  }, [open]);

  // Close on outside click — must check both trigger AND portal panel
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      const outsideTrigger = !btnRef.current?.contains(e.target);
      const outsidePanel   = !panelRef.current?.contains(e.target);
      if (outsideTrigger && outsidePanel) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = (g) => {
    if (selected.includes(g)) onChange(selected.filter(x => x !== g));
    else onChange([...selected, g]);
  };

  const clear = (e) => { e.stopPropagation(); onChange([]); };

  return (
    <div style={{ position:"relative" }}>
      {/* Trigger */}
      <button ref={btnRef} type="button" onClick={() => setOpen(o => !o)} style={{
        width:"100%", padding:"9px 12px", textAlign:"left",
        background:"rgba(0,0,0,0.35)", border:`1px solid ${open ? color : "var(--border)"}`,
        color:"var(--txt)", fontFamily:"Rajdhani", fontSize:13, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        transition:"border-color 0.2s",
      }}>
        <span style={{ flex:1, overflow:"hidden" }}>
          {selected.length === 0
            ? <span style={{ color:"var(--muted)" }}>Click to select genres…</span>
            : <span style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
                {selected.slice(0,5).map(g => (
                  <span key={g} style={{
                    background:`${color}18`, border:`1px solid ${color}44`,
                    color, fontSize:9, fontFamily:"Share Tech Mono", padding:"1px 6px",
                  }}>{g}</span>
                ))}
                {selected.length > 5 && (
                  <span style={{ color:"var(--muted)", fontSize:9, fontFamily:"Share Tech Mono" }}>
                    +{selected.length - 5} more
                  </span>
                )}
              </span>
          }
        </span>
        <span style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {selected.length > 0 && (
            <span onClick={clear} style={{ fontSize:10, color:"var(--orange)",
              fontFamily:"Share Tech Mono", cursor:"pointer", padding:"0 4px" }}>✕ CLEAR</span>
          )}
          <span style={{ color, fontSize:11 }}>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {/* Portal dropdown — renders at document.body so never gets clipped */}
      {open && createPortal(
        <div ref={panelRef} style={{
          position:"fixed", top:pos.top, left:pos.left, width:pos.width,
          zIndex:9999,
          background:"rgba(6,13,27,0.98)", border:`1px solid ${color}55`,
          boxShadow:`0 12px 40px rgba(0,0,0,0.75), 0 0 20px ${color}18`,
          backdropFilter:"blur(16px)",
          maxHeight:260, overflowY:"auto", padding:12,
          animation:"popIn 0.18s ease",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span className="mono" style={{ fontSize:8, color:"var(--muted)", letterSpacing:2 }}>
              {selected.length} SELECTED
            </span>
            <button type="button" onClick={() => setOpen(false)}
              style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:13 }}>✕</button>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {ALL_GENRES.map(g => {
              const on = selected.includes(g);
              return (
                <button key={g} type="button" onClick={() => toggle(g)} style={{
                  fontFamily:"Share Tech Mono", fontSize:9, padding:"3px 9px",
                  cursor:"pointer", transition:"all 0.15s",
                  background: on ? `${color}22` : "rgba(255,255,255,0.03)",
                  border:`1px solid ${on ? color : "rgba(255,255,255,0.1)"}`,
                  color: on ? color : "var(--muted)",
                  fontWeight: on ? 700 : 400,
                }}>
                  {on ? "✓ " : ""}{g}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
