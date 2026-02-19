import { expect, describe, it } from '@jest/globals';
import * as functions from '../lib/index';

describe('Firebase Functions Exports', () => {
  it('should export checkExpiredTrials function', () => {
    expect(functions.checkExpiredTrials).toBeDefined();
    expect(typeof functions.checkExpiredTrials).toBe('object'); // Firebase function is an object
  });

  it('should NOT export deprecated marketing functions', () => {
    expect((functions as any).partnerHunter).toBeUndefined();
    expect((functions as any).partnerHunterV4).toBeUndefined();
    expect((functions as any).solarHunterV1).toBeUndefined();
    expect((functions as any).realtorHunterV1).toBeUndefined();
    expect((functions as any).testPartnerFlow).toBeUndefined();
  });

  it('should only have checkExpiredTrials as an export', () => {
    const exports = Object.keys(functions);
    expect(exports).toEqual(['checkExpiredTrials']);
  });
});
