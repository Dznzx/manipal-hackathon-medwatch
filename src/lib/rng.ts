// Small deterministic PRNG (mulberry32) so the demo data is reproducible
// across server restarts — important for rehearsing the video multiple times.

export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RandFn = () => number;

export function randRange(rand: RandFn, min: number, max: number) {
  return min + rand() * (max - min);
}

export function randInt(rand: RandFn, min: number, max: number) {
  return Math.floor(randRange(rand, min, max + 1));
}

// Gaussian noise via Box-Muller, using the seeded rand source.
export function gaussian(rand: RandFn, mean: number, stdDev: number) {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}
