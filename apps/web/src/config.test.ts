import { describe, expect, it } from 'vitest';
import { STUDIO_IS_EXTERNAL, STUDIO_REPO_URL, STUDIO_URL } from './config';

describe('config', () => {
  it('points the Open Studio CTA at /studio by default', () => {
    expect(STUDIO_URL).toBe('/studio');
    expect(STUDIO_IS_EXTERNAL).toBe(false);
  });

  it('points the repo link at the Studio repository', () => {
    expect(STUDIO_REPO_URL).toContain('github.com/Eiluviann/threadwick');
  });
});
