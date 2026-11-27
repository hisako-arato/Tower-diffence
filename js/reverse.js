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
      this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(120,20,200,' });
      this.refreshCards(true);
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
      setTimeout(() => this.onEnd({ win, reverse: true, broke: this.maxLives - this.lives, goal: this.maxLives, timeLeft: Math.max(0, this.timeLeft), summoned: this.totalEnemies, slain: this.killed }), 900);
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
})();
