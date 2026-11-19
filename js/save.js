// セーブデータ（ブラウザの localStorage に保存）
window.TD = window.TD || {};

TD.Save = {
  KEY: 'kekkai-save-v1',

  defaults() {
    return {
      v: 1,
      stones: 0,          // 魔晶石（フェーズ2の召喚で使用予定）
      cleared: {},        // { '1-1': 3 } ステージID → 最高★
      party: ['lydia', 'fin', 'gald', 'mia', 'kai'],
      owned: Object.keys(TD.CHARS),
      seenNames: false,
    };
  },

  sanitize(s) {
    const d = this.defaults();
    const out = Object.assign(d, s);
    out.owned = (out.owned || []).filter(id => TD.CHARS[id]);
    out.party = (out.party || []).filter(id => out.owned.includes(id)).slice(0, 6);
    if (!out.party.length) out.party = d.party.filter(id => out.owned.includes(id));
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
