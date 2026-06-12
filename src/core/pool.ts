/**
 * オブジェクトプール。毎フレームの new をゼロに近づけて GC スパイクを防ぐ。
 * 生存リストは呼び出し側が持ち、死んだものを release で返す。
 */
export class Pool<T> {
  private free: T[] = [];
  created = 0;

  constructor(private factory: () => T) {}

  obtain(): T {
    const item = this.free.pop();
    if (item !== undefined) return item;
    this.created++;
    return this.factory();
  }

  release(item: T): void {
    this.free.push(item);
  }

  get freeCount(): number {
    return this.free.length;
  }
}

/**
 * alive=false の要素を配列から取り除き、プールへ返す（順序非保持の高速swap削除）。
 */
export function sweepDead<T extends { alive: boolean }>(list: T[], pool: Pool<T>): void {
  for (let i = list.length - 1; i >= 0; i--) {
    if (!list[i].alive) {
      const dead = list[i];
      list[i] = list[list.length - 1];
      list.pop();
      pool.release(dead);
    }
  }
}
