const catalog = {
  "SUDADERAS 1 PIEZA": { price: 850, units: 1, category: "wear" },
  "SUDADERAS 10 PIEZAS": { price: 4500, units: 10, category: "wear" },
  "CAPS 3 PIEZAS": { price: 750, units: 3, category: "accessories" },
  "CAPS 5 PIEZAS": { price: 1250, units: 5, category: "accessories" },
  "PLAYERAS 1 PIEZA": { price: 950, units: 1, category: "wear" },
  "PLAYERAS 3 PIEZAS": { price: 2800, units: 3, category: "wear" },
  "SUÉTERES 1 PIEZA": { price: 950, units: 1, category: "wear" },
  "SUÉTERES 3 PIEZAS": { price: 2800, units: 3, category: "wear" }
};
const sizes = new Set(["chica", "mediana", "grande"]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  if (process.env.SNAKE_CATALOG_CONFIRMED !== "true" || process.env.SNAKE_DELIVERY_CONFIRMED !== "true") {
    return res.status(503).json({ error: "Checkout pausado: faltan validar precios, existencias y condiciones de entrega." });
  }
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: "El pago con tarjeta aún no está configurado." });

  const items = req.body && req.body.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    return res.status(400).json({ error: "La bolsa no contiene artículos válidos." });
  }

  const preferenceItems = [];
  for (const item of items) {
    const product = catalog[item && item.name];
    const quantity = Number(item && item.quantity);
    if (!product || !Number.isFinite(product.price) || product.price <= 0 || quantity !== 1) {
      return res.status(400).json({ error: "Uno de los artículos no está disponible para pago en línea." });
    }
    if (product.category === "wear" && (!Array.isArray(item.sizes) || item.sizes.length !== product.units || item.sizes.some(size => !sizes.has(size)))) {
      return res.status(400).json({ error: "Indica las tallas requeridas: chica, mediana o grande." });
    }
    preferenceItems.push({
      title: item.name + (item.sizes && item.sizes.length ? " / Tallas " + item.sizes.join(", ") : ""),
      quantity,
      currency_id: "MXN",
      unit_price: product.price
    });
  }

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: preferenceItems,
        statement_descriptor: "SNAKE ISLAND"
      })
    });
    const data = await response.json();
    if (!response.ok || !data.init_point) {
      console.error("Mercado Pago preference error:", data);
      return res.status(502).json({ error: "Mercado Pago no pudo crear el pago. Intenta de nuevo." });
    }
    return res.status(200).json({ init_point: data.init_point });
  } catch (error) {
    console.error("Mercado Pago connection error:", error);
    return res.status(502).json({ error: "No se pudo conectar con Mercado Pago." });
  }
};
