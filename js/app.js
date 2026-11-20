// 画面遷移・ホーム・編成/育成・召喚・ステージ選択・設定
window.TD = window.TD || {};

// 丸いバストアップ（silhouette=true で未所持のシルエット表示）
TD.portraitHTML = function (id, big, silhouette) {
  const d = TD.CHARS[id];
  return `<span class="pt el-${d.element} r${d.rarity}${big ? ' big' : ''}${silhouette ? ' silhouette' : ''}"><span class="pt-art">${TD.charArtHTML(id, 'bust')}</span><i>${TD.ROLES[d.role].glyph}</i></span>`;
};
// 全身の立ち絵
TD.fullArtHTML = function (id, silhouette) {
  const d = TD.CHARS[id];
  return `<span class="full-art el-${d.element} r${d.rarity}${silhouette ? ' silhouette' : ''}">${TD.charArtHTML(id, 'full')}</span>`;
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
    if (id === 'screen-story') renderStoryList();
    if (id === 'screen-mission') renderMissions();
    if (id === 'screen-event') renderEvent();
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

  // 通貨表示をタップすると用途を説明する
  document.querySelectorAll('[data-cur]').forEach(b => b.addEventListener('click', () => {
    const books = b.dataset.cur === 'books';
    const body = modal(
      `<div class="cur-help"><div class="ch-icon">${books ? '<i class="expbook big"></i>' : '<i class="gem big"></i>'}</div>` +
      `<div class="ch-name">${books ? '経験の書' : '魔晶石'}<small class="cur-label ${books ? 'grow' : 'summon'}">${books ? '育成用' : '召喚用'}</small></div>` +
      `<p>${books
        ? 'キャラのレベルアップに使う本です。<br>ステージクリアで毎回手に入ります。デイリークエスト「古代の書庫」ならたくさん集められます。'
        : '英雄の召喚に使う魔法の石です。<br>初回クリア報酬・ミッション・ログインボーナス・イベント交換所で手に入ります。'}</p>` +
      `<div class="ch-own">所持数 <b>${books ? save.crystals : save.stones}</b></div></div>` +
      `<div class="btn-row"><button class="btn primary">閉じる</button></div>`);
    body.querySelector('button').onclick = closeModal;
  }));

  function alertBox(text) {
    const body = modal(`<p class="alert-text">${esc(text)}</p><div class="btn-row"><button class="btn primary">OK</button></div>`);
    body.querySelector('button').onclick = closeModal;
  }

  // ---------- ホーム ----------
  let lineIdx = 0;
  function renderHome() {
    updateCurrency();
    const cleared = Object.keys(save.cleared).length;
    $('#home-name').textContent = save.playerName || '召喚士';
    $('#btn-install').hidden = !installPrompt;
    $('#home-progress').textContent = `第1章 進行度 ${cleared}/${TD.STAGES.length}・英雄 ${save.owned.length}/${Object.keys(TD.CHARS).length}`;
    if (TD.Live.ensureDaily(save)) persist();
    const n = TD.Live.claimableCount(save), badge = $('#mission-badge');
    badge.textContent = n; badge.hidden = !n;
    const evb = $('#home-event'), ev = TD.EVENT;
    evb.hidden = !TD.Live.eventActive(ev);
    if (!evb.hidden) evb.innerHTML = `<span class="he-tag">EVENT</span><span class="he-name">${esc(ev.name)}</span><span class="he-left">あと${TD.Live.eventDaysLeft(ev)}日</span>`;
  }
  // アプリを開いたまま日付が変わった場合もログインボーナスを出す
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && save.story.prologue && $('#screen-home').classList.contains('active') && !$('#modal').classList.contains('show')) {
      showLoginBonus(() => renderHome());
    }
  });
  function naviSay(text) {
    const b = $('#navi-bubble');
    b.textContent = text.replace(/\{name\}/g, save.playerName || '召喚士');
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  $('#navi').addEventListener('click', () => {
    lineIdx = (lineIdx + 1) % TD.NAVI_LINES.length;
    naviSay(TD.NAVI_LINES[lineIdx]);
    const n = $('#navi');
    n.classList.remove('poke'); void n.offsetWidth; n.classList.add('poke');
  });
  $('#btn-settings').addEventListener('click', openSettings);

  function checkGift(next) {
    if (save.giftReceived) { next && next(); return; }
    save.giftReceived = true;
    save.stones += TD.GACHA.starterGift;
    persist();
    updateCurrency();
    const body = modal(
      `<div class="gift"><div class="gift-title">${esc(save.playerName || '召喚士')}さまへの贈り物</div>` +
      `<div class="gift-item"><i class="gem big"></i>魔晶石 ×${TD.GACHA.starterGift}</div>` +
      `<p>結界の精霊ルミナより。<br>「召喚」で新たな英雄を呼び出しましょう！</p></div>` +
      `<div class="btn-col"><button class="btn primary" data-act="summon">召喚へ</button><button class="btn ghost" data-act="close">あとで</button></div>`, 'locked');
    body.querySelector('[data-act=summon]').onclick = () => { closeModal(); show('screen-summon'); };
    body.querySelector('[data-act=close]').onclick = () => { closeModal(); next && next(); };
  }

  // ---------- ログインボーナス ----------
  function loginGrid(day) {
    return `<div class="lb-grid">${TD.LOGIN_BONUS.map((r, i) => {
      const d = i + 1, got = d <= day, today = d === day;
      const icon = r.stones ? '<i class="gem"></i>' : '<i class="expbook"></i>';
      return `<div class="lb-day${got ? ' got' : ''}${today ? ' today' : ''}${d === 7 ? ' big' : ''}"><span class="lbd">${d}日目</span>${icon}<b>×${r.stones || r.crystals}</b>${got ? '<span class="stamp">済</span>' : ''}</div>`;
    }).join('')}</div>`;
  }
  function showLoginBonus(next) {
    const res = TD.Live.checkLogin(save);
    if (!res) { next && next(); return; }
    TD.Live.ensureDaily(save);
    persist();
    updateCurrency();
    const body = modal(
      `<div class="pause-title">ログインボーナス</div>` +
      `<div class="small" style="text-align:center">通算 ${save.login.total} 日目・7日ごとに豪華報酬！</div>` +
      loginGrid(res.day) +
      `<div class="lb-get">本日の報酬：<b>${TD.Live.rewardText(res.reward)}</b></div>` +
      `<div class="btn-row"><button class="btn primary">受け取る</button></div>`, 'locked');
    body.querySelector('button').onclick = () => { closeModal(); renderHome(); next && next(); };
  }
  $('#btn-loginbonus').addEventListener('click', () => {
    const body = modal(`<div class="pause-title">ログインボーナス</div>` +
      `<div class="small" style="text-align:center">通算 ${save.login.total} 日目</div>${loginGrid(save.login.day)}` +
      `<div class="small" style="text-align:center">毎日0時に次の報酬が受け取れます</div>` +
      `<div class="btn-row"><button class="btn primary">閉じる</button></div>`);
    body.querySelector('button').onclick = closeModal;
  });

  // ---------- ミッション ----------
  let missionTab = 'daily';
  function renderMissions() {
    updateCurrency();
    const list = missionTab === 'daily' ? TD.Live.dailyList(save) : TD.Live.achList(save);
    document.querySelectorAll('#mission-tabs [data-mt]').forEach(b => {
      b.classList.toggle('on', b.dataset.mt === missionTab);
      const n = (b.dataset.mt === 'daily' ? TD.Live.dailyList(save) : TD.Live.achList(save)).filter(x => x.done && !x.claimed).length;
      b.querySelector('em').textContent = n || '';
    });
    const sorted = [...list].sort((a, b) => (a.claimed - b.claimed) || (b.done - a.done));
    $('#mission-list').innerHTML = (missionTab === 'daily' ? `<div class="small">毎日0時にリセットされます</div>` : '') +
      sorted.map(x => `<div class="mission${x.claimed ? ' claimed' : x.done ? ' done' : ''}">` +
        `<div class="ms-body"><div class="ms-name">${esc(x.m.name)}</div>` +
        `<div class="ms-bar"><i style="width:${x.cur / x.m.goal * 100}%"></i></div>` +
        `<div class="ms-meta"><span>${x.cur}/${x.m.goal}</span><span>${x.m.reward.stones ? '<i class="gem"></i>' : '<i class="expbook"></i>'} ×${x.m.reward.stones || x.m.reward.crystals}</span></div></div>` +
        `<button class="btn ${x.done && !x.claimed ? 'primary' : 'ghost'}" data-claim="${x.m.id}" ${x.done && !x.claimed ? '' : 'disabled'}>${x.claimed ? '受取済' : x.done ? '受け取る' : '未達成'}</button></div>`).join('');
    $('#mission-list').querySelectorAll('[data-claim]').forEach(b => b.onclick = () => {
      const r = TD.Live.claim(save, missionTab, b.dataset.claim);
      if (r) { persist(); renderMissions(); toast(`${TD.Live.rewardText(r)} を受け取りました`); }
    });
    $('#btn-claim-all').disabled = !list.some(x => x.done && !x.claimed);
  }
  document.querySelectorAll('#mission-tabs [data-mt]').forEach(b => b.addEventListener('click', () => { missionTab = b.dataset.mt; renderMissions(); }));
  $('#btn-claim-all').addEventListener('click', () => {
    const t = TD.Live.claimAll(save, missionTab);
    persist(); renderMissions();
    const text = TD.Live.rewardText(t);
    if (text) toast(`${text} を受け取りました`);
  });
  function toast(text) {
    const t = $('#app-toast');
    t.textContent = text;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  }

  // ---------- イベント ----------
  function eventStageOpen(st) { return !st.unlockAfter || save.cleared[st.unlockAfter] > 0; }
  function renderEvent() {
    updateCurrency();
    const ev = TD.EVENT, es = TD.Live.eventState(save, ev), active = TD.Live.eventActive(ev);
    $('#event-head').className = `event-head el-${ev.element}`;
    $('#event-head').innerHTML = `<div class="eh-name">${esc(ev.name)}</div><div class="eh-period">${ev.start.replace(/-/g, '/')} 〜 ${ev.end.replace(/-/g, '/')}${active ? `（あと${TD.Live.eventDaysLeft(ev)}日）` : '（終了しました）'}</div>` +
      `<p>${esc(ev.desc)}</p><div class="eh-pts"><i class="star"></i> ${esc(ev.currency)} <b>${es.pts}</b></div>`;
    const stages = $('#event-stages');
    stages.innerHTML = `<button class="story-item" data-evstory><span class="si-title">イベントストーリーを見る</span><span class="si-sub">${save.story[ev.story] ? '▶ 再生' : 'NEW'}</span></button>`;
    stages.querySelector('[data-evstory]').onclick = () => playStory(ev.story, renderEvent);
    for (const st of ev.stages) stages.appendChild(stageItem(st, active && eventStageOpen(st), active ? `${ev.currency} ×${st.eventPoints}` : '期間外'));
    $('#event-shop').innerHTML = ev.shop.map(it => {
      const used = es.shop[it.id] || 0, left = it.limit - used, ok = active && left > 0 && es.pts >= it.cost;
      return `<div class="shop-item"><div class="si-icon">${it.char ? TD.portraitHTML(it.char) : it.reward.stones ? '<i class="gem big"></i>' : '<i class="expbook big"></i>'}</div>` +
        `<div class="si-body"><div class="si-title">${esc(it.name)}</div><div class="si-sub">交換上限 ${left}/${it.limit}</div></div>` +
        `<button class="btn ${ok ? 'primary' : 'ghost'}" data-shop="${it.id}" ${ok ? '' : 'disabled'}><i class="star"></i>${it.cost}</button></div>`;
    }).join('');
    $('#event-shop').querySelectorAll('[data-shop]').forEach(b => b.onclick = () => {
      const it = ev.shop.find(x => x.id === b.dataset.shop), r = TD.Live.exchange(save, it, ev);
      if (!r) return;
      persist(); renderEvent();
      if (it.char) toast(r.isNew ? `${TD.CHARS[it.char].name}が仲間になった！` : r.limitBreak ? `${TD.CHARS[it.char].name}が限界突破 ${r.limitBreak}！` : `魔晶石 ×${r.converted} に変換されました`);
      else toast(`${TD.Live.rewardText(it.reward)} を受け取りました`);
    });
  }
  $('#home-event').addEventListener('click', () => show('screen-event'));

  // ---------- ストーリー ----------
  const adv = new TD.Adv($('#adv'));
  function playStory(id, cb) {
    if (!TD.STORY[id]) { cb && cb(); return; }
    adv.play(id, save.playerName || '召喚士', () => {
      save.story[id] = true;
      persist();
      renderHome();
      cb && cb();
    }, name => { save.playerName = name; persist(); naviSay(TD.NAVI_LINES[0]); });
  }
  const storyFor = (st, kind) => { const id = `${st.id}-${kind}`; return TD.STORY[id] ? id : null; };

  function storyUnlockHint(id) {
    if (id.startsWith('event-')) return 'イベント画面から見られます（開催期間中）';
    const [a, b, kind] = id.split('-');
    return kind === 'pre' ? `ステージ${a}-${b}に挑戦すると解放` : `ステージ${a}-${b}クリアで解放`;
  }
  function renderStoryList() {
    const list = $('#story-list');
    let html = '', ch = null;
    for (const id of TD.STORY_ORDER) {
      const ep = TD.STORY[id], read = !!save.story[id];
      if (ep.chapter !== ch) { ch = ep.chapter; html += `<div class="chapter-title">${TD.CHAPTERS[ch]}</div>`; }
      html += `<button class="story-item${read ? '' : ' locked'}" data-ep="${id}"><span class="si-title">${esc(ep.title)}</span>` +
        `<span class="si-sub">${read ? '▶ 再生' : '🔒 ' + storyUnlockHint(id)}</span></button>`;
    }
    html += `<div class="story-next">第2章は近日公開予定です</div>`;
    list.innerHTML = html;
    list.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => {
      const id = b.dataset.ep;
      if (save.story[id] || id === 'prologue' || (id === TD.EVENT.story && TD.Live.eventActive())) playStory(id, () => renderStoryList());
    });
  }

  // ---------- ステージ選択 ----------
  function stageUnlocked(i) { return i === 0 || save.cleared[TD.STAGES[i - 1].id] > 0; }
  function stageItem(st, open, sub, lockText) {
    const el = document.createElement('button'), best = save.cleared[st.id] || 0;
    el.className = 'stage-item' + (open ? '' : ' locked') + (st.waves.some(w => TD.ENEMIES[w.e].boss) ? ' boss' : '') + (st.type ? ' ' + st.type : '');
    el.innerHTML = `<span class="st-id">${st.id}</span><span class="st-name">${esc(st.name)}<small>${sub}</small></span>` +
      `<span class="st-stars">${open ? TD.starsHTML(best, 3) : '🔒'}</span>`;
    if (!open && lockText) el.querySelector('small').textContent = lockText;
    if (open) el.addEventListener('click', () => openBrief(st));
    return el;
  }
  function renderStages() {
    updateCurrency();
    TD.Live.ensureDaily(save);
    const list = $('#stage-list');
    list.innerHTML = `<div class="chapter-title">${TD.STAGES[0].chapter}</div>`;
    TD.STAGES.forEach((st, i) => {
      const open = stageUnlocked(i), best = save.cleared[st.id] || 0;
      const el = document.createElement('button');
      el.className = 'stage-item' + (open ? '' : ' locked') + (st.waves.some(w => TD.ENEMIES[w.e].boss) ? ' boss' : '');
      el.innerHTML = `<span class="st-id">${st.id}</span><span class="st-name">${st.name}<small>経験の書 ×${TD.stageExp(st)}</small></span>` +
        `<span class="st-stars">${open ? TD.starsHTML(best, 3) : '🔒'}</span>`;
      const unreadStory = open && [storyFor(st, 'pre'), storyFor(st, 'post')].some(id => id && !save.story[id]);
      if (unreadStory) el.insertAdjacentHTML('beforeend', '<span class="st-story">STORY</span>');
      if (open) el.addEventListener('click', () => openBrief(st));
      list.appendChild(el);
    });
    list.insertAdjacentHTML('beforeend', `<div class="chapter-title daily">デイリークエスト</div>`);
    for (const st of TD.DAILY_STAGES) {
      const unlocked = save.cleared[st.unlockAfter] > 0, left = TD.Live.runsLeft(save, st);
      list.appendChild(stageItem(st, unlocked && left > 0, `経験の書 ×${TD.stageExp(st)}・本日あと${left}回`,
        !unlocked ? `${st.unlockAfter}クリアで解放` : '本日の挑戦回数は終了しました'));
    }
    if (TD.Live.eventActive()) {
      const ev = TD.EVENT;
      list.insertAdjacentHTML('beforeend', `<div class="chapter-title event">イベント：${esc(ev.name)}</div>`);
      for (const st of ev.stages) list.appendChild(stageItem(st, eventStageOpen(st), `${ev.currency} ×${st.eventPoints}`, `${st.unlockAfter}クリアで解放`));
    }
  }

  function openBrief(st) {
    const types = [...new Set(st.waves.map(w => w.e))];
    const enemies = types.map(t => {
      const e = TD.ENEMIES[t];
      return `<li>${TD.elemChip(e.element)}${esc(e.name)}${e.boss ? ' <b class="boss-tag">BOSS</b>' : ''}</li>`;
    }).join('');
    const party = save.party.map(id => `<span class="bp">${TD.portraitHTML(id)}<small>Lv${save.chars[id].lv}</small></span>`).join('');
    const first = !save.cleared[st.id];
    const rewardText = st.type === 'daily' ? `経験の書 ×${TD.stageExp(st)}（本日あと${TD.Live.runsLeft(save, st)}回）`
      : st.type === 'event' ? `${TD.EVENT.currency} ×${st.eventPoints}・経験の書 ×${TD.stageExp(st)}${first ? `・魔晶石 ×${st.reward}（初回）` : ''}`
      : `経験の書 ×${TD.stageExp(st)}・魔晶石 ×${first ? st.reward + '（初回）' : 5}`;
    const body = modal(
      `<div class="brief-head"><span class="st-id">${st.id}</span>${esc(st.name)}</div>` +
      `<div class="brief-navi"><span class="mini-navi"></span><p>${esc(st.brief)}</p></div>` +
      `<div class="brief-sec">出現する敵</div><ul class="enemy-list">${enemies}</ul>` +
      `<div class="brief-sec">出撃メンバー</div><div class="brief-party">${party}</div>` +
      `<div class="brief-sub">ライフ ${st.lives}・初期マナ ${st.mana}<br>報酬：${rewardText}</div>` +
      `<div class="btn-row"><button class="btn ghost" data-act="party">編成する</button><button class="btn primary" data-act="go">出撃！</button></div>`);
    body.querySelector('[data-act=party]').onclick = () => { closeModal(); show('screen-party'); };
    body.querySelector('[data-act=go]').onclick = () => {
      closeModal();
      const pre = st.type === 'event' && !save.story[TD.EVENT.story] ? TD.EVENT.story : storyFor(st, 'pre');
      if (pre && !save.story[pre]) playStory(pre, () => startBattle(st));
      else startBattle(st);
    };
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
    body.querySelector('[data-act=quit]').onclick = () => { closeModal(); battle.destroy(); battle = null; show(currentStage.type === 'event' ? 'screen-event' : 'screen-stages'); };
  });

  function onBattleEnd(r) {
    const st = currentStage;
    let stones = 0, notes = [];
    let exp = r.win ? TD.stageExp(st) : Math.round(TD.stageExp(st) * 0.2);
    // 常時スキル「宝探し」：出撃メンバーにいれば経験の書が増える（重複しない・最大のもの）
    const expBonus = Math.max(1, ...save.party.map(id => TD.CHARS[id].passive && TD.CHARS[id].passive.type === 'expBonus' ? TD.CHARS[id].passive.mult : 1));
    exp = Math.round(exp * expBonus);
    let evPts = 0;
    TD.Live.track(save, 'kills', r.killed);
    TD.Live.track(save, 'skills', r.skills || 0);
    if (r.win) {
      TD.Live.track(save, 'wins');
      const prev = save.cleared[st.id] || 0;
      if (!prev && st.reward) { stones += st.reward; notes.push(`初回クリア ×${st.reward}`); }
      else if (!st.type) { stones += 5; notes.push('クリア報酬 ×5'); }
      if (st.type === 'daily') { save.daily.runs[st.id] = (save.daily.runs[st.id] || 0) + 1; TD.Live.track(save, 'caves'); }
      if (st.type === 'event') { evPts = st.eventPoints; TD.Live.eventState(save).pts += evPts; }
      if (r.stars === 3 && prev < 3) { stones += 20; notes.push('★3達成 ×20'); }
      save.cleared[st.id] = Math.max(prev, r.stars);
    }
    save.stones += stones;
    save.crystals += exp;
    persist();
    const idx = TD.STAGES.indexOf(st), next = idx >= 0 ? TD.STAGES[idx + 1] : null;
    const back = st.type === 'event' ? 'screen-event' : 'screen-stages';
    const body = modal(
      `<div class="result ${r.win ? 'win' : 'lose'}">` +
      `<div class="res-title">${r.win ? 'VICTORY' : 'DEFEAT'}</div>` +
      (r.win ? `<div class="res-stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>` : `<div class="res-msg">結界が破られてしまった……<br><small>キャラを育成して再挑戦しましょう</small></div>`) +
      `<div class="res-stats">撃破 ${r.killed}/${r.total}・残りライフ ${r.lives}/${r.maxLives}</div>` +
      (r.win ? `<div class="res-cond"><div class="${r.stars >= 1 ? 'ok' : ''}">★ ステージクリア</div><div class="${r.stars >= 2 ? 'ok' : ''}">★ ライフを半分以上残す</div><div class="${r.stars >= 3 ? 'ok' : ''}">★ ライフを減らさずクリア</div></div>` : '') +
      `<div class="res-reward">` +
      `<div><i class="expbook"></i> 経験の書 +${exp}${expBonus > 1 ? `<small class="bonus">（宝探し +${Math.round((expBonus - 1) * 100)}%）</small>` : ''}</div>` +
      (evPts ? `<div><i class="star"></i> ${esc(TD.EVENT.currency)} +${evPts}</div>` : '') +
      (stones ? `<div><i class="gem"></i> 魔晶石 +${stones}</div><small>${notes.join(' / ')}</small>` : '') +
      `</div></div>` +
      `<div class="btn-col">` +
      (r.win && next ? `<button class="btn primary" data-act="next">次のステージへ</button>` : '') +
      (!r.win ? `<button class="btn primary" data-act="party">育成する</button>` : '') +
      `<button class="btn ${r.win && next ? 'ghost' : r.win ? 'primary' : 'ghost'}" data-act="retry">もう一度</button>` +
      `<button class="btn ghost" data-act="stages">${st.type === 'event' ? 'イベントへ' : 'ステージ選択へ'}</button></div>`, 'locked');
    const post = r.win ? storyFor(st, 'post') : null;
    const pendingPost = post && !save.story[post];
    if (pendingPost) body.insertAdjacentHTML('afterbegin', '<div class="res-story">クリア後のストーリーが始まります</div>');
    const leave = () => { closeModal(); if (battle) { battle.destroy(); battle = null; } };
    const on = (act, fn) => {
      const b = body.querySelector(`[data-act=${act}]`);
      if (b) b.onclick = () => (pendingPost ? () => { leave(); show('screen-stages'); playStory(post, fn); } : fn)();
    };
    on('next', () => { leave(); show('screen-stages'); openBrief(next); });
    on('party', () => { leave(); show('screen-party'); });
    on('retry', () => {
      leave();
      if (st.type === 'daily' && TD.Live.runsLeft(save, st) <= 0) { show('screen-stages'); alertBox('本日の挑戦回数は終了しました'); }
      else startBattle(st);
    });
    on('stages', () => { leave(); show(back); });
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
      el.innerHTML = `${TD.portraitHTML(id, false, !have)}<span class="cc-name">${have ? d.name : '？？？'}</span>${TD.starsHTML(d.rarity, 0)}` +
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
        `<div class="cd-head">${TD.portraitHTML(id, true, true)}<div><div class="cd-title">${base.title}</div>` +
        `<div class="cd-name">？？？</div>${TD.starsHTML(base.rarity, 0)} ${TD.elemChip(base.element)}<span class="chip role">${r.name}</span></div></div>` +
        `<p class="hint">まだ出会っていない英雄です。「召喚」で仲間にしましょう。</p>` +
        `<button class="btn primary" data-go-summon>召喚へ</button>`;
      box.querySelector('[data-go-summon]').onclick = () => show('screen-summon');
      return;
    }
    const prog = save.chars[id], d = TD.charStats(id, prog), maxLv = TD.maxLv(prog.lb), inParty = save.party.includes(id);
    const pv = base.passive;
    const next = prog.lv < maxLv ? TD.charStats(id, { lv: prog.lv + 1, lb: prog.lb }) : null;
    const up = (k) => next ? `<em>→${next[k]}</em>` : '';
    // 所持している経験の書で上げられる最大レベル
    let affordable = prog.lv;
    while (affordable < maxLv && lvUpCost(prog.lv, affordable + 1) <= save.crystals) affordable++;
    const lvBtn = (label, to) => {
      const t = Math.min(to, maxLv), cost = lvUpCost(prog.lv, t), ok = t > prog.lv && cost <= save.crystals;
      return `<button class="btn lvbtn" data-lv="${t}" ${ok ? '' : 'disabled'}>${label}<small>${t > prog.lv ? '書 ' + cost : '-'}</small></button>`;
    };
    box.innerHTML =
      `<div class="cd-head"><div class="cd-full">${TD.fullArtHTML(id)}</div><div><div class="cd-title">${base.title}</div>` +
      `<div class="cd-name">${base.name}</div>${TD.starsHTML(base.rarity, 0)} ${TD.elemChip(base.element)}<span class="chip role">${r.name}</span></div></div>` +
      `<div class="cd-grow"><div class="cd-lv">Lv <b>${prog.lv}</b><small>/${maxLv}</small></div>` +
      `<div class="cd-lb">限界突破 ${TD.lbHTML(prog.lb)}<small>${prog.lb < TD.GROWTH.maxLB ? '同じキャラを召喚すると突破' : '最大'}</small></div></div>` +
      (base.profile ? `<div class="cd-profile">${base.profile}</div>` : '') +
      `<div class="cd-role">${r.desc}</div>` +
      ((base.traits || []).length ? `<div class="cd-traits">${base.traits.filter(k => TD.TRAITS[k]).map(k => `<div class="trait"><b>${TD.TRAITS[k].icon} ${TD.TRAITS[k].name}</b><span>${TD.TRAITS[k].desc}</span></div>`).join('')}</div>` : '') +
      `<div class="cd-stats"><span>HP<b>${d.hp}${up('hp')}</b></span><span>${base.role === 'priest' ? '回復' : '攻撃'}<b>${d.atk}${up('atk')}</b></span><span>防御<b>${d.def}${up('def')}</b></span>` +
      `<span>コスト<b>${d.cost}</b></span><span>射程<b>${pv && pv.type === 'range' ? `${+(d.range * pv.mult).toFixed(1)}<small>(${d.range}×${pv.mult})</small>` : d.range}</b></span>` +
      `<span>${r.melee ? 'ブロック' : '配置先'}<b>${!r.melee ? '草地' : pv && pv.type === 'blockMult' ? `${Math.floor(d.block * pv.mult)}<small>(${d.block}×${pv.mult})</small>` : d.block}</b></span>` +
      `<span class="wide">再配置<b>${Math.round(TD.redeployTime(d))}秒<small>（撤退時 ${TD.RETREAT.minCooldown}〜${Math.round(TD.redeployTime(d))}秒）</small></b></span></div>` +
      `<div class="cd-levelup"><div class="cd-own"><i class="expbook"></i> 経験の書 <b>${save.crystals}</b></div>` +
      (prog.lv < maxLv
        ? `<div class="lv-row">${lvBtn('+1', prog.lv + 1)}${lvBtn('+5', prog.lv + 5)}${lvBtn('最大', Math.max(affordable, prog.lv + 1))}</div>`
        : `<div class="lv-max">${prog.lb < TD.GROWTH.maxLB ? 'レベル上限です。限界突破で上限が上がります' : 'これ以上は上げられません'}</div>`) +
      `</div>` +
      (base.skill
        ? `<div class="cd-skill"><div class="cd-skill-name">スキル「${base.skill.name}」<small>SP ${base.skill.sp}・タップで発動</small></div><div>${base.skill.desc}</div></div>`
        : `<div class="cd-skill passive"><div class="cd-skill-name">常時スキル「${base.passive.name}」<small>配置中ずっと有効</small></div><div>${base.passive.desc}</div></div>`) +
      `<button class="btn ${inParty ? 'ghost' : 'primary'}" id="btn-toggle-party">${inParty ? '編成から外す' : '編成に加える'}</button>`;
    box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
      const to = +b.dataset.lv, cost = lvUpCost(prog.lv, to);
      if (cost > save.crystals || to <= prog.lv) return;
      save.crystals -= cost;
      prog.lv = to;
      TD.Live.track(save, 'levelups');
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
    if (bannerIdx >= banners.length) bannerIdx = 0;
    $('#banner-tabs').innerHTML = banners.length > 1 ? banners.map((b, i) => `<button class="${i === bannerIdx ? 'on' : ''}" data-bi="${i}">${esc(b.name)}</button>`).join('') : '';
    $('#banner-tabs').querySelectorAll('[data-bi]').forEach(b => b.onclick = () => { bannerIdx = +b.dataset.bi; renderSummon(); });
    const feat = bn.pickup.length ? bn.pickup : TD.Gacha.pool(5);
    $('#banner').className = `banner el-${bn.element}`;
    $('#banner').innerHTML =
      `<div class="bn-circle"></div>` +
      `<div class="bn-feat${feat.length > 1 ? ' multi' : ''}">${feat.map(id => TD.fullArtHTML(id)).join('')}</div>` +
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
    const bn = TD.GACHA.banners[bannerIdx], rows = TD.Gacha.rateTable(bn, save);
    const maxedNames = Object.keys(TD.CHARS).filter(id => TD.Gacha.maxed(save, id)).map(id => TD.CHARS[id].name);
    const sum = r => (TD.GACHA.rates[r] * 100).toFixed(0) + '%';
    modal(
      `<div class="pause-title">提供割合</div><div class="small" style="text-align:center">${esc(bn.name)}</div>` +
      `<div class="rate-sum"><span>★5 ${sum(5)}</span><span>★4 ${sum(4)}</span><span>★3 ${sum(3)}</span></div>` +
      `<table class="rate-table">${rows.map(r => `<tr class="${r.pickup ? 'pick' : ''}"><td>${TD.starsHTML(r.rarity, 0)}</td><td>${TD.CHARS[r.id].name}${r.pickup ? ' <b>PICK UP</b>' : ''}</td><td>${(r.rate * 100).toFixed(3)}%</td></tr>`).join('')}</table>` +
      `<p class="small">・10回召喚では★4以上が1体以上確定します。<br>・${TD.GACHA.pity}回以内に★5が出なかった場合、${TD.GACHA.pity}回目は★5確定です。<br>・限界突破が最大（${TD.GROWTH.maxLB}回）になったキャラは排出されなくなり、そのレアリティの他のキャラの確率が上がります。${maxedNames.length ? `<br>　現在の対象外：${maxedNames.map(esc).join('、')}` : ''}<br>・あるレアリティのキャラが全員限界突破済みの場合、そのレアリティが出たときは魔晶石に変換されます（★3:${TD.GROWTH.dupStones[3]} / ★4:${TD.GROWTH.dupStones[4]} / ★5:${TD.GROWTH.dupStones[5]}）。<br>・魔晶石はゲーム内で入手できるアイテムです。現実のお金は使いません。</p>` +
      `<div class="btn-row"><button class="btn primary" onclick="document.getElementById('modal').classList.remove('show')">閉じる</button></div>`);
  });

  function doPull(n) {
    const bn = TD.GACHA.banners[bannerIdx];
    const results = TD.Gacha.pull(save, bn, n);
    if (!results) { alertBox('魔晶石が足りません。ステージやミッションで集めましょう'); return; }
    TD.Live.track(save, 'pulls', n);
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
        if (!r.id) return `<div class="sf-card r${r.rarity}" style="animation-delay:${results.length === 1 ? 0 : i * 0.12}s"><i class="gem big"></i><em class="conv">魔晶石+${r.converted}</em><div class="sf-name">魔晶石</div>${TD.starsHTML(r.rarity, 0)}</div>`;
        const d = TD.CHARS[r.id];
        const tag = r.isNew ? '<em class="new">NEW</em>' : r.limitBreak ? `<em class="lbup">限界突破 ${r.limitBreak}</em>` : `<em class="conv">魔晶石+${r.converted}</em>`;
        return `<div class="sf-card r${r.rarity}" style="animation-delay:${results.length === 1 ? 0 : i * 0.12}s">` +
          `${results.length === 1 ? TD.fullArtHTML(r.id) : TD.portraitHTML(r.id, true)}${tag}<div class="sf-name">${d.name}</div>${TD.starsHTML(r.rarity, 0)}` +
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
      `<div class="brief-sec">プレイヤー名</div>` +
      `<div class="name-row"><input id="set-name" type="text" maxlength="10" value="${esc(save.playerName)}" placeholder="召喚士"><button class="btn ghost" data-act="name">変更</button></div>` +
      `<div class="brief-sec">アプリとしてインストール</div>` +
      `<p class="small">${installHelpText()}</p>` +
      (installPrompt ? `<button class="btn primary" data-act="install" style="width:100%">ホーム画面に追加する</button>` : '') +
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
    body.querySelector('[data-act=name]').onclick = () => {
      const v = body.querySelector('#set-name').value.trim().replace(/[<>{}]/g, '').slice(0, 10);
      save.playerName = v; persist(); renderHome(); alertBox(`プレイヤー名を「${v || '召喚士'}」にしました`);
    };
    const ib = body.querySelector('[data-act=install]');
    if (ib) ib.onclick = () => { closeModal(); promptInstall(); };
  }

  // ---------- PWA（アプリとしてインストール） ----------
  let installPrompt = null;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function installHelpText() {
    if (isStandalone()) return 'アプリとしてインストール済みです。';
    if (installPrompt) return 'ボタンを押すと、ホーム画面にアプリとして追加できます。オフラインでも遊べます。';
    if (isIOS()) return 'Safari 下部の共有ボタン（□↑）→「ホーム画面に追加」でアプリとして追加できます。';
    return 'ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。';
  }
  async function promptInstall() {
    if (!installPrompt) { alertBox(installHelpText()); return; }
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch (e) { /* 無視 */ }
    installPrompt = null;
    renderHome();
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; renderHome(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; renderHome(); });
  $('#btn-install').addEventListener('click', promptInstall);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* オフライン対応なしで続行 */ }));
  }

  // ---------- 起動 ----------
  $('#title-screen').addEventListener('click', () => {
    $('#title-screen').classList.add('hide');
    naviSay(TD.NAVI_LINES[0]);
    // 起動時の流れ：プロローグ → ログインボーナス → 初回プレゼント
    const after = () => showLoginBonus(() => checkGift());
    if (!save.story.prologue) setTimeout(() => playStory('prologue', after), 500);
    else setTimeout(after, 400);
  });
  show('screen-home');
  TD.app = { show, startBattle, playStory, get save() { return save; } };
})();
