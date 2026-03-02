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
        max_tokens: 300
      })
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('OpenRouter error:', response.status, text);
      return res.status(502).json({ error: 'OpenRouter error', detail: text, status: response.status });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
