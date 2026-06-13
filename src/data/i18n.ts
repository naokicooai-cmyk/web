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
  'class.venom.desc': { ja: '全攻撃に毒を付与する', en: 'All attacks inflict poison' },
  'class.sniper.name': { ja: '狙撃種', en: 'Sniper' },
  'class.sniper.desc': { ja: '高威力・クリティカル特化', en: 'High damage, critical hits' },
  'class.barrage.name': { ja: '弾幕種', en: 'Barrager' },
  'class.barrage.desc': { ja: '弾数で空を埋める', en: 'Fill the sky with projectiles' },
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
