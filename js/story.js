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
  seira:   { char: 'seira' },
  celes:   { char: 'celes' },
  shigure: { char: 'shigure' },
  leviath: { name: 'リヴァイア', enemy: true },
  glacies: { name: 'グラキエス', enemy: true },
  ignis:   { name: 'イグニス', enemy: true },
  ordra:   { name: 'オルドラ', enemy: true },
  rin:     { char: 'rin' },
  // 第二部：まだ英雄として登場しない者は、art（TD.CUSTOM_ART のキー）と title で立ち絵を出す
  lumina_god: { name: 'ルミナ', art: 'lumina_god', title: '生命の循環の神' },
  astrea:   { name: 'アストレア', art: 'astrea', title: '天秤の災厄' },
  argos:    { name: 'アルゴス', art: 'argos', title: '千眼の災厄' },
  verumina: { name: 'ヴェルミナ', art: 'verumina', title: '腐蝕の災厄' },
  blaire:  { char: 'blaire' },
  karin:   { char: 'karin' },
  meltia:  { char: 'meltia' },
  nereia:  { char: 'nereia' },
  ciel:    { char: 'ciel' },
  chloe:   { char: 'chloe' },
  zephyr:  { char: 'zephyr' },
  kagura:  { char: 'kagura' },
  scout:   { name: '雪原の斥候', stand: false },
  villager: { name: 'アクアリアの住人', stand: false },
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
      [null, '千年の昔、大陸に「七つの災厄」が現れた。', { bg: 'void' }],
      [null, '英雄たちは命と引き換えに、大陸を覆う「大結界」を張り、災厄を封じた――。'],
      [null, '……人々は、そう語り継いでいる。'],
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
    title: '1-4 城門前の攻防', chapter: 1,
    lines: [
      ['soldier', '報告！ 城門前に魔物の先遣隊！ 弓を持った個体が混じっています！', { bg: 'gate', fx: 'shake' }],
      ['gald', 'ヴァルグめ、夜明けを待たずに様子見の兵を寄越したか。'],
      ['lumina', '弓や魔法を使う魔物は、後ろにいる仲間を狙ってきます。'],
      ['mia', 'け、怪我をしたら、すぐに治しますから！'],
      ['lydia', '決戦の前の腕ならしね。{name}、ここで陣形を整えておきましょう。'],
    ],
  },
  '1-5-pre': {
    title: '1-5 王都城門・決戦', chapter: 1,
    lines: [
      ['lumina', '夜が明けます……。ヴァルグが来ます。', { bg: 'dawn' }],
      ['gald', '正門の守りは固めた。あとは、奴を討てるかどうかだ。'],
      ['lumina', '{name}さま。ヴァルグは闇の力をまとっています。光属性の攻撃が有効なはずです！'],
      ['lydia', '光の聖剣の出番ってことね。……{name}、背中は任せたわ。'],
      ['varg', '……我らを忘れたか、召喚士。ならば千年分の恨み、その身で受けるがいい！', { fx: 'shake' }],
    ],
  },
  '1-5-post': {
    title: '1-5 その後　旅立ち', chapter: 1,
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
// ===================== 第2章 蒼の結界石 =====================
TD.STORY['2-1-pre'] = {
  title: '2-1 湖の都へ', chapter: 2,
  lines: [
    [null, '王都を発って三日。一行は、大陸最大の湖に浮かぶ水の都アクアリアを目指していた。', { bg: 'road' }],
    ['lumina', 'この先の湖の神殿に、最初の「結界石」が眠っているはずです。'],
    ['lydia', '結界石を清めれば、大結界の綻びが少しは塞がるのよね。'],
    ['lumina', 'はい。でも……湖の様子がおかしいんです。水がこんなに冷たいなんて。'],
    ['villager', 'た、旅の方！ 湖から魔物が上がってきて……街道が！', { fx: 'shake' }],
    ['lydia', '行くわよ、{name}。困っている人を放ってはおけないわ。'],
  ],
};
TD.STORY['2-1-post'] = {
  title: '2-1 その後　蒼の剣聖', chapter: 2,
  lines: [
    ['seira', '……見事な采配です。あなたが噂の召喚士殿ですね。', { bg: 'road' }],
    ['lydia', 'あなたは？'],
    ['seira', 'アクアリアの剣術道場を預かる、セイラと申します。'],
    ['seira', '湖の神殿が、凍りついた鱗を持つ大蛇に占拠されました。街の者だけでは、もう……'],
    ['lumina', '凍りついた鱗……まさか、七つの災厄の一柱！？'],
    ['seira', 'どうか力を貸してください。この刃、あなたに預けます。'],
  ],
};
TD.STORY['2-3-pre'] = {
  title: '2-3 氷結の洞穴', chapter: 2,
  lines: [
    ['seira', '神殿へは、この洞穴を抜けるのが近道です。ですが、中は氷のゴーレムの巣で……', { bg: 'dark' }],
    ['celes', '……あら。騒がしいと思ったら、お客様？'],
    ['lumina', 'あなたは、氷華の魔女……セレスさん！'],
    ['celes', 'この洞穴の氷は、わたしの魔法じゃないわ。あの大蛇の冷気が、湖ごと凍らせようとしているの。'],
    ['celes', '……いいわ、少しだけ付き合ってあげる。ゴーレムは硬いから、守りを崩してから叩きなさい。'],
  ],
};
TD.STORY['2-5-pre'] = {
  title: '2-5 蒼の神殿', chapter: 2,
  lines: [
    [null, '湖の中心、蒼い光を放つ神殿。その奥で、巨大な影がとぐろを巻いていた。', { bg: 'dark' }],
    ['leviath', '……ヴァルグを退けた召喚士か。愚かな兄弟の仇討ちに来たか？', { fx: 'shake' }],
    ['lumina', '結界石から離れなさい！ それは、この大陸を守るためのものです！'],
    ['leviath', '守る？ 千年も我らを閉じ込めた檻を、守るだと？'],
    ['shigure', '……雨の匂いがすると思ったら、とんだ大物だねぇ。'],
    ['seira', 'シグレ殿！ 来てくださったのですね。'],
    ['shigure', '用心棒は、雨の日に働くもんさ。……さて、{name}の旦那。指示をおくれ。'],
    ['leviath', '良かろう。凍てつく湖の底で、永遠に眠るがいい！', { fx: 'flash' }],
  ],
};
TD.STORY['2-5-post'] = {
  title: '2-5 その後　次なる結界石へ', chapter: 2,
  lines: [
    ['leviath', 'グ……ヌゥ……この私が……人間ごときに……！', { bg: 'dark', fx: 'flash' }],
    ['leviath', '覚えておけ……結界石は、あと五つ……残る災厄たちが……必ず……', { fx: 'shake' }],
    [null, 'リヴァイアの巨体は、無数の氷の粒となって砕け散った。'],
    [null, '湖を覆っていた氷が溶け、神殿の奥で結界石が蒼く輝きはじめる。', { bg: 'shrine' }],
    ['lumina', '結界石が……清められていきます！ 大結界の綻びが、ひとつ塞がりました！'],
    ['seira', 'アクアリアを救っていただき、感謝の言葉もありません。'],
    ['celes', '……ふん。次の結界石は、北の雪原よ。もっと寒いけど、ついてこられる？'],
    ['lydia', 'もちろん。ね、{name}？'],
    ['lumina', '{name}さま。わたしたちの旅は、まだまだ続きます！'],
    [null, '――第2章「蒼の結界石」 完', { bg: 'void' }],
    [null, '第3章へ続く'],
  ],
};

// ===================== 第3章 白銀の結界石 =====================
TD.STORY['3-1-pre'] = {
  title: '3-1 北の雪原へ', chapter: 3,
  lines: [
    [null, 'アクアリアを発った一行は、北の雪原へと足を踏み入れた。吐く息が白く凍る。', { bg: 'shrine' }],
    ['celes', '……ここから先が、白銀の雪原。二つ目の結界石は、この先の古城に眠っているわ。'],
    ['scout', '召喚士様！ 雪原の南に、二つの村があります。魔物の群れが、両方へ向かっています！', { fx: 'shake' }],
    ['lumina', '二つの村を同時に……！ {name}さま、守るべき場所が二つあります。'],
    ['lydia', '戦力を分けるしかないわね。どちらも見捨てはしない。'],
  ],
};
TD.STORY['3-1-post'] = {
  title: '3-1 その後　嵐を纏う射手', chapter: 3,
  lines: [
    ['zephyr', 'ヒュウ、両方守りきるとはね。噂の召喚士ってのは、伊達じゃないらしい。', { bg: 'shrine' }],
    ['lumina', 'あなたは……風の射手、ゼファーさん？'],
    ['zephyr', 'この雪原の風が、ずっと泣いてる。古城に居座った災厄のせいさ。'],
    ['zephyr', '借りを返しに行くなら、俺も混ぜてくれよ。弓の腕なら、誰にも負けない。'],
  ],
};
TD.STORY['3-3-pre'] = {
  title: '3-3 氷霊の吹雪', chapter: 3,
  lines: [
    [null, '吹雪が強まり、視界が白く閉ざされていく。', { bg: 'dark' }],
    ['lumina', '吹雪の中に……何かいます！ 空を飛ぶ、氷の霊……！'],
    ['kagura', '……災厄の冷気が、死者の魂を凍らせて操っているのです。'],
    ['lydia', 'カグラ！ あなたまで来てくれたの？'],
    ['kagura', '星が告げていました。白銀の災厄が目覚める、と。……鎖で縛れるものなら、何でも縛りましょう。'],
  ],
};
TD.STORY['3-5-pre'] = {
  title: '3-5 凍嵐の玉座', chapter: 3,
  lines: [
    [null, '雪原の果ての古城。凍りついた玉座に、嵐そのもののような影が座していた。', { bg: 'dark' }],
    ['glacies', '……来たか、召喚士。ヴァルグもリヴァイアも、貴様に討たれたと聞く。', { fx: 'shake' }],
    ['glacies', 'だが我は違う。この嵐で、貴様の守るものを――二つ同時に凍てつかせてくれよう。'],
    ['zephyr', '風を汚すんじゃねえよ。……{name}、あいつは風の化身だ。火で焼き払っちまえ！'],
    ['lumina', '村へ続く二つの道を、どちらも守りきってください！ {name}さま！'],
  ],
};
TD.STORY['3-5-post'] = {
  title: '3-5 その後　残る災厄', chapter: 3,
  lines: [
    ['glacies', 'バカな……この嵐が……止むなど……！', { bg: 'dark', fx: 'flash' }],
    ['glacies', '思い上がるな……残る災厄は四つ……最も古き者が……もう、目覚めている……', { fx: 'shake' }],
    [null, '嵐がやみ、雲間から光が差し込む。古城の奥で、結界石が白く輝きはじめた。', { bg: 'shrine' }],
    ['lumina', '結界石が清められました……！ これで二つ目です、{name}さま！'],
    ['celes', '……最も古き者。嫌な響きね。'],
    ['lydia', 'どんな相手でも、みんなで守り抜くだけよ。そうでしょう、{name}？'],
    [null, '――第3章「白銀の結界石」 完', { bg: 'void' }],
    [null, '第4章へ続く'],
  ],
};

// ===================== 第4章 紅蓮の結界石 =====================
TD.STORY['4-1-pre'] = {
  title: '4-1 火山のふもと', chapter: 4,
  lines: [
    [null, '白銀の古城から南へ。大地は赤く焼け、空には火山の噴煙がたなびいていた。', { bg: 'dark' }],
    ['lumina', '三つ目の結界石は、あの火山の火口に眠っています。でも……空気が、熱い……。'],
    ['karin', 'あら、旅の方？ 火山街道へ行くなら、気をつけて。最近、魔物が二列になって押し寄せてくるの。'],
    ['lumina', '二列……？'],
    ['karin', 'この街道は、荷車がすれ違えるほど広いのよ。片側だけ塞いでも、もう片側からすり抜けていくわ。'],
    ['lydia', 'なら、二人並んで受け止めればいい。{name}、配置は任せたわ。'],
  ],
};
TD.STORY['4-1-post'] = {
  title: '4-1 その後　紅蓮の拳', chapter: 4,
  lines: [
    ['blaire', 'へえ、二列まとめて止めちまうとはね！ あんたたち、やるじゃないか！', { bg: 'dark' }],
    ['karin', 'ブレア！ また一人で火口に突っ込むつもりだったでしょう。'],
    ['blaire', 'カリンは心配性なんだよ。……でも、火口の奥から妙な声がするのは本当さ。'],
    ['blaire', '「喰らえ、燃やせ」ってね。召喚士さん、あたしの拳も連れてってくれ！'],
  ],
};
TD.STORY['4-3-pre'] = {
  title: '4-3 二つの火口', chapter: 4,
  lines: [
    [null, '火山の中腹。広い道は二手に分かれ、それぞれが別の火口へと続いていた。', { bg: 'dark' }],
    ['unknown', '……来るがいい、召喚士。喰らい残した結界石ごと、灰にしてくれる。', { fx: 'shake' }],
    ['kai', 'この声……火口の底からだ！ 熱気で肌がビリビリするぜ……！'],
    ['lumina', '魔物の列が、左右の火口へ分かれていきます！ 両方の拠点を守ってください！'],
  ],
};
TD.STORY['4-5-pre'] = {
  title: '4-5 紅蓮の火口', chapter: 4,
  lines: [
    [null, '火口の縁。煮えたぎる溶岩の中から、炎そのものの巨体がせり上がる。', { bg: 'dark', fx: 'flash' }],
    ['ignis', '我は灼炎の災厄、イグニス。……ヴァルグ、リヴァイア、グラキエス。どいつも喰い足りぬ連中だった。', { fx: 'shake' }],
    ['ignis', '召喚士よ。貴様を引きずってでも連れ帰れば、「あの御方」もさぞお喜びになろう。'],
    ['karin', '火には水よ！ 水の力を持つ人たちを前に！'],
    ['lumina', 'この火口を越えれば、三つ目の結界石です！ {name}さま、お願いします！'],
  ],
};
TD.STORY['4-5-post'] = {
  title: '4-5 その後　原初の目覚め', chapter: 4,
  lines: [
    ['ignis', 'グ……オォ……！ この炎が……消える……だと……！', { bg: 'dark', fx: 'flash' }],
    ['ignis', '……愚かな。残る三柱は、すでに「原初の御方」に喰われ、ひとつになった……。'],
    ['ignis', '千年前、御方が……我らが仕えた者……召喚士……貴様のことだ……！', { fx: 'shake' }],
    [null, '炎が消え、火口の底で結界石が赤く輝きはじめた。', { bg: 'shrine' }],
    ['lumina', '三つ目の結界石が……清められました。でも、今の言葉は……。'],
    ['me', '……千年前に、仕えた……？'],
    ['lydia', '{name}……。今は考えないで。最後の結界石は、魔界の門の向こう。行きましょう。'],
    [null, '――第4章「紅蓮の結界石」 完', { bg: 'void' }],
    [null, '終章へ続く'],
  ],
};

// ===================== 第5章（終章） 原初の災厄 =====================
TD.STORY['5-1-pre'] = {
  title: '5-1 魔界の門', chapter: 5,
  lines: [
    [null, '大陸の中心。大結界の要に、黒くひび割れた「魔界の門」がそびえていた。', { bg: 'void' }],
    ['meltia', 'ふふ、ここまで来たのね。わたしの故郷の入り口へ、ようこそ。'],
    ['lumina', 'メルティアさん……！ 魔界のお姫さまが、どうしてここに？'],
    ['meltia', '退屈しのぎ……と言いたいところだけど。わたしの国も、オルドラに喰われたの。原初の災厄に、ね。'],
    ['meltia', '気をつけて。門の向こうには「深淵の祈祷師」がいるわ。前には出ずに、後ろから仲間を癒やし続ける嫌な連中よ。'],
    ['meltia', 'こちらの射程に入ると、すっと下がるの。遠くまで届く矢か、全体を巻き込む力で狙いなさい。'],
  ],
};
TD.STORY['5-1-post'] = {
  title: '5-1 その後　深淵の竜', chapter: 5,
  lines: [
    ['nereia', '……魔界の門をくぐる人間なんて、何百年ぶりかしら。', { bg: 'void' }],
    ['meltia', 'ネレイア！ 深淵の竜の魔女が、わざわざ出迎え？'],
    ['nereia', 'オルドラは深淵の底で、千年ぶんの憎しみを溜めている。……あれを鎮められるのは、あれが千年待ち続けた相手だけ。'],
    ['nereia', '召喚士。あなたの眠っていた記憶、そろそろ目を覚ます頃よ。'],
  ],
};
TD.STORY['5-3-pre'] = {
  title: '5-3 冥府の分岐', chapter: 5,
  lines: [
    [null, '道は二つに分かれ、どちらの先にも結界の光が揺れている。', { bg: 'void' }],
    ['lumina', '{name}さま……。わたし、ずっと黙っていたことがあります。'],
    ['lumina', '千年前、七つの災厄を封じた英雄たち。その中心にいたのは……「最初の召喚士」でした。'],
    [null, 'ルミナは一瞬だけ、目を伏せた。'],
    ['lumina', 'あなたは、その方の生まれ変わり……いいえ、封印と一緒に眠り続けた、ご本人なのです。'],
    ['me', '……だから、英雄を喚べるのか。あいつが、こちらを知っていたのも……。'],
    ['lydia', '誰であっても、あなたはわたしたちの召喚士よ。……さあ、両方の道を守りましょう。'],
  ],
};
TD.STORY['5-5-pre'] = {
  title: '5-5 原初の玉座', chapter: 5,
  lines: [
    [null, '深淵の最奥。まっすぐに伸びる一本道の先で、山のような影がゆっくりと立ち上がった。', { bg: 'void', fx: 'shake' }],
    ['ordra', '……久しいな、召喚士。千年の眠りは、心地よかったか。', { fx: 'flash' }],
    ['ordra', '六柱を喰らい、我は再びひとつとなった。……我らを忘れ、我らの檻を守るというのなら、今度こそ、貴様の喚ぶ英雄ごと、すべてを無に還そう。'],
    ['nereia', 'あれが力を溜め始めたら、そばにいる者は誰も助からない。……倒れても、何度でも喚び直して。'],
    ['lydia', '光の剣は、闇を断つためにある。{name}、最後まで一緒に！'],
    ['lumina', '最後の戦いです。{name}さま……大結界を、取り戻しましょう！'],
  ],
};
TD.STORY['5-5-post'] = {
  title: '終章　大結界の夜明け', chapter: 5,
  lines: [
    ['ordra', '馬鹿な……千年……千年、待ったのだぞ……！', { bg: 'void', fx: 'flash' }],
    ['ordra', '……思い出せ、我が主よ。あなたが我らに約束した……永遠を……。', { fx: 'shake' }],
    [null, '巨体が光の粒となって崩れ落ちる。最後の結界石が、まばゆく輝いた。', { bg: 'shrine' }],
    [null, '四つの結界石が共鳴し、大陸を覆う大結界が、千年ぶりに完全な姿を取り戻していく。'],
    ['lumina', '……終わりました。{name}さま、本当に……本当に、ありがとうございました！', { bg: 'dawn' }],
    ['meltia', 'ふふ、退屈しない旅だったわ。……魔界も、これで少しは静かになるかしら。'],
    ['lydia', '眠りから覚めたあなたが、もう一度この大陸を救った。……おかえりなさい、{name}。'],
    ['me', '……ただいま。'],
    [null, '――終章「原初の災厄」 完', { bg: 'void' }],
    [null, 'そして、英雄たちの日々は続いていく。'],
  ],
};

// ===================== 外伝 英雄王の帰還（古代の英雄の欠片を30個集めて召喚） =====================
TD.STORY['rin-join'] = {
  title: '外伝　英雄王の帰還', chapter: 'ex',
  lines: [
    [null, '集めた古代の欠片が、召喚陣の上でひとりでに浮かび上がった。', { bg: 'void' }],
    [null, '光が、ない。召喚陣が、闇そのものに塗りつぶされていく。', { fx: 'shake' }],
    ['lumina', 'こ、この魔力……！ 災厄よりも、ずっと深くて、ずっと古い……！'],
    [null, '闇が裂け、一振りの黒い剣が、大地に突き立った。', { fx: 'flash' }],
    ['rin', '……千年。随分と待たせたな、召喚士。'],
    ['lumina', 'あなたは……まさか、千年前に七つの災厄を封じた英雄たちの……！'],
    ['rin', '英雄王、リン。災厄どもが「王」と呼んだ者だ。'],
    ['rin', 'ヴァルグも、リヴァイアも、グラキエスも、イグニスも――千年前、すべてこの剣の前に膝をついた。'],
    ['rin', '千年前の最後の夜、我が魂は砕け、欠片となって大陸に散った。……その欠片は、ずっとお前の歩く道にだけ落ちていた。偶然だと思うか？'],
    [null, 'ルミナは、その言葉の意味に気づかなかった。'],
    ['me', '……どうして、また力を貸してくれる？'],
    ['rin', '決まっている。千年前、我が剣を預けた唯一の主が、お前だからだ。'],
    [null, '黒い剣が一閃する。その剣圧だけで、召喚陣のまわりの魔物の気配が、すべて消し飛んだ。', { fx: 'flash' }],
    ['lumina', 'ひ、一振りで……！'],
    ['rin', 'まだ欠片が足りん。今の我は、かつての影にすぎぬ。……集めろ、召喚士。残りの欠片を。'],
    ['rin', 'すべて揃ったとき――この世に、我が斬れぬものはない。'],
  ],
};

// 英雄王リンが本来の力を取り戻すたびに流れるショートストーリー
TD.STORY['rin-awaken-1'] = {
  title: '外伝　王の剣、目覚める（顕現1）', chapter: 'ex',
  lines: [
    [null, '古代の欠片が、リンの黒い剣に吸い込まれていく。', { bg: 'void' }],
    ['rin', '……ほう。剣が、我の手を思い出したか。'],
    [null, '試すように振るった一太刀が、はるか遠くの岩山を音もなく両断した。', { fx: 'flash' }],
    ['lumina', 'い、今のは……ただの素振り、ですよね……？'],
    ['rin', '素振りだ。王の、な。'],
  ],
};
TD.STORY['rin-awaken-2'] = {
  title: '外伝　翼、ひらく（顕現2）', chapter: 'ex',
  lines: [
    [null, '欠片が光の羽となり、リンの背に降り積もる。', { bg: 'void' }],
    [null, 'ばさり、と。闇を払うように、白い翼が大きくひらいた。', { fx: 'shake' }],
    ['rin', '千年ぶりの翼だ。……空が、狭く感じる。'],
    ['me', 'それが、本来の姿……？'],
    ['rin', 'まだ半分にも満たぬ。だが、そこらの英雄と肩を並べる程度には戻った。'],
  ],
};
TD.STORY['rin-awaken-3'] = {
  title: '外伝　災厄を裁く光輪（顕現3）', chapter: 'ex',
  lines: [
    [null, '頭上に、黄金の光輪が浮かび上がる。大地が、王の帰還にひれ伏すように震えた。', { bg: 'shrine', fx: 'shake' }],
    ['lumina', 'この光輪……古い伝承にある、「災厄を裁く王」の証です……！'],
    ['rin', '七つの災厄を裁いたのは、この光だ。……思い出してきたぞ、千年前の戦場を。'],
    ['rin', '召喚士。もう背中に隠れていろとは言わん。――隣に立て。共に斬り拓く。'],
  ],
};
TD.STORY['rin-awaken-4'] = {
  title: '外伝　英雄王、顕現す（顕現4）', chapter: 'ex',
  lines: [
    [null, '最後の欠片が砕け散る。四本の剣が、リンを守るように宙に浮かび上がった。', { bg: 'void', fx: 'flash' }],
    [null, '光と闇が渦を巻き、召喚陣そのものが、王の前にかしずいた。', { fx: 'shake' }],
    ['rin', '……ああ。これだ。これが、千年前の我だ。'],
    ['lumina', '魔力の大きさが……測れません。災厄が、まるで小さく見えるほどに……！'],
    ['rin', '英雄王リン、ここに完全に顕現した。'],
    ['rin', '天も、地も、災厄も、運命さえも――我が剣の前では、等しく塵だ。行くぞ、召喚士。'],
  ],
};

TD.STORY['event-maid'] = {
  title: 'イベント　王城メイド隊 前編　星詠みのシエル', chapter: 'ev',
  lines: [
    [null, '王城の朝。いつもなら静かな中庭に、けたたましい鐘の音が響いた。', { bg: 'gate' }],
    ['soldier', '魔物の群れが城内に！ 守備隊は城門に出払っています！', { fx: 'shake' }],
    ['ciel', '……困りましたね。今日は大広間のお掃除の日なのですが。'],
    ['lumina', 'あなたは……王城のメイドさん？ その杖は……！'],
    ['ciel', '王城メイド隊、副メイド長のシエルと申します。星詠みの魔法を少々。'],
    ['ciel', '本来なら護衛担当のクロエがいるのですが……あの子はお嬢様を連れて、地下の避難路へ向かいました。'],
    ['ciel', 'ですから、ここはわたしが。……召喚士さま、手を貸していただけますか？'],
    ['ciel', 'お礼は……そうですね。散らばった銀のティースプーンを集めてくださったら、わたしも正式にお仕えいたします。'],
    ['lumina', 'ティースプーン……？ と、とにかく行きましょう、{name}さま！'],
  ],
};

TD.STORY['event-maid2'] = {
  title: 'イベント　王城メイド隊 後編　黒薔薇のクロエ', chapter: 'ev',
  lines: [
    [null, '中庭の魔物を退けたあと。シエルは、地下へ続く扉の前で立ち止まっていた。', { bg: 'dark' }],
    ['ciel', '……おかしいですね。魔物は、城の外ではなく地下から湧いています。'],
    ['lumina', '地下って……クロエさんとお嬢様が避難した場所じゃ……！'],
    ['ciel', 'ええ。クロエからの合図が、まだ届いていないのです。', { fx: 'shake' }],
    [null, '薄暗い地下回廊。崩れた宝物庫の前で、黒い盾を構えた少女が魔物の群れを食い止めていた。'],
    ['chloe', '……来ないで。この先には、お嬢様がいるの。一歩も通さない。'],
    ['ciel', 'クロエ！ 援軍をお連れしました。召喚士さまです。'],
    ['chloe', '……シエル。遅い。でも、助かった。'],
    ['chloe', '魔物に、お嬢様の黒薔薇のブローチを奪われた。全部取り戻してくれたら……あなたの盾になってあげる。'],
    ['lumina', '{name}さま、地下回廊へ！ クロエさんを助けましょう！'],
  ],
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
TD.STORY_ORDER = ['prologue', '1-1-post', '1-2-pre', '1-2-post', '1-3-pre', '1-3-post', '1-4-pre', '1-5-pre', '1-5-post',
  '2-1-pre', '2-1-post', '2-3-pre', '2-5-pre', '2-5-post',
  '3-1-pre', '3-1-post', '3-3-pre', '3-5-pre', '3-5-post',
  '4-1-pre', '4-1-post', '4-3-pre', '4-5-pre', '4-5-post',
  '5-1-pre', '5-1-post', '5-3-pre', '5-5-pre', '5-5-post', 'rin-join', 'rin-awaken-1', 'rin-awaken-2', 'rin-awaken-3', 'rin-awaken-4', 'event-starfest', 'event-maid', 'event-maid2'];
TD.CHAPTERS = { 1: '第1章 結界のほころび', 2: '第2章 蒼の結界石', 3: '第3章 白銀の結界石', 4: '第4章 紅蓮の結界石', 5: '第5章 終章・原初の災厄', ex: '外伝', ev: 'イベントストーリー' };

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
    if (sp.art && TD.CUSTOM_ART[sp.art]) {
      return `<div class="stand-char"><span class="full-art"><img class="char-img full" src="${TD.CUSTOM_ART[sp.art].src}" alt="${sp.name}"></span><div class="stand-title">${sp.title || ''}</div></div>`;
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
