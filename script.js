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
    cart.forEach((name,index)=>{
      const item=document.createElement('li');
      const title=document.createElement('span');
      const remove=document.createElement('button');
      title.textContent=name+' — '+(prices[name]!==undefined?money(prices[name]):'PRECIO POR CONFIRMAR');
      remove.type='button';remove.className='cart-remove';remove.textContent='REMOVE';
      remove.setAttribute('aria-label','Quitar '+name+' de la bolsa');
      remove.addEventListener('click',()=>{cart.splice(index,1);renderCart()});
      item.append(title,remove);list.append(item);
    });
  }
  if(empty)empty.hidden=cart.length>0;
  if(total)total.textContent=money(cart.reduce((sum,name)=>sum+(prices[name]||0),0));
}
document.querySelector('#bag-open')?.addEventListener('click',()=>dialog?.showModal());
document.querySelector('#cart-close')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
document.querySelector('#cart-clear')?.addEventListener('click',()=>{cart.length=0;renderCart()});
document.querySelectorAll('.add-button').forEach(button=>button.addEventListener('click',()=>{
  cart.push(button.dataset.product||'BLUE WORLDS ITEM');
  renderCart();
  dialog?.showModal();
  if(toast){toast.textContent='ADDED TO YOUR BLUE WORLDS BAG';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),1800)}
}));
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
renderCart();