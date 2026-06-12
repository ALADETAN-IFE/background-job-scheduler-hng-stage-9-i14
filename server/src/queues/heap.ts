import { HeapNode } from "@/types";

// Min-heap ordered by:
// 1. effective_priority (lower = higher priority)
// 2. scheduled_at (earlier = first)
// 3. created_at (earlier = first)

function compare(a: HeapNode, b: HeapNode): boolean {
  if (a.effective_priority !== b.effective_priority) {
    return a.effective_priority < b.effective_priority;
  }

  const aSched = a.scheduled_at ?? 0;
  const bSched = b.scheduled_at ?? 0;
  if (aSched !== bSched) {
    return aSched < bSched;
  }

  return a.created_at < b.created_at;
}

export class MinHeap {
  private heap: HeapNode[] = [];

  get size(): number {
    return this.heap.length;
  }

  insert(node: HeapNode): void {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin(): HeapNode | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return min;
  }

  peek(): HeapNode | null {
    return this.heap[0] ?? null;
  }

  remove(id: string): void {
    const index = this.heap.findIndex((n) => n.id === id);
    if (index === -1) return;

    if (index === this.heap.length - 1) {
      this.heap.pop();
      return;
    }

    this.heap[index] = this.heap.pop()!;
    this.bubbleUp(index);
    this.sinkDown(index);
  }

  has(id: string): boolean {
    return this.heap.some((n) => n.id === id);
  }

  toArray(): HeapNode[] {
    return [...this.heap];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (compare(this.heap[index], this.heap[parent])) {
        [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
        index = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && compare(this.heap[left], this.heap[smallest])) {
        smallest = left;
      }
      if (right < length && compare(this.heap[right], this.heap[smallest])) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

export const jobHeap = new MinHeap();
