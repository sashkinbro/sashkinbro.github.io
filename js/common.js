// js/common.js
'use strict';

const DataCache = new Map();

async function loadJSON(path){
  if(DataCache.has(path)) return DataCache.get(path);
  const p = fetch(path, { cache: 'no-store' }).then(async (r)=>{
    if(!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    return r.json();
  });
  DataCache.set(path, p);
  return p;
}

function svgFallback(txt){
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
        <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop stop-color='#e9ecff'/><stop offset='1' stop-color='#cfd9ff'/>
        </linearGradient></defs>
        <rect width='100%' height='100%' rx='24' fill='url(#g)'/>
        <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle'
              font-size='44' fill='#1b4bff' font-family='Inter,Arial,system-ui'>${txt}</text>
      </svg>`
    )
  );
}

function applyTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
}

function initTheme(){
  const stored = localStorage.getItem('theme');
  if(stored){
    applyTheme(stored);
    return;
  }
  applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function bindThemeToggle(buttonId='themeToggle'){
  const btn = document.getElementById(buttonId);
  if(!btn) return;
  btn.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  };
}

function applyTranslations(i18n, lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el)=>{
    const key = el.getAttribute('data-i18n');
    const value = i18n?.[lang]?.[key];
    if(typeof value === 'string') el.textContent = value;
  });
}

function bindLangSwitcher(i18n, onChange){
  const btnUk = document.getElementById('btn-uk');
  const btnRu = document.getElementById('btn-ru');
  const btnEn = document.getElementById('btn-en');
  const btns = [btnUk, btnRu, btnEn].filter(Boolean);

  function setLang(lang){
    btns.forEach((b)=>{
      const active = b.dataset.lang === lang;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', String(active));
    });
    localStorage.setItem('lang', lang);
    applyTranslations(i18n, lang);
    if(typeof onChange === 'function') onChange(lang);
  }

  const stored = localStorage.getItem('lang') || 'uk';
  setLang(stored);

  btns.forEach((b)=>{
    b.onclick = () => setLang(b.dataset.lang);
  });

  return { setLang, getLang: ()=>localStorage.getItem('lang') || 'uk' };
}

function createLightboxController(){
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  if(!lightbox || !img) return null;

  let state = { list: [], index: 0 };

  function open(list, index){
    if(!Array.isArray(list) || !list.length) return;
    state.list = list;
    state.index = index ?? 0;
    if(state.index < 0) state.index = state.list.length - 1;
    if(state.index >= state.list.length) state.index = 0;
    img.src = state.list[state.index];
    lightbox.hidden = false;
  }

  function close(){
    lightbox.hidden = true;
    state.list = [];
  }

  function step(delta){
    if(!state.list.length) return;
    open(state.list, state.index + delta);
  }

  lightbox.addEventListener('click', (e)=>{
    if(e.target.hasAttribute('data-lightbox-close')) close();
    else if(e.target.hasAttribute('data-lightbox-prev')) step(-1);
    else if(e.target.hasAttribute('data-lightbox-next')) step(1);
  });

  document.addEventListener('keydown', (e)=>{
    if(lightbox.hidden) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') step(-1);
    if(e.key === 'ArrowRight') step(1);
  });

  return { open, close, step };
}

function initInteractiveFeedback(){
  const selector = [
    'button',
    'a.btn',
    '.chip button',
    '.tbtn',
    '.tab-btn',
    '.shot-thumb',
    'summary'
  ].join(',');

  document.querySelectorAll(selector).forEach((el)=>{
    if(el.dataset.pressBound === '1') return;
    el.dataset.pressBound = '1';
    el.classList.add('interactive-press');

    const down = ()=>el.classList.add('is-pressed');
    const up = ()=>el.classList.remove('is-pressed');

    el.addEventListener('pointerdown', down, { passive: true });
    el.addEventListener('pointerup', up, { passive: true });
    el.addEventListener('pointercancel', up, { passive: true });
    el.addEventListener('pointerleave', up, { passive: true });
    el.addEventListener('blur', up, { passive: true });
  });
}

function initScrollReveal(){
  const items = document.querySelectorAll('.reveal:not(.reveal-ready)');
  if(!items.length) return;

  items.forEach((el)=>el.classList.add('is-visible'));
}
