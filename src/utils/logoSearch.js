// ─────────────────────────────────────────────────────────────────────────────
// Game logo search — uses Steam Store search API
//
// Steam's store search endpoint is CORS-accessible from browsers:
//   https://store.steampowered.com/api/storesearch/?term=GAMENAME&l=english&cc=US
// Returns appids → we build cover URLs from Steam CDN:
//   https://cdn.cloudflare.steamstatic.com/steam/apps/APPID/header.jpg   (460×215)
//   https://cdn.cloudflare.steamstatic.com/steam/apps/APPID/capsule_231x87.jpg
// Both are direct image CDN links — no auth, no CORS issues.
// ─────────────────────────────────────────────────────────────────────────────

export async function searchGameLogos(gameName, maxResults = 3) {
  if (!gameName || gameName.trim().length < 2) return [];

  const results = [];

  try {
    const q = encodeURIComponent(gameName.trim());
    // Steam store search — returns JSON with items[].id (appId) and name
    const url = `https://store.steampowered.com/api/storesearch/?term=${q}&l=english&cc=US`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      const items = (data.items || []).filter(item => item.type === "app");
      for (const item of items.slice(0, maxResults)) {
        // Try header image first (460×215) — always exists for Steam games
        results.push({
          url:    `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`,
          thumb:  `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/capsule_231x87.jpg`,
          source: "Steam",
          name:   item.name,
          appId:  item.id,
        });
      }
    }
  } catch (e) {
    // Steam store blocked (happens in some networks) — try corsproxy
    try {
      const q = encodeURIComponent(gameName.trim());
      const proxy = `https://corsproxy.io/?https://store.steampowered.com/api/storesearch/?term=${q}&l=english&cc=US`;
      const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).filter(i => i.type === "app");
        for (const item of items.slice(0, maxResults)) {
          results.push({
            url:   `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`,
            thumb: `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/capsule_231x87.jpg`,
            source:"Steam",
            name:  item.name,
            appId: item.id,
          });
        }
      }
    } catch {}
  }

  return results.slice(0, maxResults);
}
