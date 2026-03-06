import { toErrorMessage } from './error.util';

describe('error.util', () => {
  describe('toErrorMessage', () => {
    it('returns message for Error', () => {
      expect(toErrorMessage(new Error('fail'))).toBe('fail');
    });

    it('returns string for string', () => {
      expect(toErrorMessage('oops')).toBe('oops');
    });

    it('returns String() for other values', () => {
      expect(toErrorMessage(42)).toBe('42');
    });
  });
});
