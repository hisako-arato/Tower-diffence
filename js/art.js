// オリジナルキャラクターアート（SVGで描画）
// レアリティが高いほど豪華になる：
//   ★3 … シンプルな衣装
//   ★4 … 金/銀の縁取り・宝石・淡いオーラ
//   ★5 … 輝くオーラ・光条・マント・舞う粒子・豪華な装飾・光る武器
// TD.CUSTOM_ART に画像パスを登録すると、そのキャラはSVGの代わりに画像で表示される。
window.TD = window.TD || {};

// src: 画像パス / ratio: 画像の 高さ÷幅 / face: [顔の中心x, 顔の中心y, 切り抜く大きさ]（いずれも画像幅・高さに対する割合）
TD.CUSTOM_ART = {
  meltia:  { src: 'assets/chars/meltia.webp',  ratio: 0.808, face: [0.60, 0.30, 0.34] },
  kagura:  { src: 'assets/chars/kagura.webp',  ratio: 0.622, face: [0.58, 0.39, 0.30] },
  nereia:  { src: 'assets/chars/nereia.webp',  ratio: 0.629, face: [0.59, 0.27, 0.34] },
  akane:   { src: 'assets/chars/akane.webp',   ratio: 1.686, face: [0.30, 0.15, 0.56] },
  shizuku: { src: 'assets/chars/shizuku.webp', ratio: 1.818, face: [0.56, 0.21, 0.50] },
  sylphina: { src: 'assets/chars/sylphina.webp', ratio: 0.876, face: [0.62, 0.13, 0.24] },
  seira:    { src: 'assets/chars/seira.webp',    ratio: 0.860, face: [0.46, 0.20, 0.26] },
  xeno:     { src: 'assets/chars/xeno.webp',     ratio: 0.942, face: [0.47, 0.15, 0.28] },
  karin:    { src: 'assets/chars/karin.webp',    ratio: 0.953, face: [0.36, 0.26, 0.32] },
  shigure:  { src: 'assets/chars/shigure.webp',  ratio: 1.094, face: [0.40, 0.14, 0.32] },
  lydia:    { src: 'assets/chars/lydia.webp',    ratio: 1.000, face: [0.52, 0.14, 0.24] },
  soyo:     { src: 'assets/chars/soyo.webp',     ratio: 1.000, face: [0.44, 0.17, 0.26] },
  hayate:   { src: 'assets/chars/hayate.webp',   ratio: 0.887, face: [0.58, 0.11, 0.22] },
  zephyr:   { src: 'assets/chars/zephyr.webp',   ratio: 1.190, face: [0.55, 0.23, 0.32] },
  viola:    { src: 'assets/chars/viola.webp',    ratio: 1.024, face: [0.46, 0.27, 0.34] },
};
// 文字列だけで登録した場合にも対応
TD.customArt = function (id) {
  const c = TD.CUSTOM_ART[id];
  if (!c) return null;
  return typeof c === 'string' ? { src: c, ratio: 1, face: [0.5, 0.3, 0.6] } : c;
};

TD.ART = {
  lydia: {
    skin: '#ffe6d6', hair: ['#ffe9a0', '#e0a92e'], hairStyle: 'long', bangs: 'hime', eyes: '#2f6fd0', eyeShape: 'normal', mouth: 'smile',
    outfit: { type: 'armor', main: '#eef3fb', sub: '#3a5fb8', trim: '#f2c94c', skirt: true },
    head: 'tiara', weapon: 'holysword', cape: ['#2f56b0', '#1d3a80'], aura: '#ffe066', particles: 'feather',
  },
  celes: {
    skin: '#fff0ea', hair: ['#e6f4ff', '#8fb8e8'], hairStyle: 'long', bangs: 'side', eyes: '#6a5cff', eyeShape: 'cool', mouth: 'neutral',
    outfit: { type: 'gown', main: '#2a4aa0', sub: '#bfe8ff', trim: '#e8f6ff' },
    head: 'icecrown', weapon: 'icestaff', cape: ['#7fc4ff', '#2a5aa8'], aura: '#7fdcff', particles: 'ice',
  },
  zephyr: {
    skin: '#fde3d0', hair: ['#6fe0c0', '#1f8a78'], hairStyle: 'wild', bangs: 'spiky', eyes: '#e0a020', eyeShape: 'sharp', mouth: 'smirk',
    outfit: { type: 'coat', main: '#f4fff8', sub: '#2f9a6a', trim: '#f2c94c' },
    head: 'featherband', weapon: 'greatbow', cape: ['#3fbf8a', '#1d6a4a'], aura: '#8affc0', particles: 'leaf',
  },
  fin: {
    skin: '#f6d5bd', hair: ['#a8703a', '#6a4220'], hairStyle: 'short', bangs: 'messy', eyes: '#3a9a5a', eyeShape: 'normal', mouth: 'grin',
    outfit: { type: 'leather', main: '#5a8a3a', sub: '#7a5432', trim: '#d8dde6' },
    head: 'hood', hoodColor: '#3f7a3a', weapon: 'bow',
  },
  gald: {
    skin: '#e8b898', hair: ['#7a5a3a', '#4a3420'], hairStyle: 'short', bangs: 'short', eyes: '#5a4a3a', eyeShape: 'sharp', mouth: 'neutral', beard: '#6a4a2a',
    outfit: { type: 'heavy', main: '#b8862e', sub: '#6a4a1a', trim: '#e8e0c8' },
    head: 'helmet', weapon: 'towershield',
  },
  nox: {
    skin: '#f2dcd0', hair: ['#3a3450', '#15121f'], hairStyle: 'short', bangs: 'covereye', eyes: '#e03040', eyeShape: 'sharp', mouth: 'none',
    outfit: { type: 'coat', main: '#2a2438', sub: '#6a3aa8', trim: '#c0c8d8' },
    head: 'mask', weapon: 'katana',
  },
  blaire: {
    skin: '#f6d0b8', hair: ['#ff6a4a', '#b0281a'], hairStyle: 'ponytail', bangs: 'messy', eyes: '#ff9a20', eyeShape: 'sharp', mouth: 'grin',
    outfit: { type: 'fighter', main: '#ff8a3a', sub: '#3a2a2a', trim: '#f2c94c' },
    head: 'headband', weapon: 'gauntlet',
  },
  rune: {
    skin: '#f8e6e0', hair: ['#a070e0', '#5a2aa0'], hairStyle: 'long', bangs: 'hime', eyes: '#c040ff', eyeShape: 'cool', mouth: 'smirk',
    outfit: { type: 'robe', main: '#3a2460', sub: '#a070e0', trim: '#d8c0ff' },
    head: 'witchhat', weapon: 'book',
  },
  mia: {
    skin: '#ffe6da', hair: ['#ffb0c8', '#e07090'], hairStyle: 'bob', bangs: 'round', eyes: '#e05a8a', eyeShape: 'soft', mouth: 'open',
    outfit: { type: 'priest', main: '#ffffff', sub: '#3a4a8a', trim: '#f2c94c' },
    head: 'veil', weapon: 'crossstaff',
  },
  kai: {
    skin: '#f6d2b8', hair: ['#ff5a3a', '#a8200f'], hairStyle: 'spiky', bangs: 'spiky', eyes: '#ffb020', eyeShape: 'normal', mouth: 'grin',
    outfit: { type: 'robe', main: '#c0301a', sub: '#3a2a20', trim: '#ffb040' },
    head: 'goggles', weapon: 'fireball',
  },
  thomas: {
    skin: '#f8dcc8', hair: ['#c89a5a', '#8a6230'], hairStyle: 'short', bangs: 'round', eyes: '#5a7aa0', eyeShape: 'soft', mouth: 'open', freckles: true,
    outfit: { type: 'armor', main: '#aab4c4', sub: '#2f5a9a', trim: '#7ab0e0' },
    head: 'none', weapon: 'roundshield',
  },
  lily: {
    skin: '#fff0e8', hair: ['#7ac8ff', '#2a7ac8'], hairStyle: 'braids', bangs: 'round', eyes: '#2a8ad0', eyeShape: 'soft', mouth: 'smile',
    outfit: { type: 'shrine', main: '#ffffff', sub: '#3a8ad8', trim: '#9fdcff' },
    head: 'droppin', weapon: 'waterorb',
  },
  popo: {
    skin: '#f0c0a0', hair: ['#e08a3a', '#a0521a'], hairStyle: 'short', bangs: 'short', eyes: '#3a2a1a', eyeShape: 'dot', mouth: 'grin', beard: '#e08a3a',
    outfit: { type: 'leather', main: '#a0482a', sub: '#4a3a2a', trim: '#ffb040' },
    head: 'cap', weapon: 'crossbow',
  },
  // ---------- ★3 追加分 ----------
  lux: {
    skin: '#ffe6d6', hair: ['#fff0a8', '#d8b040'], hairStyle: 'short', bangs: 'side', eyes: '#3a8ad0', eyeShape: 'normal', mouth: 'smile',
    outfit: { type: 'leather', main: '#f4f0e0', sub: '#c8a040', trim: '#e8d8a0' },
    head: 'none', weapon: 'bow',
  },
  pico: {
    skin: '#ffe8da', hair: ['#ffd88a', '#c89a3a'], hairStyle: 'short', bangs: 'round', eyes: '#e0a020', eyeShape: 'soft', mouth: 'open',
    outfit: { type: 'robe', main: '#f8f4ff', sub: '#e0c060', trim: '#c8c8e0' },
    head: 'witchhat', weapon: 'crossstaff',
  },
  emil: {
    skin: '#ffe6d6', hair: ['#ffe08a', '#c89a2a'], hairStyle: 'ponytail', bangs: 'messy', eyes: '#3a7ad0', eyeShape: 'normal', mouth: 'grin',
    outfit: { type: 'armor', main: '#dfe6f0', sub: '#4a6ab0', trim: '#b8c4d8', skirt: true },
    head: 'none', weapon: 'holysword',
  },
  bold: {
    skin: '#e8b898', hair: ['#9a7a4a', '#6a4a2a'], hairStyle: 'short', bangs: 'short', eyes: '#4a6a3a', eyeShape: 'dot', mouth: 'grin', beard: '#8a6a3a',
    outfit: { type: 'leather', main: '#6a9a4a', sub: '#5a4a2a', trim: '#c8b88a' },
    head: 'cap', weapon: 'roundshield',
  },
  soyo: {
    skin: '#fff0e6', hair: ['#a8f0c8', '#3aa878'], hairStyle: 'braids', bangs: 'round', eyes: '#2aa878', eyeShape: 'soft', mouth: 'open',
    outfit: { type: 'gown', main: '#e8fff0', sub: '#3aa878', trim: '#b8f0d0' },
    head: 'featherband', weapon: 'waterorb',
  },
  hayate: {
    skin: '#f6d2b8', hair: ['#4ad8b0', '#1a8a6a'], hairStyle: 'spiky', bangs: 'spiky', eyes: '#2a8a5a', eyeShape: 'normal', mouth: 'grin',
    outfit: { type: 'fighter', main: '#4ab88a', sub: '#2a3a3a', trim: '#e8e8e8' },
    head: 'headband', weapon: 'katana',
  },
  mint: {
    skin: '#ffe6d6', hair: ['#9ae07a', '#4a9a3a'], hairStyle: 'bob', bangs: 'round', eyes: '#3a9a5a', eyeShape: 'soft', mouth: 'smile',
    outfit: { type: 'leather', main: '#4a8a4a', sub: '#6a4a2a', trim: '#c8e0b0' },
    head: 'hood', hoodColor: '#5aa04a', weapon: 'bow',
  },
  kagerou: {
    skin: '#f2dcd0', hair: ['#4a3a5a', '#1a1428'], hairStyle: 'short', bangs: 'messy', eyes: '#a050e0', eyeShape: 'sharp', mouth: 'none',
    outfit: { type: 'coat', main: '#2a2a3a', sub: '#4a2a6a', trim: '#8a8aa0' },
    head: 'mask', weapon: 'katana',
  },
  glen: {
    skin: '#d8a888', hair: ['#4a4a5a', '#2a2a3a'], hairStyle: 'short', bangs: 'short', eyes: '#8a4ac8', eyeShape: 'sharp', mouth: 'neutral', beard: '#3a3a4a',
    outfit: { type: 'heavy', main: '#5a5a6a', sub: '#2a2a3a', trim: '#8a8aa0' },
    head: 'helmet', weapon: 'towershield',
  },
  luna: {
    skin: '#f8e6e0', hair: ['#c0a0f0', '#6a4aa8'], hairStyle: 'long', bangs: 'side', eyes: '#8a5ad8', eyeShape: 'cool', mouth: 'neutral',
    outfit: { type: 'coat', main: '#3a2a5a', sub: '#6a4aa8', trim: '#c8b8e8' },
    head: 'hood', hoodColor: '#2a2048', weapon: 'crossbow',
  },
  viola: {
    skin: '#fff0ea', hair: ['#c060d0', '#7a2a8a'], hairStyle: 'bob', bangs: 'hime', eyes: '#d040a0', eyeShape: 'cool', mouth: 'smirk',
    outfit: { type: 'robe', main: '#4a2a5a', sub: '#c060d0', trim: '#e0b0f0' },
    head: 'witchhat', weapon: 'book',
  },
  shion: {
    skin: '#f8dcc8', hair: ['#5a9ae0', '#2a5aa0'], hairStyle: 'short', bangs: 'side', eyes: '#2a6ab0', eyeShape: 'normal', mouth: 'smile',
    outfit: { type: 'coat', main: '#e8f4ff', sub: '#2a6ab0', trim: '#9fd0ff' },
    head: 'goggles', weapon: 'waterorb',
  },
  garo: {
    skin: '#e8b898', hair: ['#e04a2a', '#902010'], hairStyle: 'wild', bangs: 'messy', eyes: '#e08a20', eyeShape: 'sharp', mouth: 'grin', beard: '#c03a1a',
    outfit: { type: 'fighter', main: '#a83a1a', sub: '#3a2a2a', trim: '#e8c080' },
    head: 'headband', weapon: 'katana',
  },
};

(function () {
  let uidSeq = 0;
  const VIEW = { full: '0 0 200 260', bust: '38 30 124 124' };

  // 色を明るく/暗くする
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // ---------- 豪華演出（★4/★5） ----------
  function auraBack(a, r, u, anim) {
    if (r < 4) return '';
    const c = a.aura || TD.ELEMENTS[a.el].color;
    let s = `<radialGradient id="au${u}" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="${c}" stop-opacity="${r === 5 ? .85 : .45}"/><stop offset=".6" stop-color="${c}" stop-opacity="${r === 5 ? .3 : .12}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
    let g = `<circle cx="100" cy="120" r="${r === 5 ? 118 : 96}" fill="url(#au${u})"/>`;
    if (r === 5) {
      // 回転する光条
      let rays = '';
      for (let i = 0; i < 12; i++) rays += `<path d="M100 120 L${100 + Math.cos(i * Math.PI / 6 - .06) * 140} ${120 + Math.sin(i * Math.PI / 6 - .06) * 140} L${100 + Math.cos(i * Math.PI / 6 + .06) * 140} ${120 + Math.sin(i * Math.PI / 6 + .06) * 140}Z"/>`;
      g += `<g fill="${c}" opacity=".28">${rays}${anim ? '<animateTransform attributeName="transform" type="rotate" from="0 100 120" to="360 100 120" dur="24s" repeatCount="indefinite"/>' : ''}</g>`;
      g += `<circle cx="100" cy="120" r="104" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="3 7" opacity=".7"/>`;
      g += `<circle cx="100" cy="120" r="92" fill="none" stroke="#fff" stroke-width=".8" opacity=".5"/>`;
    }
    return { defs: s, g };
  }

  function particles(a, r, anim) {
    if (r < 5) return '';
    const pts = [[34, 60], [168, 52], [24, 150], [176, 140], [52, 214], [154, 222], [148, 30], [44, 110]];
    let s = '';
    pts.forEach(([x, y], i) => {
      const an = anim ? `<animate attributeName="opacity" values="0;1;0" dur="${2 + (i % 3) * .7}s" begin="${i * .35}s" repeatCount="indefinite"/>` : '';
      if (a.particles === 'feather') s += `<g transform="translate(${x} ${y}) rotate(${i * 40})" opacity=".9"><path d="M0 -9 Q6 -2 0 9 Q-6 -2 0 -9Z" fill="#fff"/><path d="M0 -8 L0 8" stroke="#f2c94c" stroke-width=".8"/>${an}</g>`;
      else if (a.particles === 'ice') s += `<g transform="translate(${x} ${y}) rotate(${i * 25})"><path d="M0 -8 L4 0 L0 8 L-4 0Z" fill="#dff6ff" stroke="#7fdcff" stroke-width=".8"/>${an}</g>`;
      else s += `<g transform="translate(${x} ${y}) rotate(${i * 50})"><path d="M0 -7 Q7 0 0 7 Q-3 0 0 -7Z" fill="#8affc0" stroke="#1d6a4a" stroke-width=".6"/>${an}</g>`;
    });
    // きらめき
    [[60, 40], [140, 96], [30, 190], [170, 190]].forEach(([x, y], i) => {
      s += `<path d="M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 6} L${x - 1.5} ${y + 1.5} L${x - 6} ${y} L${x - 1.5} ${y - 1.5}Z" fill="#fff">${anim ? `<animate attributeName="opacity" values="1;.1;1" dur="1.6s" begin="${i * .4}s" repeatCount="indefinite"/>` : ''}</path>`;
    });
    return s;
  }

  function cape(a, r) {
    if (!a.cape || r < 5) return '';
    const [c1, c2] = a.cape;
    return `<path d="M70 134 Q40 190 46 246 Q100 236 154 246 Q160 190 130 134Z" fill="${c2}"/>` +
      `<path d="M72 134 Q48 188 54 240 Q100 230 146 240 Q152 188 128 134Z" fill="${c1}"/>` +
      `<path d="M54 240 Q100 230 146 240" fill="none" stroke="#f2c94c" stroke-width="3"/>` +
      `<path d="M58 228 Q100 220 142 228" fill="none" stroke="#f2c94c" stroke-width="1" stroke-dasharray="2 3"/>`;
  }

  // ---------- 髪 ----------
  function hairBack(a) {
    const [h, hd] = a.hair;
    switch (a.hairStyle) {
      case 'long': return `<path d="M58 84 Q46 160 60 214 Q80 222 100 214 Q120 222 140 214 Q154 160 142 84Z" fill="${hd}"/><path d="M62 86 Q52 158 66 206 L134 206 Q148 158 138 86Z" fill="${h}"/>`;
      case 'ponytail': return `<path d="M128 70 Q172 66 168 120 Q164 160 150 178 Q156 140 146 108 Q140 86 124 84Z" fill="${hd}"/><path d="M128 72 Q166 70 162 118 Q158 150 150 166 Q152 136 144 108Z" fill="${h}"/><circle cx="132" cy="70" r="6" fill="#f2c94c"/>`;
      case 'braids': return [-1, 1].map(sd => `<g>${[0, 1, 2, 3].map(i => `<ellipse cx="${100 + sd * 44}" cy="${128 + i * 16}" rx="${9 - i}" ry="9" fill="${i % 2 ? hd : h}"/>`).join('')}<circle cx="${100 + sd * 44}" cy="${190}" r="5" fill="#9fdcff"/></g>`).join('');
      case 'bob': return `<path d="M58 84 Q52 128 64 140 L136 140 Q148 128 142 84Z" fill="${hd}"/>`;
      case 'wild': return `<path d="M60 80 Q40 120 54 150 L64 132 Q60 160 74 168 L80 140 L120 140 L126 168 Q140 160 136 132 L146 150 Q160 120 140 80Z" fill="${hd}"/>`;
      default: return `<path d="M60 86 Q56 118 64 128 L136 128 Q144 118 140 86Z" fill="${hd}"/>`;
    }
  }

  function hairFront(a) {
    const [h, hd] = a.hair;
    const hl = `<path d="M74 62 Q100 48 128 60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>`;
    const top = `<path d="M58 96 Q54 50 100 48 Q146 50 142 96 Q136 72 100 70 Q64 72 58 96Z" fill="${h}"/>`;
    let bangs;
    switch (a.bangs) {
      case 'hime': bangs = `<path d="M62 90 Q60 64 100 60 Q140 64 138 90 L138 82 L62 82Z" fill="${h}"/><path d="M62 82 L138 82 L138 88 L62 88Z" fill="${h}"/><path d="M60 88 Q56 120 62 142 L70 140 Q66 116 68 90Z" fill="${h}"/><path d="M140 88 Q144 120 138 142 L130 140 Q134 116 132 90Z" fill="${h}"/>`; break;
      case 'side': bangs = `<path d="M60 96 Q58 60 104 58 Q142 62 140 96 Q120 74 96 92 Q84 78 70 96Z" fill="${h}"/><path d="M60 90 Q54 126 62 150 L70 148 Q66 120 68 92Z" fill="${h}"/><path d="M140 90 Q146 126 138 150 L130 148 Q134 120 132 92Z" fill="${h}"/>`; break;
      case 'spiky': bangs = `<path d="M58 94 L52 60 L70 66 L72 44 L88 58 L100 36 L112 58 L128 44 L130 66 L148 60 L142 94 L132 80 L124 92 L114 76 L104 90 L94 76 L84 90 L74 78 L66 92Z" fill="${h}"/>`; break;
      case 'messy': bangs = `<path d="M58 94 Q56 58 100 54 Q144 58 142 94 L134 80 L128 92 L118 74 L108 90 L98 72 L88 88 L78 74 L70 90 L64 80Z" fill="${h}"/>`; break;
      case 'covereye': bangs = `<path d="M58 94 Q56 56 104 54 Q144 58 142 94 L136 84 L126 92 L118 80 L112 92 Q100 112 78 124 Q86 100 74 84 L64 92Z" fill="${h}"/><path d="M80 120 Q96 104 104 84" fill="none" stroke="${hd}" stroke-width="1.5"/>`; break;
      case 'round': bangs = `<path d="M60 92 Q58 60 100 58 Q142 60 140 92 Q132 82 120 86 Q110 78 100 86 Q90 78 80 86 Q68 82 60 92Z" fill="${h}"/>`; break;
      default: bangs = `<path d="M60 88 Q58 60 100 58 Q142 60 140 88 Q120 76 100 80 Q80 76 60 88Z" fill="${h}"/>`;
    }
    const shadow = `<path d="M64 88 Q100 80 136 88" fill="none" stroke="${hd}" stroke-width="2" opacity=".5"/>`;
    return top + bangs + shadow + hl;
  }

  // ---------- 顔 ----------
  function face(a, u) {
    const sk = a.skin, e = a.eyes;
    let s = `<ellipse cx="100" cy="96" rx="39" ry="36" fill="${sk}"/>`;
    s += `<path d="M64 104 Q72 128 100 132 Q128 128 136 104" fill="${sk}"/>`;
    // 目
    const eye = (x, flip) => {
      if (a.eyeShape === 'dot') return `<ellipse cx="${x}" cy="102" rx="3.2" ry="4.2" fill="${e}"/><circle cx="${x + 1}" cy="100.5" r="1.1" fill="#fff"/>`;
      const ry = a.eyeShape === 'sharp' ? 7.5 : a.eyeShape === 'cool' ? 8.5 : a.eyeShape === 'soft' ? 10 : 9.5;
      const tilt = a.eyeShape === 'sharp' ? 3 : a.eyeShape === 'cool' ? 1.5 : 0;
      const lx1 = x - 9, lx2 = x + 9;
      const inner = flip ? lx1 : lx2, outer = flip ? lx2 : lx1;
      let g = `<ellipse cx="${x}" cy="102" rx="7.2" ry="${ry}" fill="#fff"/>`;
      g += `<ellipse cx="${x}" cy="102.5" rx="6.6" ry="${ry - .6}" fill="url(#iris${u})"/>`;
      g += `<ellipse cx="${x}" cy="103.5" rx="3.2" ry="${ry * .5}" fill="${shade(e, -.6)}"/>`;
      g += `<circle cx="${x + 2.4}" cy="${98.5 - ry * .2}" r="2.6" fill="#fff"/><circle cx="${x - 2.2}" cy="${105 + ry * .1}" r="1.2" fill="#fff"/>`;
      g += `<path d="M${outer} ${101 - ry + 2 - tilt} Q${x} ${101 - ry - 3} ${inner} ${101 - ry + 2 + tilt}" fill="none" stroke="#2a1a1a" stroke-width="2.6" stroke-linecap="round"/>`;
      g += `<path d="M${outer} ${101 - ry + 2 - tilt} l${flip ? 3 : -3} -2" stroke="#2a1a1a" stroke-width="2" stroke-linecap="round"/>`;
      return g;
    };
    s += eye(84, false) + eye(116, true);
    // 眉
    const by = a.eyeShape === 'sharp' ? 86 : 84, bt = a.eyeShape === 'sharp' ? 3 : 0;
    s += `<path d="M77 ${by + bt} Q84 ${by - 3} 91 ${by}" fill="none" stroke="${shade(a.hair[1], -.3)}" stroke-width="1.8" stroke-linecap="round"/>`;
    s += `<path d="M109 ${by} Q116 ${by - 3} 123 ${by + bt}" fill="none" stroke="${shade(a.hair[1], -.3)}" stroke-width="1.8" stroke-linecap="round"/>`;
    // 頬
    s += `<ellipse cx="76" cy="113" rx="6" ry="3.2" fill="#ff8a9a" opacity=".38"/><ellipse cx="124" cy="113" rx="6" ry="3.2" fill="#ff8a9a" opacity=".38"/>`;
    if (a.freckles) s += `<g fill="#c8805a" opacity=".6"><circle cx="74" cy="112" r=".9"/><circle cx="78" cy="114" r=".9"/><circle cx="122" cy="112" r=".9"/><circle cx="126" cy="114" r=".9"/></g>`;
    // 口
    switch (a.mouth) {
      case 'smile': s += `<path d="M94 118 Q100 123 106 118" fill="none" stroke="#a04a4a" stroke-width="2" stroke-linecap="round"/>`; break;
      case 'grin': s += `<path d="M92 116 Q100 126 108 116Z" fill="#a03a3a"/><path d="M93 116.5 L107 116.5" stroke="#fff" stroke-width="1.6"/>`; break;
      case 'open': s += `<ellipse cx="100" cy="119" rx="3.6" ry="3" fill="#a03a3a"/><ellipse cx="100" cy="120.5" rx="2" ry="1.2" fill="#ff8a8a"/>`; break;
      case 'smirk': s += `<path d="M94 119 Q101 121 107 116" fill="none" stroke="#a04a4a" stroke-width="2" stroke-linecap="round"/>`; break;
      case 'neutral': s += `<path d="M96 119 L104 119" stroke="#a04a4a" stroke-width="2" stroke-linecap="round"/>`; break;
    }
    if (a.beard) s += `<path d="M70 112 Q72 140 100 146 Q128 140 130 112 Q118 126 100 126 Q82 126 70 112Z" fill="${a.beard}"/><path d="M92 118 Q100 114 108 118" fill="none" stroke="${shade(a.beard, -.3)}" stroke-width="3" stroke-linecap="round"/>`;
    return s;
  }

  // ---------- 頭飾り ----------
  function headwear(a, r, u, back) {
    const t = r >= 4 ? (a.outfit.trim || '#f2c94c') : '#c8c8c8';
    switch (a.head) {
      case 'tiara':
        if (back) return '';
        return `<path d="M68 70 Q100 56 132 70" fill="none" stroke="#f2c94c" stroke-width="5"/>` +
          `<path d="M84 64 L88 50 L94 62 L100 42 L106 62 L112 50 L116 64Z" fill="url(#gold${u})" stroke="#a8740a" stroke-width="1"/>` +
          `<path d="M100 46 L104 54 L100 62 L96 54Z" fill="#4ab0ff" stroke="#fff" stroke-width="1"/><circle cx="88" cy="52" r="2" fill="#ff5a8a"/><circle cx="112" cy="52" r="2" fill="#ff5a8a"/>`;
      case 'icecrown':
        if (back) return '';
        return [[78, 60, -20, 18], [90, 52, -8, 24], [100, 48, 0, 30], [110, 52, 8, 24], [122, 60, 20, 18]].map(([x, y, rot, hgt]) =>
          `<path transform="rotate(${rot} ${x} ${y + hgt / 2})" d="M${x} ${y - hgt / 2} L${x + 5} ${y + hgt / 2} L${x - 5} ${y + hgt / 2}Z" fill="url(#ice${u})" stroke="#fff" stroke-width="1"/>`).join('') +
          `<path d="M70 70 Q100 58 130 70" fill="none" stroke="#dff6ff" stroke-width="3"/><circle cx="100" cy="62" r="3.5" fill="#fff"/>`;
      case 'featherband':
        if (back) return '';
        return `<path d="M60 78 Q100 64 140 78" fill="none" stroke="#2f9a6a" stroke-width="5"/><path d="M60 78 Q100 64 140 78" fill="none" stroke="#f2c94c" stroke-width="1.5"/>` +
          `<circle cx="100" cy="70" r="4.5" fill="#8affc0" stroke="#f2c94c" stroke-width="1.5"/>` +
          `<path d="M142 74 Q170 50 166 22 Q156 46 140 68Z" fill="#fff" stroke="#3fbf8a" stroke-width="1.2"/><path d="M144 76 Q176 66 182 40 Q164 58 142 72Z" fill="#8affc0" stroke="#1d6a4a" stroke-width="1"/>`;
      case 'hood':
        if (back) return `<path d="M50 96 Q46 40 100 36 Q154 40 150 96 L150 140 L50 140Z" fill="${shade(a.hoodColor, -.25)}"/>`;
        return `<path d="M54 100 Q50 44 100 40 Q150 44 146 100 Q140 60 100 58 Q60 60 54 100Z" fill="${a.hoodColor}"/><path d="M58 96 Q60 62 100 60" fill="none" stroke="${t}" stroke-width="1.5" opacity=".7"/>`;
      case 'helmet':
        if (back) return '';
        return `<path d="M58 84 Q58 42 100 40 Q142 42 142 84 L136 84 Q134 58 100 56 Q66 58 64 84Z" fill="url(#metal${u})" stroke="#5a4010" stroke-width="1.2"/>` +
          `<path d="M60 82 L140 82" stroke="${t}" stroke-width="4"/><path d="M100 40 L100 82" stroke="${t}" stroke-width="3"/><circle cx="100" cy="48" r="3" fill="#ff6a3a"/>`;
      case 'mask':
        if (back) return '';
        return `<path d="M66 110 Q100 124 134 110 L132 128 Q100 144 68 128Z" fill="#1d1828"/><path d="M68 112 Q100 126 132 112" fill="none" stroke="#6a3aa8" stroke-width="1.5"/>` +
          `<path d="M132 120 Q152 130 160 152 Q146 140 130 128Z" fill="#1d1828"/>`;
      case 'headband':
        if (back) return `<path d="M136 74 Q156 80 168 98 L160 102 Q150 88 134 82Z" fill="#d02a1a"/><path d="M136 78 Q150 92 152 114 L145 112 Q144 96 132 84Z" fill="#a01a10"/>`;
        return `<path d="M60 80 Q100 66 140 80 L140 87 Q100 74 60 87Z" fill="#d02a1a"/><path d="M60 83 Q100 70 140 83" fill="none" stroke="${t}" stroke-width="1"/>`;
      case 'witchhat':
        if (back) return '';
        return `<ellipse cx="100" cy="64" rx="56" ry="11" fill="#2a1a48"/><path d="M68 64 Q78 30 98 12 Q118 -4 136 6 Q116 12 112 30 Q124 50 132 64Z" fill="#3a2460"/>` +
          `<path d="M70 60 Q100 68 130 60 L131 66 Q100 74 69 66Z" fill="#a070e0"/><path d="M118 46 a7 7 0 1 0 6 10 a5.5 5.5 0 1 1 -6 -10Z" fill="#ffe066"/>` +
          `<circle cx="134" cy="6" r="3" fill="#d8c0ff"/>`;
      case 'veil':
        if (back) return `<path d="M54 80 Q46 150 60 186 L140 186 Q154 150 146 80 Q100 56 54 80Z" fill="#f4f4ff"/><path d="M60 186 L140 186" stroke="#3a4a8a" stroke-width="3"/>`;
        return `<path d="M58 84 Q100 58 142 84 L142 76 Q100 50 58 76Z" fill="#fff" stroke="#c8d0e8" stroke-width="1"/><path d="M58 80 Q100 56 142 80" fill="none" stroke="#3a4a8a" stroke-width="2.5"/>` +
          `<path d="M97 58 h6 v6 h6 v5 h-6 v8 h-6 v-8 h-6 v-5 h6Z" fill="#f2c94c" stroke="#a8740a" stroke-width=".6"/>`;
      case 'goggles':
        if (back) return '';
        return `<path d="M58 72 Q100 58 142 72" fill="none" stroke="#5a3a2a" stroke-width="5"/>` +
          [84, 116].map(x => `<circle cx="${x}" cy="66" r="10" fill="#6a4a3a" stroke="#c8a060" stroke-width="2"/><circle cx="${x}" cy="66" r="7" fill="#ffb040" opacity=".85"/><circle cx="${x - 2}" cy="63" r="2.2" fill="#fff"/>`).join('');
      case 'cap':
        if (back) return '';
        return `<path d="M60 76 Q60 40 100 40 Q140 40 140 76Z" fill="#8a2a1a"/><path d="M58 76 L142 76 L148 82 L54 82Z" fill="#4a3a2a"/><circle cx="100" cy="42" r="4" fill="#ffb040"/>`;
      case 'droppin':
        if (back) return '';
        // しずく形の髪飾り（こめかみ）
        return [64, 136].map(x => `<path d="M${x} 80 Q${x + 6} 90 ${x} 95 Q${x - 6} 90 ${x} 80Z" fill="#7ad8ff" stroke="#fff" stroke-width="1"/><circle cx="${x - 1.5}" cy="89" r="1.4" fill="#fff"/>`).join('');
      default: return '';
    }
  }

  // ---------- 体 ----------
  function body(a, r, u) {
    const o = a.outfit, sk = a.skin;
    const trim = r >= 4 ? o.trim : shade(o.main, -.2);
    let s = '';
    const long = ['gown', 'robe', 'priest', 'shrine'].includes(o.type);
    // 脚
    if (!long) {
      s += `<rect x="83" y="190" width="13" height="40" rx="5" fill="${o.sub}"/><rect x="104" y="190" width="13" height="40" rx="5" fill="${o.sub}"/>`;
      s += `<path d="M80 224 h18 v14 q-9 4 -20 0Z" fill="${shade(o.sub, -.35)}"/><path d="M102 224 h18 v14 q-11 4 -20 0Z" fill="${shade(o.sub, -.35)}"/>`;
    } else {
      s += `<rect x="86" y="226" width="12" height="12" rx="4" fill="${shade(o.sub, -.3)}"/><rect x="102" y="226" width="12" height="12" rx="4" fill="${shade(o.sub, -.3)}"/>`;
    }
    // 首
    s += `<rect x="93" y="122" width="14" height="14" fill="${shade(sk, -.08)}"/>`;
    // 胴体
    if (long) {
      s += `<path d="M72 142 Q72 130 88 128 L112 128 Q128 130 128 142 L136 230 Q100 240 64 230Z" fill="url(#cloth${u})"/>`;
      s += `<path d="M64 230 Q100 240 136 230" fill="none" stroke="${trim}" stroke-width="${r >= 4 ? 3 : 2}"/>`;
      s += `<path d="M100 132 L100 230" stroke="${o.sub}" stroke-width="${o.type === 'priest' ? 10 : 4}" opacity=".9"/>`;
      if (o.type === 'gown') s += `<path d="M70 200 Q100 210 130 200" fill="none" stroke="${o.trim}" stroke-width="1.5" opacity=".8"/><path d="M90 180 l4 8 l-4 8 l-4 -8Z M110 186 l3 6 l-3 6 l-3 -6Z" fill="#dff6ff"/>`;
      if (o.type === 'shrine') s += `<path d="M76 168 L124 168 L130 230 Q100 236 70 230Z" fill="${o.sub}"/>`;
      if (o.type === 'priest') s += `<path d="M95 150 h10 v8 h8 v8 h-8 v16 h-10 v-16 h-8 v-8 h8Z" fill="${r >= 4 ? '#f2c94c' : '#fff'}" opacity=".95"/>`;
    } else {
      s += `<path d="M72 142 Q72 130 88 128 L112 128 Q128 130 128 142 L126 194 L74 194Z" fill="url(#cloth${u})"/>`;
      if (o.skirt) s += `<path d="M74 184 L62 222 Q100 230 138 222 L126 184Z" fill="${o.sub}"/><path d="M62 222 Q100 230 138 222" fill="none" stroke="${trim}" stroke-width="3"/>`;
      s += `<path d="M74 190 L126 190" stroke="${o.sub}" stroke-width="6"/><rect x="95" y="186" width="10" height="9" rx="2" fill="${trim}"/>`;
      if (o.type === 'coat') s += `<path d="M76 150 L66 214 L84 214 L90 150Z M124 150 L134 214 L116 214 L110 150Z" fill="${o.sub}"/><path d="M100 132 L100 190" stroke="${trim}" stroke-width="2"/>`;
      if (o.type === 'leather') s += `<path d="M74 140 L126 180" stroke="${shade(o.sub, -.2)}" stroke-width="6"/>`;
      if (o.type === 'fighter') s += `<path d="M84 132 L100 160 L116 132" fill="none" stroke="${o.sub}" stroke-width="5"/>`;
    }
    // 鎧パーツ
    if (o.type === 'armor' || o.type === 'heavy') {
      s += `<path d="M80 136 Q100 128 120 136 L118 170 Q100 180 82 170Z" fill="url(#metal${u})" stroke="${trim}" stroke-width="${r >= 4 ? 2 : 1}"/>`;
      if (r >= 5) s += `<path d="M100 142 L106 152 L100 162 L94 152Z" fill="#4ab0ff" stroke="#fff" stroke-width="1"/><path d="M86 148 Q100 140 114 148" fill="none" stroke="#f2c94c" stroke-width="1.5"/>`;
    }
    // 襟・縁取り（★4以上は金縁）
    s += `<path d="M86 130 L100 142 L114 130" fill="none" stroke="${trim}" stroke-width="${r >= 4 ? 3 : 2}" stroke-linejoin="round"/>`;
    if (r >= 4) s += `<circle cx="100" cy="143" r="${r === 5 ? 4 : 3}" fill="${r === 5 ? '#ff5a8a' : o.trim}" stroke="#fff" stroke-width="1"/>`;
    // 肩当て
    const pad = o.type === 'heavy' ? 17 : o.type === 'armor' ? 13 : 0;
    if (pad) [70, 130].forEach(x => { s += `<ellipse cx="${x}" cy="138" rx="${pad}" ry="${pad * .7}" fill="url(#metal${u})" stroke="${trim}" stroke-width="2"/>`; });
    else if (r >= 5) [72, 128].forEach(x => { s += `<ellipse cx="${x}" cy="136" rx="11" ry="7" fill="${o.sub}" stroke="#f2c94c" stroke-width="2"/>`; });
    return s;
  }

  function arms(a, r) {
    const o = a.outfit, sleeve = o.type === 'armor' || o.type === 'heavy' ? '#9aa4b4' : o.main;
    let s = `<path d="M74 142 Q64 162 64 182" fill="none" stroke="${shade(sleeve, -.1)}" stroke-width="13" stroke-linecap="round"/>`;
    s += `<path d="M126 142 Q136 162 138 180" fill="none" stroke="${shade(sleeve, -.1)}" stroke-width="13" stroke-linecap="round"/>`;
    if (r >= 4) s += `<path d="M59 176 L70 178 M132 175 L143 177" stroke="${o.trim}" stroke-width="3" stroke-linecap="round"/>`;
    s += `<circle cx="64" cy="186" r="6.5" fill="${a.skin}"/><circle cx="138" cy="184" r="6.5" fill="${a.skin}"/>`;
    return s;
  }

  // ---------- 武器 ----------
  function weapon(a, r, u, anim) {
    const glow = (c, rad) => r >= 5 ? `<circle cx="0" cy="0" r="${rad}" fill="${c}" opacity=".35">${anim ? `<animate attributeName="opacity" values=".2;.5;.2" dur="1.8s" repeatCount="indefinite"/>` : ''}</circle>` : '';
    switch (a.weapon) {
      case 'holysword':
        return `<g transform="translate(138 182) rotate(20)"><path d="M-6 -120 L0 -132 L6 -120 L6 -14 L-6 -14Z" fill="url(#blade${u})" stroke="#fff" stroke-width="1.5"/>` +
          `<path d="M0 -126 L0 -20" stroke="#fff" stroke-width="1.2" opacity=".8"/>` +
          `<path d="M-20 -14 Q0 -24 20 -14 L18 -8 Q0 -16 -18 -8Z" fill="url(#gold${u})" stroke="#a8740a"/>` +
          `<circle cx="0" cy="-14" r="4.5" fill="#4ab0ff" stroke="#fff" stroke-width="1"/><rect x="-3.5" y="-8" width="7" height="20" rx="2" fill="#7a4a1a"/><circle cx="0" cy="14" r="4" fill="url(#gold${u})"/>` +
          `<g transform="translate(0 -70)">${glow('#fff6c0', 26)}</g></g>`;
      case 'icestaff':
        return `<g transform="translate(150 150)"><rect x="-3" y="-60" width="6" height="140" rx="3" fill="#6a8ac8"/><path d="M-3 -40 h6 M-3 0 h6" stroke="#fff" stroke-width="1"/>` +
          `<g transform="translate(0 -74)">${glow('#bff3ff', 30)}<path d="M0 -24 L10 0 L0 18 L-10 0Z" fill="url(#ice${u})" stroke="#fff" stroke-width="1.5"/>` +
          `<path d="M-14 -6 L-8 2 L-14 10 L-18 2Z M14 -6 L18 2 L14 10 L8 2Z" fill="#dff6ff" stroke="#7fdcff"/></g></g>`;
      case 'greatbow':
        return `<g transform="translate(152 150)"><path d="M0 -84 Q46 0 0 84" fill="none" stroke="url(#gold${u})" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M0 -84 Q46 0 0 84" fill="none" stroke="#3fbf8a" stroke-width="2"/><path d="M0 -84 L0 84" stroke="#fff" stroke-width="1"/>` +
          `<circle cx="22" cy="0" r="6" fill="#8affc0" stroke="#f2c94c" stroke-width="2"/><path d="M0 -84 l-8 -8 M0 84 l-8 8" stroke="#3fbf8a" stroke-width="3"/>` +
          `<g transform="translate(22 0)">${glow('#8affc0', 24)}</g></g>`;
      case 'bow':
        return `<g transform="translate(150 160)"><path d="M0 -56 Q30 0 0 56" fill="none" stroke="#8a5a2a" stroke-width="5" stroke-linecap="round"/><path d="M0 -56 L0 56" stroke="#e8e0d0" stroke-width="1"/>` +
          (r >= 4 ? `<circle cx="14" cy="0" r="4" fill="#5fd68a" stroke="#d8dde6" stroke-width="1.5"/>` : '') + `</g>`;
      case 'crossbow':
        return `<g transform="translate(140 186)"><rect x="-4" y="-30" width="8" height="40" rx="2" fill="#6a4a2a"/><path d="M-26 -22 Q0 -34 26 -22" fill="none" stroke="#5a5a5a" stroke-width="5"/><path d="M-26 -22 L26 -22" stroke="#ddd" stroke-width="1"/><path d="M0 -40 L0 -14" stroke="#c8c8c8" stroke-width="2"/></g>`;
      case 'towershield':
        return `<g transform="translate(66 186)"><path d="M-26 -44 L26 -44 L26 10 Q0 40 -26 10Z" fill="url(#metal${u})" stroke="${r >= 4 ? a.outfit.trim : '#5a4010'}" stroke-width="3"/>` +
          `<path d="M0 -36 L0 22 M-18 -12 L18 -12" stroke="#6a4a1a" stroke-width="5"/>` + (r >= 4 ? `<circle cx="0" cy="-12" r="6" fill="#d4a94a" stroke="#fff" stroke-width="1.5"/>` : '') + `</g>`;
      case 'roundshield':
        return `<g transform="translate(66 186)"><circle r="20" fill="#8a96aa" stroke="#2f5a9a" stroke-width="3"/><circle r="6" fill="#7ad8ff"/></g>`;
      case 'katana':
        return `<g transform="translate(138 182) rotate(26)"><path d="M-2.5 -110 Q4 -60 3 -12 L-3 -12 Q-2 -60 -2.5 -110Z" fill="url(#blade${u})" stroke="#c0c8d8" stroke-width=".8"/>` +
          `<ellipse cx="0" cy="-12" rx="8" ry="3" fill="#2a2438" stroke="#c0c8d8"/><rect x="-3" y="-10" width="6" height="22" rx="2" fill="#6a3aa8"/>` +
          (r >= 4 ? `<path d="M-3 -6 L3 -2 M-3 2 L3 6" stroke="#c0c8d8" stroke-width="1"/>` : '') + `</g>`;
      case 'gauntlet':
        return [[64, 186], [138, 184]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="12" fill="#c8402a" stroke="#f2c94c" stroke-width="${r >= 4 ? 2.5 : 1}"/><path d="M-8 -4 h16 M-8 2 h16" stroke="#7a1a10" stroke-width="2"/>` +
          `<path d="M-6 -12 Q0 -26 4 -14 Q10 -22 8 -10Z" fill="#ffb040" opacity=".9"/></g>`).join('');
      case 'book':
        return `<g transform="translate(56 168) rotate(-12)"><path d="M0 0 L-24 -6 L-24 24 L0 30Z" fill="#2a1a48" stroke="#d8c0ff" stroke-width="1.5"/><path d="M0 0 L24 -6 L24 24 L0 30Z" fill="#3a2460" stroke="#d8c0ff" stroke-width="1.5"/>` +
          `<path d="M-18 4 h12 M-18 10 h10 M6 4 h12 M6 10 h10" stroke="#c040ff" stroke-width="1.5"/><circle cx="0" cy="-14" r="5" fill="#c040ff" opacity=".7"/>` +
          `<path d="M-6 -22 l2 4 l4 1 l-4 1 l-2 4 l-2 -4 l-4 -1 l4 -1Z" fill="#fff"/></g>`;
      case 'crossstaff':
        return `<g transform="translate(140 160)"><rect x="-2.5" y="-50" width="5" height="96" rx="2" fill="#c8a060"/><path d="M-3 -62 h6 v8 h8 v6 h-8 v10 h-6 v-10 h-8 v-6 h8Z" fill="#f2c94c" stroke="#a8740a" stroke-width=".8"/></g>`;
      case 'fireball':
        return `<g transform="translate(146 156)"><circle r="16" fill="#ff6b4a" opacity=".35"/><path d="M0 -20 Q14 -6 10 6 Q8 16 0 16 Q-10 16 -10 6 Q-12 -4 -4 -8 Q-2 -2 2 -4 Q4 -12 0 -20Z" fill="#ff8a3a"/><path d="M0 -6 Q6 2 4 8 Q0 12 -4 8 Q-4 2 0 -6Z" fill="#ffe066"/></g>`;
      case 'waterorb':
        return `<g transform="translate(144 160)"><circle r="13" fill="#7ad8ff" opacity=".85" stroke="#fff" stroke-width="1.5"/><circle cx="-4" cy="-4" r="3.5" fill="#fff" opacity=".8"/><path d="M0 -26 Q5 -18 0 -14 Q-5 -18 0 -26Z" fill="#9fdcff"/></g>`;
      default: return '';
    }
  }

  // ---------- 組み立て ----------
  // id: キャラID / view: 'full' | 'bust' / opts.anim: SVGアニメーション有効
  TD.charSVG = function (id, view = 'bust', opts = {}) {
    const a = Object.assign({ el: TD.CHARS[id].element }, TD.ART[id]);
    const r = TD.CHARS[id].rarity, u = 'c' + (++uidSeq), anim = opts.anim !== false;
    const o = a.outfit;
    const defs =
      `<linearGradient id="iris${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(a.eyes, -.5)}"/><stop offset=".55" stop-color="${a.eyes}"/><stop offset="1" stop-color="${shade(a.eyes, .5)}"/></linearGradient>` +
      `<linearGradient id="cloth${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(o.main, .15)}"/><stop offset="1" stop-color="${shade(o.main, -.18)}"/></linearGradient>` +
      `<linearGradient id="metal${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.type === 'heavy' ? '#f0d08a' : '#ffffff'}"/><stop offset=".5" stop-color="${o.type === 'heavy' ? o.main : '#c8d0dc'}"/><stop offset="1" stop-color="${o.type === 'heavy' ? o.sub : '#7a869a'}"/></linearGradient>` +
      `<linearGradient id="gold${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="#f2c94c"/><stop offset="1" stop-color="#a8740a"/></linearGradient>` +
      `<linearGradient id="blade${u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e0ecff"/><stop offset="1" stop-color="#9aaac8"/></linearGradient>` +
      `<linearGradient id="ice${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fe4ff"/><stop offset="1" stop-color="#3a8ad8"/></linearGradient>`;
    const au = auraBack(a, r, u, anim);
    const parts =
      (au ? au.g : '') +
      cape(a, r) +
      headwear(a, r, u, true) +
      hairBack(a) +
      body(a, r, u) +
      arms(a, r) +
      face(a, u) +
      hairFront(a) +
      headwear(a, r, u, false) +
      weapon(a, r, u, anim) +
      particles(a, r, anim);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW[view]}" class="char-svg r${r}"><defs>${defs}${au ? au.defs : ''}</defs>${parts}</svg>`;
  };

  // バトル（canvas）用の画像をキャッシュ
  const imgCache = {};
  TD.charImage = function (id) {
    if (imgCache[id]) return imgCache[id];
    const img = new Image(), c = TD.customArt(id);
    img.src = c ? c.src : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TD.charSVG(id, 'bust', { anim: false }));
    imgCache[id] = img;
    return img;
  };
  // canvas に顔まわりを正方形で描く
  TD.drawCharBust = function (g, id, x, y, size) {
    const img = TD.charImage(id);
    if (!img.complete || !img.naturalWidth) return;
    const c = TD.customArt(id);
    if (!c) { g.drawImage(img, x, y, size, size); return; }
    const w = img.naturalWidth, h = img.naturalHeight, s = c.face[2] * w;
    g.drawImage(img, c.face[0] * w - s / 2, c.face[1] * h - s / 2, s, s, x, y, size, size);
  };

  // HTMLで使う絵（カスタム画像があればそちら）
  TD.charArtHTML = function (id, view) {
    const c = TD.customArt(id);
    if (!c) return TD.charSVG(id, view);
    const alt = TD.CHARS[id].name;
    if (view !== 'bust') return `<img class="char-img full" src="${c.src}" alt="${alt}" loading="lazy">`;
    // 丸枠いっぱいに顔が来るよう、拡大して位置をずらす
    const [fx, fy, fs] = c.face, wPct = 100 / fs;
    const left = 50 - fx * wPct, top = 50 - fy * c.ratio * wPct;
    return `<img class="char-img bust" src="${c.src}" alt="${alt}" loading="lazy" style="width:${wPct.toFixed(1)}%;left:${left.toFixed(1)}%;top:${top.toFixed(1)}%">`;
  };
})();
