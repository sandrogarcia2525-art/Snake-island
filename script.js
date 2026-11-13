const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.main-nav');
function closeMenu(){nav?.classList.remove('open');menuButton?.setAttribute('aria-expanded','false');menuButton?.setAttribute('aria-label','Abrir menú')}
menuButton?.addEventListener('click',()=>{const open=nav?.classList.toggle('open')??false;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú')});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const filters=[...document.querySelectorAll('.filter')];
const products=[...document.querySelectorAll('.product-card')];
filters.forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.filter;filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});products.forEach(card=>{card.hidden=category!=='all'&&card.dataset.category!==category})}));
let bagCount=0;
const count=document.querySelector('#bag-count');
const toast=document.querySelector('#toast');
document.querySelectorAll('.add-button').forEach(button=>button.addEventListener('click',()=>{bagCount++;if(count)count.textContent=String(bagCount);if(toast){toast.textContent=button.dataset.product+' · AÑADIDO A TU BOLSA';toast.classList.add('show');window.clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('show'),2200)}}));
let toastTimer;
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();