import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StitchLegend } from './StitchLegend';

describe('StitchLegend', () => {
  it('shows US terms when region is US', () => {
    render(<StitchLegend region="US" />);
    expect(screen.getByText('Single crochet')).toBeInTheDocument();
    expect(screen.queryByText('Half treble')).not.toBeInTheDocument();
    expect(screen.queryByText('Triple treble')).not.toBeInTheDocument();
  });

  it('shows UK terms when region is UK', () => {
    render(<StitchLegend region="UK" />);
    expect(screen.getByText('Half treble')).toBeInTheDocument();
    expect(screen.getByText('Triple treble')).toBeInTheDocument();
    expect(screen.queryByText('Single crochet')).not.toBeInTheDocument();
  });
});
