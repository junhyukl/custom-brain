/**
 * RAG/AskBrain 등에서 공통으로 쓰는 "컨텍스트 + 질문" 프롬프트 생성.
 */
export function buildContextQuestionPrompt(
  context: unknown,
  question: string,
  options?: { suffix?: string },
): string {
  const lines = [
    'Context:',
    typeof context === 'string' ? context : JSON.stringify(context),
    '',
    'Question:',
    question,
  ];
  if (options?.suffix) {
    lines.push('', options.suffix);
  }
  return lines.join('\n');
}
