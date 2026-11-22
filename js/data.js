// ゲームデータ定義（キャラ・敵・ステージ）
// ここを書き換えるだけでキャラやステージを追加できる。
window.TD = window.TD || {};

TD.ELEMENTS = {
  fire:  { name: '火', color: '#ff6b4a', dark: '#a8321c' },
  water: { name: '水', color: '#4aa8ff', dark: '#1d5aa8' },
  wind:  { name: '風', color: '#5fd68a', dark: '#23804a' },
  light: { name: '光', color: '#ffe066', dark: '#b08a10' },
  dark:  { name: '闇', color: '#a77bff', dark: '#4b2a99' },
};

// 火→風→水→火 の循環で有利（矢印の先に1.5倍）。光と闇は互いに有利。
TD.elemMult = function (atk, def) {
  const strong = { fire: 'wind', wind: 'water', water: 'fire' };
  if (strong[atk] === def) return 1.5;
  if (strong[def] === atk) return 0.75;
  if ((atk === 'light' && def === 'dark') || (atk === 'dark' && def === 'light')) return 1.5;
  return 1;
};

TD.ROLES = {
  sword:  { name: '剣士',   glyph: '剣', melee: true,  desc: '道に配置。敵を足止めして斬る。1マス後ろからも攻撃が届く' },
  shield: { name: '盾騎士', glyph: '盾', melee: true,  desc: '道に配置。多くの敵を食い止める' },
  archer: { name: '弓兵',   glyph: '弓', melee: false, desc: '草地に配置。長射程の単体攻撃' },
  mage:   { name: '魔導士', glyph: '魔', melee: false, desc: '草地に配置。範囲魔法攻撃' },
  priest: { name: '僧侶',   glyph: '癒', melee: false, desc: '草地に配置。味方を回復' },
};

// range はタイル単位。interval は攻撃間隔（秒）。
TD.CHARS = {
  lydia: {
    name: 'リディア', title: '聖剣の騎士姫', rarity: 5, element: 'light', role: 'sword',
    cost: 14, hp: 2268, atk: 184, def: 85, interval: 1.0, range: 1.6, block: 2, redeploy: 30,
    skill: { name: '天穹断', type: 'allStrike', sp: 30, mult: 4,
             desc: 'フィールド上の全ての敵に攻撃力400%の光属性ダメージ' },
    lines: { deploy: '聖剣の名にかけて！', skill: '天よ、裂けよ――天穹断！' },
  },
  celes: {
    name: 'セレス', title: '氷華の魔女', rarity: 4, kind: 'power', element: 'water', role: 'mage',
    cost: 12, hp: 891, atk: 120, def: 15, interval: 1.8, range: 2.6, splash: 0.9, redeploy: 30,
    skill: { name: '氷華結界', type: 'freeze', sp: 30, mult: 2, radius: 2.6, dur: 4,
             desc: '周囲の敵を4秒間凍結し、攻撃力200%のダメージ' },
    lines: { deploy: '……凍える覚悟はある？', skill: '咲き誇れ、氷の華――氷華結界' },
  },
  fin: {
    name: 'フィン', title: '森の狩人', rarity: 4, kind: 'power', element: 'wind', role: 'archer',
    cost: 10, hp: 822, atk: 86, def: 15, interval: 0.9, range: 3.6, redeploy: 25,
    passive: { name: '鷹の目', type: 'range', mult: 1.5, desc: '射程が1.5倍になる' },
    lines: { deploy: '狙いは外さないよ', skill: '風よ、俺の矢に乗れ！疾風連射！' },
  },
  gald: {
    name: 'ガルド', title: '鉄壁の守護者', rarity: 3, element: 'light', role: 'shield',
    partyFx: { name: '守備隊の構え', type: 'def', add: 0.15, desc: '味方全員の防御+15%' },
    cost: 15, hp: 2600, atk: 50, def: 140, interval: 1.4, range: 1.3, block: 3, redeploy: 30,
    passive: { name: '隊長の号令', type: 'adjAtk', mult: 1.2, desc: '隣接するマスの味方の攻撃力+20%' },
    lines: { deploy: 'ここは一歩も通さん', skill: '我が盾は砕けぬ！不動の誓い！' },
  },
  nox: {
    name: 'ノクス', title: '影の剣士', rarity: 4, kind: 'power', element: 'dark', role: 'sword',
    cost: 11, hp: 1507, atk: 174, def: 60, interval: 0.8, range: 1.6, block: 1, redeploy: 25,
    passive: { name: '影の刃', type: 'crit', chance: 0.25, mult: 2, desc: '攻撃の25%が2倍ダメージ（クリティカル）になる' },
    lines: { deploy: '……斬るだけだ', skill: '影に沈め。影縫い' },
  },
  mia: {
    name: 'ミア', title: '見習い僧侶', rarity: 3, element: 'light', role: 'priest',
    partyFx: { name: '見習いの祈り', type: 'hp', add: 0.1, desc: '味方全員の最大HP+10%' },
    cost: 9, hp: 550, atk: 85, def: 5, interval: 1.6, range: 2.6, redeploy: 20,
    skill: { name: '祝福の祈り', type: 'healAll', sp: 30, ratio: 0.4,
             desc: '全ての味方のHPを最大HPの40%回復' },
    lines: { deploy: 'が、がんばりますっ！', skill: '女神さま、みんなを守って！' },
  },
  kai: {
    name: 'カイ', title: '紅蓮の魔導士', rarity: 3, element: 'fire', role: 'mage',
    cost: 12, hp: 600, atk: 85, def: 10, interval: 2.0, range: 2.4, splash: 0.8, redeploy: 25,
    skill: { name: '爆炎陣', type: 'explosion', sp: 25, mult: 5, radius: 1.6,
             desc: '射程内の敵を中心に大爆発。攻撃力500%の範囲ダメージ' },
    lines: { deploy: '燃やし尽くしてやるぜ！', skill: 'まとめて吹き飛べ！爆炎陣！' },
  },
  zephyr: {
    name: 'ゼファー', title: '嵐を纏う射手', rarity: 4, kind: 'power', element: 'wind', role: 'archer',
    cost: 10, hp: 932, atk: 102, def: 22, interval: 0.85, range: 3.8, redeploy: 25,
    passive: { name: '風の双矢', type: 'multi', count: 2, desc: '攻撃が敵2体に当たる' },
    lines: { deploy: '風が騒いでる……来るぞ', skill: '吹き荒れろ、天嵐の矢雨！' },
  },
  blaire: {
    name: 'ブレア', title: '紅蓮の拳闘士', rarity: 4, kind: 'power', element: 'fire', role: 'sword',
    cost: 11, hp: 1644, atk: 150, def: 68, interval: 0.75, range: 1.6, block: 1, redeploy: 25,
    passive: { name: '連撃', type: 'ramp', step: 0.05, max: 0.5, desc: '攻撃するたびに攻撃速度+5%（最大+50%）。撤退すると元に戻る' },
    lines: { deploy: 'さぁ、かかってきな！', skill: '燃え上がれ！烈火連撃！' },
  },
  rune: {
    name: 'ルーン', title: '黒書の魔導士', rarity: 4, kind: 'power', element: 'dark', role: 'mage',
    cost: 14, hp: 891, atk: 126, def: 15, interval: 1.9, range: 2.6, splash: 0.9, redeploy: 30,
    passive: { name: '深淵の知識', type: 'splash', mult: 1.5, desc: '魔法の範囲が1.5倍になる' },
    lines: { deploy: '……この頁を読むのは、何年ぶりかしら', skill: '開け、深淵の頁' },
  },
  thomas: {
    name: 'トマス', title: '見習い騎士', rarity: 3, element: 'water', role: 'shield',
    cost: 12, hp: 1900, atk: 40, def: 110, interval: 1.4, range: 1.3, block: 2, redeploy: 25,
    passive: { name: '盾撃ち', type: 'multi', count: 2, desc: '攻撃が敵2体に当たる' },
    lines: { deploy: 'ぼ、僕だって騎士です！', skill: 'ここで退いたら騎士じゃない！' },
  },
  lily: {
    name: 'リリィ', title: '泉の巫女', rarity: 3, element: 'water', role: 'priest',
    cost: 9, hp: 520, atk: 80, def: 5, interval: 1.5, range: 2.6, redeploy: 20,
    passive: { name: '浄化の泉', type: 'healUp', mult: 1.3, cleanse: true, desc: '回復量+30%。回復した味方の毒を消す' },
    lines: { deploy: '泉の加護を、あなたに', skill: '湧き出でよ、癒しの泉' },
  },
  popo: {
    name: 'ポポ', title: 'ドワーフの石弓兵', rarity: 3, element: 'fire', role: 'archer',
    partyFx: { name: '宝探し', type: 'exp', add: 0.3, desc: 'クリア時の経験の書+30%' },
    cost: 9, hp: 620, atk: 66, def: 20, interval: 1.0, range: 3.2, redeploy: 20,
    skill: { name: '連装石弓', type: 'rapid', sp: 25, rate: 2.5, dur: 8,
             desc: '8秒間、攻撃速度が2.5倍になる' },
    lines: { deploy: 'ドワーフの石弓をなめるなよ！', skill: '全弾装填、撃てーっ！' },
  },

  // ---------- 追加キャラ（AI生成イラスト） ----------
  meltia: {
    name: 'メルティア', title: '魔界の恋姫', rarity: 5, element: 'dark', role: 'priest',
    cost: 13, hp: 1134, atk: 157, def: 28, interval: 1.5, range: 2.8, redeploy: 30,
    profile: '魔界から家出してきたお姫さま。退屈しのぎに人間の味方をしているらしい。',
    skill: { name: '魔王の慈愛', type: 'drainHeal', sp: 32, ratio: 0.5, mult: 1.5,
             desc: '敵全体に攻撃力150%の闇ダメージを与え、味方全員のHPを最大HPの50%回復' },
    lines: { deploy: 'ふふっ、わたしが遊んであげる♪', skill: 'みんなの痛み、ぜーんぶ吸い取っちゃう！' },
  },
  kagura: {
    name: 'カグラ', title: '紅鎖の星姫', rarity: 5, element: 'fire', role: 'shield',
    cost: 17, hp: 4252, atk: 127, def: 227, interval: 1.3, range: 1.3, block: 4, redeploy: 35,
    profile: '星の鎖を操る巫女。ブロック数4はゲーム中で最多。',
    passive: { name: '紅鎖の陣', type: 'blockMult', mult: 1.5, desc: 'ブロック数が1.5倍になる（4→6）' },
    lines: { deploy: '……この先へは、行かせません', skill: '星よ、鎖となりて縛めよ' },
  },
  nereia: {
    name: 'ネレイア', title: '深淵竜の魔女', rarity: 5, element: 'dark', role: 'mage',
    cost: 16, hp: 1021, atk: 170, def: 22, interval: 1.9, range: 2.6, splash: 0.9, redeploy: 35,
    profile: '深海の竜を従える魔女。竜の大波は敵を押し流す。',
    skill: { name: '深淵竜の大波', type: 'tidal', sp: 34, mult: 3.5, radius: 2.6, push: 2,
             desc: '周囲の敵に攻撃力350%のダメージを与え、2マス押し戻す（ボスには無効）' },
    lines: { deploy: '……深淵から、来たわ', skill: '呑み込みなさい、深淵の竜' },
  },
  akane: {
    name: 'アカネ', title: '異界の剣道少女', rarity: 4, kind: 'tech', element: 'wind', role: 'sword',
    unique: { name: '異界の剣気', type: 'startSp', party: true, short: '開始時ゲージ半分', desc: '出撃メンバーにいると、味方全員の発動スキルのゲージが半分たまった状態で配置される（各キャラの最初の配置のみ）' },
    cost: 8, hp: 1089, atk: 123, def: 40, interval: 0.8, range: 1.6, block: 1, redeploy: 20,
    profile: '召喚の儀のはずみで、異世界の学校から呼ばれてしまった剣道部員。',
    skill: { name: '一閃・疾風', type: 'execute', sp: 15, mult: 6, mana: 6,
             desc: '敵1体に攻撃力600%のダメージ。倒すとマナが6回復する' },
    lines: { deploy: 'えっ、ここどこ!? ……まあいっか、いくよ！', skill: '面ーーーっ！' },
  },
  shizuku: {
    name: 'シズク', title: '腹ペコ弓道少女', rarity: 4, kind: 'tech', element: 'dark', role: 'archer',
    unique: { name: '腹ペコの知恵', type: 'retreatRefund', rate: 0.75, party: true, short: '撤退マナ75%', desc: '出撃メンバーにいると、撤退したときに戻るマナが半分から75%になる' },
    cost: 8, hp: 678, atk: 68, def: 13, interval: 1.0, range: 3.4, redeploy: 20,
    profile: 'アカネと一緒に異世界から呼ばれた弓道部員。肉まんがあれば戦える。',
    skill: { name: '肉まん配給', type: 'battery', sp: 20, amount: 10,
             desc: '配置中の味方全員の発動スキルのゲージを10増やす' },
    lines: { deploy: '……もぐもぐ。狙いは、つけた', skill: 'みんなの分もあるよ。……一個ずつね' },
  },
  sylphina: {
    name: 'シルフィナ', title: '天翔ける風詠み', rarity: 5, element: 'wind', role: 'mage',
    cost: 15, hp: 1021, atk: 159, def: 22, interval: 1.8, range: 2.8, splash: 0.9, redeploy: 30,
    profile: '空の神殿で風の声を聴く巫女。彼女が歌えば、嵐さえ道を譲る。',
    skill: { name: '大竜巻', type: 'vortex', sp: 30, mult: 3, radius: 2.4,
             desc: '射程内の敵を一か所に吸い寄せ、攻撃力300%の範囲ダメージ（足止め中の敵とボスは吸い寄せない）' },
    lines: { deploy: '風が、あなたを選んだのね', skill: '集え、天の風――大竜巻' },
  },
  seira: {
    name: 'セイラ', title: '蒼波の剣聖', rarity: 5, element: 'water', role: 'sword',
    cost: 15, hp: 2410, atk: 177, def: 100, interval: 0.95, range: 1.6, block: 2, redeploy: 30,
    profile: '水の都の剣術道場を継ぐ剣聖。受けた刃をそのまま返す「水鏡」の使い手。',
    passive: { name: '常時水鏡', type: 'reflect', ratio: 0.5, defMult: 1.2, desc: '受けたダメージの50%を常に相手に返す。防御+20%' },
    lines: { deploy: '参ります。……お覚悟を', skill: '水鏡に映るは、あなた自身の刃' },
  },
  xeno: {
    name: 'ゼノ', title: '黒鉄の守護騎士', rarity: 4, kind: 'tech', element: 'dark', role: 'shield',
    unique: { name: '黒鉄の誓い', type: 'deathRedeploy', mult: 0.5, party: true, short: 'やられた時の再配置半分', desc: '出撃メンバーにいると、味方がやられたときの再配置時間が半分になる' },
    cost: 10, hp: 2662, atk: 59, def: 173, interval: 1.4, range: 1.3, block: 2, redeploy: 25,
    profile: '素顔を誰にも見せない黒鉄の騎士。仲間の盾になることだけを誓っている。',
    skill: { name: '黒鉄の咆哮', type: 'taunt', sp: 22, dur: 8, radius: 3, defMult: 1.5,
             desc: '8秒間、周囲3マスの敵の遠距離攻撃とボスの範囲攻撃を自分に引きつける。防御1.5倍' },
    lines: { deploy: '……背中は、俺が守る', skill: 'こっちだ、化け物ども！' },
  },
  karin: {
    name: 'カリン', title: '火守りの薬師', rarity: 4, kind: 'tech', element: 'fire', role: 'priest',
    unique: { name: '火守りの薬', type: 'poisonImmune', party: true, short: '毒無効', desc: '出撃メンバーにいると、味方全員が毒にかからない' },
    cost: 8, hp: 678, atk: 80, def: 11, interval: 1.6, range: 2.6, redeploy: 20,
    profile: '火山のふもとで薬屋を営む薬師。調合した秘薬は、飲めば力が湧いてくる。',
    skill: { name: '炎の秘薬', type: 'rally', sp: 24, dur: 10, atkMult: 1.3, ratio: 0.2,
             desc: '10秒間、配置中の味方全員の攻撃力30%アップ。さらにHPを20%回復' },
    lines: { deploy: 'お薬の時間ですよ～？', skill: '特製の秘薬、みんなでどうぞ♪' },
  },
  shigure: {
    name: 'シグレ', title: '番傘の狙撃手', rarity: 4, kind: 'tech', element: 'water', role: 'archer',
    unique: { name: '雨宿りの番傘', type: 'aoeHalf', mult: 0.5, party: true, short: 'ボス範囲攻撃半減', desc: '出撃メンバーにいると、ボスの範囲攻撃で受けるダメージが半分になる' },
    cost: 9, hp: 750, atk: 75, def: 20, interval: 1.1, range: 3.4, redeploy: 25,
    profile: '仕込み銃の番傘を携えた流しの用心棒。雨の日にだけ、ふらりと現れる。',
    skill: { name: '時雨の番傘', type: 'barrier', sp: 26, dur: 8, mult: 2, reduce: 0.3,
             desc: '射程内の敵全員に攻撃力200%の連射。8秒間、配置中の味方全員の受けるダメージを30%軽減' },
    lines: { deploy: '……雨の匂いがするねぇ', skill: '傘の内は、安全さ' },
  },

  aster: {
    name: 'アステル', title: '天翼の盾騎士', rarity: 4, kind: 'tech', element: 'light', role: 'shield',
    unique: { name: '天翼の加護', type: 'lifeUp', add: 2, party: true, short: 'ライフ+2', desc: '出撃メンバーにいると、ステージのライフが+2される' },
    cost: 12, hp: 2541, atk: 75, def: 146, interval: 1.3, range: 1.3, block: 2, redeploy: 25,
    profile: '天空の神殿に仕える盾の騎士。肩の小さな蛇は相棒。大盾ごと敵に突っ込む無鉄砲さが玉に瑕。',
    skill: { name: '天盾突撃', type: 'shieldBash', sp: 24, radius: 1.6, stun: 2.5, dur: 8, defMult: 1.5,
             desc: '周囲の敵を2.5秒間気絶させ、8秒間ブロック数+2・防御1.5倍' },
    lines: { deploy: 'オレの盾は、絶対に割れない！', skill: 'どけどけーっ！ 天盾突撃！' },
  },

  // ---------- ★3（初心者の戦力・サポート） ----------
  lux: {
    name: 'ルクス', title: '聖光の見習い狙撃手', rarity: 3, element: 'light', role: 'archer',
    cost: 8, hp: 560, atk: 60, def: 12, interval: 1.0, range: 3.4, redeploy: 20,
    profile: '敵の守りを崩す見習い狙撃手。硬い敵やボス戦で真価を発揮する。',
    skill: { name: '聖光の刻印', type: 'defDown', sp: 22, dur: 10, mult: 0.5,
             desc: '射程内の敵全員の防御を10秒間半減する' },
    lines: { deploy: '弱点、見つけてみせます', skill: '光よ、印を刻め！' },
  },
  pico: {
    name: 'ピコ', title: '見習い光術士', rarity: 3, element: 'light', role: 'mage',
    partyFx: { name: '光の導き', type: 'mana', add: 4, desc: 'バトル開始時のマナ+4' },
    cost: 10, hp: 540, atk: 75, def: 8, interval: 1.9, range: 2.4, splash: 0.8, redeploy: 20,
    skill: { name: '閃光弾', type: 'flash', sp: 22, radius: 1.6, stun: 2, mult: 2,
             desc: '周囲の敵を2秒間気絶させ、攻撃力200%のダメージ' },
    lines: { deploy: 'ぼ、ぼくだってやれます！', skill: 'まぶしいの、いっきまーす！' },
  },
  emil: {
    name: 'エミル', title: '王都の新米衛兵', rarity: 3, element: 'light', role: 'sword',
    partyFx: { name: '衛兵の鼓舞', type: 'atk', add: 0.1, desc: '味方全員の攻撃+10%' },
    cost: 9, hp: 950, atk: 95, def: 40, interval: 0.95, range: 1.6, block: 1, redeploy: 20,
    passive: { name: '衛兵の誇り', type: 'pride', threshold: 0.5, mult: 1.3, desc: 'HPが半分以上の間、攻撃力+30%' },
    lines: { deploy: '衛兵エミル、ただいま参上！', skill: 'ここが踏ん張りどころ！' },
  },
  bold: {
    name: 'ボルド', title: '風車小屋の番人', rarity: 3, element: 'wind', role: 'shield',
    cost: 11, hp: 1800, atk: 45, def: 100, interval: 1.4, range: 1.3, block: 2, redeploy: 25,
    skill: { name: '向かい風', type: 'gust', sp: 24, push: 1, dur: 8, defMult: 2,
             desc: '足止め中の敵を1マス押し戻し、8秒間防御2倍' },
    lines: { deploy: 'わしの風車は、壊させんぞ', skill: 'ふんっ、吹き飛べい！' },
  },
  soyo: {
    name: 'ソヨ', title: 'そよ風の歌い手', rarity: 3, element: 'wind', role: 'priest',
    cost: 9, hp: 520, atk: 65, def: 5, interval: 1.6, range: 2.6, redeploy: 20,
    unique: { name: '天使の加護', type: 'invuln', desc: '自身のHPが減らない（敵の攻撃・範囲攻撃・毒を受けない）' },
    profile: '風に歌を乗せる天使のような歌い手。どんな攻撃も、彼女を傷つけることはできない。',
    skill: { name: '追い風の歌', type: 'haste', sp: 24, dur: 8, mult: 1.4, ratio: 0.15,
             desc: '8秒間、配置中の味方全員の攻撃速度1.4倍。さらにHPを15%回復' },
    lines: { deploy: 'ラララ～♪ 風よ、みんなに届いて', skill: '追い風の歌、聴いてください！' },
  },
  hayate: {
    name: 'ハヤテ', title: '疾風の飛脚', rarity: 3, element: 'wind', role: 'sword',
    partyFx: { name: '疾風の運び屋', type: 'stones', add: 0.5, desc: 'クリア時にもらえる魔晶石+50%' },
    cost: 8, hp: 850, atk: 80, def: 30, interval: 0.7, range: 1.6, block: 1, redeploy: 20,
    passive: { name: '疾風二刀', type: 'multi', count: 2, desc: '攻撃が敵2体に当たる' },
    lines: { deploy: '速達だよ！ ……あれ、戦い？', skill: '足には自信があるんだ！' },
  },
  mint: {
    name: 'ミント', title: '森の見張り番', rarity: 3, element: 'wind', role: 'archer',
    cost: 8, hp: 560, atk: 62, def: 10, interval: 1.0, range: 3.3, redeploy: 20,
    passive: { name: '見張り', type: 'slowAura', mult: 0.85, desc: '射程内の敵の移動速度を常に15%下げる' },
    lines: { deploy: '見張りなら任せて', skill: 'まとめて足止めっ！' },
  },
  kagerou: {
    name: 'カゲロウ', title: '夜回りの忍び', rarity: 3, element: 'dark', role: 'sword',
    cost: 9, hp: 880, atk: 100, def: 30, interval: 0.85, range: 1.6, block: 1, redeploy: 20,
    passive: { name: '毒の刃', type: 'poisonBlade', stacks: 1, desc: '攻撃するたびに敵に毒を1つためる（最大5つ）' },
    lines: { deploy: '……御意', skill: '影より出でて、影に消ゆ' },
  },
  glen: {
    name: 'グレン', title: '墓守の大男', rarity: 3, element: 'dark', role: 'shield',
    cost: 12, hp: 2000, atk: 45, def: 105, interval: 1.5, range: 1.3, block: 2, redeploy: 25,
    passive: { name: '巨躯', type: 'blockMult', mult: 1.5, desc: 'ブロック数が1.5倍になる（2→3）' },
    lines: { deploy: '……眠りを妨げる者は、通さん', skill: 'ぬうぅん！' },
  },
  luna: {
    name: 'ルナ', title: '月影の狩人', rarity: 3, element: 'dark', role: 'archer',
    cost: 9, hp: 580, atk: 66, def: 12, interval: 1.0, range: 3.2, redeploy: 20,
    passive: { name: '鈍化の矢', type: 'slowShot', mult: 0.7, dur: 3, desc: '攻撃した敵の移動速度を3秒間30%下げる' },
    lines: { deploy: '月が綺麗な夜ね', skill: '月の光は、外れない' },
  },
  viola: {
    name: 'ヴィオラ', title: '見習い呪術師', rarity: 3, element: 'dark', role: 'mage',
    unique: { name: '蝕みの呪い', type: 'poisonHunter', mult: 2, desc: '毒状態の敵に与えるダメージが2倍になる' },
    cost: 11, hp: 560, atk: 80, def: 8, interval: 2.0, range: 2.4, splash: 0.8, redeploy: 25,
    skill: { name: '呪いの霧', type: 'explosion', sp: 25, mult: 3.5, radius: 1.5,
             poison: 3, desc: '射程内の敵を中心に呪いの霧。攻撃力350%の範囲ダメージを与え、当たった敵に毒を3つためる' },
    lines: { deploy: 'うふふ、呪っちゃおっかな～', skill: 'のろのろ～、のろわれろ～！' },
  },
  shion: {
    name: 'シオン', title: '港町の水術士', rarity: 3, element: 'water', role: 'mage',
    cost: 10, hp: 580, atk: 78, def: 10, interval: 1.9, range: 2.4, splash: 0.8, redeploy: 20,
    skill: { name: '水牢', type: 'freeze', sp: 26, mult: 1.5, radius: 1.6, dur: 2,
             desc: '周囲の敵を2秒間凍結し、攻撃力150%のダメージ' },
    lines: { deploy: '潮の流れは、読めてます', skill: '閉じ込めろ、水牢！' },
  },
  garo: {
    name: 'ガロ', title: '酒場の用心棒', rarity: 3, element: 'fire', role: 'sword',
    cost: 10, hp: 1000, atk: 98, def: 40, interval: 1.0, range: 1.6, block: 1, redeploy: 20,
    passive: { name: '酔拳', type: 'evade', chance: 0.2, desc: '敵の攻撃を20%の確率でかわす' },
    lines: { deploy: 'ひっく……喧嘩なら買うぜ', skill: '燃えてきたぁ！' },
  },
};

// ---------- 育成 ----------
TD.GROWTH = {
  baseMaxLv: 20,      // 初期レベル上限
  lvPerLB: 10,        // 限界突破1回ごとのレベル上限アップ
  maxLB: 4,           // 限界突破の最大回数
  statPerLv: 0.02,    // 1レベルごとのHP/攻撃/防御の上昇率
  statPerLB: 0.05,    // 限界突破1回ごとの上昇率
  expCost: lv => 40 + lv * 15,                  // Lv → Lv+1 に必要な経験の書
  dupStones: { 3: 5, 4: 20, 5: 60 },            // 限界突破上限を超えた重複の変換量
};
TD.maxLv = lb => TD.GROWTH.baseMaxLv + TD.GROWTH.lvPerLB * lb;
// 育成状態を反映したキャラ定義を返す
TD.charStats = function (id, prog) {
  const d = TD.CHARS[id], p = prog || { lv: 1, lb: 0 }, G = TD.GROWTH;
  const m = 1 + (p.lv - 1) * G.statPerLv + p.lb * G.statPerLB;
  return Object.assign({}, d, { hp: Math.round(d.hp * m), atk: Math.round(d.atk * m), def: Math.round(d.def * m), lv: p.lv, lb: p.lb });
};

// ---------- 召喚 ----------
TD.GACHA = {
  single: 30,          // 魔晶石
  ten: 300,
  rates: { 5: 0.03, 4: 0.17, 3: 0.80 },   // 英雄の欠片の呼び寄せやすさ（欠片が尽きた★は除いて分け直す）
  starterGift: 900,    // はじめての召喚士への贈り物
  banners: [
    {
      id: 'standard', name: '英雄召喚の儀', pickup: [], desc: '大陸に散った英雄たちの魂の欠片を、召喚陣に呼び寄せる。', element: 'light',
    },
  ],
};
// ステージ報酬の経験の書（勝利時）
TD.stageExp = st => st.exp || Math.round(300 * st.hpScale);

// speed はタイル/秒
TD.ENEMIES = {
  slime:      { name: 'スライム', element: 'water', hp: 260,  atk: 45,  def: 0,   speed: 0.55, interval: 1.5, size: 11, shape: 'slime' },
  goblin:     { name: 'ゴブリン', element: 'dark',  hp: 420,  atk: 75,  def: 20,  speed: 0.6,  interval: 1.3, size: 12, shape: 'goblin' },
  wolf:       { name: '魔狼',     element: 'wind',  hp: 300,  atk: 55,  def: 5,   speed: 1.15, interval: 1.0, size: 11, shape: 'wolf' },
  salamander: { name: '火蜥蜴',   element: 'fire',  hp: 520,  atk: 95,  def: 15,  speed: 0.5,  interval: 1.6, size: 13, shape: 'lizard' },
  skeleton:   { name: '骸骨騎士', element: 'dark',  hp: 1200, atk: 140, def: 90,  speed: 0.4,  interval: 1.8, size: 14, shape: 'skeleton' },
  boss:       { name: '災厄の先触れ ヴァルグ', element: 'dark', hp: 6500, atk: 200, def: 100, speed: 0.28, interval: 2.0, size: 22, shape: 'boss', life: 5, boss: true,
                aoe: { every: 12, radius: 1.4, mult: 0.25, warn: 2.0, below: 0.5 } },
  // 遠距離攻撃をする敵：歩きながら射程内のキャラ（剣・盾以外も）を撃つ
  goblinArcher: { name: 'ゴブリン弓兵', element: 'wind', hp: 300, atk: 55, def: 5, speed: 0.55, interval: 2.0, size: 11, shape: 'goblin', ranged: 2.4 },
  darkMage:     { name: '闇の魔導兵', element: 'dark', hp: 420, atk: 80, def: 10, speed: 0.45, interval: 2.6, size: 12, shape: 'mage', ranged: 2.6 },
  // ---------- 第2章 ----------
  // ---------- 第3章 ----------
  snowWolf:    { name: '雪狼',       element: 'wind',  hp: 380,  atk: 70,  def: 10,  speed: 1.2,  interval: 1.0, size: 12, shape: 'wolf' },
  yeti:        { name: '雪男',       element: 'water', hp: 1600, atk: 160, def: 80,  speed: 0.38, interval: 1.8, size: 16, shape: 'golem' },
  wraith:      { name: '氷霊',       element: 'dark',  hp: 360,  atk: 55,  def: 0,   speed: 0.8,  interval: 1.5, size: 11, shape: 'ghost', flying: true, ranged: 1.5 },
  frostArcher: { name: '氷結の射手', element: 'water', hp: 420,  atk: 70,  def: 15,  speed: 0.5,  interval: 2.0, size: 12, shape: 'goblin', ranged: 2.6 },
  glacies:     { name: '凍嵐の災厄 グラキエス', element: 'wind', hp: 3800, atk: 170, def: 110, speed: 0.27, interval: 2.0, size: 22, shape: 'boss', life: 5, boss: true,
                 aoe: { every: 11, radius: 1.5, mult: 0.25, warn: 2.0, below: 0.7 } },
  // 毒沼のスライム：攻撃した味方を毒にする（毎秒最大HPの2%、6秒）
  bogSlime: { name: '毒沼のスライム', element: 'dark', hp: 420, atk: 50, def: 5, speed: 0.55, interval: 1.4, size: 12, shape: 'slime', poisonOnHit: { ratio: 0.02, dur: 6 } },
  // 飛行する敵：剣・盾で足止めできず、近くのキャラを攻撃しながら飛んでいく
  harpy:    { name: 'ハーピー',     element: 'wind',  hp: 280,  atk: 45,  def: 5,   speed: 0.85, interval: 1.5, size: 11, shape: 'harpy', flying: true, ranged: 1.4 },
  merman:   { name: '半魚人',       element: 'water', hp: 650,  atk: 85,  def: 30,  speed: 0.55, interval: 1.4, size: 13, shape: 'fish' },
  iceGolem: { name: '氷のゴーレム', element: 'water', hp: 2000, atk: 150, def: 130, speed: 0.33, interval: 2.0, size: 16, shape: 'golem' },
  tideMage: { name: '潮の魔導士',   element: 'water', hp: 450,  atk: 85,  def: 10,  speed: 0.45, interval: 2.6, size: 12, shape: 'mage', ranged: 2.6 },
  leviath:  { name: '氷鱗の災厄 リヴァイア', element: 'water', hp: 4300, atk: 180, def: 110, speed: 0.27, interval: 2.0, size: 22, shape: 'boss', life: 5, boss: true,
              aoe: { every: 12, radius: 1.5, mult: 0.25, warn: 2.0, below: 0.7 } },
};

// マップ記号: . 草地(遠距離職) / # 道(近接職) / S 出現地点 / G 結界(防衛地点) / x 岩・木(配置不可)
TD.STAGES = [
  {
    id: '1-1', chapter: '第1章 結界のほころび', name: '始まりの街道',
    brief: '王都へ続く街道に魔物が現れました！まずは剣士を道に、弓兵や魔導士を草地に配置してみましょう。',
    lives: 10, mana: 12, hpScale: 1, reward: 50, recLv: 1,
    map: [
      'x...S....',
      '....#..x.',
      '....#....',
      '.####....',
      '.#.......',
      '.#....x..',
      '.#####...',
      '.....#...',
      'x....#...',
      '..####...',
      '..#....x.',
      '..#......',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'slime', n: 4, gap: 2.5 },
      { t: 16, e: 'goblin', n: 3, gap: 3 },
      { t: 28, e: 'slime', n: 6, gap: 1.4 },
      { t: 40, e: 'goblin', n: 4, gap: 2 },
      { t: 44, e: 'slime', n: 4, gap: 2 },
    ],
  },
  {
    id: '1-2', chapter: '第1章 結界のほころび', name: '魔狼の森',
    brief: '森を素早い魔狼が駆け抜けてきます。風属性の魔狼には火属性が有利ですよ！',
    lives: 10, mana: 12, hpScale: 1.35, reward: 50, recLv: 1,
    map: [
      'S........',
      '#..x.....',
      '#..xx....',
      '######...',
      '.....#..x',
      '.x...#...',
      '..####...',
      '..#....x.',
      '..#####..',
      'x.....#..',
      '.x....#..',
      '......#..',
      '......G..',
    ],
    waves: [
      { t: 3, e: 'wolf', n: 4, gap: 2 },
      { t: 15, e: 'goblin', n: 3, gap: 2.5 },
      { t: 24, e: 'wolf', n: 6, gap: 1.2 },
      { t: 36, e: 'salamander', n: 2, gap: 4 },
      { t: 42, e: 'wolf', n: 8, gap: 1 },
      { t: 55, e: 'goblin', n: 4, gap: 1.5 },
    ],
  },
  {
    id: '1-3', chapter: '第1章 結界のほころび', name: '二つの門',
    brief: '敵が左右の門から同時に攻めてきます。合流地点を固めるのが勝利の鍵です！ 弓を持ったゴブリンは遠くから後衛を狙ってくるので、回復役を連れていきましょう。',
    lives: 10, mana: 14, hpScale: 1.7, reward: 50, recLv: 3,
    map: [
      'S.......S',
      '#...x...#',
      '###...###',
      '..#...#..',
      '..#####..',
      '....#....',
      '.x..#....',
      '....#..x.',
      '..###....',
      '..#......',
      '..####...',
      'x....#...',
      '.....G...',
    ],
    waves: [
      { t: 3, e: 'slime', n: 4, gap: 2, s: 0 },
      { t: 4, e: 'goblin', n: 3, gap: 2.5, s: 1 },
      { t: 18, e: 'salamander', n: 3, gap: 3, s: 0 },
      { t: 20, e: 'wolf', n: 5, gap: 1.2, s: 1 },
      { t: 28, e: 'goblinArcher', n: 3, gap: 3, s: 1 },
      { t: 35, e: 'skeleton', n: 2, gap: 5, s: 0 },
      { t: 38, e: 'goblin', n: 5, gap: 1.5, s: 1 },
      { t: 52, e: 'wolf', n: 6, gap: 1, s: 0 },
      { t: 54, e: 'salamander', n: 3, gap: 2, s: 1 },
    ],
  },
  {
    id: '1-4', chapter: '第1章 結界のほころび', name: '城門前の攻防',
    brief: '夜明け前、魔物の先遣隊が城門に迫っています。遠くから撃ってくる弓兵や魔導兵には、回復役と盾役で備えましょう！',
    lives: 10, mana: 14, hpScale: 1.8, reward: 50, recLv: 5,
    map: [
      '....S....',
      '....#....',
      '.x..#..x.',
      '.####....',
      '.#.......',
      '.#..####.',
      '.#..#..#.',
      '.####..#.',
      '.......#.',
      '.x.....#.',
      '..######.',
      '..#....x.',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'goblin', n: 4, gap: 2.2 },
      { t: 13, e: 'goblinArcher', n: 2, gap: 3 },
      { t: 22, e: 'wolf', n: 6, gap: 1.2 },
      { t: 33, e: 'salamander', n: 3, gap: 2.5 },
      { t: 40, e: 'goblinArcher', n: 2, gap: 2.5 },
      { t: 48, e: 'skeleton', n: 2, gap: 4 },
      { t: 55, e: 'darkMage', n: 1, gap: 0 },
      { t: 58, e: 'goblin', n: 5, gap: 1.5 },
    ],
  },
  {
    id: '1-5', chapter: '第1章 結界のほころび', name: '王都城門・決戦',
    brief: '七つの災厄の先触れ、ヴァルグが現れました！光属性の攻撃が有効です。HPが半分を切ると、赤い円の範囲をまとめて攻撃してきます。円が出たら撤退でかわすのも手ですよ！',
    lives: 10, mana: 16, hpScale: 1.9, reward: 80, recLv: 8,
    map: [
      '..S...S..',
      '..#...#..',
      'x.#...#..',
      '..#####..',
      '....#...x',
      '.####....',
      '.#.......',
      '.#..####.',
      '.####..#.',
      '.x.....#.',
      '..######.',
      '..#....x.',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'goblin', n: 4, gap: 2, s: 0 },
      { t: 5, e: 'slime', n: 4, gap: 2, s: 1 },
      { t: 20, e: 'skeleton', n: 2, gap: 4, s: 1 },
      { t: 22, e: 'wolf', n: 6, gap: 1, s: 0 },
      { t: 30, e: 'goblinArcher', n: 2, gap: 3, s: 1 },
      { t: 38, e: 'salamander', n: 4, gap: 2, s: 0 },
      { t: 40, e: 'skeleton', n: 2, gap: 4, s: 1 },
      { t: 58, e: 'boss', n: 1, gap: 0, s: 0 },
      { t: 62, e: 'goblin', n: 6, gap: 2, s: 1 },
      { t: 70, e: 'wolf', n: 6, gap: 1.5, s: 0 },
    ],
  },
  // ===================== 第2章 =====================
  // マップ記号 ~ は水辺（配置不可）
  {
    id: '2-1', chapter: '第2章 蒼の結界石', name: '湖畔の街道',
    brief: '湖の都アクアリアへ続く街道です。水属性の半魚人には風属性が有利ですよ！',
    lives: 10, mana: 14, hpScale: 1.9, reward: 50, recLv: 10,
    map: [
      'S........',
      '#..~~~...',
      '#..~~~...',
      '####.....',
      '...#.....',
      '.x.####..',
      '......#..',
      '~~....#..',
      '~~.####..',
      '...#.....',
      '...####..',
      '..x...#..',
      '......G..',
    ],
    waves: [
      { t: 3, e: 'slime', n: 5, gap: 1.8 },
      { t: 14, e: 'merman', n: 3, gap: 3 },
      { t: 26, e: 'wolf', n: 6, gap: 1.2 },
      { t: 32, e: 'bogSlime', n: 3, gap: 2 },
      { t: 38, e: 'merman', n: 4, gap: 2.2 },
      { t: 50, e: 'goblinArcher', n: 2, gap: 3 },
      { t: 56, e: 'slime', n: 6, gap: 1.2 },
    ],
  },
  {
    id: '2-2', chapter: '第2章 蒼の結界石', name: 'ハーピーの崖',
    brief: '空を飛ぶハーピーは、剣士や盾騎士では足止めできません！弓兵や魔導士で撃ち落としましょう。',
    lives: 10, mana: 14, hpScale: 2.0, reward: 50, recLv: 12,
    map: [
      '....S....',
      '....#..~~',
      '.####..~~',
      '.#.......',
      '.#.x.....',
      '.######..',
      '......#..',
      '.x....#..',
      '..#####..',
      '..#....~~',
      '..#.x..~~',
      '..###....',
      '....G....',
    ],
    waves: [
      { t: 3, e: 'harpy', n: 3, gap: 2.5 },
      { t: 12, e: 'merman', n: 3, gap: 2.5 },
      { t: 24, e: 'harpy', n: 5, gap: 1.6 },
      { t: 36, e: 'goblin', n: 5, gap: 1.5 },
      { t: 46, e: 'tideMage', n: 2, gap: 3 },
      { t: 54, e: 'harpy', n: 6, gap: 1.2 },
    ],
  },
  {
    id: '2-3', chapter: '第2章 蒼の結界石', name: '氷結の洞穴',
    brief: '左右から敵が来ます。硬い氷のゴーレムには、防御を下げるスキルや防御を無視する攻撃が効果的です。',
    lives: 10, mana: 15, hpScale: 2.1, reward: 50, recLv: 14,
    map: [
      'S.......S',
      '#..x.x..#',
      '#.......#',
      '###...###',
      '..#...#..',
      '..#####..',
      '....#....',
      '.~~.#.~~.',
      '.~~.#.~~.',
      '..###....',
      '..#...x..',
      '..#####..',
      '......G..',
    ],
    waves: [
      { t: 3, e: 'merman', n: 3, gap: 2.5, s: 0 },
      { t: 4, e: 'slime', n: 4, gap: 2, s: 1 },
      { t: 18, e: 'iceGolem', n: 1, gap: 0, s: 0 },
      { t: 22, e: 'harpy', n: 4, gap: 1.6, s: 1 },
      { t: 34, e: 'merman', n: 4, gap: 2, s: 1 },
      { t: 42, e: 'iceGolem', n: 1, gap: 0, s: 1 },
      { t: 48, e: 'tideMage', n: 2, gap: 3, s: 0 },
      { t: 56, e: 'wolf', n: 6, gap: 1, s: 0 },
    ],
  },
  {
    id: '2-4', chapter: '第2章 蒼の結界石', name: '水底の回廊',
    brief: '神殿へ続く長い回廊です。敵の数が多いので、マナの使い方と再配置がポイントになりますよ。',
    lives: 10, mana: 15, hpScale: 2.2, reward: 50, recLv: 16,
    map: [
      '...S.....',
      '...#..~~.',
      '.###..~~.',
      '.#.......',
      '.#.#####.',
      '.#.#...#.',
      '.###.x.#.',
      '.......#.',
      '.x######.',
      '..#......',
      '..#.~~~..',
      '..####...',
      '.....G...',
    ],
    waves: [
      { t: 3, e: 'merman', n: 4, gap: 2 },
      { t: 13, e: 'harpy', n: 4, gap: 1.5 },
      { t: 22, e: 'tideMage', n: 2, gap: 3 },
      { t: 28, e: 'iceGolem', n: 1, gap: 0 },
      { t: 34, e: 'merman', n: 5, gap: 1.6 },
      { t: 40, e: 'bogSlime', n: 4, gap: 1.5 },
      { t: 44, e: 'harpy', n: 6, gap: 1.2 },
      { t: 54, e: 'iceGolem', n: 1, gap: 0 },
      { t: 58, e: 'goblinArcher', n: 3, gap: 2 },
      { t: 64, e: 'merman', n: 5, gap: 1.4 },
    ],
  },
  {
    id: '2-5', chapter: '第2章 蒼の結界石', name: '蒼の神殿',
    brief: '七つの災厄の一柱、リヴァイアが結界石を狙っています！水属性のリヴァイアには風属性が有効です。HPが7割を切ると範囲攻撃を使ってきます。',
    lives: 10, mana: 16, hpScale: 2.2, reward: 80, recLv: 18,
    map: [
      'S...~...S',
      '#...~...#',
      '#.......#',
      '##.....##',
      '.#.....#.',
      '.###.###.',
      '...#.#...',
      '.~.#.#.~.',
      '...###...',
      '....#....',
      '.x..#..x.',
      '..###....',
      '..G......',
    ],
    waves: [
      { t: 3, e: 'merman', n: 3, gap: 2.5, s: 0 },
      { t: 5, e: 'harpy', n: 3, gap: 2, s: 1 },
      { t: 18, e: 'iceGolem', n: 1, gap: 0, s: 0 },
      { t: 22, e: 'tideMage', n: 2, gap: 3, s: 1 },
      { t: 34, e: 'merman', n: 4, gap: 1.8, s: 1 },
      { t: 48, e: 'leviath', n: 1, gap: 0, s: 0 },
      { t: 52, e: 'harpy', n: 5, gap: 1.5, s: 1 },
      { t: 62, e: 'merman', n: 4, gap: 2, s: 0 },
    ],
  },
  // ===================== 第3章 =====================
  // 防衛地点（G）が2つあるステージ。どちらに敵が届いてもライフが減る
  {
    id: '3-1', chapter: '第3章 白銀の結界石', name: '雪原の分かれ道', theme: 'snow',
    brief: '北の雪原では、守るべき拠点が2つあります！左右どちらの拠点に敵が届いてもライフが減るので、戦力を分けて守りましょう。',
    lives: 10, mana: 16, hpScale: 1.8, reward: 60, recLv: 18,
    map: [
      'S.......S',
      '#.......#',
      '###...###',
      '..#...#..',
      '..#.x.#..',
      '.##...##.',
      '.#.....#.',
      '.#..x..#.',
      '.##...##.',
      '..#...#..',
      '..#...#..',
      '..#.x.#..',
      '..G...G..',
    ],
    waves: [
      { t: 3, e: 'snowWolf', n: 3, gap: 1.5, s: 0 },
      { t: 5, e: 'snowWolf', n: 3, gap: 1.5, s: 1 },
      { t: 18, e: 'merman', n: 3, gap: 2.5, s: 0 },
      { t: 20, e: 'frostArcher', n: 2, gap: 3, s: 1 },
      { t: 34, e: 'yeti', n: 1, gap: 0, s: 1 },
      { t: 36, e: 'snowWolf', n: 4, gap: 1.2, s: 0 },
      { t: 50, e: 'goblin', n: 4, gap: 1.5, s: 0 },
      { t: 52, e: 'merman', n: 3, gap: 2, s: 1 },
    ],
  },
  {
    id: '3-2', chapter: '第3章 白銀の結界石', name: '凍てつく峡谷', theme: 'snow',
    brief: '一本道の先で、敵が左右の拠点に分かれて進みます。分かれ道の手前で食い止めるか、両方に守りを置くか……作戦次第です！',
    lives: 10, mana: 16, hpScale: 2.0, reward: 60, recLv: 19,
    map: [
      '....S....',
      '....#....',
      '.#######.',
      '.#.....#.',
      '.#..x..#.',
      '.###.###.',
      '...#.#...',
      '.x.#.#.x.',
      '...#.#...',
      '.###.###.',
      '.#.....#.',
      '.#.....#.',
      '.G.....G.',
    ],
    waves: [
      { t: 3, e: 'snowWolf', n: 4, gap: 1.4, g: 0 },
      { t: 9, e: 'snowWolf', n: 4, gap: 1.4, g: 1 },
      { t: 20, e: 'wraith', n: 3, gap: 2, g: 0 },
      { t: 26, e: 'frostArcher', n: 2, gap: 3, g: 1 },
      { t: 36, e: 'yeti', n: 1, gap: 0, g: 0 },
      { t: 40, e: 'merman', n: 4, gap: 1.6, g: 1 },
      { t: 52, e: 'wraith', n: 4, gap: 1.5, g: 1 },
      { t: 56, e: 'snowWolf', n: 5, gap: 1, g: 0 },
    ],
  },
  {
    id: '3-3', chapter: '第3章 白銀の結界石', name: '氷霊の吹雪', theme: 'snow',
    brief: '空を飛ぶ氷霊が吹雪に乗って現れます。左右から来た敵は中央で合流し、また2つの拠点へ分かれます。',
    lives: 10, mana: 16, hpScale: 2.1, reward: 60, recLv: 20,
    map: [
      'S.......S',
      '#.......#',
      '###...###',
      '..#...#..',
      '..#####..',
      '....#....',
      '.x..#..x.',
      '..#####..',
      '..#...#..',
      '..#.x.#..',
      '.##...##.',
      '.#.....#.',
      '.G.....G.',
    ],
    waves: [
      { t: 3, e: 'wraith', n: 3, gap: 1.8, s: 0, g: 1 },
      { t: 5, e: 'merman', n: 3, gap: 2.2, s: 1, g: 0 },
      { t: 18, e: 'snowWolf', n: 5, gap: 1.1, s: 0, g: 0 },
      { t: 22, e: 'frostArcher', n: 3, gap: 2.5, s: 1, g: 1 },
      { t: 34, e: 'yeti', n: 1, gap: 0, s: 0, g: 1 },
      { t: 36, e: 'wraith', n: 4, gap: 1.5, s: 1, g: 0 },
      { t: 50, e: 'iceGolem', n: 1, gap: 0, s: 1, g: 0 },
      { t: 54, e: 'snowWolf', n: 6, gap: 1, s: 0, g: 1 },
    ],
  },
  {
    id: '3-4', chapter: '第3章 白銀の結界石', name: '白銀の長城', theme: 'snow',
    brief: '長い城壁沿いの道です。終点で道が分かれ、左右の拠点を同時に狙ってきます。雪男は硬いので、防御ダウンや毒が効果的です。',
    lives: 10, mana: 17, hpScale: 2.3, reward: 60, recLv: 20,
    map: [
      '....S....',
      '....#....',
      '.####....',
      '.#.......',
      '.#.#####.',
      '.#.#...#.',
      '.###.x.#.',
      '.......#.',
      '.#######.',
      '.#.....#.',
      '.#..x..#.',
      '.#.....#.',
      '.G.....G.',
    ],
    waves: [
      { t: 3, e: 'merman', n: 4, gap: 1.8, g: 0 },
      { t: 12, e: 'snowWolf', n: 5, gap: 1.1, g: 1 },
      { t: 22, e: 'frostArcher', n: 3, gap: 2.5, g: 0 },
      { t: 30, e: 'yeti', n: 1, gap: 0, g: 1 },
      { t: 34, e: 'wraith', n: 4, gap: 1.4, g: 0 },
      { t: 46, e: 'yeti', n: 1, gap: 0, g: 0 },
      { t: 50, e: 'bogSlime', n: 4, gap: 1.5, g: 1 },
      { t: 60, e: 'snowWolf', n: 6, gap: 1, g: 0 },
      { t: 62, e: 'wraith', n: 3, gap: 1.5, g: 1 },
    ],
  },
  {
    id: '3-5', chapter: '第3章 白銀の結界石', name: '凍嵐の玉座', theme: 'snow',
    brief: '七つの災厄の一柱、グラキエスが待ち受けています！風属性のグラキエスには火属性が有効です。2つの拠点を同時に守りながら、ボスを討ちましょう。',
    lives: 10, mana: 18, hpScale: 2.3, reward: 100, recLv: 20,
    map: [
      'S.......S',
      '#.......#',
      '###...###',
      '..#...#..',
      '..#...#..',
      '..#####..',
      '....#....',
      '.x..#..x.',
      '..#####..',
      '..#...#..',
      '.##.x.##.',
      '.#.....#.',
      '.G.....G.',
    ],
    waves: [
      { t: 3, e: 'snowWolf', n: 4, gap: 1.3, s: 0, g: 0 },
      { t: 5, e: 'wraith', n: 3, gap: 1.8, s: 1, g: 1 },
      { t: 18, e: 'yeti', n: 1, gap: 0, s: 0, g: 1 },
      { t: 22, e: 'frostArcher', n: 3, gap: 2.5, s: 1, g: 0 },
      { t: 36, e: 'merman', n: 4, gap: 1.8, s: 1, g: 1 },
      { t: 50, e: 'glacies', n: 1, gap: 0, s: 0, g: 0 },
      { t: 54, e: 'wraith', n: 4, gap: 1.5, s: 1, g: 1 },
      { t: 64, e: 'snowWolf', n: 5, gap: 1.2, s: 1, g: 0 },
    ],
  },
];

// ホーム画面の精霊ルミナのセリフ
TD.NAVI_LINES = [
  'おかえりなさい、{name}さま！',
  '大結界がまた少し弱まっています……。',
  '剣士や盾騎士は「道」に、弓兵や魔導士は「草地」に配置できますよ。',
  '属性の相性は 火→風→水→火。光と闇はお互いが弱点です！',
  '発動スキルのゲージが溜まったら、キャラのカードをタップ！',
  'ひゃっ！？つ、つつかないでください～！',
  'いつか、七つの災厄をすべて退けられる日が来るはずです。',
  '撤退させるとマナが半分戻ってきます。HPが多いうちに下げれば、すぐに再配置できますよ。',
  '弓や魔法を使う敵は、後ろのキャラも狙ってきます。回復役を忘れずに！',
];

// ========== フェーズ4：ログインボーナス・ミッション・デイリー・イベント ==========

// 7日周期のログインボーナス
TD.LOGIN_BONUS = [
  { stones: 50 },
  { crystals: 500 },
  { stones: 50 },
  { crystals: 800 },
  { stones: 100 },
  { crystals: 1000 },
  { stones: 300 },
];

// デイリーミッション（毎日0時にリセット）。key は daily カウンタ名
TD.DAILY_MISSIONS = [
  { id: 'd-login',  name: 'ログインする',                 key: 'login',    goal: 1,  reward: { stones: 10 } },
  { id: 'd-win',    name: 'バトルに3回勝利する',           key: 'wins',     goal: 3,  reward: { stones: 30 } },
  { id: 'd-kill',   name: '敵を50体倒す',                  key: 'kills',    goal: 50, reward: { stones: 20 } },
  { id: 'd-skill',  name: '発動スキルを5回使う',               key: 'skills',   goal: 5,  reward: { crystals: 300 } },
  { id: 'd-lvup',   name: 'キャラをレベルアップする',       key: 'levelups', goal: 1,  reward: { crystals: 200 } },
  { id: 'd-cave',   name: '「古代の書庫」をクリアする',     key: 'caves',    goal: 1,  reward: { crystals: 300 } },
  { id: 'd-all',    name: 'デイリーミッションをすべて達成', key: '_all',     goal: 6,  reward: { stones: 50 } },
];

// 通常ミッション（一度だけ達成）。progress(save) → 現在値
TD.ACHIEVEMENTS = [
  { id: 'a-1-1',   name: '1-1「始まりの街道」をクリア',   goal: 1,  progress: s => s.cleared['1-1'] ? 1 : 0, reward: { stones: 30 } },
  { id: 'a-1-4',   name: '1-5「王都城門・決戦」をクリア', goal: 1,  progress: s => s.cleared['1-5'] ? 1 : 0, reward: { stones: 100 } },
  { id: 'a-star',  name: '第1章で★を15個集める',          goal: 15, progress: s => TD.STAGES.filter(st => st.id[0] === '1').reduce((a, st) => a + (s.cleared[st.id] || 0), 0), reward: { stones: 150 } },
  { id: 'a-2-5',   name: '2-5「蒼の神殿」をクリア',       goal: 1,  progress: s => s.cleared['2-5'] ? 1 : 0, reward: { stones: 150 } },
  { id: 'a-3-5',   name: '3-5「凍嵐の玉座」をクリア',     goal: 1,  progress: s => s.cleared['3-5'] ? 1 : 0, reward: { stones: 200 } },
  { id: 'a-star3', name: '第3章で★を15個集める',          goal: 15, progress: s => TD.STAGES.filter(st => st.id[0] === '3').reduce((a, st) => a + (s.cleared[st.id] || 0), 0), reward: { stones: 250 } },
  { id: 'a-star2', name: '第2章で★を15個集める',          goal: 15, progress: s => TD.STAGES.filter(st => st.id[0] === '2').reduce((a, st) => a + (s.cleared[st.id] || 0), 0), reward: { stones: 200 } },
  { id: 'a-own8',  name: '英雄を8人仲間にする',           goal: 8,  progress: s => s.owned.length, reward: { stones: 100 } },
  { id: 'a-own13', name: '英雄を13人仲間にする',          goal: 13, progress: s => s.owned.length, reward: { stones: 300 } },
  { id: 'a-lv20',  name: 'いずれかのキャラをLv20にする',   goal: 20, progress: s => Math.max(...Object.values(s.chars).map(c => c.lv)), reward: { stones: 50 } },
  { id: 'a-lb',    name: 'キャラを限界突破する',           goal: 1,  progress: s => Math.max(...Object.values(s.chars).map(c => c.lb)), reward: { stones: 50 } },
  { id: 'a-win30', name: 'バトルに通算30回勝利する',        goal: 30, progress: s => s.stats.wins, reward: { stones: 100 } },
  { id: 'a-kill500', name: '敵を通算500体倒す',            goal: 500, progress: s => s.stats.kills, reward: { stones: 100 } },
  { id: 'a-login7', name: '通算7日ログインする',           goal: 7,  progress: s => s.login.total, reward: { stones: 100 } },
];

// デイリークエスト（1日の挑戦回数に制限あり）
TD.DAILY_STAGES = [
  {
    id: 'D-1', type: 'daily', name: '古代の書庫', chapter: 'デイリークエスト', unlockAfter: '1-1', dailyLimit: 3,
    brief: '古の魔導書が眠る書庫です。経験の書がたくさん手に入りますよ！1日3回まで挑戦できます。',
    lives: 10, mana: 14, hpScale: 1.4, reward: 0, exp: 1500,
    map: [
      'xxxxSxxxx',
      'x...#...x',
      'x.###...x',
      'x.#.....x',
      'x.#####.x',
      'x.....#.x',
      'x.x...#.x',
      'x.#####.x',
      'x.#.....x',
      'x.###x..x',
      'x...#...x',
      'x...#...x',
      'xxxxGxxxx',
    ],
    waves: [
      { t: 3, e: 'slime', n: 6, gap: 1.5 },
      { t: 15, e: 'goblin', n: 5, gap: 1.8 },
      { t: 28, e: 'salamander', n: 3, gap: 3 },
      { t: 38, e: 'slime', n: 8, gap: 1 },
      { t: 48, e: 'skeleton', n: 2, gap: 4 },
    ],
  },
];

// 期間限定イベント
TD.ENEMIES.starbeast = { name: '星喰らいの魔獣', element: 'fire', hp: 7000, atk: 260, def: 90, speed: 0.3, interval: 1.8, size: 20, shape: 'boss', life: 3, boss: true,
  aoe: { every: 12, radius: 1.5, mult: 0.25, warn: 2.0 } };

TD.EVENT = {
  id: 'starfest',
  name: '星降る夜の魔導祭',
  start: '2026-11-15', end: '2026-12-14',   // この期間だけ遊べる（端末の日付で判定）
  currency: '星の欠片',
  element: 'dark',
  desc: '年に一度、星が降る夜に開かれる魔導祭。ところが今年は、星を喰らう魔獣が現れて……！',
  story: 'event-starfest',
  stages: [
    {
      id: 'E-1', type: 'event', name: '星降る丘', chapter: '星降る夜の魔導祭', unlockAfter: null,
      brief: '星の欠片を集めて、交換所で報酬と交換しましょう！何度でも挑戦できます。',
      lives: 10, mana: 14, hpScale: 1.5, reward: 50, exp: 500, eventPoints: 30,
      map: [
        '....S....',
        '....#..x.',
        '.x..#....',
        '..###....',
        '..#......',
        '..####...',
        '.....#...',
        '..x..#.x.',
        '.#####...',
        '.#.......',
        '.#####...',
        '.....#...',
        '.....G...',
      ],
      waves: [
        { t: 3, e: 'wolf', n: 5, gap: 1.5 },
        { t: 14, e: 'salamander', n: 3, gap: 3 },
        { t: 20, e: 'goblinArcher', n: 2, gap: 3 },
        { t: 26, e: 'goblin', n: 6, gap: 1.5 },
        { t: 38, e: 'wolf', n: 8, gap: 1 },
        { t: 50, e: 'skeleton', n: 2, gap: 4 },
      ],
    },
    {
      id: 'E-2', type: 'event', name: '魔導祭の夜【上級】', chapter: '星降る夜の魔導祭', unlockAfter: 'E-1',
      brief: '星喰らいの魔獣が現れました！火属性の魔獣には水属性が有効です。報酬の星の欠片は2倍以上！',
      lives: 10, mana: 16, hpScale: 2.0, reward: 80, exp: 900, eventPoints: 70,
      map: [
        'S.......S',
        '#.......#',
        '#..x....#',
        '####.####',
        '...#.#...',
        '...###...',
        '....#....',
        '.x..#..x.',
        '.####....',
        '.#.......',
        '.######..',
        '......#..',
        '......G..',
      ],
      waves: [
        { t: 3, e: 'salamander', n: 3, gap: 2.5, s: 0 },
        { t: 4, e: 'wolf', n: 5, gap: 1.2, s: 1 },
        { t: 20, e: 'skeleton', n: 2, gap: 4, s: 0 },
        { t: 22, e: 'goblin', n: 5, gap: 1.5, s: 1 },
        { t: 30, e: 'darkMage', n: 1, gap: 3, s: 0 },
        { t: 40, e: 'starbeast', n: 1, gap: 0, s: 0 },
        { t: 44, e: 'salamander', n: 4, gap: 2, s: 1 },
        { t: 55, e: 'wolf', n: 6, gap: 1, s: 0 },
      ],
    },
  ],
  // 交換所（limit = 期間中の交換上限）
  shop: [
    { id: 'rune',  name: '★4 ルーン（加入 or 限界突破）', char: 'rune', cost: 300, limit: 2 },
    { id: 'st100', name: '魔晶石 ×100', reward: { stones: 100 }, cost: 120, limit: 5 },
    { id: 'cr1k',  name: '経験の書 ×1000', reward: { crystals: 1000 }, cost: 40, limit: 10 },
    { id: 'st30',  name: '魔晶石 ×30', reward: { stones: 30 }, cost: 40, limit: 99 },
  ],
};

// ========== キャラの個性（特性） ==========
// キャラ定義に traits: ['fastRedeploy'] のように書くと、その特性を持つ。
TD.TRAITS = {
  fastRedeploy: { name: '高速再配置', icon: '⚡', desc: '再配置までの待ち時間が半分になる', redeployMult: 0.5 },
};

// 撤退・再配置のルール
TD.RETREAT = {
  minCooldown: 5,   // 撤退時の待ち時間の下限（秒）
  refundRate: 0.5,  // 撤退時に戻るマナの割合
};

// 特性を反映した基本の再配置時間（やられた時はこの時間）
TD.redeployTime = function (def) {
  let t = def.redeploy;
  for (const k of def.traits || []) if (TD.TRAITS[k] && TD.TRAITS[k].redeployMult) t *= TD.TRAITS[k].redeployMult;
  return t;
};
// 撤退時の待ち時間：HPが多く残っているほど短い（下限あり）
//   待ち時間 = max(下限, 基本時間 × (1 − 残りHPの割合))
TD.retreatCooldown = function (def, hpRatio) {
  const r = Math.max(0, Math.min(1, hpRatio));
  return Math.max(TD.RETREAT.minCooldown, TD.redeployTime(def) * (1 - r));
};

// ========== 副官 ==========
// 出撃メンバーの1人目は「召喚士の副官」。ステータス補正を受け、ホーム画面に表示される。
// 副官以外のメンバーは、★の合計が starCap 以下になるようにしか編成できない。
TD.ADJUTANT = { statMult: 1.2, starCap: 22 };
TD.partyStars = party => party.slice(1).reduce((a, id) => a + (TD.CHARS[id] ? TD.CHARS[id].rarity : 0), 0);
TD.partyValid = party => party.length > 0 && TD.partyStars(party) <= TD.ADJUTANT.starCap;

// ========== 状態異常：毒 ==========
// 敵の毒：1つごとに毎秒、最大HPの perStack 分のダメージ。ボスは bossMult 倍。
TD.POISON = { perStack: 0.01, maxStacks: 5, dur: 5, bossMult: 1 / 3 };
// ========== ユニークスキル（編成）：出撃メンバーにいるだけで有効・重ねがけ可 ==========
TD.partyEffects = function (party) {
  const fx = { atk: 0, def: 0, hp: 0, mana: 0, exp: 0, stones: 0 };
  for (const id of party) { const p = TD.CHARS[id] && TD.CHARS[id].partyFx; if (p) fx[p.type] += p.add; }
  return fx;
};
TD.partyEffectsText = function (party) {
  const fx = TD.partyEffects(party), a = [];
  if (fx.atk) a.push(`攻撃+${Math.round(fx.atk * 100)}%`);
  if (fx.def) a.push(`防御+${Math.round(fx.def * 100)}%`);
  if (fx.hp) a.push(`最大HP+${Math.round(fx.hp * 100)}%`);
  if (fx.mana) a.push(`開始マナ+${fx.mana}`);
  if (fx.exp) a.push(`経験の書+${Math.round(fx.exp * 100)}%`);
  if (fx.stones) a.push(`魔晶石+${Math.round(fx.stones * 100)}%`);
  for (const id of party) { const u = TD.CHARS[id] && TD.CHARS[id].unique; if (u && u.party) a.push(u.short); }
  return a.join('・');
};

// 2回目以降のクリアでもらえる魔晶石（本編ステージ）。★3でクリアすると多くもらえる
TD.REPEAT_REWARD = { base: 30, star3: 40 };

// ========== ルール確認：発動スキルと常時スキルはどちらか1つだけ ==========
for (const [id, d] of Object.entries(TD.CHARS)) {
  if (!!d.skill === !!d.passive) console.warn(`[データ] ${d.name}（${id}）は発動スキルと常時スキルのどちらか1つだけを持つ必要があります`);
}
// ユニークスキルの一覧（編成効果・特性・個別の効果）
TD.uniquesOf = function (d) {
  const a = [];
  if (d.partyFx) a.push({ name: d.partyFx.name, desc: d.partyFx.desc, note: '出撃メンバーにいるだけで有効・重ねがけ可' });
  for (const k of d.traits || []) if (TD.TRAITS[k]) a.push({ name: TD.TRAITS[k].name, icon: TD.TRAITS[k].icon, desc: TD.TRAITS[k].desc, note: '' });
  if (d.unique) a.push({ name: d.unique.name, desc: d.unique.desc, note: d.unique.party ? '出撃メンバーにいるだけで有効' : '' });
  return a;
};

// ========== テスト用の隠しコマンド ==========
// 召喚画面の召喚陣（バナー）を3秒以内に7回タップすると、テスト用メニューが開く。
// 公開時に無効にしたい場合は false にする。
TD.DEBUG_COMMANDS = true;

// ★4は「力型（power）」か「技型（tech）」のどちらか。技型はユニークスキルを持つ
for (const [id, d] of Object.entries(TD.CHARS)) {
  if (d.rarity === 4 && !['power', 'tech'].includes(d.kind)) console.warn(`[データ] ★4の${d.name}（${id}）に kind（power/tech）がありません`);
  if (d.kind === 'tech' && !d.unique && !d.partyFx) console.warn(`[データ] 技型の${d.name}（${id}）にユニークスキルがありません`);
}
TD.KIND_LABEL = { power: '力型', tech: '技型' };
