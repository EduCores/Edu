export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'GEMINI_API_KEY no configurada en Vercel' }); return; }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }

  const message = (body.message || '').toString().slice(0, 2000);
  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];

  if (!message) { res.status(400).json({ error: 'Mensaje vacío' }); return; }

  const systemInstruction = {
    role: 'user',
    parts: [{
      text: 'Eres el Agente Phy, el asistente conversacional de Phygital, una agencia phygital (lo digital + lo físico). ' +
        'Ayudas a dueños de negocios a conectar su inteligencia artificial con su infraestructura real: ' +
        'tiendas Next.js, automatización, performance/Meta CAPI, IoT y domótica, y contenido GenAI. ' +
        'Responde en español, de forma cercana y conversacional, de manera breve y concisa, el proposito es guiar a nuestro cliente y encontrar la mejor solución y con cierre natural. ' +
        'Si preguntan por precios o planes, menciona los 3 tiers (Ecosistema Digital, Ecosistema Phygital y Phygital Enterprise) ' +
        'y deriva a WhatsApp https://wa.me/56941539918 o al formulario de contacto. ' +
        'No inventes precios exactos; invita a agendar un diagnóstico phygital gratuito.'
    }]
  };

  const contents = [
    ...history.map(h => ({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: (h.content || h.text || '').toString() }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    // Modelo configurable vía env var GEMINI_MODEL (default: gemini-3.6-flash)
  const model = (process.env.GEMINI_MODEL || 'gemini-3.6-flash').trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
      })
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg = data && data.error && data.error.message ? data.error.message : 'Error de Gemini';
      res.status(502).json({ error: errMsg });
      return;
    }

    const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts)
      ? data.candidates[0].content.parts.map(p => p.text).join('')
      : 'No pude generar una respuesta en este momento.';

    res.status(200).json({ reply: reply.trim() });
  } catch (e) {
    res.status(500).json({ error: 'Fallo al contactar Gemini' });
  }
}
