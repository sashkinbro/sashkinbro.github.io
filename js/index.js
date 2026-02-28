// js/index.js
'use strict';

document.addEventListener('DOMContentLoaded', async ()=>{
  initTheme();
  bindThemeToggle('themeToggle');

  const [i18n, appsData, screenshots] = await Promise.all([
    loadJSON('./data/i18n.json'),
    loadJSON('./data/apps.json'),
    loadJSON('./data/screenshots.json')
  ]);

  const grid = document.getElementById('apps');
  const lightbox = createLightboxController();

  function render(lang){
    if(!grid) return;
    grid.innerHTML = '';

    const order = appsData.order || [];
    order.forEach((id)=>{
      const app = appsData.byId?.[id];
      if(!app) return;

      const shots = screenshots?.[app.id]?.[lang] || [];
      const card = document.createElement('article');
      card.className = 'card';

      const title = app.title?.[lang] || app.title?.uk || 'App';
      const category = app.category?.[lang] || '';
      const desc = app.desc?.[lang] || '';

      card.innerHTML = `
        <div class="app-head">
          <img class="icon" width="72" height="72" alt="${title}" src="${app.icon}" loading="lazy" decoding="async">
          <div class="app-meta">
            <h3 class="title">
              <a class="title-link" href="app.html?id=${encodeURIComponent(app.id)}">${title}</a>
            </h3>
            <div class="meta-row">
              <span class="badge">Android</span>
            </div>
            <div class="category">${category}</div>
          </div>
        </div>
        <p class="desc">${desc}</p>
        ${shots.length ? `
          <div class="shots-strip" aria-label="Screenshots">
            ${shots.map((src,idx)=>`
              <button class="shot-thumb" type="button" data-app="${app.id}" data-idx="${idx}" aria-label="Open screenshot ${idx+1}">
                <img src="${src}" loading="eager" decoding="async" fetchpriority="low" width="220" height="464" alt="">
              </button>
            `).join('')}
          </div>
        ` : ''}
        <div class="actions">
          <a class="btn" href="${app.link}" target="_blank" rel="noopener">
            <span class="btn-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 2.5c0-1 1.1-1.6 2-1.1l15 8.5c.9.5.9 1.8 0 2.3l-15 8.5c-.9.5-2-.1-2-1.1V2.5Z"/>
              </svg>
            </span>
            <span>${i18n?.[lang]?.gp || 'Open in Google Play'}</span>
          </a>
          <a class="btn btn-ghost" href="app.html?id=${encodeURIComponent(app.id)}">
            ${i18n?.[lang]?.details || 'View details'}
          </a>
        </div>
      `;

      const metaRow = card.querySelector('.meta-row');
      if(app.isTop && metaRow){
        const top = document.createElement('span');
        top.className = 'pill pill-top';
        top.textContent = i18n?.[lang]?.pillTop || 'Top';
        metaRow.appendChild(top);
      }
      if(app.isNew && metaRow){
        const pill = document.createElement('span');
        pill.className = 'pill pill-new';
        pill.textContent = i18n?.[lang]?.pillNew || 'New';
        metaRow.appendChild(pill);
      }
      if(metaRow && app.metrics){
        if(app.metrics.rating){
          const rating = document.createElement('span');
          rating.className = 'badge badge-metric';
          rating.textContent = `★ ${app.metrics.rating}`;
          metaRow.appendChild(rating);
        }
        if(app.metrics.installs){
          const installs = document.createElement('span');
          installs.className = 'badge badge-metric';
          installs.textContent = app.metrics.installs;
          metaRow.appendChild(installs);
        }
      }

      const img = card.querySelector('img.icon');
      if(img){
        img.addEventListener('error', ()=>{ img.src = svgFallback(app.fallback || 'APP'); }, { once:true });
      }

      card.querySelectorAll('.shot-thumb').forEach((btn)=>{
        btn.addEventListener('click', ()=>{
          const appId = btn.dataset.app;
          const idx = Number(btn.dataset.idx) || 0;
          const list = screenshots?.[appId]?.[lang] || [];
          if(lightbox) lightbox.open(list, idx);
        });
      });

      grid.appendChild(card);
    });

    initInteractiveFeedback();
  }

  document.getElementById('y').textContent = new Date().getFullYear();
  bindLangSwitcher(i18n, render);
});
