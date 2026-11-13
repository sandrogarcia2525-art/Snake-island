const crypto = require("crypto");
const { put } = require("@vercel/blob");
const { isAuthed, unauthorized, safeOrigin } = require("./_admin");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!isAuthed(req)) return unauthorized(res);
  if (!safeOrigin(req)) return res.status(403).json({ error: "Origen no permitido." });
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }
  const dataUrl = String(req.body && req.body.dataUrl || "");
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return res.status(400).json({ error: "Selecciona una imagen JPG, PNG, WEBP o GIF." });
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 4 * 1024 * 1024) return res.status(413).json({ error: "La imagen debe pesar máximo 4 MB." });
  try {
    const blob = await put("snake-island/products/" + crypto.randomUUID(), buffer, {
      access: "public", addRandomSuffix: false, contentType: match[1], token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error("Image upload failed:", error.message);
    return res.status(503).json({ error: "No se pudo publicar la fotografía." });
  }
};
