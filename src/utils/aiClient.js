// ─────────────────────────────────────────────────────────────────────────────
// GameVault AI — powered by Groq (Llama 3.3 70B) — free tier
// Fast, smart, no billing required
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL    = "llama-3.3-70b-versatile";
const API_KEY       = process.env.REACT_APP_GROQ_KEY || "";

// ── Core call ─────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userMessage, temperature = 0.7) {
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      temperature,
      max_tokens:  1024,
      messages: [
        { role: "system",  content: systemPrompt },
        { role: "user",    content: userMessage  },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq API error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Web search via SteamSpy / ITAD public APIs (no key needed) ────────────────
async function getSteamGameData(gameName) {
  try {
    // Search via SteamSpy (free, no key)
    const res = await fetch(
      `https://steamspy.com/api.php?request=search&term=${encodeURIComponent(gameName)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const entries = Object.values(data);
    if (!entries.length) return null;
    const game = entries[0];
    return {
      appid:    game.appid,
      name:     game.name,
      owners:   game.owners,
      avgHours: game.average_forever,
      price:    game.price ? `$${(game.price / 100).toFixed(2)}` : "Free",
      score:    game.score_rank,
      positive: game.positive,
      negative: game.negative,
    };
  } catch { return null; }
}

async function getIsThereAnyDeal(gameName) {
  try {
    // ITAD search — free public API
    const searchRes = await fetch(
      `https://api.isthereanydeal.com/games/search/v1?title=${encodeURIComponent(gameName)}&key=`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!searchRes.ok) return null;
    return await searchRes.json();
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI FEATURES
// ─────────────────────────────────────────────────────────────────────────────

// 1. Price Analyst
export async function aiPriceAnalyst({ gameName, currentPrice, originalPrice, discount, priceHistory }) {
  // Fetch real Steam data to ground the response
  const steamData = await getSteamGameData(gameName);

  const system = `You are a sharp, opinionated game value analyst for GameVault — a gaming account marketplace.
You give direct BUY / WAIT / SKIP verdicts backed by data. Be concise, confident and helpful.
Never be wishy-washy. Always give a clear recommendation.
Use gaming community knowledge and the data provided.`;

  const context = steamData
    ? `Steam data: ${steamData.owners} owners, avg ${Math.round(steamData.avgHours/60)}h played, ${steamData.positive} positive reviews, ${steamData.negative} negative reviews.`
    : "";

  const historyNote = priceHistory?.length > 1
    ? `Price history: lowest was $${Math.min(...priceHistory.map(h => h.price)).toFixed(2)}, tracked ${priceHistory.length} times.`
    : "First time tracking this game.";

  const msg = `Analyze if "${gameName}" is worth buying right now.
Current price: ${currentPrice === 0 ? "FREE" : `$${currentPrice}`}${discount > 0 ? ` (${discount}% off from $${originalPrice})` : " (full price)"}
${historyNote}
${context}

Give your verdict in this format:
[emoji] VERDICT — one punchy sentence
Then 2-3 bullet points with your reasoning (price history, review score, hours of gameplay value).
End with a pro tip if relevant.`;

  return callGroq(system, msg, 0.6);
}

// 2. Game Recommender
export async function aiGameRecommender({ games, platforms }) {
  const system = `You are an expert gaming curator for GameVault. You know every genre, franchise, hidden gem and blockbuster.
You give personalized recommendations that feel handpicked, not generic.
Be enthusiastic and specific — mention why each game fits THIS player's taste.`;

  const topGames  = games.slice(0, 12).map(g => g.name).join(", ");
  const topGenres = [...new Set(games.flatMap(g => g.categories || []))].slice(0, 8).join(", ");
  const mostPlayed = [...games].sort((a,b) => b.playtime - a.playtime).slice(0,3).map(g=>`${g.name} (${g.playtime}h)`).join(", ");

  const msg = `Recommend 5 games for this player.
Their library: ${topGames || "No games yet"}
Most played: ${mostPlayed || "N/A"}
Favorite genres: ${topGenres || "Unknown"}
Platforms: ${platforms}

Format each recommendation as:
🎮 **Game Name** — Platform — Why it's perfect for them (1-2 sentences)

Make them feel like you really know their taste. Mix well-known hits with one hidden gem.`;

  return callGroq(system, msg, 0.8);
}

// 3. Live Price Finder
export async function aiGetGamePrice(gameName) {
  const steamData = await getSteamGameData(gameName);

  const system = `You are a game price research assistant for GameVault.
Based on your knowledge of game pricing, provide accurate price estimates.
Always respond with ONLY valid JSON, no markdown, no explanation.`;

  const steamHint = steamData?.price ? `Steam price from API: ${steamData.price}.` : "";

  const msg = `Find current prices for "${gameName}" on major platforms.
${steamHint}
Use your knowledge of this game's pricing on Steam, Epic Games Store, GOG, and key reseller sites.

Respond with ONLY this JSON structure:
{"steam":"$X.XX or Free or N/A","epic":"$X.XX or Free or N/A","gog":"$X.XX or N/A","cheapest":{"site":"site name","price":"$X.XX"},"onSale":true/false,"discount":0,"tip":"one short buying tip"}`;

  try {
    const raw = await callGroq(system, msg, 0.2);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return null;
  } catch { return null; }
}

// 4. Market Assistant
export async function aiMarketAssistant({ steamGames, epicGames, level, badges, totalHours, steamValue, epicValue }) {
  const system = `You are a gaming account marketplace expert for GameVault.
You know how Steam/Epic accounts are valued and sold on platforms like PlayerAuctions, G2G, and GameVault.
Give specific, actionable advice. Be direct about pricing.`;

  const msg = `Suggest a fair marketplace listing price for this gaming account:

Steam stats: ${steamGames} games, Level ${level}, ${badges} badges, ${totalHours}h total playtime
Epic stats: ${epicGames} games
Estimated value: Steam $${steamValue?.toFixed(2)||0}, Epic $${epicValue?.toFixed(2)||0}

Based on current account marketplace rates, provide:
💰 **Suggested price range** — e.g. $X — $Y
📊 **Key selling points** — what makes this account valuable
🎯 **Pricing strategy** — how to position it
⚡ **Quick tips** — 2-3 tips to sell faster`;

  return callGroq(system, msg, 0.6);
}

// 5. Trade Advisor
export async function aiTradeAdvisor({ offering, wanting }) {
  const offerData = await getSteamGameData(offering);
  const wantData  = await getSteamGameData(wanting);

  const system = `You are a game trade fairness advisor for GameVault.
You assess trades based on current market value, game quality, and demand.
Be direct and give a clear verdict. Don't hedge.`;

  const offerContext = offerData ? `"${offering}": ${offerData.price}, ${offerData.positive} positive reviews` : `"${offering}"`;
  const wantContext  = wantData  ? `"${wanting}": ${wantData.price}, ${wantData.positive} positive reviews`  : `"${wanting}"`;

  const msg = `Is this game trade fair?
Offering: ${offerContext}
Wanting:  ${wantContext}

Give your verdict:
⚖️ **FAIR** / **FAVOURS YOU** / **FAVOURS THEM** — one sentence why
Then 2-3 bullet points explaining the value difference.
End with a counter-offer suggestion if the trade is lopsided.`;

  return callGroq(system, msg, 0.5);
}

// 6. News Summarizer
export async function aiNewsSummarizer(topic = "gaming news") {
  const system = `You are a gaming news briefing assistant for GameVault.
You know the latest gaming industry news, releases, sales, and events up to your knowledge cutoff.
Be punchy, informative and engaging. No filler.`;

  const msg = `Give me a quick gaming news briefing about: "${topic}"

Format as exactly 4 bullet points:
📰 **Story 1** — one sentence
🎮 **Story 2** — one sentence  
💰 **Story 3** — one sentence
⚡ **Story 4** — one sentence

Focus on what gamers actually care about. If you don't have very recent info, mention what you know and note it may not be the latest.`;

  return callGroq(system, msg, 0.7);
}

// 7. GameVault Chat — general gaming assistant
export async function aiChat(messages, userLibrary = []) {
  const system = `You are GV-AI, the smart gaming assistant built into GameVault — a gaming account manager and marketplace.
You help users with:
- Game recommendations and advice
- Account valuation and marketplace tips  
- Trade assessments
- Game info, reviews, tips and tricks
- Price hunting across platforms

You have access to the user's library context. Be conversational, helpful and genuinely knowledgeable about gaming.
Keep responses concise — 2-4 sentences unless the user asks for more detail.
You are NOT a general AI — stay focused on gaming topics.`;

  const libraryContext = userLibrary.length
    ? `User's library: ${userLibrary.slice(0,8).map(g=>g.name).join(", ")}${userLibrary.length > 8 ? ` +${userLibrary.length-8} more` : ""}`
    : "";

  const groqMessages = [
    { role: "system", content: system + (libraryContext ? `\n\n${libraryContext}` : "") },
    ...messages,
  ];

  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model:      GROQ_MODEL,
      temperature: 0.7,
      max_tokens:  512,
      messages:    groqMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}
