// バトルエンジン
window.TD = window.TD || {};

(function () {
  const T = 40, COLS = 9, ROWS = 13, W = COLS * T, H = ROWS * T;
  const PATH = '#SG';
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  class Battle {
    constructor(stage, party, els, onEnd) {
      this.stage = stage;
      this.els = els;
      this.onEnd = onEnd;
      this.grid = stage.map.map(r => r.split(''));

      const spawns = [];
      let goal = null;
      this.grid.forEach((row, y) => row.forEach((c, x) => {
        if (c === 'S') spawns.push([x, y]);
        if (c === 'G') goal = [x, y];
      }));
      this.goal = goal;
      this.routes = spawns.map(s => this.findRoute(s, goal));

      this.events = [];
      for (const w of stage.waves)
        for (let i = 0; i < w.n; i++) this.events.push({ t: w.t + i * w.gap, e: w.e, s: w.s || 0 });
      this.events.sort((a, b) => a.t - b.t);
      this.evIdx = 0;
      this.totalEnemies = this.events.length;
      this.killed = 0;

      this.time = 0;
      this.mana = stage.mana;
      this.maxLives = this.lives = stage.lives;
      this.units = [];
      this.enemies = [];
      this.shots = [];
      this.fx = [];
      this.pops = [];
      // party: [{ id, def }]（def は育成状態を反映済みのステータス）
      this.cards = party.map(p => ({ id: p.id, def: p.def, state: 'ready', cd: 0, unit: null }));
      this.selected = null;
      this.menuUnit = null;
      this.speed = 1;
      this.paused = false;
      this.slowT = 0;
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
    findRoute(s, g) {
      const key = (x, y) => x + ',' + y;
      const prev = { [key(s[0], s[1])]: null };
      const q = [s];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === g[0] && y === g[1]) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          if (!PATH.includes(this.grid[ny][nx])) continue;
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
        if (PATH.includes(ch)) {
          g.fillStyle = (x + y) % 2 ? '#8a7560' : '#93806a';
          g.fillRect(px, py, T, T);
          g.fillStyle = 'rgba(0,0,0,.12)';
          g.fillRect(px + 6, py + 8, 7, 4); g.fillRect(px + 24, py + 26, 9, 4);
        } else {
          g.fillStyle = (x + y) % 2 ? '#3f6b3a' : '#447340';
          g.fillRect(px, py, T, T);
          g.fillStyle = 'rgba(255,255,255,.06)';
          g.fillRect(px + 10, py + 12, 2, 6); g.fillRect(px + 27, py + 22, 2, 6);
        }
        if (ch === 'x') {
          if ((x * 7 + y * 3) % 2) { // 木
            g.fillStyle = '#5b3d22'; g.fillRect(px + 17, py + 22, 6, 12);
            g.fillStyle = '#2b5a2a'; g.beginPath(); g.arc(px + 20, py + 17, 13, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#386e34'; g.beginPath(); g.arc(px + 16, py + 13, 7, 0, Math.PI * 2); g.fill();
          } else { // 岩
            g.fillStyle = '#6d7480'; g.beginPath(); g.ellipse(px + 20, py + 24, 15, 11, 0, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#8b939e'; g.beginPath(); g.ellipse(px + 16, py + 20, 7, 5, 0, 0, Math.PI * 2); g.fill();
          }
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
        el.className = `card el-${d.element}`;
        el.innerHTML =
          `<span class="c-cost">${d.cost}</span>` +
          `<span class="c-face">${TD.portraitHTML(card.id)}</span>` +
          `<span class="c-name">${d.name}</span>` +
          `<span class="c-sp"><i></i></span>` +
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
        if (card.unit.sp >= card.def.skill.sp) this.activateSkill(card.unit);
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
      if (this.mana < card.def.cost) return false;
      const ch = this.grid[cy][cx];
      return TD.ROLES[card.def.role].melee ? ch === '#' : ch === '.';
    }

    deploy(card, cx, cy) {
      const d = card.def;
      this.mana -= d.cost;
      const u = {
        id: ++this.uid, card, def: d, cx, cy, x: cx * T + T / 2, y: cy * T + T / 2,
        hp: d.hp, maxHp: d.hp, sp: 0, cd: 0.4, blocking: [], buff: null, buffT: 0,
        melee: TD.ROLES[d.role].melee, flash: 0, angle: -Math.PI / 2,
      };
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
      card.cd = card.def.redeploy;
      if (retreat) {
        const refund = Math.floor(card.def.cost / 2);
        this.mana = Math.min(99, this.mana + refund);
        this.pop(u.x, u.y - 20, `撤退 +${refund}`, '#9be7ff', { size: 12 });
      } else {
        this.fx.push({ type: 'burst', x: u.x, y: u.y, t: 0, dur: 0.5, color: '#ff8a8a' });
        this.pop(u.x, u.y - 20, '戦闘不能', '#ff8a8a', { size: 12 });
      }
      if (this.menuUnit === u) this.hideMenu();
      this.refreshCards(true);
    }

    showMenu(u) {
      this.menuUnit = u;
      const m = this.els.menu, d = u.def;
      const ready = u.sp >= d.skill.sp;
      m.innerHTML =
        `<div class="um-name">${d.name}<small>${TD.ELEMENTS[d.element].name}・${TD.ROLES[d.role].name}</small></div>` +
        `<div class="um-hp">HP ${Math.ceil(u.hp)} / ${u.maxHp}</div>` +
        `<button class="um-skill" ${ready ? '' : 'disabled'}>必殺技「${d.skill.name}」${ready ? '' : ` (${Math.floor(u.sp)}/${d.skill.sp})`}</button>` +
        `<button class="um-retreat">撤退（マナ+${Math.floor(d.cost / 2)}）</button>`;
      m.querySelector('.um-skill').onclick = () => { this.activateSkill(u); this.hideMenu(); };
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

    // ---------- 必殺技 ----------
    activateSkill(u) {
      const d = u.def, s = d.skill;
      if (u.removed || u.sp < s.sp || this.over) return;
      u.sp = 0;
      this.skillCount = (this.skillCount || 0) + 1;
      const alive = this.enemies.filter(e => !e.dead);
      const col = TD.ELEMENTS[d.element].color;
      switch (s.type) {
        case 'allStrike':
          for (const e of alive) this.hit(u, e, this.atkOf(u) * s.mult);
          this.fx.push({ type: 'flash', t: 0, dur: 0.5, color: 'rgba(255,240,170,' });
          break;
        case 'freeze':
          for (const e of alive) if (dist(e, u) <= s.radius * T) { e.frozen = s.dur; this.hit(u, e, this.atkOf(u) * s.mult); }
          this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 10, r1: s.radius * T, t: 0, dur: 0.6, color: '#bfe8ff', width: 6 });
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
        case 'explosion': {
          const inRange = alive.filter(e => dist(e, u) <= d.range * T);
          const c = inRange.sort((a, b) => b.hp - a.hp)[0] || u;
          for (const e of alive) if (dist(e, c) <= s.radius * T) this.hit(u, e, this.atkOf(u) * s.mult);
          this.fx.push({ type: 'ring', x: c.x, y: c.y, r0: 6, r1: s.radius * T, t: 0, dur: 0.6, color: '#ffb04a', width: 10 });
          this.fx.push({ type: 'burst', x: c.x, y: c.y, t: 0, dur: 0.6, color: '#ff6b4a', big: true });
          break;
        }
      }
      this.fx.push({ type: 'ring', x: u.x, y: u.y, r0: 8, r1: 34, t: 0, dur: 0.5, color: col, width: 4 });
      this.showCutin(u);
      this.slowT = 1.0;
      this.refreshCards(true);
    }

    showCutin(u) {
      const d = u.def, c = this.els.cutin;
      c.className = `cutin el-${d.element}`;
      c.innerHTML =
        `<div class="ci-band"></div>` +
        `<div class="ci-face">${TD.portraitHTML(u.card.id, true)}</div>` +
        `<div class="ci-text"><div class="ci-skill">${d.skill.name}</div><div class="ci-line">「${d.lines.skill}」</div></div>`;
      void c.offsetWidth;
      c.classList.add('show');
      clearTimeout(this._cutinT);
      this._cutinT = setTimeout(() => c.classList.remove('show'), 1300);
    }

    // ---------- ステータス ----------
    atkOf(u) { return u.def.atk * (u.buff && u.buff.atk ? u.buff.atk : 1); }
    defOf(u) { return u.def.def * (u.buff && u.buff.type === 'guard' ? 2 : 1); }
    blockOf(u) { return (u.def.block || 0) + (u.buff && u.buff.type === 'guard' ? 2 : 0); }
    rateOf(u) { return u.buff && u.buff.rate ? u.buff.rate : 1; }

    hit(src, e, power) {
      if (e.dead) return;
      const m = TD.elemMult(src.def.element, e.def.element);
      const raw = power * m;
      const d = Math.round(Math.max(raw - e.def.def, raw * 0.15));
      e.hp -= d;
      e.flash = 0.12;
      const color = m > 1 ? '#ffd23f' : m < 1 ? '#a8b0b8' : '#ffffff';
      this.pop(e.x + (Math.random() * 10 - 5), e.y - e.size - 6, String(d), color, { size: m > 1 ? 15 : 12, weak: m > 1 });
      if (e.hp <= 0) {
        e.dead = true;
        this.killed++;
        this.fx.push({ type: 'burst', x: e.x, y: e.y, t: 0, dur: 0.45, color: TD.ELEMENTS[e.def.element].color, big: e.def.boss });
        if (e.def.boss) this.fx.push({ type: 'flash', t: 0, dur: 0.8, color: 'rgba(255,255,255,' });
      }
    }

    hurt(e, u) {
      const m = TD.elemMult(e.def.element, u.def.element);
      const raw = e.atk * m;
      const d = Math.round(Math.max(raw - this.defOf(u), raw * 0.15));
      u.hp -= d;
      u.flash = 0.12;
      this.pop(u.x, u.y - 20, String(d), '#ff7a7a', { size: 11 });
      if (u.hp <= 0) this.removeUnit(u, false);
    }

    pop(x, y, text, color, o = {}) {
      this.pops.push({ x, y, text, color, size: o.size || 12, t: 0, dur: o.dur || 0.8, weak: o.weak, bubble: o.bubble });
    }

    // ---------- 更新 ----------
    loop(now) {
      let dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused && !this.over) {
        if (this.slowT > 0) { this.slowT -= dt; dt *= 0.2; }
        const steps = this.speed;
        for (let i = 0; i < steps; i++) this.update(dt);
      }
      this.draw();
      this.refreshCards(false);
      this.raf = requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
      if (this.over) return;
      this.time += dt;
      this.mana = Math.min(99, this.mana + dt);

      for (const c of this.cards) if (c.state === 'cool' && (c.cd -= dt) <= 0) { c.state = 'ready'; c.cd = 0; }

      while (this.evIdx < this.events.length && this.events[this.evIdx].t <= this.time) {
        const ev = this.events[this.evIdx++];
        this.spawn(ev.e, ev.s);
      }

      this.updateEnemies(dt);
      this.updateUnits(dt);
      this.updateShots(dt);

      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.dur);
      for (const p of this.pops) p.t += dt;
      this.pops = this.pops.filter(p => p.t < p.dur);
      this.enemies = this.enemies.filter(e => !e.dead && !e.leaked);

      if (this.lives <= 0) this.finish(false);
      else if (this.evIdx >= this.events.length && !this.enemies.length) this.finish(true);
    }

    spawn(type, s) {
      const def = TD.ENEMIES[type], route = this.routes[Math.min(s, this.routes.length - 1)];
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
        if (e.frozen > 0) { e.frozen -= dt; continue; }
        if (e.blockedBy && e.blockedBy.removed) e.blockedBy = null;
        if (e.blockedBy) {
          e.cd -= dt;
          if (e.cd <= 0) { e.cd = e.def.interval; this.hurt(e, e.blockedBy); }
          continue;
        }
        e.walk += dt * 8;
        if (e.slowT > 0) e.slowT -= dt;
        let move = e.def.speed * T * dt * (e.slowT > 0 ? 0.5 : 1);
        while (move > 0 && e.idx < e.route.length) {
          const tgt = e.route[e.idx], dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy);
          if (d <= move) { e.x = tgt.x; e.y = tgt.y; e.idx++; move -= d; }
          else { e.x += dx / d * move; e.y += dy / d * move; move = 0; }
        }
        for (const u of this.units) {
          if (!u.melee || e.passed.has(u.id)) continue;
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
        if (u.buff) { u.buffT -= dt; if (u.buffT <= 0) { u.buff = null; } }
        else u.sp = Math.min(u.def.skill.sp, u.sp + dt);

        u.cd -= dt * this.rateOf(u);
        if (u.cd > 0) continue;
        const d = u.def, range = d.range * T;

        if (d.role === 'priest') {
          const hurtAlly = this.units.filter(a => a.hp < a.maxHp && dist(a, u) <= range)
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (hurtAlly) {
            u.cd = d.interval;
            this.shots.push({ x: u.x, y: u.y, target: hurtAlly, heal: true, power: this.atkOf(u), src: u, speed: 300, color: '#9dffb8' });
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
        if (u.melee) {
          this.hit(u, target, this.atkOf(u));
          this.fx.push({ type: 'slash', x: target.x, y: target.y, t: 0, dur: 0.2, color: TD.ELEMENTS[d.element].color, a: u.angle });
        } else {
          this.shots.push({ x: u.x, y: u.y, target, power: this.atkOf(u), src: u, splash: d.splash, speed: d.role === 'archer' ? 520 : 330,
                            color: TD.ELEMENTS[d.element].color, kind: d.role });
        }
      }
    }

    updateShots(dt) {
      for (const s of this.shots) {
        const t = s.target;
        if (t.dead || t.removed || t.leaked) { s.done = true; continue; }
        const dx = t.x - s.x, dy = t.y - s.y, d = Math.hypot(dx, dy), m = s.speed * dt;
        s.angle = Math.atan2(dy, dx);
        if (d <= m + 4) {
          s.done = true;
          if (s.heal) {
            t.hp = Math.min(t.maxHp, t.hp + s.power);
            this.pop(t.x, t.y - 18, '+' + Math.round(s.power), '#7dffa0', { size: 11 });
          } else if (s.splash) {
            for (const e of this.enemies) if (!e.dead && dist(e, t) <= s.splash * T) this.hit(s.src, e, s.power);
            this.fx.push({ type: 'ring', x: t.x, y: t.y, r0: 4, r1: s.splash * T, t: 0, dur: 0.3, color: s.color });
          } else this.hit(s.src, t, s.power);
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
        const ready = c.state === 'deployed' && c.unit.sp >= d.skill.sp;
        el.classList.toggle('skill-ready', ready);
        c.spBar.style.width = c.state === 'deployed' ? (c.unit.buff ? c.unit.buffT / c.unit.buff.dur * 100 : c.unit.sp / d.skill.sp * 100) + '%' : '0%';
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
        const sk = e.menu.querySelector('.um-skill'), d = this.menuUnit.def;
        if (sk) {
          const ready = this.menuUnit.sp >= d.skill.sp;
          sk.disabled = !ready;
          sk.textContent = `必殺技「${d.skill.name}」` + (ready ? '' : ` (${Math.floor(this.menuUnit.sp)}/${d.skill.sp})`);
        }
      }
    }

    // ---------- 描画 ----------
    draw() {
      const g = this.ctx;
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
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
        g.beginPath(); g.arc(u.x, u.y, u.def.range * T, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      }

      for (const u of this.units) this.drawUnit(g, u);
      for (const e of [...this.enemies].sort((a, b) => a.y - b.y)) this.drawEnemy(g, e);
      for (const s of this.shots) this.drawShot(g, s);
      for (const f of this.fx) this.drawFx(g, f);
      for (const p of this.pops) this.drawPop(g, p);
    }

    drawUnit(g, u) {
      const el = TD.ELEMENTS[u.def.element], t = performance.now() / 1000;
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.ellipse(u.x, u.y + 13, 13, 4, 0, 0, Math.PI * 2); g.fill();
      if (u.buff) {
        g.strokeStyle = el.color; g.lineWidth = 2;
        g.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
        g.beginPath(); g.arc(u.x, u.y, 19, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
      }
      if (u.sp >= u.def.skill.sp) {
        g.strokeStyle = '#ffd23f'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(u.x, u.y, 17 + Math.sin(t * 6) * 1.5, 0, Math.PI * 2); g.stroke();
      }
      const grd = g.createRadialGradient(u.x - 4, u.y - 5, 2, u.x, u.y, 15);
      grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, el.color); grd.addColorStop(1, el.dark);
      // キャラアート（円形に切り抜き）
      const img = TD.charImage(u.card.id);
      g.save();
      g.beginPath(); g.arc(u.x, u.y, 15, 0, Math.PI * 2); g.clip();
      g.fillStyle = grd; g.fillRect(u.x - 15, u.y - 15, 30, 30);
      if (img.complete && img.naturalWidth) g.drawImage(img, u.x - 15, u.y - 15, 30, 30);
      if (u.flash > 0) { g.fillStyle = 'rgba(255,80,80,.55)'; g.fillRect(u.x - 15, u.y - 15, 30, 30); }
      g.restore();
      const rc = u.def.rarity === 5 ? '#f2c94c' : u.def.rarity === 4 ? '#c8a8ff' : '#e8e8f0';
      g.strokeStyle = '#1b1410'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(u.x, u.y, 15, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = rc; g.lineWidth = 2; g.stroke();
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
      const sp = u.buff ? u.buffT / u.buff.dur : u.sp / u.def.skill.sp;
      g.fillRect(u.x - 14, u.y + 20, 28 * sp, 1.5);
    }

    drawEnemy(g, e) {
      const el = TD.ELEMENTS[e.def.element], s = e.size, bob = Math.sin(e.walk) * 1.5;
      const x = e.x, y = e.y + (e.blockedBy || e.frozen > 0 ? 0 : bob);
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath(); g.ellipse(e.x, e.y + s * 0.8, s, s * 0.3, 0, 0, Math.PI * 2); g.fill();
      const body = e.flash > 0 ? '#ffffff' : e.frozen > 0 ? '#bfe8ff' : e.slowT > 0 ? '#c8f5d8' : el.color;
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
        case 'skeleton':
          g.fillStyle = e.flash > 0 ? '#fff' : e.frozen > 0 ? '#bfe8ff' : '#e9e4d8';
          g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
          g.strokeStyle = el.color; g.lineWidth = 3; g.stroke();
          g.fillStyle = '#6c7380'; g.fillRect(x + s * 0.6, y - s * 1.2, 3, s * 2); break;
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
      // 目
      const eyeY = e.def.shape === 'slime' ? y - s * 0.2 : y - s * 0.15, eyeColor = e.def.boss ? '#ff3030' : '#1b1410';
      g.fillStyle = e.def.shape === 'skeleton' ? '#2a2030' : eyeColor;
      g.beginPath(); g.arc(x - s * 0.35, eyeY, s * 0.14 + 0.8, 0, Math.PI * 2); g.arc(x + s * 0.35, eyeY, s * 0.14 + 0.8, 0, Math.PI * 2); g.fill();
      // HP
      const bw = Math.max(22, s * 2);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - bw / 2 - 1, e.y - s - 9, bw + 2, 5);
      g.fillStyle = e.def.boss ? '#c44dff' : '#ff5a4a';
      g.fillRect(x - bw / 2, e.y - s - 8, bw * Math.max(0, e.hp / e.maxHp), 3);
      if (e.def.boss) {
        g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.textAlign = 'center';
        g.fillText('BOSS', x, e.y - s - 13);
      }
    }

    drawShot(g, s) {
      g.fillStyle = s.color;
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
      const p = f.t / f.dur;
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
  TD.BATTLE_SIZE = { W, H, T, COLS, ROWS };
})();
