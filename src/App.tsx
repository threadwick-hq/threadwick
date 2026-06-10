import { useStore } from './useStore';
import { TopBar } from './components/TopBar';
import { ProjectsView } from './views/ProjectsView';
import { ProjectView } from './views/ProjectView';
import { EditorView } from './views/EditorView';

export function App() {
  const s = useStore();
  const { view, projectId, patternId } = s.state.ui;
  const body = view === 'editor' ? <EditorView />
    : view === 'project' ? <ProjectView />
    : <ProjectsView />;
  return (
    <div className="app">
      <TopBar>
        {/* keyed by route so navigating remounts the content (driving its enter
            transition) while the TopBar above never remounts */}
        <main className="app-view" key={`${view}:${projectId ?? ''}:${patternId ?? ''}`}>
          {body}
        </main>
      </TopBar>
    </div>
  );
}
