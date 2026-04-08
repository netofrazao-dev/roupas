/* =============================================
   PRODUCT.JS — Página de produto
   ============================================= */

let product = null;
let selectedSize = '';
let qty = 1;

document.addEventListener('DOMContentLoaded', async () => {
  initNav();

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showError(); return; }

  try {
    product = await API.getProduct(id);
    if (!product) { showError(); return; }
    renderProduct(product);
    loadRelated(product.category, product.id);
  } catch (e) {
    showError();
  }

  initWA();
});

function initWA() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Tenho interesse em um produto.')}`;
  const fl = document.getElementById('float-wa');
  const fw = document.getElementById('footer-wa');
  if (fl) fl.href = url;
  if (fw) fw.href = url;
}

function showError() {
  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-error').style.display   = 'block';
}

function renderProduct(p) {
  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-content').style.display = 'grid';

  // SEO
  document.getElementById('page-title').textContent = `${p.name} — Élève`;

  // Category
  document.getElementById('product-category').textContent    = p.category || '';
  document.getElementById('product-category-bc').textContent = p.category || 'Produto';

  // Name
  document.getElementById('product-name').textContent = p.name;

  // Pricing
  const hasPromo = p.promo_price && p.promo_price < p.price;
  const disc     = calcDiscount(p.price, p.promo_price);
  const pricingEl = document.getElementById('product-pricing');
  if (hasPromo) {
    pricingEl.innerHTML = `
      <span class="product-price-old">${formatPrice(p.price)}</span>
      <span class="product-price-promo">${formatPrice(p.promo_price)}</span>
      <span class="product-discount-badge">-${disc}%</span>`;
  } else {
    pricingEl.innerHTML = `<span class="product-price-current">${formatPrice(p.price)}</span>`;
  }

  // Stock
  const stockEl = document.getElementById('product-stock');
  const stock   = p.stock || 0;
  let dotClass  = 'green', stockText = `${stock} em estoque`;
  if (stock === 0)        { dotClass = 'red';    stockText = 'Esgotado'; }
  else if (stock <= 5)    { dotClass = 'yellow'; stockText = `Últimas ${stock} unidades!`; }
  stockEl.innerHTML = `<span class="stock-dot ${dotClass}"></span><span class="stock-text">${stockText}</span>`;

  // Sizes
  const sizes = p.sizes || [];
  if (sizes.length) {
    document.getElementById('size-section').style.display = 'block';
    const sizesGrid = document.getElementById('sizes-grid');
    sizesGrid.innerHTML = sizes.map(s =>
      `<button class="size-btn" data-size="${s}">${s}</button>`
    ).join('');
    sizesGrid.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sizesGrid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedSize = btn.dataset.size;
      });
    });
    // Auto-select first
    const first = sizesGrid.querySelector('.size-btn');
    if (first) { first.classList.add('selected'); selectedSize = first.dataset.size; }
  }

  // Gallery
  const images = [];
  if (p.image_url) images.push(p.image_url);
  if (p.images && Array.isArray(p.images)) images.push(...p.images);
  if (!images.length) images.push('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80');

  const mainImg = document.getElementById('gallery-main-img');
  mainImg.src = images[0]; mainImg.alt = p.name;

  const thumbsEl = document.getElementById('gallery-thumbs');
  if (images.length > 1) {
    thumbsEl.innerHTML = images.map((url, i) =>
      `<div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-img="${url}">
         <img src="${url}" alt="${p.name} ${i + 1}" loading="lazy">
       </div>`
    ).join('');
    thumbsEl.querySelectorAll('.gallery-thumb').forEach(t => {
      t.addEventListener('click', () => {
        thumbsEl.querySelectorAll('.gallery-thumb').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        mainImg.src = t.dataset.img;
      });
    });
  }

  // Zoom
  document.getElementById('gallery-main').addEventListener('click', () => openZoom(mainImg.src));

  // Description
  if (p.description) {
    document.getElementById('product-description').style.display = 'block';
    document.getElementById('product-desc-text').textContent = p.description;
  }

  // Qty controls
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (qty > 1) { qty--; document.getElementById('qty-value').textContent = qty; }
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    if (qty < (p.stock || 99)) { qty++; document.getElementById('qty-value').textContent = qty; }
  });

  // Buy button
  document.getElementById('btn-buy').addEventListener('click', () => {
    if (!product) return;
    if ((product.sizes || []).length > 0 && !selectedSize) {
      showToast('Por favor, selecione um tamanho.', 'error'); return;
    }
    if ((product.stock || 0) === 0) {
      showToast('Produto esgotado.', 'error'); return;
    }
    openWhatsApp(product, selectedSize || 'Único', qty);
  });
}

async function loadRelated(category, currentId) {
  const grid = document.getElementById('related-grid');
  try {
    const products = await API.getProducts({ category, limit: 5 });
    const related  = (products || []).filter(p => p.id !== currentId).slice(0, 4);
    grid.innerHTML = related.length
      ? related.map(renderProductCard).join('')
      : `<div class="empty-state"><p>Sem produtos relacionados.</p></div>`;
  } catch {
    grid.innerHTML = '';
  }
}

function openZoom(src) {
  const modal = document.getElementById('zoom-modal');
  const img   = document.getElementById('zoom-img');
  img.src     = src;
  modal.classList.add('open');
}

function closeZoom() {
  document.getElementById('zoom-modal').classList.remove('open');
}

document.getElementById('zoom-modal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeZoom();
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });