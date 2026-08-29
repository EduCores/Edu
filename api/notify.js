export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // Notificaciones al dueño vía CallMeBot (gratis). Requiere:
  //   CALLMEBOT_API_KEY  -> tu apikey personal (ver README/instrucciones)
  //   WHATSAPP_TO        -> número destino (default: dueño)
  const apikey = process.env.CALLMEBOT_API_KEY;
  const to = (process.env.WHATSAPP_TO || '56937479835').replace(/[^0-9]/g, '');
  if (!apikey) {
    res.status(200).json({ notified: false, reason: 'CALLMEBOT_API_KEY no configurada en Vercel' });
    return;
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) { /* body inválido: seguimos con valores por defecto */ }

  const event = (body.event || 'cliente_en_linea').toString().slice(0, 100);
  const page = (body.page || '').toString().slice(0, 300);
  const time = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

  const text = event === 'cliente_en_linea'
    ? `🔔 Agente Phy: hay un cliente en línea en el chat.\n🕐 ${time}\n📄 ${page || '(página no indicada)'}`
    : `🔔 Agente Phy: ${event}\n🕐 ${time}\n📄 ${page}`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B${to}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;

  try {
    const r = await fetch(url);
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      res.status(200).json({ notified: false, reason: `CallMeBot respondió ${r.status}`, detail: detail.slice(0, 200) });
      return;
    }
    res.status(200).json({ notified: true });
  } catch (e) {
    res.status(200).json({ notified: false, reason: 'Fallo al contactar CallMeBot' });
  }
}