import { parseLimit, zeroVector } from './constants';

describe('constants', () => {
  describe('parseLimit', () => {
    it('returns fallback for undefined', () => {
      expect(parseLimit(undefined, 10)).toBe(10);
    });
    it('returns fallback for empty string', () => {
      expect(parseLimit('', 5)).toBe(5);
    });
    it('parses valid number string', () => {
      expect(parseLimit('20', 10)).toBe(20);
    });
    it('returns fallback for NaN', () => {
      expect(parseLimit('abc', 10)).toBe(10);
    });
    it('returns fallback for null', () => {
      expect(parseLimit(null as unknown as string, 7)).toBe(7);
    });
  });

  describe('zeroVector', () => {
    it('returns array of default dimension filled with 0', () => {
      const v = zeroVector();
      expect(v.length).toBe(768);
      expect(v.every((n) => n === 0)).toBe(true);
    });
    it('returns array of custom dimension', () => {
      const v = zeroVector(3);
      expect(v).toEqual([0, 0, 0]);
    });
  });
});
