/* MathBloom felület, v5 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const Engine = window.MathBloomEngine;
  const I18N = window.MathBloomI18n;

  // Új látogató vegyes csokrot lát. A régi, fajta nélküli linkek klasszikus dáliát kapnak,
  // így ugyanazt a csokrot nyitják meg, mint eddig.
  const DEFAULT_FLOWERS = 'dmrt';
  const LINK_PARAMS = /(^|&)(view|seed)=/;
  const LANG_KEY = 'mathbloom-lang';

  // A beállítások a link # utáni részében utaznak (ez nem jut el a szerverhez).
  // A régi, ?-es linkeket is elfogadjuk.
  function readParams() {
    const hash = location.hash.slice(1);
    return new URLSearchParams(LINK_PARAMS.test(hash) ? hash : location.search);
  }
  const query = readParams();

  // A fordítható elemek magyar eredetijét a legelején eltesszük (mielőtt bármi átírná),
  // így angolról vissza tudunk váltani magyarra.
  const i18nItems = [...document.querySelectorAll('[data-i18n],[data-i18n-html],[data-i18n-attr]')].map(el => ({
    el,
    text: el.dataset.i18n,
    huText: el.dataset.i18n ? el.textContent : null,
    html: el.dataset.i18nHtml,
    huHtml: el.dataset.i18nHtml ? el.innerHTML : null,
    attrs: (el.dataset.i18nAttr || '').split(';').map(pair => pair.split(':').map(part => part.trim()))
      .filter(([attr, key]) => attr && key).map(([attr, key]) => ({ attr, key, hu: el.getAttribute(attr) }))
  }));

  // Nyelv: a link (?lang=en vagy az ajándéklinkben lang=en) az első, aztán a korábbi választás,
  // végül a böngésző nyelvi sorrendje. Aki nem magyarul olvas, angolt kap.
  let savedLanguage = null;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (I18N.languages.includes(saved)) savedLanguage = saved;
  } catch (error) { /* a tároló tiltva lehet */ }
  function initialLanguage() {
    const fromLink = query.get('lang');
    if (I18N.languages.includes(fromLink)) return fromLink;
    if (savedLanguage) return savedLanguage;
    const preferred = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (const tag of preferred) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (base === 'hu') return 'hu';
      if (base === 'en') return 'en';
    }
    return 'en';
  }
  let lang = initialLanguage();
  const T = () => I18N.dyn[lang];

  const clamp = (value, min, max, fallback) => {
    const x = Number(value);
    return value === null || value === '' || !Number.isFinite(x) ? fallback : Math.max(min, Math.min(max, Math.round(x)));
  };
  const state = {
    seed: clamp(query.get('seed'), 0, 4294967295, 1901) >>> 0,
    count: clamp(query.get('count'), 1, 9, 6),
    layers: clamp(query.get('layers'), 2, 6, 4),
    variation: clamp(query.get('variation'), 0, 100, 50),
    palette: Object.hasOwn(Engine.palettes, query.get('palette')) ? query.get('palette') : 'dusk',
    flowers: query.has('flowers') ? Engine.normalizeFlowers(query.get('flowers')) : query.has('seed') ? 'd' : DEFAULT_FLOWERS,
    to: (query.get('to') || '').slice(0, 60),
    message: (query.get('message') || '').slice(0, 240),
    occasion: Object.hasOwn(I18N.dyn.hu.occasions, query.get('occasion')) ? query.get('occasion') : 'just',
    // Generátor-változat: az ajándékoldal a linkben kapottat használja (régi linkeknél 1),
    // az alkotóműhely mindig a 2-est, amelyben a beállítások nem hatnak egymásra.
    gen: query.get('view') === 'gift' ? clamp(query.get('gen'), 1, 2, 1) : 2
  };
  const giftMode = query.get('view') === 'gift';
  let current, toastTimer, burstTimer, downloadBusy = false;

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500);
  }
  function seedName() { return 'MB–' + state.seed.toString(36).toUpperCase().padStart(7, '0'); }
  function variationLabel() {
    const names = T().variation;
    return state.variation + '% · ' + (state.variation === 0 ? names[0] : state.variation < 35 ? names[1] : state.variation < 70 ? names[2] : names[3]);
  }
  function caption() {
    $('gift-caption').hidden = !(state.to || state.message || giftMode);
    $('gift-to').textContent = state.to || giftMode ? T().giftTo(state.to) : '';
    $('gift-to').hidden = !$('gift-to').textContent;
    $('gift-message').textContent = state.message || (giftMode ? T().occasions[state.occasion] : '');
    $('gift-message').hidden = !$('gift-message').textContent;
    $('character-count').textContent = state.message.length + ' / 240';
  }
  function describe() {
    const kinds = [...Engine.flowerCodes].filter(code => current.kinds.includes(code)).map(code => T().flowers[code]).join(', ');
    return T().describe(state.count, kinds, state.layers, T().palettes[state.palette], state.variation);
  }

  // A csokor szöveges kiírásai (a rajz újrarajzolása nélkül, nyelvváltáshoz is).
  function renderTexts() {
    $('artboard').setAttribute('aria-label', describe());
    $('seed-label').textContent = seedName();
    $('petal-count').textContent = T().petalLine(current.totalPetals, state.count);
    $('count-output').textContent = T().count(state.count);
    $('layers-output').textContent = T().layers(state.layers);
    $('variation-output').textContent = variationLabel();
    caption();
  }

  // animate=false: csúszkahúzás közben ne induljon újra minden lépésnél a nyílás.
  function render(animate = true) {
    current = Engine.render(state);
    const art = $('artboard');
    art.classList.toggle('no-anim', !animate);
    art.innerHTML = current.svg;
    document.querySelector('.art-panel').style.background = current.background;
    renderTexts();
  }

  function drawTypeIcons() {
    document.querySelectorAll('.type-icon').forEach(icon => {
      icon.innerHTML = Engine.renderHead(icon.dataset.flower, { palette: state.palette });
    });
  }
  function syncTypeChips() {
    document.querySelectorAll('input[name=flower]').forEach(input => {
      input.checked = state.flowers.includes(input.value);
      input.closest('.type-choice').classList.toggle('on', input.checked);
    });
  }

  function makeLink() {
    const url = new URL(location.href);
    url.search = '';
    const values = { view: 'gift', gen: state.gen, lang, seed: state.seed, count: state.count, layers: state.layers, variation: state.variation, palette: state.palette, flowers: state.flowers, occasion: state.occasion };
    if (state.to) values.to = state.to;
    if (state.message) values.message = state.message;
    url.hash = new URLSearchParams(values).toString();
    return url.href;
  }

  // Vogel-spirál a „A szirmok mögött” kártyára: minden 13. és minden 21. pötty kiemelve.
  function drawVogel() {
    const group = $('vogel-dots');
    if (!group) return;
    const total = 233, cx = 112, cy = 85, c = 78 / Math.sqrt(total);
    let plain = '', marked = '';
    for (let n = 1; n <= total; n++) {
      const angle = n * 2.399963229728653, r = c * Math.sqrt(n);
      const x = (cx + r * Math.cos(angle)).toFixed(1), y = (cy + r * Math.sin(angle)).toFixed(1);
      if (n % 13 === 0) marked += '<circle cx="' + x + '" cy="' + y + '" r="3.1" fill="#743d55"/>';
      else if (n % 21 === 0) marked += '<circle cx="' + x + '" cy="' + y + '" r="3.1" fill="#5f7a4a"/>';
      else plain += '<circle cx="' + x + '" cy="' + y + '" r="2.2" fill="#cbb98f"/>';
    }
    group.innerHTML = plain + marked;
  }

  // Az eredeti MATLAB-kód linkje csak akkor jelenik meg, ha a fájl tényleg fent van.
  function revealSourceLink() {
    const link = $('source-link');
    if (!link || location.protocol === 'file:') return;
    fetch(link.getAttribute('href'), { method: 'HEAD', cache: 'no-store' })
      .then(response => { if (response.ok) link.hidden = false; })
      .catch(() => {});
  }

  /* ---------- Nyelvváltás ---------- */

  function applyStatic() {
    for (const item of i18nItems) {
      if (item.text) item.el.textContent = lang === 'en' && I18N.en[item.text] != null ? I18N.en[item.text] : item.huText;
      if (item.html) item.el.innerHTML = lang === 'en' && I18N.en[item.html] != null ? I18N.en[item.html] : item.huHtml;
      for (const { attr, key, hu } of item.attrs) {
        const value = lang === 'en' && I18N.en[key] != null ? I18N.en[key] : hu;
        if (value === null) item.el.removeAttribute(attr);
        else item.el.setAttribute(attr, value);
      }
    }
  }
  function renderGiftHeader() {
    if (!giftMode) return;
    const line = document.createElement('span');
    line.textContent = T().giftHeadline(state.to);
    const em = document.createElement('em');
    em.textContent = T().giftHeadlineEm;
    $('page-title').replaceChildren(line, document.createElement('br'), em);
    $('intro-eyebrow').textContent = T().giftEyebrow;
  }

  // A számlálót a visits.js írja, magyarul; a kéréseihez nem nyúlunk, csak a kiírt
  // szöveget fordítjuk le, ha angol a nyelv.
  const counter = $('visit-count');
  let counterSource = counter.textContent, counterShown = null;
  function paintCounter() {
    let text = counterSource;
    const match = /^Látogatások:\s*(.*)$/.exec(counterSource.trim());
    if (match && lang !== 'hu') {
      const value = match[1].trim();
      const shown = value === 'nem elérhető' ? T().counterUnavailable
        : /^[\d\s  .]+$/.test(value) ? new Intl.NumberFormat('en-GB').format(Number(value.replace(/\D/g, '')))
        : value;
      text = T().counterLabel + ': ' + shown;
    }
    counterShown = text;
    if (counter.textContent !== text) counter.textContent = text;
  }
  new MutationObserver(() => {
    if (counter.textContent === counterShown) return;
    counterSource = counter.textContent;
    paintCounter();
  }).observe(counter, { childList: true, characterData: true, subtree: true });

  const switcher = $('lang-switch');
  function paintSwitch(burst) {
    switcher.dataset.lang = lang;
    switcher.querySelectorAll('button[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
    if (!burst) return;
    switcher.classList.remove('bursting');
    void switcher.offsetWidth; // az animáció újraindításához
    switcher.classList.add('bursting');
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => switcher.classList.remove('bursting'), 1000);
  }

  function setLanguage(next, burst) {
    lang = next;
    document.documentElement.lang = lang;
    applyStatic();
    renderGiftHeader();
    document.title = giftMode ? T().giftDocTitle(state.to) : T().docTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', T().docDescription);
    $('message').placeholder = T().occasions[state.occasion];
    $('copy-link').textContent = T().copy;
    if (current) renderTexts();
    else caption();
    paintCounter();
    paintSwitch(burst);
  }

  // A választást megjegyezzük; ha a címsorban lang= szerepel, azt is átírjuk,
  // hogy frissítés után is a választott nyelv maradjon.
  function rememberLanguage() {
    try { localStorage.setItem(LANG_KEY, lang); } catch (error) { /* a tároló tiltva lehet */ }
    const url = new URL(location.href);
    let changed = false;
    if (url.searchParams.has('lang')) { url.searchParams.set('lang', lang); changed = true; }
    const hash = url.hash.slice(1);
    if (LINK_PARAMS.test(hash)) {
      const params = new URLSearchParams(hash);
      if (params.has('lang')) { params.set('lang', lang); url.hash = params.toString(); changed = true; }
    }
    if (changed) history.replaceState(history.state, '', url.href);
  }

  switcher.addEventListener('click', event => {
    const button = event.target.closest('button[data-lang]');
    if (!button) return;
    // Az aktív nyelvre kattintás is vált: az egész kapcsoló egy gombként is működik.
    const next = button.dataset.lang === lang ? (lang === 'hu' ? 'en' : 'hu') : button.dataset.lang;
    setLanguage(next, true);
    rememberLanguage();
  });

  /* ---------- Kezdőállapot ---------- */

  $('flower-count').value = state.count;
  $('layer-count').value = state.layers;
  $('variation').value = state.variation;
  $('recipient').value = state.to;
  $('message').value = state.message;
  $('occasion').value = state.occasion;
  document.querySelector('input[name=palette][value="' + state.palette + '"]').checked = true;
  syncTypeChips();
  drawTypeIcons();

  if (giftMode) {
    document.body.classList.add('gift-mode');
    $('gift-create').hidden = false;
    $('gift-create').href = location.pathname;
  }

  setLanguage(lang, false);
  render();
  drawVogel();
  revealSourceLink();
  // Aki még nem választott nyelvet, annak a kapcsoló egyszer megpulzál, hogy feltűnjön.
  if (!savedLanguage) {
    switcher.classList.add('intro');
    setTimeout(() => switcher.classList.remove('intro'), 2800);
  }

  // Ha valaki egy másik ajándéklinket nyit meg ugyanabban a lapban, csak a # rész változik: újratöltünk.
  window.addEventListener('hashchange', () => {
    if (LINK_PARAMS.test(location.hash.slice(1))) location.reload();
  });

  $('bloom-form').addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('input[name=flower]').forEach(input => input.addEventListener('change', () => {
    const picked = [...document.querySelectorAll('input[name=flower]:checked')].map(box => box.value).join('');
    if (!picked) {
      input.checked = true;
      notify(T().toastKeepOne);
      return;
    }
    state.flowers = Engine.normalizeFlowers(picked);
    syncTypeChips();
    render();
  }));
  document.querySelectorAll('input[name=palette]').forEach(input => input.addEventListener('change', () => {
    state.palette = input.value;
    drawTypeIcons();
    render();
  }));
  $('flower-count').addEventListener('input', event => { state.count = Number(event.target.value); render(false); });
  $('layer-count').addEventListener('input', event => { state.layers = Number(event.target.value); render(false); });
  $('variation').addEventListener('input', event => { state.variation = Number(event.target.value); render(false); });
  $('recipient').addEventListener('input', event => { state.to = event.target.value.slice(0, 60); caption(); });
  $('message').addEventListener('input', event => { state.message = event.target.value.slice(0, 240); caption(); });
  $('occasion').addEventListener('change', event => {
    state.occasion = event.target.value;
    $('message').placeholder = T().occasions[state.occasion];
    caption();
  });
  $('generate').addEventListener('click', () => {
    if (state.variation === 0) {
      notify(T().toastZero);
      return;
    }
    const bytes = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) { crypto.getRandomValues(bytes); state.seed = bytes[0]; }
    else state.seed = (Math.random() * 4294967296) >>> 0;
    render();
    notify(T().toastNew);
  });
  $('replay').addEventListener('click', () => {
    const art = $('artboard');
    art.classList.add('replaying');
    art.classList.remove('no-anim');
    requestAnimationFrame(() => requestAnimationFrame(() => art.classList.remove('replaying')));
  });

  function saveBlob(blob, filename) {
    const link = document.createElement('a'), url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function wrapLines(ctx, text, width) {
    const result = [];
    for (const paragraph of text.split('\n')) {
      if (!paragraph) { result.push(''); continue; }
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const combined = line ? line + ' ' + word : word;
        if (ctx.measureText(combined).width <= width) { line = combined; continue; }
        if (line) result.push(line);
        line = '';
        for (const character of word) {
          if (ctx.measureText(line + character).width > width) { result.push(line); line = ''; }
          line += character;
        }
      }
      if (line) result.push(line);
    }
    return result;
  }
  $('download').addEventListener('click', async () => {
    if (downloadBusy) return;
    downloadBusy = true;
    const button = $('download');
    button.disabled = true;
    const snapshot = { ...state }, words = T(), rendered = Engine.render(snapshot);
    const svgURL = URL.createObjectURL(new Blob([rendered.svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('image')); image.src = svgURL; });
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      canvas.width = 1800;
      ctx.font = '42px Arial';
      const message = snapshot.message || words.occasions[snapshot.occasion], lines = wrapLines(ctx, message, 1450);
      ctx.font = 'italic 64px Georgia';
      const titles = wrapLines(ctx, words.giftTo(snapshot.to), 1450);
      canvas.height = 1900 + titles.length * 78 + lines.length * 59;
      ctx.fillStyle = rendered.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, 1800, 1800);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#743d55';
      ctx.font = 'italic 64px Georgia';
      let y = 1835;
      for (const line of titles) { ctx.fillText(line, 900, y); y += 78; }
      ctx.font = '42px Arial';
      ctx.fillStyle = '#343b2e';
      y += 12;
      for (const line of lines) { ctx.fillText(line, 900, y); y += 59; }
      ctx.font = '27px Georgia';
      ctx.fillStyle = '#747e67';
      ctx.fillText(words.cardFooter, 900, canvas.height - 43);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('export');
      saveBlob(blob, 'MathBloom-' + snapshot.seed.toString(36).toUpperCase() + '.png');
      notify(T().toastCardReady);
    } catch (error) {
      notify(T().toastCardFailed);
    } finally {
      URL.revokeObjectURL(svgURL);
      downloadBusy = false;
      button.disabled = false;
    }
  });

  $('share').addEventListener('click', () => {
    $('share-url').value = makeLink();
    $('copy-link').textContent = T().copy;
    $('native-share').hidden = !navigator.share;
    $('share-dialog').showModal();
  });
  $('close-share').addEventListener('click', () => $('share-dialog').close());
  $('share-download').addEventListener('click', () => $('download').click());
  $('share-dialog').addEventListener('click', event => {
    if (event.target !== $('share-dialog')) return;
    const r = event.target.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close();
  });
  $('copy-link').addEventListener('click', async () => {
    const field = $('share-url');
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(field.value);
      else { field.focus(); field.select(); if (!document.execCommand('copy')) throw new Error('copy'); }
      $('copy-link').textContent = T().copied;
      notify(T().toastCopied);
    } catch (error) {
      field.focus();
      field.select();
      notify(T().toastCopyByHand);
    }
  });
  $('native-share').addEventListener('click', async () => {
    try {
      await navigator.share({ title: T().shareTitle, text: T().occasions.just, url: $('share-url').value });
    } catch (error) {
      if (error.name !== 'AbortError') notify(T().toastUseCopy);
    }
  });
})();
