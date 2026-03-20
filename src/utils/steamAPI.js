// ─────────────────────────────────────────────────────────────────────────────
// Steam Web API — real integration
//
// Steam's API blocks direct browser requests (CORS), so we route through a
// free public CORS proxy. In production you'd use your own backend.
//
// PROXY used: https://corsproxy.io  (free, no key needed)
// ─────────────────────────────────────────────────────────────────────────────

const PROXY   = "https://corsproxy.io/?";
const STEAM   = "https://api.steampowered.com";

function proxied(url) {
  return `${PROXY}${encodeURIComponent(url)}`;
}

// ── Resolve vanity URL → Steam64 ID ──────────────────────────────────────────
// If the user enters a vanity name (e.g. "gaben") instead of a 76-digit ID
export async function resolveVanityUrl(apiKey, vanityName) {
  const url = `${STEAM}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityName}`;
  const res  = await fetch(proxied(url));
  if (!res.ok) throw new Error("Steam API unreachable");
  const data = await res.json();
  if (data?.response?.success === 1) return data.response.steamid;
  return null; // not a vanity URL, might already be a Steam64 ID
}

// ── Get player summary (level needs separate call) ────────────────────────────
export async function getPlayerSummary(apiKey, steamId) {
  const url = `${STEAM}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const res  = await fetch(proxied(url));
  if (!res.ok) throw new Error("Failed to fetch player summary");
  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) throw new Error("Steam ID not found — check your Steam64 ID");
  return {
    steamId:     player.steamid,
    personaName: player.personaname,
    avatar:      player.avatarmedium,
    profileUrl:  player.profileurl,
    visibility:  player.communityvisibilitystate, // 3 = public, 1/2 = private
  };
}

// ── Get Steam level ───────────────────────────────────────────────────────────
export async function getPlayerLevel(apiKey, steamId) {
  const url = `${STEAM}/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;
  const res  = await fetch(proxied(url));
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.response?.player_level || 0;
}

// ── Get badge count ───────────────────────────────────────────────────────────
export async function getBadgeCount(apiKey, steamId) {
  const url = `${STEAM}/IPlayerService/GetBadges/v1/?key=${apiKey}&steamid=${steamId}`;
  const res  = await fetch(proxied(url));
  if (!res.ok) return 0;
  const data = await res.json();
  return data?.response?.badges?.length || 0;
}

// ── Get owned games ───────────────────────────────────────────────────────────
export async function getOwnedGames(apiKey, steamId) {
  const url = `${STEAM}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
  const res  = await fetch(proxied(url));
  if (!res.ok) throw new Error("Failed to fetch owned games");
  const data = await res.json();
  return data?.response?.games || [];
}

// ── Get achievements for one game ─────────────────────────────────────────────
export async function getGameAchievements(apiKey, steamId, appId) {
  const url = `${STEAM}/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${steamId}&appid=${appId}`;
  try {
    const res  = await fetch(proxied(url));
    if (!res.ok) return { total:0, earned:0 };
    const data = await res.json();
    const list = data?.playerstats?.achievements || [];
    return {
      total:  list.length,
      earned: list.filter(a => a.achieved === 1).length,
    };
  } catch {
    return { total:0, earned:0 };
  }
}

// ── Get game image URL — uses Steam store header (460x215, no hash needed) ──
export function gameIconUrl(appId, iconHash) {
  // Steam store header image is always available and looks great as a card image
  if (appId) return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  // Fallback to icon hash if somehow appId is missing
  if (iconHash) return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
  return null;
}

// ── EMOJI fallback map for well-known games ───────────────────────────────────
const KNOWN_EMOJIS = {
  730:    "🔫", // CS2
  570:    "🏆", // Dota 2
  440:    "🎩", // TF2
  4000:   "🔧", // GMod
  1091500:"🌆", // Cyberpunk
  1245620:"⚔️", // Elden Ring
  1086940:"🧙", // BG3
  990080: "🦉", // Hogwarts
  620:    "🌀", // Portal 2
  70:     "🥽", // HL1 (proxy for Alyx)
  1145360:"🥽", // HL: Alyx
  292030: "🗡️", // Witcher 3
  1659040:"💀", // Hades 2
};

export function gameEmoji(appId) {
  return KNOWN_EMOJIS[appId] || "🎮";
}

// ─────────────────────────────────────────────────────────────────────────────
// Master function — fetch everything and return structured profile
// Fetches achievements only for top 5 games by playtime (slow otherwise)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchFullSteamProfile(apiKey, steamIdOrVanity, onProgress) {
  onProgress?.("Resolving Steam ID...", 10);

  // Try to resolve vanity name
  let steamId = steamIdOrVanity.trim();
  if (!/^\d{17}$/.test(steamId)) {
    // Not a 17-digit ID — try resolving as vanity URL
    const resolved = await resolveVanityUrl(apiKey, steamId);
    if (resolved) {
      steamId = resolved;
    } else {
      throw new Error(`"${steamIdOrVanity}" is not a valid Steam64 ID or username`);
    }
  }

  onProgress?.("Fetching profile...", 25);
  const summary = await getPlayerSummary(apiKey, steamId);

  if (summary.visibility !== 3) {
    throw new Error(
      "Your Steam profile is set to Private. " +
      "Please go to Steam → Edit Profile → Privacy Settings → set Game Details to Public, then try again."
    );
  }

  onProgress?.("Fetching level & badges...", 40);
  const [level, badges] = await Promise.all([
    getPlayerLevel(apiKey, steamId),
    getBadgeCount(apiKey, steamId),
  ]);

  onProgress?.("Fetching game library...", 60);
  const rawGames = await getOwnedGames(apiKey, steamId);

  if (!rawGames.length) {
    throw new Error(
      "No games found. Make sure your game library visibility is set to Public in Steam Privacy Settings."
    );
  }

  onProgress?.(`Fetching achievements for top games...`, 78);

  // Sort by playtime, take top 8, fetch achievements for those
  const sorted  = [...rawGames].sort((a, b) => b.playtime_forever - a.playtime_forever);
  const top8    = sorted.slice(0, 8);
  const achData = await Promise.allSettled(
    top8.map(g => getGameAchievements(apiKey, steamId, g.appid))
  );

  onProgress?.("Building library...", 92);

  const { autoDetectCategories } = await import("../constants/data.js");

  const games = sorted.slice(0, 60).map((g, i) => {
    const achIdx = top8.findIndex(t => t.appid === g.appid);
    const ach    = achIdx >= 0 && achData[achIdx]?.status === "fulfilled"
      ? achData[achIdx].value
      : { total:0, earned:0 };

    const name = g.name || `App ${g.appid}`;

    return {
      id:           Date.now() + i,
      appid:        g.appid,
      name,
      platform:     "steam",
      playtime:     Math.round((g.playtime_forever || 0) / 60), // mins → hours
      price:        0,   // price not available from owned games API
      img:          gameEmoji(g.appid),
      imgUrl:       gameIconUrl(g.appid, g.img_icon_url),
      metacritic:   0,
      wishlist:     false,
      categories:   autoDetectCategories(name),
      achievements: ach,
    };
  });

  const totalHours = games.reduce((s, g) => s + g.playtime, 0);

  onProgress?.("Done!", 100);

  return {
    steamId,
    username:   summary.personaName,
    avatar:     summary.avatar,
    profileUrl: summary.profileUrl,
    level,
    badges,
    totalHours,
    games,
  };
}
