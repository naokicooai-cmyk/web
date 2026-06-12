import { describe, expect, it } from 'vitest';
import { Pool, sweepDead } from '../core/pool';
import { RNG } from '../core/rng';
import { SpatialHash } from '../core/spatialHash';
import { circlesHit, clamp, dirTo, distSq } from '../core/vec2';
import type { Entity } from '../types';

function ent(x: number, y: number, r: number): Entity {
  return { pos: { x, y }, vel: { x: 0, y: 0 }, radius: r, alive: true };
}

describe('vec2', () => {
  it('distSq は平方根を取らない距離の二乗', () => {
    expect(distSq(0, 0, 3, 4)).toBe(25);
  });

  it('circlesHit は半径の和より近いときだけ true', () => {
    expect(circlesHit({ x: 0, y: 0 }, 5, { x: 9, y: 0 }, 5)).toBe(true);
    expect(circlesHit({ x: 0, y: 0 }, 5, { x: 10, y: 0 }, 5)).toBe(false);
    expect(circlesHit({ x: 0, y: 0 }, 5, { x: 11, y: 0 }, 5)).toBe(false);
  });

  it('dirTo は単位ベクトル、ゼロ距離は (0,0)', () => {
    const out = { x: 9, y: 9 };
    dirTo(out, 0, 0, 10, 0);
    expect(out).toEqual({ x: 1, y: 0 });
    dirTo(out, 5, 5, 5, 5);
    expect(out).toEqual({ x: 0, y: 0 });
  });

  it('clamp', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});

describe('RNG', () => {
  it('同じシードなら同じ系列', () => {
    const a = new RNG(42);
    const b = new RNG(42);
    for (let i = 0; i < 10; i++) expect(a.next()).toBe(b.next());
  });

  it('next は [0, 1)', () => {
    const r = new RNG(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int は両端を含む', () => {
    const r = new RNG(1);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) seen.add(r.int(0, 2));
    expect(seen).toEqual(new Set([0, 1, 2]));
  });
});

describe('Pool', () => {
  it('release したオブジェクトを再利用する（new を増やさない）', () => {
    const pool = new Pool(() => ({ alive: false }));
    const a = pool.obtain();
    pool.release(a);
    const b = pool.obtain();
    expect(b).toBe(a);
    expect(pool.created).toBe(1);
  });

  it('sweepDead は死んだ要素をプールへ戻す', () => {
    const pool = new Pool(() => ({ alive: false }));
    const list = [{ alive: true }, { alive: false }, { alive: true }, { alive: false }];
    sweepDead(list, pool);
    expect(list).toHaveLength(2);
    expect(list.every((x) => x.alive)).toBe(true);
    expect(pool.freeCount).toBe(2);
  });
});

describe('SpatialHash', () => {
  it('近傍のエンティティだけを返す', () => {
    const hash = new SpatialHash<Entity>(128);
    const near = ent(100, 100, 10);
    const far = ent(1500, 1500, 10);
    hash.insert(near);
    hash.insert(far);
    const found = hash.query(110, 110, 50);
    expect(found).toContain(near);
    expect(found).not.toContain(far);
  });

  it('セル境界をまたぐ大きいエンティティも漏れない', () => {
    const hash = new SpatialHash<Entity>(128);
    const big = ent(128, 128, 100); // 4セルにまたがる
    hash.insert(big);
    expect(hash.query(20, 20, 10)).toContain(big);
    expect(hash.query(220, 220, 10)).toContain(big);
  });

  it('複数セル登録でもクエリ結果は重複しない', () => {
    const hash = new SpatialHash<Entity>(128);
    const big = ent(128, 128, 100);
    hash.insert(big);
    const found = hash.query(128, 128, 200);
    expect(found.filter((e) => e === big)).toHaveLength(1);
  });

  it('clear 後は何も返さない', () => {
    const hash = new SpatialHash<Entity>(128);
    hash.insert(ent(50, 50, 10));
    hash.clear();
    expect(hash.query(50, 50, 100)).toHaveLength(0);
  });
});
