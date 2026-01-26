import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const isFalse = false;
    const isTrue = true;
    expect(cn('foo', isFalse && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', isTrue && 'bar', 'baz')).toBe('foo bar baz');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('handles empty strings', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('handles object syntax', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('handles array syntax', () => {
    const isFalse = false;
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['foo', isFalse && 'bar', 'baz'])).toBe('foo baz');
  });

  it('handles mixed inputs', () => {
    expect(cn('foo', { bar: true }, ['baz', 'qux'])).toBe('foo bar baz qux');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
