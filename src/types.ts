export interface Vec2 {
  x: number;
  y: number;
}

/** 全動的オブジェクトの基底。当たり判定は全部「円」 */
export interface Entity {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  alive: boolean;
  /** SpatialHash のクエリ重複排除用スタンプ */
  _qid?: number;
}

export type WeaponId =
  | 'orbit'
  | 'spine'
  | 'mist'
  | 'chain'
  | 'ricochet'
  | 'leech'
  | 'mine'
  | 'guillotine'
  | 'miasma'
  | 'railspine';

export type PassiveId = 'pickup' | 'speed' | 'cdr' | 'armor' | 'maxhp' | 'shrink' | 'xpgain';

export type ClassId =
  | 'protoform'
  | 'devourer'
  | 'artillery'
  | 'swarm'
  | 'charger'
  | 'venom'
  | 'sniper'
  | 'barrage'
  | 'splitter'
  | 'parasite'
  | 'juggernaut'
  | 'venomlord'
  | 'deadeye'
  | 'hellstorm'
  | 'legion'
  | 'hivequeen';

export type SkillId = 'dash' | 'devour' | 'aimcannon' | 'swarmburst';

export type EnemyTypeId =
  | 'slime'
  | 'runner'
  | 'spore'
  | 'frog'
  | 'beetle'
  | 'ameba'
  | 'ameba_small'
  | 'elite'
  | 'worm_head'
  | 'worm_body'
  | 'colossus'
  | 'minion'; // プレイヤー配下（群体種）。敵プールを流用する

export type EnemyBehavior =
  | 'chase'
  | 'dash'
  | 'shoot'
  | 'explode'
  | 'shield'
  | 'split'
  | 'worm'
  | 'colossus'
  | 'minion';

export type BulletKind = 'straight' | 'orbit' | 'zone' | 'mine' | 'enemy' | 'rail' | 'homing';

export interface WeaponInstance {
  defId: WeaponId;
  level: number; // 1〜8
  timer: number; // 次発射までの残り秒
  angle: number; // orbit系の現在角
}

export interface Bullet extends Entity {
  kind: BulletKind;
  fromPlayer: boolean;
  damage: number;
  pierce: number;
  ttl: number;
  weaponId: WeaponId | null;
  hitTimer: number; // zone/orbit のダメージ間隔
  angle: number; // orbit の位相 / straight の進行方向
  orbitDist: number;
  bounces: number;
  leech: number; // 与ダメ→回復率
  armTimer: number; // mine の起爆準備
  poison: number; // 命中時に付与する毒DPS
  hitSet: Set<Enemy> | null; // rail等：同一弾が同じ敵に二重ヒットしないための記録
}

export interface Enemy extends Entity {
  type: EnemyTypeId;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  xpValue: number;
  scoreValue: number;
  behavior: EnemyBehavior;
  stateTimer: number; // dash溜め / 射撃間隔 / 自爆カウント
  state: number; // behavior毎の内部状態
  facing: Vec2;
  flash: number; // 被弾フラッシュ残り
  poison: number; // 毒DPS
  poisonTtl: number;
  segIndex: number; // worm の節番号（headは0）
  spriteScale: number;
  poisonAccum: number; // 表示用に溜めた毒ダメージ
  poisonNumTimer: number; // 次の毒ダメージ数字までの残り
}

export interface Gem extends Entity {
  value: number;
  magnet: 0 | 1 | 2; // 0:静止 1:プレイヤーへ 2:ボットへ
  ttl: number;
}

export type PickupKind = 'heal' | 'magnet' | 'bomb' | 'chest' | 'relic';

export interface PickupItem extends Entity {
  kind: PickupKind;
  relic: Relic | null; // kind==='relic' のとき中身
}

/** ハクスラ装備（遺物）。出撃前にロードアウトへ装着して持ち込む */
export interface AffixRoll {
  id: string; // AFFIXES のキー
  value: number; // ロール済みの値
}

export interface Relic {
  uid: string; // 一意ID
  baseId: string; // 見た目（アイコン・名前テーマ）
  rarity: number; // 0:コモン 〜 4:レジェンダリ
  affixes: AffixRoll[];
}

export interface Particle extends Entity {
  ttl: number;
  maxTtl: number;
  color: string;
  size: number;
  kind: 'dot' | 'ring' | 'spark' | 'line';
  toX: number; // line用
  toY: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  ttl: number;
  crit: boolean;
  heal: boolean;
  poison: boolean;
  alive: boolean;
}

export interface PlayerState extends Entity {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpNext: number;
  mass: number; // 体格＝Agar要素。radius と speed に反映
  baseRadius: number;
  baseSpeed: number;
  pickupRange: number; // 計算済みジェム磁石半径
  weapons: WeaponInstance[];
  passives: Partial<Record<PassiveId, number>>; // id → level
  classId: ClassId;
  skillTimer: number; // アクティブスキル残りCT
  skillCooldown: number;
  dashTimer: number; // 緊急遊泳の残り
  invuln: number; // 被弾後の無敵
  hurtFlash: number;
  facing: Vec2;
  mods: StatMods;
  auraTimer: number; // ヴェノムロード毒オーラのtick
  radialTimer: number; // ヘルストーム全方位弾のtick
  score: number;
  kills: number;
  /** 研究所＋装備レリックからの永続補正（recomputeMods で毎回適用） */
  metaApplicators: ((m: StatMods) => void)[];
}

export interface BotState extends Entity {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  speed: number;
  state: 'farm' | 'hunt' | 'flee';
  targetX: number;
  targetY: number;
  thinkTimer: number;
  attackTimer: number;
  respawnTimer: number; // >0 の間は不在
  flash: number;
  spawned: boolean; // 一度でも出現したか
}

/** クラス進化やパッシブが戦闘計算に与える集約済み補正 */
export interface StatMods {
  damageMul: number;
  cooldownMul: number;
  speedMul: number;
  maxHpMul: number;
  areaMul: number;
  pickupMul: number;
  armor: number;
  shrinkMul: number; // 体格(radius)係数。縮小化で減る
  contactDamage: number; // 体当たりダメージ（突撃系）
  poisonOnHit: number; // 命中時毒DPS（猛毒系）
  critChance: number; // 狙撃系
  extraProjectiles: number; // 弾幕系
  radialShots: number; // ヘルストーム
  minionCount: number; // 群体系
  lifesteal: number; // 寄生系
  auraPoison: number; // ヴェノムロード：常時周囲毒DPS
  xpMul: number; // 経験値獲得倍率（経験値アップパッシブ）
}
