// Timing Wheel — alternative scheduling algorithm
// A circular buffer of slots, each representing a 1-second tick.
// Jobs are placed in the slot corresponding to when they're due.
// On each tick, the wheel advances and processes the current slot.

import { HeapNode } from "@/types";

const WHEEL_SIZE = 3600; // 3600 slots = 1 hour resolution at 1s per tick

export class TimingWheel {
  private slots: Map<number, HeapNode[]>;
  private currentSlot: number;
  private readonly size: number;

  constructor(size = WHEEL_SIZE) {
    this.size = size;
    this.currentSlot = 0;
    this.slots = new Map();
  }

  // Insert a job into the correct slot based on delay in ms
  insert(node: HeapNode, delayMs: number): void {
    const ticks = Math.max(1, Math.ceil(delayMs / 1000));
    const slot = (this.currentSlot + ticks) % this.size;

    if (!this.slots.has(slot)) {
      this.slots.set(slot, []);
    }
    this.slots.get(slot)!.push(node);
  }

  // Advance one tick — returns jobs due in this slot
  tick(): HeapNode[] {
    this.currentSlot = (this.currentSlot + 1) % this.size;
    const due = this.slots.get(this.currentSlot) ?? [];
    this.slots.delete(this.currentSlot);
    return due;
  }

  // Insert a job due immediately
  insertNow(node: HeapNode): void {
    this.insert(node, 0);
  }

  remove(id: string): void {
    for (const [slot, nodes] of this.slots.entries()) {
      const filtered = nodes.filter((n) => n.id !== id);
      if (filtered.length !== nodes.length) {
        this.slots.set(slot, filtered);
        return;
      }
    }
  }

  get size_(): number {
    let count = 0;
    for (const nodes of this.slots.values()) count += nodes.length;
    return count;
  }
}

export const timingWheel = new TimingWheel();
