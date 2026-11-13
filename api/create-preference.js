const catalog = {
  "BLUE WORLD TEE": { price: 599, category: "wear" },
  "WORLD HOODIE": { price: 899, category: "wear" },
  "SMILE CAP": { price: 499, category: "accessories" },
  "BLUE TOTE BAG": { price: 399, category: "accessories" }
};
const sizes = new Set(["chica", "mediana", "grande"]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
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
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: "Uno de los artículos no está disponible para pago en línea." });
    }
    if (product.category === "wear" && !sizes.has(item.size)) {
      return res.status(400).json({ error: "Selecciona talla chica, mediana o grande." });
    }
    preferenceItems.push({
      title: item.name + (item.size ? " / Talla " + item.size : ""),
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
