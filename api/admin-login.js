const crypto = require("crypto");
const { setSession, safeOrigin } = require("./_admin");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }
  if (!safeOrigin(req)) return res.status(403).json({ error: "Origen no permitido." });
  const expected = process.env.ADMIN_PASSWORD || "";
  const supplied = String(req.body && req.body.password || "");
  if (!expected) return res.status(503).json({ error: "La administración aún no está configurada." });
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!valid) return res.status(401).json({ error: "Contraseña incorrecta." });
  setSession(res);
  return res.status(200).json({ ok: true });
};
