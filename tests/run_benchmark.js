import { runBenchmark } from './benchmark_homing.js';

console.log("Starting Benchmark Runner...");
try {
    runBenchmark();
} catch (e) {
    console.error("Benchmark failed:", e);
}
