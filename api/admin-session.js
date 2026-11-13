const { isAuthed, clearSession } = require("../lib/admin");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "DELETE") { clearSession(res); return res.status(200).json({ ok: true }); }
  if (req.method !== "GET") { res.setHeader("Allow", "GET, DELETE"); return res.status(405).json({ error: "Método no permitido." }); }
  return res.status(200).json({ authenticated: isAuthed(req) });
};
