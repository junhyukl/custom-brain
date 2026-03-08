import { extractRelationsFromText } from './relation-extract.util';

describe('extractRelationsFromText', () => {
  it('extracts "my father is Mike"', () => {
    const r = extractRelationsFromText('John', 'My father is Mike.');
    expect(r).toEqual([{ from: 'John', relation: 'FATHER', to: 'Mike' }]);
  });

  it('extracts "Mike is my brother"', () => {
    const r = extractRelationsFromText('Jane', 'Mike is my brother.');
    expect(r).toEqual([{ from: 'Jane', relation: 'BROTHER', to: 'Mike' }]);
  });

  it('returns empty when no speaker', () => {
    expect(extractRelationsFromText('', 'My father is Mike')).toEqual([]);
    expect(extractRelationsFromText('John', '')).toEqual([]);
  });

  it('deduplicates same relation', () => {
    const r = extractRelationsFromText('John', 'My father is Mike. My father is Mike.');
    expect(r).toEqual([{ from: 'John', relation: 'FATHER', to: 'Mike' }]);
  });
});
