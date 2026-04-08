/* =============================================
   CONFIG.JS — Supabase + Shared Utilities
   ============================================= */

// ─── SUPABASE CONFIG ───────────────────────────
// ⚠️  Substitua pelos seus dados do projeto Supabase
const SUPABASE_URL    = 'https://mtdgertycbuzunrkcdvz.supabase.co';
const SUPABASE_ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdlcnR5Y2J1enVucmtjZHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODU3NzksImV4cCI6MjA5MTI2MTc3OX0.gYowlmlwWe8QhBR954wASeR8jEP0B4oK7oSdURYEYrg';
const WHATSAPP_NUMBER = '5591992625811'; // Ex: 5511999999999

// ─── SUPABASE REST API ─────────────────────────
const API = {
  headers(token = null) {
    const h = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${token || SUPABASE_ANON}`,
      'Prefer': 'return=representation',
    };
    return h;
  },

  async request(path, options = {}, token = null) {
    const url = `${SUPABASE_URL}/rest/v1/${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this.headers(token), ...(options.headers || {}) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  },

  // Products
  async getProducts(filters = {}) {
    let qs = 'products?select=*&order=created_at.desc';
    if (filters.category) qs += `&category=eq.${encodeURIComponent(filters.category)}`;
    if (filters.search)   qs += `&name=ilike.*${encodeURIComponent(filters.search)}*`;
    if (filters.maxPrice) qs += `&price=lte.${filters.maxPrice}`;
    if (filters.limit)    qs += `&limit=${filters.limit}`;
    if (filters.offset)   qs += `&offset=${filters.offset}`;
    return this.request(qs);
  },

  async getProduct(id) {
    const data = await this.request(`products?id=eq.${id}&select=*`);
    return data?.[0] || null;
  },

  async createProduct(data, token) {
    return this.request('products', { method: 'POST', body: JSON.stringify(data) }, token);
  },

  async updateProduct(id, data, token) {
    return this.request(`products?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);
  },

  async deleteProduct(id, token) {
    return this.request(`products?id=eq.${id}`, { method: 'DELETE' }, token);
  },

  // Auth
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'Login inválido');
    return data;
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}` },
    });
  },

  async uploadImage(file, token) {
    const ext  = file.name.split('.').pop();
    const name = `product_${Date.now()}.${ext}`;
    const res  = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${name}`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${token}`, 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) throw new Error('Erro no upload da imagem');
    return `${SUPABASE_URL}/storage/v1/object/public/products/${name}`;
  },
};

// ─── AUTH HELPERS ──────────────────────────────
const Auth = {
  getSession() {
    try { return JSON.parse(localStorage.getItem('sb_session')); } catch { return null; }
  },
  setSession(data) { localStorage.setItem('sb_session', JSON.stringify(data)); },
  clearSession() { localStorage.removeItem('sb_session'); },
  getToken()    { return this.getSession()?.access_token || null; },
  isLoggedIn()  { return !!this.getToken(); },
};

// ─── DOM UTILITIES ─────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function calcDiscount(original, promo) {
  if (!promo || promo >= original) return 0;
  return Math.round((1 - promo / original) * 100);
}

function debounce(fn, ms = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── TOAST ─────────────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.innerHTML = `<span>${icons[type] || '•'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── NAV HELPERS ───────────────────────────────
function initNav() {
  const header = $('header.site-header');
  if (!header) return;

  // Scroll shadow
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Highlight active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Hamburger
  const ham = $('.hamburger', header);
  const mob = $('.mobile-nav');
  if (ham && mob) {
    ham.addEventListener('click', () => mob.classList.toggle('open'));
  }

  // Search toggle
  const searchWrap = $('.nav-search-wrap', header);
  const searchBtn  = $('.nav-search-btn', header);
  const searchInp  = $('.nav-search-input', header);
  if (searchBtn && searchWrap && searchInp) {
    searchBtn.addEventListener('click', () => {
      searchWrap.classList.toggle('open');
      if (searchWrap.classList.contains('open')) searchInp.focus();
    });
    searchInp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && searchInp.value.trim()) {
        window.location.href = `catalog.html?search=${encodeURIComponent(searchInp.value.trim())}`;
      }
    });
  }
}

// ─── WHATSAPP ──────────────────────────────────
function openWhatsApp(product, size, qty) {
  const price = product.promo_price || product.price;
  const msg   = `Olá! Tenho interesse em:\n\n*${product.name}*\nTamanho: ${size}\nQuantidade: ${qty}\nPreço: ${formatPrice(price)}\n\nPoderia me ajudar?`;
  const url   = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// ─── PRODUCT CARD TEMPLATE ─────────────────────
function renderProductCard(p) {
  const hasPromo   = p.promo_price && p.promo_price < p.price;
  const discount   = calcDiscount(p.price, p.promo_price);
  const displayPx  = hasPromo ? p.promo_price : p.price;
  const isNew      = (Date.now() - new Date(p.created_at)) < 7 * 24 * 3600 * 1000;
  const outOfStock = p.stock === 0;

  let badge = '';
  if (outOfStock)   badge = `<span class="product-card-badge badge-esgotado">Esgotado</span>`;
  else if (hasPromo) badge = `<span class="product-card-badge badge-promo">-${discount}%</span>`;
  else if (isNew)    badge = `<span class="product-card-badge badge-novo">Novo</span>`;

  return `
    <article class="product-card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="product-card-image">
        <img src="${p.image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80'}"
             alt="${p.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80'">
        ${badge}
        ${!outOfStock ? `<div class="product-card-action">Ver produto</div>` : ''}
      </div>
      <div class="product-card-info">
        <h3 class="product-card-name">${p.name}</h3>
        <div class="product-card-price">
          ${hasPromo ? `
            <span class="price-old">${formatPrice(p.price)}</span>
            <span class="price-new price-promo">${formatPrice(p.promo_price)}</span>
          ` : `
            <span class="price-new">${formatPrice(displayPx)}</span>
          `}
        </div>
      </div>
    </article>
  `;
}

// ─── SKELETON CARDS ────────────────────────────
function renderSkeletons(count = 8) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton skeleton-text w-80"></div>
      <div class="skeleton skeleton-text w-40"></div>
    </div>
  `).join('');
}