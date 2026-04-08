/* =============================================
   ADMIN.JS — Painel administrativo
   ============================================= */

let products = [];
let editingId = null;
let deleteTargetId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  bindLogin();
  bindSideNav();
  bindImagePreview();
  bindSizeCheckboxes();
  bindAdminSearch();
});

// ─── AUTH ────────────────────────────────────────
function checkSession() {
  const session = Auth.getSession();
  if (session?.access_token) {
    showPanel('dashboard');
    showAdminUI(session);
    loadProducts();
  }
}

function bindLogin() {
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) { showLoginError('Preencha todos os campos.'); return; }

    btn.disabled = true; btn.textContent = 'Entrando...';
    err.style.display = 'none';
    try {
      const data = await API.signIn(email, pass);
      Auth.setSession(data);
      showAdminUI(data);
      showPanel('dashboard');
      loadProducts();
    } catch (e) {
      showLoginError(e.message || 'Email ou senha incorretos.');
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });

  // Enter key
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });

  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    const token = Auth.getToken();
    try { await API.signOut(token); } catch {}
    Auth.clearSession();
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('login-page').style.display  = 'flex';
    document.getElementById('login-email').value    = '';
    document.getElementById('login-password').value = '';
  });
}

function showLoginError(msg) {
  const err = document.getElementById('login-error');
  err.textContent = msg; err.style.display = 'block';
}

function showAdminUI(session) {
  document.getElementById('login-page').style.display  = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  const email = session.user?.email || session.email || '';
  document.getElementById('admin-user-email').textContent = email;
}

// ─── NAVIGATION ──────────────────────────────────
function showPanel(name) {
  ['dashboard', 'products', 'add-product'].forEach(p => {
    document.getElementById(`panel-${p}`).style.display = p === name ? 'block' : 'none';
  });
  const titles = { dashboard: 'Dashboard', products: 'Produtos', 'add-product': editingId ? 'Editar Produto' : 'Novo Produto' };
  document.getElementById('admin-section-title').textContent = titles[name] || '';
  document.getElementById('form-title').textContent = editingId ? 'Editar Produto' : 'Novo Produto';

  $$('.admin-nav-item').forEach(item => item.classList.toggle('active', item.dataset.panel === name));
}

function bindSideNav() {
  $$('.admin-nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      if (panel === 'add-product') { editingId = null; resetForm(); }
      showPanel(panel);
    });
  });
}

// ─── PRODUCTS CRUD ───────────────────────────────
async function loadProducts() {
  try {
    products = await API.getProducts({}) || [];
    renderDashboard();
    renderTable(products);
  } catch (e) {
    showToast('Erro ao carregar produtos: ' + e.message, 'error');
  }
}

function renderDashboard() {
  document.getElementById('stat-total').textContent  = products.length;
  document.getElementById('stat-promo').textContent  = products.filter(p => p.promo_price).length;
  document.getElementById('stat-stock').textContent  = products.filter(p => p.stock === 0).length;
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  document.getElementById('stat-cats').textContent   = cats.size;

  const recent = [...products].slice(0, 5);
  document.getElementById('recent-products-table').innerHTML = buildTable(recent);
  bindTableActions(document.getElementById('recent-products-table'));
}

function renderTable(list) {
  const badge = document.getElementById('products-badge');
  if (badge) badge.textContent = list.length;
  document.getElementById('products-table').innerHTML = buildTable(list);
  bindTableActions(document.getElementById('products-table'));
}

function buildTable(list) {
  if (!list.length) return `<div style="padding:3rem;text-align:center;color:var(--gray-400);">Nenhum produto encontrado.</div>`;
  return `
    <table class="admin-table">
      <thead><tr>
        <th>Imagem</th>
        <th>Nome</th>
        <th>Categoria</th>
        <th>Preço</th>
        <th>Promo</th>
        <th>Estoque</th>
        <th>Tamanhos</th>
        <th>Ações</th>
      </tr></thead>
      <tbody>
        ${list.map(p => `
          <tr>
            <td><img class="admin-table-img" src="${p.image_url || ''}" alt="${p.name}"
                  onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=50'"></td>
            <td><strong>${p.name}</strong></td>
            <td><span style="font-size:.8rem;background:var(--gray-100);padding:.2rem .6rem;border-radius:20px;">${p.category || '—'}</span></td>
            <td>${formatPrice(p.price)}</td>
            <td>${p.promo_price ? `<span style="color:var(--danger);font-weight:600;">${formatPrice(p.promo_price)}</span>` : '—'}</td>
            <td>
              <span style="color:${p.stock === 0 ? 'var(--danger)' : p.stock <= 5 ? '#F39C12' : 'var(--success)'}; font-weight:500;">
                ${p.stock}
              </span>
            </td>
            <td style="font-size:.82rem;max-width:120px;">${(p.sizes || []).join(', ') || '—'}</td>
            <td>
              <div class="admin-actions">
                <button class="admin-btn-edit" data-id="${p.id}">Editar</button>
                <button class="admin-btn-del" data-id="${p.id}" data-name="${p.name}">Excluir</button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function bindTableActions(container) {
  container.querySelectorAll('.admin-btn-edit').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.id));
  });
  container.querySelectorAll('.admin-btn-del').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
  });
}

function bindAdminSearch() {
  const inp = document.getElementById('admin-search');
  if (!inp) return;
  inp.addEventListener('input', debounce(e => {
    const q = e.target.value.trim().toLowerCase();
    const filtered = q ? products.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)) : products;
    renderTable(filtered);
  }, 250));
}

// ─── FORM ────────────────────────────────────────
function bindImagePreview() {
  const imgInput = document.getElementById('f-image');
  imgInput?.addEventListener('input', debounce(e => {
    const url = e.target.value.trim();
    const wrap = document.getElementById('img-preview-wrap');
    const img  = document.getElementById('img-preview');
    if (url) { wrap.style.display = 'block'; img.src = url; }
    else { wrap.style.display = 'none'; }
  }, 400));
}

function bindSizeCheckboxes() {
  $$('#sizes-checkboxes .size-checkbox-label').forEach(label => {
    const cb = label.querySelector('input');
    cb.addEventListener('change', () => label.classList.toggle('checked', cb.checked));
  });
}

function getSelectedSizes() {
  return $$('#sizes-checkboxes input[type=checkbox]')
    .filter(cb => cb.checked).map(cb => cb.value);
}

function setSelectedSizes(sizes = []) {
  $$('#sizes-checkboxes .size-checkbox-label').forEach(label => {
    const cb = label.querySelector('input');
    cb.checked = sizes.includes(cb.value);
    label.classList.toggle('checked', cb.checked);
  });
}

function resetForm() {
  editingId = null;
  document.getElementById('edit-id').value = '';
  ['f-name','f-price','f-promo','f-image','f-desc','f-stock'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('f-category').value = '';
  setSelectedSizes([]);
  document.getElementById('img-preview-wrap').style.display = 'none';
  document.getElementById('form-title').textContent = 'Novo Produto';
  document.getElementById('save-btn').innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    Salvar Produto`;
}

function startEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;

  document.getElementById('edit-id').value    = id;
  document.getElementById('f-name').value     = p.name || '';
  document.getElementById('f-price').value    = p.price || '';
  document.getElementById('f-promo').value    = p.promo_price || '';
  document.getElementById('f-stock').value    = p.stock ?? '';
  document.getElementById('f-image').value    = p.image_url || '';
  document.getElementById('f-desc').value     = p.description || '';
  document.getElementById('f-category').value = p.category || '';
  setSelectedSizes(p.sizes || []);

  if (p.image_url) {
    document.getElementById('img-preview-wrap').style.display = 'block';
    document.getElementById('img-preview').src = p.image_url;
  }

  showPanel('add-product');
  document.getElementById('form-title').textContent = 'Editar Produto';
}

function cancelEdit() {
  editingId = null; resetForm(); showPanel('products');
}

async function saveProduct() {
  const token = Auth.getToken();
  if (!token) { showToast('Sessão expirada. Faça login novamente.', 'error'); return; }

  const name  = document.getElementById('f-name').value.trim();
  const price = parseFloat(document.getElementById('f-price').value);
  const promo = parseFloat(document.getElementById('f-promo').value) || null;
  const stock = parseInt(document.getElementById('f-stock').value) || 0;
  const image = document.getElementById('f-image').value.trim();
  const desc  = document.getElementById('f-desc').value.trim();
  const cat   = document.getElementById('f-category').value;
  const sizes = getSelectedSizes();

  if (!name || !price || !image || !cat) {
    showToast('Preencha todos os campos obrigatórios.', 'error'); return;
  }
  if (promo && promo >= price) {
    showToast('Preço promocional deve ser menor que o preço original.', 'error'); return;
  }

  const data = { name, price, promo_price: promo, stock, image_url: image, description: desc, category: cat, sizes };

  const btn = document.getElementById('save-btn');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    if (editingId) {
      await API.updateProduct(editingId, data, token);
      showToast('Produto atualizado com sucesso!', 'success');
    } else {
      await API.createProduct(data, token);
      showToast('Produto criado com sucesso!', 'success');
    }
    editingId = null;
    resetForm();
    await loadProducts();
    showPanel('products');
  } catch (e) {
    showToast('Erro ao salvar: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Produto`;
  }
}

// ─── DELETE MODAL ────────────────────────────────
function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('delete-product-name').textContent = name;
  document.getElementById('delete-modal').classList.add('open');
  document.getElementById('confirm-delete-btn').onclick = confirmDelete;
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.remove('open');
}

async function confirmDelete() {
  const token = Auth.getToken();
  if (!token || !deleteTargetId) return;
  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true; btn.textContent = 'Excluindo...';
  try {
    await API.deleteProduct(deleteTargetId, token);
    showToast('Produto excluído.', 'success');
    closeDeleteModal();
    await loadProducts();
  } catch (e) {
    showToast('Erro ao excluir: ' + e.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Excluir';
  }
}

// Close modal on overlay click
document.getElementById('delete-modal')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeDeleteModal();
});