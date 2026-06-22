import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted brand fonts: Space Grotesk (display) + Inter (body).
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';

import App from './App';
import { AppProviders } from './providers/AppProviders';
import '@threadwick/core/tokens.css';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
