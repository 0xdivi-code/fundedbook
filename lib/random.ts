/**
 * Deterministic PRNG (mulberry32).
 *
 * Used to render deterministic candlestick chart *sketches* for trade
 * screenshots from a numeric seed, so the same screenshot always looks the
 * same on server and client. Not used for any account data.
 */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
