const crypto = require("crypto");

const COOKIE = "si_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function secret() {
  return process.env.ADMIN_PASSWORD || "";
}
function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}
function cookieValue(req) {
  const header = req.headers && req.headers.cookie || "";
  const item = header.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE + "="));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : "";
}
function isAuthed(req) {
  const key = secret();
  if (!key) return false;
  const token = cookieValue(req);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}
function setSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=" + encodeURIComponent(createSession()) + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + SESSION_SECONDS);
}
function clearSession(res) {
  res.setHeader("Set-Cookie", COOKIE + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
}
function unauthorized(res) {
  return res.status(401).json({ error: "Inicia sesión para continuar." });
}
function safeOrigin(req) {
  const origin = req.headers && req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
module.exports = { isAuthed, setSession, clearSession, unauthorized, safeOrigin };
