/**
 * LLM 응답에서 JSON 블록을 제거하고 파싱합니다.
 * ```json ... ``` 또는 ``` ... ``` 제거 후 trim.
 */
export function parseJsonFromLlm<T = unknown>(raw: string): T {
  const trimmed = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(trimmed) as T;
}
