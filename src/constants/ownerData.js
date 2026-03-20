// In-memory store — owner edits persist during the session

export const NEWS_DB = [
  { id:"n1", title:"GTA VI Release Date Confirmed for Fall 2025",
    description:"Rockstar Games officially confirmed the release window after months of speculation. The game launches on PS5 and Xbox Series X first.",
    source:"IGN", sourceUrl:"https://ign.com", time:"2h ago", tag:"Release", img:"🎮", imgUrl:"", pinned:false },
  { id:"n2", title:"Steam Spring Sale Starts Next Week — Up to 90% Off",
    description:"Thousands of titles will be discounted starting next Thursday. Valve confirmed the sale runs for 10 days with daily spotlight deals.",
    source:"Steam", sourceUrl:"https://store.steampowered.com", time:"5h ago", tag:"Sale", img:"💸", imgUrl:"", pinned:true },
  { id:"n3", title:"Epic Games Free This Week: Death Stranding & Ghostwire",
    description:"Two major titles are free this week on the Epic Games Store. Claim them before the offer expires on March 14th.",
    source:"Epic", sourceUrl:"https://epicgames.com", time:"1d ago", tag:"Free", img:"🎁", imgUrl:"", pinned:false },
  { id:"n4", title:"Elden Ring DLC Shadow of the Erdtree Sales Hit 5M",
    description:"FromSoftware's expansion has become the fastest-selling DLC in the studio's history, surpassing all internal projections.",
    source:"Kotaku", sourceUrl:"https://kotaku.com", time:"1d ago", tag:"News", img:"⚔️", imgUrl:"", pinned:false },
  { id:"n5", title:"Counter-Strike 2 Major Tournament Prize Pool $1.25M",
    description:"The upcoming PGL Major will feature the largest prize pool in CS2 history, drawing top teams from 32 countries.",
    source:"HLTV", sourceUrl:"https://hltv.org", time:"2d ago", tag:"Esports", img:"🏆", imgUrl:"", pinned:false },
  { id:"n6", title:"Baldur's Gate 3 Gets Surprise New Patch With Content",
    description:"Larian Studios dropped a surprise patch adding new epilogue content, bug fixes, and expanded companion dialogue across all acts.",
    source:"PC Gamer", sourceUrl:"https://pcgamer.com", time:"3d ago", tag:"Update", img:"🧙", imgUrl:"", pinned:false },
];

export const FREE_GAMES_DB = [
  { id:"f1", name:"Death Stranding",  img:"📦", endDate:"Mar 14", originalPrice:29.99, metacritic:82, categories:["Action","Open World","Sci-Fi"],   claimed:false },
  { id:"f2", name:"Ghostwire: Tokyo", img:"👻", endDate:"Mar 14", originalPrice:39.99, metacritic:80, categories:["Action","Horror","Open World"],    claimed:false },
  { id:"f3", name:"Prey",             img:"🔬", endDate:"Mar 21", originalPrice:39.99, metacritic:84, categories:["FPS","Sci-Fi","Action"],            claimed:false },
  { id:"f4", name:"Dishonored 2",     img:"🗡️", endDate:"Mar 21", originalPrice:29.99, metacritic:88, categories:["Stealth","Action","Story-Rich"],   claimed:false },
];

export const REPORTS_DB = [];

export const ANALYTICS = {
  totalUsers: 1, totalListings: 5, totalReports: 0,
  dailyVisits: [
    {l:"Mon",v:42},{l:"Tue",v:67},{l:"Wed",v:55},
    {l:"Thu",v:88},{l:"Fri",v:73},{l:"Sat",v:91},{l:"Sun",v:60},
  ],
  topGames: [
    {name:"Counter-Strike 2",plays:890},{name:"Dota 2",plays:620},
    {name:"Fortnite",plays:340},{name:"Rocket League",plays:210},{name:"Elden Ring",plays:200},
  ],
};

export function addNews(item)    { NEWS_DB.unshift({...item,id:`n${Date.now()}`,time:"Just now",pinned:false}); }
export function deleteNews(id)   { const i=NEWS_DB.findIndex(n=>n.id===id); if(i>-1) NEWS_DB.splice(i,1); }
export function updateNews(item) { const i=NEWS_DB.findIndex(n=>n.id===item.id); if(i>-1) NEWS_DB[i]={...item}; }
export function pinNews(id)      { const n=NEWS_DB.find(n=>n.id===id); if(n) n.pinned=!n.pinned; }

export function addFreeGame(item)    { FREE_GAMES_DB.unshift({...item,id:`f${Date.now()}`,claimed:false}); }
export function deleteFreeGame(id)   { const i=FREE_GAMES_DB.findIndex(g=>g.id===id); if(i>-1) FREE_GAMES_DB.splice(i,1); }
export function updateFreeGame(item) { const i=FREE_GAMES_DB.findIndex(g=>g.id===item.id); if(i>-1) FREE_GAMES_DB[i]={...item}; }

export function addReport(r)      { REPORTS_DB.unshift({...r,id:`r${Date.now()}`,status:"open",createdAt:new Date().toISOString()}); ANALYTICS.totalReports++; }
export function resolveReport(id) { const r=REPORTS_DB.find(r=>r.id===id); if(r) r.status="resolved"; }
export function dismissReport(id) { const r=REPORTS_DB.find(r=>r.id===id); if(r) r.status="dismissed"; }

// ─── Owner session visit log ──────────────────────────────────────────────────
// Each entry: { l: "Mon 10 Mar", v: sessionCount }
// Updated each time owner opens their dashboard
export const VISIT_LOG = [];
let _visitDay = "";
export function recordVisit() {
  const day = new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  if (day === _visitDay) {
    // same day — increment last entry
    if (VISIT_LOG.length > 0) VISIT_LOG[VISIT_LOG.length - 1].v++;
  } else {
    _visitDay = day;
    VISIT_LOG.push({ l: day, v: 1 });
    if (VISIT_LOG.length > 14) VISIT_LOG.shift(); // keep last 14 days
  }
}
