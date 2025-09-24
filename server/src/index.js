require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');

const PORT = process.env.PORT || 8080;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!GOOGLE_CLIENT_ID) {
  console.warn('[warn] GOOGLE_CLIENT_ID not set. /api/auth/verify will reject requests.');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: 'Missing credential' });
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Server missing GOOGLE_CLIENT_ID' });

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const teacher = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub
    };
    res.json({ teacher });
  } catch (err) {
    console.error('verify error', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { essayText, rubric = 'basic', explain = false, model } = req.body || {};
    if (!essayText || typeof essayText !== 'string') return res.status(400).json({ error: 'Missing essayText' });
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });

    const rubricText = rubric === 'mechanics' ? 'prioritize mechanics (spelling, punctuation, grammar) over content' :
                       rubric === 'evidence' ? 'prioritize use of evidence, reasoning, and organization' :
                       rubric === 'customary' ? 'use a supportive classroom tone and actionable phrasing' :
                       'balance grammar, clarity, and organization';
    const explainText = explain ? 'For each suggestion include a brief "Why:" explanation with a cited rule or example.' : 'Keep suggestions concise without explanations.';
    const sysPrompt = `You are an expert English teacher. Use the rubric directive: ${rubricText}. ${explainText} Provide: 1) bullet grammar corrections summary, 2) bullet clarity suggestions, 3) an overall score from 0-100 labeled "score:" on its own line at the end.`;
    const userPrompt = `Essay to review:\n\n${essayText}\n\nReturn concise feedback.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: model || OPENAI_MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`OpenAI error: ${resp.status} ${txt}`);
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    let score = 0;
    const lines = text.trim().split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].toLowerCase().match(/score\s*[:\-]\s*(\d{1,3})/);
      if (m) { score = Math.min(100, parseInt(m[1], 10)); break; }
    }
    return res.json({ grammar: text, clarity: '', score: isNaN(score) ? 0 : score, raw: text });
  } catch (err) {
    console.error('analyze error', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Serve static frontend (optional convenience)
const staticRoot = path.resolve(__dirname, '..', '..');
app.use(express.static(staticRoot));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


