// ストーリー（会話パート）のデータとADVプレイヤー
window.TD = window.TD || {};

// 話者。char があればそのキャラの立ち絵を使う。stand:false は立ち絵なし。
TD.SPEAKERS = {
  me:      { name: '{name}', stand: false },
  lumina:  { name: 'ルミナ', navi: true },
  lydia:   { char: 'lydia' },
  fin:     { char: 'fin' },
  kai:     { char: 'kai' },
  mia:     { char: 'mia' },
  gald:    { char: 'gald' },
  rune:    { char: 'rune' },
  varg:    { name: 'ヴァルグ', enemy: true },
  unknown: { name: '？？？', enemy: true },
  soldier: { name: '王都の兵士', stand: false },
};

// 1行の書式: [話者ID or null(ナレーション), 本文, { bg, fx, pos }]
// 特殊行: ['@name'] … 名前入力
// 本文中の {name} はプレイヤー名に置き換わる
TD.STORY = {
  'prologue': {
    title: 'プロローグ　目覚め', chapter: 1,
    lines: [
      [null, '千年の昔、魔界より「七つの災厄」が溢れ出た。', { bg: 'void' }],
      [null, '英雄たちは命と引き換えに、大陸を覆う「大結界」を張り、災厄を封じた――。'],
      [null, 'そして、今。'],
      [null, '……その結界が、軋んでいる。', { fx: 'shake' }],
      ['lumina', '……さま。召喚士さま！ 目を覚ましてください！', { bg: 'shrine' }],
      ['me', '……ここは……？'],
      ['lumina', 'よかった……！ わたしは結界の精霊、ルミナ。あなたを長い眠りから呼び戻したのです。'],
      ['me', '眠り……？ 何も、思い出せない……'],
      ['lumina', '無理もありません。でも、あなたは確かに「英雄を喚ぶ力」を持っている。この大陸で、最後の召喚士なのです。'],
      ['lumina', '……そういえば、お名前をうかがっていませんでしたね。'],
      ['@name'],
      ['lumina', '{name}さま……素敵なお名前です！'],
      ['soldier', '伝令！ 王都南の街道に魔物の群れ！ 結界の綻びから侵入した模様！', { fx: 'flash' }],
      ['lumina', 'もう、こんなところまで……！ {name}さま、力を貸してください！'],
      ['lumina', 'あなたの呼びかけに応える英雄が、きっといます！'],
      [null, '――胸の奥で、何かが光った。', { fx: 'flash' }],
      ['lydia', '――呼んだのは、あなたね。'],
      ['lydia', '聖剣の騎士姫、リディア。剣を振るう理由をくれるなら、この身はあなたに預けるわ。'],
      ['lumina', '行きましょう、{name}さま。最初の防衛戦です！'],
    ],
  },
  '1-1-post': {
    title: '1-1 その後　森の狩人', chapter: 1,
    lines: [
      ['lydia', '……ふう。片付いたわね。', { bg: 'road' }],
      ['lumina', 'すごいです！ 初陣で街道を守りきるなんて！'],
      ['fin', 'へぇ、やるじゃん。新しい召喚士ってのは、あんた？'],
      ['lumina', 'フィンさん！ 森の狩人の……'],
      ['fin', '森が騒がしいんだ。魔狼の群れが、こっちへ向かってる。'],
      ['fin', '手を貸してくれるなら、案内するよ。'],
      ['lydia', '決まりね。行きましょう、{name}。'],
    ],
  },
  '1-2-pre': {
    title: '1-2 魔狼の森', chapter: 1,
    lines: [
      ['fin', 'この先が魔狼の通り道だ。あいつら足が速いから、足止め役がいないと抜かれるよ。', { bg: 'forest' }],
      ['kai', 'だったら俺の出番だな！ 狼どもは火に弱いって相場が決まってる！'],
      ['lumina', 'カ、カイさん！？ いつの間に……'],
      ['kai', '面白そうな匂いがしたんでね。燃やし甲斐がありそうだ！'],
      ['fin', '……森ごと燃やさないでくれよ。'],
      ['lumina', '風属性の魔狼には、火属性が有利です。カイさんの魔法を活かしましょう！'],
    ],
  },
  '1-2-post': {
    title: '1-2 その後　挟撃の報せ', chapter: 1,
    lines: [
      ['kai', 'へへっ、見たか！ まとめて丸焼きだ！', { bg: 'forest' }],
      ['mia', 'あ、あのっ！ お怪我をしている方はいませんか！？'],
      ['mia', '見習い僧侶のミアです！ 王都の教会から、お手伝いに来ました！'],
      ['lumina', '心強いです、ミアさん！'],
      ['soldier', '大変です！ 王都の東西の門に、同時に魔物が！', { fx: 'shake' }],
      ['lydia', '挟み撃ち……。知恵の回る指揮官がいるようね。'],
      ['lumina', '{name}さま、急いで王都へ戻りましょう！'],
    ],
  },
  '1-3-pre': {
    title: '1-3 二つの門', chapter: 1,
    lines: [
      ['gald', '来たか、召喚士殿。王都守備隊長、ガルドだ。', { bg: 'gate' }],
      ['gald', '東と西、二つの門から敵が来る。だが道は城内で一つに合流する。'],
      ['gald', '守るならそこだ。この盾がある限り、一歩も通さん。'],
      ['lydia', '頼もしいわね、隊長さん。'],
      ['lumina', '合流地点を固めましょう！ スキルも忘れずに、ですよ！'],
    ],
  },
  '1-3-post': {
    title: '1-3 その後　災厄の先触れ', chapter: 1,
    lines: [
      ['gald', '……退けたか。見事な采配だった、召喚士殿。', { bg: 'gate' }],
      ['mia', 'みなさん、すぐに傷を治しますね……！'],
      ['unknown', '――クク。人間にしては、よく足掻く。', { bg: 'dark', fx: 'shake' }],
      ['lumina', 'この禍々しい気配……まさか！'],
      ['varg', '我はヴァルグ。七つの災厄が一柱にして、その先触れなり。'],
      ['varg', '結界はもはや紙切れ同然。明朝、王都の正門を喰い破ってくれよう。'],
      ['lydia', '……上等よ。返り討ちにしてあげる。'],
      [null, '黒い霧が晴れたとき、そこにはもう何もいなかった。', { bg: 'gate' }],
    ],
  },
  '1-4-pre': {
    title: '1-4 王都城門・決戦', chapter: 1,
    lines: [
      ['lumina', '夜が明けます……。ヴァルグが来ます。', { bg: 'dawn' }],
      ['gald', '正門の守りは固めた。あとは、奴を討てるかどうかだ。'],
      ['lumina', '{name}さま。ヴァルグは闇の力をまとっています。光属性の攻撃が有効なはずです！'],
      ['lydia', '光の聖剣の出番ってことね。……{name}、背中は任せたわ。'],
      ['varg', '来い、召喚士。千年分の恨み、その身で受けるがいい！', { fx: 'shake' }],
    ],
  },
  '1-4-post': {
    title: '1-4 その後　旅立ち', chapter: 1,
    lines: [
      ['varg', 'グ……ォオ……！ 馬鹿な……人間ごときに……！', { bg: 'dawn', fx: 'flash' }],
      ['varg', 'だが……覚えておけ……。災厄は、あと六つ……'],
      ['varg', '大結界が砕け散るとき……貴様らの世界は……終わる……'],
      [null, 'ヴァルグの体は黒い霧となり、朝の光に溶けて消えた。'],
      ['lumina', 'やった……やりました、{name}さま！'],
      ['lydia', '王都は守られたわ。……今のところは、ね。'],
      ['gald', '奴の言葉が気になる。七つの災厄……残るは六柱か。'],
      ['lumina', '大結界を直すには、大陸各地に眠る「結界石」を巡らなければなりません。'],
      ['lumina', '{name}さま。わたしたちの旅は、まだ始まったばかりです！'],
      [null, '――第1章「結界のほころび」 完', { bg: 'void' }],
      [null, '第2章「蒼の結界石」へ続く'],
    ],
  },
};
TD.STORY['event-starfest'] = {
  title: 'イベント　星降る夜の魔導祭', chapter: 'ev',
  lines: [
    [null, '年に一度、空から星が降り注ぐ夜――王都では「魔導祭」が開かれる。', { bg: 'dark' }],
    ['kai', 'よっしゃ、魔導祭だ！ 屋台に花火に、魔法比べ！ 燃えてきたぜ！'],
    ['lumina', 'カイさん、はしゃぎすぎです……。でも、きれいな星空ですね、{name}さま。'],
    ['rune', '……のんきなものね。今年の星は、少し様子がおかしいわ。'],
    ['lumina', 'あなたは……魔導学院の？'],
    ['rune', 'ルーンよ。黒書の頁が告げているの。「星を喰らうもの、丘より来たる」と。', { fx: 'shake' }],
    ['kai', '星を喰らう……？ なんだそりゃ、物騒だな。'],
    ['rune', '降ってきた星の欠片を集めて。魔獣に喰われる前に、ね。……集めてくれたら、わたしも力を貸してあげる。'],
    ['lumina', '{name}さま、星降る丘へ向かいましょう！'],
  ],
};
TD.STORY_ORDER = ['prologue', '1-1-post', '1-2-pre', '1-2-post', '1-3-pre', '1-3-post', '1-4-pre', '1-4-post', 'event-starfest'];
TD.CHAPTERS = { 1: '第1章 結界のほころび', ev: 'イベントストーリー' };

// ---------- ADVプレイヤー ----------
(function () {
  const TYPE_MS = 28;

  function speakerName(id, player) {
    const sp = TD.SPEAKERS[id];
    if (!sp) return '';
    const n = sp.char ? TD.CHARS[sp.char].name : sp.name;
    return n.replace('{name}', player);
  }

  function standHTML(id) {
    const sp = TD.SPEAKERS[id];
    if (!sp || sp.stand === false) return '';
    if (sp.navi) {
      const svg = document.querySelector('#navi svg');
      // グラデーションIDが重複しないよう付け替える
      const html = svg ? svg.outerHTML.replace(/id="(\w+)"/g, 'id="adv-$1"').replace(/url\(#(\w+)\)/g, 'url(#adv-$1)') : '';
      return `<div class="stand-navi">${html}</div>`;
    }
    if (sp.char) {
      const d = TD.CHARS[sp.char];
      return `<div class="stand-char">${TD.fullArtHTML(sp.char)}<div class="stand-title">${d.title}</div></div>`;
    }
    if (sp.enemy) return `<div class="stand-enemy"><span class="se-body"><i></i><i></i></span></div>`;
    return '';
  }

  class Adv {
    constructor(root) {
      this.root = root;
      root.innerHTML =
        `<div class="adv-bg"></div>` +
        `<div class="adv-stage"><div class="adv-slot left"></div><div class="adv-slot right"></div></div>` +
        `<div class="adv-flash"></div>` +
        `<div class="adv-top"><div class="adv-title"></div>` +
        `<button data-a="log">LOG</button><button data-a="auto">AUTO</button><button data-a="skip">SKIP</button></div>` +
        `<div class="adv-box"><div class="adv-name"></div><div class="adv-text"></div><div class="adv-next">▼</div></div>` +
        `<div class="adv-log"><div class="adv-log-inner"></div><button class="btn primary" data-a="closelog">閉じる</button></div>` +
        `<div class="adv-input"><div class="adv-input-box"><div class="ai-title">あなたの名前を入力してください</div>` +
        `<input type="text" maxlength="10" placeholder="例：アレン" autocomplete="off">` +
        `<button class="btn primary" data-a="name">決定</button></div></div>`;
      this.$ = s => root.querySelector(s);
      root.addEventListener('click', e => {
        const a = e.target.closest('[data-a]');
        if (a) { e.stopPropagation(); this.action(a.dataset.a); return; }
        if (this.mode === 'play') this.advance();
      });
    }

    // player：プレイヤー名（未設定なら空）。名前が決まっていれば名前入力は出さない
    play(epId, player, onEnd, onName) {
      const ep = TD.STORY[epId];
      if (!ep) { onEnd && onEnd(); return; }
      this.ep = ep; this.i = -1; this.hasName = !!player; this.player = player || '召喚士';
      this.onEnd = onEnd; this.onName = onName;
      this.slots = { left: null, right: null }; this.lastSlot = 'right';
      this.log = []; this.auto = false; this.mode = 'play'; this.skipAfterName = false;
      this.$('.adv-title').textContent = ep.title;
      this.$('[data-a=auto]').classList.remove('on');
      this.$('.adv-bg').className = 'adv-bg bg-void';
      this.$('.adv-slot.left').innerHTML = this.$('.adv-slot.right').innerHTML = '';
      this.root.classList.add('show');
      this.next();
    }

    fill(t) { return t.replace(/\{name\}/g, this.player); }

    next() {
      clearTimeout(this.autoT);
      this.i++;
      const line = this.ep.lines[this.i];
      if (!line) return this.finish();
      if (line[0] === '@name') return this.askName();
      const [sid, text, o = {}] = line;
      if (o.bg) this.$('.adv-bg').className = 'adv-bg bg-' + o.bg;
      if (o.fx) this.effect(o.fx);
      this.placeSpeaker(sid, o.pos);
      const name = sid ? speakerName(sid, this.player) : '';
      const nameEl = this.$('.adv-name');
      nameEl.textContent = name;
      nameEl.style.visibility = name ? 'visible' : 'hidden';
      this.$('.adv-box').classList.toggle('narration', !sid);
      const full = this.fill(text);
      this.log.push({ name, text: full });
      this.type(full);
    }

    placeSpeaker(sid, pos) {
      const sp = TD.SPEAKERS[sid];
      const hasStand = sp && sp.stand !== false;
      if (hasStand) {
        let slot = Object.keys(this.slots).find(k => this.slots[k] === sid);
        if (!slot) {
          slot = pos || (this.lastSlot === 'left' ? 'right' : 'left');
          this.slots[slot] = sid;
          const el = this.$('.adv-slot.' + slot);
          el.innerHTML = standHTML(sid);
          el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
        }
        this.lastSlot = slot;
      }
      for (const k of ['left', 'right']) {
        this.$('.adv-slot.' + k).classList.toggle('dim', !(hasStand && this.slots[k] === sid));
      }
    }

    type(text) {
      const el = this.$('.adv-text');
      this.full = text; this.pos = 0; this.typing = true;
      this.$('.adv-next').classList.remove('show');
      clearInterval(this.typeT);
      el.textContent = '';
      this.typeT = setInterval(() => {
        this.pos++;
        el.textContent = text.slice(0, this.pos);
        if (this.pos >= text.length) this.doneTyping();
      }, TYPE_MS);
    }

    doneTyping() {
      clearInterval(this.typeT);
      this.typing = false;
      this.$('.adv-text').textContent = this.full;
      this.$('.adv-next').classList.add('show');
      if (this.auto) this.autoT = setTimeout(() => this.next(), 1200 + this.full.length * 40);
    }

    advance() {
      if (this.typing) this.doneTyping();
      else this.next();
    }

    effect(fx) {
      const target = fx === 'flash' ? this.$('.adv-flash') : this.root;
      const cls = fx === 'flash' ? 'go' : 'shake';
      target.classList.remove(cls); void target.offsetWidth; target.classList.add(cls);
    }

    askName() {
      if (this.hasName) { // 名前は設定済み：入力を飛ばして続きへ
        if (this.skipAfterName) { this.mode = 'play'; this.finish(); } else this.next();
        return;
      }
      this.mode = 'input';
      clearInterval(this.typeT);
      const box = this.$('.adv-input'), inp = box.querySelector('input');
      inp.value = this.player === '召喚士' ? '' : this.player;
      box.classList.add('show');
      setTimeout(() => inp.focus(), 50);
    }

    action(a) {
      if (a === 'name') {
        const v = this.$('.adv-input input').value.trim().replace(/[<>{}]/g, '').slice(0, 10);
        if (!v) { this.$('.adv-input input').focus(); return; }
        this.player = v;
        this.hasName = true;
        this.onName && this.onName(v);
        this.$('.adv-input').classList.remove('show');
        this.mode = 'play';
        if (this.skipAfterName) this.finish();
        else this.next();
      } else if (a === 'skip') {
        this.finish();
      } else if (a === 'auto') {
        this.auto = !this.auto;
        this.$('[data-a=auto]').classList.toggle('on', this.auto);
        if (this.auto && !this.typing) this.next();
      } else if (a === 'log') {
        this.mode = 'log';
        clearTimeout(this.autoT);
        const inner = this.$('.adv-log-inner');
        inner.innerHTML = '';
        for (const l of this.log) {
          const row = document.createElement('div');
          row.className = 'log-row';
          const n = document.createElement('b'); n.textContent = l.name;
          const t = document.createElement('p'); t.textContent = l.text;
          row.append(n, t);
          inner.appendChild(row);
        }
        this.$('.adv-log').classList.add('show');
        inner.scrollTop = inner.scrollHeight;
      } else if (a === 'closelog') {
        this.$('.adv-log').classList.remove('show');
        this.mode = 'play';
      }
    }

    finish() {
      // 名前入力が未完了のままスキップされた場合は入力だけは行う
      const needName = !this.hasName && this.ep.lines.slice(this.i + 1).some(l => l[0] === '@name');
      if (needName && this.mode !== 'input') {
        this.skipAfterName = true;
        this.i = this.ep.lines.findIndex(l => l[0] === '@name') - 1;
        this.next();
        return;
      }
      clearInterval(this.typeT);
      clearTimeout(this.autoT);
      this.mode = 'done';
      this.root.classList.remove('show');
      const cb = this.onEnd;
      this.onEnd = null;
      cb && cb();
    }
  }

  TD.Adv = Adv;
})();
