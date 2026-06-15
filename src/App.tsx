import { useState } from 'react';
import { useStore } from './useStore';
import { TopBar } from './components/TopBar';
import { ProjectsView } from './views/ProjectsView';
import { ProjectView } from './views/ProjectView';
import { EditorView } from './views/EditorView';

// Depth in the hierarchy: projects (0) -> a project (1) -> a pattern (2). The
// view transition mirrors this: going deeper "digs down", going back "digs
// out", and a sideways move (e.g. project -> project) gets a neutral fade.
const DEPTH = { projects: 0, project: 1, editor: 2 } as const;

export function App() {
  const s = useStore();
  const { view, projectId, patternId } = s.state.ui;
  const body = view === 'editor' ? <EditorView />
    : view === 'project' ? <ProjectView />
    : <ProjectsView />;

  // Pick the transition direction by comparing the new depth to the previous
  // one, using React's "adjust state during render" pattern so the direction is
  // ready the moment the keyed content remounts. `dir` stays stable across
  // unrelated re-renders, so the enter animation isn't restarted mid-flight.
  const key = `${view}:${projectId ?? ''}:${patternId ?? ''}`;
  const [prev, setPrev] = useState<{ key: string; depth: number; dir: 'down' | 'out' | 'flat' }>(
    { key, depth: DEPTH[view], dir: 'flat' },
  );
  let dir = prev.dir;
  if (prev.key !== key) {
    const depth = DEPTH[view];
    dir = depth > prev.depth ? 'down' : depth < prev.depth ? 'out' : 'flat';
    setPrev({ key, depth, dir });
  }

  return (
    <div className="app">
      <TopBar>
        {/* keyed by route so navigating remounts the content (driving its enter
            transition) while the TopBar above never remounts; the direction
            class makes deeper/back/sideways moves feel like the structure */}
        <main className={'app-view ' + dir} key={key}>
          {body}
        </main>
      </TopBar>
    </div>
  );
}
