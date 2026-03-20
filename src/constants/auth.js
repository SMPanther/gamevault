import { saveUserDB, logActivity } from "../utils/storage";
// ─────────────────────────────────────────────────────────────────────────────
// OWNER CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
export const OWNER = {
  username:"vault_owner", password:"Admin@2025!", recoveryCode:"VAULT-9X4K-2M7P",
  name:"Owner", avatar:"OW", email:"owner@gamevault.gg", role:"owner",
};

// ─────────────────────────────────────────────────────────────────────────────
// USER REGISTRY  (in-memory)
// ─────────────────────────────────────────────────────────────────────────────
export const USER_DB = {
  demo: {
    username:"demo", password:"demo123", recoveryCode:"DEMO-1234-ABCD",
    name:"Cipher_X", avatar:"CX", email:"cipher@gamevault.gg",
    role:"user", createdAt:"2024-01-15", banned:false, hasSeenOnboarding:true,
    // Verification data — null until submitted
    verification: null,   // { status, steamScreenshot, libraryScreenshot, submittedAt }
    steamVerified: false, // true after owner approves
  },
};

// ─── Verification requests store ─────────────────────────────────────────────
// Each entry: { username, name, email, steamScreenshot, libraryScreenshot,
//               submittedAt, status:"pending"|"approved"|"rejected",
//               rejectionReason:"" }
export const VERIFICATION_QUEUE = [];

// ─────────────────────────────────────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────────────────────────────────────
export function loginUser(username, password) {
  const u = username.toLowerCase().trim();
  if (u === OWNER.username.toLowerCase() && password === OWNER.password) return { ...OWNER };
  const user = USER_DB[u];
  if (user && !user.banned && user.password === password) return { ...user };
  return null;
}

export function usernameTaken(username) {
  const u = username.toLowerCase().trim();
  return u === OWNER.username.toLowerCase() || !!USER_DB[u];
}

export function emailTaken(email) {
  const e = email.toLowerCase().trim();
  if (OWNER.email.toLowerCase() === e) return true;
  return Object.values(USER_DB).some(u => u.email.toLowerCase() === e);
}

export function registerUser({ username, password, name, email, recoveryCode }) {
  const u = username.toLowerCase().trim();
  const e = email.toLowerCase().trim();
  if (usernameTaken(u))  return { ok:false, error:"Username already taken" };
  if (emailTaken(e))     return { ok:false, error:"Email already registered" };
  USER_DB[u] = {
    username:u, password, recoveryCode:recoveryCode.toUpperCase(),
    name, avatar:name.slice(0,2).toUpperCase(), email:e,
    role:"user", createdAt:new Date().toISOString().split("T")[0],
    banned:false, verification:null, steamVerified:false,
  };
  saveUserDB(USER_DB);
  logActivity(u, "register", "Account created");
  return { ok:true, user:{ ...USER_DB[u] } };
}

export function resetPassword(username, recoveryCode, newPassword) {
  const u = username.toLowerCase().trim();
  if (u === OWNER.username.toLowerCase()) {
    if (recoveryCode === "__CHECK_ONLY__") return { ok:false, error:"exists" };
    if (recoveryCode.trim().toUpperCase() !== OWNER.recoveryCode.toUpperCase())
      return { ok:false, error:"Invalid recovery code" };
    OWNER.password = newPassword; return { ok:true };
  }
  const user = USER_DB[u];
  if (!user) return { ok:false, error:"Username not found" };
  if (recoveryCode === "__CHECK_ONLY__") return { ok:false, error:"exists" };
  if (recoveryCode.trim().toUpperCase() !== user.recoveryCode.toUpperCase())
    return { ok:false, error:"Invalid recovery code" };
  USER_DB[u].password = newPassword; return { ok:true };
}

export function getAllUsers() { return Object.values(USER_DB); }
export function toggleBan(username) { const u=USER_DB[username.toLowerCase()]; if(u) u.banned=!u.banned; }
export function adminResetPassword(username, pw) { const u=USER_DB[username.toLowerCase()]; if(u) u.password=pw; }

// ─── Verification actions ─────────────────────────────────────────────────────
export function submitVerification({ username, steamScreenshot, libraryScreenshot }) {
  const user = USER_DB[username.toLowerCase()];
  if (!user) return;
  // Remove any old pending request
  const idx = VERIFICATION_QUEUE.findIndex(v => v.username === username.toLowerCase());
  if (idx > -1) VERIFICATION_QUEUE.splice(idx, 1);
  const entry = {
    id: `vq_${Date.now()}`,
    username: username.toLowerCase(),
    name:     user.name,
    email:    user.email,
    steamScreenshot,    // base64 dataUrl
    libraryScreenshot,  // base64 dataUrl
    submittedAt: new Date().toISOString(),
    status: "pending",
    rejectionReason: "",
  };
  VERIFICATION_QUEUE.unshift(entry);
  user.verification = { status:"pending", submittedAt: entry.submittedAt };
}

export function approveVerification(username) {
  const u = username.toLowerCase();
  const entry = VERIFICATION_QUEUE.find(v => v.username === u);
  if (entry) entry.status = "approved";
  if (USER_DB[u]) {
    USER_DB[u].steamVerified = true;
    USER_DB[u].verification  = { status:"approved" };
  }
}

// Reject: marks entry rejected, unsets steamVerified, records reason
export function rejectVerification(username, reason) {
  const u = username.toLowerCase();
  const entry = VERIFICATION_QUEUE.find(v => v.username === u);
  if (entry) { entry.status = "rejected"; entry.rejectionReason = reason; }
  if (USER_DB[u]) {
    USER_DB[u].steamVerified = false;
    USER_DB[u].verification  = { status:"rejected", reason };
  }
}

// Get live verification status for a user
export function getVerificationStatus(username) {
  return USER_DB[username.toLowerCase()]?.verification || null;
}
