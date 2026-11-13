const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
function closeMenu(){nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Abrir menú')}
menuButton?.addEventListener('click',()=>{const open=nav?.classList.toggle('open')??false;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const filters=[...document.querySelectorAll('.filter')];
const products=[...document.querySelectorAll('.product-card')];
filters.forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.filter;filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});products.forEach(card=>{card.hidden=category!=='all'&&card.dataset.category!==category})}));

const cart=[];
const prices={'BLUE WORLD TEE':599,'WORLD HOODIE':899,'SMILE CAP':499,'BLUE TOTE BAG':399};
const orderPhone='524181516612';
const clothing=new Set(['BLUE WORLD TEE','WORLD HOODIE','FLOWER WORLD LONGSLEEVE']);
const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
const count=document.querySelector('#bag-count');
const dialog=document.querySelector('#cart-dialog');
const list=document.querySelector('#cart-items');
const empty=document.querySelector('#cart-empty');
const toast=document.querySelector('#toast');
const total=document.querySelector('#cart-total');
let toastTimer;
function renderCart(){
  if(count)count.textContent=String(cart.length);
  if(list){
    list.replaceChildren();
    cart.forEach((entry,index)=>{
      const name=entry.name;
      const item=document.createElement('li');
      const title=document.createElement('span');
      const remove=document.createElement('button');
      title.textContent=name+(entry.size?' / TALLA '+entry.size:'')+' — '+(prices[name]!==undefined?money(prices[name]):'PRECIO POR CONFIRMAR');
      remove.type='button';remove.className='cart-remove';remove.textContent='REMOVE';
      remove.setAttribute('aria-label','Quitar '+name+' de la bolsa');
      remove.addEventListener('click',()=>{cart.splice(index,1);renderCart()});
      item.append(title,remove);list.append(item);
    });
  }
  if(empty)empty.hidden=cart.length>0;
  if(total)total.textContent=money(cart.reduce((sum,entry)=>sum+(prices[entry.name]||0),0));
}
document.querySelector('#bag-open')?.addEventListener('click',()=>dialog?.showModal());
document.querySelector('#cart-close')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
document.querySelector('#cart-clear')?.addEventListener('click',()=>{cart.length=0;renderCart()});
document.querySelectorAll('.add-button').forEach(button=>button.addEventListener('click',()=>{
  const name=button.dataset.product||'BLUE WORLDS ITEM';
  let size='';
  if(clothing.has(name)){size=(window.prompt('Elige talla: chica, mediana o grande','mediana')||'').trim().toLowerCase();if(!['chica','mediana','grande'].includes(size)){alert('Selecciona talla chica, mediana o grande.');return}}
  cart.push({name,size});
  renderCart();
  dialog?.showModal();
  if(toast){toast.textContent='ADDED TO YOUR BLUE WORLDS BAG';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}));
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
renderCart();
const cardPay=document.querySelector('#pay-card');
cardPay?.addEventListener('click',async()=>{
  const items=cart.map(item=>({name:item.name,size:item.size||null,quantity:1}));
  if(!items.length){alert('Agrega primero un artículo a tu bolsa.');return}
  if(items.some(item=>prices[item.name]===undefined)){alert('Hay artículos sin precio confirmado. Retíralos de la bolsa para continuar.');return}
  cardPay.disabled=true;cardPay.textContent='CONECTANDO CON MERCADO PAGO…';
  try{const response=await fetch('/api/create-preference',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});const data=await response.json();if(!response.ok||!data.init_point)throw new Error(data.error||'No se pudo iniciar el pago');window.location.assign(data.init_point)}catch(error){alert(error.message+' Verifica que MERCADOPAGO_ACCESS_TOKEN esté configurado en Vercel.');cardPay.disabled=false;cardPay.textContent='PAGAR CON TARJETA ↗'}
});
document.querySelector('#pay-cash')?.addEventListener('click',()=>{
  if(!cart.length){alert('Agrega primero un artículo a tu bolsa.');return}
  if(cart.some(item=>prices[item.name]===undefined)){alert('Hay artículos sin precio confirmado. Retíralos de la bolsa para continuar.');return}
  const lines=cart.map(item=>'- '+item.name+(item.size?' / talla '+item.size:'')+' — '+money(prices[item.name]));
  const amount=cart.reduce((sum,item)=>sum+prices[item.name],0);
  const message='Hola, quiero realizar este pedido de Snake Island × Blue Worlds con pago en efectivo contra entrega:\n'+lines.join('\n')+'\nTotal: '+money(amount)+'\nConfirmen disponibilidad, envío y forma de entrega, por favor.';
  window.open('https://wa.me/'+orderPhone+'?text='+encodeURIComponent(message),'_blank','noopener');
});
