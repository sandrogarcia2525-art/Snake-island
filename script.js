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
document.querySelectorAll('.add-button').forEach(button=>button.addEventListener('click',()=>addCatalogItem(button.dataset.product||'BLUE WORLDS ITEM')));
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
const STORAGE_KEY='snake-island-blue-world-catalog-v2';
const PHOTO_DB='snake-island-photo-library';
const PHOTO_STORE='photos';
const labels={wear:'ROPA',accessories:'ACCESORIOS',collectibles:'COLECCIONABLES'};
const form=document.querySelector('#product-form');
if(!form)return;
const list=document.querySelector('#admin-product-list');
const statusLine=document.querySelector('#admin-status');
const grid=document.querySelector('.product-grid');
const photoInput=document.querySelector('#product-photo');
const photoPreview=document.querySelector('#photo-preview');
let selectedPhoto=null,products=[];
try{products=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{}
if(!Array.isArray(products))products=[];
const safe=value=>String(value??'').trim();
const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(products));
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(PHOTO_DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(PHOTO_STORE))req.result.createObjectStore(PHOTO_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function savePhoto(id,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).put(blob,id);tx.oncomplete=()=>{db.close();resolve(id)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function getPhoto(id){if(!id)return null;const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)}})}
async function deletePhoto(id){if(!id)return;const db=await openDB();return new Promise(resolve=>{const tx=db.transaction(PHOTO_STORE,'readwrite');tx.objectStore(PHOTO_STORE).delete(id);tx.oncomplete=tx.onerror=()=>{db.close();resolve()}})}
async function photoData(id){const blob=await getPhoto(id);if(!blob)return'';return new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>resolve('');reader.readAsDataURL(blob)})}
function reset(){form.reset();document.querySelector('#edit-id').value='';document.querySelector('#save-product').textContent='GUARDAR ARTÍCULO ↗';selectedPhoto=null;photoPreview.hidden=true;photoPreview.removeAttribute('src')}
photoInput?.addEventListener('change',()=>{selectedPhoto=photoInput.files?.[0]||null;if(selectedPhoto){if(!selectedPhoto.type.startsWith('image/')){selectedPhoto=null;photoInput.value='';statusLine.textContent='Selecciona un archivo de imagen.';return}photoPreview.src=URL.createObjectURL(selectedPhoto);photoPreview.hidden=false}else{photoPreview.hidden=true;photoPreview.removeAttribute('src')}});
function addProductToBag(product,button){
 let size='';
 if(product.category==='wear'){size=(window.prompt('Elige talla: chica, mediana o grande','mediana')||'').trim().toLowerCase();if(!['chica','mediana','grande'].includes(size)){alert('Selecciona talla chica, mediana o grande.');return}}
 cart.push({name:product.name,size,sizes:size?[size]:[],price:Number(product.price),quantity:1});
 renderCart();dialog?.showModal();
 if(toast){toast.textContent='ARTÍCULO AÑADIDO A TU BOLSA';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}
function render(){
 grid?.querySelectorAll('[data-managed="true"]').forEach(card=>card.remove());
 list.replaceChildren();
 products.forEach(product=>{
  const row=document.createElement('article');row.className='admin-product-row';
  const info=document.createElement('div'),name=document.createElement('strong'),detail=document.createElement('span');
  name.textContent=product.name;detail.textContent=(labels[product.category]||'ARTÍCULO')+' · $'+Number(product.price).toLocaleString('es-MX')+' MXN · EXISTENCIAS LOCALES: '+Number(product.stock||0);
  info.append(name,detail);
  const actions=document.createElement('div');actions.className='admin-row-actions';
  const edit=document.createElement('button');edit.type='button';edit.textContent='EDITAR';
  edit.addEventListener('click',async()=>{
   document.querySelector('#edit-id').value=product.id;
   document.querySelector('#product-name').value=product.name;
   document.querySelector('#product-category').value=product.category;
   document.querySelector('#product-image').value=product.image||'';
   document.querySelector('#product-description').value=product.description||'';
   document.querySelector('#product-price').value=product.price;
   document.querySelector('#product-stock').value=product.stock||0;
   selectedPhoto=null;photoInput.value='';photoPreview.hidden=true;photoPreview.removeAttribute('src');
   if(product.photoId){const blob=await getPhoto(product.photoId);if(blob){photoPreview.src=URL.createObjectURL(blob);photoPreview.hidden=false}}
   document.querySelector('#save-product').textContent='ACTUALIZAR ARTÍCULO ↗';form.scrollIntoView({behavior:'smooth',block:'start'});
  });
  const remove=document.createElement('button');remove.type='button';remove.textContent='ELIMINAR';
  remove.addEventListener('click',async()=>{if(!confirm('¿Eliminar '+product.name+' de este catálogo local?'))return;products=products.filter(item=>item.id!==product.id);await deletePhoto(product.photoId);save();render();statusLine.textContent='Artículo eliminado de este navegador.'});
  actions.append(edit,remove);row.append(info,actions);list.append(row);
  const card=document.createElement('article');card.className='product-card managed-product';card.dataset.category=product.category;card.dataset.managed='true';
  const visual=document.createElement('div');visual.className='product-art art-managed';
  const img=document.createElement('img');img.alt=product.name;img.loading='lazy';
  if(product.image)img.src=product.image;else if(product.photoId)getPhoto(product.photoId).then(blob=>{if(blob)img.src=URL.createObjectURL(blob)});
  visual.append(img);
  const data=document.createElement('div');data.className='product-info';
  const wrap=document.createElement('div'),small=document.createElement('small'),title=document.createElement('h3'),price=document.createElement('strong');
  small.textContent='BLUE WORLDS / NUEVO';title.textContent=product.name;price.textContent='$'+Number(product.price).toLocaleString('es-MX')+' MXN';
  wrap.append(small,title,price);data.append(wrap);
  const add=document.createElement('button');add.className='add-button';add.type='button';add.textContent='AÑADIR A LA BOLSA +';
  add.addEventListener('click',()=>addProductToBag(product,add));
  card.append(visual,data,add);grid?.append(card);
 });
}
form.addEventListener('submit',async event=>{
 event.preventDefault();const editId=document.querySelector('#edit-id').value,previous=products.find(item=>item.id===editId);
 const category=document.querySelector('#product-category').value,price=Number(document.querySelector('#product-price').value),stock=Number(document.querySelector('#product-stock').value);
 const product={id:editId||(crypto.randomUUID?crypto.randomUUID():String(Date.now())),name:safe(document.querySelector('#product-name').value),category,image:safe(document.querySelector('#product-image').value),description:safe(document.querySelector('#product-description').value),price,stock,photoId:previous?.photoId||''};
 if(!product.name||!Object.hasOwn(labels,category)||!Number.isFinite(price)||price<0||!Number.isInteger(stock)||stock<0)return;
 try{if(selectedPhoto){const key='photo-'+product.id;await savePhoto(key,selectedPhoto);if(previous?.photoId&&previous.photoId!==key)await deletePhoto(previous.photoId);product.photoId=key;product.image=''}
 const index=products.findIndex(item=>item.id===product.id);if(index>=0)products[index]=product;else products.push(product);save();render();reset();statusLine.textContent='Guardado en este teléfono. No modifica la tienda pública ni el inventario de otros dispositivos.'}
 catch{statusLine.textContent='No se pudo guardar la fotografía. Intenta otra vez.'}
});
document.querySelector('#cancel-edit')?.addEventListener('click',reset);
document.querySelector('#export-products')?.addEventListener('click',async()=>{try{const portable=[];for(const p of products)portable.push({...p,photoData:await photoData(p.photoId)});const blob=new Blob([JSON.stringify(portable,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='snake-island-catalogo-local.json';a.click();URL.revokeObjectURL(url);statusLine.textContent='Respaldo descargado con fotografías, precios y existencias locales.'}catch{statusLine.textContent='No se pudo crear el respaldo.'}});
document.querySelector('#import-products')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported)||imported.some(p=>!p.name||!Object.hasOwn(labels,p.category)||!Number.isFinite(Number(p.price))))throw new Error('Formato');const restored=[];for(const p of imported){const id=safe(p.id)||String(Date.now()+Math.random());let photoId='';if(p.photoData&&String(p.photoData).startsWith('data:image/')){const response=await fetch(p.photoData);photoId='photo-'+id;await savePhoto(photoId,await response.blob())}else if(p.photoId)photoId=p.photoId;restored.push({id,name:safe(p.name),category:p.category,image:safe(p.image),photoId,description:safe(p.description),price:Number(p.price),stock:Number(p.stock||0)})}products=restored;save();render();statusLine.textContent='Catálogo local importado.'}catch{statusLine.textContent='No se pudo importar. Usa un JSON exportado desde este panel.'}event.target.value=''});
render();
})();
