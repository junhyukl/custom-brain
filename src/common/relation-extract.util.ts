/**
 * Voice 텍스트에서 가족 관계 추출 (정규식). Family Graph 자동 연결용.
 * 반환: [{ from, relation, to }]. relation은 ALLOWED_RELATIONS 화이트리스트만.
 */

const RELATION_WHITELIST = new Set([
  'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'SON', 'DAUGHTER', 'SPOUSE', 'CHILD', 'PARENT',
]);

const RULES: { pattern: RegExp; relation: string }[] = [
  { pattern: /(?:my\s+)?father\s+is\s+(\w+)/i, relation: 'FATHER' },
  { pattern: /(?:my\s+)?mother\s+is\s+(\w+)/i, relation: 'MOTHER' },
  { pattern: /(?:my\s+)?(?:older\s+)?brother\s+is\s+(\w+)/i, relation: 'BROTHER' },
  { pattern: /(?:my\s+)?(?:older\s+)?sister\s+is\s+(\w+)/i, relation: 'SISTER' },
  { pattern: /(\w+)\s+is\s+my\s+father/i, relation: 'FATHER' },
  { pattern: /(\w+)\s+is\s+my\s+mother/i, relation: 'MOTHER' },
  { pattern: /(\w+)\s+is\s+my\s+brother/i, relation: 'BROTHER' },
  { pattern: /(\w+)\s+is\s+my\s+sister/i, relation: 'SISTER' },
];

export interface ExtractedRelation {
  from: string;
  relation: string;
  to: string;
}

export function extractRelationsFromText(speaker: string, text: string): ExtractedRelation[] {
  if (!speaker?.trim() || !text?.trim()) return [];
  const fromName = speaker.trim();
  const results: ExtractedRelation[] = [];
  const seen = new Set<string>();
  for (const { pattern, relation } of RULES) {
    if (!RELATION_WHITELIST.has(relation)) continue;
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(text)) !== null) {
      const name = m[1]?.trim();
      if (!name || /^(unknown|my|is|the)$/i.test(name)) continue;
      const key = `${fromName}:${relation}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ from: fromName, relation, to: name });
    }
  }
  return results;
}
