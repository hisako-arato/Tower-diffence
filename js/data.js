// ゲームデータ定義（キャラ・敵・ステージ）
// ここを書き換えるだけでキャラやステージを追加できる。
window.TD = window.TD || {};

TD.ELEMENTS = {
  fire:  { name: '火', color: '#ff6b4a', dark: '#a8321c' },
  water: { name: '水', color: '#4aa8ff', dark: '#1d5aa8' },
  wind:  { name: '風', color: '#5fd68a', dark: '#23804a' },
  earth: { name: '土', color: '#d4a94a', dark: '#7a5a1a' },
  light: { name: '光', color: '#ffe066', dark: '#b08a10' },
  dark:  { name: '闇', color: '#a77bff', dark: '#4b2a99' },
};

// 火→風→土→水→火 の循環で有利。光と闇は互いに有利。
TD.elemMult = function (atk, def) {
  const strong = { fire: 'wind', wind: 'earth', earth: 'water', water: 'fire' };
  if (strong[atk] === def) return 1.5;
  if (strong[def] === atk) return 0.75;
  if ((atk === 'light' && def === 'dark') || (atk === 'dark' && def === 'light')) return 1.5;
  return 1;
};

TD.ROLES = {
  sword:  { name: '剣士',   glyph: '剣', melee: true,  desc: '道に配置。敵を足止めして斬る' },
  shield: { name: '盾騎士', glyph: '盾', melee: true,  desc: '道に配置。多くの敵を食い止める' },
  archer: { name: '弓兵',   glyph: '弓', melee: false, desc: '草地に配置。長射程の単体攻撃' },
  mage:   { name: '魔導士', glyph: '魔', melee: false, desc: '草地に配置。範囲魔法攻撃' },
  priest: { name: '僧侶',   glyph: '癒', melee: false, desc: '草地に配置。味方を回復' },
};

// range はタイル単位。interval は攻撃間隔（秒）。
TD.CHARS = {
  lydia: {
    name: 'リディア', title: '聖剣の騎士姫', rarity: 5, element: 'light', role: 'sword',
    cost: 14, hp: 1600, atk: 130, def: 60, interval: 1.0, range: 1.3, block: 2, redeploy: 30,
    skill: { name: '天穹断', type: 'allStrike', sp: 30, mult: 4,
             desc: 'フィールド上の全ての敵に攻撃力400%の光属性ダメージ' },
    lines: { deploy: '聖剣の名にかけて！', skill: '天よ、裂けよ――天穹断！' },
  },
  celes: {
    name: 'セレス', title: '氷華の魔女', rarity: 5, element: 'water', role: 'mage',
    cost: 16, hp: 700, atk: 115, def: 10, interval: 1.8, range: 2.6, splash: 0.9, redeploy: 35,
    skill: { name: '氷華結界', type: 'freeze', sp: 35, mult: 2, radius: 2.6, dur: 4,
             desc: '周囲の敵を4秒間凍結し、攻撃力200%のダメージ' },
    lines: { deploy: '……凍える覚悟はある？', skill: '咲き誇れ、氷の華――氷華結界' },
  },
  fin: {
    name: 'フィン', title: '森の狩人', rarity: 4, element: 'wind', role: 'archer',
    cost: 10, hp: 600, atk: 72, def: 10, interval: 0.9, range: 3.6, redeploy: 25,
    skill: { name: '疾風連射', type: 'rapid', sp: 25, rate: 3, dur: 8,
             desc: '8秒間、攻撃速度が3倍になる' },
    lines: { deploy: '狙いは外さないよ', skill: '風よ、俺の矢に乗れ！疾風連射！' },
  },
  gald: {
    name: 'ガルド', title: '鉄壁の守護者', rarity: 4, element: 'earth', role: 'shield',
    cost: 15, hp: 2600, atk: 50, def: 140, interval: 1.4, range: 1.3, block: 3, redeploy: 30,
    skill: { name: '不動の誓い', type: 'guard', sp: 30, dur: 10,
             desc: '10秒間、防御2倍・ブロック数+2。HPを50%回復' },
    lines: { deploy: 'ここは一歩も通さん', skill: '我が盾は砕けぬ！不動の誓い！' },
  },
  nox: {
    name: 'ノクス', title: '影の剣士', rarity: 4, element: 'dark', role: 'sword',
    cost: 11, hp: 1100, atk: 145, def: 40, interval: 0.8, range: 1.3, block: 1, redeploy: 25,
    skill: { name: '影縫い', type: 'power', sp: 20, atk: 2.5, dur: 8,
             desc: '8秒間、攻撃力が250%になる' },
    lines: { deploy: '……斬るだけだ', skill: '影に沈め。影縫い' },
  },
  mia: {
    name: 'ミア', title: '見習い僧侶', rarity: 3, element: 'light', role: 'priest',
    cost: 9, hp: 550, atk: 85, def: 5, interval: 1.6, range: 2.6, redeploy: 20,
    skill: { name: '祝福の祈り', type: 'healAll', sp: 30, ratio: 0.4,
             desc: '全ての味方のHPを最大HPの40%回復' },
    lines: { deploy: 'が、がんばりますっ！', skill: '女神さま、みんなを守って！' },
  },
  kai: {
    name: 'カイ', title: '紅蓮の魔導士', rarity: 3, element: 'fire', role: 'mage',
    cost: 12, hp: 600, atk: 85, def: 10, interval: 2.0, range: 2.4, splash: 0.8, redeploy: 25,
    skill: { name: '爆炎陣', type: 'explosion', sp: 25, mult: 5, radius: 1.6,
             desc: '射程内の敵を中心に大爆発。攻撃力500%の範囲ダメージ' },
    lines: { deploy: '燃やし尽くしてやるぜ！', skill: 'まとめて吹き飛べ！爆炎陣！' },
  },
  zephyr: {
    name: 'ゼファー', title: '嵐を纏う射手', rarity: 5, element: 'wind', role: 'archer',
    cost: 13, hp: 750, atk: 95, def: 15, interval: 0.85, range: 3.8, redeploy: 30,
    skill: { name: '天嵐の矢雨', type: 'storm', sp: 28, mult: 3, dur: 4,
             desc: '射程内の全ての敵に攻撃力300%のダメージを与え、4秒間移動速度を半減' },
    lines: { deploy: '風が騒いでる……来るぞ', skill: '吹き荒れろ、天嵐の矢雨！' },
  },
  blaire: {
    name: 'ブレア', title: '紅蓮の拳闘士', rarity: 4, element: 'fire', role: 'sword',
    cost: 11, hp: 1200, atk: 125, def: 45, interval: 0.75, range: 1.3, block: 1, redeploy: 25,
    skill: { name: '烈火連撃', type: 'power', sp: 22, atk: 2.2, dur: 8,
             desc: '8秒間、攻撃力が220%になる' },
    lines: { deploy: 'さぁ、かかってきな！', skill: '燃え上がれ！烈火連撃！' },
  },
  rune: {
    name: 'ルーン', title: '黒書の魔導士', rarity: 4, element: 'dark', role: 'mage',
    cost: 14, hp: 650, atk: 105, def: 10, interval: 1.9, range: 2.6, splash: 0.9, redeploy: 30,
    skill: { name: '深淵の頁', type: 'explosion', sp: 28, mult: 4.5, radius: 1.8,
             desc: '射程内の敵を中心に闇の爆発。攻撃力450%の範囲ダメージ' },
    lines: { deploy: '……この頁を読むのは、何年ぶりかしら', skill: '開け、深淵の頁' },
  },
  thomas: {
    name: 'トマス', title: '見習い騎士', rarity: 3, element: 'earth', role: 'shield',
    cost: 12, hp: 1900, atk: 40, def: 110, interval: 1.4, range: 1.3, block: 2, redeploy: 25,
    skill: { name: '騎士の意地', type: 'guard', sp: 30, dur: 10,
             desc: '10秒間、防御2倍・ブロック数+2。HPを50%回復' },
    lines: { deploy: 'ぼ、僕だって騎士です！', skill: 'ここで退いたら騎士じゃない！' },
  },
  lily: {
    name: 'リリィ', title: '泉の巫女', rarity: 3, element: 'water', role: 'priest',
    cost: 9, hp: 520, atk: 80, def: 5, interval: 1.5, range: 2.6, redeploy: 20,
    skill: { name: '癒しの泉', type: 'healAll', sp: 28, ratio: 0.35,
             desc: '全ての味方のHPを最大HPの35%回復' },
    lines: { deploy: '泉の加護を、あなたに', skill: '湧き出でよ、癒しの泉' },
  },
  popo: {
    name: 'ポポ', title: 'ドワーフの石弓兵', rarity: 3, element: 'earth', role: 'archer',
    cost: 9, hp: 620, atk: 66, def: 20, interval: 1.0, range: 3.2, redeploy: 20,
    skill: { name: '連装石弓', type: 'rapid', sp: 25, rate: 2.5, dur: 8,
             desc: '8秒間、攻撃速度が2.5倍になる' },
    lines: { deploy: 'ドワーフの石弓をなめるなよ！', skill: '全弾装填、撃てーっ！' },
  },
};

// ---------- 育成 ----------
TD.GROWTH = {
  baseMaxLv: 20,      // 初期レベル上限
  lvPerLB: 10,        // 限界突破1回ごとのレベル上限アップ
  maxLB: 4,           // 限界突破の最大回数
  statPerLv: 0.02,    // 1レベルごとのHP/攻撃/防御の上昇率
  statPerLB: 0.05,    // 限界突破1回ごとの上昇率
  expCost: lv => 40 + lv * 15,                  // Lv → Lv+1 に必要な経験の書
  dupStones: { 3: 5, 4: 20, 5: 60 },            // 限界突破上限を超えた重複の変換量
};
TD.maxLv = lb => TD.GROWTH.baseMaxLv + TD.GROWTH.lvPerLB * lb;
// 育成状態を反映したキャラ定義を返す
TD.charStats = function (id, prog) {
  const d = TD.CHARS[id], p = prog || { lv: 1, lb: 0 }, G = TD.GROWTH;
  const m = 1 + (p.lv - 1) * G.statPerLv + p.lb * G.statPerLB;
  return Object.assign({}, d, { hp: Math.round(d.hp * m), atk: Math.round(d.atk * m), def: Math.round(d.def * m), lv: p.lv, lb: p.lb });
};

// ---------- 召喚 ----------
TD.GACHA = {
  single: 30,          // 魔晶石
  ten: 300,
  pity: 100,           // この回数以内に★5が出なければ確定
  rates: { 5: 0.03, 4: 0.17, 3: 0.80 },
  starterGift: 900,    // はじめての召喚士への贈り物
  banners: [
    {
      id: 'pickup-celes', name: '氷華の魔女 ピックアップ召喚', pickup: ['celes'], pickupShare: 0.5,
      desc: '★5「氷華の魔女 セレス」の出現率アップ中！', element: 'water',
    },
    {
      id: 'standard', name: '英雄召喚', pickup: [], desc: '大陸の英雄たちが召喚に応じる、常設の召喚。', element: 'light',
    },
  ],
};
// ステージ報酬の経験の書（勝利時）
TD.stageExp = st => st.exp || Math.round(300 * st.hpScale);

// speed はタイル/秒
TD.ENEMIES = {
  slime:      { name: 'スライム', element: 'water', hp: 260,  atk: 45,  def: 0,   speed: 0.55, interval: 1.5, size: 11, shape: 'slime' },
  goblin:     { name: 'ゴブリン', element: 'earth', hp: 420,  atk: 75,  def: 20,  speed: 0.6,  interval: 1.3, size: 12, shape: 'goblin' },
  wolf:       { name: '魔狼',     element: 'wind',  hp: 300,  atk: 55,  def: 5,   speed: 1.15, interval: 1.0, size: 11, shape: 'wolf' },
  salamander: { name: '火蜥蜴',   element: 'fire',  hp: 520,  atk: 95,  def: 15,  speed: 0.5,  interval: 1.6, size: 13, shape: 'lizard' },
  skeleton:   { name: '骸骨騎士', element: 'dark',  hp: 1200, atk: 140, def: 90,  speed: 0.4,  interval: 1.8, size: 14, shape: 'skeleton' },
  boss:       { name: '災厄の先触れ ヴァルグ', element: 'dark', hp: 9000, atk: 320, def: 110, speed: 0.28, interval: 2.0, size: 22, shape: 'boss', life: 5, boss: true },
};

// マップ記号: . 草地(遠距離職) / # 道(近接職) / S 出現地点 / G 結界(防衛地点) / x 岩・木(配置不可)
TD.STAGES = [
  {
    id: '1-1', chapter: '第1章 結界のほころび', name: '始まりの街道',
    brief: '王都へ続く街道に魔物が現れました！まずは剣士を道に、弓兵や魔導士を草地に配置してみましょう。',
    lives: 10, mana: 12, hpScale: 1, reward: 50,
    map: [
      'x...S....',
      '....#..x.',
      '....#....',
      '.####....',
      '.#.......',
      '.#....x..',
      '.#####...',
      '.....#...',
      'x....#...',
      '..####...',
      '..#....x.',
      '..#......',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'slime', n: 4, gap: 2.5 },
      { t: 16, e: 'goblin', n: 3, gap: 3 },
      { t: 28, e: 'slime', n: 6, gap: 1.4 },
      { t: 40, e: 'goblin', n: 4, gap: 2 },
      { t: 44, e: 'slime', n: 4, gap: 2 },
    ],
  },
  {
    id: '1-2', chapter: '第1章 結界のほころび', name: '魔狼の森',
    brief: '森を素早い魔狼が駆け抜けてきます。風属性の魔狼には火属性が有利ですよ！',
    lives: 10, mana: 12, hpScale: 1.35, reward: 50,
    map: [
      'S........',
      '#..x.....',
      '#..xx....',
      '######...',
      '.....#..x',
      '.x...#...',
      '..####...',
      '..#....x.',
      '..#####..',
      'x.....#..',
      '.x....#..',
      '......#..',
      '......G..',
    ],
    waves: [
      { t: 3, e: 'wolf', n: 4, gap: 2 },
      { t: 15, e: 'goblin', n: 3, gap: 2.5 },
      { t: 24, e: 'wolf', n: 6, gap: 1.2 },
      { t: 36, e: 'salamander', n: 2, gap: 4 },
      { t: 42, e: 'wolf', n: 8, gap: 1 },
      { t: 55, e: 'goblin', n: 4, gap: 1.5 },
    ],
  },
  {
    id: '1-3', chapter: '第1章 結界のほころび', name: '二つの門',
    brief: '敵が左右の門から同時に攻めてきます。合流地点を固めるのが勝利の鍵です！',
    lives: 10, mana: 14, hpScale: 1.7, reward: 50,
    map: [
      'S.......S',
      '#...x...#',
      '###...###',
      '..#...#..',
      '..#####..',
      '....#....',
      '.x..#....',
      '....#..x.',
      '..###....',
      '..#......',
      '..####...',
      'x....#...',
      '.....G...',
    ],
    waves: [
      { t: 3, e: 'slime', n: 4, gap: 2, s: 0 },
      { t: 4, e: 'goblin', n: 3, gap: 2.5, s: 1 },
      { t: 18, e: 'salamander', n: 3, gap: 3, s: 0 },
      { t: 20, e: 'wolf', n: 5, gap: 1.2, s: 1 },
      { t: 35, e: 'skeleton', n: 2, gap: 5, s: 0 },
      { t: 38, e: 'goblin', n: 5, gap: 1.5, s: 1 },
      { t: 52, e: 'wolf', n: 6, gap: 1, s: 0 },
      { t: 54, e: 'salamander', n: 3, gap: 2, s: 1 },
    ],
  },
  {
    id: '1-4', chapter: '第1章 結界のほころび', name: '王都城門・決戦',
    brief: '七つの災厄の先触れ、ヴァルグが現れました！光属性の攻撃が有効です。必殺技を温存して迎え撃って！',
    lives: 10, mana: 16, hpScale: 2.1, reward: 80,
    map: [
      '..S...S..',
      '..#...#..',
      'x.#...#..',
      '..#####..',
      '....#...x',
      '.####....',
      '.#.......',
      '.#..####.',
      '.####..#.',
      '.x.....#.',
      '..######.',
      '..#....x.',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'goblin', n: 4, gap: 2, s: 0 },
      { t: 5, e: 'slime', n: 4, gap: 2, s: 1 },
      { t: 20, e: 'skeleton', n: 2, gap: 4, s: 1 },
      { t: 22, e: 'wolf', n: 6, gap: 1, s: 0 },
      { t: 38, e: 'salamander', n: 4, gap: 2, s: 0 },
      { t: 40, e: 'skeleton', n: 2, gap: 4, s: 1 },
      { t: 58, e: 'boss', n: 1, gap: 0, s: 0 },
      { t: 62, e: 'goblin', n: 6, gap: 2, s: 1 },
      { t: 70, e: 'wolf', n: 6, gap: 1.5, s: 0 },
    ],
  },
];

// ホーム画面の精霊ルミナのセリフ
TD.NAVI_LINES = [
  'おかえりなさい、{name}さま！',
  '大結界がまた少し弱まっています……。',
  '剣士や盾騎士は「道」に、弓兵や魔導士は「草地」に配置できますよ。',
  '属性の相性は 火→風→土→水→火。光と闇はお互いが弱点です！',
  '必殺技ゲージが溜まったら、キャラのカードをタップ！',
  'ひゃっ！？つ、つつかないでください～！',
  'いつか、七つの災厄をすべて退けられる日が来るはずです。',
  '撤退させるとマナが半分戻ってきます。うまく使ってくださいね。',
];

// ========== フェーズ4：ログインボーナス・ミッション・デイリー・イベント ==========

// 7日周期のログインボーナス
TD.LOGIN_BONUS = [
  { stones: 50 },
  { crystals: 500 },
  { stones: 50 },
  { crystals: 800 },
  { stones: 100 },
  { crystals: 1000 },
  { stones: 300 },
];

// デイリーミッション（毎日0時にリセット）。key は daily カウンタ名
TD.DAILY_MISSIONS = [
  { id: 'd-login',  name: 'ログインする',                 key: 'login',    goal: 1,  reward: { stones: 10 } },
  { id: 'd-win',    name: 'バトルに3回勝利する',           key: 'wins',     goal: 3,  reward: { stones: 30 } },
  { id: 'd-kill',   name: '敵を50体倒す',                  key: 'kills',    goal: 50, reward: { stones: 20 } },
  { id: 'd-skill',  name: '必殺技を5回使う',               key: 'skills',   goal: 5,  reward: { crystals: 300 } },
  { id: 'd-lvup',   name: 'キャラをレベルアップする',       key: 'levelups', goal: 1,  reward: { crystals: 200 } },
  { id: 'd-cave',   name: '「古代の書庫」をクリアする',     key: 'caves',    goal: 1,  reward: { crystals: 300 } },
  { id: 'd-all',    name: 'デイリーミッションをすべて達成', key: '_all',     goal: 6,  reward: { stones: 50 } },
];

// 通常ミッション（一度だけ達成）。progress(save) → 現在値
TD.ACHIEVEMENTS = [
  { id: 'a-1-1',   name: '1-1「始まりの街道」をクリア',   goal: 1,  progress: s => s.cleared['1-1'] ? 1 : 0, reward: { stones: 30 } },
  { id: 'a-1-4',   name: '1-4「王都城門・決戦」をクリア', goal: 1,  progress: s => s.cleared['1-4'] ? 1 : 0, reward: { stones: 100 } },
  { id: 'a-star',  name: '第1章で★を12個集める',          goal: 12, progress: s => TD.STAGES.reduce((a, st) => a + (s.cleared[st.id] || 0), 0), reward: { stones: 150 } },
  { id: 'a-own8',  name: '英雄を8人仲間にする',           goal: 8,  progress: s => s.owned.length, reward: { stones: 100 } },
  { id: 'a-own13', name: '英雄を13人仲間にする',          goal: 13, progress: s => s.owned.length, reward: { stones: 300 } },
  { id: 'a-lv20',  name: 'いずれかのキャラをLv20にする',   goal: 20, progress: s => Math.max(...Object.values(s.chars).map(c => c.lv)), reward: { stones: 50 } },
  { id: 'a-lb',    name: 'キャラを限界突破する',           goal: 1,  progress: s => Math.max(...Object.values(s.chars).map(c => c.lb)), reward: { stones: 50 } },
  { id: 'a-win30', name: 'バトルに通算30回勝利する',        goal: 30, progress: s => s.stats.wins, reward: { stones: 100 } },
  { id: 'a-kill500', name: '敵を通算500体倒す',            goal: 500, progress: s => s.stats.kills, reward: { stones: 100 } },
  { id: 'a-login7', name: '通算7日ログインする',           goal: 7,  progress: s => s.login.total, reward: { stones: 100 } },
];

// デイリークエスト（1日の挑戦回数に制限あり）
TD.DAILY_STAGES = [
  {
    id: 'D-1', type: 'daily', name: '古代の書庫', chapter: 'デイリークエスト', unlockAfter: '1-1', dailyLimit: 3,
    brief: '古の魔導書が眠る書庫です。経験の書がたくさん手に入りますよ！1日3回まで挑戦できます。',
    lives: 10, mana: 14, hpScale: 1.4, reward: 0, exp: 1500,
    map: [
      'xxxxSxxxx',
      'x...#...x',
      'x.###...x',
      'x.#.....x',
      'x.#####.x',
      'x.....#.x',
      'x.x...#.x',
      'x.#####.x',
      'x.#.....x',
      'x.###x..x',
      'x...#...x',
      'x...#...x',
      'xxxxGxxxx',
    ],
    waves: [
      { t: 3, e: 'slime', n: 6, gap: 1.5 },
      { t: 15, e: 'goblin', n: 5, gap: 1.8 },
      { t: 28, e: 'salamander', n: 3, gap: 3 },
      { t: 38, e: 'slime', n: 8, gap: 1 },
      { t: 48, e: 'skeleton', n: 2, gap: 4 },
    ],
  },
];

// 期間限定イベント
TD.ENEMIES.starbeast = { name: '星喰らいの魔獣', element: 'fire', hp: 7000, atk: 260, def: 90, speed: 0.3, interval: 1.8, size: 20, shape: 'boss', life: 3, boss: true };

TD.EVENT = {
  id: 'starfest',
  name: '星降る夜の魔導祭',
  start: '2026-11-15', end: '2026-12-14',   // この期間だけ遊べる（端末の日付で判定）
  currency: '星の欠片',
  element: 'dark',
  desc: '年に一度、星が降る夜に開かれる魔導祭。ところが今年は、星を喰らう魔獣が現れて……！',
  story: 'event-starfest',
  stages: [
    {
      id: 'E-1', type: 'event', name: '星降る丘', chapter: '星降る夜の魔導祭', unlockAfter: null,
      brief: '星の欠片を集めて、交換所で報酬と交換しましょう！何度でも挑戦できます。',
      lives: 10, mana: 14, hpScale: 1.5, reward: 50, exp: 500, eventPoints: 30,
      map: [
        '....S....',
        '....#..x.',
        '.x..#....',
        '..###....',
        '..#......',
        '..####...',
        '.....#...',
        '..x..#.x.',
        '.#####...',
        '.#.......',
        '.#####...',
        '.....#...',
        '.....G...',
      ],
      waves: [
        { t: 3, e: 'wolf', n: 5, gap: 1.5 },
        { t: 14, e: 'salamander', n: 3, gap: 3 },
        { t: 26, e: 'goblin', n: 6, gap: 1.5 },
        { t: 38, e: 'wolf', n: 8, gap: 1 },
        { t: 50, e: 'skeleton', n: 2, gap: 4 },
      ],
    },
    {
      id: 'E-2', type: 'event', name: '魔導祭の夜【上級】', chapter: '星降る夜の魔導祭', unlockAfter: 'E-1',
      brief: '星喰らいの魔獣が現れました！火属性の魔獣には水属性が有効です。報酬の星の欠片は2倍以上！',
      lives: 10, mana: 16, hpScale: 2.2, reward: 80, exp: 900, eventPoints: 70,
      map: [
        'S.......S',
        '#.......#',
        '#..x....#',
        '####.####',
        '...#.#...',
        '...###...',
        '....#....',
        '.x..#..x.',
        '.####....',
        '.#.......',
        '.######..',
        '......#..',
        '......G..',
      ],
      waves: [
        { t: 3, e: 'salamander', n: 3, gap: 2.5, s: 0 },
        { t: 4, e: 'wolf', n: 5, gap: 1.2, s: 1 },
        { t: 20, e: 'skeleton', n: 2, gap: 4, s: 0 },
        { t: 22, e: 'goblin', n: 5, gap: 1.5, s: 1 },
        { t: 40, e: 'starbeast', n: 1, gap: 0, s: 0 },
        { t: 44, e: 'salamander', n: 4, gap: 2, s: 1 },
        { t: 55, e: 'wolf', n: 6, gap: 1, s: 0 },
      ],
    },
  ],
  // 交換所（limit = 期間中の交換上限）
  shop: [
    { id: 'rune',  name: '★4 ルーン（加入 or 限界突破）', char: 'rune', cost: 300, limit: 2 },
    { id: 'st100', name: '魔晶石 ×100', reward: { stones: 100 }, cost: 120, limit: 5 },
    { id: 'cr1k',  name: '経験の書 ×1000', reward: { crystals: 1000 }, cost: 40, limit: 10 },
    { id: 'st30',  name: '魔晶石 ×30', reward: { stones: 30 }, cost: 40, limit: 99 },
  ],
};

// ========== キャラの個性（特性） ==========
// キャラ定義に traits: ['fastRedeploy'] のように書くと、その特性を持つ。
TD.TRAITS = {
  fastRedeploy: { name: '高速再配置', icon: '⚡', desc: '再配置までの待ち時間が半分になる', redeployMult: 0.5 },
};

// 撤退・再配置のルール
TD.RETREAT = {
  minCooldown: 5,   // 撤退時の待ち時間の下限（秒）
  refundRate: 0.5,  // 撤退時に戻るマナの割合
};

// 特性を反映した基本の再配置時間（やられた時はこの時間）
TD.redeployTime = function (def) {
  let t = def.redeploy;
  for (const k of def.traits || []) if (TD.TRAITS[k] && TD.TRAITS[k].redeployMult) t *= TD.TRAITS[k].redeployMult;
  return t;
};
// 撤退時の待ち時間：HPが多く残っているほど短い（下限あり）
//   待ち時間 = max(下限, 基本時間 × (1 − 残りHPの割合))
TD.retreatCooldown = function (def, hpRatio) {
  const r = Math.max(0, Math.min(1, hpRatio));
  return Math.max(TD.RETREAT.minCooldown, TD.redeployTime(def) * (1 - r));
};
