import { MinHeap } from "@/queues/heap";
import { TimingWheel } from "@/queues/timingWheel";
import { HeapNode, JobPriority } from "@/types";

function makeNode(i: number): HeapNode {
  return {
    id: `job-${i}`,
    priority: [1, 2, 3][i % 3] as JobPriority,
    scheduled_at: null,
    created_at: new Date(Date.now() + i).toISOString(),
    effective_priority: [1, 2, 3][i % 3] as JobPriority,
  };
}

function benchmarkHeap(count: number): number {
  const heap = new MinHeap();
  const start = performance.now();

  for (let i = 0; i < count; i++) heap.insert(makeNode(i));
  while (heap.size > 0) heap.extractMin();

  return performance.now() - start;
}

function benchmarkTimingWheel(count: number): number {
  const wheel = new TimingWheel();
  const start = performance.now();

  for (let i = 0; i < count; i++) wheel.insert(makeNode(i), i * 10);
  for (let i = 0; i < count; i++) wheel.tick();

  return performance.now() - start;
}

const sizes = [1000, 10000, 100000];

console.log("\n=== Benchmark: Heap vs Timing Wheel ===\n");
console.log("Jobs\t\tHeap (ms)\tTimingWheel (ms)\tWinner");
console.log("----\t\t---------\t----------------\t------");

for (const size of sizes) {
  const heapMs = benchmarkHeap(size).toFixed(2);
  const wheelMs = benchmarkTimingWheel(size).toFixed(2);
  const winner = Number(heapMs) < Number(wheelMs) ? "Heap" : "TimingWheel";
  console.log(`${size}\t\t${heapMs}\t\t${wheelMs}\t\t\t${winner}`);
}

console.log("\nDone. Paste these results into docs/benchmark-results.md\n");
