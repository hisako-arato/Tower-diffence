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
  TD.prefs = save.opts;
  let battle = null, currentStage = null;
  let saveWarned = false;
  const persist = () => {
    TD.prefs = save.opts;
    const ok = TD.Save.store(save);
    if (!ok && !saveWarned) {
      saveWarned = true;
      setTimeout(() => alertBox('このブラウザではデータを保存できません（プライベートブラウズ等）。閉じると最初からになります。通常モードで開くか、ホーム画面に追加したアプリで遊んでください。'), 600);
    }
    return ok;
  };
  const owns = id => save.owned.includes(id);

  // ---------- 共通 ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    if (id === 'screen-home') renderHome();
    if (id === 'screen-stages') renderStages();
    if (id !== 'screen-party') $('#char-sheet').classList.remove('show');
    if (id === 'screen-party') renderParty();
    if (id === 'screen-summon') renderSummon();
    if (id === 'screen-story') renderStoryList();
    if (id === 'screen-mission') renderMissions();
  }
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.go === 'screen-stages' && b.closest('#screen-home')) openQuest([]);   // ホームから入るとトップから
    else show(b.dataset.go);
  }));

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
        : '英雄の召喚に使う魔法の石です。<br>初回クリア報酬・ミッション（毎日のログイン報酬を含む）・イベント交換所で手に入ります。'}</p>` +
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
    renderAdjutant();
    const cleared = Object.keys(save.cleared).length;
    $('#home-name').textContent = save.playerName || '召喚士';
    $('#btn-install').hidden = !installPrompt;
    const curIdx = TD.STAGES.findIndex(st => !save.cleared[st.id]);
    const curCh = (TD.STAGES[curIdx] || TD.STAGES[TD.STAGES.length - 1]).chapter;
    const chStages = TD.STAGES.filter(st => st.chapter === curCh);
    const chCleared = chStages.filter(st => save.cleared[st.id]).length;
    $('#home-progress').textContent = `${curCh.split(' ')[0]} 進行度 ${chCleared}/${chStages.length}・英雄 ${save.owned.length}/${Object.keys(TD.CHARS).length}`;
    if (TD.Live.ensureDaily(save)) persist();
    const n = TD.Live.claimableCount(save), badge = $('#mission-badge');
    badge.textContent = n; badge.hidden = !n;
    const evb = $('#home-event'), actives = activeEvents(), ev = actives[0];
    evb.hidden = !ev;
    if (ev) evb.innerHTML = `<span class="he-tag">EVENT${actives.length > 1 ? ' ×' + actives.length : ''}</span><span class="he-name">${esc(ev.name)}</span><span class="he-left">あと${TD.Live.eventDaysLeft(ev)}日</span>`;
  }
  // アプリを開いたまま日付が変わった場合も、デイリーミッション（ログイン報酬）を更新する
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && $('#screen-home').classList.contains('active')) renderHome();
  });
  function naviSay(text) {
    const b = $('#navi-bubble');
    b.textContent = text.replace(/\{name\}/g, save.playerName || '召喚士');
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  // ---------- 副官（ホーム） ----------
  let adjLine = 0;
  function renderAdjutant() {
    const id = save.party[0], box = $('#adjutant'), plate = $('#adj-plate');
    if (!id) { box.innerHTML = ''; plate.innerHTML = ''; return; }
    if (box.dataset.id !== id) { box.innerHTML = TD.fullArtHTML(id); box.dataset.id = id; }
    const d = TD.CHARS[id];
    plate.innerHTML = `<span class="ap-tag">副官</span><span class="ap-title">${esc(d.title)}</span><span class="ap-name">${esc(d.name)}</span>${TD.starsHTML(d.rarity, 0)}<span class="ap-lv">Lv${save.chars[id].lv}</span>`;
  }
  $('#adjutant').addEventListener('click', () => {
    const id = save.party[0]; if (!id) return;
    const d = TD.CHARS[id], lines = [d.lines.deploy, d.lines.skill].filter(Boolean);
    const b = $('#navi-bubble');
    b.textContent = `${d.name}「${lines[adjLine++ % lines.length]}」`;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    const a = $('#adjutant'); a.classList.remove('poke'); void a.offsetWidth; a.classList.add('poke');
  });

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
  // 開催中のイベント：新しく始まったものが上。同じ開始日なら定義順（前編 → 後編）
  function activeEvents() { return TD.EVENTS.filter(e => TD.Live.eventActive(e)).sort((a, b) => b.start.localeCompare(a.start)); }
  function eventStageOpen(st) { return !st.unlockAfter || save.cleared[st.unlockAfter] > 0; }
  // ホームのイベントバナー → 最新の開催中イベントのメニューへ直接
  $('#home-event').addEventListener('click', () => {
    const actives = activeEvents();
    openQuest(actives.length ? [{ v: 'events' }, { v: 'event', ev: actives[0].id }] : []);
  });

  // ---------- ストーリー ----------
  const adv = new TD.Adv($('#adv'));
  function playStory(id, cb) {
    if (!TD.STORY[id]) { cb && cb(); return; }
    adv.play(id, save.playerName || '', () => {
      save.story[id] = true;
      persist();
      renderHome();
      cb && cb();
    }, name => {
      // 名前を決めた時点でプロローグは「見た」ことにする（途中で閉じても再度聞かれない）
      save.playerName = name;
      if (id === 'prologue') save.story.prologue = true;
      persist();
      naviSay(TD.NAVI_LINES[0]);
    });
  }
  const storyFor = (st, kind) => { const id = `${st.id}-${kind}`; return TD.STORY[id] ? id : null; };

  function storyUnlockHint(id) {
    if (id.startsWith('event-')) return 'クエスト＞イベントから見られます（開催期間中）';
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
    html += `<div class="story-next">― 物語は完結しました ―</div>`;
    list.innerHTML = html;
    list.querySelectorAll('[data-ep]').forEach(b => b.onclick = () => {
      const id = b.dataset.ep;
      if (save.story[id] || id === 'prologue' || TD.EVENTS.some(e => e.story === id && TD.Live.eventActive(e))) playStory(id, () => renderStoryList());
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
  // ---------- クエスト選択（階層） ----------
  // qstack: 現在の階層。[] = トップ（ストーリー / デイリー / イベント）
  //   {v:'chapters'} → {v:'chapter', ch} / {v:'daily'} / {v:'events'} → {v:'event', ev} → {v:'evq'|'evshop', ev}
  let qstack = [];
  const chapters = () => [...new Set(TD.STAGES.map(st => st.chapter))];
  const evById = id => TD.EVENTS.find(e => e.id === id);
  function openQuest(stack) {
    qstack = stack.slice();
    // 階層ごとに履歴を積む（「戻る」ボタン・端末の戻る操作で1段ずつ戻れるように）
    history.replaceState({ q: 0 }, '');
    for (let i = 1; i <= qstack.length; i++) history.pushState({ q: i }, '');
    show('screen-stages');
  }
  function qpush(node) {
    qstack.push(node);
    history.pushState({ q: qstack.length }, '');
    renderStages();
    $('#stage-list').scrollTop = 0;
  }
  function qback() {
    if (!qstack.length) { show('screen-home'); return; }
    if (history.state && history.state.q === qstack.length) history.back();   // popstate で1段戻る
    else { qstack.pop(); renderStages(); }
  }
  window.addEventListener('popstate', () => {
    if (!$('#screen-stages').classList.contains('active') || $('#modal').classList.contains('show')) return;
    if (qstack.length) { qstack.pop(); renderStages(); }
  });
  $('#quest-back').addEventListener('click', qback);

  function chapterInfo(ch) {
    const sts = TD.STAGES.filter(st => st.chapter === ch);
    const first = TD.STAGES.indexOf(sts[0]);
    return { sts, open: stageUnlocked(first), cleared: sts.filter(st => save.cleared[st.id] > 0).length,
      stars: sts.reduce((a, st) => a + (save.cleared[st.id] || 0), 0) };
  }
  function evShopReady(ev) {
    const es = TD.Live.eventState(save, ev);
    return ev.shop.some(it => (es.shop[it.id] || 0) < it.limit && es.pts >= it.cost);
  }
  function qcard(cls, title, sub, tag, onclick, locked) {
    const el = document.createElement('button');
    el.className = `q-card ${cls}${locked ? ' locked' : ''}`;
    el.innerHTML = `<span class="qc-title">${title}</span><span class="qc-sub">${sub}</span>${tag ? `<span class="qc-tag">${tag}</span>` : ''}<span class="qc-arrow">${locked ? '🔒' : '›'}</span>`;
    if (!locked) el.onclick = onclick;
    return el;
  }
  function eventHeadHTML(ev) {
    const es = TD.Live.eventState(save, ev), active = TD.Live.eventActive(ev);
    const [main, subt] = ev.name.split('　');
    return `<div class="event-head el-${ev.element}"><div class="eh-name">${esc(main)}</div>${subt ? `<div class="eh-sub">${esc(subt)}</div>` : ''}` +
      `<div class="eh-period">${ev.start.replace(/-/g, '/')} 〜 ${ev.end.replace(/-/g, '/')}${active ? `（あと${TD.Live.eventDaysLeft(ev)}日）` : '（終了しました）'}</div>` +
      `<p>${esc(ev.desc)}</p><div class="eh-pts"><i class="star"></i> ${esc(ev.currency)} <b>${es.pts}</b></div></div>`;
  }

  function renderStages() {
    updateCurrency();
    TD.Live.ensureDaily(save);
    // 期間が終わったイベントの階層にいたらトップへ戻す
    if (qstack.some(n => n.ev && !TD.Live.eventActive(evById(n.ev)))) qstack = [];
    const list = $('#stage-list'), node = qstack[qstack.length - 1] || { v: 'top' };
    list.innerHTML = '';
    const titles = { top: 'クエスト', chapters: 'ストーリー', daily: 'デイリー', events: 'イベント', evshop: '交換所' };
    $('#quest-title').textContent = node.v === 'chapter' ? node.ch.split(/[\s　]/)[0]
      : node.ev ? (node.v === 'evshop' ? '交換所' : evById(node.ev).short || evById(node.ev).name) : titles[node.v];
    $('#quest-back').textContent = qstack.length ? '‹ 戻る' : '‹ ホーム';
    const add = el => list.appendChild(el);

    if (node.v === 'top') {
      // ストーリー
      const prog = [...TD.STAGES].reverse().find(st => save.cleared[st.id] > 0);
      const allStars = TD.STAGES.reduce((a, st) => a + (save.cleared[st.id] || 0), 0);
      add(qcard('story', 'ストーリー', prog ? `${prog.id}まで進行・★${allStars}/${TD.STAGES.length * 3}` : 'ここから冒険が始まります', '', () => qpush({ v: 'chapters' })));
      // デイリー
      const d = TD.DAILY_STAGES[0], dOpen = save.cleared[d.unlockAfter] > 0, left = TD.Live.runsLeft(save, d);
      add(qcard('daily', 'デイリー', dOpen ? `${esc(d.name)}・本日あと${left}/${d.dailyLimit}回` : `${d.unlockAfter}クリアで解放`, dOpen && left ? '' : '', () => qpush({ v: 'daily' }), !dOpen));
      // イベント
      const actives = TD.EVENTS.filter(e => TD.Live.eventActive(e));
      add(qcard('event', 'イベント', actives.length ? `開催中 ${actives.length}` : '開催予定なし',
        actives.some(evShopReady) ? '交換可' : '', () => qpush({ v: 'events' }), !actives.length));
    } else if (node.v === 'chapters') {
      const chs = chapters();
      const cur = chs.find(ch => { const i = chapterInfo(ch); return i.open && i.cleared < i.sts.length; });
      for (const ch of chs) {
        const i = chapterInfo(ch);
        const unread = i.open && i.sts.some(st => [storyFor(st, 'pre'), storyFor(st, 'post')].some(id => id && !save.story[id]) && (st === i.sts[0] || save.cleared[i.sts[i.sts.indexOf(st) - 1].id]));
        add(qcard('chapter', esc(ch), i.open ? `クリア ${i.cleared}/${i.sts.length}・★${i.stars}/${i.sts.length * 3}` : `${TD.STAGES[TD.STAGES.indexOf(i.sts[0]) - 1].id}クリアで解放`,
          ch === cur ? '進行中' : i.stars === i.sts.length * 3 ? 'COMPLETE' : '', () => qpush({ v: 'chapter', ch }), !i.open));
        if (unread) list.lastChild.insertAdjacentHTML('beforeend', '<span class="st-story">STORY</span>');
      }
      list.insertAdjacentHTML('beforeend', `<div class="story-next">― 物語は完結しました ―</div>`);
    } else if (node.v === 'chapter') {
      list.insertAdjacentHTML('beforeend', `<div class="chapter-title">${esc(node.ch)}</div>`);
      TD.STAGES.forEach((st, i) => {
        if (st.chapter !== node.ch) return;
        const open = stageUnlocked(i), best = save.cleared[st.id] || 0;
        const el = document.createElement('button');
        el.className = 'stage-item' + (open ? '' : ' locked') + (st.waves.some(w => TD.ENEMIES[w.e].boss) ? ' boss' : '');
        el.innerHTML = `<span class="st-id">${st.id}</span><span class="st-name">${st.name}<small>${st.recLv ? `推奨Lv${st.recLv}・` : ''}経験の書 ×${TD.stageExp(st)}</small></span>` +
          `<span class="st-stars">${open ? TD.starsHTML(best, 3) : '🔒'}</span>`;
        const unreadStory = open && [storyFor(st, 'pre'), storyFor(st, 'post')].some(id => id && !save.story[id]);
        if (unreadStory) el.insertAdjacentHTML('beforeend', '<span class="st-story">STORY</span>');
        if (open) el.addEventListener('click', () => openBrief(st));
        add(el);
      });
    } else if (node.v === 'daily') {
      list.insertAdjacentHTML('beforeend', `<div class="chapter-title daily">デイリークエスト<small>毎日0時に回数が戻ります</small></div>`);
      for (const st of TD.DAILY_STAGES) {
        const unlocked = save.cleared[st.unlockAfter] > 0, left = TD.Live.runsLeft(save, st);
        add(stageItem(st, unlocked && left > 0, `経験の書 ×${TD.stageExp(st)}・本日あと${left}回`,
          !unlocked ? `${st.unlockAfter}クリアで解放` : '本日の挑戦回数は終了しました'));
      }
    } else if (node.v === 'events') {
      const actives = activeEvents();
      for (const ev of actives) {
        const es = TD.Live.eventState(save, ev);
        add(qcard('event', esc(ev.name), `あと${TD.Live.eventDaysLeft(ev)}日・${esc(ev.currency)} ${es.pts}`,
          evShopReady(ev) ? '交換可' : !save.story[ev.story] ? 'NEW' : '', () => qpush({ v: 'event', ev: ev.id })));
      }
      if (!actives.length) list.insertAdjacentHTML('beforeend', `<div class="story-next">開催中のイベントはありません</div>`);
    } else if (node.v === 'event') {
      const ev = evById(node.ev);
      list.insertAdjacentHTML('beforeend', eventHeadHTML(ev));
      const sb = document.createElement('button');
      sb.className = 'story-item';
      sb.innerHTML = `<span class="si-title">イベントストーリーを見る</span><span class="si-sub">${save.story[ev.story] ? '▶ 再生' : 'NEW'}</span>`;
      sb.onclick = () => playStory(ev.story, renderStages);
      add(sb);
      const cleared = ev.stages.filter(st => save.cleared[st.id] > 0).length;
      add(qcard('evq', 'クエストへ', `${ev.stages.length}ステージ・クリア ${cleared}/${ev.stages.length}`, '', () => qpush({ v: 'evq', ev: ev.id })));
      add(qcard('evshop', '交換所', `${esc(ev.currency)}で英雄の欠片などと交換`, evShopReady(ev) ? '交換可' : '', () => qpush({ v: 'evshop', ev: ev.id })));
    } else if (node.v === 'evq') {
      const ev = evById(node.ev), es = TD.Live.eventState(save, ev);
      list.insertAdjacentHTML('beforeend', `<div class="chapter-title event">${esc(ev.name)}<small><i class="star"></i> ${esc(ev.currency)} ${es.pts}</small></div>`);
      for (const st of ev.stages) add(stageItem(st, eventStageOpen(st), `${ev.currency} ×${st.eventPoints}${st.recLv ? `・推奨Lv${st.recLv}` : ''}`, st.lockText || `${st.unlockAfter}クリアで解放`));
    } else if (node.v === 'evshop') {
      const ev = evById(node.ev), es = TD.Live.eventState(save, ev);
      list.insertAdjacentHTML('beforeend', `<div class="shop-head">${esc(ev.name)}<div class="eh-pts"><i class="star"></i> ${esc(ev.currency)} <b>${es.pts}</b></div></div>`);
      const box = document.createElement('div');
      box.innerHTML = ev.shop.map(it => {
        const used = es.shop[it.id] || 0, left = it.limit - used, ok = left > 0 && es.pts >= it.cost;
        return `<div class="shop-item"><div class="si-icon">${it.char ? TD.portraitHTML(it.char) : it.reward.stones ? '<i class="gem big"></i>' : '<i class="expbook big"></i>'}</div>` +
          `<div class="si-body"><div class="si-title">${esc(it.name)}</div><div class="si-sub">交換上限 ${left}/${it.limit}</div></div>` +
          `<button class="btn ${ok ? 'primary' : 'ghost'}" data-shop="${it.id}" ${ok ? '' : 'disabled'}><i class="star"></i>${it.cost}</button></div>`;
      }).join('');
      box.querySelectorAll('[data-shop]').forEach(b => b.onclick = () => {
        const it = ev.shop.find(x => x.id === b.dataset.shop), r = TD.Live.exchange(save, it, ev);
        if (!r) return;
        persist(); renderStages();
        if (it.char) toast(r.isNew ? `${TD.CHARS[it.char].name}が仲間になった！` : r.limitBreak ? `${TD.CHARS[it.char].name}が限界突破 ${r.limitBreak}！` : `魔晶石 ×${r.converted} に変換されました`);
        else toast(`${TD.Live.rewardText(it.reward)} を受け取りました`);
      });
      add(box);
    }
  }

  function openBrief(st) {
    const types = [...new Set(st.waves.map(w => w.e))];
    const enemies = types.map(t => {
      const e = TD.ENEMIES[t];
      return `<li>${TD.elemChip(e.element)}${esc(e.name)}${e.boss ? ' <b class="boss-tag">BOSS</b>' : ''}</li>`;
    }).join('');
    const party = save.party.map((id, i) => `<span class="bp${i === 0 ? ' adj' : ''}">${TD.portraitHTML(id)}<small>${i === 0 ? '副官' : 'Lv' + save.chars[id].lv}</small></span>`).join('');
    const first = !save.cleared[st.id];
    const rewardText = st.type === 'daily' ? `経験の書 ×${TD.stageExp(st)}（本日あと${TD.Live.runsLeft(save, st)}回）`
      : st.type === 'event' ? `${TD.eventOf(st).currency} ×${st.eventPoints}・経験の書 ×${TD.stageExp(st)}${first ? `・魔晶石 ×${st.reward}（初回）` : ''}`
      : `経験の書 ×${TD.stageExp(st)}・魔晶石 ×${first ? st.reward + '（初回）' : `${TD.REPEAT_REWARD.base}（★3なら${TD.REPEAT_REWARD.star3}）`}`;
    const body = modal(
      `<div class="brief-head"><span class="st-id">${st.id}</span>${esc(st.name)}</div>` +
      `<div class="brief-navi"><span class="mini-navi"></span><p>${esc(st.brief)}</p></div>` +
      (st.map.join('').split('G').length - 1 >= 2 ? `<div class="brief-goals">⚠ 守る拠点が2つあります（どちらに届いてもライフが減ります）</div>` : '') +
      `<div class="brief-sec">出現する敵</div><ul class="enemy-list">${enemies}</ul>` +
      `<div class="brief-sec">出撃メンバー<small class="brief-stars${TD.partyValid(save.party) ? '' : ' over'}">副官以外の★ ${TD.partyStars(save.party)} / ${TD.ADJUTANT.starCap}</small></div><div class="brief-party">${party}</div>` +
      (TD.partyEffectsText(save.party) ? `<div class="brief-fx">ユニークスキル：${TD.partyEffectsText(save.party)}</div>` : '') +
      (st.recLv ? (() => { const avg = Math.round(save.party.reduce((a, id) => a + save.chars[id].lv, 0) / save.party.length);
        return `<div class="brief-rec${avg < st.recLv ? ' low' : ''}">推奨Lv ${st.recLv}<small>（編成の平均 Lv${avg}${avg < st.recLv ? '・育成すると楽になります' : ''}）</small></div>`; })() : '') +
      `<div class="brief-sub">ライフ ${st.lives}・初期マナ ${st.mana}<br>報酬：${rewardText}</div>` +
      `<div class="btn-row"><button class="btn ghost" data-act="party">編成する</button><button class="btn primary" data-act="go">出撃！</button></div>`);
    body.querySelector('[data-act=party]').onclick = () => { closeModal(); show('screen-party'); };
    body.querySelector('[data-act=go]').onclick = () => {
      if (!partyOk()) return;
      closeModal();
      const pre = st.type === 'event' && !save.story[TD.eventOf(st).story] ? TD.eventOf(st).story : storyFor(st, 'pre');
      if (pre && !save.story[pre]) playStory(pre, () => startBattle(st));
      else startBattle(st);
    };
  }

  // ---------- バトル ----------
  const bEls = {
    canvas: $('#battle-canvas'), cards: $('#deploy-cards'), manaFill: $('#mana-fill'), manaText: $('#mana-text'),
    lives: $('#hud-lives'), enemies: $('#hud-enemies'), menu: $('#unit-menu'), cutin: $('#cutin'), toast: $('#battle-toast'),
  };

  function partyOk() {
    if (TD.partyValid(save.party)) return true;
    alertBox(`副官以外の★の合計が${TD.partyStars(save.party)}で、上限${TD.ADJUTANT.starCap}を超えています。編成を見直してください`);
    return false;
  }
  function startBattle(st) {
    if (battle) battle.destroy();
    currentStage = st;
    show('screen-battle');
    $('#hud-stage').textContent = `${st.id} ${st.name}`;
    $('#btn-speed').textContent = '▶ x1';
    const party = save.party.map((id, i) => {
      const def = TD.charStats(id, save.chars[id]);
      if (i === 0) { // 副官補正
        const m = TD.ADJUTANT.statMult;
        Object.assign(def, { hp: Math.round(def.hp * m), atk: Math.round(def.atk * m), def: Math.round(def.def * m), adjutant: true });
      }
      return { id, def };
    });
    // 編成効果（出撃メンバーにいるだけで有効・重ねがけ可）
    const fx = TD.partyEffects(save.party);
    for (const p of party) {
      const f = TD.partyEffects(save.party, p.def); // 属性・職業でしぼった効果も含めて計算
      p.def.hp = Math.round(p.def.hp * (1 + f.hp));
      p.def.atk = Math.round(p.def.atk * (1 + f.atk));
      p.def.def = Math.round(p.def.def * (1 + f.def));
    }
    battle = new TD.Battle(st, party, bEls, onBattleEnd);
    if (fx.mana) battle.mana = Math.min(99, battle.mana + fx.mana);
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
    let exp = r.win ? TD.stageExp(st) : Math.round(TD.stageExp(st) * 0.2);
    // 常時スキル「宝探し」：出撃メンバーにいれば経験の書が増える（重複しない・最大のもの）
    const expBonus = 1 + TD.partyEffects(save.party).exp;
    exp = Math.round(exp * expBonus);
    let evPts = 0;
    TD.Live.track(save, 'kills', r.killed);
    TD.Live.track(save, 'skills', r.skills || 0);
    if (r.win) {
      TD.Live.track(save, 'wins');
      const prev = save.cleared[st.id] || 0;
      if (!prev && st.reward) { stones += st.reward; notes.push(`初回クリア ×${st.reward}`); }
      else if (!st.type) {
        const rr = r.stars === 3 ? TD.REPEAT_REWARD.star3 : TD.REPEAT_REWARD.base;
        stones += rr; notes.push(`クリア報酬 ×${rr}${r.stars === 3 ? '（★3）' : ''}`);
      }
      if (st.type === 'daily') { save.daily.runs[st.id] = (save.daily.runs[st.id] || 0) + 1; TD.Live.track(save, 'caves'); }
      if (st.type === 'event') { evPts = st.eventPoints; TD.Live.eventState(save, TD.eventOf(st)).pts += evPts; }
      if (r.stars === 3 && prev < 3) { stones += 20; notes.push('★3達成 ×20'); }
      save.cleared[st.id] = Math.max(prev, r.stars);
    }
    // ユニークスキル：クリア時の魔晶石が増える（重ねがけ可）
    const stoneFx = TD.partyEffects(save.party).stones;
    if (stones && stoneFx) { const add = Math.round(stones * stoneFx); stones += add; notes.push(`ユニークスキル +${add}`); }
    save.stones += stones;
    save.crystals += exp;
    persist();
    const idx = TD.STAGES.indexOf(st), next = idx >= 0 ? TD.STAGES[idx + 1] : null;
    const body = modal(
      `<div class="result ${r.win ? 'win' : 'lose'}">` +
      `<div class="res-title">${r.win ? 'VICTORY' : 'DEFEAT'}</div>` +
      (r.win ? `<div class="res-stars">${[1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>` : `<div class="res-msg">結界が破られてしまった……<br><small>キャラを育成して再挑戦しましょう</small></div>`) +
      `<div class="res-stats">撃破 ${r.killed}/${r.total}・残りライフ ${r.lives}/${r.maxLives}</div>` +
      (r.win ? `<div class="res-cond"><div class="${r.stars >= 1 ? 'ok' : ''}">★ ステージクリア</div><div class="${r.stars >= 2 ? 'ok' : ''}">★ ライフを半分以上残す</div><div class="${r.stars >= 3 ? 'ok' : ''}">★ ライフを減らさずクリア</div></div>` : '') +
      `<div class="res-reward">` +
      `<div><i class="expbook"></i> 経験の書 +${exp}${expBonus > 1 ? `<small class="bonus">（ユニークスキル +${Math.round((expBonus - 1) * 100)}%）</small>` : ''}</div>` +
      (evPts ? `<div><i class="star"></i> ${esc(TD.eventOf(st).currency)} +${evPts}</div>` : '') +
      (stones ? `<div><i class="gem"></i> 魔晶石 +${stones}</div><small>${notes.join(' / ')}</small>` : '') +
      `</div></div>` +
      `<div class="btn-col">` +
      (r.win && next ? `<button class="btn primary" data-act="next">次のステージへ</button>` : '') +
      (!r.win ? `<button class="btn primary" data-act="party">育成する</button>` : '') +
      `<button class="btn ${r.win && next ? 'ghost' : r.win ? 'primary' : 'ghost'}" data-act="retry">もう一度</button>` +
      `<button class="btn ghost" data-act="stages">${st.type === 'event' ? 'イベントへ' : st.type === 'daily' ? 'デイリーへ' : 'ステージ選択へ'}</button></div>`, 'locked');
    const post = r.win ? storyFor(st, 'post') : null;
    const pendingPost = post && !save.story[post];
    if (pendingPost) body.insertAdjacentHTML('afterbegin', '<div class="res-story">クリア後のストーリーが始まります</div>');
    const leave = () => { closeModal(); if (battle) { battle.destroy(); battle = null; } };
    const on = (act, fn) => {
      const b = body.querySelector(`[data-act=${act}]`);
      if (b) b.onclick = () => (pendingPost ? () => { leave(); show('screen-stages'); playStory(post, fn); } : fn)();
    };
    on('next', () => { leave(); if (next.chapter !== st.chapter) qstack = [{ v: 'chapters' }, { v: 'chapter', ch: next.chapter }]; show('screen-stages'); openBrief(next); });
    on('party', () => { leave(); show('screen-party'); });
    on('retry', () => {
      leave();
      if (st.type === 'daily' && TD.Live.runsLeft(save, st) <= 0) { show('screen-stages'); alertBox('本日の挑戦回数は終了しました'); }
      else if (partyOk()) startBattle(st);
    });
    on('stages', () => { leave(); show('screen-stages'); });
  }

  // ---------- 編成・育成 ----------
  let partySel = null, listIds = [];
  const filter = { rarity: 'all', element: 'all', role: 'all' };
  const sheetOpen = () => $('#char-sheet').classList.contains('show');
  function openSheet(id) {
    partySel = id;
    renderDetail();
    const sh = $('#char-sheet');
    if (!sh.classList.contains('show')) { sh.classList.add('show'); sh.querySelector('.scroll').scrollTop = 0; }
    renderParty();
  }
  function closeSheet() { $('#char-sheet').classList.remove('show'); renderParty(); }
  document.querySelectorAll('[data-sheet]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.sheet;
    if (a === 'close') return closeSheet();
    const i = listIds.indexOf(partySel);
    if (i < 0 || !listIds.length) return;
    const ni = (i + (a === 'next' ? 1 : -1) + listIds.length) % listIds.length;
    partySel = listIds[ni];
    renderDetail();
    $('#char-sheet .scroll').scrollTop = 0;
  }));

  function renderFilter() {
    const chips = [['rarity', 'all', 'すべて'], ['rarity', 5, '★5'], ['rarity', 4, '★4'], ['rarity', 3, '★3']];
    const els = [['element', 'all', '全属性'], ...Object.keys(TD.ELEMENTS).map(k => ['element', k, TD.ELEMENTS[k].name])];
    const roles = [['role', 'all', '全職業'], ...Object.keys(TD.ROLES).map(k => ['role', k, TD.ROLES[k].name])];
    const html = arr => arr.map(([k, v, label]) => `<button class="fchip${String(filter[k]) === String(v) ? ' on' : ''}${k === 'element' && v !== 'all' ? ' el-' + v : ''}" data-fk="${k}" data-fv="${v}">${label}</button>`).join('');
    $('#roster-filter').innerHTML = `<div class="frow">${html(chips)}</div><div class="frow">${html(els)}</div><div class="frow">${html(roles)}</div>`;
    $('#roster-filter').querySelectorAll('[data-fk]').forEach(b => b.onclick = () => {
      filter[b.dataset.fk] = b.dataset.fv === 'all' ? 'all' : (b.dataset.fk === 'rarity' ? +b.dataset.fv : b.dataset.fv);
      renderParty();
    });
  }

  function renderParty() {
    updateCurrency();
    const slots = $('#party-slots');
    slots.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const id = save.party[i], el = document.createElement('button');
      el.className = 'slot' + (id ? '' : ' empty') + (i === 0 ? ' adj' : '') + (id && id === partySel && sheetOpen() ? ' sel' : '');
      el.innerHTML = (i === 0 ? '<em class="slot-tag">副官</em>' : '') + (id ? `${TD.portraitHTML(id)}<span>${i === 0 ? '👑 ' : ''}Lv${save.chars[id].lv}</span>` : '<span>空き</span>');
      if (id) el.addEventListener('click', () => openSheet(id));
      slots.appendChild(el);
    }
    const stars = TD.partyStars(save.party), cap = TD.ADJUTANT.starCap;
    const fxText = TD.partyEffectsText(save.party);
    $('#party-stars').innerHTML = `副官以外の★ <b>${stars}</b> / ${cap}` + (fxText ? `<span class="ps-fx">ユニークスキル：${fxText}</span>` : '') + (stars > cap ? '<em>上限を超えています。誰かを外すまで出撃できません</em>' : '');
    $('#party-stars').classList.toggle('over', stars > cap);
    renderFilter();
    const roster = $('#roster'), scroller = $('.roster-scroll'), keepTop = scroller.scrollTop;
    roster.style.minHeight = roster.offsetHeight + 'px'; // 作り直しの間に高さが縮んでスクロール位置が飛ばないようにする
    roster.innerHTML = '';
    // 一覧には所持している英雄だけを並べる
    listIds = Object.keys(TD.CHARS)
      .filter(id => owns(id) && (filter.rarity === 'all' || TD.CHARS[id].rarity === filter.rarity) && (filter.element === 'all' || TD.CHARS[id].element === filter.element)
        && (filter.role === 'all' || TD.CHARS[id].role === filter.role))
      .sort((a, b) => (TD.CHARS[b].rarity - TD.CHARS[a].rarity));
    $('#roster-count').textContent = `表示中 ${listIds.length}人（所持 ${save.owned.length}人）`;
    if (!listIds.length) roster.innerHTML = '<div class="roster-empty">条件に合う英雄はいません</div>';
    for (const id of listIds) {
      const d = TD.CHARS[id], el = document.createElement('button'), have = owns(id);
      el.className = `char-card r${d.rarity}` + (have ? '' : ' unowned') + (save.party.includes(id) ? ' in-party' : '') + (partySel === id && sheetOpen() ? ' sel' : '');
      el.innerHTML = `${TD.portraitHTML(id, false, !have)}<span class="cc-name">${have ? d.name : '？？？'}</span>${TD.starsHTML(d.rarity, 0)}` +
        (have ? `<span class="cc-lv">Lv${save.chars[id].lv}</span>${TD.lbHTML(save.chars[id].lb)}` : '<span class="cc-lv">未所持</span>') +
        (d.passive && !d.skill ? '<span class="cc-pas">常時</span>' : '') +
        (TD.uniquesOf(d).length ? '<span class="cc-fx">ユニーク</span>' : '');
      el.addEventListener('click', () => openSheet(id));
      roster.appendChild(el);
    }
    roster.style.minHeight = '';
    scroller.scrollTop = keepTop;
    if (sheetOpen()) renderDetail();
  }

  function lvUpCost(from, to) {
    let c = 0;
    for (let l = from; l < to; l++) c += TD.GROWTH.expCost(l);
    return c;
  }

  function renderDetail() {
    const box = $('#char-detail');
    if (!partySel) { box.innerHTML = ''; return; }
    const pos = listIds.indexOf(partySel);
    $('#sheet-pos').textContent = pos >= 0 ? `${pos + 1} / ${listIds.length}` : '';
    const id = partySel, base = TD.CHARS[id], r = TD.ROLES[base.role], have = owns(id);
    if (!have) {
      $('#sheet-foot').innerHTML = '';
      box.innerHTML =
        `<div class="cd-head">${TD.portraitHTML(id, true, true)}<div><div class="cd-title">${base.title}</div>` +
        `<div class="cd-name">？？？</div>${TD.starsHTML(base.rarity, 0)} ${TD.elemChip(base.element)}<span class="chip role">${r.name}</span></div></div>` +
        (base.eventOnly
          ? `<p class="hint">イベント「${esc((TD.eventCharSource(id) || {}).name || '')}」の交換所で仲間にできる英雄です（召喚には出ません）。</p><button class="btn primary" data-go-summon>交換所へ</button>`
          : `<p class="hint">まだ出会っていない英雄です。「召喚」で仲間にしましょう。</p><button class="btn primary" data-go-summon>召喚へ</button>`);
      box.querySelector('[data-go-summon]').onclick = () => { $('#char-sheet').classList.remove('show'); if (base.eventOnly) { const ev = TD.eventCharSource(id); openQuest(ev && TD.Live.eventActive(ev) ? [{ v: 'events' }, { v: 'event', ev: ev.id }, { v: 'evshop', ev: ev.id }] : [{ v: 'events' }]); } else show('screen-summon'); };
      return;
    }
    const prog = save.chars[id], d = TD.charStats(id, prog), maxLv = TD.maxLv(prog.lb), inParty = save.party.includes(id);
    const pv = base.passive;
    const next = prog.lv < maxLv ? TD.charStats(id, { lv: prog.lv + 1, lb: prog.lb }) : null;
    const up = (k) => next ? `<em>→${next[k]}</em>` : '';
    // 出撃時の数値（副官の補正とユニークスキルを反映）
    const sortieHTML = () => {
      if (!inParty) return '';
      const f = TD.partyEffects(save.party, d), am = save.party[0] === id ? TD.ADJUTANT.statMult : 1;
      const v = { hp: Math.round(d.hp * am * (1 + f.hp)), atk: Math.round(d.atk * am * (1 + f.atk)), def: Math.round(d.def * am * (1 + f.def)) };
      if (v.hp === d.hp && v.atk === d.atk && v.def === d.def) return '';
      const pct = (a, b) => b === a ? '' : `<small>+${Math.round((b / a - 1) * 100)}%</small>`;
      const src = [am > 1 ? '副官' : '', f.hp || f.atk || f.def ? 'ユニークスキル' : ''].filter(Boolean).join('・');
      return `<div class="cd-sortie"><div class="cs-title">出撃時のステータス<small>（${src}の効果込み）</small></div>` +
        `<div class="cs-row"><span>HP<b>${v.hp}</b>${pct(d.hp, v.hp)}</span><span>${base.role === 'priest' ? '回復' : '攻撃'}<b>${dps(v.atk)}</b>${pct(d.atk, v.atk)}</span><span>防御<b>${v.def}</b>${pct(d.def, v.def)}</span></div></div>`;
    };
    // 攻撃・回復は1秒あたりの量（攻撃力 ÷ 攻撃間隔）で表示する
    const dps = v => Math.round(v / d.interval);
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
      `<div class="cd-lb">限界突破 ${TD.lbHTML(prog.lb)}<small>${prog.lb < TD.GROWTH.maxLB ? '同じ英雄の欠片を召喚すると突破' : '欠片がすべて集まりました'}</small></div></div>` +
      (base.profile ? `<div class="cd-profile">${base.profile}</div>` : '') +
      `<div class="cd-role">${r.desc}</div>` +
      `<div class="cd-stats"><span>HP<b>${d.hp}${up('hp')}</b></span><span>${base.role === 'priest' ? '回復' : '攻撃'}<b>${dps(d.atk)}${next ? `<em>→${dps(next.atk)}</em>` : ''}</b></span><span>防御<b>${d.def}${up('def')}</b></span>` +
      `<span>コスト<b>${d.cost}</b></span><span>射程<b>${pv && pv.type === 'range' ? `${+(d.range * pv.mult).toFixed(1)}<small>(${d.range}×${pv.mult})</small>` : d.range}</b></span>` +
      (d.splash ? `<span>範囲<b>${pv && pv.type === 'splash' ? `${+(d.splash * pv.mult).toFixed(2)}マス<small>(${d.splash}×${pv.mult})</small>` : d.splash + 'マス'}</b></span>` : '') +
      (r.melee ? `<span>ブロック<b>${(b => b ? `${d.block + b}<small>(${d.block}+${b})</small>` : d.block)(TD.blockBonus(d, save.party))}</b></span>` : '') +
      `<span class="${r.melee || d.splash ? 'wide' : 'wide2'}">再配置<b>${Math.round(TD.redeployTime(d))}秒<small>（撤退時 ${TD.RETREAT.minCooldown}〜${Math.round(TD.redeployTime(d))}秒）</small></b></span></div>` +
      sortieHTML() +
      `<div class="cd-levelup"><div class="cd-own"><i class="expbook"></i> 経験の書 <b>${save.crystals}</b></div>` +
      (prog.lv < maxLv
        ? `<div class="lv-row">${lvBtn('+1', prog.lv + 1)}${lvBtn('+5', prog.lv + 5)}${lvBtn('最大', Math.max(affordable, prog.lv + 1))}</div>`
        : `<div class="lv-max">${prog.lb < TD.GROWTH.maxLB ? 'レベル上限です。限界突破で上限が上がります' : 'これ以上は上げられません'}</div>`) +
      `</div>` +
      (base.skill ? `<div class="cd-skill"><div class="cd-skill-name">発動スキル「${base.skill.name}」<small>SP ${base.skill.sp}・タップで発動</small></div><div>${base.skill.desc}</div></div>` : '') +
      (base.passive ? `<div class="cd-skill passive"><div class="cd-skill-name">常時スキル「${base.passive.name}」<small>配置中ずっと有効</small></div><div>${base.passive.desc}</div></div>` : '') +
      TD.uniquesOf(base).map(u => `<div class="cd-skill partyfx"><div class="cd-skill-name">ユニークスキル「${u.icon ? u.icon + ' ' : ''}${u.name}」${u.note ? `<small>${u.note}</small>` : ''}</div><div>${u.desc}</div></div>`).join('') +
      '';
    // 副官・編成ボタンは画面下に固定（キャラを切り替えても位置が変わらない）
    $('#sheet-foot').innerHTML = `<div class="btn-row party-btns">` +
      (save.party[0] === id ? `<div class="adj-now">👑 副官に任命中<small>HP・攻撃・防御 +${Math.round((TD.ADJUTANT.statMult - 1) * 100)}%</small></div>` : `<button class="btn ghost" id="btn-adjutant">👑 副官に任命</button>`) +
      `<button class="btn ${inParty ? 'ghost' : 'primary'}" id="btn-toggle-party">${inParty ? '編成から外す' : '編成に加える'}</button></div>`;
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
        if (save.party.length >= 6) { alertBox('編成は最大6人（副官＋5人）までです。誰かを外してください'); return; }
        const next = [...save.party, id];
        if (!TD.partyValid(next)) { alertBox(`副官以外の★の合計が${TD.ADJUTANT.starCap}を超えるため編成できません（編成すると${TD.partyStars(next)}）`); return; }
        save.party = next;
      }
      persist();
      renderParty();
    };
    const adjBtn = $('#btn-adjutant');
    if (adjBtn) adjBtn.onclick = () => {
      let next;
      if (inParty) next = [id, ...save.party.filter(x => x !== id)];
      else {
        if (save.party.length >= 6) { alertBox('編成は最大6人（副官＋5人）までです。誰かを外してください'); return; }
        next = [id, ...save.party];
      }
      if (!TD.partyValid(next)) { alertBox(`副官を交代すると、副官以外の★の合計が${TD.partyStars(next)}になり、上限${TD.ADJUTANT.starCap}を超えます。先に誰かを外してください`); return; }
      save.party = next;
      persist();
      renderParty();
      renderHome();
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
    const left = TD.Gacha.fragmentsLeft(save), total = TD.Gacha.fragmentsLeft({ owned: [], chars: {} });
    const one = $('#btn-pull1'), ten = $('#btn-pull10');
    if (left <= 0) {
      $('#summon-info').innerHTML = `<b>すべての英雄の欠片が集まりました</b><span>召喚陣は静かに眠っています。新たな英雄の訪れを待ちましょう</span>`;
    } else {
      $('#summon-info').innerHTML = `まだ眠る英雄の欠片 <b>${left}</b><small> / ${total}</small><span>10回召喚では、★4以上の英雄の欠片が必ず1つ呼び寄せられます</span>`;
    }
    one.innerHTML = `1回召喚<small><i class="gem"></i>${TD.GACHA.single}</small>`;
    ten.innerHTML = left > 0 && left < 10 ? `10回召喚<small>欠片が足りません</small>` : `10回召喚<small><i class="gem"></i>${TD.GACHA.ten}</small>`;
    one.disabled = !TD.Gacha.canPull(save, 1).ok;
    ten.disabled = !TD.Gacha.canPull(save, 10).ok;
  }
  // ---------- テスト用の隠しコマンド（召喚陣を3秒以内に7回タップ） ----------
  let secretTaps = [];
  $('#banner').addEventListener('click', () => {
    if (!TD.DEBUG_COMMANDS) return;
    const now = Date.now();
    secretTaps = secretTaps.filter(t => now - t < 3000);
    secretTaps.push(now);
    if (secretTaps.length >= 7) { secretTaps = []; openSecretMenu(); }
  });
  function openSecretMenu() {
    const body = modal(
      `<div class="pause-title">テスト用メニュー</div>` +
      `<p class="small" style="text-align:center">テストプレイ用です</p>` +
      `<div class="btn-col">` +
      `<button class="btn primary" data-dbg="stones">魔晶石 +3000</button>` +
      `<button class="btn ghost" data-dbg="stones30k">魔晶石 +30000</button>` +
      `<button class="btn ghost" data-dbg="books">経験の書 +10000</button>` +
      `<button class="btn primary" data-dbg="allChars">全キャラを入手（イベント限定も含む）</button>` +
      `<div class="brief-sec">所持キャラのレベルをまとめて変更</div>` +
      `<div class="btn-row"><button class="btn ghost" data-dbg-lv="1">Lv1</button><button class="btn ghost" data-dbg-lv="30">Lv30</button><button class="btn ghost" data-dbg-lv="60">Lv60</button></div>` +
      `<p class="small" style="text-align:center">レベル上限に足りない分は限界突破も上がります（Lv30＝突破1回、Lv60＝突破4回）</p>` +
      `<button class="btn danger" data-dbg="resetFrag">英雄の欠片をリセット（初期の5人だけに戻す）</button>` +
      `<button class="btn ghost" data-dbg="close">閉じる</button></div>`);
    const done = text => { persist(); updateCurrency(); renderSummon(); toast(text); };
    body.querySelector('[data-dbg=stones]').onclick = () => { save.stones += 3000; done('魔晶石 +3000'); };
    body.querySelector('[data-dbg=stones30k]').onclick = () => { save.stones += 30000; done('魔晶石 +30000'); };
    body.querySelector('[data-dbg=books]').onclick = () => { save.crystals += 10000; done('経験の書 +10000'); };
    body.querySelector('[data-dbg=allChars]').onclick = () => {
      let n = 0;
      for (const id of Object.keys(TD.CHARS)) if (!save.owned.includes(id)) { save.owned.push(id); save.chars[id] = { lv: 1, lb: 0 }; n++; }
      done(n ? `${n}人の英雄が仲間になりました（全${save.owned.length}人）` : 'すでに全員そろっています');
      renderParty();
    };
    body.querySelectorAll('[data-dbg-lv]').forEach(b => b.onclick = () => {
      const lv = +b.dataset.dbgLv;
      for (const id of save.owned) {
        const c = save.chars[id] || (save.chars[id] = { lv: 1, lb: 0 });
        c.lb = Math.max(c.lb, Math.min(TD.GROWTH.maxLB, Math.ceil((lv - TD.GROWTH.baseMaxLv) / TD.GROWTH.lvPerLB)));
        c.lv = Math.min(lv, TD.maxLv(c.lb));
      }
      done(`所持キャラ${save.owned.length}人をLv${lv}にしました`);
      renderParty(); renderHome();
    });
    body.querySelector('[data-dbg=resetFrag]').onclick = () => {
      if (!confirm('仲間と限界突破をリセットして、初期の5人だけに戻します。よろしいですか？')) return;
      const d = TD.Save.defaults();
      save.owned = [...d.owned];
      save.chars = JSON.parse(JSON.stringify(d.chars));
      save.party = [...d.party];
      done('英雄の欠片をリセットしました');
    };
    body.querySelector('[data-dbg=close]').onclick = closeModal;
  }

  $('#btn-pull1').addEventListener('click', () => doPull(1));
  $('#btn-pull10').addEventListener('click', () => doPull(10));
  $('#btn-rates').addEventListener('click', () => {
    const bn = TD.GACHA.banners[bannerIdx], rows = TD.Gacha.rateTable(bn, save);
    const maxedNames = Object.keys(TD.CHARS).filter(id => TD.Gacha.maxed(save, id)).map(id => TD.CHARS[id].name);
    const rr = TD.Gacha.rarityRates(save);
    const sum = r => rr[r] ? (rr[r] * 100).toFixed(1).replace(/\.0$/, '') + '%' : 'なし';
    modal(
      `<div class="pause-title">召喚の理</div><div class="small" style="text-align:center">英雄の欠片の呼び寄せやすさ</div>` +
      `<div class="rate-sum"><span>★5 ${sum(5)}</span><span>★4 ${sum(4)}</span><span>★3 ${sum(3)}</span></div>` +
      (rows.length ? `<table class="rate-table">${rows.map(r => `<tr><td>${TD.starsHTML(r.rarity, 0)}</td><td>${TD.CHARS[r.id].name}<small class="frag">残り欠片 ${TD.Gacha.fragmentsLeftOf(save, r.id)}</small></td><td>${(r.rate * 100).toFixed(2)}%</td></tr>`).join('')}</table>` : `<p class="small" style="text-align:center">すべての英雄の欠片が集まりました。</p>`) +
      `<p class="small">・召喚陣は、大陸に散った<b>英雄の魂の欠片</b>を呼び寄せます。<br>・はじめての欠片はその英雄の姿となって仲間になり、2つ目からは英雄の力を高めます（限界突破・最大${TD.GROWTH.maxLB}回）。<br>・欠片がすべて集まった英雄は、もう召喚陣に現れません。同じ★の他の英雄が現れやすくなります。${maxedNames.length ? `<br>　欠片が集まりきった英雄：${maxedNames.map(esc).join('、')}` : ''}<br>・ある★の英雄の欠片がすべて集まると、その★はもう現れず、残りの★で呼び寄せやすさを分け合います。<br>・10回召喚では、★4以上の欠片が残っていれば、必ず1つ含まれます。<br>・すべての欠片が集まると、召喚はできなくなります。<br>・魔晶石はゲーム内で入手できるアイテムです。現実のお金は使いません。</p>` +
      `<div class="btn-row"><button class="btn primary" onclick="document.getElementById('modal').classList.remove('show')">閉じる</button></div>`);
  });

  function doPull(n) {
    const bn = TD.GACHA.banners[bannerIdx];
    const chk = TD.Gacha.canPull(save, n);
    if (!chk.ok) {
      alertBox(chk.reason === 'complete' ? 'すべての英雄の欠片が集まっています。もう召喚はできません'
        : chk.reason === 'few' ? `まだ眠る英雄の欠片が${TD.Gacha.fragmentsLeft(save)}つしかないため、10回召喚はできません`
        : '魔晶石が足りません。ステージやミッションで集めましょう');
      return;
    }
    const results = TD.Gacha.pull(save, bn, n);
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
        const tag = r.isNew ? '<em class="new">新たな英雄</em>' : r.limitBreak ? `<em class="lbup">限界突破${r.limitBreak}</em>` : `<em class="conv">魔晶石+${r.converted}</em>`;
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
      `<div class="brief-sec">バトル</div>` +
      `<label class="set-toggle"><span>スキルのカットインを表示<small>オフにすると発動時の演出を省略します</small></span><input type="checkbox" id="set-cutin" ${save.opts.cutin !== false ? 'checked' : ''}></label>` +
      `<div class="brief-sec">ストーリー</div>` +
      `<button class="btn ghost" data-act="story" style="width:100%">ストーリーを見返す</button>` +
      `<div class="brief-sec">データのバックアップ</div>` +
      `<p class="small">セーブデータはこのブラウザに保存されています。別の端末へ移すときは引き継ぎコードを使ってください。</p>` +
      `<textarea id="backup-code" rows="3" placeholder="ここに引き継ぎコードが表示されます／貼り付けてください"></textarea>` +
      `<div class="btn-row"><button class="btn ghost" data-act="export">コードを発行</button><button class="btn ghost" data-act="import">コードで復元</button></div>` +
      `<div class="brief-sec">その他</div>` +
      `<div class="btn-col"><button class="btn danger" data-act="reset">データを初期化</button><button class="btn primary" data-act="close">閉じる</button></div>`);
    body.querySelector('#set-cutin').onchange = e => { save.opts.cutin = e.target.checked; TD.prefs = save.opts; persist(); };
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
    body.querySelector('[data-act=story]').onclick = () => { closeModal(); show('screen-story'); };
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
    // 起動時の流れ：プロローグ → 初回プレゼント（ログイン報酬はデイリーミッションで受け取る）
    const after = () => { TD.Live.ensureDaily(save); persist(); renderHome(); checkGift(); };
    if (!save.story.prologue) setTimeout(() => playStory('prologue', after), 500);
    else setTimeout(after, 400);
  });
  show('screen-home');
  TD.app = { show, openQuest, startBattle, playStory, get save() { return save; } };
})();
