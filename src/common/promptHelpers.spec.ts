import { buildContextQuestionPrompt } from './promptHelpers';

describe('buildContextQuestionPrompt', () => {
  it('builds prompt with context and question', () => {
    const prompt = buildContextQuestionPrompt([{ a: 1 }], 'What is a?');
    expect(prompt).toContain('Context:');
    expect(prompt).toContain('{"a":1}');
    expect(prompt).toContain('Question:');
    expect(prompt).toContain('What is a?');
  });

  it('appends suffix when provided', () => {
    const prompt = buildContextQuestionPrompt([], 'Q', {
      suffix: 'Answer briefly.',
    });
    expect(prompt).toContain('Answer briefly.');
  });
});
