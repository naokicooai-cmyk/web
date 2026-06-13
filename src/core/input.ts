/**
 * マウス / WASD / タッチ / Space を一元管理。
 * 移動は WASD / 矢印キー。マウスは照準（照準砲など）専用で、移動には使わない。
 * スキルは右クリック / Space。タッチはダブルタップでスキル。
 */
export class Input {
  mouseX = 0;
  mouseY = 0;
  mouseDown = false;
  private keys = new Set<string>();
  skillPressed = false; // 1フレーム消費型
  touchActive = false;
  private lastTapTime = 0;

  attach(canvas: HTMLCanvasElement): void {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        // 右クリック＝アクティブスキル
        this.mouseDown = true;
        this.skillPressed = true;
      }
    });
    window.addEventListener('mouseup', () => (this.mouseDown = false));
    // 右クリックメニューを抑制（スキル操作のため）
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        this.skillPressed = true;
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        this.touchActive = true;
        this.mouseX = t.clientX;
        this.mouseY = t.clientY;
        const now = performance.now();
        if (now - this.lastTapTime < 280) this.skillPressed = true;
        this.lastTapTime = now;
      },
      { passive: false },
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        this.mouseX = t.clientX;
        this.mouseY = t.clientY;
      },
      { passive: false },
    );
    canvas.addEventListener('touchend', () => (this.touchActive = false));
  }

  isKey(code: string): boolean {
    return this.keys.has(code);
  }

  /** WASD/矢印の方向（押されていなければ null） */
  wasdDir(): { x: number; y: number } | null {
    let x = 0;
    let y = 0;
    if (this.isKey('KeyW') || this.isKey('ArrowUp')) y -= 1;
    if (this.isKey('KeyS') || this.isKey('ArrowDown')) y += 1;
    if (this.isKey('KeyA') || this.isKey('ArrowLeft')) x -= 1;
    if (this.isKey('KeyD') || this.isKey('ArrowRight')) x += 1;
    if (x === 0 && y === 0) return null;
    const d = Math.hypot(x, y);
    return { x: x / d, y: y / d };
  }

  consumeSkill(): boolean {
    const p = this.skillPressed;
    this.skillPressed = false;
    return p;
  }
}
