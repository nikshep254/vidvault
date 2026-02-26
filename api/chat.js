module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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',
        'HTTP-Referer': 'https://aellium.vercel.app',
        'X-Title': 'aellium chatbot'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        max_tokens: 200,
        temperature: 0.85
      })
    });

    if (!response.ok) {
      const t = await response.text();
      return res.status(502).json({ error: 'OpenRouter error', detail: t });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
