(function (root) {
  'use strict';
  const palettes = {
    dusk: { petals: ['#8c345a','#a46fbb','#c69cd2','#de97ae','#efb5a9','#ede4c5'], leaves: ['#657a4d','#87955d','#526947'], background: '#efeee5' },
    sunshine: { petals: ['#d57a44','#eab465','#f2cf84','#dc958b','#d36952','#e4c3d4'], leaves: ['#718155','#8d995d','#5e734d'], background: '#f2ede0' },
    wildflower: { petals: ['#7487bc','#91a7c9','#d9846b','#e5ac87','#dadcb2','#b6abc9'], leaves: ['#608575','#7d987a','#4f7566'], background: '#e9eee7' }
  };
  function random(seed) {
    let a = seed >>> 0;
    return function () { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function mix(hex, toward, amount) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(toward.slice(1), 16);
    return '#' + [16,8,0].map(s => Math.round(((a >> s) & 255) * (1-amount) + ((b >> s) & 255) * amount).toString(16).padStart(2,'0')).join('');
  }
  const n = x => Number(x.toFixed(2));
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
  function render(options = {}) {
    const seed = Number.isFinite(Number(options.seed)) ? Number(options.seed) >>> 0 : 1738;
    const count = Math.max(1,Math.min(9,Math.round(Number(options.count)||6)));
    const layers = Math.max(2,Math.min(6,Math.round(Number(options.layers)||4)));
    const variationValue = Number(options.variation);
    const variation = options.variation === undefined || options.variation === null || !Number.isFinite(variationValue) ? 50 : Math.max(0,Math.min(100,Math.round(variationValue)));
    const freedom = variation / 50;
    const controlledIndex = (baseline, sampled) => Math.round(baseline+(sampled-baseline)*Math.min(freedom,1));
    const paletteName = Object.hasOwn(palettes,options.palette) ? options.palette : 'dusk';
    const palette = palettes[paletteName], rnd = random(seed), flowers = layout(count,rnd,freedom);
    let defs = '<radialGradient id="paper"><stop stop-color="#fffdf4"/><stop offset="1" stop-color="'+palette.background+'"/></radialGradient><radialGradient id="core"><stop stop-color="#edc16e"/><stop offset=".6" stop-color="#c59b57"/><stop offset="1" stop-color="#82693c"/></radialGradient>';
    let stems = '', blooms = '', totalPetals = 0;
    for (const f of flowers) {
      const rootX = 449+(f.x-450)*.19, rootY = 806+(rnd()-.5)*33*freedom;
      const bend = f.x+(450-f.x)*.42+(rnd()-.5)*30*freedom;
      const green = palette.leaves[controlledIndex(f.index%palette.leaves.length,Math.floor(rnd()*palette.leaves.length))];
      stems += '<path d="M'+n(rootX)+' '+n(rootY)+' Q'+n(bend)+' '+n(f.y+230)+' '+n(f.x)+' '+n(f.y)+'" fill="none" stroke="'+green+'" stroke-width="'+n(5.5+(rnd()-.5)*3*freedom)+'" stroke-linecap="round"/>';
      for(let l=0;l<3;l++) {
        const t=.45+l*.14, u=1-t;
        const lx=u*u*rootX+2*u*t*bend+t*t*f.x, ly=u*u*rootY+2*u*t*(f.y+230)+t*t*f.y;
        const direction=(l+f.index)%2 ? -1 : 1;
        const len=87.5+(rnd()-.5)*45*freedom, angle=direction*(42.5+(rnd()-.5)*25*freedom);
        stems += '<g transform="translate('+n(lx)+' '+n(ly)+') rotate('+n(angle)+')"><path d="M0 0 Q'+n(-len*.49)+' '+n(-len*.58)+' 0 '+n(-len)+' Q'+n(len*.43)+' '+n(-len*.51)+' 0 0Z" fill="'+green+'" opacity=".92"/><path d="M0 -3 Q-3 '+n(-len*.48)+' 0 '+n(-len*.94)+'" stroke="'+mix(green,'#ffffff',.3)+'" stroke-width="1" fill="none"/></g>';
      }
      const baseColor = palette.petals[controlledIndex(f.index%palette.petals.length,Math.floor(rnd()*palette.petals.length))];
      const petalRnd = random((seed ^ Math.imul(f.index+1,0x9E3779B9))>>>0);
      const untamed = Math.max(0,freedom-1);
      let petals = '';
      for(let k=0;k<layers;k++) {
        const petalNumber=Math.round(13+(9+Math.floor(rnd()*8)-13)*freedom), r=f.r*(1-k/(layers+1)*.82), width=r*(.1825+(rnd()-.5)*.065*freedom), offset=r*.43;
        const color=mix(baseColor,k%2===0?'#ffffff':'#542443',k%2===0?.06+k*.06:.07+k*.035);
        const id='petal-'+f.index+'-'+k;
        defs += '<linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+mix(color,'#fff9e6',.32)+'"/><stop offset=".48" stop-color="'+color+'"/><stop offset="1" stop-color="'+mix(color,'#592c47',.31)+'"/></linearGradient>';
        for(let j=0;j<petalNumber;j++) {
          const angle=j*360/petalNumber+(k%2)*180/petalNumber+f.rotation+(petalRnd()-.5)*30*untamed;
          const lengthFactor=1+(petalRnd()-.5)*.36*untamed, widthFactor=1+(petalRnd()-.5)*.36*untamed;
          petals += '<ellipse cx="0" cy="'+n(-offset*lengthFactor)+'" rx="'+n(width*widthFactor)+'" ry="'+n(r*.59*lengthFactor)+'" fill="url(#'+id+')" fill-opacity=".86" stroke="'+mix(color,'#ffffff',.2)+'" stroke-opacity=".24" stroke-width=".65" transform="rotate('+n(angle)+')"/>';
          totalPetals++;
        }
      }
      const coreR=f.r*(.1425+(rnd()-.5)*.025*freedom);
      petals += '<circle r="'+n(coreR)+'" fill="url(#core)"/>';
      for(let p=0;p<52;p++) {
        const angle=p*2.399963229728653, radius=coreR*.91*Math.sqrt(p/52);
        petals += '<circle cx="'+n(Math.cos(angle)*radius)+'" cy="'+n(Math.sin(angle)*radius)+'" r="'+n(1.5+(rnd()-.5)*.7*freedom)+'" fill="'+(p%3===0?'#765835':'#edca7f')+'" opacity=".85"/>';
      }
      blooms += '<g transform="translate('+n(f.x)+' '+n(f.y)+')"><g class="flower-petals" style="animation-delay:'+n(f.index*.09)+'s">'+petals+'</g></g>';
    }
    const lady=flowers[flowers.length-1];
    const ladybug='<g transform="translate('+n(lady.x+(450-lady.x)*.28)+' '+n(lady.y+118)+') rotate(-28)"><ellipse rx="8" ry="11" fill="#98412f"/><path d="M0 -8V10" stroke="#373a2c" stroke-width="1.2"/><circle cy="-9" r="4" fill="#373a2c"/><circle cx="-4" cy="-2" r="1.6" fill="#373a2c"/><circle cx="4" cy="3" r="1.7" fill="#373a2c"/><circle cx="-3" cy="5" r="1.3" fill="#373a2c"/></g>';
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900" aria-hidden="true"><defs>'+defs+'</defs><rect width="900" height="900" fill="url(#paper)"/><g fill="none" stroke="#95a087" stroke-opacity=".1"><circle cx="450" cy="430" r="329"/><circle cx="450" cy="430" r="290"/><path d="M90 430h720M450 90v680" stroke-dasharray="2 9"/></g><ellipse cx="450" cy="830" rx="152" ry="18" fill="#64784f" opacity=".07"/>'+stems+'<path d="M416 770q35 14 70-3M416 780q34 12 70-2" fill="none" stroke="#b5a383" stroke-width="3" stroke-linecap="round"/>'+blooms+ladybug+'</svg>';
    return {svg, seed, count, layers, variation, palette:paletteName, totalPetals, background:palette.background};
  }
  const api={render,random,palettes};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MathBloomEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
