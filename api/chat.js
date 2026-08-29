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
      text: 'Eres el Agente Phy, asistente de la agencia Phygital: conectamos lo digital con lo físico ' +
        '(tiendas Next.js, automatización agéntica, performance/Meta CAPI, IoT y domótica, contenido GenAI). ' +
        'REGLA PRINCIPAL (innegociable): responde SIEMPRE en español con MÁXIMO 2 oraciones cortas, ' +
        'sin superar 40 palabras en total. Cero relleno, cero introducciones, cero resúmenes finales. ' +
        'Prohibido usar listas, viñetas, encabezados o varios párrafos: solo un bloque de texto breve. ' +
        'Ve directo al punto y termina con UNA pregunta corta que invite a avanzar (diagnóstico phygital gratuito). ' +
        'Si preguntan por precios, menciona solo que existen 3 planes (Ecosistema Digital, Ecosistema Phygital y Phygital Enterprise), ' +
        'no inventes cifras y deriva a WhatsApp https://wa.me/56937479835 o al formulario de contacto.'
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
