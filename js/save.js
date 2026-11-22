// セーブデータ（ブラウザの localStorage に保存）
window.TD = window.TD || {};

TD.Save = {
  KEY: 'kekkai-save-v1',

  defaults() {
    return {
      v: 1,
      stones: 0,          // 魔晶石（召喚に使う）
      crystals: 0,        // 経験の書（レベルアップに使う）
      cleared: {},        // { '1-1': 3 } ステージID → 最高★
      party: ['lydia', 'fin', 'gald', 'mia', 'kai'],
      owned: ['lydia', 'fin', 'gald', 'mia', 'kai'],
      chars: {            // キャラごとの育成状態 { lv, lb(限界突破) }
        lydia: { lv: 1, lb: 0 }, fin: { lv: 1, lb: 0 }, gald: { lv: 1, lb: 0 }, mia: { lv: 1, lb: 0 }, kai: { lv: 1, lb: 0 },
      },
      totalPulls: 0,
      giftReceived: false,
      playerName: '',     // ストーリーで入力するプレイヤー名
      story: {},          // 既読エピソード { prologue: true }
      stageVer: 2,        // ステージ構成のバージョン（データ移行用）
      daily: null,        // その日のミッション進捗（TD.Live.ensureDaily で生成）
      stats: { wins: 0, kills: 0, skills: 0, pulls: 0 },  // 通算記録
      achieved: {},       // 受け取り済みの通常ミッション
      login: { last: '', day: 0, total: 0 },              // ログインボーナス
      events: {},         // イベントごとの状態 { starfest: { pts, shop } }
    };
  },

  sanitize(s) {
    const d = this.defaults();
    const out = Object.assign(d, s);
    out.owned = (out.owned || []).filter(id => TD.CHARS[id]);
    out.party = (out.party || []).filter(id => out.owned.includes(id)).slice(0, 6);
    if (!out.party.length) out.party = d.party.filter(id => out.owned.includes(id));
    out.stats = Object.assign({ wins: 0, kills: 0, skills: 0, pulls: 0 }, s.stats);
    out.login = Object.assign({ last: '', day: 0, total: 0 }, s.login);
    out.achieved = out.achieved || {};
    out.story = out.story || {};
    // ステージ構成の変更（旧1-4のボス戦 → 1-5）に合わせてデータを移す
    if (!(s && s.stageVer >= 2)) {
      if (out.cleared['1-4']) out.cleared['1-5'] = out.cleared['1-4'];
      if (out.story['1-4-pre']) { out.story['1-5-pre'] = true; delete out.story['1-4-pre']; }
      if (out.story['1-4-post']) { out.story['1-5-post'] = true; delete out.story['1-4-post']; }
      out.stageVer = 2;
    }
    // 名前入力までは済んでいる（プロローグを途中で閉じた）場合は、プロローグを見たことにする
    if (out.playerName && !out.story.prologue) out.story.prologue = true;
    out.events = out.events || {};
    if (out.daily && !out.daily.claimed) out.daily = null;
    out.chars = out.chars || {};
    for (const id of out.owned) {
      const c = out.chars[id] || {};
      const lb = Math.max(0, Math.min(TD.GROWTH.maxLB, c.lb | 0));
      out.chars[id] = { lv: Math.max(1, Math.min(TD.maxLv(lb), c.lv | 0 || 1)), lb };
    }
    return out;
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.v === 1) return this.sanitize(s);
      }
    } catch (e) { /* 保存領域が使えない環境でも遊べるようにする */ }
    return this.defaults();
  },

  store(s) {
    try { localStorage.setItem(this.KEY, JSON.stringify(s)); return true; }
    catch (e) { return false; }
  },

  exportCode(s) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  },

  importCode(str) {
    const s = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!s || s.v !== 1) throw new Error('invalid');
    return this.sanitize(s);
  },
};
