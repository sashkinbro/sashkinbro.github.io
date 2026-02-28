// js/app.js
'use strict';

document.addEventListener('DOMContentLoaded', async ()=>{
  initTheme();
  bindThemeToggle('themeToggle');

  const [i18n, appsData, screenshots] = await Promise.all([
    loadJSON('./data/i18n.json'),
    loadJSON('./data/apps.json'),
    loadJSON('./data/screenshots.json')
  ]);

  const hero = document.getElementById('app-hero');
  const featuresList = document.getElementById('app-features');
  const longText = document.getElementById('app-long');
  const infoGrid = document.getElementById('app-info');
  const gallery = document.getElementById('app-gallery');
  const ctaSecondary = document.getElementById('app-cta-secondary');

  const lightbox = createLightboxController();
  const BASE_URL = 'https://sashkinbro.github.io';

  function setupTabs(){
    const tabButtons = document.querySelectorAll('.tab-btn');
    const panels = {
      overview: document.getElementById('tab-overview'),
      features: document.getElementById('tab-features'),
      info: document.getElementById('tab-info')
    };
    tabButtons.forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const tab = btn.dataset.tab;
        tabButtons.forEach((b)=>{
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        Object.entries(panels).forEach(([name,panel])=>{
          if(panel) panel.hidden = name !== tab;
        });
      });
    });
  }

  function renderGallery(appId, lang){
    const list = screenshots?.[appId]?.[lang] || [];
    if(!gallery) return;
    gallery.innerHTML = '';
    list.forEach((src, idx)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shot-thumb app-shot';
      btn.setAttribute('aria-label', 'Open screenshot ' + (idx+1));
      btn.innerHTML = `<img src="${src}" loading="eager" decoding="async" fetchpriority="low" width="220" height="464" alt="">`;
      btn.addEventListener('click', ()=>{ if(lightbox) lightbox.open(list, idx); });
      gallery.appendChild(btn);
    });
  }

  function renderApp(lang){
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const app = appsData.byId?.[id];

    if(!app){
      if(hero) hero.innerHTML = `<p>App not found. <a href="index.html">Back to main page</a></p>`;
      const tabs = document.querySelector('.app-tabs');
      const gal = document.querySelector('.app-gallery-panel');
      if(tabs) tabs.style.display = 'none';
      if(gal) gal.style.display = 'none';
      return;
    }

    const title = app.title?.[lang] || app.title?.uk || 'App';
    const pageTitle = `${title} — Sashkin Apps`;
    document.title = pageTitle;

    if(hero){
      hero.innerHTML = `
        <div class="app-hero-head">
          <img class="icon icon-large" src="${app.icon}" alt="${title}" width="96" height="96" loading="lazy" decoding="async">
          <div class="app-hero-meta">
            <h1 class="app-hero-title">${title}</h1>
            <div class="meta-row">
              <span class="badge">Android</span>
              ${app.isTop ? `<span class="pill pill-top">${i18n?.[lang]?.pillTop || 'Top'}</span>` : ''}
              ${app.isNew ? `<span class="pill pill-new">${i18n?.[lang]?.pillNew || 'New'}</span>` : ''}
            </div>
            <div class="category">${app.category?.[lang] || ''}</div>
          </div>
        </div>
        <p class="app-hero-short">${app.short?.[lang] || ''}</p>
        <div class="actions app-hero-actions">
          <a class="btn" href="${app.link}" target="_blank" rel="noopener">
            <span class="btn-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 2.5c0-1 1.1-1.6 2-1.1l15 8.5c.9.5.9 1.8 0 2.3l-15 8.5c-.9.5-2-.1-2-1.1V2.5Z"/>
              </svg>
            </span>
            <span>${i18n?.[lang]?.gp || 'Open in Google Play'}</span>
          </a>
        </div>
      `;

      const img = hero.querySelector('img.icon');
      if(img){
        img.addEventListener('error', ()=>{ img.src = svgFallback(app.fallback || 'APP'); }, { once:true });
      }
    }

    if(longText) longText.textContent = app.long?.[lang] || '';

    if(featuresList){
      featuresList.innerHTML = '';
      (app.features?.[lang] || []).forEach((f)=>{
        const li = document.createElement('li');
        li.textContent = f;
        featuresList.appendChild(li);
      });
    }

    if(infoGrid){
      infoGrid.innerHTML = '';
      const info = app.info || {};
      const rows = [
        [i18n?.[lang]?.infoCategory || 'Category', app.category?.[lang] || ''],
        [i18n?.[lang]?.infoAndroid || 'Android support', info.minAndroid || ''],
        [i18n?.[lang]?.infoSize || 'Approx. size', info.size || ''],
        [i18n?.[lang]?.infoIap || 'In-app purchases', info.inApp ? (i18n?.[lang]?.infoYes || 'Yes') : (i18n?.[lang]?.infoNo || 'No')],
        [i18n?.[lang]?.infoOffline || 'Works offline', info.offline ? (i18n?.[lang]?.infoYes || 'Yes') : (i18n?.[lang]?.infoNo || 'No')],
        [i18n?.[lang]?.infoUpdated || 'Roughly updated', info.updated || ''],
        [i18n?.[lang]?.infoPrivacy || 'Privacy', info.privacy?.[lang] || ''],
        [i18n?.[lang]?.infoData || 'Data & safety', info.data?.[lang] || '']
      ];
      rows.forEach(([label,value])=>{
        const dt = document.createElement('dt');
        dt.textContent = label;
        const dd = document.createElement('dd');
        dd.textContent = value;
        infoGrid.appendChild(dt);
        infoGrid.appendChild(dd);
      });
    }

    renderGallery(app.id, lang);

    if(ctaSecondary){
      ctaSecondary.innerHTML = `
        <button class="btn btn-wide btn-ghost" type="button" onclick="history.back()">
          <span>${i18n?.[lang]?.backToApps || '← Back to apps list'}</span>
        </button>
      `;
    }

    updateSeo(app, lang, pageTitle);
    initInteractiveFeedback();
  }

  function updateSeo(app, lang, pageTitle){
    const safeLang = (lang === 'ru' || lang === 'en') ? lang : 'uk';
    const description = app.short?.[safeLang] || app.desc?.[safeLang] || app.short?.uk || '';
    const appUrl = `${BASE_URL}/app.html?id=${encodeURIComponent(app.id)}`;
    const imageUrl = app.icon ? `${BASE_URL}${app.icon}` : `${BASE_URL}/assets/sashkinapps2.png`;

    const descMeta = document.querySelector('meta[name="description"]');
    if(descMeta) descMeta.setAttribute('content', description);

    const canonical = document.getElementById('canonical-link');
    if(canonical) canonical.setAttribute('href', appUrl);

    const ogUrl = document.getElementById('og-url');
    if(ogUrl) ogUrl.setAttribute('content', appUrl);

    const ogTitle = document.getElementById('og-title');
    if(ogTitle) ogTitle.setAttribute('content', pageTitle);

    const ogDescription = document.getElementById('og-description');
    if(ogDescription) ogDescription.setAttribute('content', description);

    const ogImage = document.getElementById('og-image');
    if(ogImage) ogImage.setAttribute('content', imageUrl);

    const ogImageAlt = document.getElementById('og-image-alt');
    if(ogImageAlt) ogImageAlt.setAttribute('content', `${titleForLang(app, safeLang)} app icon`);

    const twTitle = document.getElementById('twitter-title');
    if(twTitle) twTitle.setAttribute('content', pageTitle);

    const twDescription = document.getElementById('twitter-description');
    if(twDescription) twDescription.setAttribute('content', description);

    const twImage = document.getElementById('twitter-image');
    if(twImage) twImage.setAttribute('content', imageUrl);

    const twImageAlt = document.getElementById('twitter-image-alt');
    if(twImageAlt) twImageAlt.setAttribute('content', `${titleForLang(app, safeLang)} app icon`);

    const jsonLd = document.getElementById('app-jsonld');
    if(jsonLd){
      const data = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: titleForLang(app, safeLang),
        operatingSystem: 'Android',
        applicationCategory: app.category?.[safeLang] || app.category?.uk || 'Mobile Application',
        description,
        url: appUrl,
        image: imageUrl,
        inLanguage: safeLang,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Sashkin Apps',
          url: `${BASE_URL}/`
        }
      };
      jsonLd.textContent = JSON.stringify(data);
    }
  }

  function titleForLang(app, lang){
    return app.title?.[lang] || app.title?.uk || app.title?.en || 'Sashkin Apps';
  }

  document.getElementById('y').textContent = new Date().getFullYear();
  setupTabs();
  initInteractiveFeedback();
  bindLangSwitcher(i18n, renderApp);
});
