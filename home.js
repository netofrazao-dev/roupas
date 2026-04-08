/* =============================================
   HOME.JS — Lógica da página inicial
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initFloatWA();
  await loadFeatured();
  await loadNew();
});

function initFloatWA() {
  const wa = document.getElementById('float-wa');
  const footer = document.getElementById('footer-whatsapp');
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de conhecer os produtos da Élève.')}`;
  if (wa) wa.href = url;
  if (footer) footer.href = url;
}

async function loadFeatured() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  try {
    const products = await API.getProducts({ limit: 4 });
    if (!products?.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛍</div><h3>Em breve</h3><p>Novos produtos chegando.</p></div>`;
      return;
    }
    grid.innerHTML = products.map(renderProductCard).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>Não foi possível carregar os produtos.</p></div>`;
  }
}

async function loadNew() {
  const grid = document.getElementById('new-grid');
  if (!grid) return;
  try {
    const products = await API.getProducts({ limit: 4, offset: 4 });
    if (!products?.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✨</div><h3>Novidades em breve</h3></div>`;
      return;
    }
    grid.innerHTML = products.map(renderProductCard).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>Não foi possível carregar.</p></div>`;
  }
}