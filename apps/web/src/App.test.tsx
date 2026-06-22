import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { AppProviders } from './providers/AppProviders';

function renderApp() {
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

describe('App', () => {
  it('renders the hero headline and primary landmarks', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { level: 1, name: /design your stitches the way you make them/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });

  it('renders at least one Open Studio call to action and a skip link', () => {
    renderApp();
    expect(screen.getAllByRole('link', { name: /open studio/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeInTheDocument();
  });

  it('renders key content sections', () => {
    renderApp();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: /chart granny squares the way you crochet them/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: /what.s on the hook/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: /fair tools for fiber artists/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: /made for keeping projects together/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: /from idea to chart in minutes/i })).toBeInTheDocument();
    expect(within(main).getByRole('heading', { name: /good to know/i })).toBeInTheDocument();
  });
});
