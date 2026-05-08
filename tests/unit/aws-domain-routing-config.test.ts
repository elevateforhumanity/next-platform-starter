import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('AWS domain routing config', () => {
  const configPath = path.join(process.cwd(), 'aws', 'cloudfront.json');
  it('has a cloudfront.json config file', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
    Aliases?: string[];
    Origins?: Array<{ DomainName?: string }>;
  };

  it('keeps admin domain out of the shared CloudFront alias list', () => {
    expect(config.Aliases ?? []).not.toContain('admin.elevateforhumanity.org');
  });

  it('does not hardcode raw ALB hostnames in repository-managed CloudFront config', () => {
    const originNames = (config.Origins ?? []).map((origin) => origin.DomainName ?? '');
    for (const domainName of originNames) {
      expect(domainName.includes('.elb.amazonaws.com')).toBe(false);
    }
  });
});
