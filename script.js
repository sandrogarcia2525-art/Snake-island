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
const itemPrice=item=>Number.isFinite(item.price)?item.price:(prices[item.name]??null);
function addUnifiedCartItem({productId=null,name,size='',sizes=[],price=null,stock=null,packageUnits=1}){
 const key=productId?(productId+':'+name):'static:'+name;
 const existing=cart.find(item=>(item.productId||('static:'+item.name))===key&&item.size===size&&Number(item.packageUnits||1)===Number(packageUnits||1));
 const maxPackages=stock!==null&&stock!==undefined&&stock!==''&&Number.isFinite(Number(stock))?Math.floor(Number(stock)/Math.max(1,Number(packageUnits)||1)):null;
 if(maxPackages!==null&&maxPackages<=0){alert('No hay existencias suficientes para esta presentación. Consulta disponibilidad con el equipo.');return}
 if(existing){
  if(maxPackages!==null&&existing.quantity>=maxPackages){alert('No hay más existencias disponibles para sumar.');return}
  existing.quantity++;
  if(sizes.length)existing.sizes.push(...sizes);
 }else{
  cart.push({productId,name,size,sizes:[...sizes],price:price!==null&&price!==undefined&&price!==''&&Number.isFinite(Number(price))?Number(price):null,quantity:1,stock:maxPackages,packageUnits:Math.max(1,Number(packageUnits)||1),unitsPerPackage:Math.max(1,Number(packageUnits)||1)});
 }
 renderCart();dialog?.showModal();
 if(toast){toast.textContent='ARTÍCULO AÑADIDO A TU BOLSA';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}
const count=document.querySelector('#bag-count');
const dialog=document.querySelector('#cart-dialog');
const list=document.querySelector('#cart-items');
const empty=document.querySelector('#cart-empty');
const toast=document.querySelector('#toast');
const total=document.querySelector('#cart-total');
let toastTimer;
function renderCart(){
  if(count)count.textContent=String(cart.reduce((sum,item)=>sum+(Number(item.quantity)||1)*(item.packageUnits||1),0));
  if(list){
    list.replaceChildren();
    cart.forEach((entry,index)=>{
      const item=document.createElement('li');
      item.className='cart-line';
      const details=document.createElement('div');details.className='cart-line-details';
      const title=document.createElement('strong');
      const unitPrice=itemPrice(entry);
      title.textContent=entry.name+(entry.sizes?.length?' / TALLAS '+entry.sizes.join(', '):(entry.size?' / TALLA '+entry.size:''));
      const lineTotal=document.createElement('span');lineTotal.textContent=unitPrice===null?'PRECIO POR CONFIRMAR':money(unitPrice*(Number(entry.quantity)||1))+(entry.packageUnits>1?' · '+entry.packageUnits+' piezas por paquete': ' · '+money(unitPrice)+' c/u');
      details.append(title,lineTotal);
      const controls=document.createElement('div');controls.className='cart-quantity';
      const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Restar una unidad de '+entry.name);
      const qty=document.createElement('output');qty.textContent=(entry.packageUnits>1?String(entry.quantity||1)+' paquete(s) · '+(entry.quantity||1)*entry.packageUnits+' piezas':String(entry.quantity||1));
      const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Sumar una unidad de '+entry.name);
      const remove=document.createElement('button');remove.type='button';remove.className='cart-remove';remove.textContent='QUITAR';
      minus.disabled=(entry.quantity||1)<=(entry.minQuantity||1);
      plus.disabled=Number.isFinite(entry.stock)&&entry.stock>0&&(entry.quantity||1)>=entry.stock;
      minus.addEventListener('click',()=>{if(entry.quantity>(entry.minQuantity||1)){entry.quantity--;if(entry.unitsPerPackage&&entry.sizes?.length)entry.sizes=entry.sizes.slice(0,-entry.unitsPerPackage);renderCart()}});
      plus.addEventListener('click',()=>{if(Number.isFinite(entry.stock)&&(entry.quantity||1)>=entry.stock)return;entry.quantity=(entry.quantity||1)+1;if(entry.unitsPerPackage&&entry.sizes?.length)entry.sizes.push(...entry.sizes.slice(0,entry.unitsPerPackage));renderCart()});
      remove.addEventListener('click',()=>{cart.splice(index,1);renderCart()});
      controls.append(minus,qty,plus,remove);item.append(details,controls);list.append(item);
    });
  }
  if(empty)empty.hidden=cart.length>0;
  if(total){const known=cart.reduce((sum,entry)=>sum+(itemPrice(entry)??0)*(Number(entry.quantity)||1),0);const pending=cart.some(entry=>itemPrice(entry)===null);total.textContent=money(known)+(pending?' + artículos por cotizar':'')}
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
  addUnifiedCartItem({name,size:sizes.join('|'),sizes,price:info.price,packageUnits:info.units});
}
document.querySelectorAll('.add-button[data-product]').forEach(button=>button.addEventListener('click',()=>addCatalogItem(button.dataset.product)));
document.querySelectorAll('.inquiry-button').forEach(button=>button.addEventListener('click',()=>{
  const product=button.dataset.inquiry||'producto Blue Worlds';
  const message='Hola, quiero consultar precio, existencias y fotografías disponibles de '+product+' de Snake Island × Blue Worlds.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
}));
// Todos los artículos informativos pueden agregarse a la bolsa.
// PEPE tiene dos variantes independientes: cada una conserva su propio precio e inventario.
document.querySelectorAll('.product-card').forEach(card=>{
 const inquiries=[...card.querySelectorAll('.inquiry-button')];
 if(!inquiries.length)return;
 const heading=card.querySelector('.product-info h3')?.textContent?.trim()||'Artículo de catálogo';
 const isPepe=/^PEPE$/i.test(heading);
 const isDounots=/^DOUNOTS$/i.test(heading);
 const variants=isPepe
  ? [{name:'PEPE · OPCIÓN 1 · 1 g',price:1000,label:'AÑADIR OPCIÓN 1 · 1 g · $1,000 MXN',units:1},{name:'PEPE · OPCIÓN 2 · 1/2 g',price:650,label:'AÑADIR OPCIÓN 2 · 1/2 g · $650 MXN',units:1}]
  : isDounots
  ? [{name:'DOUNOTS · 1 PIEZA',price:850,label:'AÑADIR 1 PIEZA · $850 MXN',units:1},{name:'DOUNOTS · PAQUETE 5 PIEZAS',price:2500,label:'AÑADIR PAQUETE 5 PIEZAS · $2,500 MXN',units:5},{name:'DOUNOTS · PAQUETE 10 PIEZAS',price:4500,label:'AÑADIR PAQUETE 10 PIEZAS · $4,500 MXN',units:10}]
  : /^NENA/i.test(heading)
  ? [{name:'NENA · PAQUETE 3 PIEZAS',price:250,label:'AÑADIR PAQUETE 3 PIEZAS · $250 MXN',units:3}]
  : /^PLUMA/i.test(heading)
  ? [{name:'PLUMA · 1 PIEZA',price:650,label:'AÑADIR 1 PIEZA · $650 MXN',units:1}]
  : /^DONA/i.test(heading)
  ? [{name:'DONA · PAQUETE 50 PIEZAS',price:15000,label:'AÑADIR PAQUETE 50 PIEZAS · $15,000 MXN',units:50}]
  : /^ESTAMPILLA GREEN/i.test(heading)
  ? [{name:'ESTAMPILLA GREEN · 1 PIEZA',price:25,label:'AÑADIR 1 PIEZA · $25 MXN',units:1}]
  : /^PACA GREEN MERCH/i.test(heading)
  ? [{name:'PACA GREEN MERCH · 1 PACA',price:7500,label:'AÑADIR 1 PACA · $7,500 MXN',units:1}]
  : [{name:heading,price:null,label:'AÑADIR A LA BOLSA +',units:1}];
 const original=inquiries[0];
 variants.forEach(variant=>{
  const add=document.createElement('button');add.type='button';add.className='add-button catalog-bag-add';add.textContent=isDounots||isPepe?variant.label:'AÑADIR A LA BOLSA +';
  original.insertAdjacentElement('beforebegin',add);
  add.addEventListener('click',()=>addStaticCatalogItem(variant,variant.units||1));
 });function addStaticCatalogItem(variant,packageUnits=1){
 addUnifiedCartItem({name:variant.name,price:variant.price,stock:null,packageUnits});
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
renderCart();
const cardPay=document.querySelector('#pay-card');
cardPay?.addEventListener('click',async()=>{
  const items=cart.map(item=>({name:item.name,sizes:item.sizes||[],quantity:Number(item.quantity)||1}));
  if(!items.length){alert('Agrega primero un artículo a tu bolsa.');return}
  if(items.some(item=>!checkoutCatalog[item.name])){alert('Los artículos agregados desde el panel local no están habilitados para cobro en línea.');return}
  cardPay.disabled=true;cardPay.textContent='CONECTANDO CON MERCADO PAGO…';
  try{const response=await fetch('/api/create-preference',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});const data=await response.json();if(!response.ok||!data.init_point)throw new Error(data.error||'No se pudo iniciar el pago');window.location.assign(data.init_point)}catch(error){alert(error.message+' Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado en Vercel.');cardPay.disabled=false;cardPay.textContent='PAGAR CON TARJETA ↗'}
});
document.querySelector('#pay-cash')?.addEventListener('click',()=>{
  if(!cart.length){alert('Agrega primero un artículo a tu bolsa.');return}
  const lines=cart.map(item=>'- '+item.name+' × '+(Number(item.quantity)||1)+(item.packageUnits?' paquete(s) de '+item.packageUnits+' piezas':'')+(item.sizes?.length?' / tallas '+item.sizes.join(', '):(item.size?' / talla '+item.size:''))+' — '+(itemPrice(item)===null?'PRECIO POR CONFIRMAR':money(itemPrice(item)*(Number(item.quantity)||1))));
  const amount=cart.reduce((sum,item)=>sum+(itemPrice(item)??0)*(Number(item.quantity)||1),0);
  const pending=cart.some(item=>itemPrice(item)===null);
  const message='Hola, quiero consultar este pedido de Snake Island × Blue Worlds:\n'+lines.join('\n')+'\nSubtotal de precios publicados: '+money(amount)+(pending?'\nHay artículos cuyo precio debe confirmarse.':'')+'\nConfirmen existencias, tallas, zona y costo de envío, y si es posible pagar en efectivo. Este mensaje es solo una consulta; aún no confirmo el pedido.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
});

document.querySelector('#pay-transfer')?.addEventListener('click',()=>{
  if(!cart.length){alert('Agrega primero un artículo a tu bolsa.');return}
  const lines=cart.map(item=>'- '+item.name+' × '+(Number(item.quantity)||1)+(item.packageUnits?' paquete(s) de '+item.packageUnits+' piezas':'')+(item.sizes?.length?' / tallas '+item.sizes.join(', '):(item.size?' / talla '+item.size:''))+' — '+(itemPrice(item)===null?'PRECIO POR CONFIRMAR':money(itemPrice(item)*(Number(item.quantity)||1))));
  const amount=cart.reduce((sum,item)=>sum+(itemPrice(item)??0)*(Number(item.quantity)||1),0);
  const pending=cart.some(item=>itemPrice(item)===null);
  const message='Hola, quiero solicitar los datos oficiales para pagar por transferencia o depósito mi pedido de Snake Island × Blue Worlds:\n'+lines.join('\n')+'\nSubtotal de precios publicados: '+money(amount)+(pending?'\nHay artículos cuyo precio debe confirmarse.':'')+'\nPor favor envíenme los datos bancarios, titular y referencia. No realizaré el depósito hasta confirmar precios, existencias y que los datos corresponden a Snake Island.';
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
const labels={wear:'ROPA',accessories:'ACCESORIOS',collectibles:'COLECCIONABLES','merch-green':'MERCH GREEN'};
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
logout.hidden=true;
heading?.append(logout);
const lockLabel=admin.querySelector('.admin-lock');if(lockLabel)lockLabel.textContent='PANEL PROTEGIDO';
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
 if(!Number.isFinite(Number(product.stock))||Number(product.stock)<=0){alert('Este artículo no tiene existencias registradas. Consulta disponibilidad con el equipo.');return}
 let size='';
 if(product.category==='wear'){
  size=(window.prompt('Elige talla: chica, mediana o grande','mediana')||'').trim().toLowerCase();
  if(!['chica','mediana','grande'].includes(size)){alert('Selecciona talla chica, mediana o grande.');return}
 }
 addUnifiedCartItem({productId:product.id,name:product.name,size,sizes:size?[size]:[],price:Number(product.price),stock:Number(product.stock),packageUnits:1});
}
function renderPublicCards(){
 grid?.querySelectorAll('[data-managed="true"]').forEach(card=>card.remove());
 const normalizeName=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(pack|paquete)\b/g,'').replace(/\b\d+\s*(pz|pza|pzas|pieza|piezas)\b/g,'').replace(/\b\d+\b/g,'').replace(/[^a-z0-9]/g,'').replace(/s$/,'');
 products.forEach(product=>{
  const key=normalizeName(product.name);
  grid?.querySelectorAll('.product-card:not([data-managed="true"])').forEach(existing=>{
   const title=existing.querySelector('.product-info h3')?.textContent||'';
   if(normalizeName(title)===key)existing.remove();
  });
  const card=document.createElement('article');card.className='product-card managed-product';card.dataset.category=product.category;card.dataset.managed='true';
  const visual=document.createElement('div');visual.className='product-art art-managed';
  if(product.image){const img=document.createElement('img');img.src=product.image;img.alt=product.name;img.loading='lazy';visual.append(img)}
  const info=document.createElement('div');info.className='product-info';
  const wrap=document.createElement('div'),small=document.createElement('small'),title=document.createElement('h3'),price=document.createElement('strong');
  small.textContent=(labels[product.category]||'ARTÍCULO')+' / BLUE WORLDS';title.textContent=product.name;price.textContent='$'+Number(product.price).toLocaleString('es-MX')+' MXN';
  wrap.append(small,title);info.append(wrap,price);
  if(product.description){const desc=document.createElement('p');desc.className='product-price-detail';desc.textContent=product.description;card.append(visual,info,desc)}else card.append(visual,info);
  const stock=document.createElement('small');stock.className='managed-stock';stock.textContent=Number(product.stock)>0?'DISPONIBLES: '+Number(product.stock):'CONSULTAR EXISTENCIAS';
  const cleanName=String(product.name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  let variants=[{name:product.name,price:Number(product.price),units:1,label:'AÑADIR 1 PIEZA'}];
  if(/^pepe$/.test(cleanName))variants=[{name:'PEPE · OPCIÓN 1 · 1 g',price:1000,units:1,label:'OPCIÓN 1 · 1 g · $1,000 MXN'},{name:'PEPE · OPCIÓN 2 · 1/2 g',price:650,units:1,label:'OPCIÓN 2 · 1/2 g · $650 MXN'}];
  else if(/^dounots/.test(cleanName))variants=[{name:'DOUNOTS · 1 PIEZA',price:850,units:1,label:'1 PIEZA · $850 MXN'},{name:'DOUNOTS · PAQUETE 5 PIEZAS',price:2500,units:5,label:'PAQUETE 5 PIEZAS · $2,500 MXN'},{name:'DOUNOTS · PAQUETE 10 PIEZAS',price:4500,units:10,label:'PAQUETE 10 PIEZAS · $4,500 MXN'}];
  else if(/^nena/.test(cleanName))variants=[{name:'NENA · PAQUETE 3 PIEZAS',price:250,units:3,label:'PAQUETE 3 PIEZAS · $250 MXN'}];
  else if(/^plumas?$/.test(cleanName))variants=[{name:'PLUMA · 1 PIEZA',price:650,units:1,label:'1 PIEZA · $650 MXN'}];
  else if(/^dona/.test(cleanName))variants=[{name:'DONA · PAQUETE 50 PIEZAS',price:15000,units:50,label:'PAQUETE 50 PIEZAS · $15,000 MXN'}];
  else if(/^estampilla green/.test(cleanName))variants=[{name:'ESTAMPILLA GREEN · 1 PIEZA',price:25,units:1,label:'1 PIEZA · $25 MXN'}];
  variants.forEach(variant=>{
   const add=document.createElement('button');add.className='add-button';add.type='button';add.textContent=variant.label+' +';
   add.addEventListener('click',()=>{
    if(!Number.isFinite(Number(product.stock))||Number(product.stock)<=0){alert('Este artículo no tiene existencias registradas. Consulta disponibilidad con el equipo.');return}
    addUnifiedCartItem({productId:product.id,name:variant.name,price:variant.price,stock:Number(product.stock),packageUnits:variant.units});
   });
   card.append(add);
  });
  card.append(stock);grid?.append(card);
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
async function optimizePhoto(file){
 if(file.size<=2.5*1024*1024)return file;
 if(typeof createImageBitmap!=='function')throw new Error('Esta fotografía supera 2.5 MB. Reduce su tamaño y vuelve a intentarlo.');
 const bitmap=await createImageBitmap(file);
 const canvas=document.createElement('canvas');
 let scale=Math.min(1,Math.sqrt((2.35*1024*1024)/file.size));
 let blob=null;
 for(let attempt=0;attempt<7;attempt++){
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');
  context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',Math.max(.58,.84-attempt*.04)));
  if(blob&&blob.size<=2.5*1024*1024)break;
  scale*=.82;
 }
 bitmap.close?.();
 if(!blob||blob.size>2.5*1024*1024)throw new Error('No se pudo optimizar la fotografía. Usa una imagen más ligera.');
 return new File([blob],(file.name||'catalogo').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
}
async function uploadPhoto(file){
 const optimized=await optimizePhoto(file);
 const dataUrl=await readFile(optimized);
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
  const index=products.findIndex(item=>item.id===product.id);if(index>=0)products[index]=product;else products.push(product);
  await saveRemote();reset();setStatus('Guardado en el catálogo oficial. Ya está disponible para los visitantes.');
 }catch(error){setStatus(error.message||'No se pudo guardar.')}
 finally{document.querySelector('#save-product').disabled=false}
});
document.querySelector('#cancel-edit')?.addEventListener('click',reset);
document.querySelector('#set-all-stock')?.addEventListener('click',async()=>{
 if(!products.length){setStatus('No hay artículos en el catálogo compartido para actualizar.');return}
 if(!confirm('Esto establecerá exactamente 1,000 existencias para CADA artículo del catálogo actual. Los valores de stock anteriores serán reemplazados. ¿Deseas continuar?'))return;
 const button=document.querySelector('#set-all-stock');button.disabled=true;
 const previous=products.map(product=>({id:product.id,stock:product.stock}));
 try{
  products=products.map(product=>({...product,stock:1000}));
  await saveRemote();
  setStatus('Configuración guardada: '+products.length+' artículos con 1,000 existencias cada uno. Total registrado: '+(products.length*1000).toLocaleString('es-MX')+' unidades.');
 }catch(error){
  products=products.map(product=>{const old=previous.find(item=>item.id===product.id);return old?{...product,stock:old.stock}:product});
  setStatus(error.message||'No se pudieron actualizar las existencias.');
  render();
 }finally{button.disabled=false}
});
document.querySelector('#export-products')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='snake-island-catalogo.json';a.click();URL.revokeObjectURL(url);setStatus('Respaldo del catálogo descargado.')});
document.querySelector('#import-products')?.addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  const imported=JSON.parse(await file.text());
  if(!Array.isArray(imported)||imported.length>200||imported.some(p=>!p||!p.name||!Object.hasOwn(labels,p.category)||!Number.isFinite(Number(p.price))||Number(p.price)<0||!Number.isInteger(Number(p.stock||0))||Number(p.stock||0)<0))throw new Error('Formato de catálogo no válido.');
  const merged=[...products];
  const normalizeName=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(pack|paquete)\b/g,'').replace(/\b\d+\s*(pz|pza|pzas|pieza|piezas)\b/g,'').replace(/\b\d+\s*piezas?\b/g,'').replace(/\b\d+\b/g,'').replace(/[^a-z0-9]/g,'').replace(/s$/,'');
  let added=0,updated=0;
  for(const p of imported){
   let image=safe(p.image);
   if(p.photoData&&String(p.photoData).startsWith('data:image/')){
    const photoBlob=await (await fetch(p.photoData)).blob();
    const fileImage=new File([photoBlob],'catalog-image',{type:photoBlob.type||'image/jpeg'});
    image=await uploadPhoto(fileImage);
   }
   const incoming={id:safe(p.id)||crypto.randomUUID(),name:safe(p.name),category:p.category,image,description:safe(p.description),price:Number(p.price),stock:Number(p.stock||0)};
   const normalized=normalizeName(incoming.name);
   let index=merged.findIndex(item=>item.id===incoming.id);
   if(index<0)index=merged.findIndex(item=>normalizeName(item.name)===normalized);
   if(index>=0){incoming.id=merged[index].id;merged[index]={...merged[index],...incoming};updated++}
   else{merged.push(incoming);added++}
  }
  products=merged;
  await saveRemote();
  setStatus('Fusión completada: '+added+' artículos nuevos y '+updated+' actualizados. El catálogo oficial conserva los demás artículos.');
 }catch(e){setStatus(e.message||'No se pudo importar.')}
 event.target.value='';
});
async function getLegacyPhoto(id){
 if(!id)return null;
 return new Promise(resolve=>{try{const req=indexedDB.open(PHOTO_DB,1);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains(PHOTO_STORE)){db.close();resolve(null);return}const get=db.transaction(PHOTO_STORE).objectStore(PHOTO_STORE).get(id);get.onsuccess=()=>{const value=get.result||null;db.close();resolve(value)};get.onerror=()=>{db.close();resolve(null)}};req.onerror=()=>resolve(null)}catch{resolve(null)}});
}
async function migrateLegacy(){
 if(localStorage.getItem('snake-island-blue-catalog-migrated-v1'))return;
 let legacy=[];try{legacy=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{}
 if(!Array.isArray(legacy)||!legacy.length){localStorage.setItem('snake-island-blue-catalog-migrated-v1','1');return}
 const migrated=[];
 const existingIds=new Set(products.map(item=>item.id));
 for(const item of legacy){
  let image=safe(item.image);
  if(item.photoId){const blob=await getLegacyPhoto(item.photoId);if(blob){const file=new File([blob],'legacy-image',{type:blob.type||'image/jpeg'});image=await uploadPhoto(file)}}
  const id=safe(item.id)||crypto.randomUUID();if(existingIds.has(id))continue;
  migrated.push({id,name:safe(item.name),category:item.category,image,description:safe(item.description),price:Number(item.price),stock:Number(item.stock||0)});
 }
 products=products.concat(migrated);await saveRemote();localStorage.setItem('snake-island-blue-catalog-migrated-v1','1');
 setStatus('Catálogo guardado anteriormente en este teléfono migrado al catálogo público.');
}
async function unlock(){
 gate.hidden=true;logout.hidden=false;controls.forEach(node=>node.hidden=false);
 try{await loadRemote();await migrateLegacy();}catch(e){setStatus(e.message||'Error al conectar el catálogo.')}
}
gate.addEventListener('submit',async event=>{
 event.preventDefault();const input=gate.querySelector('input[name="password"]'),note=gate.querySelector('.admin-login-status');
 const button=gate.querySelector('button');button.disabled=true;note.textContent='Verificando…';
 try{const r=await fetch('/api/admin-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:input.value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'No se pudo iniciar sesión.');input.value='';await unlock();}
 catch(e){note.textContent=e.message||'No se pudo iniciar sesión.';input.select()}
 finally{button.disabled=false}
});
logout.addEventListener('click',async()=>{await fetch('/api/admin-session',{method:'DELETE'});controls.forEach(node=>node.hidden=true);logout.hidden=true;gate.hidden=false;setStatus('Sesión cerrada.')});
(async()=>{
 try{const response=await fetch('/api/catalog',{cache:'no-store'});if(response.ok){const data=await response.json();products=Array.isArray(data.products)?data.products:[];renderPublicCards()}}
 catch(error){console.warn('No se pudo cargar el catálogo compartido:',error)}
 if(await requestSession())await unlock();else gate.hidden=false;
})();
})();