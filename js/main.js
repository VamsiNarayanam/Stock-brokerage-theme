/**
 * STACKLY — main interactions
 * Nav, AOS, tickers, forms, dashboards, charts
 */
(function () {
  'use strict';

  /* ---------- Homepage preloader (1.5s) ---------- */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const hidePreloader = () => {
      preloader.classList.add('is-done');
      document.body.classList.remove('is-preload');
      window.setTimeout(() => {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 500);
    };
    window.setTimeout(hidePreloader, 1500);
  }

  /* ---------- Header scroll ---------- */
  const header = document.querySelector('.site-header');
  if (header && !header.classList.contains('always-solid')) {
    const onScroll = () => {
      header.classList.toggle('is-solid', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  const overlay = document.querySelector('.nav-overlay');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'ri-menu-line';
    }
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!nav) return;
    nav.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      const icon = toggle.querySelector('i');
      if (icon) icon.className = 'ri-close-line';
    }
    document.body.style.overflow = 'hidden';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeNav() : openNav();
    });
  }
  if (overlay) overlay.addEventListener('click', closeNav);
  if (nav) {
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });
  }

  /* ---------- AOS ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero background video ---------- */
  const heroVideo = document.querySelector('.hero-video');
  const heroFallback = document.querySelector('.hero-fallback');
  if (heroVideo) {
    if (prefersReduced) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      if (heroFallback) heroFallback.hidden = false;
    } else {
      const playHero = () => {
        const play = heroVideo.play();
        if (play && typeof play.catch === 'function') {
          play.catch(() => {
            heroVideo.style.display = 'none';
            if (heroFallback) heroFallback.hidden = false;
          });
        }
      };
      if (heroVideo.readyState >= 2) playHero();
      else heroVideo.addEventListener('loadeddata', playHero, { once: true });
    }
  }

  if (typeof AOS !== 'undefined') {
    if (prefersReduced) {
      document.querySelectorAll('[data-aos]').forEach((el) => {
        el.removeAttribute('data-aos');
        el.removeAttribute('data-aos-delay');
      });
    } else {
      AOS.init({
        once: true,
        duration: 700,
        easing: 'ease-out-cubic',
        offset: 80,
      });
    }
  }

  /* ---------- Why proof counters ---------- */
  const whyProof = document.querySelector('.why-proof');
  if (whyProof) {
    const counters = whyProof.querySelectorAll('.why-count[data-count]');
    let started = false;

    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      if (Number.isNaN(target)) return;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const duration = prefersReduced ? 0 : 1400;
      const start = performance.now();

      if (duration === 0) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = target * eased;
        el.textContent = prefix + value.toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };

    const run = () => {
      if (started) return;
      started = true;
      counters.forEach(animateCount);
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              run();
              io.disconnect();
            }
          });
        },
        { threshold: 0.35 }
      );
      io.observe(whyProof);
    } else {
      run();
    }
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-board-list, .faq-desk-list, .contact-faq-list').forEach((faqList) => {
    faqList.querySelectorAll('.faq-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const willOpen = !item.classList.contains('is-open');
        if (!willOpen && faqList.classList.contains('contact-faq-list')) return;

        faqList.querySelectorAll('.faq-item').forEach((other) => {
          const otherBtn = other.querySelector('.faq-trigger');
          const otherPanel = other.querySelector('.faq-panel');
          other.classList.remove('is-open');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherPanel) otherPanel.hidden = true;
        });

        if (willOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          const panel = item.querySelector('.faq-panel');
          if (panel) panel.hidden = false;
        }
      });
    });
  });

  /* ---------- Shared Swiper helpers ---------- */
  const swiperAutoplay = prefersReduced
    ? false
    : { delay: 4800, disableOnInteraction: false, pauseOnMouseEnter: true };

  const bindVisibilityPause = (instance) => {
    if (!instance || !instance.autoplay) return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) instance.autoplay.stop();
      else if (!prefersReduced) instance.autoplay.start();
    });
  };

  /* ---------- Why Stackly autoslide ---------- */
  const whyRoot = document.querySelector('.why-swiper');
  if (whyRoot && typeof Swiper !== 'undefined') {
    const whySwiper = new Swiper(whyRoot, {
      loop: true,
      speed: 750,
      spaceBetween: 18,
      slidesPerView: 1,
      autoplay: swiperAutoplay,
      pagination: {
        el: '.why-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.why-next',
        prevEl: '.why-prev',
      },
      a11y: {
        prevSlideMessage: 'Previous reason',
        nextSlideMessage: 'Next reason',
      },
    });
    bindVisibilityPause(whySwiper);
  }

  /* ---------- Services autoslide ---------- */
  const servicesRoot = document.querySelector('.services-swiper');
  if (servicesRoot && typeof Swiper !== 'undefined') {
    const servicesSwiper = new Swiper(servicesRoot, {
      loop: true,
      speed: 700,
      spaceBetween: 18,
      slidesPerView: 1.12,
      breakpoints: {
        560: { slidesPerView: 1.45, spaceBetween: 18 },
        768: { slidesPerView: 2.15, spaceBetween: 20 },
        1100: { slidesPerView: 3, spaceBetween: 22 },
      },
      autoplay: swiperAutoplay,
      pagination: {
        el: '.services-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.svc-next',
        prevEl: '.svc-prev',
      },
      a11y: {
        prevSlideMessage: 'Previous service',
        nextSlideMessage: 'Next service',
      },
    });
    bindVisibilityPause(servicesSwiper);
  }

  /* ---------- Clients autoslide (Swiper) ---------- */
  const clientsRoot = document.querySelector('.clients-swiper');
  if (clientsRoot && typeof Swiper !== 'undefined') {
    const progressBar = document.querySelector('.clients-progress-bar');
    const AUTO_MS = 5200;

    const resetProgress = () => {
      if (!progressBar || prefersReduced) return;
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      void progressBar.offsetWidth;
      progressBar.style.transition = `width ${AUTO_MS}ms linear`;
      progressBar.style.width = '100%';
    };

    const clientsSwiper = new Swiper(clientsRoot, {
      loop: true,
      speed: 700,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoHeight: true,
      autoplay: prefersReduced
        ? false
        : {
            delay: AUTO_MS,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
      pagination: {
        el: '.clients-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.clients-next',
        prevEl: '.clients-prev',
      },
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous client story',
        nextSlideMessage: 'Next client story',
      },
      on: {
        init: resetProgress,
        slideChangeTransitionStart: resetProgress,
        autoplayStop: () => {
          if (progressBar) {
            progressBar.style.transition = 'none';
            progressBar.style.width = '0%';
          }
        },
        autoplayStart: resetProgress,
      },
    });

    bindVisibilityPause(clientsSwiper);
  }

  /* ---------- Live ticker pulse values ---------- */
  const tickers = document.querySelectorAll('[data-ticker-price]');
  if (tickers.length && !prefersReduced) {
    setInterval(() => {
      tickers.forEach((el) => {
        const base = parseFloat(el.dataset.tickerPrice);
        if (Number.isNaN(base)) return;
        const delta = (Math.random() - 0.48) * base * 0.0015;
        const next = base + delta;
        el.dataset.tickerPrice = next.toFixed(2);
        const isInt = base > 1000;
        el.textContent = isInt
          ? next.toLocaleString('en-IN', { maximumFractionDigits: 2 })
          : next.toFixed(2);

        const chip = el.closest('.market-chip');
        const changeEl =
          el.parentElement.querySelector('.ticker-change') ||
          (chip && chip.querySelector('.market-chip-change'));
        if (changeEl) {
          const pct = ((delta / base) * 100).toFixed(2);
          const up = delta >= 0;
          changeEl.classList.toggle('up', up);
          changeEl.classList.toggle('down', !up);
          changeEl.textContent = (up ? '+' : '') + pct + '%';
        }
      });
    }, 3200);
  }

  /* ---------- Blog filters ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const blogCards = document.querySelectorAll('[data-category]');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      blogCards.forEach((card) => {
        const show = cat === 'all' || card.dataset.category === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------- Password show / hide ---------- */
  document.querySelectorAll('[data-password-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.closest('.password-field');
      const input = field && field.querySelector('input');
      const icon = btn.querySelector('i');
      if (!input) return;

      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', show ? 'true' : 'false');
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      if (icon) icon.className = show ? 'ri-eye-off-line' : 'ri-eye-line';
    });
  });

  /* ---------- Contact / auth form validation ---------- */
  const authParams = new URLSearchParams(window.location.search);
  const showSignedUp = document.querySelector('[data-signed-up]');
  if (showSignedUp && authParams.get('created') === '1') {
    showSignedUp.hidden = false;
  }

  const presetRole = authParams.get('role');
  if (presetRole === 'admin' || presetRole === 'client') {
    const roleInput = document.querySelector(`input[name="role"][value="${presetRole}"]`);
    if (roleInput) roleInput.checked = true;
  }

  const fieldMessage = (field) => {
    const value = String(field.value || '').trim();
    const empty = field.type === 'checkbox' ? !field.checked : !value;
    const emailBad = field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const tooShort = field.minLength > 0 && value && value.length < field.minLength;
    const phoneBad = field.type === 'tel' && value && value.replace(/\D/g, '').length < 10;
    let mismatch = false;
    if (field.dataset.match) {
      const other = document.querySelector(field.dataset.match);
      mismatch = !!other && value !== other.value;
    }
    return {
      empty,
      emailBad,
      tooShort,
      phoneBad,
      mismatch,
      bad: empty || emailBad || tooShort || phoneBad || mismatch,
    };
  };

  const paintField = (field) => {
    const group = field.closest('.form-group') || field.closest('.form-check');
    const state = fieldMessage(field);
    field.classList.toggle('is-invalid', state.bad);
    if (group) group.classList.toggle('has-error', state.bad);
    return !state.bad;
  };

  document.querySelectorAll('[data-validate]').forEach((form) => {
    form.querySelectorAll('[required]').forEach((field) => {
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid') || field.dataset.match) paintField(field);
        if (field.id === 'password') {
          const confirm = form.querySelector('[data-match="#password"]');
          if (confirm && confirm.classList.contains('is-invalid')) paintField(confirm);
        }
      });
      field.addEventListener('change', () => {
        if (field.classList.contains('is-invalid')) paintField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        if (!paintField(field)) valid = false;
      });

      if (!valid) {
        const first = form.querySelector('.is-invalid');
        if (first) first.focus();
        return;
      }

      const success = form.parentElement.querySelector('.form-success');
      if (success) success.classList.add('is-visible');

      const role = form.querySelector('input[name="role"]:checked');
      let next = form.dataset.redirect || '';
      if (form.dataset.auth === 'login') {
        const chosen = role && role.value === 'admin' ? 'admin' : 'client';
        const nameField = form.querySelector('[name="name"]');
        const emailField = form.querySelector('[name="email"]');
        try {
          sessionStorage.setItem(
            'stacklyUser',
            JSON.stringify({
              name: nameField ? nameField.value.trim() : '',
              email: emailField ? emailField.value.trim() : '',
              role: chosen,
            })
          );
        } catch (_) {
          /* ignore storage failures in private mode */
        }
        next = chosen === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html';
      } else if (form.dataset.auth === 'signup') {
        const chosen = role && role.value === 'admin' ? 'admin' : 'client';
        next = `login.html?created=1&role=${chosen}`;
      }

      form.reset();
      if (next) {
        window.setTimeout(() => {
          window.location.href = next;
        }, 700);
      }
    });
  });

  /* ---------- Newsletter ---------- */
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.setAttribute('action', '404.html');
    form.setAttribute('method', 'get');
    form.setAttribute('novalidate', '');

    const ensureStatus = (className) => {
      const parent = form.parentElement;
      if (!parent) return null;
      let el = parent.querySelector('.' + className);
      if (!el) {
        el = document.createElement('p');
        el.className = className;
        form.insertAdjacentElement('afterend', el);
      }
      return el;
    };

    const clearError = () => {
      const err = form.parentElement && form.parentElement.querySelector('.newsletter-error');
      if (err) err.hidden = true;
      const input = form.querySelector('input[type="email"]');
      if (input) input.classList.remove('is-invalid');
    };

    const input = form.querySelector('input[type="email"]');
    if (input) {
      input.addEventListener('input', clearError);
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const emailInput = form.querySelector('input[type="email"]');
      const value = emailInput ? String(emailInput.value || '').trim() : '';
      const success = form.parentElement && form.parentElement.querySelector('.newsletter-success');

      if (!value) {
        if (success) success.hidden = true;
        const err = ensureStatus('newsletter-error');
        if (err) {
          err.textContent = 'Fill email';
          err.setAttribute('role', 'alert');
          err.hidden = false;
        }
        if (emailInput) {
          emailInput.classList.add('is-invalid');
          emailInput.focus();
        }
        return;
      }

      clearError();
      const msg = ensureStatus('newsletter-success');
      if (msg) {
        msg.textContent = 'Subscribed — thank you';
        msg.setAttribute('role', 'status');
        msg.hidden = false;
      }
      form.reset();

      window.setTimeout(() => {
        window.location.href = '404.html';
      }, 700);
    });
  });

  /* ---------- Dashboard sidebar ---------- */
  const dashSidebar = document.querySelector('.dash-sidebar');
  const dashMenuBtn = document.querySelector('.dash-menu-btn');
  const dashClose = document.querySelector('.dash-close');
  const dashOverlay = document.querySelector('.dash-overlay');

  function closeDash() {
    if (!dashSidebar) return;
    dashSidebar.classList.remove('is-open');
    if (dashOverlay) dashOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function openDash() {
    if (!dashSidebar) return;
    dashSidebar.classList.add('is-open');
    if (dashOverlay) dashOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  if (dashMenuBtn) dashMenuBtn.addEventListener('click', openDash);
  if (dashClose) dashClose.addEventListener('click', closeDash);
  if (dashOverlay) dashOverlay.addEventListener('click', closeDash);

  let stacklyUser = null;
  try {
    stacklyUser = JSON.parse(sessionStorage.getItem('stacklyUser') || 'null');
  } catch (_) {
    stacklyUser = null;
  }

  if (stacklyUser) {
    document.querySelectorAll('[data-user-name]').forEach((el) => {
      el.textContent = stacklyUser.name || 'Guest';
    });
    document.querySelectorAll('[data-user-email]').forEach((el) => {
      el.textContent = stacklyUser.email || '—';
    });
  }

  document.querySelectorAll('[data-logout]').forEach((link) => {
    link.addEventListener('click', () => {
      try {
        sessionStorage.removeItem('stacklyUser');
      } catch (_) {
        /* ignore */
      }
    });
  });

  const viewTitle = document.querySelector('[data-view-title]');
  const viewLinks = document.querySelectorAll('[data-view]');
  const viewPanels = document.querySelectorAll('[data-view-panel]');
  const isAdminDash = document.body.dataset.dash === 'admin';
  const viewTitles = {
    overview: isAdminDash ? 'Admin overview' : 'Overview',
    markets: 'Markets',
    orders: 'Orders',
    holdings: 'Holdings',
    'mutual-funds': 'Mutual Funds',
    funds: 'Funds',
    reports: 'Reports',
    settings: 'Settings',
    users: 'Users',
    kyc: 'KYC queue',
    deposits: 'Deposits / Withdrawals',
    volume: 'Trade volume',
    support: 'Support tickets',
    cms: 'CMS posts',
  };

  const showDashView = (id) => {
    if (!viewPanels.length) return;
    const target = id && document.querySelector(`[data-view-panel="${id}"]`) ? id : 'overview';
    viewPanels.forEach((panel) => {
      const on = panel.dataset.viewPanel === target;
      panel.classList.toggle('is-active', on);
      panel.hidden = !on;
    });
    viewLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.view === target);
    });
    if (viewTitle) viewTitle.textContent = viewTitles[target] || target;
    if (window.location.hash !== `#${target}`) {
      history.replaceState(null, '', `#${target}`);
    }
    closeDash();
  };

  if (viewPanels.length) {
    viewLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showDashView(link.dataset.view);
      });
    });
    const fromHash = window.location.hash.replace(/^#/, '');
    showDashView(fromHash || 'overview');
  }

  /* ---------- Charts ---------- */
  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#5B6B7C';

    const equityCanvas = document.getElementById('equityChart');
    if (equityCanvas) {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
      const data = [820000, 845000, 831000, 868000, 890000, 875000, 912000, 938000, 955000, 984250];
      new Chart(equityCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Portfolio',
              data,
              borderColor: '#00C853',
              backgroundColor: 'rgba(0, 200, 83, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: {
              grid: { color: '#E2E8F0' },
              ticks: {
                callback: (v) => '₹' + (v / 1000).toFixed(0) + 'k',
              },
            },
          },
        },
      });
    }

    const volumeOpts = {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Trade volume (Cr)',
            data: [42, 38, 55, 48, 61, 22, 18],
            backgroundColor: '#0B1F3A',
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#E2E8F0' } },
        },
      },
    };

    const volumeCanvas = document.getElementById('volumeChart');
    if (volumeCanvas) new Chart(volumeCanvas, volumeOpts);

    const volumeAlt = document.getElementById('volumeChartAlt');
    if (volumeAlt) new Chart(volumeAlt, JSON.parse(JSON.stringify(volumeOpts)));

    const usersCanvas = document.getElementById('usersChart');
    if (usersCanvas) {
      new Chart(usersCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Active', 'Pending KYC', 'Inactive'],
          datasets: [
            {
              data: [12840, 962, 2140],
              backgroundColor: ['#00C853', '#F5A623', '#0B1F3A'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
          },
          cutout: '68%',
        },
      });
    }
  }
})();
