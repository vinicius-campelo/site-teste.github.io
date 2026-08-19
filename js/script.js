// ===================== ALTO NÍVEL — script.js =====================

document.addEventListener('DOMContentLoaded', () => {

  // ---- Ano dinâmico no rodapé ----
  const anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  // ---- Menu mobile ----
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Cabeçalho: sombra ao rolar ----
  const header = document.querySelector('.site-header');
  const onScrollHeader = () => {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 8
      ? '0 6px 18px -10px rgba(2,22,39,.6)'
      : '0 1px 0 rgba(252,254,252,.14)';
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  // ---- Ícones "desenhados" (blueprint) ao entrar na tela ----
  const drawables = document.querySelectorAll('.icon-draw');
  if ('IntersectionObserver' in window && drawables.length) {
    // ajusta stroke-dasharray ao comprimento real do traço, para um desenho preciso
    drawables.forEach(svg => {
      svg.querySelectorAll('path, rect, circle, ellipse').forEach(shape => {
        try {
          const length = shape.getTotalLength ? shape.getTotalLength() : 200;
          shape.style.strokeDasharray = length;
          shape.style.strokeDashoffset = length;
        } catch (e) { /* alguns elementos (ellipse) podem não suportar em navegadores antigos */ }
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const shapes = entry.target.querySelectorAll('path, rect, circle, ellipse');
          shapes.forEach(shape => { shape.style.strokeDashoffset = 0; });
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    drawables.forEach(svg => io.observe(svg));
  } else {
    drawables.forEach(svg => svg.classList.add('in-view'));
  }

  // ---- Reveal suave dos cards ao rolar ----
  const revealTargets = document.querySelectorAll('.mvv-card, .service-card, .info-card');
  revealTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
  });
  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealTargets.forEach(el => revealIO.observe(el));
  } else {
    revealTargets.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
  }

  // ---- Máscara simples de telefone ----
  const telInput = document.getElementById('telefone');
  if (telInput) {
    telInput.addEventListener('input', () => {
      let v = telInput.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) {
        v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2})/, '($1');
      }
      telInput.value = v;
    });
  }

  // ---- Validação + envio dinâmico do formulário de contato ----
  const form = document.getElementById('contatoForm');
  const feedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');

  const validators = {
    nome: v => v.trim().length >= 3 ? '' : 'Informe seu nome completo.',
    telefone: v => v.replace(/\D/g, '').length >= 10 ? '' : 'Informe um telefone válido com DDD.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Informe um e-mail válido.',
    servico: v => v ? '' : 'Selecione um serviço.'
  };

  function validateField(field) {
    const rule = validators[field.name];
    if (!rule) return true;
    const message = rule(field.value);
    const row = field.closest('.form-row');
    const errorEl = form.querySelector(`[data-error-for="${field.name}"]`);
    if (message) {
      row.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
      return false;
    }
    row.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    return true;
  }

  if (form) {
    ['nome', 'telefone', 'email', 'servico'].forEach(name => {
      const field = form.elements[name];
      if (field) field.addEventListener('blur', () => validateField(field));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let valid = true;
      ['nome', 'telefone', 'email', 'servico'].forEach(name => {
        const field = form.elements[name];
        if (field && !validateField(field)) valid = false;
      });

      if (!valid) {
        feedback.textContent = 'Confira os campos destacados antes de enviar.';
        feedback.className = 'form-feedback error';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      feedback.textContent = '';
      feedback.className = 'form-feedback';

      try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        // Mesmo que contato.php ainda não esteja hospedado com servidor de e-mail,
        // tratamos qualquer resposta 2xx como sucesso e qualquer falha de rede como erro.
        if (response.ok) {
          feedback.textContent = 'Mensagem enviada! Em breve entraremos em contato.';
          feedback.className = 'form-feedback success';
          form.reset();
        } else {
          throw new Error('Falha no envio');
        }
      } catch (err) {
        feedback.textContent = 'Não foi possível enviar agora. Fale com a gente pelo WhatsApp (61) 98672-6059.';
        feedback.className = 'form-feedback error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar orçamento';
      }
    });
  }

});
