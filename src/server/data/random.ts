export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickOne<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

export function pickMany<T>(
  items: readonly T[],
  random: () => number,
  min: number,
  max: number
): T[] {
  const desired = min + Math.floor(random() * (max - min + 1));
  const pool = [...items];
  const picked: T[] = [];

  while (picked.length < desired && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const [item] = pool.splice(index, 1);
    picked.push(item as T);
  }

  return picked;
}

export function weightedPick<T>(
  items: readonly { value: T; weight: number }[],
  random: () => number
): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;

  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}
