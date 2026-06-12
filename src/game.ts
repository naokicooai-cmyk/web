import { Camera } from './core/camera';
import { Input } from './core/input';
import { Pool, sweepDead } from './core/pool';
import { RNG } from './core/rng';
import { SpatialHash } from './core/spatialHash';
import { MATCH_DURATION } from './data/waves';
import { createBot } from './entities/bot';
import { updateBot } from './entities/bot';
import { updateBullets } from './entities/bullet';
import { updateEnemies, updateMinions } from './entities/enemy';
import { updateGems } from './entities/gem';
import { updatePickups } from './entities/pickup';
import { createPlayer, recomputeMods, updatePlayerMovement } from './entities/player';
import { renderHud } from './render/hud';
import { renderAmbient, renderWorld } from './render/renderer';
import { resolveCollisions } from './systems/collision';
import { updateFog } from './systems/fog';
import { applyCard, evolutionChoices, generateDraft, type DraftCard } from './systems/levelUp';
import { saveResult } from './systems/meta';
import { updateParticles, updateDamageNumbers } from './systems/particles';
import { tryActiveSkill } from './systems/skills';
import { addWeapon, updateWeapons } from './systems/weaponSystem';
import { updateWaveDirector } from './systems/waveDirector';
import { UIOverlays } from './ui/overlays';
import type { ClassId } from './types';
import {
  makeBullet,
  makeEnemy,
  makeGem,
  makeParticle,
  makePickup,
  WORLD_H,
  WORLD_W,
  type GameState,
} from './state';
import { fogRadiusAt } from './systems/fog';
import { evolveTo } from './entities/player';

const HINT_DURATION = 5.5;
const DEATH_DELAY = 1.3;

function createGameState(input: Input, camera: Camera): GameState {
  const player = createPlayer();
  recomputeMods(player);
  const state: GameState = {
    mode: 'playing',
    time: 0,
    rng: new RNG(),
    input,
    camera,
    player,
    bot: createBot(),
    enemies: [],
    minions: [],
    bullets: [],
    gems: [],
    pickups: [],
    particles: [],
    damageNumbers: [],
    enemyPool: new Pool(makeEnemy),
    bulletPool: new Pool(makeBullet),
    gemPool: new Pool(makeGem),
    particlePool: new Pool(makeParticle),
    pickupPool: new Pool(makePickup),
    enemyHash: new SpatialHash(128),
    waveTimer: 0.5,
    eliteTimer: 0,
    pickupTimer: 20,
    wormSpawned: false,
    colossusSpawned: false,
    fogAnnounced: false,
    wormChain: [],
    fogRadius: fogRadiusAt(0),
    hitStop: 0,
    announcements: [],
    hintIndex: 0,
    hintTimer: 0,
    pendingDrafts: 0,
    pendingEvolution: false,
    lastDamageCause: 'deathByEnemy',
    result: null,
  };
  return state;
}

export class Game {
  state: GameState;
  readonly input = new Input();
  readonly camera = new Camera();
  readonly ui = new UIOverlays();
  private ctx: CanvasRenderingContext2D;
  private currentDraft: DraftCard[] = [];
  private deathTimer = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.input.attach(canvas);
    this.state = createGameState(this.input, this.camera);
    this.state.mode = 'title';

    this.ui.init();
    this.ui.onPlay = () => this.startRun();
    this.ui.onRetry = () => this.startRun();
    this.ui.onToTitle = () => this.toTitle();
    this.ui.onCardPick = (i) => this.pickCard(i);
    this.ui.onEvolvePick = (id) => this.pickEvolution(id);
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.viewW = this.canvas.width;
    this.camera.viewH = this.canvas.height;
  }

  toTitle(): void {
    this.state.mode = 'title';
    this.ui.showTitle();
  }

  startRun(): void {
    this.state = createGameState(this.input, this.camera);
    // 初期武器：最寄りの敵を自動で撃つスパインショット
    addWeapon(this.state, 'spine');
    this.camera.x = this.state.player.pos.x;
    this.camera.y = this.state.player.pos.y;
    this.deathTimer = 0;
    this.input.consumeSkill();
    this.ui.hideAll();
    this.state.mode = 'playing';
  }

  update(dt: number): void {
    const s = this.state;
    if (s.mode !== 'playing') return;

    // ヒットストップ：世界を一瞬止める（演出だけ進む）
    if (s.hitStop > 0) {
      s.hitStop -= dt;
      updateParticles(s, dt);
      this.camera.updateShake(dt);
      return;
    }

    const p = s.player;

    // 死亡演出 → リザルト
    if (!p.alive) {
      this.deathTimer += dt;
      updateParticles(s, dt);
      updateDamageNumbers(s, dt);
      this.camera.updateShake(dt);
      if (this.deathTimer >= DEATH_DELAY) this.endRun(false);
      return;
    }

    s.time += dt;

    // チュートリアルヒント
    if (s.hintIndex < 5) {
      s.hintTimer += dt;
      if (s.hintTimer >= HINT_DURATION) {
        s.hintIndex++;
        s.hintTimer = 0;
      }
    }
    // アナウンス減衰
    for (const a of s.announcements) a.ttl -= dt;
    s.announcements = s.announcements.filter((a) => a.ttl > 0);

    // ---- update順：入力→移動→武器→弾→敵→衝突→ジェム→湧き→霧→演出→カメラ ----
    if (this.input.consumeSkill()) tryActiveSkill(s);
    updatePlayerMovement(s, dt);
    updateMinions(s, dt);
    updateWeapons(s, dt);
    updateBullets(s, dt);
    updateEnemies(s, dt);
    resolveCollisions(s, dt);
    updateGems(s, dt);
    updatePickups(s, dt);
    updateWaveDirector(s, dt);
    updateFog(s, dt);
    updateBot(s, dt);
    updateParticles(s, dt);
    updateDamageNumbers(s, dt);
    this.camera.follow(p.pos.x, p.pos.y, dt, WORLD_W, WORLD_H);
    this.camera.updateShake(dt);

    // ---- プール返却 ----
    sweepDead(s.bullets, s.bulletPool);
    sweepDead(s.gems, s.gemPool);
    sweepDead(s.particles, s.particlePool);
    sweepDead(s.pickups, s.pickupPool);
    sweepDead(s.enemies, s.enemyPool);
    sweepDead(s.minions, s.enemyPool);
    // 解放済みオブジェクトの再利用事故を防ぐため、死んだ節はチェーンから外す
    s.wormChain = s.wormChain.filter(
      (e) => e.alive && (e.type === 'worm_head' || e.type === 'worm_body'),
    );

    // ---- 終了判定とモーダル ----
    if (s.time >= MATCH_DURATION) {
      p.score += 2000 + Math.round((p.hp / p.maxHp) * 500); // 生存ボーナス
      this.endRun(true);
      return;
    }
    if (s.pendingEvolution) {
      s.pendingEvolution = false;
      s.mode = 'evolution';
      this.ui.showEvolution(evolutionChoices(s));
      return;
    }
    if (s.pendingDrafts > 0) {
      s.pendingDrafts--;
      s.mode = 'levelup';
      this.currentDraft = generateDraft(s);
      this.ui.showLevelUp(this.currentDraft);
    }
  }

  private pickCard(index: number): void {
    const s = this.state;
    if (s.mode !== 'levelup' || !this.currentDraft[index]) return;
    applyCard(s, this.currentDraft[index]);
    this.ui.hideAll();
    if (s.pendingEvolution) {
      s.pendingEvolution = false;
      s.mode = 'evolution';
      this.ui.showEvolution(evolutionChoices(s));
    } else if (s.pendingDrafts > 0) {
      s.pendingDrafts--;
      this.currentDraft = generateDraft(s);
      this.ui.showLevelUp(this.currentDraft);
    } else {
      s.mode = 'playing';
      this.input.consumeSkill();
    }
  }

  private pickEvolution(id: ClassId): void {
    const s = this.state;
    if (s.mode !== 'evolution') return;
    evolveTo(s, id);
    this.ui.hideAll();
    if (s.pendingDrafts > 0) {
      s.pendingDrafts--;
      s.mode = 'levelup';
      this.currentDraft = generateDraft(s);
      this.ui.showLevelUp(this.currentDraft);
    } else {
      s.mode = 'playing';
      this.input.consumeSkill();
    }
  }

  private endRun(survived: boolean): void {
    const s = this.state;
    const p = s.player;
    const saved = saveResult({
      score: p.score,
      time: Math.min(MATCH_DURATION, s.time),
      kills: p.kills,
      level: p.level,
      classId: p.classId,
      date: new Date().toISOString().slice(0, 10),
    });
    s.result = {
      survived,
      causeKey: survived ? '' : s.lastDamageCause,
      score: p.score,
      time: Math.min(MATCH_DURATION, s.time),
      kills: p.kills,
      level: p.level,
      classId: p.classId,
      newRecord: saved.newRecord,
    };
    s.mode = 'result';
    this.ui.showResult(s.result);
  }

  render(): void {
    const s = this.state;
    if (s.mode === 'title') {
      // タイトル：ネビュラの中をゆっくり漂うアンビエント背景
      const t = performance.now() / 1000;
      s.time = t * 0.5;
      this.camera.x = WORLD_W / 2 + Math.sin(t * 0.07) * 420;
      this.camera.y = WORLD_H / 2 + Math.cos(t * 0.05) * 320;
      renderAmbient(s, this.ctx);
      return;
    }
    renderWorld(s, this.ctx);
    if (s.mode !== 'result') renderHud(s, this.ctx);
  }
}
