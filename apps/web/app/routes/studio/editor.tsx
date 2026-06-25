import { EditorMount } from '../../studio/editor-mount';

/** The chart editor destination. The shell is already client-only, so this just mounts the editor. */
export default function StudioEditor() {
	return <EditorMount />;
}
