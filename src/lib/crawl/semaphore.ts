/**
 * Simple counting semaphore for limiting concurrent async operations.
 */
export class Semaphore {
  private queue: Array<() => void> = [];
  private current = 0;

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      // Transfer the slot directly to the next waiter (no gap in count)
      next();
    } else if (this.current > 0) {
      // Floor at 0: an unbalanced release (e.g. release called more often than
      // acquire) must never drive the counter negative, which would permanently
      // let the semaphore over-admit beyond `max`.
      this.current--;
    }
  }
}
