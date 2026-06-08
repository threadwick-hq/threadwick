import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STUDIO_URL } from '../config';
import { OpenStudioButton } from './OpenStudioButton';

describe('OpenStudioButton', () => {
  it('renders a link to the Studio', () => {
    render(<OpenStudioButton />);
    const link = screen.getByRole('link', { name: /open studio/i });
    expect(link).toHaveAttribute('href', STUDIO_URL);
  });

  it('accepts custom label text', () => {
    render(<OpenStudioButton>Launch it</OpenStudioButton>);
    expect(screen.getByRole('link', { name: /launch it/i })).toBeInTheDocument();
  });
});
