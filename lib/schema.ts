export type ColType =
  | 'datetime'
  | 'category'
  | 'status'
  | 'boolean'
  | 'numeric'
  | 'email'
  | 'url'
  | 'longtext'
  | 'freetext';

export interface ColSchema {
  key: string;
  index: number;
  type: ColType;
  uniqueCount: number;
  totalCount: number;
  assumption?: string;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const URL_RE = /^https?:\/\/.+/i;

const BOOL_CANDIDATES: Set<string>[] = [
  new Set(['true', 'false']),
  new Set(['yes', 'no']),
  new Set(['y', 'n']),
  new Set(['1', '0']),
  new Set(['on', 'off']),
  new Set(['o', 'x']),
  new Set(['있음', '없음']),
  new Set(['완료', '미완료']),
  new Set(['예', '아니오']),
  new Set(['확인', '미확인']),
  new Set(['done', 'pending']),
  new Set(['active', 'inactive']),
  new Set(['pass', 'fail']),
];

function nonEmpty(values: string[]): string[] {
  return values.filter(v => v.trim() !== '');
}

function fractionMatch(values: string[], pred: (v: string) => boolean): number {
  const ne = nonEmpty(values);
  if (ne.length === 0) return 0;
  return ne.filter(pred).length / ne.length;
}

function isDateString(v: string): boolean {
  if (v.length < 4) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

export function inferColumnType(values: string[]): { type: ColType; assumption?: string } {
  const ne = nonEmpty(values);
  if (ne.length === 0) return { type: 'freetext', assumption: 'all empty' };

  const lower = ne.map(v => v.toLowerCase().trim());
  const uniq = new Set(lower);

  if (fractionMatch(ne, v => EMAIL_RE.test(v)) >= 0.7) return { type: 'email' };
  if (fractionMatch(ne, v => URL_RE.test(v)) >= 0.7) return { type: 'url' };

  if (uniq.size <= 3) {
    for (const boolSet of BOOL_CANDIDATES) {
      if ([...uniq].every(v => boolSet.has(v))) return { type: 'boolean' };
    }
  }

  if (fractionMatch(ne, isDateString) >= 0.7) return { type: 'datetime' };

  if (fractionMatch(ne, v => !isNaN(parseFloat(v)) && isFinite(Number(v))) >= 0.7) {
    return { type: 'numeric' };
  }

  const avgLen = ne.reduce((s, v) => s + v.length, 0) / ne.length;
  if (avgLen > 100) return { type: 'longtext' };

  const uniqueRatio = uniq.size / ne.length;
  if (uniq.size <= 5) return { type: 'status' };
  if (uniq.size <= 25 && uniqueRatio <= 0.35) return { type: 'category' };

  if (avgLen > 40) {
    return { type: 'freetext', assumption: 'high cardinality text' };
  }

  return { type: 'freetext' };
}

export function inferSchema(headers: string[], rows: string[][]): ColSchema[] {
  return headers.map((key, index) => {
    const values = rows.map(r => r[index] ?? '');
    const { type, assumption } = inferColumnType(values);
    const ne = nonEmpty(values);
    const uniq = new Set(ne.map(v => v.toLowerCase().trim()));
    return {
      key,
      index,
      type,
      uniqueCount: uniq.size,
      totalCount: ne.length,
      ...(assumption ? { assumption } : {}),
    };
  });
}
