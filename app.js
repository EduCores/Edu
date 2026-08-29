/* ==========================================================================
   MTR DIGITAL - INTERACTIVE APP LOGIC
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

      const whatsappText = `Hola MTR Digital! Mi nombre es ${name} (${email}).
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
