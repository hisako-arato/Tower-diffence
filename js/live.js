// ライブ運営系の仕組み：日付リセット・ログインボーナス・ミッション・イベント
// 日付は端末のローカル時刻で判定する（0時に切り替わる）。
window.TD = window.TD || {};

TD.Live = {
  today(d = new Date()) {
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  newDaily(date) {
    return { date, login: 1, wins: 0, kills: 0, skills: 0, levelups: 0, caves: 0, pulls: 0, runs: {}, claimed: {} };
  },

  // 日付が変わっていたらデイリー状態をリセットする。リセットしたら true
  ensureDaily(save) {
    const t = this.today();
    if (!save.daily || save.daily.date !== t) { save.daily = this.newDaily(t); return true; }
    return false;
  },

  // 今日まだ受け取っていなければログインボーナスを付与して内容を返す
  checkLogin(save) {
    const t = this.today();
    if (save.login.last === t) return null;
    const day = save.login.day % TD.LOGIN_BONUS.length + 1;   // 1〜7
    save.login = { last: t, day, total: save.login.total + 1 };
    const reward = TD.LOGIN_BONUS[day - 1];
    this.grant(save, reward);
    return { day, reward };
  },

  grant(save, reward) {
    if (reward.stones) save.stones += reward.stones;
    if (reward.crystals) save.crystals += reward.crystals;
  },

  rewardText(r) {
    const a = [];
    if (r.stones) a.push(`魔晶石 ×${r.stones}`);
    if (r.crystals) a.push(`経験の書 ×${r.crystals}`);
    return a.join('・');
  },

  // 行動の記録（デイリーと通算）
  track(save, key, n = 1) {
    this.ensureDaily(save);
    save.daily[key] = (save.daily[key] || 0) + n;
    if (key in save.stats) save.stats[key] += n;
  },

  dailyList(save) {
    this.ensureDaily(save);
    const others = TD.DAILY_MISSIONS.filter(m => m.key !== '_all');
    return TD.DAILY_MISSIONS.map(m => {
      const cur = m.key === '_all'
        ? others.filter(o => (save.daily[o.key] || 0) >= o.goal).length
        : Math.min(m.goal, save.daily[m.key] || 0);
      return { m, cur: Math.min(cur, m.goal), done: cur >= m.goal, claimed: !!save.daily.claimed[m.id] };
    });
  },

  achList(save) {
    return TD.ACHIEVEMENTS.map(m => {
      const cur = m.progress(save) || 0;
      return { m, cur: Math.min(cur, m.goal), done: cur >= m.goal, claimed: !!save.achieved[m.id] };
    });
  },

  claim(save, kind, id) {
    const list = kind === 'daily' ? this.dailyList(save) : this.achList(save);
    const it = list.find(x => x.m.id === id);
    if (!it || !it.done || it.claimed) return null;
    if (kind === 'daily') save.daily.claimed[id] = true;
    else save.achieved[id] = true;
    this.grant(save, it.m.reward);
    return it.m.reward;
  },

  claimAll(save, kind) {
    const list = kind === 'daily' ? this.dailyList(save) : this.achList(save);
    const total = { stones: 0, crystals: 0 };
    for (const it of list) {
      const r = this.claim(save, kind, it.m.id);
      if (r) { total.stones += r.stones || 0; total.crystals += r.crystals || 0; }
    }
    // 「すべて達成」はほかのミッションを受け取ったあとに達成されることがある
    if (kind === 'daily') {
      const r = this.claim(save, kind, 'd-all');
      if (r) { total.stones += r.stones || 0; total.crystals += r.crystals || 0; }
    }
    return total;
  },

  claimableCount(save) {
    return [...this.dailyList(save), ...this.achList(save)].filter(x => x.done && !x.claimed).length;
  },

  // ---------- デイリークエスト ----------
  runsLeft(save, st) {
    this.ensureDaily(save);
    return st.dailyLimit - (save.daily.runs[st.id] || 0);
  },

  // ---------- イベント ----------
  eventActive(ev = TD.EVENT) {
    const t = this.today();
    return !!ev && t >= ev.start && t <= ev.end;
  },

  eventDaysLeft(ev = TD.EVENT) {
    const end = new Date(ev.end + 'T23:59:59');
    return Math.max(0, Math.ceil((end - new Date()) / 86400000));
  },

  eventState(save, ev = TD.EVENT) {
    save.events[ev.id] = save.events[ev.id] || { pts: 0, shop: {} };
    return save.events[ev.id];
  },

  exchange(save, item, ev = TD.EVENT) {
    const es = this.eventState(save, ev), used = es.shop[item.id] || 0;
    if (used >= item.limit || es.pts < item.cost) return null;
    es.pts -= item.cost;
    es.shop[item.id] = used + 1;
    if (item.char) return TD.Gacha.grant(save, item.char);
    this.grant(save, item.reward);
    return { reward: item.reward };
  },
};
