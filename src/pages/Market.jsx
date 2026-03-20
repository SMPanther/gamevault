import React, { useState, useEffect } from "react";
import { PRICE_HISTORY } from "../constants/data";
import { fmt, calcSteam, calcEpic } from "../utils/helpers";
import { Sparkline } from "../components/Charts";
import AccountDetail from "./AccountDetail";
import { logActivity } from "../utils/storage";
import { sbGetListings, sbUpdateListingOffers, subscribeListings } from "../utils/supabase";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase-backed listings — realtime sync across all users
// ─────────────────────────────────────────────────────────────────────────────
function useListingsStore() {
  const [ls, setLs] = useState([]);
  useEffect(() => {
    sbGetListings().then(data => setLs(data || []));
    const channel = subscribeListings(() => {
      sbGetListings().then(data => setLs(data || []));
    });
    return () => channel.unsubscribe();
  }, []);
  return [ls, setLs];
}

// ─────────────────────────────────────────────────────────────────────────────
// Market — two sections: BUY (browse listings) and SELL (your listings + insights)
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
// ─── Offer action buttons (accept / decline / counter) ───────────────────────
function OfferActions({ offer, listingId, askPrice, onAccept, onDecline, onCounter }) {
  const [showCounter, setShowCounter] = React.useState(false);
  const [counterAmt,  setCounterAmt]  = React.useState(String(askPrice));
  return (
    <div style={{marginTop:6}}>
      {!showCounter ? (
        <div style={{display:"flex",gap:6}}>
          <button className="btn g sm" style={{fontSize:8,padding:"3px 8px"}} onClick={onAccept}>✓ ACCEPT</button>
          <button className="btn" style={{fontSize:8,padding:"3px 8px",borderColor:"var(--cyan)",color:"var(--cyan)"}}
            onClick={()=>setShowCounter(true)}>↩ COUNTER</button>
          <button className="btn o sm" style={{fontSize:8,padding:"3px 8px"}} onClick={onDecline}>✕ DECLINE</button>
        </div>
      ) : (
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>$</span>
          <input className="inp" type="number" value={counterAmt}
            onChange={e=>setCounterAmt(e.target.value)}
            style={{fontSize:12,padding:"3px 8px",width:80}}/>
          <button className="btn g sm" style={{fontSize:8,padding:"3px 8px"}}
            onClick={()=>{onCounter(+counterAmt);setShowCounter(false);}}>SEND</button>
          <button className="btn sm" style={{fontSize:8,padding:"3px 8px"}}
            onClick={()=>setShowCounter(false)}>✕</button>
        </div>
      )}
    </div>
  );
}

export default function Market({ sg, eg, sLinked, eLinked, sProf, eProf, setNotify, user }) {
  const [section, setSection]   = useState("buy");      // "buy" | "sell"
  const [listings, setListings] = useListingsStore(); // module-level store — persists across tab switches
  const [detailListing, setDetailListing] = useState(null);

  // Buy section state
  const [filterP, setFilterP] = useState("all");
  const [filterV, setFilterV] = useState("all");
  const [sortM,   setSortM]   = useState("price_asc");

  // Modals — kept at top level so they work from both list view AND detail view
  const [buyModal,     setBuyModal]     = useState(null);
  const [contactModal, setContactModal] = useState(null);

  // Sell section state
  const [sellForm,  setSellForm]  = useState({ askPrice:"", note:"", discord:"" });
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // listing id to confirm delete

  const sv = sLinked ? calcSteam(sg, sProf.level, sProf.badges) : 0;
  const ev = eLinked ? calcEpic(eg) : 0;

  // User's own listings
  const myListings = listings.filter(l => l.owner_id === user?.id);

  // All listings for buy section (exclude own)
  const buyVisible = listings
    .filter(l => l.owner_id !== user?.id)
    .filter(l => {
      const pOk = filterP==="all" || ((filterP==="steam"&&l.steam) || (filterP==="epic"&&l.epic));
      const vOk = filterV!=="verified" || l.verified;
      return pOk && vOk;
    })
    .sort((a,b) => {
      if (sortM==="price_asc")  return a.ask_price - b.ask_price;
      if (sortM==="price_desc") return b.ask_price - a.ask_price;
      if (sortM==="value")      return (b.steam_val+b.epic_val)-(a.steam_val+a.epic_val);
      if (sortM==="rating")     return b.rating - a.rating;
      return 0;
    });

  // Handle offer from either list or detail view
  const handleOffer = async (listing, amount, buyerEmail) => {
    const offer = {
      id:         Date.now(),
      amount,
      by:         user?.name || "Anonymous",
      buyerId:    user?.username,
      buyerEmail: buyerEmail || user?.email || "—",
      time:       new Date().toLocaleTimeString(),
      date:       new Date().toLocaleDateString(),
      status:     "pending",  // pending | accepted | countered | declined
      counter:    null,       // counter-offer amount from seller
    };
    const updatedOffers = [...(listing.offers||[]), offer];
    await sbUpdateListingOffers(listing.id, updatedOffers);
    sbGetListings().then(data => setListings(data || []));
    logActivity(user?.username, "offer_sent", `Sent ${fmt(amount)} offer to ${listing.seller}`);
    setNotify({ msg:`Offer of ${fmt(amount)} sent! Seller will see your email.`, type:"success" });
  };

  // Seller counter-offers on a received offer
  // eslint-disable-next-line no-unused-vars
  const handleCounter = async (listingId, offerId, counterAmt) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    const updatedOffers = (listing.offers||[]).map(o =>
      o.id === offerId ? { ...o, status:"countered", counter: counterAmt } : o
    );
    await sbUpdateListingOffers(listingId, updatedOffers);
    sbGetListings().then(data => setListings(data || []));
    setNotify({ msg:`Counter-offer of ${fmt(counterAmt)} sent!`, type:"success" });
  };

  // eslint-disable-next-line no-unused-vars
  const handleOfferAction = async (listingId, offerId, action) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;
    const updatedOffers = (listing.offers||[]).map(o =>
      o.id === offerId ? { ...o, status: action } : o
    );
    await sbUpdateListingOffers(listingId, updatedOffers);
    sbGetListings().then(data => setListings(data || []));
    setNotify({ msg: action === "accepted" ? "Offer accepted!" : "Offer declined", type:"success" });
  };

  // Post or update a listing
  const doList = async () => {
    if (!sLinked&&!eLinked){ setNotify({msg:"Link at least one account first",type:"error"}); return; }
    if (!sellForm.askPrice){ setNotify({msg:"Enter asking price",type:"error"}); return; }
    // Email comes from registration — no need to ask again
    const email = user?.email || "—";

    if (editingId) {
      setListings(p => p.map(l => l.id===editingId
        ? {...l, askPrice:+sellForm.askPrice, note:sellForm.note, discord:sellForm.discord||"—"}
        : l
      ));
      setEditingId(null);
      setNotify({msg:"Listing updated!",type:"success"});
    logActivity(user?.username, 'listing_updated', `Updated listing`);
    } else {
      const id = `m${Date.now()}`;
      setListings(p => [{
        id, ownerId:user?.username, seller:user?.name||"You",
        email,                              // ← from registration, no re-ask
        discord:  sellForm.discord||"—",
        steam:sLinked, epic:eLinked, steamVal:sv, epicVal:ev,
        askPrice:+sellForm.askPrice, level:sProf.level, badges:sProf.badges,
        games:sg.length+eg.length, rating:5.0, reviews:0,
        verified: user?.steamVerified || false,
        note:sellForm.note, isOwn:true, offers:[],
        contacts:[],    // buyers who clicked "contact"
      },...p]);
      PRICE_HISTORY[id]=[{m:"Now",v:+sellForm.askPrice}];
      setNotify({msg:"Listing posted! Your registration email will be shown to buyers.",type:"success"});
    }
    setSellForm({askPrice:"",note:"",discord:""});
  };

  const deleteListing = (id) => {
    setListings(p => p.filter(l => l.id !== id));
    setNotify({msg:"Listing removed",type:"success"});
  };

  const startEdit = (l) => {
    setEditingId(l.id);
    setSellForm({askPrice:String(l.ask_price||l.askPrice||0), note:l.note||"", discord:l.discord||""});
    setSection("sell");
  };

  // Contact: record buyer info on the listing so seller sees it
  const handleContact = (listing) => {
    // Record contact on listing for seller insights
    setListings(p => p.map(l => {
      if (l.id !== listing.id) return l;
      const already = (l.contacts||[]).some(c => c.buyerId === user?.username);
      if (already) return l;
      return {
        ...l,
        contacts: [...(l.contacts||[]), {
          buyerId:    user?.username,
          buyerName:  user?.name,
          buyerEmail: user?.email || "—",
          time:       new Date().toLocaleTimeString(),
          date:       new Date().toLocaleDateString(),
        }]
      };
    }));
    // Show contact modal with seller details
    setContactModal(listing);
  };
  // ── If viewing detail page ──────────────────────────────────────────────────
  if (detailListing) {
    // Keep modals rendered even inside detail view — they mount at this level
    return (
      <>
        <AccountDetail
          listing={detailListing}
          onBack={() => setDetailListing(null)}
          onOffer={handleOffer}
          onBuy={(l) => setBuyModal(l)}
          onContact={handleContact}
          setNotify={setNotify}
          currentUser={user}
        />
        {/* Modals rendered here so they work inside detail view */}
        {buyModal   && <BuyModal l={buyModal} onClose={()=>setBuyModal(null)} setNotify={setNotify} onOffer={handleOffer} currentUser={user} />}
        {contactModal && <ContactModalComp l={contactModal} onClose={()=>setContactModal(null)} currentUser={user} />}
      </>
    );
  }

  // ── Main view ───────────────────────────────────────────────────────────────
  return (
    <div className="fadeup" style={{padding:"28px 20px",maxWidth:1100,margin:"0 auto"}}>

      {/* Section toggle */}
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:20,borderBottom:"1px solid var(--border)"}}>
        {[["buy","🛒 BUY ACCOUNT"],["sell","💼 SELLER PAGE"]].map(([s,lbl])=>(
          <button key={s} className={`ntab${section===s?" act":""}`}
            style={{fontSize:11,padding:"0 24px",height:44}} onClick={()=>setSection(s)}>
            {lbl}
            {s==="sell" && myListings.length>0 &&
              <span style={{marginLeft:6,background:"var(--orange)",color:"#000",
                borderRadius:"50%",width:16,height:16,display:"inline-flex",
                alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>
                {myListings.length}
              </span>}
          </button>
        ))}
      </div>

      {/* ══════════════════ BUY SECTION ══════════════════ */}
      {section==="buy" && (
        <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
            <div>
              <div className="orb" style={{fontSize:18,fontWeight:700,color:"var(--cyan)"}}>BUY AN ACCOUNT</div>
              <div className="mono" style={{color:"var(--muted)",fontSize:10,letterSpacing:2}}>
                {buyVisible.length} LISTINGS · CLICK ANY CARD FOR FULL DETAILS
              </div>
            </div>
          </div>

          <div style={{background:"rgba(255,102,0,0.05)",border:"1px solid rgba(255,102,0,0.2)",
            padding:"9px 14px",marginBottom:14,fontSize:11,display:"flex",gap:8}}>
            <span style={{color:"var(--orange)",flexShrink:0}}>⚠</span>
            <span style={{color:"var(--muted)"}}>Account trading may violate ToS. Always use escrow. Verify before payment.</span>
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            {["all","steam","epic"].map(f=>(
              <button key={f} className="btn sm"
                style={{borderColor:filterP===f?"var(--cyan)":"var(--border)",color:filterP===f?"var(--cyan)":"var(--muted)"}}
                onClick={()=>setFilterP(f)}>
                {f==="all"?"ALL":f==="steam"?"⊞ STEAM":"◈ EPIC"}
              </button>
            ))}
            <button className="btn sm"
              style={{borderColor:filterV==="verified"?"var(--green)":"var(--border)",color:filterV==="verified"?"var(--green)":"var(--muted)"}}
              onClick={()=>setFilterV(filterV==="verified"?"all":"verified")}>
              {filterV==="verified"?"✓ VERIFIED":"ALL SELLERS"}
            </button>
            <select className="inp" style={{width:"auto",fontSize:11,background:"#060d1b"}}
              value={sortM} onChange={e=>setSortM(e.target.value)}>
              <option value="price_asc">Price: Low→High</option>
              <option value="price_desc">Price: High→Low</option>
              <option value="value">Highest Value</option>
              <option value="rating">Best Rating</option>
            </select>
          </div>

          {/* Listing cards */}
          {buyVisible.length === 0 ? (
            <div style={{textAlign:"center",padding:"60px 20px",color:"var(--muted)",
              border:"1px solid var(--border)"}}>
              <div style={{fontSize:48,marginBottom:12}}>🛒</div>
              <div className="orb" style={{fontSize:15,color:"var(--cyan)",marginBottom:8}}>
                NO LISTINGS YET
              </div>
              <div style={{fontSize:13,lineHeight:1.7}}>
                No accounts are listed for sale right now.<br/>
                Be the first — go to the <span style={{color:"var(--orange)"}}>Seller Page</span> tab to list yours.
              </div>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {buyVisible.map(l => <ListingCard key={l.id} l={l} onClick={()=>setDetailListing(l)}
                onBuy={e=>{e.stopPropagation();setBuyModal(l);}} />)}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ SELL SECTION ══════════════════ */}
      {section==="sell" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}} className="g2">

          {/* Left — post/edit listing */}
          <div>
            <div className="orb" style={{fontSize:14,color:"var(--orange)",marginBottom:14,fontWeight:700}}>
              {editingId ? "✏ EDIT LISTING" : "+ LIST YOUR ACCOUNT"}
            </div>

            {!(sLinked||eLinked) ? (
              <div style={{background:"rgba(255,102,0,0.06)",border:"1px solid rgba(255,102,0,0.25)",
                padding:16,fontSize:13,color:"var(--muted)",lineHeight:1.7}}>
                You need to link at least one account (Steam or Epic) before listing.
                Go to the <strong style={{color:"var(--cyan)"}}>Accounts</strong> tab first.
              </div>
            ) : (
              <div className="card" style={{padding:18}}>
                {/* Value preview */}
                <div style={{background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)",
                  padding:10,marginBottom:14}}>
                  <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:6}}>
                    YOUR ACCOUNT VALUES
                  </div>
                  <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                    {sLinked&&<div><span style={{color:"#1a9fff",fontWeight:700}}>{fmt(sv)}</span>
                      <span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>STEAM</span></div>}
                    {eLinked&&<div><span style={{color:"var(--green)",fontWeight:700}}>{fmt(ev)}</span>
                      <span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>EPIC</span></div>}
                    <div><span style={{color:"var(--cyan)",fontWeight:700}}>{fmt(sv+ev)}</span>
                      <span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:4}}>TOTAL</span></div>
                  </div>
                </div>

                {/* Email note — auto from registration */}
                <div style={{background:"rgba(57,255,20,0.05)",border:"1px solid rgba(57,255,20,0.2)",
                  padding:"8px 12px",marginBottom:14,fontSize:11}}>
                  <span style={{color:"var(--green)"}}>✉ Contact email: </span>
                  <span style={{color:"var(--cyan)"}}>{user?.email||"—"}</span>
                  <span style={{color:"var(--muted)",display:"block",marginTop:2,fontSize:10}}>
                    This is your registration email. Buyers will see it after making an offer or contacting you.
                  </span>
                </div>

                <div style={{display:"grid",gap:12}}>
                  {[["ASKING PRICE ($) *","number","askPrice","e.g. 150"],
                    ["DISCORD (OPTIONAL)","text","discord","username#0000"],
                    ["LISTING NOTE","text","note","e.g. Selling due to upgrade"]].map(([lbl,type,key,ph])=>(
                    <div key={key}>
                      <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:5}}>{lbl}</div>
                      <input className="inp" type={type} placeholder={ph} value={sellForm[key]}
                        onChange={e=>setSellForm(p=>({...p,[key]:e.target.value}))} />
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <button className="btn o" style={{flex:1}} onClick={doList}>
                    {editingId?"⟶ SAVE CHANGES":"⟶ POST LISTING"}
                  </button>
                  {editingId && (
                    <button className="btn" onClick={()=>{setEditingId(null);setSellForm({askPrice:"",note:"",discord:""});}}>
                      CANCEL
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right — your listings + insights */}
          <div>
            <div className="orb" style={{fontSize:14,color:"var(--cyan)",marginBottom:14,fontWeight:700}}>
              📊 YOUR LISTINGS & INSIGHTS
            </div>

            {myListings.length === 0 ? (
              <div style={{textAlign:"center",padding:40,color:"var(--muted)",border:"1px solid var(--border)"}}>
                <div style={{fontSize:32,marginBottom:8}}>📋</div>
                <div className="mono" style={{fontSize:11}}>NO ACTIVE LISTINGS</div>
                <div style={{fontSize:12,marginTop:6}}>Post a listing on the left to start selling.</div>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {myListings.map(l => {
                  const offerCount   = (l.offers||[]).length;
                  const contactCount = (l.contacts||[]).length;
                  return (
                    <div key={l.id} className="card" style={{padding:16,borderColor:"rgba(255,102,0,0.25)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div className="orb" style={{fontSize:16,color:"var(--cyan)"}}>{fmt(l.ask_price||l.ask_price||l.askPrice||0||0)}</div>
                          <div style={{display:"flex",gap:4,marginTop:4}}>
                            {l.steam&&<span className="tag s">STEAM</span>}
                            {l.epic&&<span className="tag e">EPIC</span>}
                            {l.verified&&<span className="tag" style={{color:"var(--green)",borderColor:"var(--green)"}}>✓ VFD</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn sm" onClick={()=>startEdit(l)}>EDIT</button>
                          <button className="btn o sm" onClick={()=>setConfirmDelete(l.id)}>DELETE</button>
                        </div>
                      </div>

                      {/* Insight counters */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        {[
                          ["💬","OFFERS",    offerCount,   "var(--purple)"],
                          ["👁","CONTACTS",  contactCount, "var(--cyan)"],
                        ].map(([ic,lbl,v,col])=>(
                          <div key={lbl} style={{background:`${col}10`,border:`1px solid ${col}30`,padding:"7px 10px"}}>
                            <div style={{fontSize:16}}>{ic}</div>
                            <div className="orb" style={{color:col,fontSize:18}}>{v}</div>
                            <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2}}>{lbl}</div>
                          </div>
                        ))}
                      </div>

                      {/* Offers list with buyer emails */}
                      {offerCount > 0 && (
                        <div style={{marginBottom:10}}>
                          <div className="mono" style={{fontSize:9,color:"var(--purple)",letterSpacing:2,marginBottom:6}}>
                            OFFERS RECEIVED
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {(l.offers||[]).map((o,i)=>(
                              <div key={i} style={{padding:"6px 10px",background:"rgba(191,0,255,0.06)",
                                border:"1px solid rgba(191,0,255,0.18)",fontSize:12}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                                  <span style={{color:"var(--purple)",fontWeight:700}}>{fmt(o.amount)}</span>
                                  <span className="mono" style={{fontSize:9,color:"var(--muted)"}}>{o.date} {o.time}</span>
                                </div>
                                <div style={{color:"var(--cyan)",fontSize:11}}>
                                  {o.buyerName} · <span style={{color:"var(--muted)"}}>{o.buyerEmail}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contacts list */}
                      {contactCount > 0 && (
                        <div>
                          <div className="mono" style={{fontSize:9,color:"var(--cyan)",letterSpacing:2,marginBottom:6}}>
                            BUYERS WHO CONTACTED YOU
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:4}}>
                            {(l.contacts||[]).map((c,i)=>(
                              <div key={i} style={{padding:"6px 10px",background:"rgba(0,245,255,0.05)",
                                border:"1px solid rgba(0,245,255,0.15)",fontSize:12}}>
                                <span style={{color:"var(--cyan)"}}>{c.buyerName}</span>
                                <span style={{color:"var(--muted)",marginLeft:8}}>{c.buyerEmail}</span>
                                <span className="mono" style={{fontSize:9,color:"var(--muted)",marginLeft:8}}>
                                  {c.date}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals rendered at this level — always visible regardless of section */}
      {buyModal     && <BuyModal l={buyModal} onClose={()=>setBuyModal(null)} setNotify={setNotify} onOffer={handleOffer} currentUser={user} />}
      {contactModal && <ContactModalComp l={contactModal} onClose={()=>setContactModal(null)} currentUser={user} />}
      {confirmDelete && (
        <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&setConfirmDelete(null)}>
          <div className="modal" style={{maxWidth:360,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>🗑️</div>
            <div className="orb" style={{color:"var(--orange)",fontSize:13,letterSpacing:2,marginBottom:10}}>DELETE LISTING?</div>
            <div style={{color:"var(--muted)",fontSize:13,marginBottom:20}}>
              This will permanently remove your listing. Any offers received will be lost.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button className="btn o" style={{flex:1}} onClick={()=>{deleteListing(confirmDelete);setConfirmDelete(null);}}>
                ⟶ YES, DELETE
              </button>
              <button className="btn" onClick={()=>setConfirmDelete(null)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Extracted card component ─────────────────────────────────────────────────
function ListingCard({ l, onClick, onBuy }) {
  const totalVal = (l.steamVal||0)+(l.epicVal||0);
  const deal     = totalVal>0 ? Math.round((1-l.ask_price||l.askPrice||0/totalVal)*100) : 0;
  return (
    <div className="card card-h" onClick={onClick} style={{
      padding:16, cursor:"pointer",
      borderColor: l.verified?"rgba(57,255,20,0.22)":"var(--border)",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
            <div style={{fontWeight:700,fontSize:15}}>{l.seller}</div>
            {l.verified&&<span style={{background:"rgba(57,255,20,0.1)",border:"1px solid rgba(57,255,20,0.3)",
              color:"var(--green)",fontSize:8,fontFamily:"Share Tech Mono",padding:"1px 5px"}}>✓ VFD</span>}
          </div>
          <div style={{display:"flex",gap:4,marginBottom:5}}>
            {l.steam&&<span className="tag s">STEAM</span>}
            {l.epic&&<span className="tag e">EPIC</span>}
          </div>
          <span style={{color:"var(--orange)",fontSize:12}}>
            {"★".repeat(Math.round(l.rating))}{"☆".repeat(5-Math.round(l.rating))}
          </span>
        </div>
        <div style={{textAlign:"right"}}>
          <div className="orb" style={{fontSize:20,color:"var(--cyan)",textShadow:"0 0 10px var(--cyan)"}}>{fmt(l.ask_price||l.ask_price||l.askPrice||0||0)}</div>
          {deal>0&&<div style={{color:"var(--green)",fontSize:10,fontFamily:"Share Tech Mono",marginTop:2}}>↓{deal}% off</div>}
          {PRICE_HISTORY[l.id]&&PRICE_HISTORY[l.id].length>1&&(
            <div style={{marginTop:4}}><Sparkline data={PRICE_HISTORY[l.id]} width={72} height={22}/></div>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        {[["🎮",`${l.games}g`],l.steam&&["⭐",`Lv${l.level}`],l.steam&&["🏅",`${l.badges}b`]].filter(Boolean).map(([ic,v],i)=>(
          <span key={i} className="mono" style={{fontSize:9,color:"var(--muted)"}}>{ic} {v}</span>
        ))}
      </div>
      {l.note&&<div style={{fontSize:11,color:"var(--muted)",marginBottom:8,overflow:"hidden",
        textOverflow:"ellipsis",whiteSpace:"nowrap",borderLeft:"2px solid rgba(0,245,255,0.2)",
        paddingLeft:8,fontStyle:"italic"}}>{l.note}</div>}
      {(l.offers?.length>0)&&<div style={{background:"rgba(191,0,255,0.06)",border:"1px solid rgba(191,0,255,0.2)",
        padding:"4px 9px",fontSize:11,color:"var(--purple)",marginBottom:8}}>
        💬 {l.offers.length} offer{l.offers.length>1?"s":""}
      </div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:4}}>
        <span className="mono" style={{fontSize:9,color:"var(--cyan)"}}>CLICK FOR FULL DETAILS →</span>
        <button className="btn g sm" onClick={onBuy}>BUY</button>
      </div>
    </div>
  );
}

// ─── Buy modal ────────────────────────────────────────────────────────────────
function BuyModal({ l, onClose, setNotify, onOffer, currentUser }) {
  return <BuyModalInner l={l} onClose={onClose} setNotify={setNotify} onOffer={onOffer} currentUser={currentUser} />;
}
function BuyModalInner({ l, onClose, setNotify, onOffer, currentUser }) {
  const [offerAmt, setOfferAmt] = React.useState(String(l.ask_price||l.askPrice||0));
  const [sent,     setSent]     = React.useState(false);

  const send = () => {
    const amount = parseFloat(offerAmt);
    if (!amount || amount <= 0) { setNotify({msg:"Enter a valid offer amount",type:"error"}); return; }
    onOffer && onOffer(l, amount, currentUser?.email);
    setSent(true);
    setTimeout(onClose, 1800);
  };

  if (sent) return (
    <div className="modal-bg">
      <div className="modal" style={{textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>✅</div>
        <div className="orb" style={{color:"var(--green)",fontSize:13,letterSpacing:2,marginBottom:8}}>OFFER SENT!</div>
        <div style={{color:"var(--muted)",fontSize:13}}>
          Your offer of <span style={{color:"var(--cyan)",fontWeight:700}}>{fmt(parseFloat(offerAmt))}</span> was sent to {l.seller}.
          <br/>They will contact you at <span style={{color:"var(--cyan)"}}>{currentUser?.email}</span>.
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="orb" style={{color:"var(--green)",fontSize:12,letterSpacing:3,marginBottom:18}}>
          💬 MAKE AN OFFER
        </div>
        <div style={{marginBottom:14,fontSize:13,lineHeight:1.7,color:"var(--muted)"}}>
          Offering on <span style={{color:"var(--cyan)"}}>{l.seller}</span>'s account.
          Listed at <span style={{color:"var(--green)",fontWeight:700}}>{fmt(l.ask_price||l.ask_price||l.askPrice||0||0)}</span>.
        </div>

        {/* Offer amount input */}
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:6}}>YOUR OFFER ($)</div>
          <input className="inp" type="number" min="1" placeholder={l.ask_price||l.askPrice||0}
            value={offerAmt} onChange={e=>setOfferAmt(e.target.value)}
            style={{fontSize:20,textAlign:"center",color:"var(--cyan)"}} />
          {parseFloat(offerAmt) < l.ask_price||l.askPrice||0 * 0.7 && parseFloat(offerAmt) > 0 && (
            <div className="mono" style={{fontSize:9,color:"var(--orange)",marginTop:4}}>
              ⚠ Offer is more than 30% below asking — seller may decline
            </div>
          )}
        </div>

        {/* Seller contact revealed */}
        <div style={{background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)",padding:12,marginBottom:12}}>
          <div className="mono" style={{fontSize:8,color:"var(--muted)",marginBottom:6,letterSpacing:2}}>
            SELLER CONTACT (visible after offer)
          </div>
          <div style={{color:"var(--cyan)",marginBottom:3}}>✉ {l.email}</div>
          {l.discord&&l.discord!=="—"&&<div style={{color:"var(--purple)"}}>💬 {l.discord}</div>}
        </div>

        {/* Buyer info shared */}
        {currentUser && (
          <div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.2)",
            padding:"8px 12px",marginBottom:12,fontSize:11}}>
            <span style={{color:"var(--green)"}}>ℹ Your info shared with seller: </span>
            <span style={{color:"var(--cyan)"}}>{currentUser.name} · {currentUser.email}</span>
          </div>
        )}

        <div style={{background:"rgba(255,102,0,0.05)",border:"1px solid rgba(255,102,0,0.2)",
          padding:"9px 12px",marginBottom:14,fontSize:11}}>
          <span style={{color:"var(--orange)"}}>⚠ SAFETY: </span>
          <span style={{color:"var(--muted)"}}>Never pay via gift cards. Use PayPal G&S or escrow. Verify account before payment.</span>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn g" style={{flex:1}} onClick={send}>⟶ SEND OFFER</button>
          <button className="btn o" onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ─── Contact modal ────────────────────────────────────────────────────────────
// FIX: This is now a standalone component rendered at Market root level,
// not inside AccountDetail — this was causing the popup to never show.
function ContactModalComp({ l, onClose, currentUser }) {
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="orb" style={{color:"var(--cyan)",fontSize:12,letterSpacing:3,marginBottom:18}}>
          ✉ CONTACT SELLER
        </div>
        <div style={{marginBottom:14}}>
          <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:3}}>SELLER</div>
          <div style={{fontSize:15,fontWeight:700}}>
            {l.seller}
            {l.verified&&<span className="mono" style={{fontSize:10,color:"var(--green)",marginLeft:8}}>✓ VERIFIED</span>}
          </div>
        </div>
        <div style={{display:"grid",gap:10,marginBottom:14}}>
          <div style={{padding:12,background:"rgba(0,245,255,0.04)",border:"1px solid var(--border)"}}>
            <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:3}}>EMAIL</div>
            <div style={{color:"var(--cyan)",fontSize:14}}>✉ {l.email}</div>
          </div>
          {l.discord&&l.discord!=="—"&&(
            <div style={{padding:12,background:"rgba(191,0,255,0.04)",border:"1px solid rgba(191,0,255,0.2)"}}>
              <div className="mono" style={{fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:3}}>DISCORD</div>
              <div style={{color:"var(--purple)",fontSize:14}}>💬 {l.discord}</div>
            </div>
          )}
        </div>
        {currentUser && (
          <div style={{background:"rgba(57,255,20,0.04)",border:"1px solid rgba(57,255,20,0.2)",
            padding:"8px 12px",marginBottom:14,fontSize:11}}>
            <span style={{color:"var(--green)"}}>ℹ Your contact info shared with seller: </span>
            <span style={{color:"var(--cyan)"}}>{currentUser.name} · {currentUser.email}</span>
          </div>
        )}
        <button className="btn full" onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
