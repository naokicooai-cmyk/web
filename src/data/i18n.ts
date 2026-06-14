export type Lang = 'ja' | 'en';

interface Entry {
  ja: string;
  en: string;
}

export const STRINGS: Record<string, Entry> = {
  // ---- UI 全般 ----
  tagline: { ja: '喰って、進化して、頂点に立て。', en: 'Devour. Evolve. Dominate.' },
  play: { ja: '出撃', en: 'PLAY' },
  ranking: { ja: 'ローカルランキング', en: 'LOCAL RANKING' },
  noRecords: { ja: 'まだ記録なし。最初の捕食者になろう。', en: 'No records yet. Be the first predator.' },
  backToTitle: { ja: 'タイトルへ', en: 'Back to Title' },
  retry: { ja: 'もう一回だけ', en: 'ONE MORE RUN' },
  retryIn: { ja: '再出撃まで {n}', en: 'Redeploy in {n}' },
  levelupTitle: { ja: 'LEVEL UP — 強化を選べ', en: 'LEVEL UP — Choose your power' },
  evolutionTitle: { ja: '進化分岐 — 道を選べ', en: 'EVOLUTION — Choose your path' },
  skillLabel: { ja: 'アクティブスキル', en: 'Active Skill' },
  resultSurvived: { ja: '生存達成！', en: 'SURVIVED!' },
  resultDead: { ja: '捕食された…', en: 'DEVOURED...' },
  newRecord: { ja: '★ 新記録！', en: '★ NEW RECORD!' },
  statScore: { ja: 'スコア', en: 'Score' },
  statTime: { ja: '生存時間', en: 'Survived' },
  statKills: { ja: '撃破数', en: 'Kills' },
  statLevel: { ja: '最終レベル', en: 'Final Level' },
  statClass: { ja: '最終進化', en: 'Final Form' },
  statBest: { ja: '自己ベスト', en: 'Personal Best' },
  deathByEnemy: { ja: 'モンスターに倒された', en: 'Slain by a monster' },
  deathByFog: { ja: '喰らい霧に呑まれた', en: 'Consumed by the Hungering Fog' },
  deathByBot: { ja: '捕食者ヴォアに喰われた', en: 'Devoured by VORE the predator' },
  helpLine1: { ja: 'WASD / 矢印キー：移動（攻撃は全部オート）', en: 'WASD / Arrow keys: move (all attacks are auto)' },
  helpLine2: { ja: '右クリック / Space：アクティブスキル', en: 'Right click / Space: active skill' },
  helpLine3: { ja: '敵を倒してジェムを拾い、進化して10分間生き残れ', en: 'Kill, collect gems, evolve, survive 10 minutes' },
  hint1: { ja: '動くだけ。攻撃は全部オート。', en: 'Just move. All attacks are automatic.' },
  hint2: { ja: 'ジェムを拾ってレベルアップ → 3択から強化を選べ', en: 'Grab gems to level up, then pick 1 of 3 upgrades' },
  hint3: { ja: '10分間生き残り、ハイスコアを狙え', en: 'Survive 10 minutes and chase the high score' },
  hint4: { ja: '赤い捕食者を倒せば経験値を総取りできる', en: 'Kill the red predator to claim its XP jackpot' },
  hint5: { ja: 'ただし、大きくなるほど狙われる', en: 'But the bigger you get, the more you are hunted' },
  // ---- ドラフトカード種別 ----
  kindNewWeapon: { ja: '新武器', en: 'NEW WEAPON' },
  kindUpgrade: { ja: '武器強化', en: 'UPGRADE' },
  kindPassive: { ja: 'パッシブ', en: 'PASSIVE' },
  kindSuper: { ja: '超進化', en: 'SUPER EVOLUTION' },
  kindHeal: { ja: '回復', en: 'RECOVERY' },
  kindScore: { ja: 'ボーナス', en: 'BONUS' },
  cardHeal: { ja: 'グルメ補給', en: 'Gourmet Snack' },
  cardHealDesc: { ja: 'HPを50%回復する', en: 'Restore 50% HP' },
  cardScore: { ja: '溜め込み', en: 'Hoard' },
  cardScoreDesc: { ja: 'スコア +500', en: 'Score +500' },
  lvLabel: { ja: 'Lv', en: 'Lv' },
  // ---- ゲーム内警告 ----
  warnBoss: { ja: '⚠ マザーワーム出現', en: '⚠ MOTHER WORM APPROACHES' },
  warnColossus: { ja: '⚠⚠ ザ・コロッサス覚醒 ⚠⚠', en: '⚠⚠ THE COLOSSUS AWAKENS ⚠⚠' },
  warnFog: { ja: '喰らい霧が収縮を始めた……中央へ急げ', en: 'The Hungering Fog is closing in... head to the center' },
  warnBot: { ja: '捕食者ヴォアがこのエリアに侵入した', en: 'VORE the predator has entered the area' },
  jackpot: { ja: 'ジャックポット！！', en: 'JACKPOT!!' },
  eliteDown: { ja: 'エリート撃破！宝箱が落ちた', en: 'Elite down! It dropped a chest' },
  // ---- 武器 ----
  'weapon.orbit.name': { ja: 'オービットファング', en: 'Orbit Fang' },
  'weapon.orbit.desc': { ja: '周囲を回る刃。触れた敵を切り裂く', en: 'Blades orbit you, shredding anything they touch' },
  'weapon.spine.name': { ja: 'スパインショット', en: 'Spine Shot' },
  'weapon.spine.desc': { ja: '最寄りの敵へ自動射撃する棘', en: 'Auto-fires spines at the nearest enemy' },
  'weapon.mist.name': { ja: 'ポイズンミスト', en: 'Poison Mist' },
  'weapon.mist.desc': { ja: '移動した跡に毒霧を残す', en: 'Leaves a trail of toxic mist behind you' },
  'weapon.chain.name': { ja: 'チェインボルト', en: 'Chain Bolt' },
  'weapon.chain.desc': { ja: '敵から敵へ連鎖する雷', en: 'Lightning that chains from foe to foe' },
  'weapon.ricochet.name': { ja: 'リコシェ弾', en: 'Ricochet Round' },
  'weapon.ricochet.desc': { ja: '壁と敵で跳ね回る弾', en: 'Bullets that bounce off walls and enemies' },
  'weapon.leech.name': { ja: 'ソウルリーチ', en: 'Soul Leech' },
  'weapon.leech.desc': { ja: '与ダメージの一部をHPとして吸収', en: 'Converts part of damage dealt into HP' },
  'weapon.mine.name': { ja: '地雷卵', en: 'Mine Egg' },
  'weapon.mine.desc': { ja: '足元に設置。踏んだ敵もろとも炸裂', en: 'Lay eggs that detonate when stepped on' },
  'weapon.guillotine.name': { ja: 'ギロチンリング', en: 'Guillotine Ring' },
  'weapon.guillotine.desc': { ja: '超進化：高速回転する処刑ノコギリ', en: 'SUPER: a high-speed executioner sawblade ring' },
  'weapon.miasma.name': { ja: '瘴気領域', en: 'Miasma Field' },
  'weapon.miasma.desc': { ja: '超進化：自分中心の常時毒フィールド', en: 'SUPER: a permanent toxic field around you' },
  'weapon.railspine.name': { ja: 'レールスパイン', en: 'Rail Spine' },
  'weapon.railspine.desc': { ja: '超進化：直線上を全貫通する杭', en: 'SUPER: a stake that pierces everything in a line' },
  // ---- パッシブ ----
  'passive.pickup.name': { ja: '回収範囲アップ', en: 'Magnet Range' },
  'passive.pickup.desc': { ja: 'ジェムの吸引範囲 +30%', en: 'Gem pickup range +30%' },
  'passive.speed.name': { ja: '移動速度アップ', en: 'Swift Fins' },
  'passive.speed.desc': { ja: '移動速度 +8%', en: 'Move speed +8%' },
  'passive.cdr.name': { ja: 'CT短縮', en: 'Rapid Gland' },
  'passive.cdr.desc': { ja: '全武器の発射間隔 -8%', en: 'All weapon cooldowns -8%' },
  'passive.armor.name': { ja: '硬質化', en: 'Hardened Hide' },
  'passive.armor.desc': { ja: '被ダメージ -2', en: 'Damage taken -2' },
  'passive.maxhp.name': { ja: '最大HPアップ', en: 'Vital Mass' },
  'passive.maxhp.desc': { ja: '最大HP +25%', en: 'Max HP +25%' },
  'passive.shrink.name': { ja: '縮小化', en: 'Compact Form' },
  'passive.shrink.desc': {
    ja: 'あえて体を小さく保つ。被弾面積 -12%',
    en: 'Stay deliberately small. Hitbox -12%',
  },
  'passive.xpgain.name': { ja: '経験値アップ', en: 'XP Boost' },
  'passive.xpgain.desc': { ja: '獲得経験値 +15%', en: 'Experience gained +15%' },
  // ---- クラス ----
  'class.protoform.name': { ja: '原生体', en: 'Protoform' },
  'class.protoform.desc': { ja: 'すべての始まり。小さき喰うもの', en: 'The origin. A small thing that eats' },
  'class.devourer.name': { ja: '捕食種', en: 'Devourer' },
  'class.devourer.desc': { ja: '近接・吸収特化。触れて喰らう', en: 'Melee absorber. Touch and consume' },
  'class.artillery.name': { ja: '砲撃種', en: 'Artillery' },
  'class.artillery.desc': { ja: '遠距離特化。距離こそ正義', en: 'Long-range specialist. Distance is power' },
  'class.swarm.name': { ja: '群体種', en: 'Swarm' },
  'class.swarm.desc': { ja: 'ミニオンを従える群れの王', en: 'Commands a swarm of minions' },
  'class.charger.name': { ja: '突撃種', en: 'Charger' },
  'class.charger.desc': { ja: '体当たりが武器になる', en: 'Your body becomes the weapon' },
  'class.venom.name': { ja: '猛毒種', en: 'Venomous' },
  'class.venom.desc': { ja: '全攻撃に毒を付与し、毒オーラを纏う', en: 'Poison on all attacks, wreathed in a toxic aura' },
  'class.sniper.name': { ja: '狙撃種', en: 'Sniper' },
  'class.sniper.desc': { ja: '高威力・クリティカル特化', en: 'High damage, critical hits' },
  'class.barrage.name': { ja: '弾幕種', en: 'Barrager' },
  'class.barrage.desc': { ja: '全方位弾をばら撒き、弾数で空を埋める', en: 'Spews omnidirectional fire, filling the sky' },
  'class.splitter.name': { ja: '分裂種', en: 'Splitter' },
  'class.splitter.desc': { ja: '分体を増やし、群れで戦う', en: 'More minions, more swarm' },
  'class.parasite.name': { ja: '寄生種', en: 'Parasite' },
  'class.parasite.desc': { ja: '喰った命を自分の力にする', en: 'Feeds on every kill to heal' },
  'class.juggernaut.name': { ja: 'ジャガーノート', en: 'Juggernaut' },
  'class.juggernaut.desc': { ja: '突進で轢き潰す最終捕食形態', en: 'Crush everything in your path' },
  'class.venomlord.name': { ja: 'ヴェノムロード', en: 'Venom Lord' },
  'class.venomlord.desc': { ja: '触れた敵を腐らせる毒の王', en: 'Everything you touch rots away' },
  'class.deadeye.name': { ja: 'デッドアイ', en: 'Deadeye' },
  'class.deadeye.desc': { ja: '超射程・超火力の一撃必殺', en: 'Extreme range, lethal single shots' },
  'class.hellstorm.name': { ja: 'ヘルストーム', en: 'Hellstorm' },
  'class.hellstorm.desc': { ja: '全方位弾の嵐そのもの', en: 'A living storm of omnidirectional fire' },
  'class.legion.name': { ja: 'レギオン', en: 'Legion' },
  'class.legion.desc': { ja: '自分が小型群体に分裂する', en: 'You ARE the swarm now' },
  'class.hivequeen.name': { ja: 'ハイヴクイーン', en: 'Hive Queen' },
  'class.hivequeen.desc': { ja: '配下を率いて喰い尽くす女王', en: 'A queen who devours through her brood' },
  // ---- アクティブスキル ----
  'skill.dash.name': { ja: '緊急遊泳', en: 'Burst Swim' },
  'skill.dash.desc': { ja: '短時間だけ急加速する', en: 'A short burst of speed' },
  'skill.devour.name': { ja: '丸呑み', en: 'Devour' },
  'skill.devour.desc': { ja: '前方の敵を吸い込んで即吸収', en: 'Suck in and absorb enemies ahead' },
  'skill.aimcannon.name': { ja: '照準砲', en: 'Aim Cannon' },
  'skill.aimcannon.desc': { ja: 'カーソル方向への手動エイム貫通砲', en: 'Manual-aim piercing cannon shot' },
  'skill.swarmburst.name': { ja: '群れ放出', en: 'Swarm Burst' },
  'skill.swarmburst.desc': { ja: '追尾するミニオン弾を一斉放出', en: 'Release a volley of homing minions' },
  // ---- メタ進行：UI ----
  essence: { ja: 'エッセンス', en: 'Essence' },
  labTitle: { ja: '研究所', en: 'LAB' },
  stashTitle: { ja: '倉庫・装備', en: 'STASH' },
  back: { ja: '戻る', en: 'Back' },
  researchTitle: { ja: 'ステータス研究', en: 'Research' },
  unlockTitle: { ja: 'アンロック', en: 'Unlocks' },
  startWeaponTitle: { ja: '開始武器', en: 'Start Weapon' },
  loadoutTitle: { ja: '装備中（ロードアウト）', en: 'Loadout' },
  stashListTitle: { ja: '倉庫', en: 'Stash' },
  equip: { ja: '装備', en: 'Equip' },
  equipped: { ja: '装備中', en: 'Equipped' },
  salvage: { ja: '分解', en: 'Salvage' },
  emptySlot: { ja: '空きスロット', en: 'Empty slot' },
  clickUnequip: { ja: 'クリックで外す', en: 'Click to unequip' },
  stashEmpty: { ja: 'まだ遺物がない。ランで集めよう', en: 'No relics yet. Collect them in runs' },
  owned: { ja: '解放済み', en: 'Owned' },
  maxed: { ja: 'MAX', en: 'MAX' },
  difficulty: { ja: '難易度', en: 'Difficulty' },
  statDifficulty: { ja: '難易度', en: 'Difficulty' },
  resultEssence: { ja: '獲得エッセンス', en: 'Essence earned' },
  resultRelics: { ja: '発見した遺物', en: 'Relics found' },
  diffCleared: { ja: '★ 難易度クリア！次の難易度が解放された', en: '★ Difficulty cleared! Next tier unlocked' },
  relicFound: { ja: '{r}の遺物を発見！', en: 'Found a {r} relic!' },
  // ---- レアリティ ----
  'rarity.common': { ja: 'コモン', en: 'Common' },
  'rarity.uncommon': { ja: 'アンコモン', en: 'Uncommon' },
  'rarity.rare': { ja: 'レア', en: 'Rare' },
  'rarity.epic': { ja: 'エピック', en: 'Epic' },
  'rarity.legendary': { ja: 'レジェンダリ', en: 'Legendary' },
  // ---- 遺物のテーマ名 ----
  'relic.fang': { ja: '牙の遺物', en: 'Fang Relic' },
  'relic.scale': { ja: '鱗の遺物', en: 'Scale Relic' },
  'relic.core': { ja: '核の遺物', en: 'Core Relic' },
  'relic.tentacle': { ja: '触手の遺物', en: 'Tentacle Relic' },
  'relic.eye': { ja: '眼の遺物', en: 'Eye Relic' },
  'relic.carapace': { ja: '殻の遺物', en: 'Carapace Relic' },
  'relic.gland': { ja: '腺の遺物', en: 'Gland Relic' },
  'relic.spine': { ja: '棘の遺物', en: 'Spine Relic' },
  // ---- 難易度名 ----
  'diff.0': { ja: '普通', en: 'Normal' },
  'diff.1': { ja: '精鋭', en: 'Elite' },
  'diff.2': { ja: '悪夢', en: 'Nightmare' },
  'diff.3': { ja: '地獄', en: 'Hell' },
  'diff.4': { ja: '深淵', en: 'Abyss' },
  // ---- 研究所ノード ----
  'res.vitality.name': { ja: '生命力', en: 'Vitality' },
  'res.vitality.desc': { ja: '最大HP +8%/Lv', en: 'Max HP +8%/lv' },
  'res.ferocity.name': { ja: '凶暴性', en: 'Ferocity' },
  'res.ferocity.desc': { ja: '与ダメージ +6%/Lv', en: 'Damage +6%/lv' },
  'res.swiftness.name': { ja: '敏捷', en: 'Swiftness' },
  'res.swiftness.desc': { ja: '移動速度 +4%/Lv', en: 'Move speed +4%/lv' },
  'res.metabolism.name': { ja: '代謝', en: 'Metabolism' },
  'res.metabolism.desc': { ja: '獲得経験値 +10%/Lv', en: 'XP gain +10%/lv' },
  'res.greed.name': { ja: '貪欲', en: 'Greed' },
  'res.greed.desc': { ja: '回収範囲 +15%/Lv', en: 'Pickup range +15%/lv' },
  'res.carapace.name': { ja: '甲殻', en: 'Carapace' },
  'res.carapace.desc': { ja: '防御 +1/Lv', en: 'Armor +1/lv' },
  'res.precision.name': { ja: '精密', en: 'Precision' },
  'res.precision.desc': { ja: 'クリティカル率 +3%/Lv', en: 'Crit chance +3%/lv' },
  'res.fortune.name': { ja: '幸運', en: 'Fortune' },
  'res.fortune.desc': { ja: '獲得エッセンス +15%/Lv', en: 'Essence gain +15%/lv' },
  // ---- アンロック ----
  'unlock.slot2.name': { ja: '装備スロット2', en: 'Relic Slot 2' },
  'unlock.slot3.name': { ja: '装備スロット3', en: 'Relic Slot 3' },
  'unlock.slot4.name': { ja: '装備スロット4', en: 'Relic Slot 4' },
  'unlock.slot.desc': { ja: '遺物を装着できる枠を増やす', en: 'Add a relic loadout slot' },
  'unlock.orbit.name': { ja: '開始：オービット', en: 'Start: Orbit Fang' },
  'unlock.mist.name': { ja: '開始：ミスト', en: 'Start: Poison Mist' },
  'unlock.chain.name': { ja: '開始：チェイン', en: 'Start: Chain Bolt' },
  'unlock.ricochet.name': { ja: '開始：リコシェ', en: 'Start: Ricochet' },
  'unlock.leech.name': { ja: '開始：ソウルリーチ', en: 'Start: Soul Leech' },
  'unlock.mine.name': { ja: '開始：地雷卵', en: 'Start: Mine Egg' },
  'unlock.weapon.desc': { ja: 'この武器で開始できるようになる', en: 'Lets you start with this weapon' },
  'unlock.aberr2.name': { ja: 'Aberration枠2', en: 'Aberration Slot 2' },
  'unlock.aberr2.desc': { ja: '呪いユニークを2つ装着可能に', en: 'Equip a 2nd Aberration' },
  'unlock.socket2.name': { ja: 'ジーンソケット2', en: 'Gene Socket 2' },
  'unlock.socket2.desc': { ja: '武器1つにSkill Geneを2個まで', en: 'Up to 2 Skill Genes per weapon' },
  // ---- ハクスラ：倉庫UI ----
  aberrTitle: { ja: '装備中（Aberration）', en: 'Aberrations' },
  weaponGeneTitle: { ja: '武器の遺伝子（Skill Gene）', en: 'Weapon Genes' },
  weaponGeneHint: { ja: '下の一覧から Skill Gene を装備すると対象武器に割り当てられる', en: 'Equip a Skill Gene below to assign it to its weapon' },
  'relictype.gene': { ja: 'Gene-Mod', en: 'Gene-Mod' },
  'relictype.skill': { ja: 'Skill Gene', en: 'Skill Gene' },
  'relictype.aberration': { ja: 'Aberration', en: 'Aberration' },
  // ---- Skill Genes ----
  'gene.manyeye.name': { ja: '多眼照準', en: 'Many-Eyes' },
  'gene.manyeye.desc': { ja: 'スパインが最大HPの敵を狙う', en: 'Spine targets the highest-HP enemy' },
  'gene.scatter.name': { ja: '散弾化', en: 'Scattershot' },
  'gene.scatter.desc': { ja: 'スパインの発射数 +2', en: 'Spine fires +2 projectiles' },
  'gene.piercer.name': { ja: '貫通強化', en: 'Piercer' },
  'gene.piercer.desc': { ja: 'スパインの貫通 +3', en: 'Spine pierce +3' },
  'gene.overchain.name': { ja: '連鎖過負荷', en: 'Overchain' },
  'gene.overchain.desc': { ja: 'チェインの連鎖回数 +4', en: 'Chain bolt +4 jumps' },
  'gene.venomtip.name': { ja: '猛毒変換', en: 'Venom Tip' },
  'gene.venomtip.desc': { ja: 'リコシェに毒を付与', en: 'Ricochet inflicts poison' },
  'gene.nestmine.name': { ja: '巣化地雷', en: 'Nest Mine' },
  'gene.nestmine.desc': { ja: '地雷の撃破時に追撃爆発', en: 'Mine kills cause a bonus blast' },
  'gene.bounceplus.name': { ja: '増殖跳弾', en: 'Extra Bounce' },
  'gene.bounceplus.desc': { ja: 'リコシェの跳ね回数 +4', en: 'Ricochet +4 bounces' },
  // ---- Aberrations（呪いユニーク）----
  'aberr.gluttonHeart.name': { ja: '飽食の心臓', en: 'Gluttonous Heart' },
  'aberr.gluttonHeart.desc': { ja: 'massが増えるほど与ダメ↑／半径ペナルティ2倍', en: 'Damage scales with mass; radius penalty doubled' },
  'aberr.fastingRing.name': { ja: '断食の輪', en: 'Ring of Fasting' },
  'aberr.fastingRing.desc': { ja: '回復不可。その代わり与ダメ +60%', en: 'Cannot heal, but +60% damage' },
  'aberr.blindCrown.name': { ja: '盲目の王冠', en: 'Blind Crown' },
  'aberr.blindCrown.desc': { ja: '索敵距離2.2倍（画面外も攻撃）／移動 -10%', en: 'Attack range ×2.2 (offscreen); -10% speed' },
  'aberr.refluxStomach.name': { ja: '逆流する胃袋', en: 'Refluxing Stomach' },
  'aberr.refluxStomach.desc': { ja: 'ジェムを拾わない。丸呑みXP 5倍', en: 'No gem pickup; devour XP ×5' },
  'aberr.invertedShell.name': { ja: '反転の殻', en: 'Inverted Shell' },
  'aberr.invertedShell.desc': { ja: '被弾するたび与ダメ+8%（重複、数秒）', en: 'Each hit taken: +8% damage (stacks)' },
  'aberr.silentNest.name': { ja: '無音の巣', en: 'Silent Nest' },
  'aberr.silentNest.desc': { ja: 'ミニオン+3だが攻撃せず、定期的に毒沼を放出', en: '+3 minions but they don’t attack; periodic poison nova' },
};

let current: Lang = 'ja';

export function detectLang(): Lang {
  const saved = localStorage.getItem('evolvore.lang');
  if (saved === 'ja' || saved === 'en') return saved;
  return navigator.language?.startsWith('ja') ? 'ja' : 'en';
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem('evolvore.lang', lang);
  } catch {
    /* localStorage不可環境では保存しない */
  }
}

export function getLang(): Lang {
  return current;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const entry = STRINGS[key];
  let s = entry ? entry[current] : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
  }
  return s;
}
