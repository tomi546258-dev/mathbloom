/*
 * MathBloom virággenerátor, v3
 *
 * Minden virág ugyanabból az elforgatott ellipszisből épül. A fajták csak abban
 * térnek el, hogy hány ellipszist, mekkora eltolással és milyen forgatási
 * szabály szerint raknak le.
 *
 * Megismételhetőség: azonos seed és beállítások mellett azonos SVG.
 * A klasszikus dália ('d') ugyanazt adja, mint az első változat, így a régi
 * ajándéklinkek ugyanazt a csokrot nyitják meg. Egy eltérés van: az alacsonyan
 * ülő virágok szára már nem lóg le a kötés alá.
 */
(function (root) {
  'use strict';

  const palettes = {
    dusk: { petals: ['#8c345a','#a46fbb','#c69cd2','#de97ae','#efb5a9','#ede4c5'], leaves: ['#657a4d','#87955d','#526947'], background: '#efeee5' },
    sunshine: { petals: ['#d57a44','#eab465','#f2cf84','#dc958b','#d36952','#e4c3d4'], leaves: ['#718155','#8d995d','#5e734d'], background: '#f2ede0' },
    wildflower: { petals: ['#7487bc','#91a7c9','#d9846b','#e5ac87','#dadcb2','#b6abc9'], leaves: ['#608575','#7d987a','#4f7566'], background: '#e9eee7' },
    rosegarden: { petals: ['#9e2a3c','#c4475a','#dc7484','#eea2a8','#f5cdc4','#f2e8d8'], leaves: ['#4e6a43','#6c8752','#3f5a3b'], background: '#f1ebe5' },
    sea: { petals: ['#3f6796','#6a93c4','#9bbbdc','#6f9f9a','#c3d6e4','#eef0ea'], leaves: ['#587d6c','#77957e','#48695a'], background: '#e7edef' },
    autumn: { petals: ['#9a3b2a','#c2643a','#d89a3f','#e7c47e','#7b2f40','#efe2c6'], leaves: ['#6e783d','#8a8e48','#59602f'], background: '#f2eadf' }
  };

  // Fajtakódok kanonikus sorrendben; ez kerül a linkbe is (flowers=dmr...).
  // d: dália, m: margaréta, r: rózsa, p: pipacs, t: tulipán, n: napraforgó, l: levendula
  const FLOWER_CODES = 'dmrptnl';
  const TYPE_SCALE = { d: 1, m: .95, r: .9, p: .96, t: 1.08, n: 1, l: 1 };
  // Jellemző szín fajtánként: a kisképek, a napraforgó és a levendula
  // ehhez legközelebbi palettaszínt kapják.
  const TYPE_HUE = { d: '#b5669b', m: '#ffffff', r: '#c4475a', p: '#d23c2c', t: '#e06a7a', n: '#f0bf45', l: '#8f7cc8' };
  const GOLDEN_ANGLE = 2.399963229728653; // radián: 360°·(2 − φ) ≈ 137,508°

  function random(seed) {
    let a = seed >>> 0;
    return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function mix(hex, toward, amount) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(toward.slice(1), 16);
    return '#' + [16,8,0].map(s => Math.round(((a >> s) & 255) * (1-amount) + ((b >> s) & 255) * amount).toString(16).padStart(2,'0')).join('');
  }
  const n = x => Number(x.toFixed(2));

  // A palettaszínek közül a célszínhez rank-adik legközelebbi (redmean távolság).
  function nearest(colors, target, rank) {
    const t = parseInt(target.slice(1), 16), tr = t >> 16 & 255, tg = t >> 8 & 255, tb = t & 255;
    const scored = colors.map(hex => {
      const v = parseInt(hex.slice(1), 16), r = v >> 16 & 255, g = v >> 8 & 255, b = v & 255, m = (r + tr) / 2;
      return [hex, (2 + m / 256) * (r - tr) ** 2 + 4 * (g - tg) ** 2 + (2 + (255 - m) / 256) * (b - tb) ** 2];
    }).sort((x, y) => x[1] - y[1]);
    return scored[Math.min(rank || 0, scored.length - 1)][0];
  }

  // Bármilyen bemenetből érvényes, kanonikus sorrendű fajtalista; üres esetén klasszikus dália.
  function normalizeFlowers(value) {
    const text = typeof value === 'string' ? value : '';
    let codes = '';
    for (const code of FLOWER_CODES) if (text.includes(code)) codes += code;
    return codes || 'd';
  }

  function layout(count, rnd, variation) {
    const layouts = {
      1:[[450,395,171]],2:[[332,380,147],[566,455,147]],3:[[453,282,133],[286,475,137],[591,495,136]],
      4:[[324,329,127],[562,344,126],[287,550,128],[546,550,132]],
      5:[[453,265,117],[270,396,120],[626,414,116],[348,588,125],[565,601,116]],
      6:[[314,318,117],[523,278,119],[661,433,108],[420,487,129],[231,540,108],[579,610,116]],
      7:[[293,294,108],[505,244,111],[647,371,108],[399,435,112],[204,487,99],[338,625,112],[583,581,116]],
      8:[[302,257,104],[522,257,103],[682,412,95],[171,412,93],[402,423,115],[258,586,107],[591,556,108],[468,670,99]],
      9:[[304,251,103],[521,226,100],[679,368,96],[168,397,90],[399,408,108],[580,490,100],[241,578,100],[430,633,110],[662,645,93]]
    };
    return layouts[count].map(([x,y,r],i) => ({x:x+(rnd()-.5)*26*variation,y:y+(rnd()-.5)*24*variation,r:r*(1+(.93+rnd()*.12-1)*variation),rotation:rnd()*360*variation,index:i}));
  }

  // Melyik helyre melyik fajta kerül. Csak a seedtől és a kiválasztott fajtáktól
  // függ, a változatosságtól nem: a csúszka a szirmok formáját, a virágok kis
  // elmozdulását és a színeket állítja, azt nem, hogy melyik virág rózsa és melyik tulipán.
  function assignTypes(codes, count, seed) {
    const pool = codes.split('');
    const list = [];
    if (pool.length > 1) {
      const tr = random((seed ^ 0x5BD1E995) >>> 0);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(tr() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      for (let i = 0; i < count; i++) list.push(pool[i % pool.length]);
      for (let s = 0; s < count; s++) {
        const a = Math.floor(tr() * count), b = Math.floor(tr() * count);
        [list[a], list[b]] = [list[b], list[a]];
      }
      return list;
    }
    for (let i = 0; i < count; i++) list.push(pool[i % pool.length]);
    return list;
  }

  function gradient(id, color) {
    return '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color,'#fff9e6',.32)+'"/><stop offset=".48" stop-color="'+color+'"/><stop offset="1" stop-color="'+mix(color,'#592c47',.31)+'"/></linearGradient>';
  }

  // Vogel-spirál: az n-edik pont szöge n·aranyszög, sugara √n-nel arányos.
  function vogel(count, radius, dot, colorAt, rnd, freedom) {
    let svg = '';
    for (let p = 0; p < count; p++) {
      const angle = p * GOLDEN_ANGLE, rr = radius * Math.sqrt((p + .5) / count);
      svg += '<circle cx="'+n(Math.cos(angle) * rr)+'" cy="'+n(Math.sin(angle) * rr)+'" r="'+n(dot * (1 + (rnd() - .5) * .3 * freedom))+'" fill="'+colorAt(p, count)+'"/>';
    }
    return svg;
  }

  /* ---------- Fajták. Mindegyik a virág saját (0,0) középpontja körül rajzol. ---------- */

  // Dália (klasszikus): rétegenként 9–16 eltolt ellipszis körben. Az első
  // változat kódja változatlanul; a véletlenszámokat ugyanabban a sorrendben húzza.
  function dahlia(c) {
    const { f, layers, freedom, untamed, rnd, petalRnd, base, uid } = c;
    let defs = '', svg = '', petals = 0;
    for(let k=0;k<layers;k++) {
      const petalNumber=Math.round(13+(9+Math.floor(rnd()*8)-13)*freedom), r=f.r*(1-k/(layers+1)*.82), width=r*(.1825+(rnd()-.5)*.065*freedom), offset=r*.43;
      const color=mix(base,k%2===0?'#ffffff':'#542443',k%2===0?.06+k*.06:.07+k*.035);
      const id=uid+'petal-'+f.index+'-'+k;
      defs += '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color,'#fff9e6',.32)+'"/><stop offset=".48" stop-color="'+color+'"/><stop offset="1" stop-color="'+mix(color,'#592c47',.31)+'"/></linearGradient>';
      for(let j=0;j<petalNumber;j++) {
        const angle=j*360/petalNumber+(k%2)*180/petalNumber+f.rotation+(petalRnd()-.5)*30*untamed;
        const lengthFactor=1+(petalRnd()-.5)*.36*untamed, widthFactor=1+(petalRnd()-.5)*.36*untamed;
        svg += '<ellipse cx="0" cy="'+n(-offset*lengthFactor)+'" rx="'+n(width*widthFactor)+'" ry="'+n(r*.59*lengthFactor)+'" fill="url(#'+id+')" fill-opacity=".86" stroke="'+mix(color,'#ffffff',.2)+'" stroke-opacity=".24" stroke-width=".65" transform="rotate('+n(angle)+')"/>';
        petals++;
      }
    }
    const coreR=f.r*(.1425+(rnd()-.5)*.025*freedom);
    svg += '<circle r="'+n(coreR)+'" fill="url(#'+uid+'core)"/>';
    for(let p=0;p<52;p++) {
      const angle=p*2.399963229728653, radius=coreR*.91*Math.sqrt(p/52);
      svg += '<circle cx="'+n(Math.cos(angle)*radius)+'" cy="'+n(Math.sin(angle)*radius)+'" r="'+n(1.5+(rnd()-.5)*.7*freedom)+'" fill="'+(p%3===0?'#765835':'#edca7f')+'" opacity=".85"/>';
    }
    return { defs, svg, petals };
  }

  // Margaréta: 20–32 keskeny ellipszis egy körön, nagy sárga közép.
  function daisy(c) {
    const { r, index, rotation, layers, freedom, calm, untamed, rnd, base, uid } = c;
    const core = r * (.22 + (rnd() - .5) * .04 * freedom);
    const count = Math.round(26 + (20 + Math.floor(rnd() * 13) - 26) * calm);
    const rows = layers >= 4 ? 2 : 1;
    const white = mix(base, '#fffdf6', .6);
    const inner = core * .72;
    let defs = '', svg = '', petals = 0;
    for (let k = rows - 1; k >= 0; k--) {
      const reach = r * (k ? .9 : 1);
      const a = (reach - inner) / 2;
      const b = r * (.082 + (rnd() - .5) * .02 * freedom);
      const color = k ? mix(white, '#6b5a4a', .12) : white;
      const id = uid + 'm' + index + '-' + k;
      // meleg árnyék a tőnél (nem bordó), hogy a fehér szirmok ne kapjanak lila udvart
      defs += '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color, '#ffffff', .3)+'"/><stop offset=".6" stop-color="'+color+'"/><stop offset="1" stop-color="'+mix(color, '#8a7a4a', .28)+'"/></linearGradient>';
      for (let j = 0; j < count; j++) {
        const angle = j * 360 / count + (k ? 180 / count : 0) + rotation + (rnd() - .5) * (6 * calm + 24 * untamed);
        const stretch = 1 + (rnd() - .5) * (.1 * calm + .3 * untamed);
        svg += '<ellipse cx="0" cy="'+n(-(inner + a * stretch))+'" rx="'+n(b)+'" ry="'+n(a * stretch)+'" fill="url(#'+id+')" stroke="'+mix(color, '#4a3a40', .45)+'" stroke-opacity=".42" stroke-width=".7" transform="rotate('+n(angle)+')"/>';
        petals++;
      }
    }
    svg += '<circle r="'+n(core)+'" fill="url(#'+uid+'core)"/>';
    svg += vogel(72, core * .9, core * .075, p => p % 3 === 0 ? '#b07d2c' : '#f1c95f', rnd, freedom);
    return { defs, svg, petals };
  }

  // Rózsa: ellipszisek aranyszög-spirálon, kívülről befelé rajzolva; középen logaritmikus spirál.
  function rose(c) {
    const { r, index, rotation, layers, calm, untamed, rnd, base, uid } = c;
    const count = 14 + layers * 4 + Math.round((Math.floor(rnd() * 5) - 2) * calm);
    const deep = '#3b1426';
    let defs = '', svg = '';
    for (let q = 0; q < 4; q++) {
      const color = mix(base, '#4a1730', .3 * (1 - q / 3));
      defs += '<linearGradient id="'+uid+'r'+index+'-'+q+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color, '#fff6ee', .36)+'"/><stop offset=".42" stop-color="'+color+'"/><stop offset="1" stop-color="'+mix(color, deep, .5)+'"/></linearGradient>';
    }
    const edge = mix(base, deep, .45);
    for (let i = count - 1; i >= 0; i--) {
      const t = (i + 1) / count;
      const band = Math.min(3, Math.floor(t * 4));
      const angle = i * 137.50776405 + rotation + (rnd() - .5) * (8 * calm + 30 * untamed);
      const dist = r * (.05 + .5 * Math.pow(t, .85));
      const a = r * (.15 + .31 * t) * (1 + (rnd() - .5) * (.1 * calm + .3 * untamed));
      const b = r * (.2 + .4 * t);
      svg += '<ellipse cx="0" cy="'+n(-dist)+'" rx="'+n(b)+'" ry="'+n(a)+'" fill="url(#'+uid+'r'+index+'-'+band+')" stroke="'+edge+'" stroke-opacity=".35" stroke-width=".8" transform="rotate('+n(angle)+')"/>';
    }
    // ρ = ρ0 · e^(kθ)
    const turns = 3.2 * Math.PI, rho0 = r * .012, k = Math.log(.17 / .012) / turns, start = rotation * Math.PI / 180;
    let d = '';
    for (let s = 0; s <= 48; s++) {
      const th = s / 48 * turns, rho = rho0 * Math.exp(k * th);
      d += (s ? ' L' : 'M') + n(Math.cos(th + start) * rho) + ' ' + n(Math.sin(th + start) * rho);
    }
    svg += '<path d="'+d+'" fill="none" stroke="'+mix(base, deep, .6)+'" stroke-opacity=".5" stroke-width="'+n(Math.max(1, r * .013))+'" stroke-linecap="round"/>';
    return { defs, svg, petals: count };
  }

  // Pipacs: 4–6 széles ellipszis egy vagy két sorban, sötét tővel; közepén magtok és porzógyűrű.
  function poppy(c) {
    const { r, index, rotation, layers, freedom, calm, untamed, rnd, base, uid } = c;
    const count = 4 + Math.round(Math.floor(rnd() * 3) * calm);
    const rows = layers >= 3 ? 2 : 1;
    const dark = '#2a1520';
    let defs = '', svg = '', petals = 0;
    for (let k = 0; k < rows; k++) {
      const size = k ? .84 : 1;
      const color = k ? mix(base, '#fff3ea', .08) : mix(base, '#3a1424', .1);
      const id = uid + 'p' + index + '-' + k;
      defs += '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color, '#fff4ea', .22)+'"/><stop offset=".55" stop-color="'+color+'"/><stop offset=".85" stop-color="'+mix(color, dark, .32)+'"/><stop offset="1" stop-color="'+mix(color, dark, .85)+'"/></linearGradient>';
      const vein = mix(color, dark, .4);
      for (let j = 0; j < count; j++) {
        const angle = j * 360 / count + (k ? 180 / count : 0) + rotation + (rnd() - .5) * (10 * calm + 30 * untamed);
        const a = r * .54 * size * (1 + (rnd() - .5) * (.08 * calm + .3 * untamed));
        const b = r * .5 * size * Math.sqrt(4 / count);
        const d = r * .44 * size;
        let petal = '<ellipse cx="0" cy="'+n(-d)+'" rx="'+n(b)+'" ry="'+n(a)+'" fill="url(#'+id+')" stroke="'+vein+'" stroke-opacity=".3" stroke-width=".8"/>';
        for (let v = -2; v <= 2; v++) {
          petal += '<path d="M0 '+n(-d + a * .7)+' Q'+n(v * b * .2)+' '+n(-d)+' '+n(v * b * .36)+' '+n(-d - a * .78)+'" fill="none" stroke="'+vein+'" stroke-opacity=".16" stroke-width=".7"/>';
        }
        svg += '<g transform="rotate('+n(angle)+')">'+petal+'</g>';
        petals++;
      }
    }
    // porzók egy körgyűrűben, egyenletes sűrűséggel: ρ² lineárisan nő
    const cap = r * .12, r0 = cap * 1.08, r1 = cap * 1.95, stamens = 46;
    for (let p = 0; p < stamens; p++) {
      const angle = p * GOLDEN_ANGLE, rr = Math.sqrt(r0 * r0 + (r1 * r1 - r0 * r0) * (p + .5) / stamens);
      svg += '<circle cx="'+n(Math.cos(angle) * rr)+'" cy="'+n(Math.sin(angle) * rr)+'" r="'+n(r * .021 * (1 + (rnd() - .5) * .4 * freedom))+'" fill="#2b2227" opacity=".88"/>';
    }
    svg += '<circle r="'+n(cap)+'" fill="#56623f"/><circle cx="'+n(-cap * .22)+'" cy="'+n(-cap * .22)+'" r="'+n(cap * .55)+'" fill="#7f8b5d" opacity=".55"/>';
    for (let s = 0; s < 8; s++) {
      const angle = s * Math.PI / 4 + rotation * Math.PI / 180;
      svg += '<path d="M0 0L'+n(Math.cos(angle) * cap * .86)+' '+n(Math.sin(angle) * cap * .86)+'" stroke="#2f2a2c" stroke-opacity=".75" stroke-width="'+n(Math.max(.8, r * .012))+'" stroke-linecap="round"/>';
    }
    return { defs, svg, petals };
  }

  // Tulipán oldalnézetből: négy ellipszis egy közös tő körül elforgatva; az egész a szár irányába dől.
  function tulip(c) {
    const { r, index, lean, freedom, rnd, base, uid } = c;
    const tilt = lean + (rnd() - .5) * 12 * freedom;
    const by = r * .55;
    const shades = [mix(base, '#3a1424', .24), mix(base, '#3a1424', .08), mix(base, '#fff6ee', .07)];
    let defs = '';
    shades.forEach((color, s) => { defs += gradient(uid + 't' + index + '-' + s, color); });
    // [nyitási szög°, hossz, szélesség, árnyalat]: hátsó, bal, jobb, első szirom
    const parts = [[0, .66, .27, 0], [-17, .6, .29, 1], [17, .6, .29, 1], [0, .58, .33, 2]];
    let svg = '<g transform="rotate('+n(tilt)+')">';
    for (const [open, length, width, s] of parts) {
      const a = r * length * (1 + (rnd() - .5) * .08 * freedom), b = r * width;
      const angle = open * (1 + (rnd() - .5) * .4 * freedom);
      svg += '<ellipse cx="0" cy="'+n(-a * .92)+'" rx="'+n(b)+'" ry="'+n(a)+'" fill="url(#'+uid+'t'+index+'-'+s+')" stroke="'+mix(shades[s], '#3a1424', .3)+'" stroke-opacity=".3" stroke-width=".8" transform="translate(0 '+n(by)+') rotate('+n(angle)+')"/>';
    }
    svg += '<path d="M0 '+n(by - r * .08)+' Q'+n(r * .03)+' '+n(by - r * .5)+' 0 '+n(by - r * .98)+'" fill="none" stroke="'+mix(shades[2], '#ffffff', .4)+'" stroke-opacity=".35" stroke-width="1"/>';
    svg += '</g>';
    return { defs, svg, petals: parts.length };
  }

  // Napraforgó: nagy közép Vogel-spirállal, körülötte 1–3 sor keskeny szirom.
  function sunflower(c) {
    const { r, index, rotation, layers, freedom, calm, untamed, rnd, base, uid } = c;
    const core = r * (.4 + (rnd() - .5) * .04 * freedom);
    const count = Math.round(21 + (Math.floor(rnd() * 9) - 4) * calm);
    const rows = layers >= 5 ? 3 : layers >= 3 ? 2 : 1;
    const inner = core * .86;
    let defs = '', svg = '', petals = 0;
    for (let k = rows - 1; k >= 0; k--) {
      const reach = r * (1 - k * .07);
      const a = (reach - inner) / 2;
      const b = r * (.1 + (rnd() - .5) * .02 * freedom);
      const color = mix(base, '#3a1a10', .1 * k);
      const id = uid + 'n' + index + '-' + k;
      defs += gradient(id, color);
      for (let j = 0; j < count; j++) {
        const angle = (j + k / rows) * 360 / count + rotation + (rnd() - .5) * (5 * calm + 24 * untamed);
        const stretch = 1 + (rnd() - .5) * (.12 * calm + .3 * untamed);
        svg += '<ellipse cx="0" cy="'+n(-(inner + a * stretch))+'" rx="'+n(b)+'" ry="'+n(a * stretch)+'" fill="url(#'+id+')" stroke="'+mix(color, '#3a1a10', .3)+'" stroke-opacity=".25" stroke-width=".7" transform="rotate('+n(angle)+')"/>';
        petals++;
      }
    }
    defs += '<radialGradient id="'+uid+'disc'+index+'"><stop stop-color="#6d5a2a"/><stop offset=".55" stop-color="#4a2f18"/><stop offset="1" stop-color="#2f1d0f"/></radialGradient>';
    svg += '<circle r="'+n(core)+'" fill="url(#'+uid+'disc'+index+')"/>';
    svg += vogel(150, core * .94, core * .05, (p, total) => p > total * .82 ? '#c99a3f' : p % 3 === 0 ? '#7a5a2c' : '#24170d', rnd, freedom);
    return { defs, svg, petals };
  }

  // Levendula: öt füzér; a virágkák mérete mértani sorozat szerint csökken a csúcs felé.
  function lavender(c) {
    const { r, lean, layers, freedom, rnd, base, green } = c;
    const whorls = 8 + layers * 2;
    const ratio = Math.pow(.42, 1 / (whorls - 1));
    const light = mix(base, '#ffffff', .16), dark = mix(base, '#2e1a3a', .22);
    const tilt = lean + (rnd() - .5) * 10 * freedom;
    let svg = '<g transform="rotate('+n(tilt)+')">', petals = 0;
    for (const [spread, lengthFactor] of [[-25, .62], [25, .58], [-11, .84], [11, .8], [0, 1]]) {
      const angle = spread + (rnd() - .5) * 8 * freedom;
      const length = r * 1.5 * lengthFactor * (1 + (rnd() - .5) * .12 * freedom);
      let spike = '<path d="M0 0L0 '+n(-length)+'" stroke="'+green+'" stroke-width="'+n(Math.max(1.2, r * .014))+'" stroke-linecap="round"/>';
      for (let w = 0; w < whorls; w++) {
        const y = -length * (.3 + .7 * w / (whorls - 1));
        const size = r * .12 * Math.pow(ratio, w);
        const tone = w % 2 ? dark : light;
        spike += '<ellipse cx="'+n(-size * .5)+'" cy="'+n(y)+'" rx="'+n(size * .42)+'" ry="'+n(size * .72)+'" fill="'+tone+'" transform="rotate(-34 '+n(-size * .5)+' '+n(y)+')"/>';
        spike += '<ellipse cx="'+n(size * .5)+'" cy="'+n(y)+'" rx="'+n(size * .42)+'" ry="'+n(size * .72)+'" fill="'+tone+'" transform="rotate(34 '+n(size * .5)+' '+n(y)+')"/>';
        spike += '<ellipse cy="'+n(y - size * .35)+'" rx="'+n(size * .4)+'" ry="'+n(size * .66)+'" fill="'+(w % 2 ? light : base)+'"/>';
        petals += 3;
      }
      svg += '<g transform="translate(0 '+n(r * .45)+') rotate('+n(angle)+')">'+spike+'</g>';
    }
    svg += '</g>';
    return { defs: '', svg, petals };
  }

  const HEADS = { m: daisy, r: rose, p: poppy, t: tulip, n: sunflower, l: lavender };

  function render(options = {}) {
    const seed = Number.isFinite(Number(options.seed)) ? Number(options.seed) >>> 0 : 1738;
    const count = Math.max(1,Math.min(9,Math.round(Number(options.count)||6)));
    const layers = Math.max(2,Math.min(6,Math.round(Number(options.layers)||4)));
    const variationValue = Number(options.variation);
    const variation = options.variation === undefined || options.variation === null || !Number.isFinite(variationValue) ? 50 : Math.max(0,Math.min(100,Math.round(variationValue)));
    const freedom = variation / 50;
    const calm = Math.min(freedom, 1), untamed = Math.max(0, freedom - 1);
    const controlledIndex = (baseline, sampled) => Math.round(baseline+(sampled-baseline)*Math.min(freedom,1));
    const paletteName = Object.hasOwn(palettes,options.palette) ? options.palette : 'dusk';
    const flowerCodes = normalizeFlowers(options.flowers === undefined || options.flowers === null ? 'd' : String(options.flowers));
    const palette = palettes[paletteName], rnd = random(seed), flowers = layout(count,rnd,freedom);
    const kinds = assignTypes(flowerCodes, count, seed);
    let defs = '<radialGradient id="paper"><stop stop-color="#fffdf4"/><stop offset="1" stop-color="'+palette.background+'"/></radialGradient><radialGradient id="core"><stop stop-color="#edc16e"/><stop offset=".6" stop-color="#c59b57"/><stop offset="1" stop-color="#82693c"/></radialGradient>';
    let stems = '', blooms = '', totalPetals = 0;
    for (const f of flowers) {
      const kind = kinds[f.index];
      const rootX = 449+(f.x-450)*.19, rootY = 806+(rnd()-.5)*33*freedom;
      const bend = f.x+(450-f.x)*.42+(rnd()-.5)*30*freedom;
      // A kontrollpont nem kerülhet a szár töve alá, különben a szár lelóg és visszakunkorodik.
      const ctrlY = Math.min(f.y+230, rootY-40);
      const green = palette.leaves[controlledIndex(f.index%palette.leaves.length,Math.floor(rnd()*palette.leaves.length))];
      stems += '<path d="M'+n(rootX)+' '+n(rootY)+' Q'+n(bend)+' '+n(ctrlY)+' '+n(f.x)+' '+n(f.y)+'" fill="none" stroke="'+green+'" stroke-width="'+n(5.5+(rnd()-.5)*3*freedom)+'" stroke-linecap="round"/>';
      for(let l=0;l<3;l++) {
        const t=.45+l*.14, u=1-t;
        const lx=u*u*rootX+2*u*t*bend+t*t*f.x, ly=u*u*rootY+2*u*t*ctrlY+t*t*f.y;
        const direction=(l+f.index)%2 ? -1 : 1;
        const len=87.5+(rnd()-.5)*45*freedom, angle=direction*(42.5+(rnd()-.5)*25*freedom);
        stems += '<g transform="translate('+n(lx)+' '+n(ly)+') rotate('+n(angle)+')"><path d="M0 0 Q'+n(-len*.49)+' '+n(-len*.58)+' 0 '+n(-len)+' Q'+n(len*.43)+' '+n(-len*.51)+' 0 0Z" fill="'+green+'" opacity=".92"/><path d="M0 -3 Q-3 '+n(-len*.48)+' 0 '+n(-len*.94)+'" stroke="'+mix(green,'#ffffff',.3)+'" stroke-width="1" fill="none"/></g>';
      }
      const baseColor = palette.petals[controlledIndex(f.index%palette.petals.length,Math.floor(rnd()*palette.petals.length))];
      let head;
      if (kind === 'd') {
        const petalRnd = random((seed ^ Math.imul(f.index+1,0x9E3779B9))>>>0);
        head = dahlia({ f, layers, freedom, untamed, rnd, petalRnd, base: baseColor, uid: '' });
      } else {
        // A közös véletlenfolyamból annyit lépünk, amennyit egy dália fogyasztana,
        // így a fajta cseréje nem rendezi át a többi virág helyét, szárát és színét.
        for (let s = 0; s < layers*2+53; s++) rnd();
        const headRnd = random((seed ^ Math.imul(f.index+1,0x85EBCA6B) ^ 0x27D4EB2F)>>>0);
        const lean = Math.atan2(f.x-bend, ctrlY-f.y)*180/Math.PI;
        // A napraforgó és a levendula a színéről ismerős: a palettából a jellemző
        // színéhez közelit kapja (napraforgónál a két legközelebbi egyikét).
        const base = kind === 'n' ? nearest(palette.petals, TYPE_HUE.n, freedom > 0 ? Math.floor(headRnd()*2) : 0)
          : kind === 'l' ? nearest(palette.petals, TYPE_HUE.l, 0) : baseColor;
        head = HEADS[kind]({ r: f.r*TYPE_SCALE[kind], index: f.index, rotation: f.rotation, layers, freedom, calm, untamed, rnd: headRnd, base, green, lean, uid: '' });
      }
      defs += head.defs;
      totalPetals += head.petals;
      blooms += '<g transform="translate('+n(f.x)+' '+n(f.y)+')"><g class="flower-petals" style="animation-delay:'+n(f.index*.09)+'s">'+head.svg+'</g></g>';
    }
    const lady=flowers[flowers.length-1];
    const ladybug='<g transform="translate('+n(lady.x+(450-lady.x)*.28)+' '+n(lady.y+118)+') rotate(-28)"><ellipse rx="8" ry="11" fill="#98412f"/><path d="M0 -8V10" stroke="#373a2c" stroke-width="1.2"/><circle cy="-9" r="4" fill="#373a2c"/><circle cx="-4" cy="-2" r="1.6" fill="#373a2c"/><circle cx="4" cy="3" r="1.7" fill="#373a2c"/><circle cx="-3" cy="5" r="1.3" fill="#373a2c"/></g>';
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900" aria-hidden="true"><defs>'+defs+'</defs><rect width="900" height="900" fill="url(#paper)"/><g fill="none" stroke="#95a087" stroke-opacity=".1"><circle cx="450" cy="430" r="329"/><circle cx="450" cy="430" r="290"/><path d="M90 430h720M450 90v680" stroke-dasharray="2 9"/></g><ellipse cx="450" cy="830" rx="152" ry="18" fill="#64784f" opacity=".07"/>'+stems+'<path d="M416 770q35 14 70-3M416 780q34 12 70-2" fill="none" stroke="#b5a383" stroke-width="3" stroke-linecap="round"/>'+blooms+ladybug+'</svg>';
    return {svg, seed, count, layers, variation, palette:paletteName, flowers:flowerCodes, kinds, totalPetals, background:palette.background};
  }

  // Egyetlen virágfej kis előnézethez (a fajtaválasztó gombjaihoz). Saját ID-előtagot használ.
  function renderHead(code, options = {}) {
    const kind = typeof code === 'string' && code.length === 1 && FLOWER_CODES.includes(code) ? code : 'd';
    const palette = palettes[Object.hasOwn(palettes, options.palette) ? options.palette : 'dusk'];
    const uid = 'ico-' + kind + '-';
    const base = nearest(palette.petals, TYPE_HUE[kind], 0);
    const rnd = random(1738 + FLOWER_CODES.indexOf(kind));
    const r = 40;
    const head = kind === 'd'
      ? dahlia({ f: { r, index: 0, rotation: 12 }, layers: 4, freedom: 1, untamed: 0, rnd, petalRnd: random(99), base, uid })
      : HEADS[kind]({ r: r * TYPE_SCALE[kind], index: 0, rotation: 12, layers: 4, freedom: 1, calm: 1, untamed: 0, rnd, base, green: palette.leaves[0], lean: 0, uid });
    const stem = kind === 't' || kind === 'l' ? '<path d="M0 18V50" stroke="'+palette.leaves[0]+'" stroke-width="3" stroke-linecap="round"/>' : '';
    const core = '<radialGradient id="'+uid+'core"><stop stop-color="#edc16e"/><stop offset=".6" stop-color="#c59b57"/><stop offset="1" stop-color="#82693c"/></radialGradient>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs>'+core+head.defs+'</defs>'+stem+head.svg+'</svg>';
  }

  const api = { render, renderHead, random, palettes, flowerCodes: FLOWER_CODES, normalizeFlowers };
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MathBloomEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
