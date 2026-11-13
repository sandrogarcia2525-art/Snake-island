const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
function closeMenu(){nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Abrir menú')}
menuButton?.addEventListener('click',()=>{const open=nav?.classList.toggle('open')??false;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const filters=[...document.querySelectorAll('.filter')];
const products=[...document.querySelectorAll('.product-card')];
filters.forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.filter;filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});document.querySelectorAll('.product-card').forEach(card=>{card.hidden=category!=='all'&&card.dataset.category!==category})}));

const cart=[];
const checkoutCatalog={
 'SUDADERAS 1 PIEZA':{price:850,units:1,category:'wear'},
 'SUDADERAS 10 PIEZAS':{price:4500,units:10,category:'wear'},
 'CAPS 3 PIEZAS':{price:750,units:3,category:'accessories'},
 'CAPS 5 PIEZAS':{price:1250,units:5,category:'accessories'},
 'PLAYERAS 1 PIEZA':{price:950,units:1,category:'wear'},
 'PLAYERAS 3 PIEZAS':{price:2800,units:3,category:'wear'},
 'SUÉTERES 1 PIEZA':{price:950,units:1,category:'wear'},
 'SUÉTERES 3 PIEZAS':{price:2800,units:3,category:'wear'}
};
const prices=Object.fromEntries(Object.entries(checkoutCatalog).map(([key,value])=>[key,value.price]));
const orderPhone='524181516612';

const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
const count=document.querySelector('#bag-count');
const dialog=document.querySelector('#cart-dialog');
const list=document.querySelector('#cart-items');
const empty=document.querySelector('#cart-empty');
const toast=document.querySelector('#toast');
const total=document.querySelector('#cart-total');
let toastTimer;
function renderCart(){
  if(count)count.textContent=String(cart.reduce((sum,item)=>sum+(Number(item.quantity)||1),0));
  if(list){
    list.replaceChildren();
    cart.forEach((entry,index)=>{
      const name=entry.name;
      const item=document.createElement('li');
      const title=document.createElement('span');
      const remove=document.createElement('button');
      title.textContent=name+(entry.sizes?.length?' / TALLAS '+entry.sizes.join(', '):(entry.size?' / TALLA '+entry.size:''))+' — '+(Number.isFinite(entry.price)?money(entry.price):(prices[name]!==undefined?money(prices[name]):'PRECIO POR CONFIRMAR'));
      remove.type='button';remove.className='cart-remove';remove.textContent='REMOVE';
      remove.setAttribute('aria-label','Quitar '+name+' de la bolsa');
      remove.addEventListener('click',()=>{cart.splice(index,1);renderCart()});
      item.append(title,remove);list.append(item);
    });
  }
  if(empty)empty.hidden=cart.length>0;
  if(total)total.textContent=money(cart.reduce((sum,entry)=>sum+(Number.isFinite(entry.price)?entry.price:(prices[entry.name]||0)),0));
}
document.querySelector('#bag-open')?.addEventListener('click',()=>dialog?.showModal());
document.querySelector('#cart-close')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
document.querySelector('#cart-clear')?.addEventListener('click',()=>{cart.length=0;renderCart()});
function addCatalogItem(name){
  const info=checkoutCatalog[name];
  if(!info){alert('Este artículo local requiere confirmación antes de pagar.');return}
  let sizes=[];
  if(info.category==='wear'){
    const raw=window.prompt('Indica '+info.units+' talla(s), separadas por coma. Opciones: chica, mediana, grande.','mediana');
    if(raw===null)return;
    sizes=raw.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
    if(sizes.length!==info.units||sizes.some(value=>!['chica','mediana','grande'].includes(value))){alert('Debes indicar exactamente '+info.units+' talla(s): chica, mediana o grande.');return}
  }
  cart.push({name,size:sizes[0]||'',sizes,price:info.price,quantity:1});
  renderCart();dialog?.showModal();
  if(toast){toast.textContent='ARTÍCULO AÑADIDO A TU BOLSA';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}
document.querySelectorAll('.add-button[data-product]').forEach(button=>button.addEventListener('click',()=>addCatalogItem(button.dataset.product)));
document.querySelectorAll('.inquiry-button').forEach(button=>button.addEventListener('click',()=>{
  const product=button.dataset.inquiry||'producto Blue Worlds';
  const message='Hola, quiero consultar precio, existencias y fotografías disponibles de '+product+' de Snake Island × Blue Worlds.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
}));
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
renderCart();
const cardPay=document.querySelector('#pay-card');
cardPay?.addEventListener('click',async()=>{
  const items=cart.map(item=>({name:item.name,sizes:item.sizes||[],quantity:1}));
  if(!items.length){alert('Agrega primero un artículo a tu bolsa.');return}
  if(items.some(item=>!checkoutCatalog[item.name])){alert('Los artículos agregados desde el panel local no están habilitados para cobro en línea.');return}
  cardPay.disabled=true;cardPay.textContent='CONECTANDO CON MERCADO PAGO…';
  try{const response=await fetch('/api/create-preference',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});const data=await response.json();if(!response.ok||!data.init_point)throw new Error(data.error||'No se pudo iniciar el pago');window.location.assign(data.init_point)}catch(error){alert(error.message+' Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado en Vercel.');cardPay.disabled=false;cardPay.textContent='PAGAR CON TARJETA ↗'}
});
document.querySelector('#pay-cash')?.addEventListener('click',()=>{
  if(!cart.length){alert('Agrega primero un artículo a tu bolsa.');return}
  if(cart.some(item=>!Number.isFinite(item.price)&&prices[item.name]===undefined)){alert('El catálogo aún no tiene precios verificados.');return}
  const lines=cart.map(item=>'- '+item.name+(item.sizes?.length?' / tallas '+item.sizes.join(', '):(item.size?' / talla '+item.size:''))+' — '+money(Number.isFinite(item.price)?item.price:prices[item.name]));
  const amount=cart.reduce((sum,item)=>sum+(Number.isFinite(item.price)?item.price:prices[item.name]),0);
  const message='Hola, quiero consultar este pedido de Snake Island × Blue Worlds:\n'+lines.join('\n')+'\nTotal de productos: '+money(amount)+'\nConfirmen existencias, tallas, zona y costo de envío, y si es posible pagar en efectivo. Este mensaje es solo una consulta; aún no confirmo el pedido.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
});

document.querySelector('#pay-transfer')?.addEventListener('click',()=>{
  if(!cart.length){alert('Agrega primero un artículo a tu bolsa.');return}
  const lines=cart.map(item=>'- '+item.name+(item.sizes?.length?' / tallas '+item.sizes.join(', '):(item.size?' / talla '+item.size:''))+' — '+money(Number.isFinite(item.price)?item.price:(prices[item.name]??0)));
  const amount=cart.reduce((sum,item)=>sum+(Number.isFinite(item.price)?item.price:(prices[item.name]??0)),0);
  const message='Hola, quiero solicitar los datos oficiales para pagar por transferencia o depósito mi pedido de Snake Island × Blue Worlds:\n'+lines.join('\n')+'\nTotal de productos: '+money(amount)+'\nPor favor envíenme los datos bancarios, titular y referencia. No realizaré el depósito hasta confirmar que los datos corresponden a Snake Island.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
});

(()=>{
const form=document.querySelector('#product-form');
if(!form)return;
const admin=document.querySelector('#admin-catalogo');
const heading=admin.querySelector('.admin-heading');
const list=document.querySelector('#admin-product-list');
const statusLine=document.querySelector('#admin-status');
const grid=document.querySelector('.product-grid');
const photoInput=document.querySelector('#product-photo');
const photoPreview=document.querySelector('#photo-preview');
const toolbar=document.querySelector('.admin-toolbar');
const labels={wear:'ROPA',accessories:'ACCESORIOS',collectibles:'COLECCIONABLES'};
const STORAGE_KEY='snake-island-blue-world-catalog-v2';
const PHOTO_DB='snake-island-photo-library';
const PHOTO_STORE='photos';
let selectedPhoto=null,products=[];
const safe=value=>String(value??'').trim();
const controls=[form,toolbar,statusLine,list].filter(Boolean);
controls.forEach(node=>node.hidden=true);
const gate=document.createElement('form');
gate.className='admin-login';
gate.innerHTML='<h3>ACCESO DE ADMINISTRACIÓN</h3><p>Inicia sesión para gestionar el catálogo oficial.</p><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button type="submit">ENTRAR ↗</button><p class="admin-login-status" role="status" aria-live="polite"></p>';
heading?.insertAdjacentElement('afterend',gate);
const logout=document.createElement('button');
logout.type='button';logout.className='admin-logout';logout.textContent='CERRAR SESIÓN';
heading?.append(logout);
function setStatus(message){if(statusLine)statusLine.textContent=message}
async function requestSession(){try{const r=await fetch('/api/admin-session',{cache:'no-store'});const d=await r.json();return !!d.authenticated}catch{return false}}
async function loadRemote(){
 const r=await fetch('/api/admin-catalog',{cache:'no-store'});
 const d=await r.json();
 if(!r.ok)throw new Error(d.error||'No se pudo cargar el catálogo.');
 products=Array.isArray(d.products)?d.products:[];
 render();
}
async function saveRemote(){
 const r=await fetch('/api/admin-catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({products})});
 const d=await r.json();
 if(!r.ok)throw new Error(d.error||'No se pudo guardar el catálogo.');
 renderPublicCards();
}
function addProductToBag(product){
 let size='';
 if(product.category==='wear'){
  size=(window.prompt('Elige talla: chica, mediana o grande','mediana')||'').trim().toLowerCase();
  if(!['chica','mediana','grande'].includes(size)){alert('Selecciona talla chica, mediana o grande.');return}
 }
 cart.push({name:product.name,size,sizes:size?[size]:[],price:Number(product.price),quantity:1});
 renderCart();dialog?.showModal();
 if(toast){toast.textContent='ARTÍCULO AÑADIDO A TU BOLSA';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}
function renderPublicCards(){
 grid?.querySelectorAll('[data-managed="true"]').forEach(card=>card.remove());
 products.forEach(product=>{
  const card=document.createElement('article');card.className='product-card managed-product';card.dataset.category=product.category;card.dataset.managed='true';
  const visual=document.createElement('div');visual.className='product-art art-managed';
  if(product.image){const img=document.createElement('img');img.src=product.image;img.alt=product.name;img.loading='lazy';visual.append(img)}
  const info=document.createElement('div');info.className='product-info';
  const wrap=document.createElement('div'),small=document.createElement('small'),title=document.createElement('h3'),price=document.createElement('strong');
  small.textContent=(labels[product.category]||'ARTÍCULO')+' / BLUE WORLDS';title.textContent=product.name;price.textContent='$'+Number(product.price).toLocaleString('es-MX')+' MXN';
  wrap.append(small,title);info.append(wrap,price);
  if(product.description){const desc=document.createElement('p');desc.className='product-price-detail';desc.textContent=product.description;card.append(visual,info,desc)}else card.append(visual,info);
  const stock=document.createElement('small');stock.className='managed-stock';stock.textContent=Number(product.stock)>0?'DISPONIBLES: '+Number(product.stock):'CONSULTAR EXISTENCIAS';
  const add=document.createElement('button');add.className='add-button';add.type='button';add.textContent='AÑADIR A LA BOLSA +';add.addEventListener('click',()=>addProductToBag(product,add));
  card.append(stock,add);grid?.append(card);
 });
}
function render(){
 list.replaceChildren();
 products.forEach(product=>{
  const row=document.createElement('article');row.className='admin-product-row';
  const info=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('span');
  name.textContent=product.name;detail.textContent=(labels[product.category]||'ARTÍCULO')+' · $'+Number(product.price).toLocaleString('es-MX')+' MXN · EXISTENCIAS: '+Number(product.stock||0);
  info.append(name,detail);
  const actions=document.createElement('div');actions.className='admin-row-actions';
  const edit=document.createElement('button');edit.type='button';edit.textContent='EDITAR';
  edit.addEventListener('click',()=>{
   document.querySelector('#edit-id').value=product.id;
   document.querySelector('#product-name').value=product.name;
   document.querySelector('#product-category').value=product.category;
   document.querySelector('#product-image').value=product.image||'';
   document.querySelector('#product-description').value=product.description||'';
   document.querySelector('#product-price').value=product.price;
   document.querySelector('#product-stock').value=product.stock||0;
   selectedPhoto=null;photoInput.value='';photoPreview.hidden=!product.image;photoPreview.src=product.image||'';
   document.querySelector('#save-product').textContent='ACTUALIZAR ARTÍCULO ↗';
   form.scrollIntoView({behavior:'smooth',block:'start'});
  });
  const remove=document.createElement('button');remove.type='button';remove.textContent='ELIMINAR';
  remove.addEventListener('click',async()=>{if(!confirm('¿Eliminar '+product.name+' del catálogo público?'))return;products=products.filter(item=>item.id!==product.id);try{await saveRemote();setStatus('Artículo eliminado del catálogo oficial.')}catch(e){setStatus(e.message)}});
  actions.append(edit,remove);row.append(info,actions);list.append(row);
 });
 renderPublicCards();
}
function reset(){form.reset();document.querySelector('#edit-id').value='';document.querySelector('#save-product').textContent='GUARDAR ARTÍCULO ↗';selectedPhoto=null;photoPreview.hidden=true;photoPreview.removeAttribute('src')}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})}
async function uploadPhoto(file){
 if(file.size>4*1024*1024)throw new Error('La fotografía debe pesar máximo 4 MB.');
 const dataUrl=await readFile(file);
 const r=await fetch('/api/admin-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl})});
 const d=await r.json();if(!r.ok)throw new Error(d.error||'No se pudo subir la fotografía.');
 return d.url;
}
photoInput?.addEventListener('change',()=>{selectedPhoto=photoInput.files?.[0]||null;if(selectedPhoto){if(!selectedPhoto.type.startsWith('image/')){selectedPhoto=null;photoInput.value='';setStatus('Selecciona un archivo de imagen.');return}photoPreview.src=URL.createObjectURL(selectedPhoto);photoPreview.hidden=false}else{photoPreview.hidden=true;photoPreview.removeAttribute('src')}});
form.addEventListener('submit',async event=>{
 event.preventDefault();
 const editId=document.querySelector('#edit-id').value,previous=products.find(item=>item.id===editId);
 const category=document.querySelector('#product-category').value,price=Number(document.querySelector('#product-price').value),stock=Number(document.querySelector('#product-stock').value);
 const product={id:editId||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name:safe(document.querySelector('#product-name').value),category,image:safe(document.querySelector('#product-image').value),description:safe(document.querySelector('#product-description').value),price,stock};
 if(!product.name||!Object.hasOwn(labels,category)||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return;
 try{
  const saveButton=document.querySelector('#save-product');saveButton.disabled=true;
  if(selectedPhoto)product.image=await uploadPhoto(selectedPhoto);
  else if(previous?.image)product.image=previous.image;
  const index=products.findIndex(item=>item.id===product.id);if(index>=0)products[index]=product;else products.push(product);
  await saveRemote();reset();setStatus('Guardado en el catálogo oficial. Ya está disponible para los visitantes.');
 }catch(error){setStatus(error.message||'No se pudo guardar.')}
 finally{document.querySelector('#save-product').disabled=false}
});
document.querySelector('#cancel-edit')?.addEventListener('click',reset);
document.querySelector('#export-products')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='snake-island-catalogo.json';a.click();URL.revokeObjectURL(url);setStatus('Respaldo del catálogo descargado.')});
document.querySelector('#import-products')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported)||imported.length>200||imported.some(p=>!p.name||!Object.hasOwn(labels,p.category)||!Number.isFinite(Number(p.price))))throw new Error('Formato de catálogo no válido.');products=imported.map(p=>({id:safe(p.id)||crypto.randomUUID(),name:safe(p.name),category:p.category,image:safe(p.image),description:safe(p.description),price:Number(p.price),stock:Number(p.stock||0)}));await saveRemote();setStatus('Catálogo importado y publicado.');}catch(e){setStatus(e.message||'No se pudo importar.')}event.target.value=''});
async function getLegacyPhoto(id){
 if(!id)return null;
 return new Promise(resolve=>{try{const req=indexedDB.open(PHOTO_DB,1);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE)){db.close();resolve(null);return}const get=db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);get.onsuccess=()=>{const value=get.result||null;db.close();resolve(value)};get.onerror=()=>{db.close();resolve(null)}};req.onerror=()=>resolve(null)}catch{resolve(null)}});
}
async function migrateLegacy(){
 if(localStorage.getItem('snake-island-blue-catalog-migrated-v1'))return;
 let legacy=[];try{legacy=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{}
 if(!Array.isArray(legacy)||!legacy.length){localStorage.setItem('snake-island-blue-catalog-migrated-v1','1');return}
 if(products.length){setStatus('Hay productos locales antiguos y un catálogo público existente. Exporta el catálogo local para revisar la fusión antes de importarlo.');return}
 const migrated=[];
 for(const item of legacy){
  let image=safe(item.image);
  if(item.photoId){const blob=await getLegacyPhoto(item.photoId);if(blob){const file=new File([blob],'legacy-image',{type:blob.type||'image/jpeg'});image=await uploadPhoto(file)}}
  migrated.push({id:safe(item.id)||crypto.randomUUID(),name:safe(item.name),category:item.category,image,description:safe(item.description),price:Number(item.price),stock:Number(item.stock||0)});
 }
 products=migrated;await saveRemote();localStorage.setItem('snake-island-blue-catalog-migrated-v1','1');
 setStatus('Catálogo guardado anteriormente en este teléfono migrado al catálogo público.');
}
async function unlock(){
 gate.hidden=true;controls.forEach(node=>node.hidden=false);
 try{await loadRemote();await migrateLegacy();}catch(e){setStatus(e.message||'Error al conectar el catálogo.')}
}
gate.addEventListener('submit',async event=>{
 event.preventDefault();const input=gate.querySelector('input[name="password"]'),note=gate.querySelector('.admin-login-status');
 const button=gate.querySelector('button');button.disabled=true;note.textContent='Verificando…';
 try{const r=await fetch('/api/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'No se pudo iniciar sesión.');input.value='';await unlock();}
 catch(e){note.textContent=e.message||'No se pudo iniciar sesión.';input.select()}
 finally{button.disabled=false}
});
logout.addEventListener('click',async()=>{await fetch('/api/admin-session',{method:'DELETE'});controls.forEach(node=>node.hidden=true);gate.hidden=false;setStatus('Sesión cerrada.')});
(async()=>{
 try{const response=await fetch('/api/catalog',{cache:'no-store'});if(response.ok){const data=await response.json();products=Array.isArray(data.products)?data.products:[];renderPublicCards()}}
 catch(error){console.warn('No se pudo cargar el catálogo compartido:',error)}
 if(await requestSession())await unlock();else gate.hidden=false;
})();
})();