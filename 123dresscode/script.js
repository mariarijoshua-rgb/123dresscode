/* ══════════════════════════════════════
   123 DRESS CODE — script.js
   Vanilla JavaScript — no frameworks
══════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────
   UTILITY: Select elements safely
────────────────────────────────────── */
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/* ──────────────────────────────────────
   1. STICKY HEADER
   Adds .scrolled class after 10px scroll
────────────────────────────────────── */
(function initStickyHeader() {
  const header = $('#header');
  if (!header) return;

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run once on load
})();

/* ──────────────────────────────────────
   2. ACTIVE NAV LINK
   Highlights nav link for current section
────────────────────────────────────── */
(function initActiveNav() {
  const sections = $$('section[id], div[id]');
  const navLinks = $$('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* ──────────────────────────────────────
   3. MOBILE HAMBURGER MENU
   Opens / closes the full-screen overlay
────────────────────────────────────── */
(function initMobileMenu() {
  const hamburger = $('#hamburger');
  const overlay   = $('#mobile-overlay');
  const closeBtn  = $('#overlay-close');
  const mobileLinks = $$('.mobile-nav-link');

  if (!hamburger || !overlay) return;

  function openMenu() {
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeMenu() : openMenu();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  // Close when a nav link is clicked
  mobileLinks.forEach((link) => link.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeMenu();
  });
})();

/* ──────────────────────────────────────
   4. SMOOTH SCROLL for anchor links
   Respects prefers-reduced-motion
────────────────────────────────────── */
(function initSmoothScroll() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const targetId = anchor.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: prefersReduced ? 'auto' : 'smooth',
      block: 'start',
    });

    // Update URL without jump
    history.pushState(null, '', `#${targetId}`);
  });
})();

/* ──────────────────────────────────────
   5. scrollToOrder(category)
   Called by collection card buttons.
   Pre-selects category in the order form.
────────────────────────────────────── */
function scrollToOrder(category) {
  const orderSection = $('#order');
  const categorySelect = $('#category');

  if (!orderSection) return;

  orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Pre-fill the category dropdown if value exists
  if (categorySelect && category) {
    setTimeout(() => {
      const option = [...categorySelect.options].find(
        (opt) => opt.value === category
      );
      if (option) {
        categorySelect.value = category;
        categorySelect.classList.remove('invalid');
        clearError('err-category');
      }
    }, 600); // Wait for scroll to settle
  }
}

/* ──────────────────────────────────────
   6. ORDER FORM VALIDATION & SUBMISSION
────────────────────────────────────── */
(function initOrderForm() {
  const form         = $('#order-form');
  const submitBtn    = $('#submit-btn');
  const confirmation = $('#order-confirmation');
  const newOrderBtn  = $('#new-order-btn');

  if (!form) return;

  /* ── Validators ── */
  const validators = {
    'full-name': {
      el: () => $('#full-name'),
      errId: 'err-name',
      validate(val) {
        if (!val.trim()) return 'Please enter your full name.';
        if (val.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      },
    },
    phone: {
      el: () => $('#phone'),
      errId: 'err-phone',
      validate(val) {
        if (!val.trim()) return 'Please enter your phone number.';
        // Accept Kenyan formats: 07xx, 01xx, +2547xx, 2547xx (7-15 digits)
        const cleaned = val.replace(/[\s\-\(\)]/g, '');
        if (!/^(\+?254|0)[17]\d{8}$/.test(cleaned)) {
          return 'Enter a valid Kenyan phone number (e.g. 0712 345 678).';
        }
        return '';
      },
    },
    category: {
      el: () => $('#category'),
      errId: 'err-category',
      validate(val) {
        if (!val) return 'Please select a category.';
        return '';
      },
    },
    quantity: {
      el: () => $('#quantity'),
      errId: 'err-quantity',
      validate(val) {
        const num = parseInt(val, 10);
        if (!val.trim()) return 'Please enter a quantity.';
        if (isNaN(num) || num < 1) return 'Quantity must be at least 1.';
        if (num > 100) return 'For bulk orders above 100, please call us directly.';
        return '';
      },
    },
  };

  /* ── Show / clear field errors ── */
  function showError(errId, message) {
    const el = $(`#${errId}`);
    if (el) el.textContent = message;
  }

  function clearError(errId) {
    const el = $(`#${errId}`);
    if (el) el.textContent = '';
  }

  /* ── Validate a single field ── */
  function validateField(key) {
    const v = validators[key];
    if (!v) return true;
    const el = v.el();
    if (!el) return true;
    const error = v.validate(el.value);
    if (error) {
      el.classList.add('invalid');
      showError(v.errId, error);
      return false;
    } else {
      el.classList.remove('invalid');
      clearError(v.errId);
      return true;
    }
  }

  /* ── Live validation on blur ── */
  Object.keys(validators).forEach((key) => {
    const el = validators[key].el();
    if (!el) return;
    el.addEventListener('blur', () => validateField(key));
    el.addEventListener('input', () => {
      if (el.classList.contains('invalid')) validateField(key);
    });
  });

  /* ── Form submission ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate all fields
    let allValid = true;
    Object.keys(validators).forEach((key) => {
      if (!validateField(key)) allValid = false;
    });

    if (!allValid) {
      // Focus the first invalid field
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Collect values
    const name     = $('#full-name').value.trim();
    const phone    = $('#phone').value.trim();
    const category = $('#category').value;
    const quantity = $('#quantity').value.trim();
    const message  = $('#message').value.trim();

    // ── CONNECT BACKEND HERE ──
    // When you have a backend or API, replace the simulateSubmit()
    // call below with a real fetch():
    //
    // fetch('/api/orders', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, phone, category, quantity, message })
    // })
    // .then(res => res.json())
    // .then(data => showConfirmation(name, phone, category))
    // .catch(err => alert('Something went wrong. Please try again.'));

    simulateSubmit({ name, phone, category, quantity, message });
  });

  /* ── Simulated submission (no backend) ── */
  function simulateSubmit({ name, phone, category }) {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      showConfirmation(name, phone, category);
    }, 1400); // Simulates network delay
  }

  /* ── Show confirmation screen ── */
  function showConfirmation(name, phone, category) {
    form.style.display = 'none';
    confirmation.hidden = false;

    const confName     = $('#conf-name');
    const confPhone    = $('#conf-phone');
    const confCategory = $('#conf-category');

    if (confName)     confName.textContent     = name;
    if (confPhone)    confPhone.textContent     = phone;
    if (confCategory) confCategory.textContent = category;
  }

  /* ── Reset form ── */
  if (newOrderBtn) {
    newOrderBtn.addEventListener('click', () => {
      form.reset();
      form.style.display = '';
      confirmation.hidden = true;

      // Clear all error states
      Object.keys(validators).forEach((key) => {
        const el = validators[key].el();
        if (el) el.classList.remove('invalid');
        clearError(validators[key].errId);
      });

      // Scroll back to form top
      $('#order').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();

/* ──────────────────────────────────────
   7. FOOTER YEAR
────────────────────────────────────── */
(function setFooterYear() {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ──────────────────────────────────────
   8. KEYBOARD ACCESSIBILITY
   Allow collection cards to be activated
   with Enter or Space key
────────────────────────────────────── */
(function initKeyboardCards() {
  $$('.collection-card[tabindex]').forEach((card) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const primaryBtn = card.querySelector('.btn');
        if (primaryBtn) primaryBtn.click();
      }
    });
  });
})();
