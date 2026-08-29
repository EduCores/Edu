/* ==========================================================================
   PHYGITAL - INTERACTIVE APP LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Header scroll effect
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 2. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (navLinks.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    });

    // Close menu when clicking a link + smooth scroll to target section
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        navLinks.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';

        // Suave scroll hasta el contenido, despejando el header fijo
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const header = document.querySelector('.header');
            const headerOffset = header ? header.offsetHeight : 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
              top: targetPosition - headerOffset,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }

  // 3. Active Nav Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  });

  // 4. Metodología Carousel Navigation (rectangular prev/next buttons)
  const tabContents = document.querySelectorAll('#metodologia .tab-content');
  const prevBtn = document.getElementById('methodologyPrev');
  const nextBtn = document.getElementById('methodologyNext');

  if (prevBtn && nextBtn && tabContents.length > 0) {
    let currentIndex = Array.from(tabContents).findIndex(tc => tc.classList.contains('active'));
    if (currentIndex < 0) currentIndex = 0;

    function showSlide(index) {
      tabContents.forEach(tc => tc.classList.remove('active'));
      tabContents[index].classList.add('active');
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === tabContents.length - 1;
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        showSlide(currentIndex);
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < tabContents.length - 1) {
        currentIndex++;
        showSlide(currentIndex);
      }
    });
  }

  // 5. Contact Form Handler (Direct to WhatsApp)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('formName').value.trim();
      const email = document.getElementById('formEmail').value.trim();
      const brand = document.getElementById('formBrand').value.trim() || 'No especificada';
      const service = [...document.querySelectorAll('input[name="formService"]:checked')]
        .map(i => i.value)
        .join(', ') || 'No especificada';
      const message = document.getElementById('formMessage').value.trim() || 'Sin mensaje adicional';

      const whatsappText = `Hola Phygital! Mi nombre es ${name} (${email}).
Marca: ${brand}
Servicio de interés: ${service}
Mensaje: ${message}`;

      const encodedUrl = `https://wa.me/56941539918?text=${encodeURIComponent(whatsappText)}`;
      
      // Open WhatsApp in new tab
      window.open(encodedUrl, '_blank');
    });
  }

  // 6. Intersection Observer for Scroll Animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll('.service-card, .philosophy-card, .why-card, .plan-card, .stat-card');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
});

/* ==========================================================================
   CHAT AGENT (n8n-style conversational widget)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chatToggle');
  const chatWidget = document.getElementById('chatWidget');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');
  const chatQuick = document.getElementById('chatQuick');

  if (!chatToggle || !chatWidget) return;

  function openChat() {
    chatWidget.classList.add('open');
    chatWidget.setAttribute('aria-hidden', 'false');
    if (!chatMessages.dataset.started) {
      chatMessages.dataset.started = '1';
      botSay('¡Hola! Soy el Agente Phy 🤖 Conecto lo digital con lo físico: e-commerce Next.js, automatización con IA en n8n, performance y IoT. ¿En qué puedo ayudarte?');
    }
    chatInput.focus();
  }

  function closeChat() {
    chatWidget.classList.remove('open');
    chatWidget.setAttribute('aria-hidden', 'true');
  }

  chatToggle.addEventListener('click', () => {
    chatWidget.classList.contains('open') ? closeChat() : openChat();
  });
  chatClose.addEventListener('click', closeChat);

  function addBubble(text, who) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${who}`;
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function botSay(text) {
    setTimeout(() => addBubble(text, 'bot'), 450);
  }

  // Keyword-based agent responses
  function agentReply(msg) {
    const m = msg.toLowerCase();

    if (/(tienda|e-commerce|ecommerce|next|shop|venta|web|comprar)/.test(m)) {
      return 'Armamos tu tienda en Next.js ultrarrápida con stock híbrido (caché Prisma), ERP en tiempo real y doble pasarela: Webpay Plus y MercadoPago. ¿Ya tienes un e-commerce o partimos de cero?';
    }
    if (/(automat|robot|n8n|agente|ia|whatsapp|carrito|recuper|flujo|crm)/.test(m)) {
      return 'Con n8n creamos flujos autónomos y agentes conversacionales RAG para WhatsApp/Instagram que recuperan carritos abandonados y sincronizan stock y CRM solos. ¿Quieres recuperar carritos o atender clientes 24/7?';
    }
    if (/(iot|domot|sensor|fisic|local|tienda fisica|espacio|tabler|electric|telemetr)/.test(m)) {
      return 'Conectamos tu espacio físico: tableros eléctricos inteligentes, sensores IoT y telemetría en tiempo real que se enlazan con tu e-commerce. ¿Tienes un local o bodega que quieras digitalizar?';
    }
    if (/(performance|meta|ads|capi|roas|publicidad|campa|tráfico|trafico|clientes)/.test(m)) {
      return 'Activamos Meta CAPI server-side y embudos TOFU/MOFU/BOFU para recuperar la señal de conversión y maximizar tu ROAS. ¿Hoy pautas en Meta Ads?';
    }
    if (/(genai|video|imagen|reel|foto|creativ|diseño|marca|publicidad creativa)/.test(m)) {
      return 'Nuestra GenAI Creative Factory genera video, Reels, fotografía sintética e creativos de publicidad on-brand con tu voz. ¿Necesitas contenido recurrente o una campaña puntual?';
    }
    if (/(precio|plan|costo|valor|presupuesto|planer|mensual)/.test(m)) {
      return 'Tenemos 3 reteners mensuales: Ecosistema Digital, Ecosistema Phygital (el más elegido) y Phygital Enterprise con IoT. ¿Quieres que te pase el detalle por WhatsApp?';
    }
    if (/(hola|buenas|hey|saludo)/.test(m)) {
      return '¡Hola! Cuéntame en qué etapa está tu negocio: ¿solo digital, o con un espacio físico por conectar?';
    }
    if (/(gracias|genial|perfecto|ok|listo|excelente)/.test(m)) {
      return '¡A tus órdenes! Cuando quieras agendamos un diagnóstico phygital gratuito. ¿Seguimos por acá o prefieres WhatsApp?';
    }
    if (/(contacto|hablar|agendar|reunion|reunión|diagnostico|diagnóstico|humano)/.test(m)) {
      return 'Claro, agendamos un diagnóstico phygital sin costo. Escríbenos por WhatsApp 👉 https://wa.me/56941539918 o déjanos tus datos en el formulario de contacto.';
    }
    return 'Entendido. Puedo ayudarte con: (1) tienda Next.js, (2) automatización con IA en n8n, (3) performance y Meta CAPI, (4) IoT y domótica, o (5) contenido GenAI. ¿Por cuál vamos?';
  }

  // === Agente conectado vía serverless function de Vercel (/api/chat) ===
  // La API key de Gemini vive en la env var GEMINI_API_KEY de Vercel, nunca en el navegador.
  // En local (sin Vercel) el agente cae al respaldo por palabras clave (agentReply).
  const CHAT_API_URL = '/api/chat';

  let chatHistory = [];

  async function callAgent(userText) {
    chatHistory.push({ role: 'user', text: userText });
    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: chatHistory })
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data.reply || data.output || data.text;
      if (!text) return null;
      chatHistory.push({ role: 'model', text });
      return text.trim();
    } catch (e) {
      return null;
    }
  }

  async function sendUser(text) {
    addBubble(text, 'user');
    const reply = await callAgent(text);
    botSay(reply || agentReply(text));
  }

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    sendUser(text);
  }

  chatSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  if (chatQuick) {
    chatQuick.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const map = {
          tienda: 'Quiero una tienda online',
          automatizar: 'Necesito automatizar con IA',
          iot: 'Quiero conectar mi local físico',
          precio: '¿Cuáles son los planes y precios?'
        };
        const q = chip.dataset.q;
        const text = map[q] || chip.textContent;
        sendUser(text);
      });
    });
  }
});
