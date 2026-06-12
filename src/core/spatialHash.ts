import type { Entity } from '../types';

/**
 * グリッド空間ハッシュ。毎フレーム clear → insert し、
 * 衝突チェックは円が重なるセル（自セル＋隣接）のみ走査する。
 * クエリ重複は entity._qid スタンプで排除。
 */
export class SpatialHash<T extends Entity> {
  private cells = new Map<number, T[]>();
  private queryId = 0;
  private result: T[] = [];

  constructor(readonly cellSize: number = 128) {}

  private key(cx: number, cy: number): number {
    // マップは正座標前提だが、念のため負値もずらして一意化
    return (cx + 2048) * 65536 + (cy + 2048);
  }

  clear(): void {
    // 配列は使い回して length=0（毎フレームの再割り当てを避ける）
    for (const arr of this.cells.values()) arr.length = 0;
  }

  insert(item: T): void {
    const cs = this.cellSize;
    const x0 = Math.floor((item.pos.x - item.radius) / cs);
    const x1 = Math.floor((item.pos.x + item.radius) / cs);
    const y0 = Math.floor((item.pos.y - item.radius) / cs);
    const y1 = Math.floor((item.pos.y + item.radius) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = this.key(cx, cy);
        let arr = this.cells.get(k);
        if (!arr) {
          arr = [];
          this.cells.set(k, arr);
        }
        arr.push(item);
      }
    }
  }

  /**
   * 円 (x, y, r) と重なる可能性のある登録済みアイテムを返す。
   * 戻り値の配列は次の query 呼び出しまで有効（内部で使い回す）。
   */
  query(x: number, y: number, r: number): T[] {
    const cs = this.cellSize;
    const qid = ++this.queryId;
    const out = this.result;
    out.length = 0;
    const x0 = Math.floor((x - r) / cs);
    const x1 = Math.floor((x + r) / cs);
    const y0 = Math.floor((y - r) / cs);
    const y1 = Math.floor((y + r) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];
          if (item._qid === qid) continue;
          item._qid = qid;
          out.push(item);
        }
      }
    }
    return out;
  }
}
