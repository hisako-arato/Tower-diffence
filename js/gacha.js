// 召喚の儀のロジック。ゲーム内通貨「魔晶石」のみを使用する。
// 世界観：召喚士は、大陸に散った「英雄の魂の欠片」を召喚陣に呼び寄せる。
//   ・その英雄の最初の欠片 → 英雄が仲間になる
//   ・2つ目以降の欠片     → 英雄の力が高まる（限界突破、最大4回）
// 1人の英雄の欠片は「1＋限界突破の最大回数」個。すべて集まった英雄の欠片はもう現れない。
// あるレアリティの欠片が尽きたら、そのレアリティは現れず、残りのレアリティで確率を分け直す。
// すべての欠片が集まったら、召喚はできなくなる。
window.TD = window.TD || {};

TD.Gacha = {
  pool(rarity) {
    return Object.keys(TD.CHARS).filter(id => TD.CHARS[id].rarity === rarity && !TD.CHARS[id].eventOnly);
  },

  // その英雄の欠片がすべて集まったか（限界突破が最大）
  maxed(save, id) {
    return !!(save && save.chars && save.chars[id] && save.chars[id].lb >= TD.GROWTH.maxLB);
  },
  // まだ欠片が残っている英雄
  activePool(save, rarity) {
    return this.pool(rarity).filter(id => !this.maxed(save, id));
  },
  // 英雄1人あたり、まだ集まっていない欠片の数
  fragmentsLeftOf(save, id) {
    const G = TD.GROWTH;
    if (!save || !save.owned || !save.owned.includes(id)) return 1 + G.maxLB;
    return Math.max(0, G.maxLB - (save.chars[id] ? save.chars[id].lb : 0));
  },
  // 全体でまだ集まっていない欠片の数（これが0なら召喚できない）
  fragmentsLeft(save) {
    return Object.keys(TD.CHARS).filter(id => !TD.CHARS[id].eventOnly && !TD.CHARS[id].ancient && !TD.CHARS[id].dark).reduce((a, id) => a + this.fragmentsLeftOf(save, id), 0);
  },

  // 欠片が残っているレアリティだけで、出やすさを分け直す
  rarityRates(save) {
    const base = TD.GACHA.rates, out = {};
    const live = [5, 4, 3].filter(r => this.activePool(save, r).length);
    const sum = live.reduce((a, r) => a + base[r], 0);
    for (const r of live) out[r] = base[r] / sum;
    return out;
  },

  // 英雄ごとの出やすさ（召喚の理の画面用）
  rateTable(banner, save) {
    const rr = this.rarityRates(save), rows = [];
    for (const r of [5, 4, 3]) {
      if (!rr[r]) continue;
      const ids = this.activePool(save, r);
      for (const id of ids) rows.push({ id, rarity: r, rate: rr[r] / ids.length });
    }
    return rows;
  },

  rollRarity(save, minRarity) {
    const rr = this.rarityRates(save);
    let live = [5, 4, 3].filter(r => rr[r]);
    if (minRarity) { const hi = live.filter(r => r >= minRarity); if (hi.length) live = hi; }
    const sum = live.reduce((a, r) => a + rr[r], 0);
    let x = Math.random() * sum;
    for (const r of live) { if ((x -= rr[r]) < 0) return r; }
    return live[live.length - 1];
  },

  pickChar(banner, rarity, save) {
    const ids = this.activePool(save, rarity);
    return ids.length ? ids[Math.floor(Math.random() * ids.length)] : null;
  },

  // 召喚できるか。できない場合は理由を返す
  canPull(save, n) {
    const G = TD.GACHA, cost = n === 10 ? G.ten : G.single * n, left = this.fragmentsLeft(save);
    if (left <= 0) return { ok: false, reason: 'complete' };
    if (left < n) return { ok: false, reason: 'few' };
    if (save.stones < cost) return { ok: false, reason: 'stones' };
    return { ok: true, cost };
  },

  // n 回召喚して結果を save に反映する。召喚できなければ null。
  pull(save, banner, n) {
    const chk = this.canPull(save, n);
    if (!chk.ok) return null;
    save.stones -= chk.cost;
    const results = [];
    for (let i = 0; i < n; i++) {
      // 10回召喚では、★4以上の欠片が必ず1つ含まれる（★4以上の欠片が残っていれば）
      const needHigh = n === 10 && i === 9 && !results.some(r => r.rarity >= 4);
      const rarity = this.rollRarity(save, needHigh ? 4 : 0);
      save.totalPulls++;
      const id = this.pickChar(banner, rarity, save);
      results.push(this.grant(save, id));
    }
    return results;
  },

  // 欠片を受け取る：新たな英雄 / 限界突破
  grant(save, id) {
    const d = TD.CHARS[id], G = TD.GROWTH, res = { id, rarity: d.rarity };
    if (!save.owned.includes(id)) {
      save.owned.push(id);
      save.chars[id] = { lv: 1, lb: 0 };
      res.isNew = true;
    } else if (save.chars[id].lb < G.maxLB) {
      save.chars[id].lb++;
      res.limitBreak = save.chars[id].lb;
    } else {
      // 通常は起こらない（欠片が集まりきった英雄は現れない）。イベント交換所などで重複した場合のみ。
      const s = G.dupStones[d.rarity];
      save.stones += s;
      res.converted = s;
    }
    return res;
  },
};
