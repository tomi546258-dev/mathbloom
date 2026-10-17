/* MathBloom felület, v2 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const Engine = window.MathBloomEngine;

  const occasionText = {
    just: 'Ez a virág most csak neked nyílt. ♡',
    birthday: 'Boldog születésnapot! Legyen virágzó éved. ♡',
    thanks: 'Köszönöm. Egy kis virág, egy nagy mosoly. ♡',
    love: 'Szeretettel, csak neked. ♡',
    cheer: 'Egy kis öröm neked. A szürke napokon is nyílnak virágok. ♡'
  };
  const flowerNames = { d: 'dália', m: 'margaréta', r: 'rózsa', p: 'pipacs', t: 'tulipán', n: 'napraforgó', l: 'levendula' };
  const paletteWords = { dusk: 'rózsaszín és lila', sunshine: 'meleg sárga és narancs', wildflower: 'kék és korall', rosegarden: 'piros és rózsaszín', sea: 'kék és türkiz', autumn: 'rozsda és mustár' };
  // Új látogató vegyes csokrot lát. A régi, fajta nélküli linkek klasszikus dáliát kapnak,
  // így ugyanazt a csokrot nyitják meg, mint eddig.
  const DEFAULT_FLOWERS = 'dmrt';
  const LINK_PARAMS = /(^|&)(view|seed)=/;

  // A beállítások a link # utáni részében utaznak (ez nem jut el a szerverhez).
  // A régi, ?-es linkeket is elfogadjuk.
  function readParams() {
    const hash = location.hash.slice(1);
    return new URLSearchParams(LINK_PARAMS.test(hash) ? hash : location.search);
  }
  const query = readParams();
  const clamp = (value, min, max, fallback) => {
    const x = Number(value);
    return value === null || value === '' || !Number.isFinite(x) ? fallback : Math.max(min, Math.min(max, Math.round(x)));
  };
  const state = {
    seed: clamp(query.get('seed'), 0, 4294967295, 1738) >>> 0,
    count: clamp(query.get('count'), 1, 9, 6),
    layers: clamp(query.get('layers'), 2, 6, 4),
    variation: clamp(query.get('variation'), 0, 100, 50),
    palette: Object.hasOwn(Engine.palettes, query.get('palette')) ? query.get('palette') : 'dusk',
    flowers: query.has('flowers') ? Engine.normalizeFlowers(query.get('flowers')) : query.has('seed') ? 'd' : DEFAULT_FLOWERS,
    to: (query.get('to') || '').slice(0, 60),
    message: (query.get('message') || '').slice(0, 240),
    occasion: Object.hasOwn(occasionText, query.get('occasion')) ? query.get('occasion') : 'just'
  };
  const giftMode = query.get('view') === 'gift';
  let current, toastTimer, downloadBusy = false;

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500);
  }
  function seedName() { return 'MB–' + state.seed.toString(36).toUpperCase().padStart(7, '0'); }
  function variationLabel() {
    return state.variation + '% · ' + (state.variation === 0 ? 'Szabályos' : state.variation < 35 ? 'Finom' : state.variation < 70 ? 'Természetes' : 'Szabad');
  }
  function caption() {
    $('gift-caption').hidden = !(state.to || state.message || giftMode);
    $('gift-to').textContent = state.to ? state.to + ', neked.' : giftMode ? 'Egy kis öröm, neked.' : '';
    $('gift-to').hidden = !$('gift-to').textContent;
    $('gift-message').textContent = state.message || (giftMode ? occasionText[state.occasion] : '');
    $('gift-message').hidden = !$('gift-message').textContent;
    $('character-count').textContent = state.message.length + ' / 240';
  }
  function describe() {
    const kinds = [...Engine.flowerCodes].filter(code => current.kinds.includes(code)).map(code => flowerNames[code]).join(', ');
    return state.count + ' virág (' + kinds + '), ' + state.layers + ' réteg, ' + paletteWords[state.palette] + ' színekben, ' + state.variation + ' százalék változatossággal.';
  }

  // animate=false: csúszkahúzás közben ne induljon újra minden lépésnél a nyílás.
  function render(animate = true) {
    current = Engine.render(state);
    const art = $('artboard');
    art.classList.toggle('no-anim', !animate);
    art.innerHTML = current.svg;
    art.setAttribute('aria-label', describe());
    document.querySelector('.art-panel').style.background = current.background;
    $('seed-label').textContent = seedName();
    $('petal-count').textContent = current.totalPetals + ' szirom · ' + state.count + ' virág · egy személyes üzenet';
    $('count-output').textContent = state.count + ' virág';
    $('layers-output').textContent = state.layers + ' réteg';
    $('variation-output').textContent = variationLabel();
    caption();
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
    const values = { view: 'gift', seed: state.seed, count: state.count, layers: state.layers, variation: state.variation, palette: state.palette, flowers: state.flowers, occasion: state.occasion };
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

  // Kezdőállapot
  $('flower-count').value = state.count;
  $('layer-count').value = state.layers;
  $('variation').value = state.variation;
  $('recipient').value = state.to;
  $('message').value = state.message;
  $('occasion').value = state.occasion;
  document.querySelector('input[name=palette][value="' + state.palette + '"]').checked = true;
  $('message').placeholder = occasionText[state.occasion];
  syncTypeChips();
  drawTypeIcons();

  if (giftMode) {
    document.body.classList.add('gift-mode');
    $('gift-create').hidden = false;
    $('page-title').replaceChildren();
    const line = document.createElement('span');
    line.textContent = state.to ? state.to + ',' : 'Egy kis öröm,';
    const br = document.createElement('br');
    const em = document.createElement('em');
    em.textContent = 'csak neked.';
    $('page-title').append(line, br, em);
    document.querySelector('.intro .eyebrow').textContent = 'VALAKI GONDOLT RÁD. ♡';
    $('gift-create').href = location.pathname;
    document.title = (state.to ? state.to + ', egy' : 'Egy') + ' virág neked · MathBloom';
  }

  render();
  drawVogel();
  revealSourceLink();

  // Ha valaki egy másik ajándéklinket nyit meg ugyanabban a lapban, csak a # rész változik: újratöltünk.
  window.addEventListener('hashchange', () => {
    if (LINK_PARAMS.test(location.hash.slice(1))) location.reload();
  });

  $('bloom-form').addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('input[name=flower]').forEach(input => input.addEventListener('change', () => {
    const picked = [...document.querySelectorAll('input[name=flower]:checked')].map(box => box.value).join('');
    if (!picked) {
      input.checked = true;
      notify('Legalább egy virágfajta maradjon a csokorban.');
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
    $('message').placeholder = occasionText[state.occasion];
    caption();
  });
  $('generate').addEventListener('click', () => {
    if (state.variation === 0) {
      notify('0%-nál minden csokor szabályos. Emeld a változatosságot egy új változathoz.');
      return;
    }
    const bytes = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) { crypto.getRandomValues(bytes); state.seed = bytes[0]; }
    else state.seed = (Math.random() * 4294967296) >>> 0;
    render();
    notify('Megszületett az új csokrod. ☺');
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
    const snapshot = { ...state }, rendered = Engine.render(snapshot);
    const svgURL = URL.createObjectURL(new Blob([rendered.svg], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('image')); image.src = svgURL; });
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      canvas.width = 1800;
      ctx.font = '42px Arial';
      const message = snapshot.message || occasionText[snapshot.occasion], lines = wrapLines(ctx, message, 1450);
      ctx.font = 'italic 64px Georgia';
      const titles = wrapLines(ctx, snapshot.to ? snapshot.to + ', neked.' : 'Egy kis öröm, neked.', 1450);
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
      ctx.fillText('MathBloom · Matematikából, szeretettel', 900, canvas.height - 43);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('export');
      saveBlob(blob, 'MathBloom-' + snapshot.seed.toString(36).toUpperCase() + '.png');
      notify('Elkészült a virágos képeslapod.');
    } catch (error) {
      notify('A kép mentése nem sikerült. Próbáld újra, vagy küldd el a linket.');
    } finally {
      URL.revokeObjectURL(svgURL);
      downloadBusy = false;
      button.disabled = false;
    }
  });

  $('share').addEventListener('click', () => {
    $('share-url').value = makeLink();
    $('copy-link').textContent = 'Másolás';
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
      $('copy-link').textContent = 'Másolva ✓';
      notify('A virágod linkje a vágólapra került.');
    } catch (error) {
      field.focus();
      field.select();
      notify('Jelöld ki és másold ki a linket kézzel.');
    }
  });
  $('native-share').addEventListener('click', async () => {
    try {
      await navigator.share({ title: 'MathBloom · Egy virág neked', text: 'Ez a virág most csak neked nyílt. ♡', url: $('share-url').value });
    } catch (error) {
      if (error.name !== 'AbortError') notify('Használd a link másolását a megosztáshoz.');
    }
  });
})();
