import { clamp, lerp } from './vec2';

export class Camera {
  x = 0;
  y = 0;
  shakeAmp = 0;
  shakeX = 0;
  shakeY = 0;
  viewW = 0;
  viewH = 0;

  follow(tx: number, ty: number, dt: number, worldW: number, worldH: number): void {
    const t = 1 - Math.pow(0.0001, dt); // フレームレート非依存の追従
    this.x = lerp(this.x, tx, t);
    this.y = lerp(this.y, ty, t);
    const hw = this.viewW / 2;
    const hh = this.viewH / 2;
    // マップが画面より大きい場合のみ端でクランプ
    if (worldW > this.viewW) this.x = clamp(this.x, hw - 80, worldW - hw + 80);
    if (worldH > this.viewH) this.y = clamp(this.y, hh - 80, worldH - hh + 80);
  }

  shake(amount: number): void {
    this.shakeAmp = Math.max(this.shakeAmp, amount);
  }

  updateShake(dt: number): void {
    if (this.shakeAmp > 0.1) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeAmp;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeAmp;
      this.shakeAmp *= Math.pow(0.001, dt); // 急減衰
    } else {
      this.shakeAmp = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  /** ワールド座標 → スクリーン座標 */
  toScreenX(wx: number): number {
    return wx - this.x + this.viewW / 2 + this.shakeX;
  }

  toScreenY(wy: number): number {
    return wy - this.y + this.viewH / 2 + this.shakeY;
  }

  toWorldX(sx: number): number {
    return sx + this.x - this.viewW / 2;
  }

  toWorldY(sy: number): number {
    return sy + this.y - this.viewH / 2;
  }

  /** 画面外カリング判定（margin はオブジェクト半径） */
  isVisible(wx: number, wy: number, margin: number): boolean {
    const sx = wx - this.x + this.viewW / 2;
    const sy = wy - this.y + this.viewH / 2;
    return sx > -margin && sx < this.viewW + margin && sy > -margin && sy < this.viewH + margin;
  }
}
