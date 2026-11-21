const { list, put } = require("@vercel/blob");
const crypto = require("crypto");

const CATALOG_PATH = "snake-island/catalog.json";
const ALLOWED_CATEGORIES = new Set(["wear", "accessories", "collectibles"]);

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}
function cleanProduct(product) {
  if (!product || typeof product !== "object") throw new Error("Artículo inválido.");
  const name = String(product.name || "").trim().slice(0, 70);
  const category = String(product.category || "");
  const price = Number(product.price);
  const stock = Number(product.stock);
  if (!name || !ALLOWED_CATEGORIES.has(category) || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
    throw new Error("Revisa nombre, categoría, precio y existencias de cada artículo.");
  }
  return {
    id: String(product.id || crypto.randomUUID()).slice(0, 100),
    name,
    category,
    image: String(product.image || "").slice(0, 2048),
    description: String(product.description || "").slice(0, 240),
    price,
    stock,
    updatedAt: Number(product.updatedAt) || Date.now()
  };
}
async function readCatalog(token) {
  const result = await list({ prefix: CATALOG_PATH, token });
  const blob = result.blobs.find(item => item.pathname === CATALOG_PATH);
  if (!blob) return [];
  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo leer el catálogo compartido.");
  const data = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "Falta conectar el almacenamiento compartido de Vercel Blob." });

  if (req.method === "GET") {
    try {
      return res.status(200).json({ products: await readCatalog(token) });
    } catch (error) {
      console.error("Shared catalog read failed:", error.message);
      return res.status(503).json({ error: "El catálogo compartido no está disponible." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido." });
  }

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) return res.status(503).json({ error: "La administración aún no está habilitada: configura ADMIN_PASSWORD en Vercel." });
  if (!safeEqual(req.headers["x-admin-password"], configuredPassword)) {
    return res.status(401).json({ error: "Contraseña de administración incorrecta." });
  }

  if (req.body && req.body.action === "verify") return res.status(200).json({ ok: true });

  try {
    const incoming = req.body && req.body.products;
    if (!Array.isArray(incoming) || incoming.length > 500) {
      return res.status(400).json({ error: "El catálogo debe contener una lista válida de hasta 500 artículos." });
    }
    const products = [];
    for (const source of incoming) {
      const product = cleanProduct(source);
      const photoData = String(source.photoData || "");
      if (photoData.startsWith("data:image/")) {
        const match = photoData.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
        if (!match) return res.status(400).json({ error: "Una fotografía tiene un formato no compatible." });
        const bytes = Buffer.from(match[2], "base64");
        if (bytes.length > 4 * 1024 * 1024) return res.status(413).json({ error: "Una fotografía supera el límite de 4 MB." });
        const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
        const blob = await put("snake-island/products/" + product.id + "." + extension, bytes, {
          access: "public",
          token,
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: match[1]
        });
        product.image = blob.url;
      }
      products.push(product);
    }
    const blob = await put(CATALOG_PATH, JSON.stringify({ products, updatedAt: Date.now() }), {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });
    return res.status(200).json({ ok: true, products, updatedAt: Date.now(), catalogUrl: blob.url });
  } catch (error) {
    console.error("Shared catalog write failed:", error.message);
    return res.status(400).json({ error: error.message || "No se pudo guardar el catálogo." });
  }
};