const { list } = require("@vercel/blob");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Método no permitido." }); }
  try {
    const result = await list({ prefix: "snake-island/catalog.json", token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!result.blobs.length) return res.status(200).json({ products: [] });
    const response = await fetch(result.blobs[0].url, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo leer el catálogo.");
    const data = await response.json();
    return res.status(200).json({ products: Array.isArray(data.products) ? data.products : [] });
  } catch (error) {
    console.error("Catalog read failed:", error.message);
    return res.status(503).json({ error: "El catálogo compartido no está disponible." });
  }
};
