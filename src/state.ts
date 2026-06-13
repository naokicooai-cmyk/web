import { Camera } from './core/camera';
import { Input } from './core/input';
import { Pool } from './core/pool';
import { RNG } from './core/rng';
import { SpatialHash } from './core/spatialHash';
import type {
  Bullet,
  DamageNumber,
  Enemy,
  Entity,
  Gem,
  Particle,
  PickupItem,
  PlayerState,
  BotState,
} from './types';

export const WORLD_W = 2000;
export const WORLD_H = 2000;

export type GameMode = 'title' | 'playing' | 'levelup' | 'evolution' | 'result';

export interface Announcement {
  text: string;
  ttl: number;
  maxTtl: number;
  big: boolean;
}

export interface ResultInfo {
  survived: boolean;
  causeKey: string; // i18n key（生存時は空文字）
  score: number;
  time: number;
  kills: number;
  level: number;
  classId: string;
  newRecord: boolean;
}

export interface GameState {
  mode: GameMode;
  time: number;
  rng: RNG;
  input: Input;
  camera: Camera;

  player: PlayerState;
  bot: BotState;
  enemies: Enemy[];
  minions: Enemy[]; // プレイヤー配下（敵プールを流用）
  bullets: Bullet[];
  gems: Gem[];
  pickups: PickupItem[];
  particles: Particle[];
  damageNumbers: DamageNumber[];

  enemyPool: Pool<Enemy>;
  bulletPool: Pool<Bullet>;
  gemPool: Pool<Gem>;
  particlePool: Pool<Particle>;
  pickupPool: Pool<PickupItem>;

  enemyHash: SpatialHash<Enemy>;

  // WaveDirector の内部状態
  waveTimer: number;
  eliteTimer: number;
  pickupTimer: number;
  wormSpawned: boolean;
  colossusSpawned: boolean;
  fogAnnounced: boolean;
  wormChain: Enemy[]; // マザーワームの head + 節

  fogRadius: number;
  hitStop: number;
  announcements: Announcement[];
  hintIndex: number;
  hintTimer: number;

  // レベルアップ/進化の保留キュー
  pendingDrafts: number;
  pendingEvolution: boolean;

  /** 直近の被ダメージ源（死因表示用 i18n キー） */
  lastDamageCause: string;

  result: ResultInfo | null;
}

function makeEntity(): Entity {
  return { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, radius: 0, alive: false };
}

export function makeEnemy(): Enemy {
  return {
    ...makeEntity(),
    type: 'slime',
    hp: 0,
    maxHp: 0,
    damage: 0,
    speed: 0,
    xpValue: 0,
    scoreValue: 0,
    behavior: 'chase',
    stateTimer: 0,
    state: 0,
    facing: { x: 1, y: 0 },
    flash: 0,
    poison: 0,
    poisonTtl: 0,
    segIndex: 0,
    spriteScale: 1,
    poisonAccum: 0,
    poisonNumTimer: 0,
  };
}

export function makeBullet(): Bullet {
  return {
    ...makeEntity(),
    kind: 'straight',
    fromPlayer: true,
    damage: 0,
    pierce: 0,
    ttl: 0,
    weaponId: null,
    hitTimer: 0,
    angle: 0,
    orbitDist: 0,
    bounces: 0,
    leech: 0,
    armTimer: 0,
    poison: 0,
    hitSet: null,
  };
}

export function makeGem(): Gem {
  return { ...makeEntity(), value: 0, magnet: 0, ttl: 0 };
}

export function makeParticle(): Particle {
  return {
    ...makeEntity(),
    ttl: 0,
    maxTtl: 0,
    color: '#fff',
    size: 2,
    kind: 'dot',
    toX: 0,
    toY: 0,
  };
}

export function makePickup(): PickupItem {
  return { ...makeEntity(), kind: 'heal' };
}

export function announce(state: GameState, text: string, big = false, ttl = 3): void {
  state.announcements.push({ text, ttl, maxTtl: ttl, big });
  if (state.announcements.length > 4) state.announcements.shift();
}
