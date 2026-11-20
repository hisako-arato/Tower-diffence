// 召喚（ガチャ）のロジック。ゲーム内通貨「魔晶石」のみを使用する。
window.TD = window.TD || {};

TD.Gacha = {
  pool(rarity) {
    return Object.keys(TD.CHARS).filter(id => TD.CHARS[id].rarity === rarity);
  },

  // 限界突破が最大に達したキャラ（排出対象から外す）
  maxed(save, id) {
    return !!(save && save.chars && save.chars[id] && save.chars[id].lb >= TD.GROWTH.maxLB);
  },
  // そのプレイヤーの排出対象
  activePool(save, rarity) {
    return this.pool(rarity).filter(id => !this.maxed(save, id));
  },

  // 1キャラ分の確率表（提供割合の表示用）。save を渡すとそのプレイヤーの排出対象で計算する
  rateTable(banner, save) {
    const G = TD.GACHA, rows = [];
    for (const r of [5, 4, 3]) {
      const ids = this.activePool(save, r), total = G.rates[r];
      if (!ids.length) continue;
      const pick = r === 5 ? banner.pickup.filter(id => ids.includes(id)) : [];
      for (const id of ids) {
        let p;
        if (pick.length) {
          const share = banner.pickupShare;
          p = pick.includes(id) ? total * share / pick.length + total * (1 - share) / ids.length : total * (1 - share) / ids.length;
        } else p = total / ids.length;
        rows.push({ id, rarity: r, rate: p, pickup: pick.includes(id) });
      }
    }
    return rows;
  },

  rollRarity(save, minRarity) {
    const G = TD.GACHA;
    if (save.pity + 1 >= G.pity) return 5;
    const x = Math.random();
    let r = x < G.rates[5] ? 5 : x < G.rates[5] + G.rates[4] ? 4 : 3;
    return Math.max(r, minRarity || 3);
  },

  pickChar(banner, rarity, save) {
    const ids = this.activePool(save, rarity);
    if (!ids.length) return null;
    const pick = rarity === 5 ? banner.pickup.filter(id => ids.includes(id)) : [];
    if (pick.length && Math.random() < banner.pickupShare) return pick[Math.floor(Math.random() * pick.length)];
    return ids[Math.floor(Math.random() * ids.length)];
  },

  // n 回召喚して結果を save に反映する。魔晶石が足りなければ null。
  pull(save, banner, n) {
    const G = TD.GACHA, cost = n === 10 ? G.ten : G.single * n;
    if (save.stones < cost) return null;
    save.stones -= cost;
    const results = [];
    for (let i = 0; i < n; i++) {
      // 10連の最後の1回は、それまでに★4以上が無ければ★4以上確定
      const needHigh = n === 10 && i === 9 && !results.some(r => r.rarity >= 4);
      const rarity = this.rollRarity(save, needHigh ? 4 : 3);
      save.totalPulls++;
      save.pity = rarity === 5 ? 0 : save.pity + 1;
      const id = this.pickChar(banner, rarity, save);
      // そのレアリティが全員限界突破済みの場合は魔晶石に変換
      if (!id) { const st = TD.GROWTH.dupStones[rarity]; save.stones += st; results.push({ id: null, rarity, converted: st }); continue; }
      results.push(this.grant(save, id));
    }
    return results;
  },

  // キャラ入手処理：新規 / 限界突破 / 魔晶石へ変換
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
      const s = G.dupStones[d.rarity];
      save.stones += s;
      res.converted = s;
    }
    return res;
  },
};
