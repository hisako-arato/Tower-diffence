// バトルエンジン
window.TD = window.TD || {};

(function () {
  const T = 40, COLS = 9, ROWS = 13, W = COLS * T, H = ROWS * T;
  // 道：# は共通の道、a / b は「広い道」の左右の車線（その車線から出た敵だけが通る）
  const PATH = '#SGab';
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // ステージの見た目（theme）
  TD.THEMES = {
    grass: { path: ['#8a7560', '#93806a'], ground: ['#3f6b3a', '#447340'], water: ['#2f6aa8', '#3474b4'], wave: 'rgba(200,235,255,.35)', rock: ['#6d7480', '#8b939e'] },
    snow:  { path: ['#9aa6b8', '#a4b0c2'], ground: ['#d8e2ec', '#e2eaf3'], water: ['#2f6aa8', '#3474b4'], wave: 'rgba(200,235,255,.35)', rock: ['#6d7480', '#8b939e'] },
    lava:  { path: ['#5a4a44', '#63524b'], ground: ['#3a2622', '#412b26'], water: ['#c8461e', '#d8562a'], wave: 'rgba(255,220,120,.55)', rock: ['#2a1d1b', '#4a3632'], rocksOnly: true },
    abyss: { path: ['#4a4060', '#52476a'], ground: ['#1f1a30', '#241e38'], water: ['#3a1060', '#451470'], wave: 'rgba(200,140,255,.4)', rock: ['#14101f', '#332a48'], rocksOnly: true },
  };
  // '#rrggbb' → 'rgba(r,g,b,a)'
  const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // ★5スキルの画面の揺れの強さ
  TD.STAR5_SHAKE = { ancientStrike: 11, allStrike: 7, drainHeal: 5, tidal: 7, vortex: 6, snipe: 9, meteor: 4 };

  class Battle {
    constructor(stage, party, els, onEnd) {
      this.stage = stage;
      this.els = els;
      this.onEnd = onEnd;
      this.grid = stage.map.map(r => r.split(''));

      // 防衛地点（G）は最大2つ。敵は wave.g で指定した地点、指定がなければ一番近い地点を目指す
      const spawns = [], goals = [];
      this.grid.forEach((row, y) => row.forEach((c, x) => {
        if (c === 'S') spawns.push([x, y]);
        if (c === 'G') goals.push([x, y]);
      }));
      this.spawns = spawns;
      this.goals = goals;
      this.goal = goals[0];
      this.routeCache = {};
      this.routes = spawns.map((sp, i) => this.routeFor(i));
      // 結界の亀裂：途中から開く出現口。最初の出現口からの道の frac の位置にできる（wave の s: 'c0' などで使う）
      const baseSpawns = spawns.length;
      this.cracks = (stage.cracks || []).map(c => {
        const r = this.routeFor(c.from || 0), pt = r[Math.max(1, Math.min(r.length - 2, Math.floor(r.length * c.frac)))];
        const tile = [Math.floor(pt.x / T), Math.floor(pt.y / T)];
        this.spawns.push(tile);
        return { t: c.t, tile, idx: this.spawns.length - 1, open: false };
      });

      this.events = [];
      // s: 'alt' … 出現地点を交互に使う（広い道の左右の車線に振り分ける）／ 'c0' … 結界の亀裂0
      const sIdx = (ws, i) => ws === 'alt' ? i % Math.min(2, baseSpawns) : typeof ws === 'string' && ws[0] === 'c' ? baseSpawns + +ws.slice(1) : (ws || 0);
      for (const w of stage.waves)
        for (let i = 0; i < w.n; i++) this.events.push({ t: w.t + i * w.gap, e: w.e, s: sIdx(w.s, i), g: w.g });
      this.events.sort((a, b) => a.t - b.t);
      this.evIdx = 0;
      this.totalEnemies = this.events.length;
      this.killed = 0;

      this.time = 0;
      this.mana = stage.mana;
      // 出撃メンバーのユニークスキル（出撃メンバーにいるだけで有効）
      this.puniq = {};
      for (const p of party) { const u = p.def.unique; if (u && u.party) this.puniq[u.type] = u; }
      // 闇★3の毒：全体効果
      const P = TD.POISON;
      this.poisonMax = P.maxStacks; this.poisonDur = P.dur; this.poisonSlow = 1; this.poisonSpread = P.spreadRange;
      for (const p of party) {
        const u = p.def.unique; if (!u || u.type !== 'darkPoison') continue;
        if (u.sub === 'duration') this.poisonDur = P.dur * u.mult;
        if (u.sub === 'spread') this.poisonSpread = Math.max(this.poisonSpread, u.range);
        if (u.sub === 'slow') this.poisonSlow = Math.min(this.poisonSlow, u.mult);
      }
      // 敵全体の移動速度ダウン（重ねがけ）
      this.enemySlowAll = Math.max(0.3, 1 - TD.partyEffects(party.map(p => p.id)).enemySlow);
      this.maxLives = this.lives = stage.lives + (this.puniq.lifeUp ? this.puniq.lifeUp.add : 0);
      this.units = [];
      this.enemies = [];
      this.shots = [];
      this.warns = [];   // ボスの範囲攻撃の予兆
      this.fx = [];
      this.pops = [];
      // party: [{ id, def }]（def は育成状態を反映済みのステータス）
      this.cards = party.map(p => ({ id: p.id, def: p.def, state: 'ready', cd: 0, unit: null }));
      // トリオ：3人そろっていれば有効。カリンの秘薬は必要ゲージが減る
      const ids = party.map(p => p.id);
      for (const c of this.cards) {
        c.def.trioOn = TD.trioActive(c.def, ids);
        if (c.def.trioOn && c.def.trio.spMult && c.def.skill) c.def = Object.assign({}, c.def, { skill: Object.assign({}, c.def.skill, { sp: Math.round(c.def.skill.sp * c.def.trio.spMult) }) });
      }
      this.elixirT = 0;   // カリンの炎の秘薬の効果時間（トリオの強化条件）
      // ★5のカットイン用の立ち絵を先に読み込んでおく（初回の発動で絵が間に合わないのを防ぐ）
      for (const c of this.cards) if (c.def.rarity >= 5 && TD.CUSTOM_ART && TD.CUSTOM_ART[c.id]) { const im = new Image(); im.src = TD.CUSTOM_ART[c.id].src; }
      const rg = this.cards.find(c => c.def.trioOn && c.def.trio.regen);
      if (rg) { this.regenIds = new Set(rg.def.trio.regenFor); this.regenRate = rg.def.trio.regen; }
      this.selected = null;
      this.menuUnit = null;
      this.speed = 1;
      this.paused = false;
      this.slowT = 0;
      this.shakeT = 0; this.shakeMag = 0;   // 画面の揺れ
      this.showers = [];                    // 流星雨（降っている最中のスキル）
      this.blizzardT = 0; this.blizzardMult = 1;   // 吹雪：味方の射程が縮む
      this.burnTiles = [];                  // 燃えているマス（配置できない）
      this.meteors = [];                    // 落下中の隕石
      this.glow = null;                     // ★5スキル後の属性色の残光
      this._burst = null;                   // ★5スキルのダメージ集計
      this.over = false;
      this.uid = 0;
      this.deployCount = 0;

      this.ctx = els.canvas.getContext('2d');
      this.bg = this.renderBackground();
      this.buildCards();
      this.bindInput();
      this.resize();
      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);

      this.last = performance.now();
      this.raf = requestAnimationFrame(t => this.loop(t));
    }

    destroy() {
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this._onResize);
      this.els.canvas.onpointerdown = null;
      this.els.cards.innerHTML = '';
      this.hideMenu();
    }

    // ---------- 準備 ----------
    // 出現地点 si から防衛地点 gi（省略時は最も近い地点）までの道
    routeFor(si, gi) {
      const key = si + ':' + (gi == null ? '*' : gi);
      if (this.routeCache[key]) return this.routeCache[key];
      const s = this.spawns[Math.min(si, this.spawns.length - 1)];
      let best = null;
      const cands = gi == null ? this.goals : [this.goals[Math.min(gi, this.goals.length - 1)]];
      // 出現地点のとなりが車線（a / b）なら、その車線だけを通る
      let lane = '';
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const c = (this.grid[s[1] + dy] || [])[s[0] + dx];
        if (c === 'a' || c === 'b') { lane = c; break; }
      }
      const allow = '#SG' + (lane || 'ab');
      for (const g of cands) {
        const r = this.findRoute(s, g, allow);
        if (r.length && r[0].x === s[0] * T + T / 2 && r[0].y === s[1] * T + T / 2 && (!best || r.length < best.length)) best = r;
      }
      if (!best && gi != null) return (this.routeCache[key] = this.routeFor(si)); // 指定地点に届かない場合は一番近い地点へ
      return (this.routeCache[key] = best || this.findRoute(s, this.goals[0], allow));
    }

    findRoute(s, g, allow = PATH) {
      const key = (x, y) => x + ',' + y;
      const prev = { [key(s[0], s[1])]: null };
      const q = [s];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === g[0] && y === g[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          if (!allow.includes(this.grid[ny][nx])) continue;
          const k = key(nx, ny);
          if (k in prev) continue;
          prev[k] = [x, y];
          q.push([nx, ny]);
        }
      }
      const path = [];
      for (let c = g; c; c = prev[key(c[0], c[1])]) path.unshift({ x: c[0] * T + T / 2, y: c[1] * T + T / 2 });
      return path;
    }

    renderBackground() {
      const c = document.createElement('canvas');
      c.width = W * 2; c.height = H * 2;
      const g = c.getContext('2d');
      g.scale(2, 2);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const ch = this.grid[y][x], px = x * T, py = y * T;
        const th = TD.THEMES[this.stage.theme] || TD.THEMES.grass;
        if (PATH.includes(ch)) {
          g.fillStyle = (x + y) % 2 ? th.path[0] : th.path[1];
          g.fillRect(px, py, T, T);
          g.fillStyle = 'rgba(0,0,0,.12)';
          g.fillRect(px + 6, py + 8, 7, 4); g.fillRect(px + 24, py + 26, 9, 4);
        } else {
          g.fillStyle = (x + y) % 2 ? th.ground[0] : th.ground[1];
          g.fillRect(px, py, T, T);
          g.fillStyle = 'rgba(255,255,255,.06)';
          g.fillRect(px + 10, py + 12, 2, 6); g.fillRect(px + 27, py + 22, 2, 6);
        }
        if (ch === '~') { // 水辺・溶岩・深淵（配置不可）
          g.fillStyle = (x + y) % 2 ? th.water[0] : th.water[1];
          g.fillRect(px, py, T, T);
          g.strokeStyle = th.wave; g.lineWidth = 1.5;
          for (const oy of [12, 26]) { g.beginPath(); g.moveTo(px + 6, py + oy); g.quadraticCurveTo(px + 13, py + oy - 4, px + 20, py + oy); g.quadraticCurveTo(px + 27, py + oy + 4, px + 34, py + oy); g.stroke(); }
        }
        if (ch === 'x') {
          if (th.rocksOnly || !((x * 7 + y * 3) % 2)) { // 岩
            g.fillStyle = th.rock[0]; g.beginPath(); g.ellipse(px + 20, py + 24, 15, 11, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = th.rock[1]; g.beginPath(); g.ellipse(px + 16, py + 20, 7, 5, 0, 0, Math.PI * 2); g.fill();
          } else { // 木
            g.fillStyle = '#5b3d22'; g.fillRect(px + 17, py + 22, 6, 12);
            g.fillStyle = '#2b5a2a'; g.beginPath(); g.arc(px + 20, py + 17, 13, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#386e34'; g.beginPath(); g.arc(px + 16, py + 13, 7, 0, Math.PI * 2); g.fill();
          }
        }
        // 広い道：左右の車線の境目に白い破線
        if (ch === 'a') for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          if ((this.grid[y + dy] || [])[x + dx] !== 'b') continue;
          g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.setLineDash([6, 6]);
          g.beginPath();
          if (dx) { const lx = px + (dx > 0 ? T : 0); g.moveTo(lx, py + 4); g.lineTo(lx, py + T - 4); }
          else { const ly = py + (dy > 0 ? T : 0); g.moveTo(px + 4, ly); g.lineTo(px + T - 4, ly); }
          g.stroke(); g.setLineDash([]);
        }
        if (ch === 'S') {
          const grd = g.createRadialGradient(px + 20, py + 20, 2, px + 20, py + 20, 18);
          grd.addColorStop(0, '#f0d0ff'); grd.addColorStop(0.5, '#8a3cc8'); grd.addColorStop(1, 'rgba(60,0,90,0)');
          g.fillStyle = grd; g.beginPath(); g.arc(px + 20, py + 20, 18, 0, Math.PI * 2); g.fill();
        }
        if (ch === 'G') {
          const grd = g.createRadialGradient(px + 20, py + 20, 2, px + 20, py + 20, 20);
          grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.4, '#7fd8ff'); grd.addColorStop(1, 'rgba(60,160,255,0)');
          g.fillStyle = grd; g.beginPath(); g.arc(px + 20, py + 20, 20, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#dff6ff';
          g.beginPath(); g.moveTo(px + 20, py + 6); g.lineTo(px + 28, py + 20); g.lineTo(px + 20, py + 34); g.lineTo(px + 12, py + 20); g.closePath(); g.fill();
        }
      }
      return c;
    }

    buildCards() {
      const wrap = this.els.cards;
      wrap.innerHTML = '';
      for (const card of this.cards) {
        const d = card.def, el = document.createElement('button');
        el.className = `card el-${d.element}${d.skill ? '' : ' passive'}${d.adjutant ? ' adjutant' : ''}`;
        el.innerHTML =
          `<span class="c-cost">${d.cost}</span>` +
          ((d.traits || []).includes('fastRedeploy') ? `<span class="c-trait" title="高速再配置">⚡</span>` : '') +
          `<span class="c-face">${TD.portraitHTML(card.id)}</span>` +
          `<span class="c-name">${d.name}</span>` +
          (d.skill ? `<span class="c-sp"><i></i></span>` : `<span class="c-sp"><i></i></span><span class="c-pas">常時</span>`) +
          `<span class="c-cool"></span>`;
        el.addEventListener('click', () => this.onCard(card));
        card.el = el;
        card.spBar = el.querySelector('.c-sp i');
        card.coolEl = el.querySelector('.c-cool');
        wrap.appendChild(el);
      }
    }

    bindInput() {
      const cv = this.els.canvas;
      cv.onpointerdown = ev => {
        const r = cv.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width * W, y = (ev.clientY - r.top) / r.height * H;
        this.onTap(x, y);
      };
    }

    resize() {
      const cv = this.els.canvas, wrap = cv.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const s = Math.min(wrap.clientWidth / W, wrap.clientHeight / H) || 1;
      cv.style.width = Math.floor(W * s) + 'px';
      cv.style.height = Math.floor(H * s) + 'px';
      cv.width = Math.floor(W * s * dpr);
      cv.height = Math.floor(H * s * dpr);
      this.scale = s * dpr;
    }

    // ---------- 入力 ----------
    onCard(card) {
      if (this.over || this.paused) return;
      if (card.state === 'deployed') {
        if (card.def.skill && card.unit.sp >= card.def.skill.sp) this.activateSkill(card.unit);
        else this.showMenu(card.unit);
        return;
      }
      if (card.state !== 'ready') return;
      if (this.mana < card.def.cost) { this.toast('マナが足りません'); return; }
      this.hideMenu();
      this.selected = this.selected === card ? null : card;
      this.refreshCards(true);
    }

    onTap(x, y) {
      if (this.over || this.paused) return;
      const cx = Math.floor(x / T), cy = Math.floor(y / T);
      const unit = this.units.find(u => u.cx === cx && u.cy === cy);
      if (this.selected) {
        if (this.canDeploy(this.selected, cx, cy)) { this.deploy(this.selected, cx, cy); return; }
        if (!unit) {
          const melee = TD.ROLES[this.selected.def.role].melee;
          this.toast(melee ? '近接職は「道」に配置できます' : '遠距離職は「草地」に配置できます');
          return;
        }
      }
      if (unit) this.showMenu(unit);
      else this.hideMenu();
    }

    canDeploy(card, cx, cy) {
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
      if (this.units.some(u => u.cx === cx && u.cy === cy)) return false;
      if (this.burnTiles.some(b => b.cx === cx && b.cy === cy)) return false;   // 燃えているマス
      if (this.mana < card.def.cost) return false;
      const ch = this.grid[cy][cx];
      return TD.ROLES[card.def.role].melee ? (ch === '#' || ch === 'a' || ch === 'b') : ch === '.';
    }

    deploy(card, cx, cy) {
      const d = card.def;
      this.mana -= d.cost;
      const u = {
        id: ++this.uid, card, def: d, cx, cy, x: cx * T + T / 2, y: cy * T + T / 2,
        hp: d.hp, maxHp: d.hp, sp: 0, cd: 0.4, blocking: [], buff: null, buffT: 0,
        melee: TD.ROLES[d.role].melee, flash: 0, angle: -Math.PI / 2,
      };
      if (this.puniq.startSp && d.skill && !card.deployedOnce) u.sp = d.skill.sp / 2;
      card.deployedOnce = true;
      this.units.push(u);
      card.state = 'deployed';
      card.unit = u;
      this.selected = null;
      this.deployCount++;
      this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 4, r1: 26, t: 0, dur: 0.4, color: TD.ELEMENTS[d.element].color });
      this.pop(u.x, u.y - 26, d.lines.deploy, '#fff', { size: 11, dur: 1.6, bubble: true });
      this.refreshCards(true);
    }

    removeUnit(u, retreat) {
      this.units = this.units.filter(x => x !== u);
      for (const e of u.blocking) e.blockedBy = null;
      u.blocking = [];
      u.removed = true;
      const card = u.card;
      card.unit = null;
      card.state = 'cool';
      if (retreat) {
        // 撤退：HPが多く残っているほど早く再配置できる
        card.cd = TD.retreatCooldown(card.def, u.hp / u.maxHp);
        const refund = this.refundOf(card.def);
        this.mana = Math.min(99, this.mana + refund);
        this.pop(u.x, u.y - 20, `撤退 +${refund}`, '#9be7ff', { size: 12 });
      } else {
        card.cd = TD.redeployTime(card.def) * (this.puniq.deathRedeploy ? this.puniq.deathRedeploy.mult : 1);
        // イグニスの残響：倒れたキャラのいたマスが燃え、しばらく配置できない
        const burner = this.enemies.find(e => !e.dead && e.def.burnOnDeath);
        if (burner) this.burnTiles.push({ cx: u.cx, cy: u.cy, t: burner.def.burnOnDeath });
        this.fx.push({ type: 'burst', x: u.x, y: u.y, t: 0, dur: 0.5, color: '#ff8a8a' });
        this.pop(u.x, u.y - 20, '戦闘不能', '#ff8a8a', { size: 12 });
      }
      if (this.menuUnit === u) this.hideMenu();
      this.refreshCards(true);
    }

    refundOf(def) { return Math.floor(def.cost * (this.puniq.retreatRefund ? this.puniq.retreatRefund.rate : TD.RETREAT.refundRate)); }
    retreatLabel(u) {
      return `撤退（マナ+${this.refundOf(u.def)}・再配置まで${Math.ceil(TD.retreatCooldown(u.def, u.hp / u.maxHp))}秒）`;
    }

    showMenu(u) {
      this.menuUnit = u;
      const m = this.els.menu, d = u.def;
      const ready = d.skill && u.sp >= d.skill.sp;
      m.innerHTML =
        `<div class="um-name">${d.name}<small>${TD.ELEMENTS[d.element].name}・${TD.ROLES[d.role].name}</small></div>` +
        `<div class="um-hp">HP ${Math.ceil(u.hp)} / ${u.maxHp}</div>` +
        (d.passive ? `<div class="um-passive"><b>常時スキル「${d.passive.name}」</b>${d.passive.desc}</div>` : '') +
        (d.skill ? `<button class="um-skill" ${ready ? '' : 'disabled'}>発動スキル「${d.skill.name}」${ready ? '' : ` (${Math.floor(u.sp)}/${d.skill.sp})`}</button>` : '') +
        `<button class="um-retreat">${this.retreatLabel(u)}</button>`;
      const skb = m.querySelector('.um-skill');
      if (skb) skb.onclick = () => { this.activateSkill(u); this.hideMenu(); };
      m.querySelector('.um-retreat').onclick = () => { this.removeUnit(u, true); this.hideMenu(); };
      const cv = this.els.canvas, r = cv.getBoundingClientRect(), pr = cv.parentElement.getBoundingClientRect();
      const sx = r.width / W, sy = r.height / H;
      let left = r.left - pr.left + u.x * sx - 85;
      let top = r.top - pr.top + (u.y + 24) * sy;
      left = Math.max(4, Math.min(pr.width - 174, left));
      if (top > pr.height - 140) top = r.top - pr.top + (u.y - 24) * sy - 130;
      m.style.left = left + 'px';
      m.style.top = top + 'px';
      m.classList.add('show');
    }

    hideMenu() {
      this.menuUnit = null;
      this.els.menu.classList.remove('show');
    }

    toast(text) {
      const t = this.els.toast;
      t.textContent = text;
      t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    }

    // ---------- スキル ----------
    activateSkill(u) {
      const d = u.def, s = d.skill;
      if (!s || u.removed || u.sp < s.sp || this.over) return;
      u.sp = 0;
      this.skillCount = (this.skillCount || 0) + 1;
      const alive = this.enemies.filter(e => !e.dead);
      const col = TD.ELEMENTS[d.element].color;
      // ★5の発動スキル：ダメージを大きく表示し、合計を集計する
      const star5 = d.rarity >= 5;
      if (star5) this._burst = { src: u, total: 0, n: 0, x: 0, y: 0 };
      switch (s.type) {
        case 'poisonVolley': {   // ルナ：毒状態の敵全員へ矢（毒が多いほど痛い）
          const targets = alive.filter(e => e.poisonT > 0 && e.poison > 0);
          for (const e of targets) {
            const power = this.atkOf(u) * (s.base + s.perStack * e.poison);
            this.shots.push({ x: u.x, y: u.y, target: e, power, src: u, speed: 700, color: '#c060ff', kind: 'archer', addPoison: s.addStacks });
          }
          if (!targets.length) this.pop(u.x, u.y - 26, '毒状態の敵がいない', '#c8a8ff', { size: 10 });
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: 30, t: 0, dur: 0.5, color: '#c060ff', width: 5 });
          break;
        }
        case 'ancientStrike': {   // 英雄王リン：全ての敵に黒い斬撃＋味方全員を回復（限界突破で強くなる）
          const lb = Math.min(d.lb || 0, s.multByLb.length - 1);
          for (const e of alive) {
            this.hit(u, e, this.atkOf(u) * s.multByLb[lb]);
            this.fx.push({ type: 'blackSlash', x: e.x, y: e.y, t: 0, dur: 0.6, a: Math.random() * Math.PI, big: true });
          }
          for (const a of this.units) {
            const h = a.maxHp * s.healByLb[lb];
            a.hp = Math.min(a.maxHp, a.hp + h);
            this.pop(a.x, a.y - 18, '+' + Math.round(h), '#c8a8ff', { size: 12 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 24, t: 0, dur: 0.5, color: '#b070ff' });
          }
          this.fx.push({ type: 'flash', t: 0, dur: 0.7, color: 'rgba(30,0,50,' });
          break;
        }
        case 'allStrike':
          for (const e of alive) this.hit(u, e, this.atkOf(u) * s.mult);
          this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(255,240,170,' });
          break;
        case 'freeze': {
          // トリオ（秘薬の効果中）：範囲1.5倍・凍結6秒（ボスは3分の1）
          const tr = d.trioOn && this.elixirT > 0 && d.trio.skillRadius ? d.trio : null;
          const R = s.radius * (tr ? tr.skillRadius : 1) * T;
          for (const e of alive) if (dist(e, u) <= R) {
            e.frozen = tr ? tr.skillDur / (e.def.boss ? 3 : 1) : s.dur; e.bound = false;
            this.hit(u, e, this.atkOf(u) * s.mult);
          }
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: R, t: 0, dur: 0.6, color: '#bfe8ff', width: tr ? 10 : 6 });
          break;
        }
        case 'reflect':
        case 'taunt':
          if (s.type === 'taunt') this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 8, r1: s.radius * T, t: 0, dur: 0.7, color: '#ff4a6a', width: 6 });
          if (s.type === 'reflect') this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: 30, t: 0, dur: 0.6, color: '#9fe4ff', width: 5 });
          u.buff = s; u.buffT = s.dur;
          break;
        case 'vortex': {
          const c = this.frontEnemy(u, d.range * T) || u, cx = c.x, cy = c.y, R = s.radius * T;
          for (const e of alive) {
            if (dist(e, { x: cx, y: cy }) > R) continue;
            if (!e.blockedBy && !e.def.boss && e !== c) { e.x += (cx - e.x) * 0.7; e.y += (cy - e.y) * 0.7; e.passed.clear(); }
          }
          for (const e of alive) if (dist(e, { x: cx, y: cy }) <= R * 0.8) this.hit(u, e, this.atkOf(u) * s.mult);
          this.fx.push({ type: 'ring', x: cx, y: cy, r0: R, r1: 6, t: 0, dur: 0.6, color: '#8affc0', width: 8 });
          this.fx.push({ type: 'burst', x: cx, y: cy, t: 0, dur: 0.6, color: '#c8ffe0', big: true });
          break;
        }
        case 'defDown':
          for (const e of alive) if (dist(e, u) <= d.range * T) {
            e.defDownT = s.dur; e.defDownMult = s.mult;
            this.pop(e.x, e.y - e.size - 14, '防御DOWN', '#ffe066', { size: 10 });
          }
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: d.range * T, t: 0, dur: 0.6, color: '#ffe066', width: 4 });
          break;
        case 'flash':
          for (const e of alive) if (dist(e, u) <= s.radius * T) {
            e.frozen = Math.max(e.frozen, s.stun); e.bound = false;
            this.hit(u, e, this.atkOf(u) * s.mult);
          }
          this.fx.push({ type: 'flash', t: 0, dur: 0.35, color: 'rgba(255,255,220,' });
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: s.radius * T, t: 0, dur: 0.4, color: '#fff6c0', width: 8 });
          break;
        case 'snipe': { // 最もHPの多い敵（ボス優先）を射程に関係なく狙い撃つ
          const tgt = alive.slice().sort((a, b) => (b.def.boss ? 1 : 0) - (a.def.boss ? 1 : 0) || b.hp - a.hp)[0];
          if (tgt) {
            this.shots.push({ x: u.x, y: u.y, target: tgt, power: this.atkOf(u) * s.mult, src: u, speed: 900, color: '#7ad8ff', kind: 'archer', burst: star5 ? { src: u, total: 0, n: 0, x: 0, y: 0, shake: 9 } : null });
            this.fx.push({ type: 'ring', x: tgt.x, y: tgt.y, r0: 28, r1: 6, t: 0, dur: 0.5, color: '#7ad8ff', width: 3 });
          }
          break;
        }
        case 'shieldBash':
          for (const e of alive) if (dist(e, u) <= s.radius * T) { e.frozen = Math.max(e.frozen, s.stun); e.bound = false; }
          u.buff = { type: 'guard', dur: s.dur, defMult: s.defMult }; u.buffT = s.dur;
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 8, r1: s.radius * T, t: 0, dur: 0.5, color: '#ffe066', width: 8 });
          break;
        case 'gust':
          for (const e of [...u.blocking]) if (!e.dead && !e.def.boss) this.pushBack(e, s.push * T);
          u.buff = s; u.buffT = s.dur;
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: 40, t: 0, dur: 0.5, color: '#b8ffd0', width: 6 });
          break;
        case 'haste':
          for (const a of this.units) {
            a.hasteT = s.dur; a.hasteMult = s.mult;
            const h = a.maxHp * s.ratio; a.hp = Math.min(a.maxHp, a.hp + h);
            this.pop(a.x, a.y - 22, '速度UP', '#8affc0', { size: 11 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 22, t: 0, dur: 0.5, color: '#8affc0' });
          }
          break;
        case 'rally':
          this.elixirT = Math.max(this.elixirT, s.dur);
          for (const a of this.units) {
            a.atkUpT = s.dur; a.atkUpMult = s.atkMult;
            const h = a.maxHp * s.ratio; a.hp = Math.min(a.maxHp, a.hp + h);
            this.pop(a.x, a.y - 22, '攻撃UP', '#ff9a4a', { size: 11 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 22, t: 0, dur: 0.5, color: '#ff9a4a' });
          }
          break;
        case 'barrier':
          for (const e of alive) if (dist(e, u) <= d.range * T) this.shots.push({ x: u.x, y: u.y, target: e, power: this.atkOf(u) * s.mult, src: u, speed: 520, color: '#7ad8ff', kind: 'archer' });
          for (const a of this.units) {
            a.shieldT = s.dur; a.shieldRed = s.reduce;
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 18, r1: 22, t: 0, dur: 0.6, color: '#7ad8ff', width: 4 });
          }
          break;
        case 'rapid':
        case 'power':
          u.buff = s; u.buffT = s.dur;
          break;
        case 'guard':
          u.buff = s; u.buffT = s.dur;
          u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.5);
          break;
        case 'healAll':
          for (const a of this.units) {
            const h = a.maxHp * s.ratio;
            a.hp = Math.min(a.maxHp, a.hp + h);
            this.pop(a.x, a.y - 18, '+' + Math.round(h), '#7dffa0', { size: 12 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 22, t: 0, dur: 0.5, color: '#7dffa0' });
          }
          break;
        case 'storm':
          for (const e of alive) if (dist(e, u) <= d.range * T) { e.slowT = s.dur; this.hit(u, e, this.atkOf(u) * s.mult); }
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: d.range * T, t: 0, dur: 0.7, color: '#b8ffd0', width: 8 });
          break;
        case 'drainHeal': {
          for (const e of alive) this.hit(u, e, this.atkOf(u) * s.mult);
          for (const a of this.units) {
            const h = a.maxHp * s.ratio;
            a.hp = Math.min(a.maxHp, a.hp + h);
            a.poisonT = s.ratio >= 1 ? 0 : a.poisonT;   // 全回復なら毒も消える
            this.pop(a.x, a.y - 18, s.ratio >= 1 ? '全回復' : '+' + Math.round(h), '#ff9ad0', { size: 12 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 22, t: 0, dur: 0.5, color: '#ff9ad0' });
          }
          this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(200,80,200,' });
          break;
        }
        case 'bind':
          for (const e of alive) if (dist(e, u) <= s.radius * T) { e.frozen = Math.max(e.frozen, s.bindDur); e.bound = true; }
          u.buff = Object.assign({}, s, { type: 'guard', noBlock: true }); u.buffT = s.dur;
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: s.radius * T, t: 0, dur: 0.7, color: '#ffb04a', width: 7 });
          break;
        case 'meteor':   // 一定時間、フィールドにランダムに隕石を降らせる
          this.showers.push({ src: u, s, t: 0, next: 0.2, burst: star5 ? { src: u, total: 0, n: 0 } : null });
          break;
        case 'tidal':
          for (const e of alive) if (dist(e, u) <= s.radius * T) {
            this.hit(u, e, this.atkOf(u) * s.mult);
            if (!e.dead && !e.def.boss) this.pushBack(e, s.push * T);
          }
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: s.radius * T, t: 0, dur: 0.8, color: '#5ab0ff', width: 12 });
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 4, r1: s.radius * T * 0.7, t: 0, dur: 0.6, color: '#a77bff', width: 6 });
          break;
        case 'execute': {
          let tgt = u.blocking.find(e => !e.dead);
          if (!tgt) tgt = this.frontEnemy(u, d.range * T + T);
          if (tgt) {
            this.hit(u, tgt, this.atkOf(u) * s.mult);
            this.fx.push({ type: 'slash', x: tgt.x, y: tgt.y, t: 0, dur: 0.4, color: '#8affc0', a: Math.atan2(tgt.y - u.y, tgt.x - u.x) });
            if (tgt.dead) {
              this.mana = Math.min(99, this.mana + s.mana);
              this.pop(u.x, u.y - 30, `マナ+${s.mana}`, '#9be7ff', { size: 13 });
            }
          }
          break;
        }
        case 'battery':
          for (const a of this.units) {
            if (a === u || !a.def.skill) continue;
            a.sp = Math.min(a.def.skill.sp, a.sp + s.amount);
            this.pop(a.x, a.y - 22, `SP+${s.amount}`, '#ffe066', { size: 11 });
            this.fx.push({ type: 'ring', x: a.x, y: a.y, r0: 4, r1: 20, t: 0, dur: 0.5, color: '#ffe066' });
          }
          break;
        case 'explosion': {
          const inRange = alive.filter(e => dist(e, u) <= d.range * T);
          const c = inRange.sort((a, b) => b.hp - a.hp)[0] || u;
          for (const e of alive) if (dist(e, c) <= s.radius * T) { this.hit(u, e, this.atkOf(u) * s.mult); if (s.poison) this.addPoison(e, s.poison); }
          this.fx.push({ type: 'ring', x: c.x, y: c.y, r0: 6, r1: s.radius * T, t: 0, dur: 0.6, color: '#ffb04a', width: 10 });
          this.fx.push({ type: 'burst', x: c.x, y: c.y, t: 0, dur: 0.6, color: '#ff6b4a', big: true });
          break;
        }
      }
      this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 8, r1: 34, t: 0, dur: 0.5, color: col, width: 4 });
      if (star5) {
        const b = this._burst; this._burst = null;
        if (b.n) this.finishBurst(b, TD.STAR5_SHAKE[s.type] || 5);
        this.glow = { color: col, t: 0, dur: 1.8 };
      }
      this.showCutin(u);
      this.slowT = star5 ? 1.4 : 1.0;
      this.refreshCards(true);
    }

    // ★5スキルのダメージ合計を中央に出し、画面を揺らす
    finishBurst(b, mag) {
      this.shake(mag);
      if (b.n > 1) this.pop(W / 2, H * 0.42, `${b.total.toLocaleString()}!!`, '#ffe066', { size: 30, dur: 1.4, big: true, label: `${b.n}体に命中` });
    }
    shake(mag, dur = 0.45) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, dur); }

    showCutin(u) {
      const d = u.def, c = this.els.cutin;
      if (TD.prefs && TD.prefs.cutin === false) return;   // 設定でカットインを省略
      const star5 = d.rarity >= 5;
      c.className = `cutin el-${d.element}${star5 ? ' star5' : ''}`;
      c.innerHTML = star5
        ? `<div class="ci-band"></div><div class="ci-shine"></div>` +
          `<div class="ci-art">${TD.fullArtHTML(u.card.id).replace('loading="lazy"', 'loading="eager"')}</div>` +
          `<div class="ci-text"><div class="ci-stars">${'★'.repeat(d.rarity)}</div><div class="ci-skill">${d.skill.name}</div><div class="ci-line">「${d.lines.skill}」</div></div>`
        : `<div class="ci-band"></div>` +
          `<div class="ci-face">${TD.portraitHTML(u.card.id, true)}</div>` +
          `<div class="ci-text"><div class="ci-skill">${d.skill.name}</div><div class="ci-line">「${d.lines.skill}」</div></div>`;
      void c.offsetWidth;
      c.classList.add('show');
      clearTimeout(this._cutinT);
      this._cutinT = setTimeout(() => c.classList.remove('show'), star5 ? 1500 : 1300);
    }

    // 射程内で最もゴールに近い敵
    frontEnemy(u, range) {
      let best = null, bp = -1;
      for (const e of this.enemies) {
        if (e.dead || dist(e, u) > range) continue;
        const prog = e.idx * 1000 - dist(e, e.route[Math.min(e.idx, e.route.length - 1)]);
        if (prog > bp) { bp = prog; best = e; }
      }
      return best;
    }

    // 敵を通ってきた道に沿って押し戻す
    pushBack(e, d) {
      if (e.blockedBy) {
        e.blockedBy.blocking = e.blockedBy.blocking.filter(x => x !== e);
        e.blockedBy = null;
      }
      while (d > 0 && e.idx > 1) {
        const p = e.route[e.idx - 1], dx = p.x - e.x, dy = p.y - e.y, l = Math.hypot(dx, dy);
        if (l <= d) { e.x = p.x; e.y = p.y; e.idx--; d -= l; }
        else { e.x += dx / l * d; e.y += dy / l * d; d = 0; }
      }
      e.passed.clear();
    }

    // ---------- ステータス ----------
    // 常時スキル
    pas(u, type) { const p = u.def.passive; return p && p.type === type ? p : null; }
    rangeOf(u) { const p = this.pas(u, 'range'); return u.def.range * (p ? p.mult : 1) * (this.blizzardT > 0 ? this.blizzardMult : 1); }   // blizzard：グラキエスの吹雪
    splashOf(u) { const p = this.pas(u, 'splash'); return u.def.splash ? u.def.splash * (p ? p.mult : 1) : 0; }
    atkOf(u) {
      let a = u.def.atk * (u.buff && u.buff.atk ? u.buff.atk : 1) * (u.atkUpT > 0 ? u.atkUpMult : 1);
      const pr = this.pas(u, 'pride');
      if (pr && u.hp / u.maxHp >= pr.threshold) a *= pr.mult;
      // 隊長の号令：隣接（8方向）の味方の攻撃力アップ（自分は対象外・重複しない）
      let adj = 1;
      for (const o of this.units) { const p = this.pas(o, 'adjAtk'); if (p && o !== u && Math.abs(o.cx - u.cx) <= 1 && Math.abs(o.cy - u.cy) <= 1) adj = Math.max(adj, p.mult); }
      return a * adj;
    }
    defOf(u) {
      const b = u.buff;
      let d = u.def.def * (!b ? 1 : b.defMult ? b.defMult : b.type === 'guard' ? 2 : 1);
      const rf = this.pas(u, 'reflect'); if (rf) d *= rf.defMult;
      const ls = this.pas(u, 'lastStand'); if (ls && u.hp / u.maxHp <= ls.threshold) d *= ls.defMult;
      return d;
    }
    // 挑発中で、この敵を引きつけている味方
    tauntUnit(e) {
      for (const u of this.units) if (u.buff && u.buff.type === 'taunt' && dist(e, u) <= u.buff.radius * T) return u;
      return null;
    }
    blockOf(u) {
      return (u.def.block || 0) + TD.blockBonus(u.def, this.cards.map(c => c.id)) + (u.buff && u.buff.type === 'guard' && !u.buff.noBlock ? 2 : 0);
    }
    rateOf(u) {
      let r = u.buff && u.buff.rate ? u.buff.rate : 1;
      if (u.hasteT > 0) r *= u.hasteMult;
      // 常時効果（オーラ）：近くの味方の攻撃速度アップ（重複はしない・最大のもの）
      return r * (1 + (u.ramp || 0)) * (this.curseT > 0 ? this.curseMult : 1);   // curse：攻守反転の権能「闇の帳」
    }

    hit(src, e, power, burst) {
      if (e.dead) return;
      if (e.barrierOn > 0) {   // 結界の守護像：光の障壁の間は攻撃が効かない
        if ((e.barrierPopT = (e.barrierPopT || 0) - 1) <= 0) { this.pop(e.x, e.y - e.size - 10, '無効', '#fff6c0', { size: 11 }); e.barrierPopT = 6; }
        return;
      }
      const bb = burst || (this._burst && this._burst.src === src ? this._burst : null);
      const m = TD.elemMult(src.def.element, e.def.element);
      let crit = false;
      // ヴィオラ「蝕みの呪い」：毒状態の敵に与えるダメージが倍
      const du = src.def && src.def.unique && src.def.unique.type === 'darkPoison' ? src.def.unique : null;
      if (du && du.sub === 'hunter' && e.poisonT > 0) power *= du.mult;
      const cp = src.def && src.def.passive && src.def.passive.type === 'crit' ? src.def.passive : null;
      // ノクス：凍結中の敵はクリティカル率50%、カリンの秘薬の効果中はクリティカル3倍
      const nt = src.def && src.def.unique && src.def.unique.type === 'frostCrit' ? src.def.unique : null;
      let critMult = 0;
      if (cp && Math.random() < (nt && e.frozen > 0 ? Math.max(cp.chance, nt.frozenCrit) : cp.chance)) {
        critMult = nt && this.elixirT > 0 ? nt.elixirCritMult : cp.mult;
        power *= critMult; crit = true;
      }
      const raw = power * m;
      const pc = src.def && src.def.passive && src.def.passive.type === 'pierce' ? src.def.passive : null;
      const edef = e.def.def * (e.defDownT > 0 ? e.defDownMult : 1) * (pc ? 1 - pc.ratio : 1);
      // 防御は割合で軽減（防御100で半減）。レベルを上げた分がそのまま効くようにする
      const d = Math.max(1, Math.round(raw * 100 / (100 + Math.max(0, edef))));
      e.hp -= d;
      e.flash = 0.12;
      const color = m > 1 ? '#ffd23f' : m < 1 ? '#a8b0b8' : '#ffffff';
      if (bb) {   // ★5スキル：金色の大きな数字
        bb.total += d; bb.n++;
        this.pop(e.x, e.y - e.size - 8 - (bb.n % 3) * 9, d.toLocaleString(), '#ffe066', { size: m > 1 ? 22 : 19, weak: m > 1, dur: 1.1, big: true });
      } else this.pop(e.x + (Math.random() * 10 - 5), e.y - e.size - 6, String(d), crit ? '#ff8a3a' : color, { size: crit || m > 1 ? 15 : 12, weak: m > 1 });
      if (crit) this.pop(e.x, e.y - e.size - 20, critMult >= 3 ? 'CRITICAL ×3' : 'CRITICAL', critMult >= 3 ? '#ff5a2a' : '#ff8a3a', { size: critMult >= 3 ? 11 : 9 });
      // セレス（トリオ）：秘薬の効果中、通常攻撃が当たった敵を短く凍結（凍結中の敵には重ねない・ボスは3分の1）
      const ct = src.def && src.def.trioOn && src.def.trio.freezeOnHit ? src.def.trio : null;
      if (ct && this.elixirT > 0 && !e.dead && !(e.frozen > 0) && !this._burst) {
        e.frozen = ct.freezeOnHit / (e.def.boss ? 3 : 1); e.bound = false;
      }
      if (du && !e.dead) this.addPoison(e, du.stacks);
      this.checkKill(e);
    }

    checkKill(e) {
      if (e.hp <= 0 && !e.dead) {
        e.dead = true;
        this.killed++;
        this.fx.push({ type: 'burst', x: e.x, y: e.y, t: 0, dur: 0.45, color: TD.ELEMENTS[e.def.element].color, big: e.def.boss });
        if (e.def.boss) this.fx.push({ type: 'flash', t: 0, dur: 0.8, color: 'rgba(255,255,255,' });
        // 災厄の残響：魂が光となって空へ還る（輪廻へ）
        if (e.def.soul) this.fx.push({ type: 'soulRise', x: e.x, y: e.y, t: 0, dur: 3, seed: Math.random() * 100 });
        // かつての仲間：倒れる時のひとこと
        if (e.def.heroId) this.pop(e.x, e.y - e.size - 14, (TD.HERO_DEFEAT && TD.HERO_DEFEAT[e.def.heroId]) || '……っ', '#fff', { size: 11, dur: 2.4, bubble: true });
      }
    }

    // 毒をためる
    addPoison(e, n) {
      if (e.dead) return;
      e.poison = Math.min(this.poisonMax || TD.POISON.maxStacks, (e.poison || 0) + n);
      e.poisonT = this.poisonDur || TD.POISON.dur;
    }

    hurt(e, u, power) {
      if (u.removed) return;
      if (u.def.unique && u.def.unique.type === 'invuln') { this.pop(u.x, u.y - 20, '無効', '#fff6c0', { size: 10 }); return; }
      const ev = this.pas(u, 'evade');
      if (ev && Math.random() < ev.chance) { this.pop(u.x, u.y - 20, 'MISS', '#c8f0ff', { size: 11 }); return; }
      const m = TD.elemMult(e.def.element, u.def.element);
      const raw = (power != null ? power : e.atk) * m;
      let d = Math.max(raw - this.defOf(u), raw * 0.15);
      if (u.shieldT > 0) d *= 1 - u.shieldRed;
      d = Math.round(d);
      u.hp -= d;
      u.flash = 0.12;
      this.pop(u.x, u.y - 20, String(d), '#ff7a7a', { size: 11 });
      if (e && e.def && e.def.poisonOnHit && !this.puniq.poisonImmune) {
        if (!(u.poisonT > 0)) this.pop(u.x, u.y - 32, '毒', '#c070ff', { size: 11 });
        u.poisonT = e.def.poisonOnHit.dur; u.poisonRatio = e.def.poisonOnHit.ratio;
      }
      // 水鏡の構え：受けたダメージを攻撃してきた敵に返す
      const rp = this.pas(u, 'reflect');
      if (((u.buff && u.buff.type === 'reflect') || rp) && e && !e.dead && e.hp != null) {
        this.hit(u, e, u.buff && u.buff.type === 'reflect' ? d : d * rp.ratio);
        this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: 20, t: 0, dur: 0.3, color: '#9fe4ff', width: 3 });
      }
      if (u.hp <= 0) this.removeUnit(u, false);
    }

    pop(x, y, text, color, o = {}) {
      this.pops.push({ x, y, text, color, size: o.size || 12, t: 0, dur: o.dur || 0.8, weak: o.weak, bubble: o.bubble, big: o.big, label: o.label });
    }

    // ---------- 更新 ----------
    loop(now) {
      let dt = Math.min(0.05, (now - this.last) / 1000);
      const realDt = dt;
      this.last = now;
      if (!this.paused && !this.over) {
        if (this.slowT > 0) { this.slowT -= dt; dt *= 0.2; }
        const steps = this.speed;
        for (let i = 0; i < steps; i++) this.update(dt);
      }
      if (this.shakeT > 0 && !this.paused && (this.shakeT -= realDt) <= 0) this.shakeMag = 0;
      this.draw();
      this.refreshCards(false);
      this.raf = requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
      if (this.over) return;
      this.time += dt;
      this.mana = Math.min(99, this.mana + dt);

      for (const c of this.cards) if (c.state === 'cool' && (c.cd -= dt) <= 0) { c.state = 'ready'; c.cd = 0; }

      for (const c of this.cracks) if (!c.open && this.time >= c.t) {
        c.open = true;
        this.toast('結界に亀裂が走った！ 新たな出現口が開く');
        this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(80,0,120,' });
        this.shake(5, 0.4);
      }
      while (this.evIdx < this.events.length && this.events[this.evIdx].t <= this.time) {
        const ev = this.events[this.evIdx++];
        this.spawn(ev.e, ev.s, ev.g);
      }

      this.updateEnemies(dt);
      this.updateUnits(dt);
      this.updateShots(dt);
      this.updateWarns(dt);
      this.updateMeteors(dt);

      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.dur);
      if (this.glow && (this.glow.t += dt) >= this.glow.dur) this.glow = null;
      if (this.elixirT > 0) this.elixirT -= dt;
      if (this.blizzardT > 0) this.blizzardT -= dt;
      if (this.burnTiles.length) { for (const b of this.burnTiles) b.t -= dt; this.burnTiles = this.burnTiles.filter(b => b.t > 0); }
      for (const p of this.pops) p.t += dt;
      this.pops = this.pops.filter(p => p.t < p.dur);
      this.enemies = this.enemies.filter(e => !e.dead && !e.leaked);

      this.checkEnd();
    }

    // 勝敗の判定（攻守反転モードでは上書きする）
    checkEnd() {
      if (this.lives <= 0) this.finish(false);
      else if (this.evIdx >= this.events.length && !this.enemies.length) this.finish(true);
    }

    spawn(type, s, g) {
      const def = TD.ENEMIES[type], route = this.routeFor(s || 0, g);
      const hp = Math.round(def.hp * this.stage.hpScale);
      const e = {
        def, route, idx: 1, x: route[0].x, y: route[0].y, hp, maxHp: hp, atk: def.atk * this.stage.hpScale,
        size: def.size, cd: def.interval, blockedBy: null, passed: new Set(), frozen: 0, slowT: 0, flash: 0, walk: Math.random() * 6,
      };
      this.enemies.push(e);
      if (def.boss) {
        this.toast(`ボス出現：${def.name}`);
        this.fx.push({ type: 'flash', t: 0, dur: 0.6, color: 'rgba(160,60,255,' });
      }
    }

    updateEnemies(dt) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        e.flash = Math.max(0, e.flash - dt);
        if (e.defDownT > 0) e.defDownT -= dt;
        if (e.slowShotT > 0) e.slowShotT -= dt;
        if (e.poisonT > 0) {
          e.poisonT -= dt;
          const P = TD.POISON, dmg = e.maxHp * TD.poisonRate(e.poison) * dt;
          // 伝染：毒が一定数たまった敵は、毎秒まわりの敵に毒を1つうつす（上限なし・ボスも同じ）
          if (e.poison >= P.spreadAt && (e.spreadT = (e.spreadT == null ? P.spreadEvery : e.spreadT) - dt) <= 0) {
            e.spreadT = P.spreadEvery;
            for (const o of this.enemies) {
              if (o === e || o.dead || o.leaked || dist(o, e) > this.poisonSpread * T) continue;
              this.addPoison(o, 1);
              this.fx.push({ type: 'beam', x: e.x, y: e.y, x2: o.x, y2: o.y, t: 0, dur: 0.35, color: '#c060ff' });
            }
          }
          e.hp -= dmg; e.poisonAcc = (e.poisonAcc || 0) + dmg;
          if (e.poisonAcc >= 1 && (e.poisonPopT = (e.poisonPopT || 0) - dt) <= 0) {
            this.pop(e.x + 6, e.y - e.size - 4, String(Math.round(e.poisonAcc)), '#b070ff', { size: 10 });
            e.poisonAcc = 0; e.poisonPopT = 1;
          }
          if (e.poisonT <= 0) e.poison = 0;
          this.checkKill(e);
          if (e.dead) continue;
        }
        // 即死攻撃の溜め中は動かない（足止めされていても溜めは止まらない）
        if (e.charging > 0) { e.charging -= dt; continue; }
        if (e.frozen > 0) { e.frozen -= dt; if (e.frozen <= 0) e.bound = false; continue; }
        if (e.blockedBy && e.blockedBy.removed) e.blockedBy = null;
        // 回復役：近くの仲間を回復する
        if (e.def.healer) this.healerHeal(e, dt);
        // ラスボス：力を溜めて、周囲のキャラを即死させる
        if (e.def.doom && this.units.length) {
          const dm = e.def.doom, p2 = e.hp / e.maxHp <= dm.phase2;
          e.doomCd = (e.doomCd == null ? dm.first : e.doomCd) - dt;
          if (e.doomCd <= 0) {
            e.doomCd = p2 ? dm.every2 : dm.every;
            e.charging = dm.charge;
            this.warns.push({ x: e.x, y: e.y, r: (p2 ? dm.radius2 : dm.radius) * T, t: 0, warn: dm.charge, kill: true, follow: e, src: e });
            this.toast(`${e.def.name.split(' ').pop()}が力を溜めている……！`);
            continue;
          }
        }
        // 光の障壁（結界の守護像）：一定時間ごとに数秒間、攻撃が効かなくなる
        if (e.def.barrier) {
          const br = e.def.barrier;
          if (e.barrierOn > 0) e.barrierOn -= dt;
          else if ((e.barrierCd = (e.barrierCd == null ? br.first : e.barrierCd) - dt) <= 0) {
            e.barrierCd = br.every; e.barrierOn = br.dur;
            this.toast('光の障壁！ しばらく攻撃が効かない');
          }
        }
        // 吹雪（グラキエスの残響）：一定時間ごとに、味方全員の射程を縮める
        if (e.def.blizzard) {
          const bz = e.def.blizzard;
          if ((e.blizT = (e.blizT == null ? bz.first : e.blizT) - dt) <= 0) {
            e.blizT = bz.every; this.blizzardT = bz.dur; this.blizzardMult = bz.mult;
            this.toast('吹雪が吹き荒れる……！ 射程が縮んだ');
            this.fx.push({ type: 'flash', t: 0, dur: 0.6, color: 'rgba(220,240,255,' });
          }
        }
        // ビーム：その場で力を溜め、味方1人を狙って直線上を撃ち抜く
        if (e.def.beam && this.units.length) {
          const bm = e.def.beam;
          e.beamCd = (e.beamCd == null ? bm.first : e.beamCd) - dt;
          if (e.beamCd <= 0) {
            const tgt = this.beamTarget(e);
            if (!tgt) e.beamCd = 0.5;
            else {
              e.beamCd = bm.every;
              e.charging = bm.charge;
              this.warns.push({ beam: true, x: e.x, y: e.y, target: tgt, t: 0, warn: bm.charge, src: e });
              continue;
            }
          }
        }
        // ボス：予兆付きの範囲攻撃
        if (e.def.aoe && this.units.length && (!e.def.aoe.below || e.hp / e.maxHp <= e.def.aoe.below)) {
          e.aoeT = (e.aoeT || 0) + dt;
          if (e.aoeT >= e.def.aoe.every) { e.aoeT = 0; this.castAoe(e); }
        }
        if (e.blockedBy) {
          e.cd -= dt;
          if (e.cd <= 0) { e.cd = e.def.interval; this.hurt(e, e.blockedBy); }
          continue;
        }
        // 遠距離攻撃：歩きながら射程内のキャラを撃つ（剣・盾以外も狙われる）
        if (e.def.ranged) {
          e.rcd = (e.rcd == null ? 1 : e.rcd) - dt;
          if (e.rcd <= 0) {
            let tgt = this.tauntUnit(e), bd = Infinity;
            if (!tgt) for (const u of this.units) { if (this.pas(u, 'stealth')) continue; const dd = dist(e, u); if (dd <= e.def.ranged * T && dd < bd) { bd = dd; tgt = u; } }
            if (tgt) {
              e.rcd = e.def.interval;
              this.shots.push({ x: e.x, y: e.y, target: tgt, src: e, enemyShot: true, speed: 260, color: TD.ELEMENTS[e.def.element].color });
            }
          }
        }
        e.walk += dt * 8;
        if (e.slowT > 0) e.slowT -= dt;
        let slowAura = 1;
        for (const u of this.units) { const p = this.pas(u, 'slowAura'); if (p && dist(e, u) <= this.rangeOf(u) * T) slowAura = Math.min(slowAura, p.mult); }
        let move = e.def.speed * T * dt * (e.slowT > 0 ? 0.5 : 1) * slowAura * (e.slowShotT > 0 ? e.slowShotMult : 1)
          * (e.poisonT > 0 ? this.poisonSlow : 1) * this.enemySlowAll * (this.rushT > 0 ? this.rushMult : 1);   // rush：攻守反転の権能「狂奔」
        // 回復役は前に出ず、キャラの射程に入ったら下がる
        if (e.def.healer) move = this.healerMove(e, move);
        if (move < 0) {
          let back = -move;
          while (back > 0 && e.idx > 1) {
            const tgt = e.route[e.idx - 1], dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy);
            if (d <= back) { e.x = tgt.x; e.y = tgt.y; e.idx--; back -= d; }
            else { e.x += dx / d * back; e.y += dy / d * back; back = 0; }
          }
          e.passed.clear();
          continue;
        }
        // ガーゴイル：道を外れ、拠点へまっすぐ飛んでくる
        if (e.def.offPath) {
          const gl = e.route[e.route.length - 1], dx = gl.x - e.x, dy = gl.y - e.y, d = Math.hypot(dx, dy);
          if (e.d0 == null) e.d0 = d || 1;
          if (d <= move) { e.x = gl.x; e.y = gl.y; e.idx = e.route.length; }
          else { e.x += dx / d * move; e.y += dy / d * move; e.idx = 1 + Math.floor((1 - d / e.d0) * (e.route.length - 2)); }
          move = 0;
        }
        while (move > 0 && e.idx < e.route.length) {
          const tgt = e.route[e.idx], dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy);
          if (d <= move) { e.x = tgt.x; e.y = tgt.y; e.idx++; move -= d; }
          else { e.x += dx / d * move; e.y += dy / d * move; move = 0; }
        }
        for (const u of this.units) {
          if (!u.melee || e.def.flying || e.passed.has(u.id)) continue;
          if (dist(e, u) < T * 0.45) {
            if (u.blocking.length < this.blockOf(u)) { u.blocking.push(e); e.blockedBy = u; e.cd = 0.3; }
            else e.passed.add(u.id);
            break;
          }
        }
        if (!e.blockedBy && e.idx >= e.route.length) {
          e.leaked = true;
          this.lives = Math.max(0, this.lives - (e.def.life || 1));
          this.fx.push({ type: 'flash', t: 0, dur: 0.35, color: 'rgba(255,60,60,' });
        }
      }
    }

    updateUnits(dt) {
      for (const u of [...this.units]) {
        if (u.removed) continue;
        u.flash = Math.max(0, u.flash - dt);
        u.blocking = u.blocking.filter(e => !e.dead && e.blockedBy === u);
        if (u.poisonT > 0) {
          u.poisonT -= dt;
          u.hp -= u.maxHp * u.poisonRatio * dt;
          if (u.hp <= 0) { this.removeUnit(u, false); continue; }
        }
        if (u.atkUpT > 0) u.atkUpT -= dt;
        // カリン（トリオ）：カリンとノクスは毎秒最大HPの2%回復
        if (u.hp < u.maxHp && this.regenIds && this.regenIds.has(u.card.id)) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * this.regenRate * dt);
        if (u.hasteT > 0) u.hasteT -= dt;
        if (u.shieldT > 0) u.shieldT -= dt;
        if (u.buff) { u.buffT -= dt; if (u.buffT <= 0) { u.buff = null; } }
        else if (u.def.skill) u.sp = Math.min(u.def.skill.sp, u.sp + dt);

        u.cd -= dt * this.rateOf(u);
        if (u.cd > 0) continue;
        const d = u.def, range = this.rangeOf(u) * T;

        if (d.role === 'priest') {
          const hurtAlly = this.units.filter(a => a.hp < a.maxHp && dist(a, u) <= range)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (hurtAlly) {
            u.cd = d.interval;
            const hu = this.pas(u, 'healUp');
            this.shots.push({ x: u.x, y: u.y, target: hurtAlly, heal: true, power: this.atkOf(u) * (hu ? hu.mult : 1), src: u, speed: 300, color: '#9dffb8' });
          }
          continue;
        }

        let target = null;
        if (u.melee && u.blocking.length) target = u.blocking[0];
        if (!target) {
          let best = -1;
          for (const e of this.enemies) {
            if (e.dead || dist(e, u) > range) continue;
            const prog = e.idx * 1000 - dist(e, e.route[Math.min(e.idx, e.route.length - 1)]);
            if (prog > best) { best = prog; target = e; }
          }
        }
        if (!target) continue;
        u.cd = d.interval;
        u.angle = Math.atan2(target.y - u.y, target.x - u.x);
        // 疾風二刀・風の双矢：射程内の別の敵にも同時に攻撃
        const targets = [target];
        let mp = this.pas(u, 'multi');
        // アカネ・シズク：相方と共に編成されていれば2体に攻撃
        const du = d.unique;
        if (!mp && du && du.type === 'duo' && this.cards.some(c => c.id === du.partner)) mp = du;
        if (mp) {
          const extra = this.enemies.filter(e => !e.dead && e !== target && dist(e, u) <= range)
            .sort((a, b) => (b.idx * 1000 - dist(b, b.route[Math.min(b.idx, b.route.length - 1)])) - (a.idx * 1000 - dist(a, a.route[Math.min(a.idx, a.route.length - 1)])));
          targets.push(...extra.slice(0, mp.count - 1));
        }
        // シエル：クロエと共に編成されていると、3回に1回の攻撃がビームになる
        const db = du && du.type === 'duoBeam' && this.cards.some(c => c.id === du.partner) ? du : null;
        if (db && (u.beamN = (u.beamN || 0) + 1) % db.every === 0) { this.unitBeam(u, target, db); continue; }
        for (const tg of targets) {
          if (u.melee) {
            // 英雄王リン「王の剣圧」：4回の追撃（黒い斬撃）
            //   周りに敵がいない → 攻撃した敵へ50%×4連撃（合計200%）
            //   周りに敵がいる   → 攻撃した敵へ100%、周りの敵へ100%ずつ、余った追撃は攻撃した敵へ25%ずつ
            if (du && du.type === 'cleave') {
              const around = this.enemies.filter(e => !e.dead && e !== tg && dist(e, tg) <= du.radius * T + 4).sort((a, b) => dist(a, tg) - dist(b, tg)).slice(0, du.count);
              const slash = (e, i, small) => this.fx.push({ type: 'blackSlash', x: e.x + (i - 1.5) * 5, y: e.y - (i - 1.5) * 4, t: -0.07 * i, dur: 0.3, a: Math.atan2(e.y - u.y, e.x - u.x) + (i % 2 ? 0.8 : -0.4), small });
              if (!around.length) {
                for (let i = 0; i < du.count && !tg.dead; i++) { this.hit(u, tg, this.atkOf(u) * du.soloMult); slash(tg, i, i > 0); }
              } else {
                this.hit(u, tg, this.atkOf(u)); slash(tg, 0, false);
                for (const e of around) { this.hit(u, e, this.atkOf(u)); slash(e, 0, true); }
                for (let i = around.length; i < du.count && !tg.dead; i++) { this.hit(u, tg, this.atkOf(u) * du.leftoverMult); slash(tg, i - around.length + 1, true); }
              }
              continue;
            }
            this.hit(u, tg, this.atkOf(u));
            this.fx.push({ type: 'slash', x: tg.x, y: tg.y, t: 0, dur: 0.2, color: TD.ELEMENTS[d.element].color, a: Math.atan2(tg.y - u.y, tg.x - u.x) });
          } else {
            this.shots.push({ x: u.x, y: u.y, target: tg, power: this.atkOf(u), src: u, splash: this.splashOf(u), speed: d.role === 'archer' ? 520 : 330,
                              color: TD.ELEMENTS[d.element].color, kind: d.role });
          }
        }
        // 連撃：攻撃するたびに加速
        const rp = this.pas(u, 'ramp');
        if (rp) u.ramp = Math.min(rp.max, (u.ramp || 0) + rp.step);
      }
    }

    // ---------- 回復役の敵 ----------
    // その位置がキャラ（回復役以外）の射程に入っているか
    inDanger(p) {
      return this.units.some(u => u.def.role !== 'priest' && dist(p, u) <= this.rangeOf(u) * T + 8);
    }
    // 道に沿って L だけ先の位置
    pointAhead(e, L) {
      let x = e.x, y = e.y, i = e.idx;
      while (L > 0 && i < e.route.length) {
        const t = e.route[i], d = Math.hypot(t.x - x, t.y - y);
        if (d <= L) { x = t.x; y = t.y; i++; L -= d; } else { x += (t.x - x) / d * L; y += (t.y - y) / d * L; L = 0; }
      }
      return { x, y };
    }
    progressOf(e) { return (e.idx - 1 + 1 - Math.min(1, dist(e, e.route[Math.min(e.idx, e.route.length - 1)]) / T)) / e.route.length; }
    // 戻り値：正なら前進、0 なら待機、負なら後退
    healerMove(e, move) {
      if (e.blockedBy) return move;
      const others = this.enemies.filter(o => !o.dead && !o.leaked && !o.def.healer);
      // 仲間がいなくなり、もう増援も来ないなら、覚悟を決めて前進する
      if (!others.length && this.evIdx >= this.events.length) return move;
      if (this.inDanger(e)) return -move * 1.2;
      const front = others.length ? Math.max(...others.map(o => this.progressOf(o))) : 0;
      if (this.progressOf(e) > front - e.def.healer.keep) return 0;
      return this.inDanger(this.pointAhead(e, move + T * 0.4)) ? 0 : move;
    }
    healerHeal(e, dt) {
      const h = e.def.healer;
      e.healT = (e.healT == null ? h.every : e.healT) - dt;
      if (e.healT > 0) return;
      const tgt = this.enemies.filter(o => !o.dead && !o.leaked && o.hp < o.maxHp && dist(o, e) <= h.radius * T)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!tgt) { e.healT = 0.4; return; }
      e.healT = h.every;
      const amt = Math.round(tgt.maxHp * h.ratio * (tgt.def.boss ? 0.3 : 1));
      tgt.hp = Math.min(tgt.maxHp, tgt.hp + amt);
      this.pop(tgt.x, tgt.y - tgt.size - 10, '+' + amt, '#7dffa0', { size: 12 });
      this.fx.push({ type: 'ring', x: tgt.x, y: tgt.y, r0: 4, r1: tgt.size + 8, t: 0, dur: 0.5, color: '#7dffa0', width: 3 });
      this.fx.push({ type: 'beam', x: e.x, y: e.y, x2: tgt.x, y2: tgt.y, t: 0, dur: 0.35, color: '#9dffb8' });
    }

    // 味方のビーム：狙った敵の方向へ、直線上の敵全員を貫く
    unitBeam(u, tg, db) {
      const dx = tg.x - u.x, dy = tg.y - u.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const len = Math.hypot(W, H), half = db.width * T / 2;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const px = e.x - u.x, py = e.y - u.y, along = px * ux + py * uy, perp = Math.abs(px * uy - py * ux);
        if (along < 0 || perp > half + e.size * 0.5) continue;
        this.hit(u, e, this.atkOf(u) * db.mult);
        this.fx.push({ type: 'burst', x: e.x, y: e.y, t: 0, dur: 0.45, color: '#fff3a0' });
      }
      this.fx.push({ type: 'laser', x: u.x, y: u.y, x2: u.x + ux * len, y2: u.y + uy * len, w: db.width * T * 0.8, t: 0, dur: 0.7, color: '#ffe066' });
    }

    // ---------- 流星雨 ----------
    updateMeteors(dt) {
      for (const sh of this.showers) {
        sh.t += dt;
        if (sh.t < sh.s.dur && (sh.next -= dt) <= 0) {
          sh.next = sh.s.every;
          // 着弾地点：一部はフィールドのどこか（完全ランダム）、残りは敵のどれかの近く（大きくばらつく）
          const alive = this.enemies.filter(e => !e.dead);
          let x, y;
          if (alive.length && Math.random() >= sh.s.wild) {
            const e = alive[Math.floor(Math.random() * alive.length)];
            x = e.x + (Math.random() - 0.5) * T * sh.s.spread; y = e.y + (Math.random() - 0.5) * T * sh.s.spread;
          } else { x = T / 2 + Math.random() * (W - T); y = T / 2 + Math.random() * (H - T); }
          x = Math.max(T / 2, Math.min(W - T / 2, x)); y = Math.max(T / 2, Math.min(H - T / 2, y));
          this.meteors.push({ sh, x, y, t: 0, fall: 0.45 });
        }
      }
      for (const m of this.meteors) {
        m.t += dt;
        if (m.t < m.fall) continue;
        m.done = true;
        const sh = m.sh, u = sh.src, R = sh.s.radius * T;
        for (const e of this.enemies) if (!e.dead && dist(e, m) <= R) this.hit(u, e, this.atkOf(u) * sh.s.mult, sh.burst);
        this.fx.push({ type: 'burst', x: m.x, y: m.y, t: 0, dur: 0.6, color: '#b070ff', big: true });
        this.fx.push({ type: 'ring', x: m.x, y: m.y, r0: 6, r1: R, t: 0, dur: 0.45, color: '#e0b0ff', width: 8 });
        this.fx.push({ type: 'flashDot', x: m.x, y: m.y, t: 0, dur: 0.3 });
        this.shake(3, 0.2);
      }
      this.meteors = this.meteors.filter(m => !m.done);
      for (const sh of this.showers) if (sh.t >= sh.s.dur && !this.meteors.some(m => m.sh === sh)) {
        sh.done = true;
        if (sh.burst && sh.burst.n) this.finishBurst(sh.burst, TD.STAR5_SHAKE.meteor);
      }
      this.showers = this.showers.filter(sh => !sh.done);
    }
    drawMeteor(g, m) {   // 右上から斜めに落ちてくる隕石と、着弾地点の影
      const p = Math.min(1, m.t / m.fall), sx = m.x + 120 * (1 - p), sy = m.y - 220 * (1 - p);
      g.fillStyle = `rgba(90,20,140,${0.25 + 0.35 * p})`;
      g.beginPath(); g.ellipse(m.x, m.y, 10 + 8 * p, 5 + 4 * p, 0, 0, Math.PI * 2); g.fill();
      const grd = g.createLinearGradient(sx + 40, sy - 70, sx, sy);
      grd.addColorStop(0, 'rgba(180,100,255,0)'); grd.addColorStop(1, 'rgba(230,190,255,.9)');
      g.strokeStyle = grd; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx + 40, sy - 70); g.lineTo(sx, sy); g.stroke(); g.lineCap = 'butt';
      g.fillStyle = '#fff2ff'; g.beginPath(); g.arc(sx, sy, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b070ff'; g.beginPath(); g.arc(sx, sy, 9, 0, Math.PI * 2); g.globalAlpha = 0.4; g.fill(); g.globalAlpha = 1;
    }

    // ---------- ビーム ----------
    // 射程内で一番近いキャラを狙う（隠れ身中は狙わない）
    beamTarget(e) {
      const R = e.def.beam.range * T;
      let best = this.tauntUnit(e), bd = Infinity;
      if (!best) for (const u of this.units) { if (this.pas(u, 'stealth')) continue; const d = dist(e, u); if (d <= R && d < bd) { bd = d; best = u; } }
      return best;
    }
    fireBeam(w) {
      const e = w.src, bm = e.def.beam, tg = w.target;
      const dx = tg.x - e.x, dy = tg.y - e.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const len = Math.hypot(W, H), x2 = e.x + ux * len, y2 = e.y + uy * len, half = bm.width * T / 2;
      // 発射口から先の直線上（幅 bm.width マス）にいるキャラ全員にダメージ
      for (const u of [...this.units]) {
        const px = u.x - e.x, py = u.y - e.y, along = px * ux + py * uy, perp = Math.abs(px * uy - py * ux);
        if (along < 0 || perp > half + 12) continue;
        if (this.pas(u, 'beamImmune') || (u.def.passive && u.def.passive.beamImmune)) {   // カグラ：ビームが効かない
          this.pop(u.x, u.y - 22, 'ビーム無効', '#ffd23f', { size: 12 });
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 18, r1: 26, t: 0, dur: 0.6, color: '#ffd23f', width: 4 });
          continue;
        }
        this.hurt(e, u, e.atk * bm.mult);
        this.fx.push({ type: 'burst', x: u.x, y: u.y, t: 0, dur: 0.7, color: '#ffb04a', big: true });
        this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 6, r1: 34, t: 0, dur: 0.6, color: '#fff1c0', width: 7 });
        this.fx.push({ type: 'flashDot', x: u.x, y: u.y, t: 0, dur: 0.35 });
      }
      this.fx.push({ type: 'laser', x: e.x, y: e.y, x2, y2, w: bm.width * T, t: 0, dur: bm.dur, color: TD.ELEMENTS[e.def.element].color });
      this.shake(5, 0.35);
    }

    castAoe(e) {
      const a = e.def.aoe, r = a.radius * T;
      // 一番多くのキャラを巻き込める位置を狙う
      let best = this.units.find(u => u.buff && u.buff.type === 'taunt') || null, bn = -1;
      if (!best) for (const u of this.units) {
        if (this.pas(u, 'stealth')) continue;
        const n = this.units.filter(o => dist(o, u) <= r).length;
        if (n > bn) { bn = n; best = u; }
      }
      if (!best) return;
      this.warns.push({ x: best.x, y: best.y, r, t: 0, warn: a.warn, power: e.atk * a.mult * (this.puniq.aoeHalf ? this.puniq.aoeHalf.mult : 1), src: e });
    }

    updateWarns(dt) {
      for (const w of this.warns) {
        w.t += dt;
        if (w.src.dead || w.src.leaked) { w.done = true; continue; }
        if (w.follow) { w.x = w.follow.x; w.y = w.follow.y; }
        if (w.beam) {
          w.x = w.src.x; w.y = w.src.y;
          // 狙っていたキャラがいなくなったら、狙い直す（誰もいなければ中止）
          if (w.target.removed) { const nt = this.beamTarget(w.src); if (nt) w.target = nt; else { w.done = true; w.src.charging = 0; continue; } }
          w.src.aimAt = w.target;
          if (w.t >= w.warn) { w.done = true; w.src.aimAt = null; this.fireBeam(w); }
          continue;
        }
        if (w.t >= w.warn && w.kill) {   // 即死攻撃
          w.done = true;
          for (const u of [...this.units]) {
            if (dist(u, w) > w.r) continue;
            if (u.def.unique && u.def.unique.type === 'invuln') { this.pop(u.x, u.y - 20, '無効', '#fff6c0', { size: 12 }); continue; }
            this.removeUnit(u, false);
            this.pop(u.x, u.y - 34, '即死', '#d070ff', { size: 14 });
          }
          this.fx.push({ type: 'flash', t: 0, dur: 0.7, color: 'rgba(120,20,200,' });
          this.fx.push({ type: 'ring', x: w.x, y: w.y, r0: 10, r1: w.r, t: 0, dur: 0.6, color: '#c060ff', width: 14 });
          this.fx.push({ type: 'burst', x: w.x, y: w.y, t: 0, dur: 0.7, color: '#7a2ad0', big: true });
          this.shake(10, 0.6);
          continue;
        }
        if (w.t >= w.warn) {
          w.done = true;
          for (const u of [...this.units]) if (dist(u, w) <= w.r) this.hurt(w.src, u, w.power);
          this.fx.push({ type: 'burst', x: w.x, y: w.y, t: 0, dur: 0.5, color: '#ff5a4a', big: true });
          this.fx.push({ type: 'ring', x: w.x, y: w.y, r0: 6, r1: w.r, t: 0, dur: 0.4, color: '#ff8a4a', width: 8 });
        }
      }
      this.warns = this.warns.filter(w => !w.done);
    }

    updateShots(dt) {
      for (const s of this.shots) {
        const t = s.target;
        if (t.dead || t.removed || t.leaked) { s.done = true; continue; }
        const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy), m = s.speed * dt;
        s.angle = Math.atan2(dy, dx);
        if (d <= m + 4) {
          s.done = true;
          if (s.enemyShot) {
            this.hurt(s.src, t);
          } else if (s.heal) {
            t.hp = Math.min(t.maxHp, t.hp + s.power);
            const hu = this.pas(s.src, 'healUp');
            if (hu && hu.cleanse && t.poisonT > 0) { t.poisonT = 0; this.pop(t.x, t.y - 32, '浄化', '#9dffb8', { size: 11 }); }
            this.pop(t.x, t.y - 18, '+' + Math.round(s.power), '#7dffa0', { size: 11 });
          } else if (s.splash) {
            const ps = s.src.def && s.src.def.passive && s.src.def.passive.type === 'poisonSplash' ? s.src.def.passive : null;
            for (const e of this.enemies) if (!e.dead && dist(e, t) <= s.splash * T) { this.hit(s.src, e, s.power); if (ps) this.addPoison(e, ps.stacks); }
            this.fx.push({ type: 'ring', x: t.x, y: t.y, r0: 4, r1: s.splash * T, t: 0, dur: 0.3, color: s.color });
          } else {
            this.hit(s.src, t, s.power, s.burst);
            if (s.addPoison && !t.dead) this.addPoison(t, s.addPoison);
            if (s.burst) { this.finishBurst(s.burst, s.burst.shake); this.fx.push({ type: 'burst', x: t.x, y: t.y, t: 0, dur: 0.6, color: s.color, big: true }); }
            const sl = s.src.def && s.src.def.passive && s.src.def.passive.type === 'slowShot' ? s.src.def.passive : null;
            if (sl && !t.dead) { t.slowShotT = sl.dur; t.slowShotMult = sl.mult; }
          }
        } else { s.x += dx / d * m; s.y += dy / d * m; }
      }
      this.shots = this.shots.filter(s => !s.done);
    }

    finish(win) {
      if (this.over) return;
      this.over = true;
      this.selected = null;
      this.hideMenu();
      const stars = !win ? 0 : this.lives === this.maxLives ? 3 : this.lives >= this.maxLives / 2 ? 2 : 1;
      setTimeout(() => this.onEnd({ win, stars, lives: this.lives, maxLives: this.maxLives, killed: this.killed, total: this.totalEnemies, skills: this.skillCount || 0 }), 900);
    }

    // ---------- UI更新 ----------
    refreshCards(force) {
      const now = performance.now();
      if (!force && now - (this._lastCardRefresh || 0) < 100) return;
      this._lastCardRefresh = now;
      for (const c of this.cards) {
        const el = c.el, d = c.def;
        el.classList.toggle('sel', this.selected === c);
        el.classList.toggle('deployed', c.state === 'deployed');
        el.classList.toggle('cooling', c.state === 'cool');
        el.classList.toggle('nomana', c.state === 'ready' && this.mana < d.cost);
        const ready = c.state === 'deployed' && !!d.skill && c.unit.sp >= d.skill.sp;
        el.classList.toggle('skill-ready', ready);
        c.spBar.style.width = c.state === 'deployed' && d.skill ? (c.unit.buff ? c.unit.buffT / c.unit.buff.dur * 100 : c.unit.sp / d.skill.sp * 100) + '%' : '0%';
        c.spBar.classList.toggle('active', !!(c.unit && c.unit.buff));
        c.coolEl.textContent = c.state === 'cool' ? Math.ceil(c.cd) : '';
      }
      const e = this.els;
      e.manaFill.style.width = (this.mana % 1) * 100 + '%';
      e.manaText.textContent = Math.floor(this.mana);
      e.lives.textContent = `${this.lives}/${this.maxLives}`;
      e.enemies.textContent = `${this.killed}/${this.totalEnemies}`;
      if (this.menuUnit && !this.menuUnit.removed) {
        const hpEl = e.menu.querySelector('.um-hp');
        if (hpEl) hpEl.textContent = `HP ${Math.ceil(this.menuUnit.hp)} / ${this.menuUnit.maxHp}`;
        const rt = e.menu.querySelector('.um-retreat');
        if (rt) rt.textContent = this.retreatLabel(this.menuUnit);
        const sk = e.menu.querySelector('.um-skill'), d = this.menuUnit.def;
        if (sk) {
          const ready = !!d.skill && this.menuUnit.sp >= d.skill.sp;
          sk.disabled = !ready;
          if (d.skill) sk.textContent = `発動スキル「${d.skill.name}」` + (ready ? '' : ` (${Math.floor(this.menuUnit.sp)}/${d.skill.sp})`);
        }
      }
    }

    // ---------- 描画 ----------
    draw() {
      const g = this.ctx;
      const sm = this.shakeT > 0 ? this.shakeMag * Math.min(1, this.shakeT / 0.3) : 0;
      const ox = sm ? (Math.random() * 2 - 1) * sm : 0, oy = sm ? (Math.random() * 2 - 1) * sm : 0;
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      if (sm) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
      g.setTransform(this.scale, 0, 0, this.scale, ox * this.scale, oy * this.scale);
      g.drawImage(this.bg, 0, 0, W, H);

      if (this.selected) {
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          if (!this.canDeploy(this.selected, x, y)) continue;
          g.fillStyle = 'rgba(120,255,170,.22)';
          g.fillRect(x * T + 2, y * T + 2, T - 4, T - 4);
          g.strokeStyle = 'rgba(160,255,200,.6)'; g.lineWidth = 1;
          g.strokeRect(x * T + 2.5, y * T + 2.5, T - 5, T - 5);
        }
      }
      if (this.menuUnit) {
        const u = this.menuUnit;
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.setLineDash([4, 4]);
        g.beginPath(); g.arc(u.x, u.y, this.rangeOf(u) * T, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      }

      for (const u of this.units) this.drawUnit(g, u);
      for (const e of [...this.enemies].sort((a, b) => a.y - b.y)) this.drawEnemy(g, e);
      for (const w of this.warns) this.drawWarn(g, w);
      for (const s of this.shots) this.drawShot(g, s);
      for (const c of this.cracks) if (c.open) {   // 結界の亀裂（黒紫の裂け目）
        const x = c.tile[0] * T + T / 2, y = c.tile[1] * T + T / 2, k = performance.now() / 300;
        const grd = g.createRadialGradient(x, y, 2, x, y, 19);
        grd.addColorStop(0, '#f0d0ff'); grd.addColorStop(0.35, '#5a1a8a'); grd.addColorStop(1, 'rgba(20,0,40,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, 19, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#1a0024'; g.lineWidth = 3; g.beginPath();
        g.moveTo(x - 14, y - 10); g.lineTo(x - 4, y - 2 + Math.sin(k) * 2); g.lineTo(x - 8, y + 6); g.lineTo(x + 3, y + 2); g.lineTo(x + 14, y + 12); g.stroke();
      }
      for (const b of this.burnTiles) {   // 燃えているマス
        const k = 0.5 + Math.sin(performance.now() / 120 + b.cx) * 0.2;
        g.fillStyle = `rgba(255,${80 + 40 * k},30,${0.35 + 0.2 * k})`; g.fillRect(b.cx * T + 3, b.cy * T + 3, T - 6, T - 6);
        g.fillStyle = '#ffd060'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🔥', b.cx * T + T / 2, b.cy * T + T / 2);
      }
      if (this.blizzardT > 0) { g.fillStyle = 'rgba(230,245,255,.18)'; g.fillRect(0, 0, W, H); }
      for (const m of this.meteors) this.drawMeteor(g, m);
      for (const f of this.fx) this.drawFx(g, f);
      if (this.glow) this.drawGlow(g, this.glow);
      for (const p of this.pops) this.drawPop(g, p);
    }

    // ★5スキル後、画面の縁が属性の色にうっすら光る
    drawGlow(g, gl) {
      const k = gl.t / gl.dur, a = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * 0.55;
      const grd = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, hexA(gl.color, a));
      g.fillStyle = grd; g.fillRect(-20, -20, W + 40, H + 40);
    }

    drawUnit(g, u) {
      const el = TD.ELEMENTS[u.def.element], t = performance.now() / 1000;
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.ellipse(u.x, u.y + 13, 13, 4, 0, 0, Math.PI * 2); g.fill();
      if (u.buff) {
        g.strokeStyle = u.buff.type === 'taunt' ? '#ff4a6a' : el.color; g.lineWidth = 2;
        g.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
        g.beginPath(); g.arc(u.x, u.y, 19, 0, Math.PI * 2); g.stroke();
        if (u.buff.type === 'taunt') { g.setLineDash([4, 6]); g.beginPath(); g.arc(u.x, u.y, u.buff.radius * T, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
        g.globalAlpha = 1;
      }
      if (u.poisonT > 0) { // 毒状態
        g.fillStyle = 'rgba(176,96,255,.35)'; g.beginPath(); g.arc(u.x, u.y, 16, 0, Math.PI * 2); g.fill();
      }
      if (u.shieldT > 0) { // 被ダメージ軽減の泡
        g.fillStyle = 'rgba(122,216,255,.18)'; g.strokeStyle = 'rgba(160,230,255,.7)'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(u.x, u.y, 21, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      if (u.def.unique && u.def.unique.type === 'invuln') { // 天使の加護
        g.strokeStyle = 'rgba(255,250,200,.8)'; g.lineWidth = 1.5;
        g.beginPath(); g.ellipse(u.x, u.y - 19, 8, 2.5, 0, 0, Math.PI * 2); g.stroke();
      }
      if (u.hasteT > 0) { // 攻撃速度アップの印
        g.strokeStyle = '#8affc0'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(u.x + 7, u.y - 15); g.lineTo(u.x + 11, u.y - 11); g.lineTo(u.x + 7, u.y - 7); g.stroke();
      }
      if (u.atkUpT > 0) { // 攻撃力アップの印
        g.fillStyle = '#ff8a3a';
        g.beginPath(); g.moveTo(u.x - 13, u.y - 9); g.lineTo(u.x - 9, u.y - 15); g.lineTo(u.x - 5, u.y - 9); g.closePath(); g.fill();
      }
      if (u.def.skill && u.sp >= u.def.skill.sp) {
        g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(u.x, u.y, 17 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2); g.stroke();
      }
      const grd = g.createRadialGradient(u.x - 4, u.y - 5, 2, u.x, u.y, 15);
      grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, el.color); grd.addColorStop(1, el.dark);
      // キャラアート（円形に切り抜き）
      g.save();
      g.beginPath(); g.arc(u.x, u.y, 15, 0, Math.PI * 2); g.clip();
      g.fillStyle = grd; g.fillRect(u.x - 15, u.y - 15, 30, 30);
      TD.drawCharBust(g, u.card.id, u.x - 15, u.y - 15, 30);
      if (u.flash > 0) { g.fillStyle = 'rgba(255,80,80,.55)'; g.fillRect(u.x - 15, u.y - 15, 30, 30); }
      g.restore();
      const rc = u.def.rarity === 6 ? '#c070ff' : u.def.rarity === 5 ? '#f2c94c' : u.def.rarity === 4 ? '#c8a8ff' : '#e8e8f0';
      g.strokeStyle = '#1b1410'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(u.x, u.y, 15, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rc; g.lineWidth = 2; g.stroke();
      if (u.def.adjutant) { // 副官の王冠
        g.fillStyle = '#ffd23f'; g.strokeStyle = '#7a4a08'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(u.x - 7, u.y - 15); g.lineTo(u.x - 7, u.y - 21); g.lineTo(u.x - 3.5, u.y - 18); g.lineTo(u.x, u.y - 23);
        g.lineTo(u.x + 3.5, u.y - 18); g.lineTo(u.x + 7, u.y - 21); g.lineTo(u.x + 7, u.y - 15); g.closePath(); g.fill(); g.stroke();
      }
      // 向き
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(u.x + Math.cos(u.angle) * 16, u.y + Math.sin(u.angle) * 16, 2.5, 0, Math.PI * 2); g.fill();
      // 職業バッジ
      g.fillStyle = '#1b1430'; g.strokeStyle = el.color; g.lineWidth = 1;
      g.beginPath(); g.arc(u.x + 11, u.y + 9, 6, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#fff';
      g.font = 'bold 8px "Hiragino Sans","Noto Sans JP",sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(TD.ROLES[u.def.role].glyph, u.x + 11, u.y + 9.5);
      // HP/SP
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(u.x - 15, u.y + 16, 30, 6);
      g.fillStyle = u.hp / u.maxHp > 0.35 ? '#6be37a' : '#ff6b5a';
      g.fillRect(u.x - 14, u.y + 17, 28 * Math.max(0, u.hp / u.maxHp), 2);
      g.fillStyle = u.buff ? '#ffd23f' : '#5fd0ff';
      const sp = u.buff ? u.buffT / u.buff.dur : u.def.skill ? u.sp / u.def.skill.sp : 0;
      g.fillRect(u.x - 14, u.y + 20, 28 * sp, 1.5);
    }

    drawEnemy(g, e) {
      const el = TD.ELEMENTS[e.def.element], s = e.size, bob = Math.sin(e.walk) * 1.5;
      if (e.def.echo) {   // 残響：黒い靄をまとい、半ば透けている
        const grd = g.createRadialGradient(e.x, e.y, 2, e.x, e.y, s * 1.9);
        grd.addColorStop(0, 'rgba(20,0,30,.55)'); grd.addColorStop(1, 'rgba(20,0,30,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(e.x, e.y, s * 1.9, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 0.72;
      }
      const fly = e.def.flying ? 9 + Math.sin(e.walk * 0.6) * 2 : 0;
      const x = e.x, y = e.y - fly + (e.blockedBy || e.frozen > 0 ? 0 : bob);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.ellipse(e.x, e.y + s * 0.8, s, s * 0.3, 0, 0, Math.PI * 2); g.fill();
      const body = e.flash > 0 ? '#ffffff' : e.frozen > 0 ? (e.bound ? '#ffc890' : '#bfe8ff') : e.slowT > 0 ? '#c8f5d8' : el.color;
      g.fillStyle = body;
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1.5;
      switch (e.def.shape) {
        case 'slime':
          g.beginPath(); g.moveTo(x - s, y + s * 0.6);
          g.quadraticCurveTo(x - s, y - s, x, y - s); g.quadraticCurveTo(x + s, y - s, x + s, y + s * 0.6);
          g.closePath(); g.fill(); g.stroke(); break;
        case 'goblin':
          g.beginPath(); g.moveTo(x - s, y - s * 0.5); g.lineTo(x - s * 1.5, y - s); g.lineTo(x - s * 0.6, y - s * 0.2); g.fill();
          g.beginPath(); g.moveTo(x + s, y - s * 0.5); g.lineTo(x + s * 1.5, y - s); g.lineTo(x + s * 0.6, y - s * 0.2); g.fill();
          g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); g.stroke(); break;
        case 'wolf':
          g.beginPath(); g.ellipse(x, y, s * 1.2, s * 0.8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.6); g.lineTo(x - s * 0.3, y - s * 1.3); g.lineTo(x, y - s * 0.7); g.fill();
          g.beginPath(); g.moveTo(x + s * 0.6, y - s * 0.6); g.lineTo(x + s * 0.3, y - s * 1.3); g.lineTo(x, y - s * 0.7); g.fill(); break;
        case 'lizard':
          g.beginPath(); g.ellipse(x, y, s, s * 0.85, 0, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = '#ffd36b';
          for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * 5 - 3, y - s * 0.7); g.lineTo(x + i * 5, y - s * 1.3); g.lineTo(x + i * 5 + 3, y - s * 0.7); g.fill(); }
          break;
        case 'gargoyle': { // 石の翼を持つ魔像：ゆっくり羽ばたき、角と牙がある
          const flap = Math.sin(e.walk * 0.9) * 0.35;
          g.save(); g.translate(x, y);
          for (const sd of [-1, 1]) {
            g.save(); g.scale(sd, 1); g.rotate(-0.2 + flap);
            g.beginPath(); g.moveTo(s * 0.5, -s * 0.2); g.lineTo(s * 2.1, -s * 1.0); g.lineTo(s * 1.7, -s * 0.2); g.lineTo(s * 2.0, s * 0.3); g.lineTo(s * 1.3, s * 0.1); g.lineTo(s * 0.5, s * 0.5); g.closePath(); g.fill(); g.stroke();
            g.restore();
          }
          g.beginPath(); g.ellipse(0, 0, s * 0.8, s * 0.95, 0, 0, Math.PI * 2); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(-s * 0.5, -s * 0.7); g.lineTo(-s * 0.7, -s * 1.3); g.lineTo(-s * 0.2, -s * 0.85); g.moveTo(s * 0.5, -s * 0.7); g.lineTo(s * 0.7, -s * 1.3); g.lineTo(s * 0.2, -s * 0.85); g.fill(); g.stroke();
          g.restore();
          break;
        }
        case 'harpy': { // 翼を羽ばたかせる鳥人
          const flap = Math.sin(e.walk * 1.6) * 0.5;
          g.save(); g.translate(x, y);
          for (const sd of [-1, 1]) {
            g.save(); g.scale(sd, 1); g.rotate(-0.3 + flap);
            g.beginPath(); g.moveTo(s * 0.4, 0); g.quadraticCurveTo(s * 1.6, -s * 1.2, s * 2.0, s * 0.2); g.quadraticCurveTo(s * 1.2, -s * 0.1, s * 0.4, s * 0.5); g.closePath(); g.fill(); g.stroke();
            g.restore();
          }
          g.restore();
          g.beginPath(); g.ellipse(x, y, s * 0.6, s * 0.8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
          break;
        }
        case 'eye': { // 魔眼：とげのある球体に大きな一つ目
          for (let i = 0; i < 8; i++) {
            const a = i / 8 * Math.PI * 2 + e.walk * 0.05;
            g.beginPath(); g.moveTo(x + Math.cos(a - 0.25) * s * 0.85, y + Math.sin(a - 0.25) * s * 0.85);
            g.lineTo(x + Math.cos(a) * s * 1.35, y + Math.sin(a) * s * 1.35); g.lineTo(x + Math.cos(a + 0.25) * s * 0.85, y + Math.sin(a + 0.25) * s * 0.85); g.fill();
          }
          g.beginPath(); g.arc(x, y, s * 0.95, 0, Math.PI * 2); g.fill(); g.stroke();
          break;
        }
        case 'ghost': { // 氷霊：すそが揺れる幽霊
          g.globalAlpha = 0.85;
          g.beginPath(); g.arc(x, y - s * 0.2, s * 0.9, Math.PI, 0);
          for (let i = 0; i <= 4; i++) g.lineTo(x + s * 0.9 - i * s * 0.45, y + s * 0.8 + (i % 2 ? -s * 0.3 : 0) + Math.sin(e.walk + i) * 1.5);
          g.closePath(); g.fill(); g.stroke(); g.globalAlpha = 1;
          break;
        }
        case 'fish':
          g.beginPath(); g.ellipse(x, y, s, s * 0.75, 0, 0, Math.PI * 2); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(x - s * 0.3, y - s * 0.7); g.lineTo(x, y - s * 1.4); g.lineTo(x + s * 0.4, y - s * 0.7); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x, y + s * 0.3, s * 0.6, s * 0.25, 0, 0, Math.PI * 2); g.fill();
          break;
        case 'golem':
          g.beginPath(); g.roundRect(x - s, y - s, s * 2, s * 1.9, 5); g.fill(); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.45)';
          g.beginPath(); g.moveTo(x - s * 0.7, y - s * 0.6); g.lineTo(x - s * 0.2, y - s * 0.9); g.lineTo(x - s * 0.4, y - s * 0.3); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.2); g.lineTo(x + s * 0.8, y - s * 0.2); g.lineTo(x + s * 0.7, y + s * 0.5); g.closePath(); g.fill();
          break;
        case 'mage':
          g.beginPath(); g.moveTo(x, y - s * 1.6); g.lineTo(x + s, y + s * 0.8); g.lineTo(x - s, y + s * 0.8); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#1b1430'; g.beginPath(); g.arc(x, y - s * 0.1, s * 0.55, 0, Math.PI * 2); g.fill();
          g.strokeStyle = '#c8a8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + s * 0.9, y + s); g.lineTo(x + s * 1.2, y - s * 1.2); g.stroke();
          g.fillStyle = '#e07aff'; g.beginPath(); g.arc(x + s * 1.2, y - s * 1.3, 3, 0, Math.PI * 2); g.fill();
          break;
        case 'skeleton':
          g.fillStyle = e.flash > 0 ? '#fff' : e.frozen > 0 ? '#bfe8ff' : '#e9e4d8';
          g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
          g.strokeStyle = el.color; g.lineWidth = 3; g.stroke();
          g.fillStyle = '#6c7380'; g.fillRect(x + s * 0.6, y - s * 1.2, 3, s * 2); break;
        case 'hero': { // かつての仲間：キャラの顔を丸く切り抜き、敵の印として赤い外枠
          const grd = g.createRadialGradient(x - 3, y - 4, 2, x, y, s);
          grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, el.color); grd.addColorStop(1, el.dark);
          g.save(); g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.clip();
          g.fillStyle = grd; g.fillRect(x - s, y - s, s * 2, s * 2);
          TD.drawCharBust(g, e.def.heroId, x - s, y - s, s * 2);
          if (e.flash > 0) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x - s, y - s, s * 2, s * 2); }
          else if (e.frozen > 0) { g.fillStyle = 'rgba(160,220,255,.45)'; g.fillRect(x - s, y - s, s * 2, s * 2); }
          g.restore();
          g.strokeStyle = '#1b1410'; g.lineWidth = 3.5; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.stroke();
          g.strokeStyle = '#ff4a5a'; g.lineWidth = 2; g.stroke();
          break;
        }
        case 'angel': { // 光の使徒：白い翼と金の光輪
          const flap = Math.sin(e.walk * 0.9) * 0.35;
          g.fillStyle = e.flash > 0 ? '#fff' : 'rgba(255,255,245,.92)';
          for (const sd of [-1, 1]) {
            g.save(); g.translate(x + sd * s * 0.6, y - s * 0.2); g.rotate(sd * (0.5 + flap));
            g.beginPath(); g.ellipse(sd * s * 0.7, 0, s * 0.9, s * 0.38, 0, 0, Math.PI * 2); g.fill(); g.restore();
          }
          g.fillStyle = body; g.beginPath(); g.arc(x, y, s * 0.8, 0, Math.PI * 2); g.fill(); g.stroke();
          g.strokeStyle = '#ffd86a'; g.lineWidth = 2;
          g.beginPath(); g.ellipse(x, y - s * 1.05, s * 0.55, s * 0.18, 0, 0, Math.PI * 2); g.stroke();
          break;
        }
        case 'knight': { // 王都騎士：兜と赤い羽根飾り、盾
          g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = e.flash > 0 ? '#fff' : '#8a93a6';
          g.beginPath(); g.arc(x, y - s * 0.2, s * 0.78, Math.PI, 0); g.fill();
          g.fillStyle = '#20242e'; g.fillRect(x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.22);
          g.fillStyle = '#d83a3a'; g.beginPath(); g.ellipse(x, y - s * 1.05, s * 0.22, s * 0.45, 0, 0, Math.PI * 2); g.fill();
          if (!e.def.ranged) {
            g.fillStyle = '#e8d48a'; g.strokeStyle = '#6a5420'; g.lineWidth = 1.2;
            g.beginPath(); g.moveTo(x + s * 0.7, y - s * 0.1); g.lineTo(x + s * 1.3, y - s * 0.1); g.lineTo(x + s * 1.3, y + s * 0.5); g.lineTo(x + s, y + s * 0.85); g.lineTo(x + s * 0.7, y + s * 0.5); g.closePath(); g.fill(); g.stroke();
          }
          break;
        }
        case 'boss': {
          g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); g.stroke();
          g.fillStyle = '#2a1a3a';
          g.beginPath(); g.moveTo(x - s * 0.7, y - s * 0.6); g.lineTo(x - s * 1.1, y - s * 1.6); g.lineTo(x - s * 0.3, y - s * 0.9); g.fill();
          g.beginPath(); g.moveTo(x + s * 0.7, y - s * 0.6); g.lineTo(x + s * 1.1, y - s * 1.6); g.lineTo(x + s * 0.3, y - s * 0.9); g.fill();
          const aura = performance.now() / 300;
          g.strokeStyle = 'rgba(180,100,255,.5)'; g.lineWidth = 2;
          g.beginPath(); g.arc(x, y, s + 4 + Math.sin(aura) * 2, 0, Math.PI * 2); g.stroke();
          break;
        }
      }
      if (e.poisonT > 0 && e.poison > 0) { // 毒：たまった数。段階で色が変わる（毒＝紫／伝染＝明るい紫＋輪／猛毒＝黒紫＋光）
        const P = TD.POISON, tier = e.poison >= P.toxicAt ? 2 : e.poison >= P.spreadAt ? 1 : 0;
        const bx = x - s - 4, by = e.y - s - 16;
        g.fillStyle = ['#9a50e0', '#d050ff', '#2a0040'][tier];
        if (tier === 2) { g.shadowColor = '#c040ff'; g.shadowBlur = 8; }
        g.beginPath(); g.arc(bx, by, 6.5, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0;
        if (tier >= 1) { g.strokeStyle = tier === 2 ? '#e080ff' : '#fff'; g.lineWidth = 1.2; g.beginPath(); g.arc(bx, by, 8.5, 0, Math.PI * 2); g.stroke(); }
        g.fillStyle = '#fff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(tier === 2 ? '猛' : String(e.poison), bx, by + 0.5);
        if (tier >= 1) { g.globalAlpha = 0.25 + 0.15 * Math.sin(e.walk * 2); g.fillStyle = tier === 2 ? '#40006a' : '#c060ff'; g.beginPath(); g.arc(x, y, s + 3, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      }
      if (e.slowShotT > 0) { g.strokeStyle = 'rgba(160,220,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, s + 2, 0.3, 1.3); g.stroke(); }
      if (e.defDownT > 0) { // 防御ダウン中
        g.strokeStyle = '#ffe066'; g.lineWidth = 1.5; g.setLineDash([3, 3]);
        g.beginPath(); g.arc(x, y, s + 4, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      }
      if (e.def.ranged && (e.def.shape === 'goblin' || e.def.shape === 'knight')) { // 弓兵の目印
        g.strokeStyle = '#8a5a2a'; g.lineWidth = 2;
        g.beginPath(); g.arc(x - s * 1.1, y, s * 0.9, -1.2, 1.2); g.stroke();
        g.strokeStyle = '#eee'; g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(x - s * 1.1 + Math.cos(-1.2) * s * 0.9, y + Math.sin(-1.2) * s * 0.9); g.lineTo(x - s * 1.1 + Math.cos(1.2) * s * 0.9, y + Math.sin(1.2) * s * 0.9); g.stroke();
      }
      // 目
      const eyeY = e.def.shape === 'slime' ? y - s * 0.2 : y - s * 0.15, eyeColor = e.def.boss ? '#ff3030' : '#1b1410';
      if (e.def.shape === 'hero' || e.def.shape === 'knight') { /* 顔・兜があるので目は描かない */ }
      else if (e.def.shape === 'eye') {   // 一つ目：狙っているキャラのほうを見る
        const at = e.aimAt, ang = at ? Math.atan2(at.y - y, at.x - x) : Math.PI / 2;
        g.fillStyle = '#fff6e8'; g.beginPath(); g.ellipse(x, y, s * 0.62, s * 0.5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = e.charging > 0 ? '#ff2a1a' : '#2a0a10';
        g.beginPath(); g.arc(x + Math.cos(ang) * s * 0.22, y + Math.sin(ang) * s * 0.18, s * 0.26, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = e.def.shape === 'skeleton' ? '#2a2030' : eyeColor;
        g.beginPath(); g.arc(x - s * 0.35, eyeY, s * 0.14 + 0.8, 0, Math.PI * 2); g.arc(x + s * 0.35, eyeY, s * 0.14 + 0.8, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      if (e.barrierOn > 0) {   // 光の障壁
        const k = 0.6 + Math.sin(performance.now() / 120) * 0.2;
        g.strokeStyle = `rgba(255,240,170,${k})`; g.lineWidth = 3; g.fillStyle = 'rgba(255,240,170,.18)';
        g.beginPath(); g.arc(x, y, s + 9, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      // HP
      const bw = Math.max(22, s * 2);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - bw / 2 - 1, e.y - s - 9, bw + 2, 5);
      g.fillStyle = e.def.boss ? '#c44dff' : '#ff5a4a';
      g.fillRect(x - bw / 2, e.y - s - 8, bw * Math.max(0, e.hp / e.maxHp), 3);
      if (e.def.healer) {   // 回復役の印（緑の十字）
        const cy = e.y - s - 18;
        g.fillStyle = '#0b2a14'; g.fillRect(x - 6, cy - 6, 12, 12);
        g.fillStyle = '#7dffa0'; g.fillRect(x - 1.5, cy - 4.5, 3, 9); g.fillRect(x - 4.5, cy - 1.5, 9, 3);
      }
      if (e.def.boss) {
        g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center';
        g.fillText('BOSS', x, e.y - s - 13);
      }
    }

    drawWarn(g, w) {
      if (w.beam) {   // ビームの照準：細い線が点滅しながら太くなり、発射口に光が集まる
        const p = Math.min(1, w.t / w.warn), tg = w.target;
        const dx = tg.x - w.x, dy = tg.y - w.y, L = Math.hypot(dx, dy) || 1, len = Math.hypot(W, H);
        const x2 = w.x + dx / L * len, y2 = w.y + dy / L * len;
        const blink = 0.45 + Math.sin(w.t * (10 + p * 20)) * 0.35;
        g.strokeStyle = `rgba(255,70,50,${0.25 + 0.5 * blink * p + 0.1})`; g.lineWidth = 1 + p * 3; g.setLineDash([10, 6]);
        g.beginPath(); g.moveTo(w.x, w.y); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
        // 狙われているキャラの照準マーク
        g.strokeStyle = `rgba(255,60,40,${0.6 + 0.4 * blink})`; g.lineWidth = 2;
        g.beginPath(); g.arc(tg.x, tg.y, 20 - p * 4, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(tg.x - 26, tg.y); g.lineTo(tg.x - 12, tg.y); g.moveTo(tg.x + 12, tg.y); g.lineTo(tg.x + 26, tg.y);
        g.moveTo(tg.x, tg.y - 26); g.lineTo(tg.x, tg.y - 12); g.moveTo(tg.x, tg.y + 12); g.lineTo(tg.x, tg.y + 26); g.stroke();
        // 発射口の光
        const col = TD.ELEMENTS[w.src.def.element].color, r = 4 + p * 12;
        const grd = g.createRadialGradient(w.x, w.y, 1, w.x, w.y, r * 1.8);
        grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.4, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(w.x, w.y, r * 1.8, 0, Math.PI * 2); g.fill();
        return;
      }
      if (w.kill) {   // 即死攻撃の溜め：紫黒の円がじわじわ満ちる
        const p = Math.min(1, w.t / w.warn), blink = 0.5 + Math.sin(w.t * (8 + p * 16)) * 0.3;
        g.fillStyle = `rgba(40,0,70,${0.25 + 0.25 * p})`;
        g.beginPath(); g.arc(w.x, w.y, w.r, 0, Math.PI * 2); g.fill();
        g.fillStyle = `rgba(190,80,255,${0.3 * blink + 0.1})`;
        g.beginPath(); g.arc(w.x, w.y, w.r * p, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#d070ff'; g.lineWidth = 3; g.setLineDash([8, 5]);
        g.beginPath(); g.arc(w.x, w.y, w.r, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
        g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const ly = Math.max(12, Math.min(H - 12, w.y - w.r + 14)), lt = `即死 ${Math.max(0, w.warn - w.t).toFixed(1)}`;
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(lt, w.x, ly);
        g.fillStyle = '#f0c8ff'; g.fillText(lt, w.x, ly);
        return;
      }
      const p = Math.min(1, w.t / w.warn), blink = 0.5 + Math.sin(w.t * 18) * 0.25;
      g.fillStyle = `rgba(255,60,40,${0.12 + 0.18 * p})`;
      g.beginPath(); g.arc(w.x, w.y, w.r, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgba(255,90,60,${0.35 * blink})`;
      g.beginPath(); g.arc(w.x, w.y, w.r * p, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ff4a3a'; g.lineWidth = 2; g.setLineDash([6, 4]);
      g.beginPath(); g.arc(w.x, w.y, w.r, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#fff'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', w.x, w.y - w.r + 10);
    }

    drawShot(g, s) {
      g.fillStyle = s.color;
      if (s.enemyShot) {
        g.globalAlpha = 0.5; g.beginPath(); g.arc(s.x, s.y, 6, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1; g.fillStyle = '#2a0a1a'; g.beginPath(); g.arc(s.x, s.y, 2.5, 0, Math.PI * 2); g.fill();
        return;
      }
      if (s.kind === 'archer') {
        g.save(); g.translate(s.x, s.y); g.rotate(s.angle || 0);
        g.fillRect(-8, -1, 12, 2); g.beginPath(); g.moveTo(6, -3); g.lineTo(10, 0); g.lineTo(6, 3); g.fill();
        g.restore();
      } else {
        g.globalAlpha = 0.4; g.beginPath(); g.arc(s.x, s.y, 7, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, 3, 0, Math.PI * 2); g.fill();
      }
    }

    drawFx(g, f) {
      if (f.t < 0) return;   // 少し遅れて出るエフェクト（連撃）
      const p = Math.max(0, Math.min(1, f.t / f.dur));   // 進行度は0〜1に収める（半径が負にならないように）
      switch (f.type) {
        case 'ring':
          g.strokeStyle = f.color; g.lineWidth = (f.width || 3) * (1 - p);
          g.globalAlpha = 1 - p;
          g.beginPath(); g.arc(f.x, f.y, f.r0 + (f.r1 - f.r0) * p, 0, Math.PI * 2); g.stroke();
          g.globalAlpha = 1; break;
        case 'burst': {
          g.fillStyle = f.color; g.globalAlpha = 1 - p;
          const n = f.big ? 16 : 8, r = (f.big ? 50 : 18) * p;
          for (let i = 0; i < n; i++) {
            const a = i / n * Math.PI * 2;
            g.beginPath(); g.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, (f.big ? 5 : 3) * (1 - p) + 1, 0, Math.PI * 2); g.fill();
          }
          g.globalAlpha = 1; break;
        }
        case 'soulRise': {   // 光の粒が、ゆっくり空へ昇っていく
          g.save();
          for (let i = 0; i < 22; i++) {
            const k = (p * 1.3 - i * 0.025), q = Math.max(0, Math.min(1, k));
            if (q <= 0) continue;
            const sx = f.x + Math.sin(f.seed + i * 1.7 + q * 4) * (10 + i * 1.2), sy = f.y - q * (f.y + 40);
            g.globalAlpha = (1 - q) * 0.9;
            g.fillStyle = i % 3 ? '#fff6d0' : '#bfe8ff';
            g.beginPath(); g.arc(sx, sy, 2.5 + (i % 4) * 0.6, 0, Math.PI * 2); g.fill();
          }
          g.globalAlpha = Math.max(0, 0.5 - p) ; g.fillStyle = '#fffbe8';
          g.beginPath(); g.arc(f.x, f.y, 26 * (1 - p), 0, Math.PI * 2); g.fill();
          g.restore(); g.globalAlpha = 1; break;
        }
        case 'blackSlash': {   // 黒い斬撃：紫に縁取られた漆黒の三日月が走る
          const R = f.big ? 26 : f.small ? 11 : 17, n = f.small ? 1 : 3, a0 = f.a - 2.3 + p * 0.6;
          g.save(); g.globalAlpha = 1 - p; g.lineCap = 'round';
          for (let i = 0; i < n; i++) {
            const off = (i - (n - 1) / 2) * 6;
            g.strokeStyle = '#a050ff'; g.lineWidth = (f.big ? 9 : 6) * (1 - p * 0.5);
            g.beginPath(); g.arc(f.x + off, f.y - off, R, a0, a0 + 1.9); g.stroke();
            g.strokeStyle = '#0a0410'; g.lineWidth = (f.big ? 5 : 3.5) * (1 - p * 0.5);
            g.beginPath(); g.arc(f.x + off, f.y - off, R, a0, a0 + 1.9); g.stroke();
          }
          g.restore(); g.globalAlpha = 1; break;
        }
        case 'laser': {   // ビーム本体：太い光の帯がしばらく残り、だんだん細く消える
          const fade = p < 0.15 ? 1 : 1 - (p - 0.15) / 0.85, wd = f.w * (p < 0.1 ? 0.6 + p * 4 : fade) + Math.sin(f.t * 40) * 1.5;
          g.save(); g.lineCap = 'round';
          g.globalAlpha = 0.35 * fade; g.strokeStyle = f.color; g.lineWidth = wd * 1.9;
          g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke();
          g.globalAlpha = 0.85 * fade; g.lineWidth = wd;
          g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke();
          g.globalAlpha = fade; g.strokeStyle = '#fffbe8'; g.lineWidth = Math.max(1, wd * 0.35);
          g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke();
          g.restore(); g.globalAlpha = 1; break;
        }
        case 'flashDot': {
          const grd = g.createRadialGradient(f.x, f.y, 1, f.x, f.y, 30);
          grd.addColorStop(0, `rgba(255,255,255,${1 - p})`); grd.addColorStop(1, 'rgba(255,200,100,0)');
          g.fillStyle = grd; g.beginPath(); g.arc(f.x, f.y, 30, 0, Math.PI * 2); g.fill(); break;
        }
        case 'beam':
          g.strokeStyle = f.color; g.globalAlpha = 1 - p; g.lineWidth = 3;
          g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke();
          g.globalAlpha = 1; break;
        case 'slash':
          g.strokeStyle = '#fff'; g.lineWidth = 3 * (1 - p); g.globalAlpha = 1 - p;
          g.beginPath(); g.arc(f.x, f.y, 12, f.a - 2.2, f.a - 0.6); g.stroke();
          g.strokeStyle = f.color; g.lineWidth = 1.5;
          g.beginPath(); g.arc(f.x, f.y, 15, f.a - 2.2, f.a - 0.6); g.stroke();
          g.globalAlpha = 1; break;
        case 'flash':
          g.fillStyle = f.color + (0.45 * (1 - p)) + ')';
          g.fillRect(0, 0, W, H); break;
      }
    }

    drawPop(g, p) {
      const k = p.t / p.dur, y = p.y - (p.bubble ? 4 : 14) * k;
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `bold ${p.size}px "Hiragino Sans","Noto Sans JP",sans-serif`;
      if (p.bubble) {
        const w = g.measureText(p.text).width + 12;
        const bx = Math.max(2, Math.min(W - w - 2, p.x - w / 2));
        g.fillStyle = 'rgba(20,16,30,.85)';
        g.beginPath(); g.roundRect(bx, y - 9, w, 18, 6); g.fill();
        g.fillStyle = p.color; g.fillText(p.text, bx + w / 2, y + 0.5);
      } else if (p.big) {
        // ★5スキルの数字：最初にポンと大きくなってから落ち着く
        const sc = k < 0.12 ? 0.6 + k / 0.12 * 0.7 : k < 0.25 ? 1.3 - (k - 0.12) / 0.13 * 0.3 : 1;
        const px = Math.max(30, Math.min(W - 30, p.x));
        g.save(); g.translate(px, y); g.scale(sc, sc);
        g.font = `900 ${p.size}px "Hiragino Sans","Noto Sans JP",sans-serif`;
        g.lineWidth = 5; g.strokeStyle = 'rgba(60,20,0,.9)'; g.strokeText(p.text, 0, 0);
        const lg = g.createLinearGradient(0, -p.size / 2, 0, p.size / 2);
        lg.addColorStop(0, '#fffbe0'); lg.addColorStop(0.5, p.color); lg.addColorStop(1, '#ff9a2a');
        g.fillStyle = lg; g.fillText(p.text, 0, 0);
        if (p.label) { g.font = 'bold 12px sans-serif'; g.lineWidth = 3; g.strokeText(p.label, 0, -p.size * 0.85); g.fillStyle = '#fff'; g.fillText(p.label, 0, -p.size * 0.85); }
        if (p.weak) { g.font = 'bold 10px sans-serif'; g.lineWidth = 3; g.strokeText('WEAK!', 0, -p.size * 0.75); g.fillStyle = '#ff9a3f'; g.fillText('WEAK!', 0, -p.size * 0.75); }
        g.restore();
      } else {
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)';
        g.strokeText(p.text, p.x, y); g.fillStyle = p.color; g.fillText(p.text, p.x, y);
        if (p.weak) {
          g.font = 'bold 9px sans-serif';
          g.strokeText('WEAK!', p.x, y - 12); g.fillStyle = '#ff9a3f'; g.fillText('WEAK!', p.x, y - 12);
        }
      }
      g.globalAlpha = 1;
    }
  }

  TD.Battle = Battle;
  TD.BATTLE_DIM = { T, COLS, ROWS, W, H };
  TD.BATTLE_SIZE = { W, H, T, COLS, ROWS };
})();
