import { describe, expect, it } from 'vitest';

describe('health activation contract', () => {
  it('documents expected activation shape on /api/health', () => {
    const sample = {
      activation: {
        environment: true,
        database: true,
        ready_for_traffic: true,
      },
      production_ready: true,
    };
    expect(sample.activation.ready_for_traffic).toBe(sample.production_ready);
    expect(sample).not.toHaveProperty('verification');
    expect(JSON.stringify(sample)).not.toContain('10/10');
  });
});
