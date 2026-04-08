/* =============================================
   CATALOG.JS — Filtros, busca e paginação
   ============================================= */

const PAGE_SIZE = 12;
let allProducts  = [];
let filtered     = [];
let currentPage  = 1;

const state = {
  search:   '',
  category: '',
  size:     '',
  maxPrice: 1000,
  promo:    false,
  sort:     'newest',
};

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  readUrlParams();
  bindEvents();
  initWA();
  await loadAllProducts();
});

function initWA() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de conhecer o catálogo da Élève.')}`;
  const fl = document.getElementById('float-wa');
  const fw = document.getElementById('footer-wa');
  if (fl) fl.href = url;
  if (fw) fw.href = url;
}

function readUrlParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('category')) {
    state.category = p.get('category');
    const title = document.getElementById('catalog-title');
    const bc    = document.getElementById('breadcrumb-current');
    if (title) title.textContent = state.category;
    if (bc)    bc.textContent    = state.category;
    $$('#category-filters .filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category === state.category || (state.category === '' && c.dataset.category === ''));
    });
  }
  if (p.get('search')) {
    state.search = p.get('search');
    const inp = document.getElementById('search-input');
    if (inp) inp.value = state.search;
  }
  if (p.get('promo')) {
    state.promo = true;
    const btn = document.getElementById('promo-filter');
    if (btn) btn.classList.add('active');
  }
  if (p.get('sort')) {
    state.sort = p.get('sort');
    const sel = document.getElementById('sort-select');
    if (sel) sel.value = state.sort;
  }
}

async function loadAllProducts() {
  try {
    allProducts = await API.getProducts({}) || [];
    applyFilters();
  } catch (e) {
    document.getElementById('products-grid').innerHTML =
      `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Erro ao carregar</h3><p>Verifique a conexão com o Supabase.</p></div>`;
    document.getElementById('catalog-count').textContent = '0 produtos';
  }
}

function applyFilters() {
  let result = [...allProducts];

  if (state.search)   result = result.filter(p => p.name.toLowerCase().includes(state.search.toLowerCase()) || (p.description || '').toLowerCase().includes(state.search.toLowerCase()));
  if (state.category) result = result.filter(p => p.category === state.category);
  if (state.size)     result = result.filter(p => (p.sizes || []).includes(state.size));
  if (state.promo)    result = result.filter(p => p.promo_price && p.promo_price < p.price);
  result = result.filter(p => (p.price || 0) <= state.maxPrice);

  // Sort
  switch (state.sort) {
    case 'price_asc':  result.sort((a, b) => (a.promo_price || a.price) - (b.promo_price || b.price)); break;
    case 'price_desc': result.sort((a, b) => (b.promo_price || b.price) - (a.promo_price || a.price)); break;
    case 'name':       result.sort((a, b) => a.name.localeCompare(b.name)); break;
    default:           result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  filtered = result;
  currentPage = 1;
  render();
}

function render() {
  const grid  = document.getElementById('products-grid');
  const count = document.getElementById('catalog-count');
  const total = filtered.length;

  count.textContent = `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filtered.slice(start, start + PAGE_SIZE);

  if (!page.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar os filtros ou a busca.</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = page.map(renderProductCard).join('');
  renderPagination(total);
}

function renderPagination(total) {
  const pages    = Math.ceil(total / PAGE_SIZE);
  const container = document.getElementById('pagination');
  if (pages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" data-page="${currentPage - 1}">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span style="padding:0 .3rem;color:var(--gray-400)">…</span>`;
    }
  }
  if (currentPage < pages) html += `<button class="page-btn" data-page="${currentPage + 1}">›</button>`;
  container.innerHTML = html;
  container.querySelectorAll('.page-btn').forEach(b => {
    b.addEventListener('click', () => {
      currentPage = +b.dataset.page;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function bindEvents() {
  // Search
  const searchInp = document.getElementById('search-input');
  if (searchInp) {
    searchInp.addEventListener('input', debounce(e => {
      state.search = e.target.value.trim();
      applyFilters();
    }, 350));
  }

  // Category chips
  document.getElementById('category-filters')?.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    $$('#category-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.dataset.category;
    applyFilters();
  });

  // Size chips
  document.getElementById('size-filters')?.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const already = chip.classList.contains('active');
    $$('#size-filters .filter-chip').forEach(c => c.classList.remove('active'));
    state.size = already ? '' : chip.dataset.size;
    if (!already) chip.classList.add('active');
    applyFilters();
  });

  // Price range
  const priceRange = document.getElementById('price-range');
  const priceVal   = document.getElementById('price-range-val');
  priceRange?.addEventListener('input', debounce(e => {
    state.maxPrice = +e.target.value;
    priceVal.textContent = `R$ ${(+e.target.value).toLocaleString('pt-BR')}`;
    applyFilters();
  }, 200));

  // Promo filter
  document.getElementById('promo-filter')?.addEventListener('click', e => {
    state.promo = !state.promo;
    e.target.classList.toggle('active', state.promo);
    applyFilters();
  });

  // Sort
  document.getElementById('sort-select')?.addEventListener('change', e => {
    state.sort = e.target.value;
    applyFilters();
  });

  // Clear filters
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    state.search = ''; state.category = ''; state.size = '';
    state.maxPrice = 1000; state.promo = false; state.sort = 'newest';

    const si = document.getElementById('search-input');
    if (si) si.value = '';
    const pr = document.getElementById('price-range');
    if (pr) pr.value = 1000;
    const pv = document.getElementById('price-range-val');
    if (pv) pv.textContent = 'R$ 1.000';
    const ss = document.getElementById('sort-select');
    if (ss) ss.value = 'newest';

    $$('#category-filters .filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
    $$('#size-filters .filter-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('promo-filter')?.classList.remove('active');

    applyFilters();
  });

  // Mobile filter toggle
  document.getElementById('filter-toggle-btn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('filters-sidebar');
    sidebar?.classList.toggle('mobile-open');
  });
}