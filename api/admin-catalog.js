const { put, list } = require("@vercel/blob");
const { isAuthed, unauthorized, safeOrigin } = require("../lib/admin");
const allowed = new Set(["wear", "accessories", "collectibles"]);
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!isAuthed(req)) return unauthorized(res);
  if (!safeOrigin(req)) return res.status(403).json({ error: "Origen no permitido." });
  if (req.method === "GET") {
    try {
      const found = await list({ prefix: "snake-island/catalog.json", token: process.env.BLOB_READ_WRITE_TOKEN });
      if (!found.blobs.length) return res.status(200).json({ products: [] });
      const response = await fetch(found.blobs[0].url, { cache: "no-store" });
      const data = await response.json();
      return res.status(200).json({ products: Array.isArray(data.products) ? data.products : [] });
    } catch (error) {
      console.error("Admin catalog read failed:", error.message);
      return res.status(503).json({ error: "No se pudo cargar el catálogo compartido." });
    }
  }
  if (req.method !== "PUT") { res.setHeader("Allow", "GET, PUT"); return res.status(405).json({ error: "Método no permitido." }); }
  const products = req.body && req.body.products;
  if (!Array.isArray(products) || products.length > 200) return res.status(400).json({ error: "Catálogo no válido." });
  const clean = [];
  for (const item of products) {
    const product = {
      id: String(item.id || "").slice(0, 80),
      name: String(item.name || "").trim().slice(0, 70),
      category: String(item.category || ""),
      image: String(item.image || "").slice(0, 2000),
      description: String(item.description || "").trim().slice(0, 240),
      price: Number(item.price),
      stock: Number(item.stock || 0)
    };
    if (!product.id || !product.name || !allowed.has(product.category) || !Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0 || (product.image && !/^https:\/\//i.test(product.image))) {
      return res.status(400).json({ error: "Hay un artículo con datos no válidos." });
    }
    clean.push(product);
  }
  try {
    await put("snake-island/catalog.json", JSON.stringify({ products: clean, updatedAt: new Date().toISOString() }), {
      access: "public", addRandomSuffix: false, allowOverwrite: true,
      contentType: "application/json", token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return res.status(200).json({ ok: true, count: clean.length });
  } catch (error) {
    console.error("Admin catalog write failed:", error.message);
    return res.status(503).json({ error: "No se pudo guardar el catálogo compartido." });
  }
};
