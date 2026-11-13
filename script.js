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

// Panel local de catálogo: solo prendas y accesorios de ropa.
const STORAGE_KEY = 'snake-island-blue-world-catalog-v1';
const PHOTO_DB = 'snake-island-photo-library';
const PHOTO_STORE = 'photos';
let selectedPhoto = null;
function openPhotoDB() { return new Promise((resolve,reject) => { const req=indexedDB.open(PHOTO_DB,1); req.onupgradeneeded=()=>req.result.createObjectStore(PHOTO_STORE); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error); }); }
async function savePhoto(id, blob) { const db=await openPhotoDB(); return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(blob,id);tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>reject(tx.error);}); }
async function getPhoto(id) { if(!id)return null; const db=await openPhotoDB(); return new Promise((resolve,reject)=>{const req=db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>reject(req.error);}); }
async function deletePhoto(id) { if(!id)return; const db=await openPhotoDB(); return new Promise(resolve=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();resolve()};}); }
async function photoAsDataURL(id) { const blob=await getPhoto(id); if(!blob)return ''; return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve('');reader.readAsDataURL(blob);}); }

const productForm = document.querySelector('#product-form');
const productList = document.querySelector('#admin-product-list');
const statusLine = document.querySelector('#admin-status');
const productGrid = document.querySelector('.blue-products');
const photoInput = document.querySelector('#product-photo');
const photoPreview = document.querySelector('#photo-preview');
photoInput?.addEventListener('change', () => { selectedPhoto=photoInput.files?.[0] || null; if(selectedPhoto){ const url=URL.createObjectURL(selectedPhoto); photoPreview.src=url; photoPreview.hidden=false; } else { photoPreview.hidden=true; } });
const allowedCategories = ['hoodies', 'caps', 'playeras', 'sueteres'];
const categoryNames = {hoodies:'SUDADERAS',caps:'CAPS',playeras:'PLAYERAS',sueteres:'SUÉTERES'};
let products = [];
try { products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { products = []; }
if (!Array.isArray(products)) products = [];
const safeText = value => String(value ?? '').trim();
const saveLocal = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
function renderManagedProducts() {
  productGrid?.querySelectorAll('[data-managed="true"]').forEach(card => card.remove());
  productList.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'admin-product-row';
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = product.name;
    const detail = document.createElement('span');
    detail.textContent = categoryNames[product.category] + ' · $' + Number(product.price).toLocaleString('es-MX') + ' MXN';
    info.append(name, detail);
    const actions = document.createElement('div');
    actions.className = 'admin-row-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.textContent = 'EDITAR';
    edit.addEventListener('click', () => {
      document.querySelector('#edit-id').value = product.id;
      document.querySelector('#product-name').value = product.name;
      document.querySelector('#product-category').value = product.category;
      document.querySelector('#product-image').value = product.image || '';\n      selectedPhoto=null; photoInput.value=''; photoPreview.hidden=true; photoPreview.removeAttribute('src');\n      if(product.photoId) getPhoto(product.photoId).then(blob=>{if(blob){photoPreview.src=URL.createObjectURL(blob);photoPreview.hidden=false;}});
      document.querySelector('#product-description').value = product.description || '';
      document.querySelector('#product-price').value = product.price;
      document.querySelector('#product-bundle').value = product.bundle || '';
      document.querySelector('#save-product').textContent = 'ACTUALIZAR ARTÍCULO ↗';
      productForm.scrollIntoView({behavior:'smooth',block:'start'});
    });
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = 'ELIMINAR';
    remove.addEventListener('click', () => {
      if (!confirm('¿Eliminar ' + product.name + ' de este catálogo local?')) return;
      products = products.filter(item => item.id !== product.id);
      saveLocal(); renderManagedProducts();
      statusLine.textContent = 'Artículo eliminado de este navegador.';
    });
    actions.append(edit, remove);
    card.append(info, actions);
    productList.append(card);

    if (productGrid) {
      const link = document.createElement('a');
      link.className = 'product-card managed-product';
      link.dataset.managed = 'true';
      link.href = 'https://wa.me/524181516612?text=' + encodeURIComponent('Hola, quiero consultar disponibilidad de ' + product.name + '. Precio: $' + product.price + ' MXN.');
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      const visual = document.createElement('div'); visual.className = 'product-visual';
      if (product.image) {
        const img = document.createElement('img'); img.src = product.image; img.alt = product.name; img.loading = 'lazy';
        visual.append(img);
      } else {
        const mark = document.createElement('span'); mark.className = 'garment-mark'; mark.textContent = 'BW'; visual.append(mark);
      }
      const data = document.createElement('div'); data.className = 'product-info';
      const textWrap = document.createElement('div');
      const small = document.createElement('small'); small.textContent = 'BLUE WORLD / NUEVO';
      const heading = document.createElement('h3'); heading.textContent = product.name;
      const price = document.createElement('span'); price.className = 'price'; price.textContent = '$' + Number(product.price).toLocaleString('es-MX') + ' MXN';
      textWrap.append(small, heading, price);
      if (product.bundle) { const bundle = document.createElement('span'); bundle.className='price'; bundle.textContent=product.bundle; textWrap.append(bundle); }
      data.append(textWrap);
      const arrow = document.createElement('b'); arrow.textContent='↗'; data.append(arrow);
      link.append(visual, data);
      productGrid.append(link);
    }
  });
}
productForm?.addEventListener('submit', event => {
  event.preventDefault();
  const category = document.querySelector('#product-category').value;
  const price = Number(document.querySelector('#product-price').value);
  const product = {
    id: document.querySelector('#edit-id').value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name: safeText(document.querySelector('#product-name').value),
    category,
    image: safeText(document.querySelector('#product-image').value),
    description: safeText(document.querySelector('#product-description').value),
    price,
    bundle: safeText(document.querySelector('#product-bundle').value)
  };
  if (!product.name || !allowedCategories.includes(category) || !Number.isFinite(price) || price < 0) return;
  const index = products.findIndex(item => item.id === product.id);
  if (index >= 0) products[index] = product; else products.push(product);
  saveLocal(); renderManagedProducts(); productForm.reset(); selectedPhoto=null; photoPreview.hidden=true; photoPreview.removeAttribute('src');
  document.querySelector('#edit-id').value = '';
  document.querySelector('#save-product').textContent = 'GUARDAR ARTÍCULO ↗';
  statusLine.textContent = 'Guardado en este teléfono. Exporta el JSON para respaldar fotos y precios; aún no se publica en la tienda.';
});
document.querySelector('#cancel-edit')?.addEventListener('click', () => {
  productForm.reset(); document.querySelector('#edit-id').value = '';
  document.querySelector('#save-product').textContent = 'GUARDAR ARTÍCULO ↗';
});
document.querySelector('#export-products')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(products,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='snake-island-catalogo.json'; a.click();
  URL.revokeObjectURL(url);
});
document.querySelector('#import-products')?.addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported) || imported.some(p => !p.name || !allowedCategories.includes(p.category) || !Number.isFinite(Number(p.price)))) throw new Error('Formato no válido');
    products = imported.map(p => ({id:safeText(p.id) || String(Date.now()+Math.random()),name:safeText(p.name),category:p.category,image:safeText(p.image),description:safeText(p.description),price:Number(p.price),bundle:safeText(p.bundle)}));
    saveLocal(); renderManagedProducts(); statusLine.textContent='Catálogo importado en este navegador.';
  } catch { statusLine.textContent='No se pudo importar. Usa un JSON exportado desde este panel.'; }
  event.target.value='';
});
renderManagedProducts();
