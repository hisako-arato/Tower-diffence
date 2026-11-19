// 画面遷移・ホーム・編成・ステージ選択・設定
window.TD = window.TD || {};

TD.portraitHTML = function (id, big) {
  const d = TD.CHARS[id];
  return `<span class="pt el-${d.element}${big ? ' big' : ''}"><b>${d.name[0]}</b><i>${TD.ROLES[d.role].glyph}</i></span>`;
};
TD.starsHTML = (n, max = 5) => `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(Math.max(0, max - n))}</span></span>`;
TD.elemChip = el => `<span class="chip el-${el}">${TD.ELEMENTS[el].name}</span>`;

(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let save = TD.Save.load();
  let battle = null, currentStage = null;
  const persist = () => TD.Save.store(save);

  // ---------- 共通 ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id === 'screen-home') renderHome();
    if (id === 'screen-stages') renderStages();
    if (id === 'screen-party') renderParty();
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

  function updateStones() { document.querySelectorAll('.stones-val').forEach(e => e.textContent = save.stones); }

  // ---------- ホーム ----------
  let lineIdx = 0;
  function renderHome() {
    updateStones();
    const cleared = Object.keys(save.cleared).length;
    $('#home-progress').textContent = `第1章 進行度 ${cleared}/${TD.STAGES.length}`;
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
  $('#btn-summon').addEventListener('click', () => naviSay('召喚の儀はただいま準備中です……！もう少しお待ちくださいね。'));
  $('#btn-settings').addEventListener('click', openSettings);

  // ---------- ステージ選択 ----------
  function stageUnlocked(i) { return i === 0 || save.cleared[TD.STAGES[i - 1].id] > 0; }
  function renderStages() {
    updateStones();
    const list = $('#stage-list');
    list.innerHTML = `<div class="chapter-title">${TD.STAGES[0].chapter}</div>`;
    TD.STAGES.forEach((st, i) => {
      const open = stageUnlocked(i), best = save.cleared[st.id] || 0;
      const el = document.createElement('button');
      el.className = 'stage-item' + (open ? '' : ' locked') + (st.waves.some(w => TD.ENEMIES[w.e].boss) ? ' boss' : '');
      el.innerHTML = `<span class="st-id">${st.id}</span><span class="st-name">${st.name}</span>` +
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
    const party = save.party.map(id => TD.portraitHTML(id)).join('');
    const body = modal(
      `<div class="brief-head"><span class="st-id">${st.id}</span>${esc(st.name)}</div>` +
      `<div class="brief-navi"><span class="mini-navi"></span><p>${esc(st.brief)}</p></div>` +
      `<div class="brief-sec">出現する敵</div><ul class="enemy-list">${enemies}</ul>` +
      `<div class="brief-sec">出撃メンバー</div><div class="brief-party">${party}</div>` +
      `<div class="brief-sub">ライフ ${st.lives}・初期マナ ${st.mana}・初回報酬 魔晶石×${st.reward}</div>` +
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
    battle = new TD.Battle(st, save.party, bEls, onBattleEnd);
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
    let reward = 0, notes = [];
    if (r.win) {
      const prev = save.cleared[st.id] || 0;
      if (!prev) { reward += st.reward; notes.push(`初回クリア報酬 ×${st.reward}`); }
      if (r.stars === 3 && prev < 3) { reward += 20; notes.push('★3達成ボーナス ×20'); }
      save.cleared[st.id] = Math.max(prev, r.stars);
      save.stones += reward;
      persist();
    }
    const next = TD.STAGES[TD.STAGES.indexOf(st) + 1];
    const body = modal(
      `<div class="result ${r.win ? 'win' : 'lose'}">` +
      `<div class="res-title">${r.win ? 'VICTORY' : 'DEFEAT'}</div>` +
      (r.win ? `<div class="res-stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>` : `<div class="res-msg">結界が破られてしまった……</div>`) +
      `<div class="res-stats">撃破 ${r.killed}/${r.total}・残りライフ ${r.lives}/${r.maxLives}</div>` +
      (r.win ? `<div class="res-cond"><div class="${r.stars >= 1 ? 'ok' : ''}">★ ステージクリア</div><div class="${r.stars >= 2 ? 'ok' : ''}">★ ライフを半分以上残す</div><div class="${r.stars >= 3 ? 'ok' : ''}">★ ライフを減らさずクリア</div></div>` : '') +
      (reward ? `<div class="res-reward"><i class="gem"></i> 魔晶石 +${reward}<small>${notes.join(' / ')}</small></div>` : '') +
      `</div>` +
      `<div class="btn-col">` +
      (r.win && next ? `<button class="btn primary" data-act="next">次のステージへ</button>` : '') +
      `<button class="btn ${r.win && next ? 'ghost' : 'primary'}" data-act="retry">もう一度</button>` +
      `<button class="btn ghost" data-act="stages">ステージ選択へ</button></div>`, 'locked');
    const leave = () => { closeModal(); if (battle) { battle.destroy(); battle = null; } };
    const nb = body.querySelector('[data-act=next]');
    if (nb) nb.onclick = () => { leave(); show('screen-stages'); openBrief(next); };
    body.querySelector('[data-act=retry]').onclick = () => { leave(); startBattle(st); };
    body.querySelector('[data-act=stages]').onclick = () => { leave(); show('screen-stages'); };
  }

  // ---------- 編成 ----------
  let partySel = null;
  function renderParty() {
    const slots = $('#party-slots');
    slots.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const id = save.party[i], el = document.createElement('button');
      el.className = 'slot' + (id ? '' : ' empty');
      el.innerHTML = id ? `${TD.portraitHTML(id)}<span>${TD.CHARS[id].name}</span>` : '<span>空き</span>';
      if (id) el.addEventListener('click', () => { partySel = id; renderParty(); });
      slots.appendChild(el);
    }
    const roster = $('#roster');
    roster.innerHTML = '';
    const ids = [...save.owned].sort((a, b) => TD.CHARS[b].rarity - TD.CHARS[a].rarity);
    for (const id of ids) {
      const d = TD.CHARS[id], el = document.createElement('button');
      el.className = `char-card r${d.rarity}` + (save.party.includes(id) ? ' in-party' : '') + (partySel === id ? ' sel' : '');
      el.innerHTML = `${TD.portraitHTML(id)}<span class="cc-name">${d.name}</span>${TD.starsHTML(d.rarity, 0)}` +
        `<span class="cc-cost">${d.cost}</span>`;
      el.addEventListener('click', () => { partySel = id; renderParty(); });
      roster.appendChild(el);
    }
    renderDetail();
  }

  function renderDetail() {
    const box = $('#char-detail');
    if (!partySel) { box.innerHTML = '<p class="hint">キャラをタップすると詳細が表示されます。<br>出撃メンバーは最大6人です。</p>'; return; }
    const id = partySel, d = TD.CHARS[id], r = TD.ROLES[d.role], inParty = save.party.includes(id);
    box.innerHTML =
      `<div class="cd-head">${TD.portraitHTML(id, true)}<div><div class="cd-title">${d.title}</div>` +
      `<div class="cd-name">${d.name}</div>${TD.starsHTML(d.rarity, 0)} ${TD.elemChip(d.element)}<span class="chip role">${r.name}</span></div></div>` +
      `<div class="cd-role">${r.desc}</div>` +
      `<div class="cd-stats"><span>HP<b>${d.hp}</b></span><span>${d.role === 'priest' ? '回復' : '攻撃'}<b>${d.atk}</b></span><span>防御<b>${d.def}</b></span>` +
      `<span>コスト<b>${d.cost}</b></span><span>射程<b>${d.range}</b></span><span>${r.melee ? 'ブロック' : '再配置'}<b>${r.melee ? d.block : d.redeploy + 's'}</b></span></div>` +
      `<div class="cd-skill"><div class="cd-skill-name">必殺技「${d.skill.name}」<small>SP ${d.skill.sp}</small></div><div>${d.skill.desc}</div></div>` +
      `<button class="btn ${inParty ? 'ghost' : 'primary'}" id="btn-toggle-party">${inParty ? '編成から外す' : '編成に加える'}</button>`;
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

  function alertBox(text) {
    const body = modal(`<p class="alert-text">${esc(text)}</p><div class="btn-row"><button class="btn primary">OK</button></div>`);
    body.querySelector('button').onclick = closeModal;
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
      save = TD.Save.defaults(); persist(); closeModal(); renderHome();
    };
    body.querySelector('[data-act=close]').onclick = closeModal;
  }

  // ---------- 起動 ----------
  $('#title-screen').addEventListener('click', () => {
    $('#title-screen').classList.add('hide');
    naviSay(TD.NAVI_LINES[0]);
  });
  show('screen-home');
  TD.app = { show, startBattle, get save() { return save; } };
})();
