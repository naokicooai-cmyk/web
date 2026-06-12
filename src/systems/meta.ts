/** ローカルランキング（localStorage）。強さではなく記録だけを永続化する */
export interface RankEntry {
  score: number;
  time: number;
  kills: number;
  level: number;
  classId: string;
  date: string;
}

const KEY = 'evolvore.ranking.v1';
const MAX_ENTRIES = 10;

export function loadRanking(): RankEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as RankEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 結果を保存し、{rank（0始まり、圏外は-1）, newRecord} を返す */
export function saveResult(entry: RankEntry): { rank: number; newRecord: boolean } {
  const list = loadRanking();
  const prevBest = list.length > 0 ? list[0].score : 0;
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const trimmed = list.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* 保存できない環境では無視 */
  }
  const rank = trimmed.indexOf(entry);
  return { rank, newRecord: entry.score > prevBest };
}

export function bestScore(): number {
  const list = loadRanking();
  return list.length > 0 ? list[0].score : 0;
}
