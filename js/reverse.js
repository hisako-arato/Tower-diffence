// 攻守反転モード（第二部 第4章の試作）
// プレイヤーは魔物を召喚して攻め込み、英雄たち（AI）が守る拠点を落とす。
// 盤面・敵・英雄の動きは通常のバトル（TD.Battle）をそのまま使い、操作と勝敗だけを入れ替える。
window.TD = window.TD || {};

(function () {
  const { T, W, H } = TD.BATTLE_DIM;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  class ReverseBattle extends TD.Battle {
    // party: 守る英雄たち [{ id, def, at:[x,y], t }]
    constructor(stage, heroes, els, onEnd) {
      super(stage, heroes, els, onEnd);
      const R = stage.reverse;
      this.rev = R;
      this.cards.forEach((c, i) => { c.slot = heroes[i].at; c.joinT = heroes[i].t || 0; c.state = 'wait'; });
      this.maxLives = this.lives = R.goal;          // 拠点の耐久（0にすればプレイヤーの勝ち）
      this.timeLeft = R.time;
      this.mana = R.mana;
      this.totalEnemies = 0;
      this.spawnIdx = 0;
      this.rushT = 0; this.rushMult = 1; this.curseT = 0; this.curseMult = 1;
      this.aiT = 0;
    }

    // ---------- 手札（魔物と権能） ----------
    buildCards() {
      const R = this.stage.reverse, wrap = this.els.cards;
      wrap.innerHTML = '';
      this.mcards = [];
      for (const h of R.hand) {
        const def = TD.ENEMIES[h.e], el = document.createElement('button');
        const c = Object.assign({ kind: 'monster', def, cdLeft: 0, used: 0 }, h);
        el.className = 'card mcard' + (def.boss ? ' boss' : '');
        el.innerHTML = `<span class="c-cost">${h.cost}</span><canvas class="mc-icon" width="88" height="88"></canvas>` +
          `<span class="c-name">${def.name.split(' ').pop()}</span><span class="c-cool"></span>`;
        el.addEventListener('click', () => this.summon(c));
        c.el = el; c.coolEl = el.querySelector('.c-cool');
        this.drawIcon(el.querySelector('canvas'), def);
        wrap.appendChild(el); this.mcards.push(c);
      }
      for (const p of R.powers) {
        const el = document.createElement('button'), c = Object.assign({ kind: 'power', cdLeft: 0 }, p);
        el.className = 'card power';
        el.innerHTML = `<span class="c-cost">${p.cost}</span><span class="pw-ico">${p.icon}</span><span class="c-name">${p.name}</span><span class="c-cool"></span>`;
        el.addEventListener('click', () => this.usePower(c));
        c.el = el; c.coolEl = el.querySelector('.c-cool');
        wrap.appendChild(el); this.mcards.push(c);
      }
    }
    // 魔物の見た目をカードに描く（バトルと同じ描き方）
    drawIcon(cv, def) {
      const g = cv.getContext('2d'), s = Math.min(18, def.size);
      g.scale(2, 2);
      this.drawEnemy(g, { def, x: 22, y: 26, size: s, hp: 1, maxHp: 1, walk: 0, flash: 0, frozen: 0 });
    }

    summon(c) {
      if (this.over || this.paused) return;
      if (c.cdLeft > 0) return;
      if (c.limit && c.used >= c.limit) { this.toast('もう召喚できません'); return; }
      if (this.mana < c.cost) { this.toast('魔力が足りません'); return; }
      this.mana -= c.cost; c.cdLeft = c.cd; c.used++;
      this.spawn(c.e, this.spawnIdx);
      this.totalEnemies++;
      const e = this.enemies[this.enemies.length - 1];
      this.fx.push({ type: 'ring', x: e.x, y: e.y, r0: 4, r1: 26, t: 0, dur: 0.4, color: '#c060ff', width: 4 });
      this.refreshCards(true);
    }
    usePower(c) {
      if (this.over || this.paused || c.cdLeft > 0) return;
      if (this.mana < c.cost) { this.toast('魔力が足りません'); return; }
      this.mana -= c.cost; c.cdLeft = c.cd;
      if (c.type === 'rush') { this.rushT = c.dur; this.rushMult = c.mult; this.toast('狂奔！ 魔物たちが加速する'); }
      if (c.type === 'curse') { this.curseT = c.dur; this.curseMult = c.mult; this.toast('闇の帳！ 英雄たちの攻撃が鈍る'); }
      // 闇の配下の権能（仲間になった配下の数だけ増える）
      const heroes = this.units, mons = this.enemies.filter(e => !e.dead);
      if (c.type === 'tide') { for (const u of heroes) { u.hasteT = c.dur; u.hasteMult = c.mult; } this.toast('大海嘯！ 英雄たちの攻撃が遅くなる'); }
      if (c.type === 'roar') { for (const e of mons) e.barrierOn = c.dur; this.toast('原初の咆哮！ 魔物たちに攻撃が効かない'); }
      if (c.type === 'gaze') { this.blizzardT = c.dur; this.blizzardMult = c.mult; this.toast('千眼の幻惑！ 英雄たちの射程が縮む'); }
      if (c.type === 'rot') { for (const u of heroes) { u.poisonT = c.dur; u.poisonRatio = c.ratio; } this.toast('腐蝕の霧！ 英雄たちが毒に侵される'); }
      if (c.type === 'scale') {
        for (const e of mons) e.hp = e.maxHp;
        for (const u of heroes) this.powerHurt(u, c.ratio);
        this.toast('天秤の傾き！ 魔物は癒え、英雄は傷つく');
      }
      if (c.type === 'king') { for (const u of heroes) this.powerHurt(u, c.ratio); this.toast('王の剣圧！'); this.fx.push({ type: 'flash', t: 0, dur: 0.6, color: 'rgba(40,0,60,' }); }
      this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(120,20,200,' });
      this.refreshCards(true);
    }

    // 権能のダメージ（これだけで倒れることはない）
    powerHurt(u, ratio) {
      const d = Math.min(u.hp - 1, Math.round(u.maxHp * ratio));
      if (d <= 0) return;
      u.hp -= d; u.flash = 0.2;
      this.pop(u.x, u.y - 20, String(d), '#d080ff', { size: 12 });
    }

    // 出現口をタップして、召喚する場所を選ぶ
    onTap(x, y) {
      if (this.over || this.paused) return;
      const cx = Math.floor(x / T), cy = Math.floor(y / T);
      const i = this.spawns.findIndex(([sx, sy]) => sx === cx && sy === cy);
      if (i >= 0) { this.spawnIdx = i; this.toast('召喚する出現口を選びました'); }
    }

    // ---------- 英雄側（AI） ----------
    aiStep(dt) {
      for (const c of this.cards) {
        if (c.state === 'wait' && this.time >= c.joinT) c.state = 'ready';
        if (c.state !== 'ready') continue;
        const [x, y] = c.slot;
        if (this.units.some(u => u.cx === x && u.cy === y)) continue;
        const m = this.mana;
        this.deploy(c, x, y);
        this.mana = m;   // 英雄の配置にプレイヤーの魔力は使わない
        if (c.joinT > 0 && !c.joined) { c.joined = true; this.toast(`増援：${c.def.name}が駆けつけた！`); }
      }
      // 発動スキルは、たまり次第すぐ使う（少しだけ間を置く）
      if ((this.aiT -= dt) <= 0) {
        this.aiT = 0.6;
        for (const u of this.units) if (u.def.skill && u.sp >= u.def.skill.sp && this.enemies.length) { this.activateSkill(u); break; }
      }
    }

    update(dt) {
      if (this.over) return;
      this.timeLeft -= dt;
      this.mana = Math.min(99, this.mana + dt * (this.rev.manaRate - 1));   // 基本の+1/秒は本体側で加算される
      for (const c of this.mcards) if (c.cdLeft > 0) c.cdLeft -= dt;
      if (this.rushT > 0) this.rushT -= dt;
      if (this.curseT > 0) this.curseT -= dt;
      this.aiStep(dt);
      super.update(dt);
    }

    // 勝敗：拠点の耐久を0にすれば勝ち、時間切れで負け
    checkEnd() {
      if (this.lives <= 0) this.finish(true);
      else if (this.timeLeft <= 0) this.finish(false);
    }
    finish(win) {
      if (this.over) return;
      this.over = true;
      const k = this.timeLeft / this.rev.time, stars = !win ? 0 : k >= 0.4 ? 3 : k >= 0.15 ? 2 : 1;   // 早く落とすほど★が増える
      setTimeout(() => this.onEnd({ win, stars, reverse: true, broke: this.maxLives - this.lives, goal: this.maxLives, timeLeft: Math.max(0, this.timeLeft), summoned: this.totalEnemies, slain: this.killed }), 900);
    }

    refreshCards(force) {
      const now = performance.now();
      if (!force && now - (this._lastCardRefresh || 0) < 100) return;
      this._lastCardRefresh = now;
      for (const c of this.mcards || []) {
        const out = !!(c.limit && c.used >= c.limit);
        c.el.classList.toggle('cooling', c.cdLeft > 0 || out);   // 第2引数は必ず真偽値に（undefined だと切り替わり続けてチカチカする）
        c.el.classList.toggle('nomana', this.mana < c.cost);
        c.coolEl.textContent = out ? '済' : c.cdLeft > 0 ? Math.ceil(c.cdLeft) : '';
      }
      const e = this.els;
      e.manaFill.style.width = (this.mana % 1) * 100 + '%';
      e.manaText.textContent = Math.floor(this.mana);
      e.lives.textContent = `拠点 ${Math.max(0, this.lives)}/${this.maxLives}`;
      e.enemies.textContent = `残り${Math.max(0, Math.ceil(this.timeLeft || 0))}秒`;
    }

    draw() {
      super.draw();
      // 選んでいる出現口を示す
      const g = this.ctx, s = this.spawns[this.spawnIdx];
      if (!s) return;
      const x = s[0] * T + T / 2, y = s[1] * T + T / 2, p = 0.5 + Math.sin(performance.now() / 250) * 0.5;
      g.strokeStyle = `rgba(220,120,255,${0.5 + 0.5 * p})`; g.lineWidth = 3;
      g.beginPath(); g.arc(x, y, 17 + p * 3, 0, Math.PI * 2); g.stroke();
    }
  }
  TD.ReverseBattle = ReverseBattle;

  // 攻守反転のステージは、魔物が「下から上へ」攻め上がる向きにする（マップと英雄の配置を上下反転）
  function flipStage(st) {
    const rows = st.map.length;
    st.map = st.map.slice().reverse();
    for (const h of st.reverse.heroes) h.at = [h.at[0], rows - 1 - h.at[1]];
    return st;
  }

  // ---------- 試作ステージ ----------
  TD.REVERSE_STAGES = [
    {
      id: 'R-1', type: 'reverse', name: '王都外壁・強襲', chapter: '試作 攻守反転', hpScale: 3.0, lives: 0, reward: 0, exp: 0,
      brief: '立場が逆転した試作ステージです。魔力で魔物を召喚して道を進ませ、英雄たちが守る拠点まで届かせましょう。拠点の耐久を0にすれば勝ち、時間切れで負けです。',
      reverse: {
        goal: 8, time: 150, mana: 15, manaRate: 2,
        heroes: [
          { id: 'gald',  at: [2, 9],  lv: 5, lb: 0 },
          { id: 'lydia', at: [5, 7],  lv: 5, lb: 0 },
          { id: 'fin',   at: [6, 4],  lv: 5, lb: 0 },
          { id: 'kai',   at: [3, 6],  lv: 5, lb: 0 },
          { id: 'mia',   at: [4, 9],  lv: 5, lb: 0 },
          { id: 'aster', at: [3, 10], lv: 5, lb: 0, t: 45 },
          { id: 'zephyr', at: [7, 9], lv: 5, lb: 0, t: 90 },
        ],
        hand: [
          { e: 'goblin',     cost: 4,  cd: 1 },
          { e: 'wolf',       cost: 5,  cd: 1.5 },
          { e: 'harpy',      cost: 6,  cd: 3 },
          { e: 'darkMage',   cost: 7,  cd: 4 },
          { e: 'skeleton',   cost: 9,  cd: 5 },
          { e: 'lavaGolem',  cost: 15, cd: 10 },
          { e: 'boss',       cost: 30, cd: 0, limit: 1 },
        ],
        powers: [
          { type: 'rush',  name: '狂奔',   icon: '»', cost: 12, cd: 20, dur: 6, mult: 1.6 },
          { type: 'curse', name: '闇の帳', icon: '◐', cost: 15, cd: 30, dur: 6, mult: 0.5 },
        ],
      },
      map: [
        '....S....',
        '....#....',
        '.x..#....',
        '..###....',
        '..#......',
        '..####...',
        '.....#.x.',
        '.....#...',
        '..####...',
        '..#......',
        '..####...',
        '.....#...',
        '.....G...',
      ],
      waves: [],
    },
  ].map(flipStage);

  // ===================== 第二部 第4章 災厄の行進（攻守反転） =====================
  // 魔物を率いて、英雄たちが守る各地を攻め落とす。仲間になった闇の配下の数だけ「権能」が増える（app.js が加える）
  const C = '第二部 第4章 災厄の行進';
  const hero = (id, x, y, lv, t) => ({ id, at: [x, y], lv, lb: lv >= 60 ? 4 : 3, t });
  const echoHand = extra => [
    { e: 'echoGoblin', cost: 4, cd: 1 },
    { e: 'echoWolf',   cost: 5, cd: 1.5 },
    { e: 'echoShade',  cost: 6, cd: 3 },
    { e: 'echoMage',   cost: 7, cd: 4 },
    { e: 'echoKnight', cost: 9, cd: 5 },
    { e: 'gargoyle',   cost: 12, cd: 8 },
    ...extra,
  ];
  const basePowers = [{ type: 'rush', name: '狂奔', icon: '»', cost: 12, cd: 20, dur: 6, mult: 1.6, desc: '6秒間、魔物たちの足が1.6倍速くなる' }];
  TD.STAGES.push(...[
    {
      id: 'Ⅱ4-1', type: 'reverse', part: 2, chapter: C, name: '王都外壁', hpScale: 3.6, lives: 0, reward: 150, exp: 1100, recLv: 60,
      brief: '魔物を召喚して道を進ませ、英雄たちが守る拠点まで届かせましょう。拠点の耐久を0にすれば勝ち、時間切れで負けです。早く落とすほど★が増えます。',
      reverse: {
        goal: 8, time: 150, mana: 15, manaRate: 2,
        heroes: [hero('gald', 2, 9, 55), hero('emil', 5, 7, 55), hero('lux', 6, 4, 55), hero('kai', 3, 6, 55), hero('mia', 4, 9, 55), hero('thomas', 3, 10, 55, 45), hero('popo', 7, 9, 55, 90)],
        hand: echoHand([{ e: 'lavaGolem', cost: 15, cd: 10 }]),
        powers: basePowers,
      },
      map: ['....S....', '....#....', '.x..#....', '..###....', '..#......', '..####...', '.....#.x.', '.....#...', '..####...', '..#......', '..####...', '.....#...', '.....G...'],
      waves: [],
    },
    {
      id: 'Ⅱ4-2', type: 'reverse', part: 2, chapter: C, name: '蒼の神殿', hpScale: 3.8, lives: 0, reward: 150, exp: 1150, recLv: 60,
      brief: '蒼の神殿を守るのは、セイラとミナモたち水の英雄です。水には風が強い――凍嵐の残響グラキエス（風）を一度だけ呼べます。',
      reverse: {
        goal: 8, time: 160, mana: 16, manaRate: 2,
        heroes: [hero('seira', 3, 8, 58), hero('minamo', 4, 7, 58), hero('shigure', 6, 5, 58), hero('celes', 3, 9, 58), hero('lily', 4, 11, 58), hero('shion', 6, 9, 58, 50), hero('thomas', 7, 10, 58, 80)],
        hand: echoHand([{ e: 'echoPlague', cost: 10, cd: 6 }, { e: 'glaciesEcho', cost: 22, cd: 0, limit: 1 }]),
        powers: basePowers,
      },
      map: ['....S....', '....#....', '.~..#..~.', '.####....', '.#.......', '.#####...', '.....#.~.', '.~...#...', '..####...', '..#....~.', '..######.', '.......#.', '.......G.'],
      waves: [],
    },
    {
      id: 'Ⅱ4-3', type: 'reverse', part: 2, chapter: C, name: '白銀の古城', theme: 'snow', hpScale: 4.0, lives: 0, reward: 150, exp: 1200, recLv: 60,
      brief: '星読みのカグラと風の英雄たちが待ち構えています。風には火が強い――溶岩ゴーレムが有効です。二つの出現口を使い分けて、守りの薄い側から攻めましょう（出現口はタップで選べます）。',
      reverse: {
        goal: 10, time: 170, mana: 16, manaRate: 2,
        heroes: [hero('kagura', 4, 7, 60), hero('nox', 2, 8, 60), hero('akane', 6, 4, 60), hero('zephyr', 3, 6, 60), hero('sylphina', 5, 9, 60), hero('soyo', 0, 10, 60), hero('mint', 7, 9, 60, 60)],
        hand: echoHand([{ e: 'lavaGolem', cost: 15, cd: 10 }]),
        powers: basePowers,
      },
      map: ['S.......S', '#.......#', '#.x...x.#', '###...###', '..#...#..', '..#####..', '....#....', '....#..x.', '.####....', '.#.......', '.#####...', '.....#...', '.....G...'],
      waves: [],
    },
    {
      id: 'Ⅱ4-4', type: 'reverse', part: 2, chapter: C, name: '紅蓮の火口', theme: 'lava', hpScale: 4.2, lives: 0, reward: 150, exp: 1250, recLv: 60,
      brief: '紅蓮の火口を守るのは、ブレアとカリンたち炎の英雄です。火には水が強い――氷のゴーレムと潮の魔導士が有効です。',
      reverse: {
        goal: 10, time: 170, mana: 17, manaRate: 2,
        heroes: [hero('blaire', 3, 7, 60), hero('garo', 6, 5, 60), hero('shizuku', 4, 4, 60), hero('kai', 4, 8, 60), hero('karin', 4, 10, 60), hero('xeno', 4, 11, 60, 50), hero('rune', 7, 8, 60, 90)],
        hand: echoHand([{ e: 'tideMage', cost: 7, cd: 3 }, { e: 'iceGolem', cost: 14, cd: 9 }]),
        powers: basePowers,
      },
      map: ['...S.....', '...#.~~..', '...#.~...', '...####..', '.~....#..', '..#####..', '..#...~..', '..####...', '~....#...', '..####.~.', '..#......', '..######.', '.......G.'],
      waves: [],
    },
    {
      id: 'Ⅱ4-5', type: 'reverse', part: 2, chapter: C, name: '天への階', theme: 'abyss', hpScale: 4.4, lives: 0, reward: 200, exp: 1400, recLv: 60,
      brief: '神の座へ続く階を、★5の英雄たちが守ります。最後にはリディアが駆けつけます。すべての権能を使って押し切りましょう。',
      reverse: {
        goal: 12, time: 180, mana: 20, manaRate: 2.2,
        heroes: [hero('kagura', 4, 7, 60), hero('seira', 3, 8, 60), hero('minamo', 5, 8, 60), hero('nereia', 4, 4, 60), hero('sylphina', 1, 9, 60), hero('meltia', 4, 11, 60), hero('lydia', 4, 10, 60, 100)],
        hand: echoHand([{ e: 'vargEcho', cost: 18, cd: 15 }, { e: 'ignisEcho', cost: 24, cd: 0, limit: 1 }]),
        powers: basePowers,
      },
      map: ['S.......S', '#.......#', '##.....##', '.#.....#.', '.###.###.', '...#.#...', '...###...', '....#....', '..###....', '..#....x.', '..#####..', '......#..', '......G..'],
      waves: [],
    },
  ].map(flipStage));
})();
