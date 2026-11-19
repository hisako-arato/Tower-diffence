// 画面遷移・ホーム・編成/育成・召喚・ステージ選択・設定
window.TD = window.TD || {};

TD.portraitHTML = function (id, big) {
  const d = TD.CHARS[id];
  return `<span class="pt el-${d.element}${big ? ' big' : ''}"><b>${d.name[0]}</b><i>${TD.ROLES[d.role].glyph}</i></span>`;
};
TD.starsHTML = (n, max = 5) => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(Math.max(0, max - n))}</span></span>`;
TD.elemChip = el => `<span class="chip el-${el}">${TD.ELEMENTS[el].name}</span>`;
TD.lbHTML = lb => `<span class="lb">${'◆'.repeat(lb)}<span class="off">${'◆'.repeat(TD.GROWTH.maxLB - lb)}</span></span>`;

(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let save = TD.Save.load();
  let battle = null, currentStage = null;
  const persist = () => TD.Save.store(save);
  const owns = id => save.owned.includes(id);

  // ---------- 共通 ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id === 'screen-home') renderHome();
    if (id === 'screen-stages') renderStages();
    if (id === 'screen-party') renderParty();
    if (id === 'screen-summon') renderSummon();
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));

  function modal(html, cls = '') {
    const m = $('#modal');
    m.querySelector('.modal-body').innerHTML = html;
    m.querySelector('.modal-body').className = 'modal-body ' + cls;
    m.classList.add('show');
    return m.querySelector('.modal-body');
  }
  function closeModal() { $('#modal').classList.remove('show'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && !$('#modal .modal-body').classList.contains('locked')) closeModal(); });

  function updateCurrency() {
    document.querySelectorAll('.stones-val').forEach(e => e.textContent = save.stones);
    document.querySelectorAll('.crystals-val').forEach(e => e.textContent = save.crystals);
  }

  function alertBox(text) {
    const body = modal(`<p class="alert-text">${esc(text)}</p><div class="btn-row"><button class="btn primary">OK</button></div>`);
    body.querySelector('button').onclick = closeModal;
  }

  // ---------- ホーム ----------
  let lineIdx = 0;
  function renderHome() {
    updateCurrency();
    const cleared = Object.keys(save.cleared).length;
    $('#home-progress').textContent = `第1章 進行度 ${cleared}/${TD.STAGES.length}・英雄 ${save.owned.length}/${Object.keys(TD.CHARS).length}`;
  }
  function naviSay(text) {
    const b = $('#navi-bubble');
    b.textContent = text;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  $('#navi').addEventListener('click', () => {
    lineIdx = (lineIdx + 1) % TD.NAVI_LINES.length;
    naviSay(TD.NAVI_LINES[lineIdx]);
    const n = $('#navi');
    n.classList.remove('poke'); void n.offsetWidth; n.classList.add('poke');
  });
  $('#btn-settings').addEventListener('click', openSettings);

  function checkGift() {
    if (save.giftReceived) return;
    save.giftReceived = true;
    save.stones += TD.GACHA.starterGift;
    persist();
    updateCurrency();
    const body = modal(
      `<div class="gift"><div class="gift-title">召喚士さまへの贈り物</div>` +
      `<div class="gift-item"><i class="gem big"></i>魔晶石 ×${TD.GACHA.starterGift}</div>` +
      `<p>結界の精霊ルミナより。<br>「召喚」で新たな英雄を呼び出しましょう！</p></div>` +
      `<div class="btn-col"><button class="btn primary" data-act="summon">召喚へ</button><button class="btn ghost" data-act="close">あとで</button></div>`, 'locked');
    body.querySelector('[data-act=summon]').onclick = () => { closeModal(); show('screen-summon'); };
    body.querySelector('[data-act=close]').onclick = closeModal;
  }

  // ---------- ステージ選択 ----------
  function stageUnlocked(i) { return i === 0 || save.cleared[TD.STAGES[i - 1].id] > 0; }
  function renderStages() {
    updateCurrency();
    const list = $('#stage-list');
    list.innerHTML = `<div class="chapter-title">${TD.STAGES[0].chapter}</div>`;
    TD.STAGES.forEach((st, i) => {
      const open = stageUnlocked(i), best = save.cleared[st.id] || 0;
      const el = document.createElement('button');
      el.className = 'stage-item' + (open ? '' : ' locked') + (st.waves.some(w => TD.ENEMIES[w.e].boss) ? ' boss' : '');
      el.innerHTML = `<span class="st-id">${st.id}</span><span class="st-name">${st.name}<small>経験の結晶 ×${TD.stageExp(st)}</small></span>` +
        `<span class="st-stars">${open ? TD.starsHTML(best, 3) : '🔒'}</span>`;
      if (open) el.addEventListener('click', () => openBrief(st));
      list.appendChild(el);
    });
  }

  function openBrief(st) {
    const types = [...new Set(st.waves.map(w => w.e))];
    const enemies = types.map(t => {
      const e = TD.ENEMIES[t];
      return `<li>${TD.elemChip(e.element)}${esc(e.name)}${e.boss ? ' <b class="boss-tag">BOSS</b>' : ''}</li>`;
    }).join('');
    const party = save.party.map(id => `<span class="bp">${TD.portraitHTML(id)}<small>Lv${save.chars[id].lv}</small></span>`).join('');
    const first = !save.cleared[st.id];
    const body = modal(
      `<div class="brief-head"><span class="st-id">${st.id}</span>${esc(st.name)}</div>` +
      `<div class="brief-navi"><span class="mini-navi"></span><p>${esc(st.brief)}</p></div>` +
      `<div class="brief-sec">出現する敵</div><ul class="enemy-list">${enemies}</ul>` +
      `<div class="brief-sec">出撃メンバー</div><div class="brief-party">${party}</div>` +
      `<div class="brief-sub">ライフ ${st.lives}・初期マナ ${st.mana}<br>報酬：経験の結晶 ×${TD.stageExp(st)}・魔晶石 ×${first ? st.reward + '（初回）' : 5}</div>` +
      `<div class="btn-row"><button class="btn ghost" data-act="party">編成する</button><button class="btn primary" data-act="go">出撃！</button></div>`);
    body.querySelector('[data-act=party]').onclick = () => { closeModal(); show('screen-party'); };
    body.querySelector('[data-act=go]').onclick = () => { closeModal(); startBattle(st); };
  }

  // ---------- バトル ----------
  const bEls = {
    canvas: $('#battle-canvas'), cards: $('#deploy-cards'), manaFill: $('#mana-fill'), manaText: $('#mana-text'),
    lives: $('#hud-lives'), enemies: $('#hud-enemies'), menu: $('#unit-menu'), cutin: $('#cutin'), toast: $('#battle-toast'),
  };

  function startBattle(st) {
    if (battle) battle.destroy();
    currentStage = st;
    show('screen-battle');
    $('#hud-stage').textContent = `${st.id} ${st.name}`;
    $('#btn-speed').textContent = '▶ x1';
    const party = save.party.map(id => ({ id, def: TD.charStats(id, save.chars[id]) }));
    battle = new TD.Battle(st, party, bEls, onBattleEnd);
    TD.currentBattle = battle;
    const banner = $('#battle-banner');
    banner.innerHTML = `<div class="bn-sub">${esc(st.chapter)}</div><div class="bn-main">${st.id} ${esc(st.name)}</div><div class="bn-start">BATTLE START</div>`;
    banner.classList.remove('show'); void banner.offsetWidth; banner.classList.add('show');
  }

  $('#btn-speed').addEventListener('click', () => {
    if (!battle) return;
    battle.speed = battle.speed === 1 ? 2 : 1;
    $('#btn-speed').textContent = `▶ x${battle.speed}`;
  });
  $('#btn-pause').addEventListener('click', () => {
    if (!battle || battle.over) return;
    battle.paused = true;
    const body = modal(
      `<div class="pause-title">一時停止中</div>` +
      `<div class="btn-col"><button class="btn primary" data-act="resume">再開する</button>` +
      `<button class="btn ghost" data-act="retry">最初からやり直す</button>` +
      `<button class="btn danger" data-act="quit">撤退してステージ選択へ</button></div>`, 'locked');
    body.querySelector('[data-act=resume]').onclick = () => { closeModal(); battle.paused = false; battle.last = performance.now(); };
    body.querySelector('[data-act=retry]').onclick = () => { closeModal(); startBattle(currentStage); };
    body.querySelector('[data-act=quit]').onclick = () => { closeModal(); battle.destroy(); battle = null; show('screen-stages'); };
  });

  function onBattleEnd(r) {
    const st = currentStage;
    let stones = 0, notes = [];
    const exp = r.win ? TD.stageExp(st) : Math.round(TD.stageExp(st) * 0.2);
    if (r.win) {
      const prev = save.cleared[st.id] || 0;
      if (!prev) { stones += st.reward; notes.push(`初回クリア ×${st.reward}`); }
      else { stones += 5; notes.push('クリア報酬 ×5'); }
      if (r.stars === 3 && prev < 3) { stones += 20; notes.push('★3達成 ×20'); }
      save.cleared[st.id] = Math.max(prev, r.stars);
    }
    save.stones += stones;
    save.crystals += exp;
    persist();
    const next = TD.STAGES[TD.STAGES.indexOf(st) + 1];
    const body = modal(
      `<div class="result ${r.win ? 'win' : 'lose'}">` +
      `<div class="res-title">${r.win ? 'VICTORY' : 'DEFEAT'}</div>` +
      (r.win ? `<div class="res-stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>` : `<div class="res-msg">結界が破られてしまった……<br><small>キャラを育成して再挑戦しましょう</small></div>`) +
      `<div class="res-stats">撃破 ${r.killed}/${r.total}・残りライフ ${r.lives}/${r.maxLives}</div>` +
      (r.win ? `<div class="res-cond"><div class="${r.stars >= 1 ? 'ok' : ''}">★ ステージクリア</div><div class="${r.stars >= 2 ? 'ok' : ''}">★ ライフを半分以上残す</div><div class="${r.stars >= 3 ? 'ok' : ''}">★ ライフを減らさずクリア</div></div>` : '') +
      `<div class="res-reward">` +
      `<div><i class="crystal"></i> 経験の結晶 +${exp}</div>` +
      (stones ? `<div><i class="gem"></i> 魔晶石 +${stones}</div><small>${notes.join(' / ')}</small>` : '') +
      `</div></div>` +
      `<div class="btn-col">` +
      (r.win && next ? `<button class="btn primary" data-act="next">次のステージへ</button>` : '') +
      (!r.win ? `<button class="btn primary" data-act="party">育成する</button>` : '') +
      `<button class="btn ${r.win && next ? 'ghost' : r.win ? 'primary' : 'ghost'}" data-act="retry">もう一度</button>` +
      `<button class="btn ghost" data-act="stages">ステージ選択へ</button></div>`, 'locked');
    const leave = () => { closeModal(); if (battle) { battle.destroy(); battle = null; } };
    const on = (act, fn) => { const b = body.querySelector(`[data-act=${act}]`); if (b) b.onclick = fn; };
    on('next', () => { leave(); show('screen-stages'); openBrief(next); });
    on('party', () => { leave(); show('screen-party'); });
    on('retry', () => { leave(); startBattle(st); });
    on('stages', () => { leave(); show('screen-stages'); });
  }

  // ---------- 編成・育成 ----------
  let partySel = null;
  function renderParty() {
    updateCurrency();
    const slots = $('#party-slots');
    slots.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const id = save.party[i], el = document.createElement('button');
      el.className = 'slot' + (id ? '' : ' empty');
      el.innerHTML = id ? `${TD.portraitHTML(id)}<span>Lv${save.chars[id].lv}</span>` : '<span>空き</span>';
      if (id) el.addEventListener('click', () => { partySel = id; renderParty(); });
      slots.appendChild(el);
    }
    const roster = $('#roster');
    roster.innerHTML = '';
    const ids = Object.keys(TD.CHARS).sort((a, b) =>
      (owns(b) - owns(a)) || (TD.CHARS[b].rarity - TD.CHARS[a].rarity));
    for (const id of ids) {
      const d = TD.CHARS[id], el = document.createElement('button'), have = owns(id);
      el.className = `char-card r${d.rarity}` + (have ? '' : ' unowned') + (save.party.includes(id) ? ' in-party' : '') + (partySel === id ? ' sel' : '');
      el.innerHTML = `${TD.portraitHTML(id)}<span class="cc-name">${have ? d.name : '？？？'}</span>${TD.starsHTML(d.rarity, 0)}` +
        (have ? `<span class="cc-lv">Lv${save.chars[id].lv}</span>${TD.lbHTML(save.chars[id].lb)}` : '<span class="cc-lv">未所持</span>');
      el.addEventListener('click', () => { partySel = id; renderParty(); });
      roster.appendChild(el);
    }
    renderDetail();
  }

  function lvUpCost(from, to) {
    let c = 0;
    for (let l = from; l < to; l++) c += TD.GROWTH.expCost(l);
    return c;
  }

  function renderDetail() {
    const box = $('#char-detail');
    if (!partySel) { box.innerHTML = '<p class="hint">キャラをタップすると詳細が表示されます。<br>出撃メンバーは最大6人です。</p>'; return; }
    const id = partySel, base = TD.CHARS[id], r = TD.ROLES[base.role], have = owns(id);
    if (!have) {
      box.innerHTML =
        `<div class="cd-head">${TD.portraitHTML(id, true)}<div><div class="cd-title">${base.title}</div>` +
        `<div class="cd-name">？？？</div>${TD.starsHTML(base.rarity, 0)} ${TD.elemChip(base.element)}<span class="chip role">${r.name}</span></div></div>` +
        `<p class="hint">まだ出会っていない英雄です。「召喚」で仲間にしましょう。</p>` +
        `<button class="btn primary" data-go-summon>召喚へ</button>`;
      box.querySelector('[data-go-summon]').onclick = () => show('screen-summon');
      return;
    }
    const prog = save.chars[id], d = TD.charStats(id, prog), maxLv = TD.maxLv(prog.lb), inParty = save.party.includes(id);
    const next = prog.lv < maxLv ? TD.charStats(id, { lv: prog.lv + 1, lb: prog.lb }) : null;
    const up = (k) => next ? `<em>→${next[k]}</em>` : '';
    // 所持結晶で上げられる最大レベル
    let affordable = prog.lv;
    while (affordable < maxLv && lvUpCost(prog.lv, affordable + 1) <= save.crystals) affordable++;
    const lvBtn = (label, to) => {
      const t = Math.min(to, maxLv), cost = lvUpCost(prog.lv, t), ok = t > prog.lv && cost <= save.crystals;
      return `<button class="btn lvbtn" data-lv="${t}" ${ok ? '' : 'disabled'}>${label}<small>${t > prog.lv ? '結晶 ' + cost : '-'}</small></button>`;
    };
    box.innerHTML =
      `<div class="cd-head">${TD.portraitHTML(id, true)}<div><div class="cd-title">${base.title}</div>` +
      `<div class="cd-name">${base.name}</div>${TD.starsHTML(base.rarity, 0)} ${TD.elemChip(base.element)}<span class="chip role">${r.name}</span></div></div>` +
      `<div class="cd-grow"><div class="cd-lv">Lv <b>${prog.lv}</b><small>/${maxLv}</small></div>` +
      `<div class="cd-lb">限界突破 ${TD.lbHTML(prog.lb)}<small>${prog.lb < TD.GROWTH.maxLB ? '同じキャラを召喚すると突破' : '最大'}</small></div></div>` +
      `<div class="cd-role">${r.desc}</div>` +
      `<div class="cd-stats"><span>HP<b>${d.hp}${up('hp')}</b></span><span>${base.role === 'priest' ? '回復' : '攻撃'}<b>${d.atk}${up('atk')}</b></span><span>防御<b>${d.def}${up('def')}</b></span>` +
      `<span>コスト<b>${d.cost}</b></span><span>射程<b>${d.range}</b></span><span>${r.melee ? 'ブロック' : '再配置'}<b>${r.melee ? d.block : d.redeploy + 's'}</b></span></div>` +
      `<div class="cd-levelup"><div class="cd-own"><i class="crystal"></i> 経験の結晶 <b>${save.crystals}</b></div>` +
      (prog.lv < maxLv
        ? `<div class="lv-row">${lvBtn('+1', prog.lv + 1)}${lvBtn('+5', prog.lv + 5)}${lvBtn('最大', Math.max(affordable, prog.lv + 1))}</div>`
        : `<div class="lv-max">${prog.lb < TD.GROWTH.maxLB ? 'レベル上限です。限界突破で上限が上がります' : 'これ以上は上げられません'}</div>`) +
      `</div>` +
      `<div class="cd-skill"><div class="cd-skill-name">必殺技「${base.skill.name}」<small>SP ${base.skill.sp}</small></div><div>${base.skill.desc}</div></div>` +
      `<button class="btn ${inParty ? 'ghost' : 'primary'}" id="btn-toggle-party">${inParty ? '編成から外す' : '編成に加える'}</button>`;
    box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
      const to = +b.dataset.lv, cost = lvUpCost(prog.lv, to);
      if (cost > save.crystals || to <= prog.lv) return;
      save.crystals -= cost;
      prog.lv = to;
      persist();
      renderParty();
      const lvEl = $('#char-detail .cd-lv');
      if (lvEl) { lvEl.classList.add('flash'); }
    });
    $('#btn-toggle-party').onclick = () => {
      if (inParty) {
        if (save.party.length <= 1) { alertBox('最低1人は編成してください'); return; }
        save.party = save.party.filter(x => x !== id);
      } else {
        if (save.party.length >= 6) { alertBox('編成は最大6人までです。誰かを外してください'); return; }
        save.party.push(id);
      }
      persist();
      renderParty();
    };
  }

  // ---------- 召喚 ----------
  let bannerIdx = 0;
  function renderSummon() {
    updateCurrency();
    const banners = TD.GACHA.banners, bn = banners[bannerIdx];
    $('#banner-tabs').innerHTML = banners.map((b, i) => `<button class="${i === bannerIdx ? 'on' : ''}" data-bi="${i}">${esc(b.name)}</button>`).join('');
    $('#banner-tabs').querySelectorAll('[data-bi]').forEach(b => b.onclick = () => { bannerIdx = +b.dataset.bi; renderSummon(); });
    const feat = bn.pickup.length ? bn.pickup : TD.Gacha.pool(5);
    $('#banner').className = `banner el-${bn.element}`;
    $('#banner').innerHTML =
      `<div class="bn-circle"></div>` +
      `<div class="bn-feat">${feat.map(id => TD.portraitHTML(id, true)).join('')}</div>` +
      `<div class="bn-name">${esc(bn.name)}</div>` +
      `<div class="bn-desc">${esc(bn.desc)}</div>` +
      (bn.pickup.length ? `<div class="bn-pick">${bn.pickup.map(id => `PICK UP ★5 ${TD.CHARS[id].title} ${TD.CHARS[id].name}`).join('')}</div>` : '');
    const left = TD.GACHA.pity - save.pity;
    $('#summon-info').innerHTML = `★5確定まで あと <b>${left}</b> 回<span>10回召喚は★4以上1体確定</span>`;
    const one = $('#btn-pull1'), ten = $('#btn-pull10');
    one.innerHTML = `1回召喚<small><i class="gem"></i>${TD.GACHA.single}</small>`;
    ten.innerHTML = `10回召喚<small><i class="gem"></i>${TD.GACHA.ten}</small>`;
    one.disabled = save.stones < TD.GACHA.single;
    ten.disabled = save.stones < TD.GACHA.ten;
  }
  $('#btn-pull1').addEventListener('click', () => doPull(1));
  $('#btn-pull10').addEventListener('click', () => doPull(10));
  $('#btn-rates').addEventListener('click', () => {
    const bn = TD.GACHA.banners[bannerIdx], rows = TD.Gacha.rateTable(bn);
    const sum = r => (TD.GACHA.rates[r] * 100).toFixed(0) + '%';
    modal(
      `<div class="pause-title">提供割合</div><div class="small" style="text-align:center">${esc(bn.name)}</div>` +
      `<div class="rate-sum"><span>★5 ${sum(5)}</span><span>★4 ${sum(4)}</span><span>★3 ${sum(3)}</span></div>` +
      `<table class="rate-table">${rows.map(r => `<tr class="${r.pickup ? 'pick' : ''}"><td>${TD.starsHTML(r.rarity, 0)}</td><td>${TD.CHARS[r.id].name}${r.pickup ? ' <b>PICK UP</b>' : ''}</td><td>${(r.rate * 100).toFixed(3)}%</td></tr>`).join('')}</table>` +
      `<p class="small">・10回召喚では★4以上が1体以上確定します。<br>・${TD.GACHA.pity}回以内に★5が出なかった場合、${TD.GACHA.pity}回目は★5確定です（全バナー共通）。<br>・限界突破が最大のキャラが重複した場合は魔晶石に変換されます（★3:${TD.GROWTH.dupStones[3]} / ★4:${TD.GROWTH.dupStones[4]} / ★5:${TD.GROWTH.dupStones[5]}）。<br>・魔晶石はゲーム内で入手できるアイテムです。現実のお金は使いません。</p>` +
      `<div class="btn-row"><button class="btn primary" onclick="document.getElementById('modal').classList.remove('show')">閉じる</button></div>`);
  });

  function doPull(n) {
    const bn = TD.GACHA.banners[bannerIdx];
    const results = TD.Gacha.pull(save, bn, n);
    if (!results) { alertBox('魔晶石が足りません。ステージをクリアして集めましょう'); return; }
    persist();
    playSummon(results);
  }

  function playSummon(results) {
    const fx = $('#summon-fx'), top = Math.max(...results.map(r => r.rarity));
    let phase = 0, timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    fx.className = `summon-fx show r${top}`;
    fx.innerHTML =
      `<div class="sf-circle"><i></i><i></i><i></i></div><div class="sf-flash"></div>` +
      `<div class="sf-results ${results.length === 1 ? 'single' : ''}"></div>` +
      `<div class="sf-skip">タップでスキップ</div>`;
    const showResults = () => {
      if (phase >= 1) return;
      phase = 1;
      timers.forEach(clearTimeout);
      fx.classList.add('reveal');
      const box = fx.querySelector('.sf-results');
      box.innerHTML = results.map((r, i) => {
        const d = TD.CHARS[r.id];
        const tag = r.isNew ? '<em class="new">NEW</em>' : r.limitBreak ? `<em class="lbup">限界突破 ${r.limitBreak}</em>` : `<em class="conv">魔晶石+${r.converted}</em>`;
        return `<div class="sf-card r${r.rarity}" style="animation-delay:${results.length === 1 ? 0 : i * 0.12}s">` +
          `${TD.portraitHTML(r.id, true)}${tag}<div class="sf-name">${d.name}</div>${TD.starsHTML(r.rarity, 0)}` +
          (results.length === 1 ? `<div class="sf-title">${d.title}</div><div class="sf-line">「${d.lines.deploy}」</div>` : '') + `</div>`;
      }).join('');
      fx.querySelector('.sf-skip').textContent = '';
      later(() => {
        const btns = document.createElement('div');
        btns.className = 'sf-btns';
        btns.innerHTML = `<button class="btn ghost" data-act="close">OK</button>`;
        fx.appendChild(btns);
        btns.querySelector('[data-act=close]').onclick = ev => { ev.stopPropagation(); fx.className = 'summon-fx'; fx.innerHTML = ''; renderSummon(); };
        phase = 2;
      }, results.length === 1 ? 500 : 1500);
    };
    fx.onclick = () => { if (phase === 0) showResults(); };
    later(showResults, 2200);
  }

  // ---------- 設定 ----------
  function openSettings() {
    const body = modal(
      `<div class="pause-title">設定</div>` +
      `<div class="brief-sec">データのバックアップ</div>` +
      `<p class="small">セーブデータはこのブラウザに保存されています。別の端末へ移すときは引き継ぎコードを使ってください。</p>` +
      `<textarea id="backup-code" rows="3" placeholder="ここに引き継ぎコードが表示されます／貼り付けてください"></textarea>` +
      `<div class="btn-row"><button class="btn ghost" data-act="export">コードを発行</button><button class="btn ghost" data-act="import">コードで復元</button></div>` +
      `<div class="brief-sec">その他</div>` +
      `<div class="btn-col"><button class="btn danger" data-act="reset">データを初期化</button><button class="btn primary" data-act="close">閉じる</button></div>`);
    const ta = body.querySelector('#backup-code');
    body.querySelector('[data-act=export]').onclick = () => {
      ta.value = TD.Save.exportCode(save); ta.select();
      try { navigator.clipboard.writeText(ta.value); } catch (e) { /* 手動コピーで可 */ }
    };
    body.querySelector('[data-act=import]').onclick = () => {
      try { save = TD.Save.importCode(ta.value); persist(); closeModal(); renderHome(); alertBox('データを復元しました'); }
      catch (e) { alertBox('コードが正しくありません'); }
    };
    body.querySelector('[data-act=reset]').onclick = () => {
      if (!confirm('本当にデータを初期化しますか？')) return;
      save = TD.Save.defaults(); persist(); closeModal(); renderHome(); checkGift();
    };
    body.querySelector('[data-act=close]').onclick = closeModal;
  }

  // ---------- 起動 ----------
  $('#title-screen').addEventListener('click', () => {
    $('#title-screen').classList.add('hide');
    naviSay(TD.NAVI_LINES[0]);
    setTimeout(checkGift, 400);
  });
  show('screen-home');
  TD.app = { show, startBattle, get save() { return save; } };
})();
