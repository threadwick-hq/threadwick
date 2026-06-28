// A small status pill for a project version (Draft / Published / Outdated),
// shared by the project list and the project view.
import { Badge } from '@threadwick/core/components';
import type { VersionStatus } from '@threadwick/editor';
import { STATUS_META } from './versionStatus';

export function VersionTag({ status, className }: { status: VersionStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <Badge className={['version-tag', `version-tag--${status}`, className].filter(Boolean).join(' ')}>
      {m.label}
    </Badge>
  );
}
