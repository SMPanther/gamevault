// ─── Background Images ────────────────────────────────────────────────────────
export const BG = {
  login:     "https://images.alphacoders.com/133/1339779.jpg",
  dashboard: "https://images.alphacoders.com/134/1342150.jpg",
  library:   "https://images.alphacoders.com/133/1337230.jpg",
  market:    "https://images.alphacoders.com/132/1328660.jpg",
  wishlist:  "https://images.alphacoders.com/131/1318838.jpg",
  accounts:  "https://images.alphacoders.com/130/1306600.jpg",
  trades:    "https://images.alphacoders.com/132/1328660.jpg",
};

// ─── All game genres / categories ─────────────────────────────────────────────
// Used in the genre picker panel — user can select multiple
export const ALL_GENRES = [
  "Action","Adventure","RPG","FPS","TPS","Shooter","Strategy","Simulation",
  "Sports","Racing","Puzzle","Horror","Survival","Open World","Sandbox",
  "Platformer","Fighting","Battle Royale","MOBA","Roguelike","Soulslike",
  "Stealth","Thriller","Sci-Fi","Fantasy","Dark Fantasy","Mythology","Comedy",
  "Story-Rich","Co-op","Multiplayer","Competitive","Free-to-Play","Indie",
  "Dungeon Crawler","Looter Shooter","Turn-Based","Tower Defense","Crafting",
  "Exploration","VR","Zombie","Crime","Anime","Card Game","Moddable","Vehicles",
];

// ─── Auto-detect categories from game name (used when API imports) ─────────────
export const GAME_CATEGORY_DB = {
  "cyberpunk":      ["RPG","Open World","Action","Sci-Fi"],
  "counter-strike": ["FPS","Competitive","Multiplayer","Shooter"],
  "elden ring":     ["RPG","Soulslike","Action","Fantasy"],
  "baldur":         ["RPG","Turn-Based","Fantasy","Co-op"],
  "hogwarts":       ["Action","Adventure","Fantasy","Open World"],
  "dota":           ["MOBA","Strategy","Multiplayer","Competitive"],
  "fortnite":       ["Battle Royale","Shooter","Multiplayer","Free-to-Play"],
  "gta":            ["Action","Open World","Crime","Multiplayer"],
  "alan wake":      ["Thriller","Action","Horror","Story-Rich"],
  "rocket league":  ["Sports","Competitive","Multiplayer","Vehicles"],
  "half-life":      ["FPS","Sci-Fi","Action","VR"],
  "portal":         ["Puzzle","Sci-Fi","Co-op"],
  "team fortress":  ["FPS","Multiplayer","Free-to-Play","Shooter"],
  "garry":          ["Sandbox","Multiplayer","Simulation","Moddable"],
  "witcher":        ["RPG","Open World","Fantasy","Story-Rich"],
  "hades":          ["Roguelike","Action","Dungeon Crawler","Indie"],
  "starfield":      ["RPG","Sci-Fi","Open World","Exploration"],
  "helldivers":     ["Co-op","Shooter","Action","Multiplayer"],
  "black myth":     ["Action","RPG","Soulslike","Mythology"],
  "palworld":       ["Survival","Crafting","Multiplayer","Open World"],
  "dead island":    ["Action","Zombie","Co-op","Open World"],
  "minecraft":      ["Sandbox","Survival","Crafting","Multiplayer"],
  "terraria":       ["Sandbox","Adventure","Crafting","Indie"],
  "stardew":        ["Simulation","Indie","RPG","Crafting"],
  "overwatch":      ["FPS","Multiplayer","Competitive","Shooter"],
  "apex":           ["Battle Royale","FPS","Multiplayer","Competitive"],
  "valorant":       ["FPS","Competitive","Multiplayer","Tactical"],
  "league of":      ["MOBA","Strategy","Competitive","Multiplayer"],
};

export function autoDetectCategories(gameName) {
  const lower = gameName.toLowerCase();
  for (const [kw, cats] of Object.entries(GAME_CATEGORY_DB)) {
    if (lower.includes(kw)) return cats;
  }
  return ["Action"];
}

// ─── Initial empty libraries ──────────────────────────────────────────────────
const _SG = [];
const _EG = [];
export const INIT_SG = () => _SG.map(g=>({...g,achievements:{...g.achievements}}));
export const INIT_EG = () => _EG.map(g=>({...g,achievements:{...g.achievements}}));

// ─── Marketplace listings ─────────────────────────────────────────────────────
export const MARKET_INIT = [
  { id:"m1", ownerId:"__seed__", seller:"ShadowByte",  email:"shadow@mail.com",  discord:"shadow#1337",
    steam:true,  epic:false, steamVal:340, epicVal:0,   askPrice:180, level:85,  badges:42, games:67,
    rating:4.8,  reviews:23, verified:true,  note:"Moving on. Clean account, no VAC bans.",   isOwn:false, offers:[], contacts:[] },
  { id:"m2", ownerId:"__seed__", seller:"NeonRaider",  email:"neon@mail.com",    discord:"neon#0042",
    steam:true,  epic:true,  steamVal:220, epicVal:95,  askPrice:150, level:60,  badges:28, games:45,
    rating:4.5,  reviews:11, verified:false, note:"Quick sale needed.",                       isOwn:false, offers:[], contacts:[] },
  { id:"m3", ownerId:"__seed__", seller:"GlitchKing",  email:"glitch@mail.com",  discord:"—",
    steam:false, epic:true,  steamVal:0,   epicVal:180, askPrice:90,  level:0,   badges:0,  games:38,
    rating:4.2,  reviews:7,  verified:false, note:"Epic-only. All free games claimed.",       isOwn:false, offers:[], contacts:[] },
  { id:"m4", ownerId:"__seed__", seller:"CipherX",     email:"cipher@mail.com",  discord:"cipherx#9999",
    steam:true,  epic:true,  steamVal:560, epicVal:120, askPrice:320, level:120, badges:88, games:103,
    rating:5.0,  reviews:41, verified:true,  note:"Premium account. 10yr+ veteran.",         isOwn:false, offers:[], contacts:[] },
  { id:"m5", ownerId:"__seed__", seller:"VoidWalker",  email:"void@mail.com",    discord:"void#2023",
    steam:true,  epic:false, steamVal:140, epicVal:0,   askPrice:70,  level:30,  badges:12, games:22,
    rating:4.0,  reviews:4,  verified:false, note:"Budget account, good starter.",           isOwn:false, offers:[], contacts:[] },
];

export const PRICE_HISTORY = {
  m1: [{m:"Oct",v:220},{m:"Nov",v:200},{m:"Dec",v:195},{m:"Jan",v:185},{m:"Feb",v:182},{m:"Now",v:180}],
  m2: [{m:"Oct",v:180},{m:"Nov",v:170},{m:"Dec",v:160},{m:"Jan",v:155},{m:"Feb",v:152},{m:"Now",v:150}],
  m3: [{m:"Oct",v:110},{m:"Nov",v:105},{m:"Dec",v:100},{m:"Jan",v:95}, {m:"Feb",v:92}, {m:"Now",v:90}],
  m4: [{m:"Oct",v:350},{m:"Nov",v:340},{m:"Dec",v:335},{m:"Jan",v:325},{m:"Feb",v:322},{m:"Now",v:320}],
  m5: [{m:"Oct",v:90}, {m:"Nov",v:85}, {m:"Dec",v:80}, {m:"Jan",v:75}, {m:"Feb",v:72}, {m:"Now",v:70}],
};

// ─── Valuation info ───────────────────────────────────────────────────────────
export const VAL_METHODS = [
  { k:"Game Library Value",      v:"Each game counted at ~60% of original price (Steam) or 50% (Epic)" },
  { k:"Steam Level Bonus",       v:"$0.12 per level. Level 50 = +$6, Level 100 = +$12" },
  { k:"Badge Collection",        v:"$1.50 per badge. Rare badges add more perceived value" },
  { k:"Playtime Premium",        v:"High playtime adds up to $30 bonus (capped)" },
  { k:"Epic Free Games",         v:"$2.50 per free claimed game — shows account age" },
  { k:"Market Discount",         v:"Typical sale price is 50–70% of estimated value" },
];

export const EMOJIS = ["🎮","⚔️","🔫","🚗","🌆","🧙","🎯","🚀","🔦","🏆","🌍","🧟","💀","🔮","🐉","🏹","🛡️","🌌","🦸","🎲","🥷","🔬","🛸","🌋","🎪","🧩","🎵","⚡","🌊","🔥"];

export const STEAM_AUTO = {};
export const EPIC_AUTO  = {};

// ─── Wishlist suggestions ─────────────────────────────────────────────────────
export const WISH_SUGG = [
  { id:"ws1", name:"Cyberpunk 2077",     img:"🌆", price:59.99, platform:"steam", categories:["RPG","Open World","Action","Sci-Fi"] },
  { id:"ws2", name:"Elden Ring",         img:"⚔️", price:59.99, platform:"steam", categories:["RPG","Soulslike","Action","Fantasy"] },
  { id:"ws3", name:"Baldur's Gate 3",    img:"🧙", price:59.99, platform:"steam", categories:["RPG","Turn-Based","Fantasy","Co-op"] },
  { id:"ws4", name:"Starfield",          img:"🚀", price:69.99, platform:"steam", categories:["RPG","Sci-Fi","Open World","Exploration"] },
  { id:"ws5", name:"Hogwarts Legacy",    img:"🔮", price:59.99, platform:"steam", categories:["Action","Adventure","Fantasy","Open World"] },
  { id:"ws6", name:"Hades II",           img:"💀", price:29.99, platform:"steam", categories:["Roguelike","Action","Dungeon Crawler","Indie"] },
  { id:"ws7", name:"Palworld",           img:"🐉", price:29.99, platform:"steam", categories:["Survival","Crafting","Multiplayer","Open World"] },
  { id:"ws8", name:"Black Myth: Wukong", img:"🥷", price:59.99, platform:"steam", categories:["Action","RPG","Soulslike","Mythology"] },
  { id:"ws9", name:"Alan Wake 2",        img:"🔦", price:49.99, platform:"steam", categories:["Thriller","Action","Horror","Story-Rich"] },
  { id:"ws10",name:"Helldivers 2",       img:"🛡️", price:39.99, platform:"steam", categories:["Co-op","Shooter","Action","Multiplayer"] },
];
