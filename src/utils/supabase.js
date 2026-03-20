// ─────────────────────────────────────────────────────────────────────────────
// Supabase client
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://guurupcyzwuwnqmwyiav.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dXJ1cGN5end1d25xbXd5aWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzkzNTAsImV4cCI6MjA4OTUxNTM1MH0.tayJ2XY5kEthEBPe1KjyiFeDnKJRLWFrPrsEYm1GRSA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export async function sbRegister({ email, password, username, name, recoveryCode }) {
  // 1. Create auth user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };

  const uid = data.user?.id;
  if (!uid) return { ok: false, error: "Registration failed" };

  // 2. Create profile row
  const { error: pErr } = await supabase.from("profiles").insert({
    id:                  uid,
    username:            username.toLowerCase(),
    name,
    avatar:              name.slice(0, 2).toUpperCase(),
    role:                "user",
    steam_verified:      false,
    has_seen_onboarding: false,
    recovery_code:       recoveryCode.toUpperCase(),
  });
  if (pErr) return { ok: false, error: pErr.message };

  return { ok: true, user: { id: uid, email, username: username.toLowerCase(), name, role: "user" } };
}

export async function sbLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: data.session, user: data.user };
}

export async function sbLogout() {
  await supabase.auth.signOut();
}

export async function sbGetSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function sbGetProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function sbUpdateProfile(userId, updates) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  return !error;
}

export async function sbCheckUsername(username) {
  const { data } = await supabase.from("profiles").select("username").eq("username", username.toLowerCase()).maybeSingle();
  return !!data;
}

export async function sbCheckEmail(email) {
  // We can't query auth.users directly, so we attempt signup and check the error
  // Instead use a profiles lookup by email stored there
  const { data } = await supabase.from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle();
  return !!data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE  (library, wishlist, linked accounts)
// ─────────────────────────────────────────────────────────────────────────────

export async function sbLoadGameState(userId) {
  const { data } = await supabase.from("game_states").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    sg:         data.sg         || [],
    eg:         data.eg         || [],
    sLinked:    data.s_linked   || false,
    eLinked:    data.e_linked   || false,
    sProf:      data.s_prof     || { username:"", level:0, badges:0, totalHours:0 },
    eProf:      data.e_prof     || { username:"", totalHours:0 },
    wishExtras: data.wish_extras|| [],
  };
}

export async function sbSaveGameState(userId, state) {
  const row = {
    user_id:     userId,
    sg:          state.sg,
    eg:          state.eg,
    s_linked:    state.sLinked,
    e_linked:    state.eLinked,
    s_prof:      state.sProf,
    e_prof:      state.eProf,
    wish_extras: state.wishExtras,
    updated_at:  new Date().toISOString(),
  };
  const { error } = await supabase.from("game_states").upsert(row, { onConflict: "user_id" });
  return !error;
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS (marketplace)
// ─────────────────────────────────────────────────────────────────────────────

export async function sbGetListings() {
  const { data } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function sbUpsertListing(listing) {
  const { error } = await supabase.from("listings").upsert(listing);
  return !error;
}

export async function sbDeleteListing(id) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  return !error;
}

export async function sbUpdateListingOffers(id, offers) {
  const { error } = await supabase.from("listings").update({ offers }).eq("id", id);
  return !error;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRADES
// ─────────────────────────────────────────────────────────────────────────────

export async function sbGetTrades() {
  const { data } = await supabase.from("trades").select("*").order("posted_at", { ascending: false });
  return data || [];
}

export async function sbUpsertTrade(trade) {
  const { error } = await supabase.from("trades").upsert(trade);
  return !error;
}

export async function sbDeleteTrade(id) {
  const { error } = await supabase.from("trades").delete().eq("id", id);
  return !error;
}

export async function sbUpdateTradeProposals(id, proposals, status) {
  const updates = { proposals };
  if (status) updates.status = status;
  const { error } = await supabase.from("trades").update(updates).eq("id", id);
  return !error;
}

// ─────────────────────────────────────────────────────────────────────────────
// REALTIME subscriptions
// ─────────────────────────────────────────────────────────────────────────────

export function subscribeListings(callback) {
  return supabase
    .channel("listings-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, callback)
    .subscribe();
}

export function subscribeTrades(callback) {
  return supabase
    .channel("trades-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "trades" }, callback)
    .subscribe();
}
