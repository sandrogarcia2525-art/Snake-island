const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const STORAGE_KEY = 'snake-island-blue-world-catalog-v1';
const PHOTO_DB = 'snake-island-photo-library';
const PHOTO_STORE = 'photos';
const allowedCategories = ['hoodies', 'caps', 'playeras', 'sueteres'];
const categoryNames = {hoodies:'SUDADERAS',caps:'CAPS',playeras:'PLAYERAS',sueteres:'SUÉTERES'};
const form = document.querySelector('#product-form');
const list = document.querySelector('#admin-product-list');
const statusLine = document.querySelector('#admin-status');
const grid = document.querySelector('.blue-products');
const photoInput = document.querySelector('#product-photo');
const photoPreview = document.querySelector('#photo-preview');
let selectedPhoto = null;
let products = [];
try { products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
if (!Array.isArray(products)) products = [];
const safeText = value => String(value ?? '').trim();
const saveLocal = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function savePhoto(id, blob) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).put(blob, id);
    tx.oncomplete = () => { db.close(); resolve(id); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function getPhoto(id) {
  if (!id) return null;
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
async function deletePhoto(id) {
  if (!id) return;
  const db = await openPhotoDB();
  return new Promise(resolve => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    tx.objectStore(PHOTO_STORE).delete(id);
    tx.oncomplete = tx.onerror = () => { db.close(); resolve(); };
  });
}
async function photoAsDataURL(id) {
  const blob = await getPhoto(id);
  if (!blob) return '';
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}
photoInput?.addEventListener('change', () => {
  selectedPhoto = photoInput.files?.[0] || null;
  if (selectedPhoto) {
    if (!selectedPhoto.type.startsWith('image/')) { selectedPhoto = null; photoInput.value = ''; statusLine.textContent = 'Selecciona un archivo de imagen.'; return; }
    const url = URL.createObjectURL(selectedPhoto);
    photoPreview.src = url;
    photoPreview.hidden = false;
  } else {
    photoPreview.hidden = true;
    photoPreview.removeAttribute('src');
  }
});

function resetForm() {
  form.reset();
  document.querySelector('#edit-id').value = '';
  document.querySelector('#save-product').textContent = 'GUARDAR ARTÍCULO ↗';
  selectedPhoto = null;
  photoPreview.hidden = true;
  photoPreview.removeAttribute('src');
}
function renderProducts() {
  grid?.querySelectorAll('[data-managed="true"]').forEach(card => card.remove());
  list.innerHTML = '';
  products.forEach(product => {
    const row = document.createElement('article');
    row.className = 'admin-product-row';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const detail = document.createElement('span');
    detail.textContent = (categoryNames[product.category] || 'ARTÍCULO') + ' · $' + Number(product.price).toLocaleString('es-MX') + ' MXN';
    info.append(name, detail);
    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.textContent = 'EDITAR';
    edit.addEventListener('click', async () => {
      document.querySelector('#edit-id').value = product.id;
      document.querySelector('#product-name').value = product.name;
      document.querySelector('#product-category').value = product.category;
      document.querySelector('#product-image').value = product.image || '';
      document.querySelector('#product-description').value = product.description || '';
      document.querySelector('#product-price').value = product.price;
      document.querySelector('#product-bundle').value = product.bundle || '';
      selectedPhoto = null; photoInput.value = '';
      photoPreview.hidden = true; photoPreview.removeAttribute('src');
      if (product.photoId) {
        const blob = await getPhoto(product.photoId);
        if (blob) { photoPreview.src = URL.createObjectURL(blob); photoPreview.hidden = false; }
      }
      document.querySelector('#save-product').textContent = 'ACTUALIZAR ARTÍCULO ↗';
      form.scrollIntoView({behavior:'smooth', block:'start'});
    });
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = 'ELIMINAR';
    remove.addEventListener('click', async () => {
      if (!confirm('¿Eliminar ' + product.name + ' de este catálogo local?')) return;
      products = products.filter(item => item.id !== product.id);
      await deletePhoto(product.photoId);
      saveLocal(); renderProducts();
      statusLine.textContent = 'Artículo eliminado de este navegador.';
    });
    actions.append(edit, remove); row.append(info, actions); list.append(row);

    if (grid) {
      const card = document.createElement('a');
      card.className = 'product-card managed-product';
      card.dataset.managed = 'true';
      card.href = 'https://wa.me/524181516612?text=' + encodeURIComponent('Hola, quiero consultar disponibilidad de ' + product.name + '. Precio: $' + product.price + ' MXN.');
      card.target = '_blank'; card.rel = 'noopener noreferrer';
      const visual = document.createElement('div'); visual.className = 'product-visual';
      const img = document.createElement('img'); img.alt = product.name; img.loading = 'lazy';
      if (product.image) img.src = product.image;
      else if (product.photoId) getPhoto(product.photoId).then(blob => { if (blob) img.src = URL.createObjectURL(blob); });
      else img.alt = product.name + ' — imagen pendiente';
      visual.append(img);
      const data = document.createElement('div'); data.className = 'product-info';
      const wrap = document.createElement('div');
      const small = document.createElement('small'); small.textContent = 'BLUE WORLD / NUEVO';
      const title = document.createElement('h3'); title.textContent = product.name;
      const price = document.createElement('span'); price.className = 'price'; price.textContent = '$' + Number(product.price).toLocaleString('es-MX') + ' MXN';
      wrap.append(small, title, price);
      if (product.bundle) { const bundle = document.createElement('span'); bundle.className = 'price'; bundle.textContent = product.bundle; wrap.append(bundle); }
      data.append(wrap);
      const arrow = document.createElement('b'); arrow.textContent = '↗'; data.append(arrow);
      card.append(visual, data); grid.append(card);
    }
  });
}
form?.addEventListener('submit', async event => {
  event.preventDefault();
  const editId = document.querySelector('#edit-id').value;
  const previous = products.find(item => item.id === editId);
  const category = document.querySelector('#product-category').value;
  const price = Number(document.querySelector('#product-price').value);
  const product = {
    id: editId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: safeText(document.querySelector('#product-name').value),
    category,
    image: safeText(document.querySelector('#product-image').value),
    description: safeText(document.querySelector('#product-description').value),
    price,
    bundle: safeText(document.querySelector('#product-bundle').value),
    photoId: previous?.photoId || ''
  };
  if (!product.name || !allowedCategories.includes(category) || !Number.isFinite(price) || price < 0) return;
  try {
    if (selectedPhoto) {
      const key = 'photo-' + product.id;
      await savePhoto(key, selectedPhoto);
      if (previous?.photoId && previous.photoId !== key) await deletePhoto(previous.photoId);
      product.photoId = key;
      product.image = '';
    }
    const index = products.findIndex(item => item.id === product.id);
    if (index >= 0) products[index] = product; else products.push(product);
    saveLocal(); renderProducts(); resetForm();
    statusLine.textContent = 'Guardado en este teléfono. Edita el precio cuando quieras. Exporta el catálogo para respaldar fotos y datos.';
  } catch {
    statusLine.textContent = 'No se pudo guardar la foto. Revisa el espacio disponible del navegador e inténtalo otra vez.';
  }
});
document.querySelector('#cancel-edit')?.addEventListener('click', resetForm);
document.querySelector('#export-products')?.addEventListener('click', async () => {
  try {
    const portable = [];
    for (const p of products) portable.push({...p, photoData: await photoAsDataURL(p.photoId)});
    const blob = new Blob([JSON.stringify(portable, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'snake-island-catalogo.json'; a.click();
    URL.revokeObjectURL(url);
    statusLine.textContent = 'Respaldo descargado con fotografías y precios.';
  } catch { statusLine.textContent = 'No se pudo crear el respaldo.'; }
});
document.querySelector('#import-products')?.addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported) || imported.some(p => !p.name || !allowedCategories.includes(p.category) || !Number.isFinite(Number(p.price)))) throw new Error('Formato no válido');
    const restored = [];
    for (const p of imported) {
      const id = safeText(p.id) || String(Date.now() + Math.random());
      let photoId = '';
      if (p.photoData && String(p.photoData).startsWith('data:image/')) {
        const response = await fetch(p.photoData);
        photoId = 'photo-' + id;
        await savePhoto(photoId, await response.blob());
      } else if (p.photoId) {
        photoId = p.photoId;
      }
      restored.push({id, name:safeText(p.name), category:p.category, image:safeText(p.image), photoId, description:safeText(p.description), price:Number(p.price), bundle:safeText(p.bundle)});
    }
    products = restored; saveLocal(); renderProducts();
    statusLine.textContent = 'Catálogo importado con sus fotografías y precios.';
  } catch { statusLine.textContent = 'No se pudo importar. Usa un JSON exportado desde este panel.'; }
  event.target.value = '';
});
renderProducts();
