// ─────────────────────────────────────────────────────────────────────────────
// GameVault AI — powered by Claude claude-sonnet-4-20250514 via Anthropic API
// Uses web_search tool to fetch live Steam/gaming data
// ─────────────────────────────────────────────────────────────────────────────

const AI_ENDPOINT = "https://api.anthropic.com/v1/messages";

// Add your Anthropic API key to .env.local:
// REACT_APP_ANTHROPIC_KEY=sk-ant-...
const API_KEY = process.env.REACT_APP_ANTHROPIC_KEY || "";

async function callClaude(systemPrompt, userMessage, useWebSearch = true) {
  if (!API_KEY) {
    throw new Error("Anthropic API key not set. Add REACT_APP_ANTHROPIC_KEY to your .env.local");
  }

  const tools = useWebSearch ? [{
    type: "web_search_20250305",
    name: "web_search",
  }] : [];

  const body = {
    model:      "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system:     systemPrompt,
    messages:   [{ role: "user", content: userMessage }],
    ...(tools.length ? { tools } : {}),
  };

  const res = await fetch(AI_ENDPOINT, {
    method:  "POST",
    headers: {
      "Content-Type":            "application/json",
      "x-api-key":               API_KEY,
      "anthropic-version":       "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  // Extract text from content blocks (may include tool_use blocks)
  const text = data.content
    .filter(b => b.type === "text")
    .map(b => b.text)
    .join("\n");
  return text;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI FEATURES
// ─────────────────────────────────────────────────────────────────────────────

// 1. Price Analyst — is this game worth buying right now?
export async function aiPriceAnalyst({ gameName, appId, currentPrice, originalPrice, discount, priceHistory }) {
  const system = `You are a gaming value analyst for GameVault. Be concise, direct and helpful.
Give a clear BUY / WAIT / SKIP recommendation with brief reasoning.
Format: start with verdict emoji (✅ BUY | ⏳ WAIT | ❌ SKIP), then 2-3 sentences max.`;

  const msg = `Analyze if "${gameName}" is worth buying right now.
Current price: $${currentPrice} ${discount > 0 ? `(${discount}% off from $${originalPrice})` : "(full price)"}
Price history: ${priceHistory?.length > 1 ? `lowest was $${Math.min(...priceHistory.map(h=>h.price)).toFixed(2)}` : "first time tracked"}
Search for the current Steam reviews, player count, and any upcoming sales for this game to give a data-backed recommendation.`;

  return callClaude(system, msg, true);
}

// 2. Game Recommender — suggest games based on library
export async function aiGameRecommender({ games, genres, platforms }) {
  const system = `You are a gaming recommendation engine for GameVault. Be specific and enthusiastic.
Recommend exactly 5 games. Format each as:
🎮 **Game Name** (Platform) — one sentence why it fits this player's taste.`;

  const topGames = games.slice(0, 10).map(g => g.name).join(", ");
  const topGenres = [...new Set(games.flatMap(g => g.categories || []))].slice(0, 6).join(", ");

  const msg = `Recommend 5 games for a player who owns: ${topGames}
Their top genres: ${topGenres}
Platforms: ${platforms}
Search for currently popular and well-reviewed games that match this taste profile. Include recent releases.`;

  return callClaude(system, msg, true);
}

// 3. Market Assistant — suggest listing price
export async function aiMarketAssistant({ steamGames, epicGames, level, badges, totalHours, steamValue, epicValue }) {
  const system = `You are a gaming account marketplace expert for GameVault.
Give a specific price range and selling tips. Be direct and practical.
Format: start with 💰 suggested price range, then bullet points for selling tips.`;

  const msg = `Suggest a fair marketplace listing price for this Steam/Epic account:
- Steam: ${steamGames} games, Level ${level}, ${badges} badges, ${totalHours}h playtime
- Epic: ${epicGames} games
- Estimated value: Steam $${steamValue}, Epic $${epicValue}
Search current GameVault-style account marketplaces (PlayerAuctions, G2G, etc) to benchmark realistic prices for accounts with similar stats.`;

  return callClaude(system, msg, true);
}

// 4. Trade Advisor — is this trade fair?
export async function aiTradeAdvisor({ offering, wanting }) {
  const system = `You are a game trade fairness advisor for GameVault.
Assess if a trade is fair, who benefits more, and whether to accept.
Format: start with ⚖️ verdict (FAIR / FAVOUR YOU / FAVOUR THEM), then 2-3 sentences.`;

  const msg = `Is this trade fair?
Offering: "${offering}"
Wanting: "${wanting}"
Search current Steam/key site prices for both games to give a data-backed assessment.`;

  return callClaude(system, msg, true);
}

// 5. News Summarizer — summarize gaming news
export async function aiNewsSummarizer(topic = "gaming news today") {
  const system = `You are a gaming news briefing assistant for GameVault.
Give a crisp 3-bullet summary of the most important gaming news.
Format: 3 bullet points, each starting with a relevant emoji, max 1 sentence each.`;

  const msg = `Search for the latest ${topic} and give me a 3-point briefing covering the most important stories right now. Focus on game releases, major updates, sales, and industry news.`;

  return callClaude(system, msg, true);
}

// 6. Live Game Price Fetcher — get price from multiple platforms
export async function aiGetGamePrice(gameName) {
  const system = `You are a game price aggregator for GameVault.
Search for the current price of the game on Steam, Epic, GOG, and key sites.
Format your response as JSON only, no other text:
{"steam": "$X.XX or N/A", "epic": "$X.XX or N/A", "gog": "$X.XX or N/A", "cheapest": {"site": "name", "price": "$X.XX"}, "onSale": true/false, "saleEnds": "date or null"}`;

  const msg = `Find the current price of "${gameName}" on Steam, Epic Games Store, GOG, and cheap game key sites like Fanatical, Humble, or Greenmangaming. Return only JSON.`;

  try {
    const raw = await callClaude(system, msg, true);
    // Try to parse JSON
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch {
    return null;
  }
}
