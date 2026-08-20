/* ============================================================
   МИР МАРУСИ — app.js
   Header, корзина, избранное, поиск, фильтры, интерактивы
   ============================================================ */
(function(){
'use strict';

/* ---------- helpers ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const money = n => {
  if(n===null||n===undefined||isNaN(n)) return 'Скоро';
  const round = Math.round(n*100)/100;
  const body = Number.isInteger(round)
    ? String(round)
    : round.toFixed(2).replace('.',',');
  return body.replace(/\B(?=(\d{3})+(?!\d))/g,'\u00A0') + '\u00A0₽';
};
const FREE_SHIP = 2500;   /* порог бесплатной доставки, ₽ */
const SHIP_COST = 350;    /* стоимость доставки, ₽ */
const byId  = id => MM.products.find(p=>p.id===id);
const esc   = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rand  = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- storage ---------- */
const store = {
  get(k,d){ try{ return JSON.parse(localStorage.getItem('mm_'+k)) ?? d; }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem('mm_'+k, JSON.stringify(v)); }catch(e){} }
};
let cart = store.get('cart',{});      // {id:qty}
let favs = store.get('favs',[]);      // [id]

/* ---------- toast ---------- */
let toastWrap;
function toast(msg,emoji='✨'){
  if(!toastWrap){ toastWrap=document.createElement('div'); toastWrap.className='toast-wrap'; document.body.appendChild(toastWrap); }
  const t=document.createElement('div'); t.className='toast'; t.innerHTML=`<span>${emoji}</span><span>${esc(msg)}</span>`;
  toastWrap.appendChild(t);
  setTimeout(()=>{ t.classList.add('is-out'); setTimeout(()=>t.remove(),320); },2400);
}

/* ============================================================
   ICONS
   ============================================================ */
const ICON = {
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.1a4.1 4.1 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.7-3.6 3.7-5.6 7.2-5.6s6.5 2 7.2 5.6"/></svg>',
  close:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  burger:'<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  check:'<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  arrow:'<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};

/* ============================================================
   HEADER + SHELL (инжектится на каждой странице)
   ============================================================ */
const NAV = [
  ['Книги','books.html'],['Дневники','diaries.html'],['Раскраски','coloring.html'],
  ['Игры','games.html'],['Мир Маруси','world.html'],['Коллекция','collection.html']
];
const NAV_MOBILE = NAV.concat([['Подарки','gifts.html'],['Персонажи','characters.html'],['О Марусе','about.html'],['Марусин журнал','blog.html'],['Контакты','contacts.html'],['Личный кабинет','account.html']]);

function logoSVG(size=44){
  return `<svg class="logo__mark" viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#F3DDDA" stroke="#7A5842" stroke-width="1.6"/>
    <path d="M14 44c4-13 10-20 18-20s14 7 18 20" fill="none" stroke="#7A5842" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="26" cy="28" r="2.1" fill="#7A5842"/><circle cx="38" cy="28" r="2.1" fill="#7A5842"/>
    <path d="M28 35q4 3 8 0" fill="none" stroke="#7A5842" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M20 20c2-5 6-8 12-8s10 3 12 8" fill="#C4A48D"/>
    <circle cx="46" cy="18" r="6.5" fill="#EFD08A" stroke="#7A5842" stroke-width="1.3"/>
    <path d="M43 15.5q1.6-2 3.2 0 1.6 2 3 0" fill="none" stroke="#7A5842" stroke-width="1.1"/>
    <circle cx="18" cy="46" r="2" fill="#8AA079"/><circle cx="49" cy="45" r="2.4" fill="#8FAABC"/>
  </svg>`;
}

function buildHeader(active){
  const el = $('#header-slot'); if(!el) return;
  el.outerHTML = `
  <header class="header" id="header">
    <div class="header__inner">
      <a class="logo" href="index.html" aria-label="Мир Маруси — на главную">
        ${logoSVG()}
        <span class="logo__text">
          <span class="logo__main">Мир Маруси</span>
          <span class="logo__sub">книги · дневники · игры</span>
        </span>
      </a>
      <nav class="nav" aria-label="Основная навигация">
        ${NAV.map(([t,h])=>`<a href="${h}" ${h===active?'class="is-active"':''}>${t}</a>`).join('')}
      </nav>
      <div class="header__tools">
        <button class="icon-btn" id="btn-search" aria-label="Поиск">${ICON.search}</button>
        <button class="icon-btn" id="btn-favs" aria-label="Избранное">${ICON.heart}<span class="badge" id="badge-favs">0</span></button>
        <button class="icon-btn" id="btn-cart" aria-label="Корзина">${ICON.bag}<span class="badge" id="badge-cart">0</span></button>
        <a class="btn btn--ghost btn--sm" href="account.html" id="btn-login">Войти</a>
        <button class="icon-btn burger" id="btn-burger" aria-label="Меню">${ICON.burger}</button>
      </div>
    </div>
  </header>`;

  /* mobile menu */
  document.body.insertAdjacentHTML('beforeend',`
  <div class="mmenu" id="mmenu">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <a class="logo" href="index.html">${logoSVG(38)}<span class="logo__main">Мир Маруси</span></a>
      <button class="icon-btn" data-close-mmenu aria-label="Закрыть">${ICON.close}</button>
    </div>
    <nav class="mmenu__list">
      ${NAV_MOBILE.map(([t,h])=>`<a href="${h}">${t}<span>›</span></a>`).join('')}
    </nav>
    <div style="margin-top:auto;padding-top:24px;display:flex;gap:10px">
      <a class="btn btn--primary btn--block" href="cart.html">Корзина</a>
      <a class="btn btn--ghost btn--block" href="account.html">Войти</a>
    </div>
  </div>`);

  /* search panel */
  document.body.insertAdjacentHTML('beforeend',`
  <div class="search-panel" id="search-panel">
    <div class="wrap">
      <div class="search-field">
        ${ICON.search.replace('<svg','<svg style="width:22px;height:22px;stroke:#7A5842;fill:none;stroke-width:1.6"')}
        <input id="search-input" type="search" placeholder="Что ищем? Например: дневник, раскраска, подарок 7 лет" autocomplete="off">
        <button class="icon-btn" id="search-close" aria-label="Закрыть">${ICON.close}</button>
      </div>
      <div class="search-results" id="search-results"></div>
    </div>
  </div>`);

  /* drawers */
  document.body.insertAdjacentHTML('beforeend',`
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer-cart" aria-label="Корзина">
    <div class="drawer__head"><h3>Корзина</h3><button class="icon-btn" data-close-drawer>${ICON.close}</button></div>
    <div class="drawer__body" id="cart-body"></div>
    <div class="drawer__foot" id="cart-foot"></div>
  </aside>
  <aside class="drawer" id="drawer-favs" aria-label="Избранное">
    <div class="drawer__head"><h3>Избранное</h3><button class="icon-btn" data-close-drawer>${ICON.close}</button></div>
    <div class="drawer__body" id="favs-body"></div>
  </aside>
  <div class="modal" id="modal"><button class="icon-btn modal__close" data-close-modal>${ICON.close}</button><div id="modal-body"></div></div>`);

  /* events */
  const header=$('#header');
  const onScroll=()=>header.classList.toggle('is-stuck', window.scrollY>18);
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});

  $('#btn-cart').onclick = ()=>openDrawer('drawer-cart');
  $('#btn-favs').onclick = ()=>{ renderFavsDrawer(); openDrawer('drawer-favs'); };
  $('#btn-burger').onclick = ()=>$('#mmenu').classList.add('is-on');
  $('[data-close-mmenu]').onclick = ()=>$('#mmenu').classList.remove('is-on');
  $('#btn-search').onclick = openSearch;
  $('#search-close').onclick = closeSearch;
  $('#scrim').onclick = closeAll;
  $$('[data-close-drawer]').forEach(b=>b.onclick=closeAll);
  $('[data-close-modal]').onclick = closeAll;
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeAll(); closeSearch(); $('#mmenu').classList.remove('is-on'); }});
  $('#search-input').addEventListener('input',e=>runSearch(e.target.value));
}

function openDrawer(id){ $('#scrim').classList.add('is-on'); $('#'+id).classList.add('is-on'); document.body.style.overflow='hidden'; }
function closeAll(){
  $('#scrim').classList.remove('is-on');
  $$('.drawer').forEach(d=>d.classList.remove('is-on'));
  $('#modal').classList.remove('is-on');
  document.body.style.overflow='';
}
function openModal(html){ $('#modal-body').innerHTML=html; $('#scrim').classList.add('is-on'); $('#modal').classList.add('is-on'); document.body.style.overflow='hidden'; }
function openSearch(){ $('#search-panel').classList.add('is-on'); setTimeout(()=>$('#search-input').focus(),260); runSearch(''); }
function closeSearch(){ $('#search-panel').classList.remove('is-on'); }

/* ============================================================
   SEARCH
   ============================================================ */
const SEARCH_ALIASES = {
  'подарок':'gifts','подарки':'gifts','дневник':'diaries','раскраска':'coloring','раскраски':'coloring',
  'игра':'games','игры':'games','книга':'books','книги':'books','наклейки':'collection','фигурка':'collection'
};
function runSearch(q){
  const box=$('#search-results'); const s=q.trim().toLowerCase();
  let list;
  if(!s){
    list = MM.products.filter(p=>p.status==='live').slice(0,6);
    box.innerHTML = `<div style="grid-column:1/-1;font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft)">Популярное</div>` + list.map(cardSearch).join('');
    return;
  }
  const alias = SEARCH_ALIASES[s];
  list = MM.products.filter(p =>
    p.title.toLowerCase().includes(s) || p.desc.toLowerCase().includes(s) ||
    (p.subtitle||'').toLowerCase().includes(s) || p.tags.join(' ').toLowerCase().includes(s) ||
    p.age.includes(s) || (alias && p.type===alias)
  );
  box.innerHTML = list.length ? list.map(cardSearch).join('')
    : `<div class="empty" style="grid-column:1/-1"><span class="empty__emoji">🔎</span>Маруся ничего не нашла. Попробуйте «дневник», «раскраска» или «подарок».</div>`;
}
function cardSearch(p){
  return `<a class="sresult" href="product.html?id=${p.id}">
    <div class="sresult__img"><img src="${p.cover}" alt="" loading="lazy"></div>
    <div><div style="font-family:var(--serif);font-size:.95rem;line-height:1.2">${esc(p.title)}</div>
    <div style="font-size:.8rem;color:var(--ink-soft)">${p.status==='soon'?'Скоро':money(p.price)}</div></div></a>`;
}

/* ============================================================
   CART & FAVOURITES
   ============================================================ */
function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
function cartTotal(){ return Object.entries(cart).reduce((s,[id,q])=>{ const p=byId(id); return s+(p?p.price*q:0); },0); }

function addToCart(id,silent){
  const p=byId(id); if(!p) return;
  if(p.status==='soon'){ toggleFav(id,true); toast('Товар ещё готовится. Добавили в избранное — сообщим о выходе','🔔'); return; }
  cart[id]=(cart[id]||0)+1; store.set('cart',cart); syncBadges(); renderCartDrawer(); renderCartPage();
  if(!silent){ toast(`«${p.title}» в корзине`,'🛒'); openDrawer('drawer-cart'); }
}
function setQty(id,q){ if(q<=0) delete cart[id]; else cart[id]=q; store.set('cart',cart); syncBadges(); renderCartDrawer(); renderCartPage(); }
function toggleFav(id,forceOn){
  const i=favs.indexOf(id);
  if(i>=0 && !forceOn){ favs.splice(i,1); toast('Убрали из избранного','🤍'); }
  else if(i<0){ favs.push(id); toast('Добавили в избранное','💗'); }
  store.set('favs',favs); syncBadges(); syncFavButtons(); renderFavsDrawer();
}
function syncBadges(){
  const c=$('#badge-cart'), f=$('#badge-favs');
  if(c){ c.textContent=cartCount(); c.classList.toggle('is-on',cartCount()>0); }
  if(f){ f.textContent=favs.length; f.classList.toggle('is-on',favs.length>0); }
}
function syncFavButtons(){ $$('[data-fav]').forEach(b=>b.classList.toggle('is-on',favs.includes(b.dataset.fav))); }

function renderCartDrawer(){
  const body=$('#cart-body'), foot=$('#cart-foot'); if(!body) return;
  const ids=Object.keys(cart);
  if(!ids.length){
    body.innerHTML=`<div class="empty"><span class="empty__emoji">🛒</span>Пока пусто.<br>Начните с первой книги — Маруся уже ждёт.</div>
      <a class="btn btn--primary btn--block" href="books.html">Смотреть книги</a>`;
    foot.innerHTML=''; return;
  }
  body.innerHTML = ids.map(id=>{ const p=byId(id); const q=cart[id]; return `
    <div class="line-item">
      <div class="line-item__img"><img src="${p.cover}" alt=""></div>
      <div><h4>${esc(p.title)}</h4>
        <div class="muted" style="font-size:.82rem">${money(p.price)}</div>
        <div class="qty" style="margin-top:.4rem">
          <button data-q="${id}|${q-1}" aria-label="Меньше">−</button><span>${q}</span><button data-q="${id}|${q+1}" aria-label="Больше">+</button>
        </div>
      </div>
      <div style="text-align:right"><div class="price" style="font-size:1.05rem">${money(p.price*q)}</div>
      <button data-q="${id}|0" class="muted" style="font-size:.78rem;text-decoration:underline">удалить</button></div>
    </div>`;}).join('');

  /* cross-sell: мягкий, без агрессии */
  const suggestion = MM.products.find(p=>p.status==='live' && !cart[p.id] && p.price<=17);
  const cross = suggestion ? `
    <div class="cross" style="margin-top:6px">
      <span class="cross__emoji">${suggestion.type==='coloring'?'🎨':'📔'}</span>
      <div><div class="hand">К этому Марусе нравится ещё…</div>
      <p style="font-size:.88rem">${esc(suggestion.title)} · ${money(suggestion.price)}</p></div>
      <button class="btn btn--soft btn--sm" data-add="${suggestion.id}">Добавить</button>
    </div>` : '';
  body.insertAdjacentHTML('beforeend',cross);

  foot.innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:12px">
      <span class="muted">Итого</span><span class="price">${money(cartTotal())}</span>
    </div>
    <a class="btn btn--primary btn--block btn--lg" href="cart.html">Оформить заказ</a>
    <p class="muted" style="font-size:.78rem;text-align:center;margin:.7rem 0 0">Это демо-прототип: оплата не подключена.</p>`;
  bindActions(body); bindActions(foot);
}

function renderFavsDrawer(){
  const body=$('#favs-body'); if(!body) return;
  if(!favs.length){ body.innerHTML=`<div class="empty"><span class="empty__emoji">🤍</span>Здесь будет то, что понравилось.</div>`; return; }
  body.innerHTML = favs.map(id=>{ const p=byId(id); if(!p) return ''; return `
    <div class="line-item">
      <div class="line-item__img"><img src="${p.cover}" alt=""></div>
      <div><h4><a href="product.html?id=${p.id}">${esc(p.title)}</a></h4>
        <div class="muted" style="font-size:.82rem">${p.status==='soon'?'Скоро в продаже':money(p.price)}</div></div>
      <button class="btn btn--soft btn--sm" data-add="${p.id}">${p.status==='soon'?'🔔':'В корзину'}</button>
    </div>`;}).join('');
  bindActions(body);
}

/* делегирование действий */
function bindActions(root=document){
  $$('[data-add]',root).forEach(b=>b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); addToCart(b.dataset.add); });
  $$('[data-fav]',root).forEach(b=>b.onclick=e=>{ e.preventDefault(); e.stopPropagation(); toggleFav(b.dataset.fav); });
  $$('[data-q]',root).forEach(b=>b.onclick=()=>{ const [id,q]=b.dataset.q.split('|'); setQty(id,+q); });
}

/* ============================================================
   PRODUCT CARD
   ============================================================ */
function productCard(p){
  const soon = p.status==='soon';
  return `<article class="card pcard" data-type="${p.type}" data-ages="${p.ages.join(' ')}" data-tags="${p.tags.join(' ')}" data-price="${p.price}">
    <a class="pcard__media" href="product.html?id=${p.id}">
      <img src="${p.cover}" alt="${esc(p.title)}" loading="lazy">
      <span class="pcard__badges">
        ${soon?'<span class="tag tag--sun">Скоро</span>':''}
        ${p.oldPrice?'<span class="tag tag--pink">Набор</span>':''}
      </span>
    </a>
    <button class="fav ${favs.includes(p.id)?'is-on':''}" data-fav="${p.id}" aria-label="В избранное">${ICON.heart}</button>
    <div class="pcard__body">
      <div class="pcard__meta"><span class="tag">${p.age} лет</span>${p.pages?`<span class="tag">${p.pages} стр.</span>`:''}</div>
      <h3 class="pcard__title"><a href="product.html?id=${p.id}">${esc(p.title)}</a></h3>
      <p class="pcard__desc">${esc(p.desc)}</p>
      <div class="pcard__foot">
        <span class="price">${money(p.price)}${p.oldPrice?`<small style="text-decoration:line-through">${money(p.oldPrice)}</small>`:''}</span>
      </div>
      <div class="pcard__btns">
        <a class="btn btn--soft btn--sm" href="product.html?id=${p.id}">Подробнее</a>
        <button class="btn ${soon?'btn--soft':'btn--primary'} btn--sm" data-add="${p.id}">${soon?'Сообщить':'Купить'}</button>
      </div>
    </div>
  </article>`;
}

/* ============================================================
   CATALOG (страницы категорий)
   ============================================================ */
function initCatalog(){
  const grid=$('#catalog'); if(!grid) return;
  const type=grid.dataset.type;             // books | diaries | coloring | games | collection | gifts | all
  let items;
  if(type==='all')            items = MM.products.slice();
  else if(type==='gifts_all') items = MM.products.filter(p=>p.tags.includes('Подарок')||p.type==='gifts');
  else                        items = MM.products.filter(p=>p.type===type);
  let filter = {age:'all',tag:'all',price:'all',type:'all'};

  const render=()=>{
    let list=items.filter(p=>
      (filter.age==='all' || p.ages.includes(filter.age)) &&
      (filter.tag==='all' || p.tags.includes(filter.tag)) &&
      (filter.price==='all' || (p.price!=null && p.price<=+filter.price)) &&
      (filter.type==='all'  || p.type===filter.type)
    );
    list = list.slice().sort((a,b)=>(a.status==='live'?0:1)-(b.status==='live'?0:1));
    grid.innerHTML = list.length ? list.map(productCard).join('')
      : `<div class="empty" style="grid-column:1/-1"><span class="empty__emoji">🔎</span>Под этот фильтр пока ничего нет. Мир Маруси растёт — загляните позже.</div>`;
    bindActions(grid); observeReveal(grid);
    const cnt=$('#catalog-count'); if(cnt) cnt.textContent = list.length + ' ' + plural(list.length,['товар','товара','товаров']);
  };

  $$('[data-filter]').forEach(btn=>{
    btn.onclick=()=>{
      const [k,v]=btn.dataset.filter.split(':');
      filter[k] = (filter[k]===v) ? 'all' : v;
      $$('[data-filter]').forEach(b=>{ const [bk,bv]=b.dataset.filter.split(':'); b.classList.toggle('is-on', filter[bk]===bv); });
      render();
    };
  });
  render();
}
function plural(n,f){ const m=n%100; if(m>=11&&m<=14) return f[2]; const l=n%10; return l===1?f[0]:(l>=2&&l<=4?f[1]:f[2]); }

/* ============================================================
   HERO — «Куда сегодня отправится Маруся?»
   ============================================================ */
function initHero(){
  const stage=$('#hero-stage'); if(!stage) return;
  stage.innerHTML = MM.destinations.map((d,i)=>
    `<div class="hero__scene ${i===0?'is-on':''}" data-scene="${d.id}"><img src="${d.img}" alt="Маруся: ${d.label}" ${i?'loading="lazy"':''}></div>`
  ).join('') + `<div class="hero__stage-cap" id="hero-cap">${MM.destinations[0].caption}</div>`;

  const list=$('#dest-list');
  list.innerHTML = MM.destinations.map((d,i)=>
    `<button class="dest ${i===0?'is-on':''}" data-dest="${d.id}"><span class="e">${d.emoji}</span>${d.label}</button>`
  ).join('');

  let timer;
  const show=id=>{
    $$('.hero__scene',stage).forEach(s=>s.classList.toggle('is-on',s.dataset.scene===id));
    $$('[data-dest]',list).forEach(b=>b.classList.toggle('is-on',b.dataset.dest===id));
    $('#hero-cap').textContent = MM.destinations.find(d=>d.id===id).caption;
  };
  $$('[data-dest]',list).forEach(b=>{
    const go=()=>{ clearInterval(timer); show(b.dataset.dest); };
    b.addEventListener('mouseenter',go); b.addEventListener('click',go); b.addEventListener('focus',go);
  });
  /* мягкая автосмена, пока пользователь не вмешался */
  let i=0; timer=setInterval(()=>{ i=(i+1)%MM.destinations.length; show(MM.destinations[i].id); },5200);
}

/* ============================================================
   ПОСЛАНИЕ ОТ МАРУСИ / ЗАДАНИЕ ДНЯ
   ============================================================ */
function initLetter(){
  const box=$('#letter-text'), btn=$('#letter-btn'); if(!box) return;
  let last=-1;
  const roll=()=>{
    let i; do{ i=Math.floor(Math.random()*MM.letters.length); }while(i===last && MM.letters.length>1);
    last=i; box.classList.add('is-swap');
    setTimeout(()=>{ box.innerHTML=`<span>«${esc(MM.letters[i])}»</span>`; box.classList.remove('is-swap'); },330);
  };
  btn.onclick=()=>{ roll(); btn.textContent='Ещё письмо'; };
}
function initTask(){
  const box=$('#task-text'), btn=$('#task-btn'); if(!box) return;
  /* задание дня стабильно в течение суток */
  const day=Math.floor(Date.now()/864e5);
  box.textContent = MM.tasks[day % MM.tasks.length];
  let cur = day % MM.tasks.length;
  btn.onclick=()=>{
    cur=(cur+1+Math.floor(Math.random()*(MM.tasks.length-1)))%MM.tasks.length;
    box.classList.add('is-swap');
    setTimeout(()=>{ box.textContent=MM.tasks[cur]; box.classList.remove('is-swap'); },330);
  };
}

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
let io;
function observeReveal(root=document){
  if(!('IntersectionObserver' in window)){ $$('.reveal',root).forEach(e=>e.classList.add('is-in')); return; }
  if(!io) io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }}),{rootMargin:'0px 0px -8% 0px'});
  $$('.reveal',root).forEach(e=>io.observe(e));
}

/* ============================================================
   PRODUCT PAGE
   ============================================================ */
function initProduct(){
  const root=$('#pdp'); if(!root) return;
  const id=new URLSearchParams(location.search).get('id');
  const p=byId(id);
  if(!p){
    document.title='Товар не найден | Мир Маруси';
    root.innerHTML=`<div class="empty" style="margin:40px auto">
      <span class="empty__emoji">🔎</span>
      <h1 style="font-size:1.5rem;margin:.2em 0">Такой страницы нет</h1>
      <p>Возможно, товар ещё готовится или ссылка устарела.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:14px">
        <a class="btn btn--primary" href="books.html">Смотреть книги</a>
        <a class="btn btn--ghost" href="index.html">На главную</a>
      </div></div>`;
    return;
  }
  const NOUN={books:'детскую книгу',diaries:'дневник для девочки',coloring:'раскраску',
              games:'workbook с заданиями',collection:'товар из коллекции',gifts:'подарок'};
  document.title = `${p.title} — купить ${NOUN[p.type]||'товар'} для детей 6–9 лет | Мир Маруси`;
  const md=$('meta[name="description"]'); if(md) md.content = `${p.title}. ${p.desc} Возраст ${p.age} лет, ${p.format}. Мир Маруси — книги, дневники, раскраски и игры для детей 6–9 лет.`;
  const ogt=$('meta[property="og:title"]'); if(ogt) ogt.content=document.title;
  const SITE='https://mir-marusi.ai-business-lab.workers.dev';
  let cn=$('link[rel="canonical"]');
  if(!cn){ cn=document.createElement('link'); cn.rel='canonical'; document.head.appendChild(cn); }
  cn.href=`${SITE}/product?id=${encodeURIComponent(p.id)}`;
  let ogu=$('meta[property="og:url"]');
  if(!ogu){ ogu=document.createElement('meta'); ogu.setAttribute('property','og:url'); document.head.appendChild(ogu); }
  ogu.content=cn.href;
  const ogd=$('meta[property="og:description"]'); if(ogd) ogd.content=md?md.content:'';
  const ogi=$('meta[property="og:image"]'); if(ogi) ogi.content=`${SITE}/${p.cover}`;

  const soon = p.status==='soon';
  const gal = p.gallery && p.gallery.length ? p.gallery : [p.cover];
  const similar = MM.products.filter(x=>x.id!==p.id && (x.type===p.type || x.ages.some(a=>p.ages.includes(a)))).slice(0,4);
  const crossTarget = p.cross ? (p.cross.href || (p.cross.to?`product.html?id=${p.cross.to}`:'#')) : null;

  root.innerHTML = `
  <nav class="crumbs"><a href="index.html">Главная</a> › <a href="${catHref(p.type)}">${catName(p.type)}</a> › ${esc(p.title)}</nav>
  <div class="pdp" style="margin-top:18px">
    <div>
      <div class="gallery__main"><img id="gal-main" src="${gal[0]}" alt="${esc(p.title)}"></div>
      ${gal.length>1?`<div class="gallery__thumbs">${gal.map((g,i)=>`<button class="${i?'':'is-on'}" data-gal="${g}"><img src="${g}" alt=""></button>`).join('')}</div>`:''}
    </div>
    <div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <span class="tag tag--pink">${esc(p.subtitle||catName(p.type))}</span>
        <span class="tag">${p.age} лет</span>
        ${soon?'<span class="tag tag--sun">Скоро в продаже</span>':'<span class="tag tag--sage">В наличии</span>'}
      </div>
      <h1 style="margin-bottom:.2em">${esc(p.title)}</h1>
      <p class="lead">${esc(p.desc)}</p>
      <div style="display:flex;align-items:baseline;gap:12px;margin:18px 0 6px">
        ${soon
          ? '<span class="hand" style="font-size:1.15rem;color:var(--brown-soft)">Готовится к выходу — цену объявим позже</span>'
          : `<span class="price" style="font-size:2rem">${money(p.price)}</span>${p.oldPrice?`<span class="muted" style="text-decoration:line-through">${money(p.oldPrice)}</span>`:''}`}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0">
        <button class="btn ${soon?'btn--soft':'btn--primary'} btn--lg" data-add="${p.id}" style="flex:1;min-width:180px">${soon?'Сообщить о выходе':(p.digital?'Купить и скачать':'Купить')}</button>
        <button class="btn btn--ghost btn--lg ${favs.includes(p.id)?'is-on':''}" data-fav="${p.id}">♡ Добавить в желания</button>
      </div>
      ${p.fragment?`<a class="btn btn--soft" href="${p.fragment}" target="_blank" rel="noopener" style="margin:-6px 0 16px">Посмотреть фрагмент — бесплатно, PDF</a>`:''}
      <ul class="specs">
        <li><b>Возраст</b>${p.age} лет</li>
        ${p.pages?`<li><b>Страниц</b>${p.pages}</li>`:''}
        <li><b>Формат</b>${esc(p.format)}</li>
        <li><b>Автор</b>${esc(p.author)}</li>
      </ul>
      ${p.cross?`<a class="cross" href="${crossTarget}">
        <span class="cross__emoji">${p.cross.emoji}</span>
        <div><div class="hand">Маруся подсказывает</div><p>${esc(p.cross.text)}</p></div>
        <span style="margin-left:auto">›</span></a>`:''}
      <div class="strip" style="justify-content:flex-start;margin-top:18px">
        ${p.digital
          ? `<span class="strip__item">⬇️ <b>Скачивание</b> сразу после оплаты</span>
             <span class="strip__item">🖨 <b>Печать</b> без ограничений</span>
             <span class="strip__item">📄 <b>PDF</b>${p.fileSize?' · '+p.fileSize:''}</span>`
          : `<span class="strip__item">🚚 <b>Доставка</b> по России</span>
             <span class="strip__item">↩️ <b>Возврат</b> 14 дней</span>
             <span class="strip__item">🎁 <b>Упаковка</b> в подарок</span>`}
      </div>
    </div>
  </div>

  <div class="tabs" role="tablist">
    <button class="tab is-on" data-tab="about">Описание</button>
    <button class="tab" data-tab="inside">Что внутри</button>
    <button class="tab" data-tab="helps">Чему способствует</button>
    ${p.excerpt?'<button class="tab" data-tab="excerpt">Фрагмент</button>':''}
    <button class="tab" data-tab="reviews">Отзывы</button>
  </div>
  <div class="tabpanel is-on" data-panel="about">
    <div class="paper" style="max-width:78ch">
      <p>${esc(p.desc)}</p>
      <p class="muted">Издание относится к линейке «${catName(p.type)}» бренда «Мир Маруси». Все книги, дневники и рабочие тетради связаны между собой: герои переходят из истории в историю, а задания продолжают сюжет.</p>
    </div>
  </div>
  <div class="tabpanel" data-panel="inside">
    <div class="paper"><ul style="margin:0;padding-left:1.1rem;line-height:2">${p.inside.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>
  </div>
  <div class="tabpanel" data-panel="helps">
    <div class="grid grid--3">${p.helps.map(h=>`<div class="paper"><div class="hand" style="font-size:1.15rem;color:var(--brown)">Развивает</div><p style="margin:0">${esc(h)}</p></div>`).join('')}</div>
  </div>
  ${p.excerpt?`<div class="tabpanel" data-panel="excerpt"><div class="excerpt">${esc(p.excerpt).replace(/\n/g,'<br><br>')}</div></div>`:''}
  <div class="tabpanel" data-panel="reviews">${reviewsPlaceholder()}</div>

  <section class="section section--tight">
    <div class="section-head"><h2>Похожие товары</h2></div>
    <div class="grid grid--4">${similar.map(productCard).join('')}</div>
  </section>`;

  $$('[data-gal]',root).forEach(b=>b.onclick=()=>{
    $('#gal-main').src=b.dataset.gal;
    $$('[data-gal]',root).forEach(x=>x.classList.remove('is-on')); b.classList.add('is-on');
  });
  $$('.tab',root).forEach(t=>t.onclick=()=>{
    $$('.tab',root).forEach(x=>x.classList.remove('is-on')); t.classList.add('is-on');
    $$('.tabpanel',root).forEach(x=>x.classList.toggle('is-on',x.dataset.panel===t.dataset.tab));
  });
  bindActions(root); observeReveal(root);

  /* JSON-LD */
  const ld={"@context":"https://schema.org","@type":p.type==='books'?"Book":"Product","name":p.title,"description":p.desc,
    "image":new URL(p.cover,location.href).href,
    "brand":{"@type":"Brand","name":"Мир Маруси"},"audience":{"@type":"PeopleAudience","suggestedMinAge":6,"suggestedMaxAge":9}};
  if(p.type==='books'){ ld.author={"@type":"Person","name":p.author}; ld.inLanguage='ru'; if(p.pages) ld.numberOfPages=p.pages; }
  ld.offers={"@type":"Offer","priceCurrency":"RUB",
    "availability":soon?"https://schema.org/PreOrder":"https://schema.org/InStock"};
  if(p.price!=null) ld.offers.price=p.price.toFixed(2);
  const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(ld); document.head.appendChild(s);
}
function catName(t){ return {books:'Книги',diaries:'Дневники',coloring:'Раскраски',games:'Игры и workbook',collection:'Коллекция',gifts:'Подарки'}[t]||'Каталог'; }
function catHref(t){ return {books:'books.html',diaries:'diaries.html',coloring:'coloring.html',games:'games.html',collection:'collection.html',gifts:'gifts.html'}[t]||'books.html'; }

function reviewsPlaceholder(){
  return `<div class="grid grid--2">
    <div>
      <h3 style="font-size:1.15rem">Отзывы родителей</h3>
      ${[0,1].map(()=>`<div class="review review--empty" style="margin-bottom:12px">
        <span class="tag">Ожидаем первые отзывы</span>
        <div class="review__ph"></div><div class="review__ph"></div><div class="review__ph s"></div></div>`).join('')}
    </div>
    <div>
      <h3 style="font-size:1.15rem">Отзывы детей</h3>
      ${[0,1].map(()=>`<div class="review review--empty" style="margin-bottom:12px">
        <span class="tag tag--pink">Ожидаем первые отзывы</span>
        <div class="review__ph"></div><div class="review__ph s"></div></div>`).join('')}
    </div>
    <p class="muted" style="grid-column:1/-1;font-size:.86rem">Мы публикуем только настоящие отзывы покупателей. Пока их нет — здесь честно пусто. Купили книгу? Напишите нам, и ваш отзыв появится здесь первым.</p>
  </div>`;
}

/* ============================================================
   CART PAGE
   ============================================================ */
/* «Собери подарок»: книга + дневник + наклейки */
const GIFT_SLOTS = [
  { key:'books',   label:'Книга',    emoji:'📖', hint:'история, с которой всё начинается' },
  { key:'diaries', label:'Дневник',  emoji:'📔', hint:'чтобы придумать свою' },
  { key:'sticker', label:'Наклейки', emoji:'✨', hint:'маленькая радость сверху' }
];
function giftPick(slot){
  const live = MM.products.filter(p=>p.status==='live');
  if(slot==='sticker') return live.filter(p=>p.sub==='stickers'||/наклеек|наклейк/i.test(p.title));
  return live.filter(p=>p.type===slot);
}
function giftBuilderHTML(){
  const rows = GIFT_SLOTS.map(s=>{
    const opts = giftPick(s.key);
    const chosen = opts.find(p=>cart[p.id]);
    const done = !!chosen;
    return `<div class="giftslot ${done?'is-done':''}">
      <span class="giftslot__e">${done?'✓':s.emoji}</span>
      <div class="giftslot__body">
        <b>${s.label}</b>
        <span class="muted">${done?esc(chosen.title):s.hint}</span>
      </div>
      ${done
        ? `<span class="tag tag--sage">в наборе</span>`
        : (opts.length
            ? `<select class="giftslot__sel" data-giftslot="${s.key}">
                 <option value="">выбрать…</option>
                 ${opts.map(p=>`<option value="${p.id}">${esc(p.title)} · ${money(p.price)}</option>`).join('')}
               </select>`
            : `<span class="muted" style="font-size:.82rem">скоро</span>`)}
    </div>`;
  }).join('');
  const ready = GIFT_SLOTS.every(s=>giftPick(s.key).some(p=>cart[p.id]));
  const pending = GIFT_SLOTS.filter(s=>!giftPick(s.key).length);
  const note = pending.length
    ? `<p class="muted" style="font-size:.84rem;margin:12px 0 0">
         ${pending.map(s=>s.label.toLowerCase()).join(' и ')} ещё в работе — набор можно будет собрать целиком после их выхода.
         <a href="account.html">Оставьте почту</a>, и мы напишем.
       </p>`
    : '';
  return `<section class="paper giftbox">
    <span class="eyebrow">Собери подарок</span>
    <h3 style="margin:.2rem 0 .1rem">Книга + дневник + наклейки</h3>
    <p class="muted" style="font-size:.9rem;margin:0 0 14px">Маруся считает, что подарок должен продолжаться после того, как его открыли.</p>
    ${rows}
    ${ready?`<p class="hand" style="margin:12px 0 0;color:var(--sage-deep)">Набор собран. Получилось целое приключение 🎁</p>`:note}
  </section>`;
}
function bindGiftBuilder(root){
  $$('[data-giftslot]',root).forEach(sel=>sel.onchange=()=>{ if(sel.value) addToCart(sel.value); });
}

function renderCartPage(){
  const root=$('#cart-page'); if(!root) return;
  const ids=Object.keys(cart);
  if(!ids.length){
    root.innerHTML=`<div class="empty"><span class="empty__emoji">🛒</span><h3>В корзине пока пусто</h3>
      <p>Соберите свой первый набор: книга + дневник + наклейки.</p>
      <a class="btn btn--primary" href="books.html">Начать с книги</a></div>
      <div style="max-width:620px;margin:26px auto 0">${giftBuilderHTML()}</div>`;
    bindGiftBuilder(root); return;
  }
  const total=cartTotal();
  const physTotal=Object.keys(cart).reduce((s,id)=>{const p=byId(id);return p&&!p.digital?s+(p.price||0)*cart[id]:s;},0);
  const needShip=physTotal>0;
  const ship=(!needShip||total>=FREE_SHIP)?0:SHIP_COST;
  const extras = MM.products.filter(p=>p.status==='live' && !cart[p.id]).slice(0,3);
  root.innerHTML=`
  <div class="cart-layout">
    <div>
      <div class="paper">
        ${ids.map(id=>{const p=byId(id),q=cart[id];return`
        <div class="line-item" style="margin-bottom:14px">
          <div class="line-item__img"><img src="${p.cover}" alt=""></div>
          <div><h4><a href="product.html?id=${p.id}">${esc(p.title)}</a></h4>
            <div class="muted" style="font-size:.84rem">${p.age} лет · ${money(p.price)}</div>
            <div class="qty" style="margin-top:.45rem"><button data-q="${id}|${q-1}">−</button><span>${q}</span><button data-q="${id}|${q+1}">+</button></div></div>
          <div style="text-align:right"><div class="price" style="font-size:1.1rem">${money(p.price*q)}</div>
          <button data-q="${id}|0" class="muted" style="font-size:.78rem;text-decoration:underline">удалить</button></div>
        </div>`;}).join('')}
      </div>
      <div style="margin-top:18px">${giftBuilderHTML()}</div>
      <section class="section section--tight">
        <div class="eyebrow">К этому товару Марусе нравится ещё…</div>
        <div class="grid grid--3">${extras.map(p=>`
          <div class="card" style="padding:16px;display:flex;gap:12px;align-items:center">
            <div class="line-item__img"><img src="${p.cover}" alt=""></div>
            <div style="flex:1"><div style="font-family:var(--serif);font-size:.95rem">${esc(p.title)}</div>
            <div class="muted" style="font-size:.82rem;margin-bottom:.4rem">${money(p.price)}</div>
            <button class="btn btn--soft btn--sm" data-add="${p.id}">Добавить</button></div>
          </div>`).join('')}</div>
      </section>
    </div>
    <aside class="paper" style="position:sticky;top:100px">
      <h3>Ваш заказ</h3>
      <div style="display:flex;justify-content:space-between;margin:.4rem 0"><span class="muted">Товары</span><span style="font-family:var(--num)">${money(total)}</span></div>
      <div style="display:flex;justify-content:space-between;margin:.4rem 0"><span class="muted">${needShip?'Доставка':'Получение'}</span><span style="font-family:var(--num)">${!needShip?'ссылка на скачивание':(total>=FREE_SHIP?'бесплатно':money(SHIP_COST))}</span></div>
      <hr style="border:none;border-top:1px dashed var(--line);margin:14px 0">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><b>Итого</b><span class="price" style="font-size:1.5rem">${money(total+ship)}</span></div>
      ${needShip&&total<FREE_SHIP?`<p class="muted" style="font-size:.82rem;margin-top:.6rem">До бесплатной доставки — ${money(FREE_SHIP-total)}</p>`:''}
      ${!needShip?`<p class="muted" style="font-size:.82rem;margin-top:.6rem">В заказе только цифровые товары — файлы появятся в личном кабинете сразу после оплаты.</p>`:''}
      ${needShip?`<label style="display:flex;gap:.6rem;align-items:flex-start;margin:16px 0;font-size:.88rem">
        <input type="checkbox" style="margin-top:.25rem"> Упаковать как подарок и вложить открытку от Маруси
      </label>`:'<div style="height:16px"></div>'}
      <button class="btn btn--primary btn--block btn--lg" id="checkout">Перейти к оплате</button>
      <p class="muted" style="font-size:.78rem;text-align:center;margin:.8rem 0 0">Демо-прототип: платёжный шлюз не подключён.</p>
    </aside>
  </div>`;
  bindActions(root); bindGiftBuilder(root);
  $('#checkout').onclick=()=>openModal(`<div style="padding:38px;text-align:center">
    <div style="font-size:2.6rem">🎁</div><h2>Почти готово!</h2>
    <p class="lead" style="margin:0 auto">Это демонстрационный прототип «Мира Маруси». Здесь будет подключён платёжный провайдер и расчёт доставки.</p>
    <button class="btn btn--primary" data-close-modal2 style="margin-top:14px">Хорошо</button></div>`);
  setTimeout(()=>{ const b=$('[data-close-modal2]'); if(b) b.onclick=closeAll; },50);
}

/* ============================================================
   ACCOUNT
   ============================================================ */
function initAccount(){
  const root=$('#account'); if(!root) return;
  const panels={
    orders:`<h3>Мои заказы</h3><div class="empty"><span class="empty__emoji">📦</span>Заказов пока нет. После первой покупки они появятся здесь — с трек-номером и статусом.</div>`,
    favs:`<h3>Избранное</h3><div class="grid grid--3" id="acc-favs"></div>`,
    books:`<h3>Мои книги</h3><div class="empty"><span class="empty__emoji">📚</span>Здесь будут все купленные книги — с закладкой на главе, где вы остановились.</div>`,
    digital:(()=>{
      const dig=MM.products.filter(p=>p.digital && p.status==='live');
      const free=dig.filter(p=>p.fragment).map(p=>`
        <div class="paper"><span class="tag tag--sage">PDF · бесплатно</span>
        <h4 style="margin:.5rem 0 .2rem">«${p.title}»: фрагмент</h4>
        <p class="muted" style="font-size:.88rem">${p.fragmentNote||'Несколько страниц'} — доступно всем, без покупки.</p>
        <a class="btn btn--soft btn--sm" href="${p.fragment}" target="_blank" rel="noopener">Скачать фрагмент</a></div>`).join('');
      const locked=dig.map(p=>`
        <div class="paper" style="opacity:.6"><span class="tag">После покупки</span>
        <h4 style="margin:.5rem 0 .2rem">«${p.title}»: все ${p.pages} страниц</h4>
        <p class="muted" style="font-size:.88rem">Полный файл откроется здесь после оплаты.</p>
        <a class="btn btn--ghost btn--sm" href="product.html?id=${p.id}">Посмотреть</a></div>`).join('');
      return `<h3>Мои цифровые материалы</h3>
      <p class="muted">PDF-файлы становятся доступны сразу после оплаты — скачивать можно сколько угодно раз.</p>
      <div class="grid grid--2">${free}${locked}</div>`;
    })(),
    gifts:`<h3>Подарки</h3><div class="empty"><span class="empty__emoji">🎁</span>Здесь появятся подарочные сертификаты и наборы, которые вы отправили.</div>`,
    settings:`<h3>Настройки</h3>
      <div class="paper" style="max-width:520px">
        <div class="field"><label>Имя родителя</label><input placeholder="Как к вам обращаться"></div>
        <div class="field"><label>E-mail</label><input type="email" placeholder="mail@example.com"></div>
        <div class="field"><label>Имя ребёнка и возраст</label><input placeholder="Например: Аня, 7 лет"></div>
        <p class="muted" style="font-size:.82rem">Нужно только чтобы советовать книги по возрасту. Мы не показываем детям рекламу и не собираем лишних данных.</p>
        <button class="btn btn--primary">Сохранить</button>
      </div>`
  };
  const nav=$('#acc-nav'), body=$('#acc-body');
  const show=k=>{
    body.innerHTML=panels[k];
    $$('button',nav).forEach(b=>b.classList.toggle('is-on',b.dataset.acc===k));
    if(k==='favs'){
      const g=$('#acc-favs');
      g.innerHTML = favs.length ? favs.map(id=>productCard(byId(id))).filter(Boolean).join('')
        : `<div class="empty" style="grid-column:1/-1"><span class="empty__emoji">🤍</span>Пока пусто.</div>`;
      bindActions(g);
    }
  };
  $$('button',nav).forEach(b=>b.onclick=()=>show(b.dataset.acc));
  show('orders');
}

/* ============================================================
   HOME rendering
   ============================================================ */
function initHome(){
  const locGrid=$('#map-grid');
  if(locGrid){
    locGrid.innerHTML = MM.locations.map(l=>`
      <a class="loc reveal" href="world.html#${l.id}">
        <span class="loc__emoji">${l.emoji}</span>
        <h3>${l.title}</h3><p>${esc(l.desc)}</p>
        <div class="loc__go">Заглянуть ${ICON.arrow.replace('<svg','<svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;display:inline;vertical-align:-2px"')}</div>
      </a>`).join('');
  }
  const bookGrid=$('#home-books');
  if(bookGrid){
    bookGrid.innerHTML = MM.products.filter(p=>p.type==='books').slice(0,4).map(productCard).join('');
  }
  const giftGrid=$('#home-gifts');
  if(giftGrid){
    giftGrid.innerHTML = MM.products.filter(p=>p.tags.includes('Подарок')).slice(0,4).map(productCard).join('');
  }
  const postGrid=$('#home-posts');
  if(postGrid){
    postGrid.innerHTML = MM.posts.slice(0,3).map(postCard).join('');
  }
  const rev=$('#home-reviews'); if(rev) rev.innerHTML=reviewsPlaceholder();
}

function postCard(b){
  return `<article class="card post reveal">
    <a class="post__media" href="blog.html#${b.id}"><img src="${b.img}" alt="" loading="lazy"></a>
    <div class="post__body">
      <span class="tag">${b.emoji} ${b.cat}</span>
      <h3 style="font-size:1.12rem;margin:.2rem 0"><a href="blog.html#${b.id}">${esc(b.title)}</a></h3>
      <p class="muted" style="font-size:.88rem;flex:1">${esc(b.lead)}</p>
      <div class="muted" style="font-size:.78rem">${b.date} · ${b.read}</div>
    </div></article>`;
}

/* ============================================================
   CHARACTERS / BLOG / WORLD pages
   ============================================================ */
function initCharacters(){
  const g=$('#chars'); if(!g) return;
  g.innerHTML = MM.characters.map(c=>{
    if(!c.revealed) return `<article class="card reveal" style="padding:26px;text-align:center;border-style:dashed">
      <div style="font-size:2.6rem;filter:grayscale(1);opacity:.5">🫥</div>
      <h3 style="margin:.4rem 0 .2rem">Скоро</h3>
      <p class="muted" style="font-size:.9rem">${esc(c.role)}. ${esc(c.revealNote||'')}</p>
      <span class="tag">Вселенная раскрывается постепенно</span></article>`;
    return `<article class="card reveal" style="overflow:hidden">
      <div style="aspect-ratio:1;overflow:hidden;background:var(--paper)"><img src="${c.img}" alt="${esc(c.name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>
      <div style="padding:22px">
        <span class="tag tag--${c.accent}">${esc(c.role)}</span>
        <h3 style="margin:.5rem 0 .3rem">${esc(c.name)}</h3>
        <p class="muted" style="font-size:.92rem">${esc(c.character)}</p>
        <dl style="margin:0;font-size:.9rem;display:grid;gap:.5rem">
          <div><span class="hand" style="color:var(--brown)">Любит: </span>${esc(c.likes)}</div>
          <div><span class="hand" style="color:var(--brown)">Секрет: </span>${esc(c.secret)}</div>
          <div><span class="hand" style="color:var(--brown)">С Марусей: </span>${esc(c.rel)}</div>
        </dl>
      </div></article>`;
  }).join('');
  observeReveal(g);
}

function initBlog(){
  const g=$('#posts'); if(!g) return;
  const cats=['Все',...new Set(MM.posts.map(p=>p.cat))];
  const f=$('#post-filters');
  if(f){
    f.innerHTML=cats.map((c,i)=>`<button class="chip ${i?'':'is-on'}" data-cat="${c}">${c}</button>`).join('');
    $$('button',f).forEach(b=>b.onclick=()=>{
      $$('button',f).forEach(x=>x.classList.remove('is-on')); b.classList.add('is-on');
      draw(b.dataset.cat);
    });
  }
  const draw=cat=>{
    const list = cat==='Все'||!cat ? MM.posts : MM.posts.filter(p=>p.cat===cat);
    g.innerHTML = list.map(b=>{
      const prod = byId(b.link);
      return `<article class="card post reveal">
        <div class="post__media"><img src="${b.img}" alt="" loading="lazy"></div>
        <div class="post__body">
          <span class="tag">${b.emoji} ${b.cat}</span>
          <h3 style="font-size:1.15rem;margin:.2rem 0">${esc(b.title)}</h3>
          <p class="muted" style="font-size:.9rem;flex:1">${esc(b.lead)}</p>
          <div class="muted" style="font-size:.78rem">${b.date} · ${b.read}</div>
          ${prod?`<a class="cross" style="margin-top:10px;padding:12px" href="product.html?id=${prod.id}">
            <span class="cross__emoji" style="font-size:1.4rem">📔</span>
            <div><div class="hand" style="font-size:.95rem">Попробуйте</div><p style="font-size:.85rem">${esc(prod.title)}</p></div></a>`:''}
        </div></article>`;
    }).join('');
    observeReveal(g);
  };
  draw('Все');
}

function initWorld(){
  const g=$('#world-locs'); if(!g) return;
  g.innerHTML = MM.locations.map(l=>`
    <article class="card reveal" id="${l.id}" style="overflow:hidden">
      <div style="aspect-ratio:16/10;overflow:hidden;background:var(--paper)"><img src="${l.img}" alt="${l.title}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>
      <div style="padding:24px">
        <span class="loc__emoji" style="font-size:1.7rem">${l.emoji}</span>
        <h3 style="margin:.2rem 0 .3rem">${l.title}</h3>
        <p class="muted" style="font-size:.94rem">${esc(l.desc)}</p>
        <a class="btn btn--soft btn--sm" href="books.html">Истории из этой локации</a>
      </div></article>`).join('');
  observeReveal(g);
}

function initFaq(){
  const g=$('#faq'); if(!g) return;
  g.innerHTML = MM.faq.map(([q,a])=>`
    <details class="paper" style="margin-bottom:10px">
      <summary style="cursor:pointer;font-family:var(--serif);font-size:1.08rem">${esc(q)}</summary>
      <p class="muted" style="margin:.7rem 0 0">${esc(a)}</p></details>`).join('');
}

/* ============================================================
   FOOTER
   ============================================================ */
function buildFooter(){
  const el=$('#footer-slot'); if(!el) return;
  el.outerHTML=`
  <footer class="footer">
    <div class="wrap footer__top">
      <div>
        <a class="logo" href="index.html">${logoSVG(40)}<span class="logo__text"><span class="logo__main">Мир Маруси</span><span class="logo__sub">книги · дневники · игры</span></span></a>
        <p style="margin-top:14px;font-size:.92rem;color:#B7AC9C;max-width:34ch">Это не просто книги. Это мир, в который можно войти. Книги, дневники, раскраски и игры для детей 6–9 лет.</p>
        <div class="socials">
          <a href="#" rel="nofollow">Telegram</a><a href="#" rel="nofollow">VK</a><a href="#" rel="nofollow">Pinterest</a><a href="#" rel="nofollow">YouTube</a>
        </div>
      </div>
      <div><h4>Каталог</h4><ul>
        <li><a href="books.html">Книги</a></li><li><a href="diaries.html">Дневники</a></li>
        <li><a href="coloring.html">Раскраски</a></li><li><a href="games.html">Игры и workbook</a></li>
        <li><a href="collection.html">Коллекция</a></li><li><a href="gifts.html">Подарки</a></li></ul></div>
      <div><h4>Мир</h4><ul>
        <li><a href="world.html">Мир Маруси</a></li><li><a href="characters.html">Персонажи</a></li>
        <li><a href="about.html">О Марусе</a></li><li><a href="blog.html">Марусин журнал</a></li>
        <li><a href="contacts.html">Контакты</a></li></ul></div>
      <div><h4>Родителям</h4><ul>
        <li><a href="contacts.html#delivery">Доставка</a></li><li><a href="contacts.html#payment">Оплата</a></li>
        <li><a href="contacts.html#returns">Возврат</a></li><li><a href="contacts.html#faq">FAQ</a></li>
        <li><a href="contacts.html#privacy">Политика конфиденциальности</a></li>
        <li><a href="account.html">Личный кабинет</a></li></ul></div>
    </div>
    <div class="wrap footer__bottom">
      <span>© ${new Date().getFullYear()} Мир Маруси. Демонстрационный прототип бренда.</span>
      <span>Сделано с карандашом и бумагой</span>
    </div>
  </footer>`;
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded',()=>{
  buildHeader(document.body.dataset.page||'');
  buildFooter();
  syncBadges(); renderCartDrawer(); renderFavsDrawer();
  initHero(); initHome(); initCatalog(); initProduct(); initLetter(); initTask();
  initCharacters(); initBlog(); initWorld(); initFaq(); initAccount(); renderCartPage();
  bindActions(document); observeReveal(document);
});

/* экспорт для инлайн-вызовов */
window.MMapp={addToCart,toggleFav,openModal,productCard,toast};
})();
