// api/shorten.js — stores playlist data in Firestore via REST API (no env vars needed)

const FIREBASE_PROJECT = 'copiumai-9f5b6';
const FIREBASE_API_KEY  = 'AIzaSyBuPTw6WpRTWSDhs_L_W9OELFP6ff6Ki0c';
const FIRESTORE_BASE    = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

function makeCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function firestoreGet(collection, docId) {
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
  return await res.json();
}

async function firestoreSet(collection, docId, data) {
  // Build Firestore document fields
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string')  fields[k] = { stringValue: v };
    if (typeof v === 'number')  fields[k] = { integerValue: String(v) };
    if (typeof v === 'boolean') fields[k] = { booleanValue: v };
  }
  const url = `${FIRESTORE_BASE}/${collection}/${docId}?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore SET failed: ${res.status} ${text}`);
  }
  return await res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data } = req.body;
    if (!data || typeof data !== 'string') return res.status(400).json({ error: 'data required' });
    if (data.length > 50000) return res.status(400).json({ error: 'Payload too large' });

    // Try up to 5 codes to find a unique one
    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = makeCode();
      const existing = await firestoreGet('shortlinks', candidate);
      if (!existing) { code = candidate; break; }
    }
    if (!code) code = makeCode() + Date.now().toString(36).slice(-2); // fallback guaranteed unique

    await firestoreSet('shortlinks', code, {
      data,
      createdAt: Date.now(),
      hits: 0
    });

    return res.status(200).json({
      code,
      url: `https://aellium.vercel.app/r/${code}`
    });
  } catch (err) {
    console.error('shorten error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
