import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { IconoirProvider } from 'iconoir-react';
import { theme } from '../theme/theme';

/**
 * Wraps the tree once with the Ant Design theme and the Iconoir icon defaults
 * (matching Studio: 18px, stroke width 1.8, inheriting the surrounding text color).
 *
 * Note: the page uses no antd message/notification/Modal APIs, so it intentionally
 * skips antd's <App> wrapper — that keeps rc-notification/rc-dialog out of the bundle.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <IconoirProvider
        iconProps={{ width: '1.25em', height: '1.25em', color: 'currentColor', strokeWidth: 1.8 }}
      >
        {children}
      </IconoirProvider>
    </ConfigProvider>
  );
}
