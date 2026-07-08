import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	parseProjectFile,
	parseStoredLibrary,
	type StoredUI,
	serializeProjectFile,
	serializeStoredLibrary,
} from '../src/codec';
import { FILE_VERSION } from '../src/model';
import { sampleProject } from '../src/sample';

const UI: StoredUI = { view: 'project', projectId: null, patternId: null };

describe('storage codec', () => {
	test('library envelope round-trips to a deep-equal identity', () => {
		const projects = [sampleProject()];
		const envelope = serializeStoredLibrary(projects, {
			view: 'editor',
			projectId: projects[0]?.id ?? null,
			patternId: null,
		});
		const parsed = parseStoredLibrary(JSON.parse(JSON.stringify(envelope)));
		assert.ok(parsed);
		assert.deepEqual(
			JSON.parse(JSON.stringify(parsed.projects)),
			JSON.parse(JSON.stringify(projects)),
		);
		assert.equal(parsed.ui.view, 'editor');
		assert.equal(parsed.ui.projectId, projects[0]?.id);
	});

	test('the version gate rejects a missing or stale version', () => {
		const envelope = serializeStoredLibrary([sampleProject()], UI);
		assert.equal(parseStoredLibrary({ ...envelope, version: undefined }), null);
		assert.equal(parseStoredLibrary({ ...envelope, version: 3 }), null);
		assert.equal(
			parseStoredLibrary({ ...envelope, version: FILE_VERSION }) !== null,
			true,
		);
	});

	test('a non-object or non-array library is rejected', () => {
		assert.equal(parseStoredLibrary(null), null);
		assert.equal(parseStoredLibrary('nope'), null);
		assert.equal(
			parseStoredLibrary({ version: FILE_VERSION, library: { projects: {} } }),
			null,
		);
	});

	test('an invalid ui shape is coerced, not rejected', () => {
		const envelope = serializeStoredLibrary([], {
			view: 'editor',
			projectId: 'p1',
			patternId: 'pat1',
		});
		const parsed = parseStoredLibrary({
			...envelope,
			ui: { view: 'bogus', projectId: 42, patternId: null },
		});
		assert.ok(parsed);
		assert.equal(parsed.ui.view, 'projects'); // unknown view -> default
		assert.equal(parsed.ui.projectId, null); // non-string -> null
	});

	test('the file envelope round-trips through the codec', () => {
		const project = sampleProject();
		const file = serializeProjectFile(project);
		assert.equal(file.version, FILE_VERSION);
		const back = parseProjectFile(JSON.parse(JSON.stringify(file)));
		assert.ok(back);
		assert.deepEqual(
			JSON.parse(JSON.stringify(back)),
			JSON.parse(JSON.stringify(project)),
		);
		// pre-release strictness: a bare project (no envelope) is rejected
		assert.equal(parseProjectFile(project), null);
	});
});
