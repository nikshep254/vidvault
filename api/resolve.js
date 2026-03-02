// api/resolve.js — reads a short code from Firestore via REST API (no env vars needed)

const FIREBASE_PROJECT = 'copiumai-9f5b6';
const FIREBASE_API_KEY  = 'AIzaSyBuPTw6WpRTWSDhs_L_W9OELFP6ff6Ki0c';
const FIRESTORE_BASE    = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code } = req.query;
  if (!code || !/^[a-z0-9]{4,10}$/.test(code)) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  try {
    const url = `${FIRESTORE_BASE}/shortlinks/${code}?key=${FIREBASE_API_KEY}`;
    const firestoreRes = await fetch(url);

    if (firestoreRes.status === 404) {
      return res.status(404).json({ error: 'Link not found' });
    }
    if (!firestoreRes.ok) {
      return res.status(502).json({ error: 'Firestore error', status: firestoreRes.status });
    }

    const doc = await firestoreRes.json();
    const data = doc.fields?.data?.stringValue;
    if (!data) return res.status(404).json({ error: 'No data in link' });

    // Increment hits (fire and forget — don't await)
    const hits = parseInt(doc.fields?.hits?.integerValue || '0') + 1;
    fetch(`${FIRESTORE_BASE}/shortlinks/${code}?key=${FIREBASE_API_KEY}&updateMask.fieldPaths=hits`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { hits: { integerValue: String(hits) } } })
    }).catch(() => {});

    return res.status(200).json({ data });
  } catch (err) {
    console.error('resolve error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
};
