export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "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",
        "anthropic-version": "2023-06-01",
      },
      body,
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
