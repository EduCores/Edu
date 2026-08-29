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

  // === Diagnóstico de sitios: si el mensaje incluye un link, descargamos y extraemos su contenido ===
  const urlMatch = message.match(/https?:\/\/[^\s"'<>)]+/i);
  let siteContext = '';
  if (urlMatch) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const pageRes = await fetch(urlMatch[0], {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PhygitalAudit/1.0)' }
      });
      clearTimeout(timeout);
      const ctype = (pageRes.headers.get('content-type') || '').toLowerCase();
      if (ctype.includes('html')) {
        const html = (await pageRes.text()).slice(0, 400000);
        const clean = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
        const desc = clean((html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '');
        const h1 = clean((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000);
        siteContext = `URL: ${urlMatch[0]}\nTítulo: ${title}\nMeta description: ${desc}\nH1 principal: ${h1}\nTexto visible (recorte): ${text}`;
      } else {
        siteContext = `El sitio respondió con content-type "${ctype || 'desconocido'}": no es una página HTML analizable.`;
      }
    } catch (e) {
      siteContext = 'No se pudo acceder al sitio desde el servidor (bloqueo, timeout o caída).';
    }
  }

  const systemText = 'Eres el Agente Phy, asistente de la agencia Phygital: conectamos lo digital con lo físico ' +
    '(tiendas Next.js, automatización agéntica, performance/Meta CAPI, IoT y domótica, contenido GenAI). ' +
    'REGLA PRINCIPAL (innegociable): responde SIEMPRE en español con MÁXIMO 2 oraciones cortas, ' +
    'sin superar 40 palabras en total. Cero relleno, cero introducciones, cero resúmenes finales. ' +
    'Prohibido usar listas, viñetas, encabezados o varios párrafos: solo un bloque de texto breve. ' +
    'Ve directo al punto y termina con UNA pregunta corta que invite a avanzar (diagnóstico phygital gratuito). ' +
    'Si preguntan por precios, menciona solo que existen 3 planes (Ecosistema Digital, Ecosistema Phygital y Phygital Enterprise), ' +
    'no inventes cifras y deriva a WhatsApp https://wa.me/56937479835 o al formulario de contacto.' +
    (siteContext
      ? ' EXCEPCIÓN: el usuario compartió el link de su sitio web para que lo audites. En ese caso entrega un MINI DIAGNÓSTICO ' +
        'con tres secciones en líneas separadas: "✅ Fortalezas" (1-2 puntos), "⚠️ Falencias" (2-3 puntos), "🚀 Oportunidades" (2-3 puntos). ' +
        'Cada punto en una línea corta de máximo 12 palabras, empezando con "•". Cierra con UNA pregunta para agendar la auditoría phygital completa. ' +
        'En este caso SÍ puedes usar viñetas. Basa el análisis EXCLUSIVAMENTE en el contenido recuperado del sitio; ' +
        'si el contenido falló o quedó vacío, dilo en una frase y ofrece revisarlo manualmente por WhatsApp.'
      : '');

  const systemInstruction = {
    role: 'user',
    parts: [{ text: systemText }]
  };

  const contents = [
    ...history.map(h => ({
      role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
      parts: [{ text: (h.content || h.text || '').toString() }]
    })),
    {
      role: 'user',
      parts: [{ text: siteContext ? `${message}\n\n[CONTENIDO RECUPERADO DEL SITIO]\n${siteContext}` : message }]
    }
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
