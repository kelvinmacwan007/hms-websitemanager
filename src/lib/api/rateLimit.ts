/** Single-process abuse guard. Replace with distributed limits before production rollout. */
const requests = new Map<string, { count: number; until: number }>();
export function allowRequest(key: string, limit = 10, windowMs = 60_000, now = Date.now()) {
  for (const [entry, value] of requests) if (value.until <= now) requests.delete(entry);
  const current = requests.get(key);
  if (!current) {
    if (requests.size >= 10_000) return false;
    requests.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  return ++current.count <= limit;
}
